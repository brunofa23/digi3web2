import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import AcervoBackupService from 'App/Services/AcervoBackup/AcervoBackupService'

export default class AcervoSnapshots extends BaseCommand {
  public static commandName = 'acervo:snapshots'
  public static description = 'Lista snapshots de backup do acervo por empresa e typebook'

  public static settings = {
    loadApp: true,
  }

  @flags.number({ description: 'ID da empresa' })
  public company: number

  @flags.number({ description: 'ID do typebook. Se omitido, lista todos' })
  public typebook: number

  @flags.string({ description: 'Origem dos backups: local ou drive' })
  public source: string = 'local'

  public async run() {
    const companyId = Number(this.company)
    const typebookId = Number(this.typebook)
    const source = String(this.source || 'local')

    if (!Number.isInteger(companyId) || companyId <= 0) {
      this.logger.error('Informe uma empresa válida. Exemplo: node ace acervo:snapshots --company=10')
      return
    }

    if (this.typebook !== undefined && (!Number.isInteger(typebookId) || typebookId <= 0)) {
      this.logger.error('Informe um typebook válido. Exemplo: node ace acervo:snapshots --company=10 --typebook=236')
      return
    }

    if (!['local', 'drive'].includes(source)) {
      this.logger.error('Origem inválida. Use --source=local ou --source=drive.')
      return
    }

    const service = new AcervoBackupService()
    const snapshots = await service.listSnapshots({
      companyId,
      typebookId: Number.isInteger(typebookId) && typebookId > 0 ? typebookId : undefined,
      source: source as 'local' | 'drive',
    })

    if (snapshots.length === 0) {
      this.logger.warning('Nenhum snapshot encontrado.')
      return
    }

    for (const snapshot of snapshots) {
      this.logger.info(`Snapshot: ${snapshot.snapshot} (${snapshot.source})`)

      for (const typebook of snapshot.typebooks) {
        this.logger.info(
          `  typebook=${typebook.typebooks_id} ${typebook.typebook_name} registros=${typebook.total_rows} arquivo=${typebook.file}`
        )
      }
    }
  }
}
