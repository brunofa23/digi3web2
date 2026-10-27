import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AppProvider {
  constructor (protected app: ApplicationContract) {
  }

  public register () {
    // Register your own bindings
  }

  public async boot () {
    // IoC container is ready
  }

  public async ready () {
    if (this.app.environment === 'web') {
      const { startBookSideTrainingWorker } = await import('App/Services/ocr/bookSideModelTraining')
      startBookSideTrainingWorker()
    }
  }

  public async shutdown () {
    if (this.app.environment === 'web') {
      const { stopBookSideTrainingWorker } = await import('App/Services/ocr/bookSideModelTraining')
      await stopBookSideTrainingWorker()
    }
  }
}
