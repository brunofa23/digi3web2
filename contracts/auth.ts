/**
 * Contract source: https://git.io/JOdz5
 *
 * Feel free to let us know via PR, if you find something broken in this
 * file.
 */

import Company from 'App/Models/Company'
import User from 'App/Models/User'

declare module '@ioc:Adonis/Addons/Auth' {
  interface ProvidersList {

    user: {
      implementation: LucidProviderContract<typeof User>
      config: LucidProviderConfig<typeof User>
    }
    
  }


  interface GuardsList {

    api: {
      implementation: OATGuardContract<'user', 'api'>
      config: OATGuardConfig<'user'>
      client: OATClientContract<'user'>
    }
  }
}
