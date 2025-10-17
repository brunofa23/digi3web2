"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
Route_1.default.group(() => {
    Route_1.default.get('/', async () => {
        return { hello: 'Sistema de Gerenciamento de Imagens - v107' };
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
    Route_1.default.resource("events", "EventsController").apiOnly();
    Route_1.default.post("/tokentoimages", "TokenToImagesController.store");
    Route_1.default.post("/verifytokentoimages", "TokenToImagesController.verifyTokenToImages");
    Route_1.default.post("/readfile", "ReadFilesController.readFile");
    Route_1.default.post("/sendmailcontactwebsite", "MailmanangersController.sendMailContactWebsite");
    Route_1.default.resource("/finemps", "FinEmpsController").apiOnly();
    Route_1.default.resource("/finclasses", "FinClassesController").apiOnly();
    Route_1.default.resource("/finaccounts", "FinAccountsController").apiOnly()
        .middleware({ index: ['finaccount_permission:get'],
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
    Route_1.default.get('dashboard', async ({ auth }) => {
        await auth.use('api').authenticate();
        return auth.use('api').user;
    });
}).prefix('/api');
Route_1.default.get('/api/test/middleware/level', ({ response }) => {
    return response.json({ ok: true });
}).middleware('level_permission:3');
Route_1.default.group(() => {
    Route_1.default.get('/test', ({ response }) => {
        return response.json({ ok: true });
    }).middleware('level_permission:4');
}).prefix('/api/company/:company_id').middleware('company_permission');
//# sourceMappingURL=routes.js.map