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

  //COMPANIES
  Route.get("/companies", 'CompaniesController.index')
  Route.get("/companies/:id", 'CompaniesController.show')
  Route.post("/companies", 'CompaniesController.store').middleware('company_permission:post')
  Route.patch("/companies", 'CompaniesController.store').middleware('company_permission:patch')

  //USERS
  Route.get("/users", "UsersController.index")
  Route.get("/users/:id", "UsersController.show")
  Route.post("/users", "UsersController.store").middleware('user_permission:post')
  Route.patch("/users/:id", "UsersController.update").middleware('user_permission:patch')


  //BOOKRECORDS
  //Route.resource("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController').apiOnly()
  Route.get("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.index')
  Route.get("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.show')
  Route.post("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.store').middleware('bookrecord_permission:post')
  Route.patch("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.update').middleware('bookrecord_permission:patch')
  Route.delete("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.destroy').middleware('bookrecord_permission:destroy')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords').middleware('bookrecord_permission:generateOrUpdateBookrecords')
  Route.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords').middleware('bookrecord_permission:createorupdatebookrecords')
  Route.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords').middleware('bookrecord_permission:destroyManyBookRecords')
  Route.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial').middleware('bookrecord_permission:indeximagesinitial')

  //INDEXIMAGES
  //Route.resource("/indeximages", "IndeximagesController").apiOnly()
  Route.get("/indeximages", "IndeximagesController.index")
  Route.get("/indeximages/:id", "IndeximagesController.show")
  //Route.post("/indeximages", "IndeximagesController.store")
  //Route.patch("/indeximages/:id2/", "IndeximagesController.update")
  //Route.delete("/indeximages", "IndeximagesController.destroy")
  Route.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads').middleware('indeximage_permission:uploads')
  Route.post('/indeximages/download/:id', 'IndeximagesController.download').as('download').middleware('indeximage_permission:download')
  Route.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture').middleware('indeximage_permission:uploadCapture')


  //AUTHENTICATION
  Route.post("/login", "AuthenticationController.login")
  Route.post("/logout", "AuthenticationController.logout")

  //rota de teste
  Route.get('dashboard', async ({ auth }) => {
    await auth.use('api').authenticate()
    return auth.use('api').user!
  })


}).prefix('/api')

//COMPANIES MIDDLEWARE
// Route.group(() => {
//   Route.resource("/companies", 'CompaniesController').apiOnly()
// }).prefix('/api')//.middleware('level_permission:superuser')


//**************************************************************** */
Route.get('/api/test/middleware/level', ({ response }) => {
  return response.json({ ok: true })
}).middleware('level_permission:3')


Route.group(() => {

  Route.get('/test', ({ response }) => {
    return response.json({ ok: true })
  }).middleware('level_permission:4')

}).prefix('/api/company/:company_id').middleware('company_permission')



