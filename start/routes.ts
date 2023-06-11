import Route from '@ioc:Adonis/Core/Route'
import Application from '@ioc:Adonis/Core/Application'

Route.group(() => {

  Route.get('/', async () => {
    return { hello: 'Hello World v58' }
  })//.middleware('level_permission:1')

  //BOOK
  Route.get("/books", 'BooksController.index').middleware("level_permission:get")
  Route.post("/books", 'BooksController.store').middleware("level_permission:post")
  Route.patch("/books/:id", 'BooksController.update').middleware("level_permission:patch")
  Route.delete("/books/:id", 'BooksController.destroy').middleware("level_permission:destroy")

  //TYPEBOOK
  Route.get('/typebooks', 'TypebooksController.index')
  Route.get('/typebooks/:id', 'TypebooksController.show').middleware('typebook_permission:get')
  Route.post('/typebooks', 'TypebooksController.store').middleware('typebook_permission:post')
  Route.patch('/typebooks/:id', 'TypebooksController.update').middleware('typebook_permission:patch')
  Route.delete('/typebooks/:id', 'TypebooksController.destroy').middleware('typebook_permission:destroy')


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


}).prefix('/api')

//COMPANIES MIDDLEWARE
Route.group(() => {
  Route.resource("/companies", 'CompaniesController').apiOnly()
}).prefix('/api').middleware('level_permission:superuser')


//**************************************************************** */
Route.get('/api/test/middleware/level', ({ response }) => {
  return response.json({ ok: true })
}).middleware('level_permission:3')


Route.group(() => {

  Route.get('/test', ({ response }) => {
    return response.json({ ok: true })
  }).middleware('level_permission:4')

}).prefix('/api/company/:company_id').middleware('company_permission')



