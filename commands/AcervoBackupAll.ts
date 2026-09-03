import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'
import * as http from 'http'
import * as https from 'https'
import { URL } from 'url'
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

  @flags.boolean({ description: 'Lista empresas selecionadas sem gerar backup' })
  public dryRun: boolean = false

  @flags.number({ description: 'Quantidade total de partes para dividir o backup' })
  public shardTotal: number = 1

  @flags.number({ description: 'Parte atual do backup dividido, iniciando em 1' })
  public shardIndex: number = 1

  public async run() {
    const retentionDays = Number(this.retentionDays || 30)
    const shardTotal = Number(this.shardTotal || 1)
    const shardIndex = Number(this.shardIndex || 1)

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      this.logger.error('Informe retenção entre 1 e 3650 dias.')
      return
    }

    if (!Number.isInteger(shardTotal) || shardTotal < 1 || shardTotal > 20) {
      this.logger.error('Informe shard-total entre 1 e 20.')
      return
    }

    if (!Number.isInteger(shardIndex) || shardIndex < 1 || shardIndex > shardTotal) {
      this.logger.error('Informe shard-index entre 1 e o valor de shard-total.')
      return
    }

    const allCompanies = await this.getCompanies()
    const companies = this.filterCompaniesByShard(allCompanies, shardTotal, shardIndex)

    if (companies.length === 0) {
      this.logger.warning('Nenhuma empresa encontrada para backup do acervo.')
      return
    }

    const service = new AcervoBackupService()
    let success = 0
    let errors = 0
    const runId = this.getRunId(shardTotal, shardIndex)

    this.logger.info(
      shardTotal > 1
        ? `Empresas selecionadas: ${companies.length} de ${allCompanies.length} (parte ${shardIndex}/${shardTotal})`
        : `Empresas selecionadas: ${companies.length}`
    )

    if (this.dryRun) {
      for (const company of companies) {
        this.logger.info(`Empresa ${company.id} - ${company.name}`)
      }

      this.logger.warning('Dry-run executado. Nenhum backup foi gerado.')
      return
    }

    await this.notifyBackupMonitor({
      run_id: runId,
      event: 'RUN_STARTED',
      expected_companies: companies.map((company) => ({
        companies_id: company.id,
        company_name: company.name,
      })),
      metadata: {
        upload: Boolean(this.upload),
        retention_days: retentionDays,
        shard_total: shardTotal,
        shard_index: shardIndex,
      },
    })

    const heartbeat = this.startBackupMonitorHeartbeat(runId)

    for (const company of companies) {
      try {
        this.logger.info(`Iniciando backup da empresa ${company.id} - ${company.name}`)
        await this.notifyBackupMonitor({
          run_id: runId,
          event: 'COMPANY_STARTED',
          companies_id: company.id,
          company_name: company.name,
        })

        const result = await service.backup({
          companyId: company.id,
          upload: Boolean(this.upload),
          retentionDays,
        })

        success++
        this.logger.success(
          `Empresa ${company.id}: snapshot=${result.snapshot} typebooks=${result.manifest.typebooks.length}`
        )
        await this.notifyBackupMonitor({
          run_id: runId,
          event: 'COMPANY_SUCCESS',
          companies_id: company.id,
          company_name: company.name,
          metadata: {
            snapshot: result.snapshot,
            typebooks_count: result.manifest.typebooks.length,
            total_rows: result.manifest.typebooks.reduce((total, typebook) => {
              return total + (Number(typebook.total_rows) || 0)
            }, 0),
          },
        })
      } catch (error) {
        errors++
        this.logger.error(`Empresa ${company.id}: ${error.message || error}`)
        await this.notifyBackupMonitor({
          run_id: runId,
          event: 'COMPANY_ERROR',
          companies_id: company.id,
          company_name: company.name,
          error_message: error.message || String(error),
        })
      }
    }

    clearInterval(heartbeat)

    this.logger.info(`Resumo: sucesso=${success} erros=${errors}`)
    await this.notifyBackupMonitor({
      run_id: runId,
      event: errors > 0 ? 'RUN_ERROR' : 'RUN_SUCCESS',
      error_message: errors > 0 ? `Backup finalizado com ${errors} erro(s).` : null,
      metadata: {
        success,
        errors,
      },
    })

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

  private getRunId(shardTotal: number, shardIndex: number) {
    const base = DateTime.now().toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'")

    return shardTotal > 1
      ? `${base}_database_acervo_${shardIndex}_${shardTotal}`
      : `${base}_database_acervo`
  }

  private startBackupMonitorHeartbeat(runId: string) {
    const intervalSeconds = Math.max(Number(Env.get('BACKUP_MONITOR_HEARTBEAT_SECONDS', 300)), 60)

    const timer = setInterval(() => {
      this.notifyBackupMonitor({
        run_id: runId,
        event: 'HEARTBEAT',
      }).catch(() => null)
    }, intervalSeconds * 1000)

    timer.unref()
    return timer
  }

  private async notifyBackupMonitor(payload: Record<string, any>) {
    const webhookUrl = Env.get('BACKUP_MONITOR_WEBHOOK_URL', '')
    const secret = Env.get('BACKUP_WEBHOOK_SECRET', '')

    if (!webhookUrl || !secret) return

    try {
      await this.postBackupMonitorEvent(webhookUrl, secret, {
        kind: 'DATABASE_ACERVO',
        ...payload,
      })
    } catch (error) {
      this.logger.warning(`Monitoramento do backup não enviado: ${error.message || error}`)
    }
  }

  private postBackupMonitorEvent(webhookUrl: string, secret: string, payload: Record<string, any>) {
    const body = JSON.stringify(payload)
    const endpoint = new URL(webhookUrl)
    const transport = endpoint.protocol === 'https:' ? https : http

    return new Promise<void>((resolve, reject) => {
      const request = transport.request(endpoint, {
        method: 'POST',
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (response) => {
        response.resume()
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve()
            return
          }

          reject(new Error(`HTTP ${response.statusCode}`))
        })
      })

      request.on('timeout', () => request.destroy(new Error('timeout')))
      request.on('error', reject)
      request.write(body)
      request.end()
    })
  }

  private filterCompaniesByShard(companies: Company[], shardTotal: number, shardIndex: number) {
    if (shardTotal === 1) return companies

    return companies.filter((_company, index) => {
      return index % shardTotal === shardIndex - 1
    })
  }
}
