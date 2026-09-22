import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import DriveDeletionQueueService from 'App/Services/DriveDeletionQueueService'

export default class ProcessDriveDeletions extends BaseCommand {
  public static commandName = 'drive:process-deletions'
  public static description = 'Processa a fila segura de exclusão de imagens do Google Drive'

  public static settings = { loadApp: true }

  @flags.number({ description: 'Quantidade máxima de lotes por execução' })
  public limit: number = 20

  public async run() {
    const limit = Number(this.limit || 20)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      this.logger.error('Informe um limite entre 1 e 100.')
      return
    }

    const result = await DriveDeletionQueueService.processPending(limit)
    this.logger.info(`Fila processada: ${result.batches} lote(s), ${result.processed} item(ns), ${result.failed} falha(s).`)
  }
}
