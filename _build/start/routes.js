"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
Route_1.default.group(() => {
    Route_1.default.get('/', async () => {
        return { hello: 'Sistema de Gerenciamento de Imagens - v110 - UTILIZANDO DOCKERFILE' };
    });
    Route_1.default.get("/books", 'BooksController.index');
    Route_1.default.post("/books", 'BooksController.store');
    Route_1.default.patch("/books/:id", 'BooksController.update');
    Route_1.default.delete("/books/:id", 'BooksController.destroy');
    Route_1.default.get('/typebooks', 'TypebooksController.index');
    Route_1.default.get('/typebooks/:id', 'TypebooksController.show');
    Route_1.default.get('/alltypebook', 'TypebooksController.allTypebook');
    Route_1.default.post('/typebooks', 'TypebooksController.store');
    Route_1.default.patch('/typebooks/:id', 'TypebooksController.update');
    Route_1.default.delete('/typebooks/:id', 'TypebooksController.destroy');
    Route_1.default.get("/companies", 'CompaniesController.index');
    Route_1.default.get("/companies/:id", 'CompaniesController.show');
    Route_1.default.post("/companies", 'CompaniesController.store');
    Route_1.default.patch("/companies/:id", 'CompaniesController.update');
    Route_1.default.get("/users", "UsersController.index");
    Route_1.default.get("/users/:id", "UsersController.show");
    Route_1.default.get("/accessimage/:id", "UsersController.accessImage");
    Route_1.default.post("/users", "UsersController.store");
    Route_1.default.patch("/users/:id", "UsersController.update");
    Route_1.default.post("/closeaccesimage/:id", "UsersController.closeAccesImage");
    Route_1.default.resource('/usergroups', "UsergroupsController").apiOnly();
    Route_1.default.resource("/groupxpermissions", "GroupxpermissionsController").apiOnly();
    Route_1.default.get("/permissiongroupxusergroup/:usergroup_id", "GroupxpermissionsController.PermissiongroupXUsergroup");
    Route_1.default.get("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.index');
    Route_1.default.get("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.show');
    Route_1.default.get("/bookrecords/booksummary/:typebooks_id", 'BookrecordsController.bookSummary');
    Route_1.default.post("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.store').middleware('bookrecord_permission:post');
    Route_1.default.patch("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.update');
    Route_1.default.delete("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.destroy').middleware('bookrecord_permission:destroy');
    Route_1.default.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords').middleware('bookrecord_permission:generateOrUpdateBookrecords');
    Route_1.default.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords2", 'BookrecordsController.generateOrUpdateBookrecords2').middleware('bookrecord_permission:generateOrUpdateBookrecords');
    Route_1.default.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords').middleware('bookrecord_permission:createorupdatebookrecords');
    Route_1.default.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords').middleware('bookrecord_permission:destroyManyBookRecords');
    Route_1.default.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial');
    Route_1.default.get('/updatedfiles', 'BookrecordsController.updatedFiles');
    Route_1.default.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecordsdocument", 'BookrecordsController.generateOrUpdateBookrecordsDocument').middleware('bookrecord_permission:generateOrUpdateBookrecords');
    Route_1.default.get("/fastfind", 'BookrecordsController.fastFind').middleware('bookrecord_permission:fastfind');
    Route_1.default.get("/fastfinddocuments", 'BookrecordsController.fastFindDocuments').middleware('bookrecord_permission:fastfind');
    Route_1.default.get("/maxbookrecord", 'BookrecordsController.maxBookRecord');
    Route_1.default.get("/sheetwithside/:typebooks_id/:book", 'BookrecordsController.sheetWithSide');
    Route_1.default.get("/typebooks/:typebooks_id/documents", 'DocumentsController.index');
    Route_1.default.post("/typebooks/:typebooks_id/documents", 'DocumentsController.store');
    Route_1.default.patch("/typebooks/:typebooks_id/documents/:id", 'DocumentsController.update');
    Route_1.default.resource("documentconfig", "DocumentconfigsController");
    Route_1.default.resource("documenttypes", "DocumentTypesController").apiOnly();
    Route_1.default.resource("documenttypebooks", "DocumentTypeBooksController").apiOnly();
    Route_1.default.resource('/emoluments', 'EmolumentsController').apiOnly();
    Route_1.default.get("/indeximages", "IndeximagesController.index");
    Route_1.default.get("/indeximages/:id", "IndeximagesController.show");
    Route_1.default.delete("/indeximages/:typebooks_id/:bookrecords_id/:file_name", "IndeximagesController.destroy");
    Route_1.default.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads');
    Route_1.default.post('/indeximages/download/:id', 'IndeximagesController.download').as('download');
    Route_1.default.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture');
    Route_1.default.post("/login", "AuthenticationController.login");
    Route_1.default.post("/logout", "AuthenticationController.logout");
    Route_1.default.post("/authorizeaccessimages", "AuthenticationController.authorizeAccessImages");
    Route_1.default.post("/resetpassword", "UserPasswordsController.resetPassword");
    Route_1.default.post("/updatepassword", "UserPasswordsController.updatePassword");
    Route_1.default.post("/token", "TokensController.store");
    Route_1.default.resource("eventtypes", "EventtypesController").apiOnly();
    Route_1.default.resource("employeeverifications", "EmployeeVerificationsController").apiOnly();
    Route_1.default.resource("employeeverificationxreceipts", "EmployeeVerificationXReceiptsController").apiOnly();
    Route_1.default.resource("events", "EventsController").apiOnly();
    Route_1.default.post("/tokentoimages", "TokenToImagesController.store");
    Route_1.default.post("/verifytokentoimages", "TokenToImagesController.verifyTokenToImages");
    Route_1.default.post("/readfile", "ReadFilesController.readFile");
    Route_1.default.post("/sendmailcontactwebsite", "MailmanangersController.sendMailContactWebsite");
    Route_1.default.resource("/finemps", "FinEmpsController").apiOnly();
    Route_1.default.resource("/finclasses", "FinClassesController").apiOnly();
    Route_1.default.resource("/finaccounts", "FinAccountsController").apiOnly()
        .middleware({
        index: ['finaccount_permission:get'],
        show: ['finaccount_permission:show'],
        store: ['finaccount_permission:create'],
        update: ['finaccount_permission:update']
    });
    Route_1.default.post("/finaccounts/createmany", "FinAccountsController.createMany");
    Route_1.default.post("/finaccounts/replicate", "FinAccountsController.replicate");
    Route_1.default.resource("/finimages", "FinImagesController").apiOnly();
    Route_1.default.post('/finimages/downloadfinimage', 'FinImagesController.downloadfinimage').as('downloadfinimage');
    Route_1.default.resource("/finpaymentmethods", 'FinPaymentMethodsController').apiOnly();
    Route_1.default.resource("/finentities", 'FinEntitiesController').apiOnly();
    Route_1.default.resource("/statuses", 'StatusesController').apiOnly();
    Route_1.default.get('/stamps/sequence/:quantity', 'StampsController.sequence');
    Route_1.default.get('/stamps', 'StampsController.index');
    Route_1.default.get('/stamps/:id', 'StampsController.show');
    Route_1.default.post('/stamps', 'StampsController.store').middleware('stampPermission:create');
    Route_1.default.put('/stamps/:id', 'StampsController.update').middleware('stampPermission:update');
    Route_1.default.patch('/stamps/:id', 'StampsController.update').middleware('stampPermission:update');
    Route_1.default.delete('/stamps/:id', 'StampsController.destroy').middleware('stampPermission:delete');
    Route_1.default.resource('/people', 'PeopleController').apiOnly();
    Route_1.default.resource('/married-certificates', 'MarriedCertificatesController')
        .apiOnly();
    Route_1.default.resource('/order-certificates', 'OrderCertificatesController').apiOnly();
    Route_1.default.post('/imagecertificates/uploads', 'ImageCertificatesController.store');
    Route_1.default.resource('/services', 'ServicesController').apiOnly();
    Route_1.default.put('/services/:id/emoluments', 'ServicesController.syncEmoluments');
    Route_1.default.resource('/receipts', 'ReceiptsController').apiOnly();
    Route_1.default.get('/tributations', 'TributationsController.index').middleware('tributationPermission:index');
    Route_1.default.get('/tributations/:id', 'TributationsController.show').middleware('tributationPermission:show');
    Route_1.default.post('/tributations', 'TributationsController.store').middleware('tributationPermission:create');
    Route_1.default.put('/tributations/:id', 'TributationsController.update').middleware('tributationPermission:update');
    Route_1.default.patch('/tributations/:id', 'TributationsController.update').middleware('tributationPermission:update');
    Route_1.default.delete('/tributations/:id', 'TributationsController.destroy').middleware('tributationPermission:delete');
    Route_1.default.get('dashboard', async ({ auth }) => {
        await auth.use('api').authenticate();
        return auth.use('api').user;
    });
}).prefix('/api');
//# sourceMappingURL=routes.js.map