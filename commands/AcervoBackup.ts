import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import AcervoBackupService from 'App/Services/AcervoBackup/AcervoBackupService'

export default class AcervoBackup extends BaseCommand {
  public static commandName = 'acervo:backup'
  public static description = 'Gera backup granular do acervo por empresa e typebook'

  public static settings = {
    loadApp: true,
  }

  @flags.number({ description: 'ID da empresa' })
  public company: number

  @flags.number({ description: 'ID do typebook. Se omitido, gera todos os typebooks da empresa' })
  public typebook: number

  @flags.boolean({ description: 'Envia os arquivos gerados para o Google Drive da empresa' })
  public upload: boolean = false

  @flags.number({ description: 'Dias de retenção dos snapshots' })
  public retentionDays: number = 30

  public async run() {
    const companyId = Number(this.company)
    const typebookId = Number(this.typebook)
    const retentionDays = Number(this.retentionDays || 30)

    if (!Number.isInteger(companyId) || companyId <= 0) {
      this.logger.error('Informe uma empresa válida. Exemplo: node ace acervo:backup --company=15')
      return
    }

    if (this.typebook !== undefined && (!Number.isInteger(typebookId) || typebookId <= 0)) {
      this.logger.error('Informe um typebook válido. Exemplo: node ace acervo:backup --company=15 --typebook=236')
      return
    }

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      this.logger.error('Informe retenção entre 1 e 3650 dias.')
      return
    }

    const service = new AcervoBackupService()
    const result = await service.backup({
      companyId,
      typebookId: Number.isInteger(typebookId) && typebookId > 0 ? typebookId : undefined,
      upload: Boolean(this.upload),
      retentionDays,
    })

    this.logger.success(`Snapshot gerado: ${result.snapshot}`)
    this.logger.info(`Pasta local: ${result.path}`)
    this.logger.info(`Typebooks: ${result.manifest.typebooks.length}`)

    for (const item of result.manifest.typebooks) {
      this.logger.info(
        `typebook=${item.typebooks_id} arquivo=${item.file} registros=${item.total_rows} checksum=${item.checksum_sha256}`
      )
    }

    if (!this.upload) {
      this.logger.warning('Upload não executado. Use --upload para enviar ao Google Drive.')
    }
  }
}
