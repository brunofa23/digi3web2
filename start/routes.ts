import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', async () => {
    return { hello: 'Sistema de Gerenciamento de Imagens - v111 - UTILIZANDO DOCKERFILE' }
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

  //SPEDY COMPANIES
  Route.get('/spedy/companies/local/:companyId/integration', 'Spedy/CompaniesController.showIntegration')
  Route.put('/spedy/companies/local/:companyId/integration', 'Spedy/CompaniesController.saveIntegration')
  Route.post('/spedy/companies/local/:companyId/sync', 'Spedy/CompaniesController.syncIntegration')
  Route.get('/spedy/companies', 'Spedy/CompaniesController.list')
  Route.post('/spedy/companies', 'Spedy/CompaniesController.create')
  Route.get('/spedy/service-invoices/cities', 'Spedy/CompaniesController.serviceInvoiceCities')
  Route.get('/spedy/companies/:id', 'Spedy/CompaniesController.show')
  Route.put('/spedy/companies/:id', 'Spedy/CompaniesController.update')
  Route.delete('/spedy/companies/:id', 'Spedy/CompaniesController.destroy')
  Route.get('/spedy/companies/:id/settings', 'Spedy/CompaniesController.settings')
  Route.put('/spedy/companies/:id/settings', 'Spedy/CompaniesController.updateSettings')
  Route.get('/spedy/companies/:id/certificates', 'Spedy/CompaniesController.certificates')
  Route.post('/spedy/companies/:id/certificates', 'Spedy/CompaniesController.uploadCertificate')
  Route.get('/spedy/service-invoices', 'Spedy/ServiceInvoicesController.index')
  Route.post('/spedy/service-invoices', 'Spedy/ServiceInvoicesController.store')
  Route.get('/spedy/service-invoices/:id', 'Spedy/ServiceInvoicesController.show')
  Route.post('/spedy/service-invoices/:id/sync', 'Spedy/ServiceInvoicesController.sync')

  //SITUATIONS
  Route.get("/situations", 'SituationsController.index')

  //USERS
  Route.get("/users", "UsersController.index")
  Route.get("/users/:id", "UsersController.show")
  Route.get("/accessimage/:id", "UsersController.accessImage")
  Route.post("/users", "UsersController.store")//.middleware('user_permission:post')
  Route.patch("/users/:id", "UsersController.update")//.middleware('user_permission:patch')
  Route.post("/closeaccesimage/:id", "UsersController.closeAccesImage")//.middleware('user_permission:patch')

  //SUPPORT TICKETS
  Route.get("/support-tickets", "SupportTicketsController.index")
  Route.post("/support-tickets", "SupportTicketsController.store")
  Route.patch("/support-tickets/:id", "SupportTicketsController.update")

  //USERGROUPS
  Route.resource('/usergroups', "UsergroupsController").apiOnly()

  //GROUPXPERMISSIONS
  Route.resource("/groupxpermissions", "GroupxpermissionsController").apiOnly()
  Route.get("/permissiongroupxusergroup/:usergroup_id", "GroupxpermissionsController.PermissiongroupXUsergroup")

  //BOOKRECORDS
  Route.get("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.index').middleware('bookrecord_permission:get')
  Route.get("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.show').middleware('bookrecord_permission:get')
  Route.get("/bookrecords/booksummary/:typebooks_id", 'BookrecordsController.bookSummary').middleware('bookrecord_permission:get')
  Route.post("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.store').middleware('bookrecord_permission:post')
  Route.patch("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.update').middleware('bookrecord_permission:patch')
  Route.delete("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.destroy').middleware('bookrecord_permission:destroy')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords').middleware('bookrecord_permission:generateOrUpdateBookrecords')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords2", 'BookrecordsController.generateOrUpdateBookrecords2').middleware('bookrecord_permission:generateOrUpdateBookrecords')
  Route.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords').middleware('bookrecord_permission:createorupdatebookrecords')
  Route.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords').middleware('bookrecord_permission:destroyManyBookRecords')
  Route.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial').middleware('bookrecord_permission:get')
  Route.get('/updatedfiles', 'BookrecordsController.updatedFiles').middleware('bookrecord_permission:get')
  Route.get('/auditlogs', 'AuditLogsController.index').middleware('auth')
  Route.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecordsdocument", 'BookrecordsController.generateOrUpdateBookrecordsDocument').middleware('bookrecord_permission:generateOrUpdateBookrecords')

  Route.post('/typebooks/:typebooks_id/fullreprocessing', 'BookrecordsController.fullReprocessing').middleware('bookrecord_permission:get')
  Route.post('/typebooks/:typebooks_id/visionocrindeximages', 'BookrecordsController.visionOcrIndeximages').middleware('bookrecord_permission:get')


  Route.get("/fastfind", 'BookrecordsController.fastFind').middleware('bookrecord_permission:fastfind')

  Route.get("/fastfinddocuments", 'BookrecordsController.fastFindDocuments').middleware('bookrecord_permission:fastfind')
  Route.get("/maxbookrecord", 'BookrecordsController.maxBookRecord').middleware('bookrecord_permission:maxbookrecord')
  Route.post("/imagesforitem", 'BookrecordsController.imagesForItem').middleware('bookrecord_permission:get')
  Route.get("/sheetwithside/:typebooks_id/:book", 'BookrecordsController.sheetWithSide').middleware('bookrecord_permission:get')

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

  //EMOLUMENTS
  Route.resource('/emoluments', 'EmolumentsController').apiOnly()


  //INDEXIMAGES
  //Route.resource("/indeximages", "IndeximagesController").apiOnly()
  Route.get("/indeximages", "IndeximagesController.index")
  Route.get("/indeximages/:id", "IndeximagesController.show")
  Route.delete("/indeximages/:typebooks_id/:bookrecords_id/:file_name", "IndeximagesController.destroy")
  Route.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads')//.middleware('indeximage_permission:uploads')
  Route.post('/indeximages/download/:id', 'IndeximagesController.download').as('download')//.middleware('indeximage_permission:download')
  Route.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture')//.middleware('indeximage_permission:uploadCapture')
  Route.get("/countprocessing/:typebooks_id", "IndeximagesController.countProcessing")

  //AUTHENTICATION
  Route.post("/login", "AuthenticationController.login")//.middleware('authentication_permission:free_time')
  Route.post("/login/webauthn", "AuthenticationController.verifyWebauthnLogin")
  Route.post("/logout", "AuthenticationController.logout")
  Route.post("/authorizeaccessimages", "AuthenticationController.authorizeAccessImages")//.middleware('user_permission:authorizeAccessImages')

  //USER PASSWORD
  Route.post("/resetpassword", "UserPasswordsController.resetPassword")
  Route.post("/updatepassword", "UserPasswordsController.updatePassword")

  //TOKEN
  Route.post("/token", "TokensController.store")

  //EVENTTYPES
  Route.resource("eventtypes", "EventtypesController").apiOnly()

  //EMPLOYEEVERIFICATION
  Route.resource("employeeverifications", "EmployeeVerificationsController").apiOnly()

  //EMPLOYEE VERIFICATION X RECEIPTS
  Route.resource("employeeverificationxreceipts", "EmployeeVerificationXReceiptsController").apiOnly()

  //EMPLOYEE VERIFICATION X CERTIFICATES
  Route.resource("employeeverificationxcertificates", "EmployeeVerificationXCertificatesController").apiOnly()

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
  Route.get("/finentities/document-emails/history", 'FinEntitiesController.documentEmailHistory')
  Route.post("/finentities/document-emails/send", 'FinEntitiesController.sendDocumentEmails')
  Route.resource("/finentities", 'FinEntitiesController').apiOnly()

  // STATUS
  Route.resource("/statuses", 'StatusesController').apiOnly()

  // STAMP
  //Route.resource("/stamps", 'StampsController').apiOnly()
  //Route.get('/stamps/next', 'StampsController.next')
  Route.get('/stamps/sequence/:quantity', 'StampsController.sequence')
  Route.get('/stamps', 'StampsController.index')//.middleware('stampPermission:index')
  Route.get('/stamps/:id', 'StampsController.show')//.middleware('stampPermission:show')

  Route.post('/stamps', 'StampsController.store').middleware('stampPermission:create')
  Route.put('/stamps/:id', 'StampsController.update').middleware('stampPermission:update')
  Route.patch('/stamps/:id', 'StampsController.update').middleware('stampPermission:update')
  Route.delete('/stamps/:id', 'StampsController.destroy').middleware('stampPermission:delete')
  //***************************************************************************** */

  //PEOPLE
  Route.resource('/people', 'PeopleController').apiOnly()

  //MARRIED CERTIFICATES
  Route.resource('/married-certificates', 'MarriedCertificatesController')
    .apiOnly()
  //.middleware('*', ['auth'])

  //ORDER CERTIFICATES
  Route.get('/order-certificates/public/marriage-link', 'PublicOrderCertificatesController.manageMarriageLink').middleware('auth')
  Route.patch('/order-certificates/public/marriage-link', 'PublicOrderCertificatesController.toggleMarriageLink').middleware('auth')
  Route.get('/public/order-certificates/marriage/:token', 'PublicOrderCertificatesController.showMarriage')
  Route.post('/public/order-certificates/marriage/:token/visionocr', 'PublicOrderCertificatesController.visionOcrMarriageDocument')
  Route.post('/public/order-certificates/marriage/:token', 'PublicOrderCertificatesController.storeMarriage')
  Route.resource('/order-certificates', 'OrderCertificatesController').apiOnly()


  //IMAGE CERTIFICATES
  Route.get('/imagecertificates/married/:marriedCertificateId', 'ImageCertificatesController.index').middleware('auth')
  Route.get('/imagecertificates/:id/open', 'ImageCertificatesController.show').middleware('auth')
  Route.post('/imagecertificates/:id/visionocr', 'ImageCertificatesController.visionOcr').middleware('auth')
  Route.post('/imagecertificates/uploads', 'ImageCertificatesController.store')

  //SERVICES
  Route.resource('/services', 'ServicesController').apiOnly()
  Route.put('/services/:id/emoluments', 'ServicesController.syncEmoluments')//.middleware('auth:api')

  //RECEIPTS
  Route.resource('/receipts', 'ReceiptsController').apiOnly()


  //TRIBUTATION
  //Route.resource('tributations', 'TributationsController').apiOnly()
  Route.get('/tributations', 'TributationsController.index').middleware('tributationPermission:index')
  Route.get('/tributations/:id', 'TributationsController.show').middleware('tributationPermission:show')

  Route.post('/tributations', 'TributationsController.store').middleware('tributationPermission:create')
  Route.put('/tributations/:id', 'TributationsController.update').middleware('tributationPermission:update')
  Route.patch('/tributations/:id', 'TributationsController.update').middleware('tributationPermission:update')
  Route.delete('/tributations/:id', 'TributationsController.destroy').middleware('tributationPermission:delete')


  //TOKENS_DEVICES
  Route.get('/tokens-devices/authorized', 'TokensDevicesController.authorizedDevices').middleware('auth')
  Route.patch('/tokens-devices/:id/deactivate', 'TokensDevicesController.deactivateDevice').middleware('auth')
  Route.post('/tokens-devices/generate', 'TokensDevicesController.generate').middleware('auth')
  Route.post('/tokens-devices/webauthn/register-options', 'TokensDevicesController.registrationOptions')
  Route.post('/tokens-devices/webauthn/register-verify', 'TokensDevicesController.verifyRegistration')
  Route.post('/tokens-devices/validate', 'TokensDevicesController.validateToken')
  Route.post('/tokens-devices/register-device', 'TokensDevicesController.registerDevice')
  Route.post('/tokens-devices/check-device', 'TokensDevicesController.checkDevice')


  //****************************************************************************************************************** */


  //CONFIG
  //Route.post("/config", "ConfigsController.storeEncryption")

  //rota de teste
  Route.get('dashboard', async ({ auth }) => {
    await auth.use('api').authenticate()
    return auth.use('api').user!
  })
}).prefix('/api')//.middleware(['auth'])
