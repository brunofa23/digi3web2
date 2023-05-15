import Route from '@ioc:Adonis/Core/Route'
import Application from '@ioc:Adonis/Core/Application'

const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");

Route.group(() => {

  Route.get('/', async () => {
    return { hello: 'Hello World v53' }
  })

  //BOOKS
  Route.resource("/books", 'BooksController').apiOnly()

  //COMPANIES
  Route.resource("/companies", 'CompaniesController').apiOnly()
  //Route.get("/companies", 'CompaniesController.index')

  //TYPEBOOKS
  Route.resource("/typebooks", 'TypebooksController').apiOnly()

  //BOOKRECORDS
  Route.resource("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController').apiOnly()
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords')
  Route.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords')
  Route.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords')
  Route.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial')

  //INDEXIMAGES
  Route.resource("/indeximages", "IndeximagesController").apiOnly()
  Route.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads')
  Route.post('/indeximages/download/:id', 'IndeximagesController.download').as('download')
  Route.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture')



  //USERS
  Route.resource("/users", "UsersController").apiOnly()

  //AUTHENTICATION
  Route.post("/login", "AuthenticationController.login")
  Route.post("/logout", "AuthenticationController.logout")


  //rota de teste
  Route.get('dashboard', async ({ auth }) => {
    //return auth
    await auth.use('api').authenticate()
    //console.log(auth.use('api').user!)
    return auth.use('api').user!
  })

  Route.get('/test', async () => {
    //return { hello: 'world' }
    return Application.configPath('tokens/token.json')

  })

}).prefix('/api')


Route.get('/api/test/middleware/level', ({ response }) => {
  return response.json({ ok: true })
}).middleware('level_permission:3')


Route.group(() => {

  Route.get('/test', ({ response }) => {
    return response.json({ ok: true })
  }).middleware('level_permission:4')

}).prefix('/api/company/:company_id').middleware('company_permission')



