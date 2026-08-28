import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AcervoBackupService from 'App/Services/AcervoBackup/AcervoBackupService'

export default class AcervoBackupsController {
  private service = new AcervoBackupService()

  private getSource(source?: string) {
    return source === 'local' ? 'local' : 'drive'
  }

  private getNumber(value: any) {
    const numberValue = Number(value)
    return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null
  }

  private async authorize({ auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    if (!user.superuser) {
      response.status(403).send({
        message: 'Usuário sem permissão para restauração de acervo.',
      })
      return null
    }

    return user
  }

  public async snapshots(ctx: HttpContextContract) {
    try {
      const user = await this.authorize(ctx)
      if (!user) return

      const companyId = this.getNumber(ctx.request.input('companies_id'))
      const typebookId = this.getNumber(ctx.request.input('typebooks_id'))

      if (!companyId) {
        return ctx.response.status(400).send({ message: 'Empresa obrigatória.' })
      }

      const snapshots = await this.service.listSnapshots({
        companyId,
        typebookId: typebookId || undefined,
        source: this.getSource(ctx.request.input('source')),
      })

      return ctx.response.status(200).send(snapshots)
    } catch (error) {
      console.error('Erro ao listar snapshots do acervo:', error)
      return ctx.response.status(500).send({
        message: 'Erro ao listar snapshots do acervo.',
        error: error.message || String(error),
      })
    }
  }

  public async backup(ctx: HttpContextContract) {
    try {
      const user = await this.authorize(ctx)
      if (!user) return

      const companyId = this.getNumber(ctx.request.input('companies_id'))
      const typebookId = this.getNumber(ctx.request.input('typebooks_id'))

      if (!companyId) {
        return ctx.response.status(400).send({ message: 'Empresa obrigatória.' })
      }

      const result = await this.service.backup({
        companyId,
        typebookId: typebookId || undefined,
        upload: true,
        retentionDays: 30,
        userId: user.id,
        ip: ctx.request.ip(),
      })

      return ctx.response.status(200).send(result)
    } catch (error) {
      console.error('Erro ao gerar backup manual do acervo:', error)
      return ctx.response.status(500).send({
        message: 'Erro ao gerar backup manual do acervo.',
        error: error.message || String(error),
      })
    }
  }

  public async dryRun(ctx: HttpContextContract) {
    return this.restore(ctx, true)
  }

  public async apply(ctx: HttpContextContract) {
    return this.restore(ctx, false)
  }

  private async restore(ctx: HttpContextContract, dryRun: boolean) {
    try {
      const user = await this.authorize(ctx)
      if (!user) return

      const payload = ctx.request.only([
        'companies_id',
        'typebooks_id',
        'snapshot',
        'source',
        'reason',
      ])
      const companyId = this.getNumber(payload.companies_id)
      const typebookId = this.getNumber(payload.typebooks_id)
      const reason = String(payload.reason || '').trim()

      if (!companyId) {
        return ctx.response.status(400).send({ message: 'Empresa obrigatória.' })
      }

      if (!typebookId) {
        return ctx.response.status(400).send({ message: 'Livro obrigatório.' })
      }

      if (!payload.snapshot) {
        return ctx.response.status(400).send({ message: 'Snapshot obrigatório.' })
      }

      if (!dryRun && reason.length < 10) {
        return ctx.response.status(400).send({
          message: 'Informe um motivo com pelo menos 10 caracteres para restaurar.',
        })
      }

      const result = await this.service.restore({
        companyId,
        typebookId,
        snapshot: payload.snapshot,
        source: this.getSource(payload.source),
        dryRun,
        confirm: !dryRun,
        reason,
        userId: user.id,
        ip: ctx.request.ip(),
      })

      return ctx.response.status(200).send(result)
    } catch (error) {
      console.error('Erro ao restaurar snapshot do acervo:', error)
      return ctx.response.status(500).send({
        message: 'Erro ao restaurar snapshot do acervo.',
        error: error.message || String(error),
      })
    }
  }
}
