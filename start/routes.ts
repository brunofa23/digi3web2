import Route from '@ioc:Adonis/Core/Route'

import Application from '@ioc:Adonis/Core/Application'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

Route.group(() => {

  Route.get('/', async () => {
    return { hello: 'world' }
  })

  //BOOKS
  Route.resource("/books", 'BooksController').apiOnly()

  //COMPANIES
  Route.resource("/companies", 'CompaniesController').apiOnly()

  //TYPEBOOKS
  Route.resource("/companies/:companies_id/typebooks", 'TypebooksController').apiOnly

  //BOOKRECORDS
  Route.resource("/companies/:companies_id/typebooks/:typebooks_id/bookrecords", 'BookrecordsController').apiOnly()
  Route.post("/companies/:companies_id/typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords')

  //INDEXIMAGES
  Route.post('/companies/:companies_id/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'indeximagesController.uploads').as('uploads')

  //USERS
  Route.resource("/companies/:companies_id/users", "UsersController").apiOnly()

  //AUTHENTICATION
  Route.post("/login", "AuthenticationController.login")
  Route.post("/logout", "AuthenticationController.logout")


  //rota de teste
  Route.get('dashboard', async ({ auth }) => {
    //return auth
    await auth.use('api').authenticate()
    console.log(auth.use('api').user!)
    return "autenticado"
  })

  Route.get('/test', async () => {
    //return { hello: 'world' }
    return Application.configPath('tokens/token.json')

  })

}).prefix('/api')



