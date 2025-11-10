import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', async () => {
    return { hello: 'Sistema de Gerenciamento de Imagens - v110 - UTILIZANDO DOCKERFILE' }
  })//.middleware('level_permission:1')

  //BOOK
  Route.get("/books", 'BooksController.index')//.middleware("level_permission:get")
  Route.post("/books", 'BooksController.store')//.middleware("level_permission:post")
  Route.patch("/books/:id", 'BooksController.update')//.middleware("level_permission:patch")
  Route.delete("/books/:id", 'BooksController.destroy')//.middleware("level_permission:destroy")

  //TYPEBOOK
  Route.get('/typebooks', 'TypebooksController.index')
  Route.get('/typebooks/:id', 'TypebooksController.show')//.middleware('typebook_permission:get')
  Route.get('/alltypebook', 'TypebooksController.allTypebook')//.middleware('typebook_permission:get')
  Route.post('/typebooks', 'TypebooksController.store')//.middleware('typebook_permission:post')
  Route.patch('/typebooks/:id', 'TypebooksController.update')//.middleware('typebook_permission:patch')
  Route.delete('/typebooks/:id', 'TypebooksController.destroy')//.middleware('typebook_permission:destroy')


  //COMPANIES
  Route.get("/companies", 'CompaniesController.index')
  Route.get("/companies/:id", 'CompaniesController.show')
  Route.post("/companies", 'CompaniesController.store')//.middleware('company_permission:post')
  Route.patch("/companies/:id", 'CompaniesController.update')//.middleware('company_permission:patch')

  //USERS
  Route.get("/users", "UsersController.index")
  Route.get("/users/:id", "UsersController.show")
  Route.get("/accessimage/:id", "UsersController.accessImage")
  Route.post("/users", "UsersController.store")//.middleware('user_permission:post')
  Route.patch("/users/:id", "UsersController.update")//.middleware('user_permission:patch')
  Route.post("/closeaccesimage/:id", "UsersController.closeAccesImage")//.middleware('user_permission:patch')

  //USERGROUPS
  Route.resource('/usergroups', "UsergroupsController").apiOnly()

  //GROUPXPERMISSIONS
  Route.resource("/groupxpermissions", "GroupxpermissionsController").apiOnly()
  Route.get("/permissiongroupxusergroup/:usergroup_id", "GroupxpermissionsController.PermissiongroupXUsergroup")

  //BOOKRECORDS
  Route.get("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.index')
  Route.get("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.show')
  Route.get("/bookrecords/booksummary/:typebooks_id", 'BookrecordsController.bookSummary')
  Route.post("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.store').middleware('bookrecord_permission:post')
  Route.patch("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.update')//.middleware('bookrecord_permission:patch')
  Route.delete("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.destroy').middleware('bookrecord_permission:destroy')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords').middleware('bookrecord_permission:generateOrUpdateBookrecords')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords2", 'BookrecordsController.generateOrUpdateBookrecords2').middleware('bookrecord_permission:generateOrUpdateBookrecords')
  Route.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords').middleware('bookrecord_permission:createorupdatebookrecords')
  Route.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords').middleware('bookrecord_permission:destroyManyBookRecords')
  Route.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial')//.middleware('bookrecord_permission:indeximagesinitial')
  Route.get('/updatedfiles', 'BookrecordsController.updatedFiles')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecordsdocument", 'BookrecordsController.generateOrUpdateBookrecordsDocument').middleware('bookrecord_permission:generateOrUpdateBookrecords')

  Route.get("/fastfind", 'BookrecordsController.fastFind').middleware('bookrecord_permission:fastfind')

  Route.get("/fastfinddocuments", 'BookrecordsController.fastFindDocuments').middleware('bookrecord_permission:fastfind')
  Route.get("/maxbookrecord", 'BookrecordsController.maxBookRecord')
  Route.get("/sheetwithside/:typebooks_id/:book", 'BookrecordsController.sheetWithSide')

  //DOCUMENTS
  Route.get("/typebooks/:typebooks_id/documents", 'DocumentsController.index')
  Route.post("/typebooks/:typebooks_id/documents", 'DocumentsController.store')
  Route.patch("/typebooks/:typebooks_id/documents/:id", 'DocumentsController.update')

  //DOCUMENT_CONFIG
  Route.resource("documentconfig", "DocumentconfigsController")

  //DOCUMENT TYPES
  Route.resource("documenttypes", "DocumentTypesController").apiOnly()

  //DOCUMENTTYPEBOOK
  Route.resource("documenttypebooks", "DocumentTypeBooksController").apiOnly()

  //INDEXIMAGES
  //Route.resource("/indeximages", "IndeximagesController").apiOnly()
  Route.get("/indeximages", "IndeximagesController.index")
  Route.get("/indeximages/:id", "IndeximagesController.show")
  Route.delete("/indeximages/:typebooks_id/:bookrecords_id/:file_name", "IndeximagesController.destroy")
  Route.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads')//.middleware('indeximage_permission:uploads')
  Route.post('/indeximages/download/:id', 'IndeximagesController.download').as('download')//.middleware('indeximage_permission:download')
  Route.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture')//.middleware('indeximage_permission:uploadCapture')

  //AUTHENTICATION
  Route.post("/login", "AuthenticationController.login")//.middleware('authentication_permission:free_time')
  Route.post("/logout", "AuthenticationController.logout")
  Route.post("/authorizeaccessimages", "AuthenticationController.authorizeAccessImages")//.middleware('user_permission:authorizeAccessImages')

  //USER PASSWORD
  Route.post("/resetpassword", "UserPasswordsController.resetPassword")
  Route.post("/updatepassword", "UserPasswordsController.updatePassword")

  //TOKEN
  Route.post("/token", "TokensController.store")

  //EVENTTYPES
  Route.resource("eventtypes", "EventtypesController").apiOnly()

  //EVENTS
  Route.resource("events", "EventsController").apiOnly()

  //TOKENTOIMAGES
  Route.post("/tokentoimages", "TokenToImagesController.store")//.middleware('tokentoimages_permission:post')
  Route.post("/verifytokentoimages", "TokenToImagesController.verifyTokenToImages")

  //READFILES
  Route.post("/readfile", "ReadFilesController.readFile")

  //MAIL MANANGER
  Route.post("/sendmailcontactwebsite", "MailmanangersController.sendMailContactWebsite")

  //FIN_EMP
  Route.resource("/finemps", "FinEmpsController").apiOnly()

  //FIN_CLASSES
  Route.resource("/finclasses", "FinClassesController").apiOnly()

  //FIN_ACCOUNTS
  Route.resource("/finaccounts", "FinAccountsController").apiOnly()
    .middleware({
      index: ['finaccount_permission:get'],
      show: ['finaccount_permission:show'],
      store: ['finaccount_permission:create'],
      update: ['finaccount_permission:update']
    })
  Route.post("/finaccounts/createmany", "FinAccountsController.createMany")
  Route.post("/finaccounts/replicate", "FinAccountsController.replicate")


  //FIN_IMAGES
  Route.resource("/finimages", "FinImagesController").apiOnly()
  Route.post('/finimages/downloadfinimage', 'FinImagesController.downloadfinimage').as('downloadfinimage')//.middleware('indeximage_permission:download')

  //FIN_PAYMENT_METHODS
  Route.resource("/finpaymentmethods", 'FinPaymentMethodsController').apiOnly()

  //ENTITIES
  Route.resource("/finentities", 'FinEntitiesController').apiOnly()

  // STATUS
  Route.resource("/statuses", 'StatusesController').apiOnly()

  //CONFIG
  //Route.post("/config", "ConfigsController.storeEncryption")

  //rota de teste
  Route.get('dashboard', async ({ auth }) => {
    await auth.use('api').authenticate()
    return auth.use('api').user!
  })
}).prefix('/api')//.middleware(['auth'])





