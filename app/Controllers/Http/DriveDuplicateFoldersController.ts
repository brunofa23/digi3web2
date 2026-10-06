import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DriveDuplicateFolderScanService from 'App/Services/DriveDuplicateFolderScanService'

export default class DriveDuplicateFoldersController {
  private service = new DriveDuplicateFolderScanService()

  private async authorized({ auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    if (user.superuser) return true
    response.status(403).send({ message: 'Acesso permitido somente a superusuários.' })
    return false
  }

  public async index(ctx: HttpContextContract) {
    if (!await this.authorized(ctx)) return
    try {
      return ctx.response.status(200).send(await this.service.getSnapshot())
    } catch (error) {
      console.error('Erro ao consultar pesquisa de pastas duplicadas:', error)
      return ctx.response.status(500).send({ message: 'Não foi possível consultar a pesquisa de pastas duplicadas.' })
    }
  }

  public async refresh(ctx: HttpContextContract) {
    if (!await this.authorized(ctx)) return
    try {
      return ctx.response.status(202).send(await this.service.start())
    } catch (error) {
      console.error('Erro ao iniciar pesquisa de pastas duplicadas:', error)
      return ctx.response.status(500).send({ message: 'Não foi possível iniciar a pesquisa de pastas duplicadas.' })
    }
  }
}
