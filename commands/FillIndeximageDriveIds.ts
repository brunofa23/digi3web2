import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import Indeximage from 'App/Models/Indeximage'
import Typebook from 'App/Models/Typebook'
import { sendSearchFile } from 'App/Services/googleDrive/googledrive'

export default class FillIndeximageDriveIds extends BaseCommand {
  public static commandName = 'indeximages:fill-drive-ids'
  public static description = 'Preenche drive_file_id de indeximages antigas em lotes pequenos'

  public static settings = {
    loadApp: true,
  }

  @flags.number({ description: 'ID do typebook que será processado' })
  public typebook: number

  @flags.number({ description: 'Quantidade máxima de imagens para processar' })
  public limit: number = 20

  @flags.boolean({ description: 'Apenas simula a busca, sem atualizar o banco' })
  public dryRun: boolean = false

  public async run() {
    const typebooksId = Number(this.typebook)
    const limit = Number(this.limit || 20)

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      this.logger.error('Informe um typebook válido. Exemplo: --typebook=236')
      return
    }

    if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
      this.logger.error('Informe um limite entre 1 e 200. Exemplo: --limit=20')
      return
    }

    const typebook = await Typebook
      .query()
      .preload('company')
      .where('id', typebooksId)
      .first()

    if (!typebook) {
      this.logger.error(`Typebook ${typebooksId} não encontrado.`)
      return
    }

    if (!typebook.path || !typebook.company?.cloud) {
      this.logger.error('Typebook sem pasta ou empresa sem cloud configurada.')
      return
    }

    const folder = await sendSearchFile(typebook.path, typebook.company.cloud)
    if (!folder?.[0]?.id) {
      this.logger.error(`Pasta não encontrada no Drive: ${typebook.path}`)
      return
    }

    const images = await Indeximage
      .query()
      .where('companies_id', typebook.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .where((query) => {
        query.whereNull('drive_file_id')
        query.orWhere('drive_file_id', '')
      })
      .orderBy('updated_at', 'asc')
      .limit(limit)

    if (images.length === 0) {
      this.logger.info('Nenhuma imagem antiga sem drive_file_id encontrada.')
      return
    }

    const result = {
      processed: 0,
      updated: 0,
      notFound: 0,
      duplicated: 0,
      errors: 0,
    }

    this.logger.info(`Processando ${images.length} imagem(ns) do typebook ${typebooksId}.`)

    for (const image of images) {
      result.processed++

      try {
        const foundFiles = await sendSearchFile(
          image.file_name,
          typebook.company.cloud,
          folder[0].id
        )

        if (!Array.isArray(foundFiles) || foundFiles.length === 0) {
          result.notFound++
          this.logger.warning(`Não encontrado: ${image.file_name}`)
          continue
        }

        if (foundFiles.length > 1) {
          result.duplicated++
          this.logger.warning(`Duplicado no Drive: ${image.file_name}`)
          continue
        }

        if (this.dryRun) {
          this.logger.info(`[dry-run] ${image.file_name} -> ${foundFiles[0].id}`)
          continue
        }

        await Indeximage
          .query()
          .where('companies_id', image.companies_id)
          .andWhere('typebooks_id', image.typebooks_id)
          .andWhere('bookrecords_id', image.bookrecords_id)
          .andWhere('seq', image.seq)
          .where((query) => {
            query.whereNull('drive_file_id')
            query.orWhere('drive_file_id', '')
          })
          .update({
            drive_file_id: foundFiles[0].id,
          })

        result.updated++
        this.logger.success(`Atualizado: ${image.file_name}`)
      } catch (error) {
        result.errors++
        this.logger.error(`Erro ao processar ${image.file_name}: ${error.message || error}`)
      }
    }

    this.logger.info(
      `Resumo: processados=${result.processed}, atualizados=${result.updated}, não encontrados=${result.notFound}, duplicados=${result.duplicated}, erros=${result.errors}`
    )
  }
}
