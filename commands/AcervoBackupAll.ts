import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import Company from 'App/Models/Company'
import AcervoBackupService from 'App/Services/AcervoBackup/AcervoBackupService'

export default class AcervoBackupAll extends BaseCommand {
  public static commandName = 'acervo:backup-all'
  public static description = 'Gera backup granular do acervo para todas as empresas ativas'

  public static settings = {
    loadApp: true,
  }

  @flags.boolean({ description: 'Envia os arquivos gerados para o Google Drive das empresas' })
  public upload: boolean = false

  @flags.number({ description: 'Dias de retenção dos snapshots' })
  public retentionDays: number = 30

  @flags.boolean({ description: 'Inclui empresas inativas' })
  public includeInactive: boolean = false

  @flags.boolean({ description: 'Ignora filtro do módulo de livros' })
  public includeWithoutBooksModule: boolean = false

  public async run() {
    const retentionDays = Number(this.retentionDays || 30)

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      this.logger.error('Informe retenção entre 1 e 3650 dias.')
      return
    }

    const companies = await this.getCompanies()

    if (companies.length === 0) {
      this.logger.warning('Nenhuma empresa encontrada para backup do acervo.')
      return
    }

    const service = new AcervoBackupService()
    let success = 0
    let errors = 0

    this.logger.info(`Empresas selecionadas: ${companies.length}`)

    for (const company of companies) {
      try {
        this.logger.info(`Iniciando backup da empresa ${company.id} - ${company.name}`)

        const result = await service.backup({
          companyId: company.id,
          upload: Boolean(this.upload),
          retentionDays,
        })

        success++
        this.logger.success(
          `Empresa ${company.id}: snapshot=${result.snapshot} typebooks=${result.manifest.typebooks.length}`
        )
      } catch (error) {
        errors++
        this.logger.error(`Empresa ${company.id}: ${error.message || error}`)
      }
    }

    this.logger.info(`Resumo: sucesso=${success} erros=${errors}`)

    if (errors > 0) {
      process.exitCode = 1
    }
  }

  private async getCompanies() {
    const query = Company.query().orderBy('id', 'asc')

    if (!this.includeInactive) {
      query.where('status', true)
    }

    if (!this.includeWithoutBooksModule) {
      query.where('module_books', true)
    }

    return query
  }
}
