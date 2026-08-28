import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import AcervoBackupService from 'App/Services/AcervoBackup/AcervoBackupService'

export default class AcervoRestore extends BaseCommand {
  public static commandName = 'acervo:restore'
  public static description = 'Restaura backup granular do acervo por empresa e typebook'

  public static settings = {
    loadApp: true,
  }

  @flags.number({ description: 'ID da empresa' })
  public company: number

  @flags.number({ description: 'ID do typebook que será restaurado' })
  public typebook: number

  @flags.string({ description: 'Snapshot no formato yyyy-MM-dd_HHmm' })
  public snapshot: string

  @flags.string({ description: 'Origem do backup: local ou drive' })
  public source: string = 'local'

  @flags.boolean({ description: 'Valida manifest/checksum sem aplicar restauração' })
  public dryRun: boolean = false

  @flags.boolean({ description: 'Confirma a aplicação da restauração no banco' })
  public confirm: boolean = false

  @flags.string({ description: 'Motivo da restauração' })
  public reason: string

  public async run() {
    const companyId = Number(this.company)
    const typebookId = Number(this.typebook)
    const source = String(this.source || 'local')

    if (!Number.isInteger(companyId) || companyId <= 0) {
      this.logger.error('Informe uma empresa válida. Exemplo: node ace acervo:restore --company=15 --typebook=236 --snapshot=2026-08-28_0600 --dry-run')
      return
    }

    if (!Number.isInteger(typebookId) || typebookId <= 0) {
      this.logger.error('Informe um typebook válido. Exemplo: node ace acervo:restore --company=15 --typebook=236 --snapshot=2026-08-28_0600 --dry-run')
      return
    }

    if (!this.snapshot) {
      this.logger.error('Informe o snapshot. Exemplo: --snapshot=2026-08-28_0600')
      return
    }

    if (!['local', 'drive'].includes(source)) {
      this.logger.error('Origem inválida. Use --source=local ou --source=drive.')
      return
    }

    if (!this.dryRun && !this.confirm) {
      this.logger.error('Por segurança, execute primeiro com --dry-run ou confirme com --confirm.')
      return
    }

    if (this.confirm && !String(this.reason || '').trim()) {
      this.logger.error('Informe o motivo da restauração com --reason="..."')
      return
    }

    const service = new AcervoBackupService()
    const result = await service.restore({
      companyId,
      typebookId,
      snapshot: this.snapshot,
      source: source as 'local' | 'drive',
      dryRun: Boolean(this.dryRun),
      confirm: Boolean(this.confirm),
      reason: String(this.reason || '').trim(),
    })

    this.logger.success(this.dryRun ? 'Backup validado com sucesso.' : 'Acervo restaurado com sucesso.')
    this.logger.info(`Snapshot: ${result.snapshot}`)
    this.logger.info(`Origem: ${result.source}`)
    this.logger.info(`Typebook: ${result.typebook.typebooks_id} - ${result.typebook.typebook_name}`)
    this.logger.info(`Arquivo: ${result.typebook.file}`)
    this.logger.info(`Checksum: ${result.checksum}`)

    for (const [table, total] of Object.entries(result.typebook.tables || {})) {
      this.logger.info(`${table}: ${total}`)
    }

    if (!this.dryRun) {
      this.logger.warning(`Pre-restore gerado em: ${result.pre_restore_path}`)
    }
  }
}
