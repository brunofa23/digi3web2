import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import DriveDeletionBatch from 'App/Models/DriveDeletionBatch'
import DriveDeletionItem from 'App/Models/DriveDeletionItem'
import Bookrecord from 'App/Models/Bookrecord'
import Indeximage from 'App/Models/Indeximage'
import { sendDeleteFile } from 'App/Services/googleDrive/googledrive'

export default class DriveDeletionQueueService {
  public static async processPending(limit = 20, batchId: number | null = null) {
    const now = DateTime.now()
    const staleBefore = now.minus({ minutes: 30 }).toJSDate()

    await Database.from('drive_deletion_batches')
      .where('status', 'processing')
      .where('updated_at', '<', staleBefore)
      .update({ status: 'pending', updated_at: now.toJSDate() })

    const batchesQuery = DriveDeletionBatch.query()
      .whereIn('status', ['pending', 'processing', 'failed'])
      .where((query) => {
        query.where('status', '!=', 'failed')
          .orWhere((retryQuery) => retryQuery.where('status', 'failed').where('failed_items', '<', 5))
      })
      .orderBy('id', 'asc')

    if (batchId !== null) batchesQuery.where('id', batchId)

    const batches = await batchesQuery.limit(limit)

    const result = { batches: 0, processed: 0, failed: 0 }

    for (const batch of batches) {
      const claimed = await Database.from('drive_deletion_batches')
        .where('id', batch.id)
        .whereIn('status', ['pending', 'failed'])
        .update({
          status: 'processing',
          started_at: batch.startedAt || DateTime.now().toJSDate(),
          updated_at: DateTime.now().toJSDate(),
        })

      if (!claimed) continue
      result.batches++

      const items = await DriveDeletionItem.query()
        .where('batch_id', batch.id)
        .whereIn('status', ['pending', 'error'])
        .where('attempts', '<', 5)
        .orderBy('id', 'asc')

      for (const item of items) {
        await this.processItem(item)
        result.processed++
      }

      const pending = await DriveDeletionItem.query()
        .where('batch_id', batch.id)
        .whereIn('status', ['pending', 'error', 'processing'])
        .count('* as total')
      const failed = await DriveDeletionItem.query()
        .where('batch_id', batch.id)
        .where('status', 'error')
        .count('* as total')

      const pendingCount = Number(pending[0].$extras.total || 0)
      const failedCount = Number(failed[0].$extras.total || 0)

      await batch.refresh()
      batch.processedItems = await this.countItems(batch.id, 'completed')
      batch.failedItems = failedCount
      batch.lastError = failedCount ? (await this.lastItemError(batch.id)) : null

      if (pendingCount === 0 && failedCount === 0) {
        if (batch.action === 'records_images') {
          await Bookrecord.query()
            .where('companies_id', batch.companiesId)
            .where('typebooks_id', batch.typebooksId)
            .where('book', batch.book)
            .whereBetween('cod', [batch.startCod, batch.endCod])
            .delete()
        }
        batch.status = 'completed'
        batch.finishedAt = DateTime.now()
      } else {
        batch.status = failedCount >= 5 ? 'failed' : 'pending'
        result.failed += failedCount
      }

      await batch.save()
    }

    return result
  }

  private static async processItem(item: DriveDeletionItem) {
    item.status = 'processing'
    item.attempts += 1
    await item.save()

    try {
      if (!item.driveFileId) {
        throw new Error('Imagem sem drive_file_id; exclusão física exige conferência manual')
      }

      const references = await Indeximage.query()
        .where('companies_id', item.companiesId)
        .where('drive_file_id', item.driveFileId)
        .count('* as total')

      if (Number(references[0].$extras.total || 0) <= 1) {
        try {
          const company = await Database.from('companies').where('id', item.companiesId).first()
          if (!company?.cloud) throw new Error('Empresa sem configuração de cloud')
          await sendDeleteFile(item.driveFileId, company.cloud)
        } catch (error) {
          if (!this.isNotFound(error)) throw error
        }
      }

      await Indeximage.query()
        .where('companies_id', item.companiesId)
        .where('typebooks_id', item.typebooksId)
        .where('bookrecords_id', item.bookrecordsId)
        .where('seq', item.seq)
        .delete()

      item.status = 'completed'
      item.processedAt = DateTime.now()
      item.lastError = null
    } catch (error) {
      item.status = 'error'
      item.lastError = String(error?.message || error)
    }

    await item.save()
  }

  private static async countItems(batchId: number, status: string) {
    const result = await DriveDeletionItem.query()
      .where('batch_id', batchId)
      .where('status', status)
      .count('* as total')
    return Number(result[0].$extras.total || 0)
  }

  private static async lastItemError(batchId: number) {
    const item = await DriveDeletionItem.query()
      .where('batch_id', batchId)
      .where('status', 'error')
      .orderBy('updated_at', 'desc')
      .first()
    return item?.lastError || null
  }

  private static isNotFound(error: any) {
    return Number(error?.code || error?.response?.status) === 404
  }
}
