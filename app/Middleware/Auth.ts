import { AuthenticationException } from '@adonisjs/auth/build/standalone'
import type { GuardsList } from '@ioc:Adonis/Addons/Auth'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthMiddleware {
  protected redirectTo = '/login'

  protected async authenticate(auth: HttpContextContract['auth'], guards: (keyof GuardsList)[]) {
    let guardLastAttempted: string | undefined

    for (let guard of guards) {
      guardLastAttempted = guard
      if (await auth.use(guard).check()) {
        auth.defaultGuard = guard
        return true
      }






    }

    throw new AuthenticationException(
      'Unauthorized access',
      'E_UNAUTHORIZED_ACCESS',
      guardLastAttempted,
      this.redirectTo,
    )
  }

  /**
   * Handle request
   */
  public async handle(
    { auth }: HttpContextContract,
    next: () => Promise<void>,
    customGuards: (keyof GuardsList)[]
  ) {


    const guards = customGuards.length ? customGuards : [auth.name]
    await this.authenticate(auth, guards)
    await next()
  }
}
