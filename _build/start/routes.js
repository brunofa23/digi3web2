"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
Route_1.default.group(() => {
    Route_1.default.get('/', async () => {
        return { hello: 'Sistema de Gerenciamento de Imagens - v99' };
    });
    Route_1.default.get("/books", 'BooksController.index').middleware("level_permission:get");
    Route_1.default.post("/books", 'BooksController.store').middleware("level_permission:post");
    Route_1.default.patch("/books/:id", 'BooksController.update').middleware("level_permission:patch");
    Route_1.default.delete("/books/:id", 'BooksController.destroy').middleware("level_permission:destroy");
    Route_1.default.get('/typebooks', 'TypebooksController.index');
    Route_1.default.get('/typebooks/:id', 'TypebooksController.show').middleware('typebook_permission:get');
    Route_1.default.get('/alltypebook', 'TypebooksController.allTypebook').middleware('typebook_permission:get');
    Route_1.default.post('/typebooks', 'TypebooksController.store').middleware('typebook_permission:post');
    Route_1.default.patch('/typebooks/:id', 'TypebooksController.update').middleware('typebook_permission:patch');
    Route_1.default.delete('/typebooks/:id', 'TypebooksController.destroy').middleware('typebook_permission:destroy');
    Route_1.default.get("/companies", 'CompaniesController.index');
    Route_1.default.get("/companies/:id", 'CompaniesController.show');
    Route_1.default.post("/companies", 'CompaniesController.store').middleware('company_permission:post');
    Route_1.default.patch("/companies/:id", 'CompaniesController.update').middleware('company_permission:patch');
    Route_1.default.get("/users", "UsersController.index");
    Route_1.default.get("/users/:id", "UsersController.show");
    Route_1.default.post("/users", "UsersController.store").middleware('user_permission:post');
    Route_1.default.patch("/users/:id", "UsersController.update").middleware('user_permission:patch');
    Route_1.default.get("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.index');
    Route_1.default.get("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.show');
    Route_1.default.get("/bookrecords/booksummary/:typebooks_id", 'BookrecordsController.bookSummary');
    Route_1.default.post("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController.store').middleware('bookrecord_permission:post');
    Route_1.default.patch("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.update').middleware('bookrecord_permission:patch');
    Route_1.default.delete("/typebooks/:typebooks_id/bookrecords/:id", 'BookrecordsController.destroy').middleware('bookrecord_permission:destroy');
    Route_1.default.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords').middleware('bookrecord_permission:generateOrUpdateBookrecords');
    Route_1.default.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords').middleware('bookrecord_permission:createorupdatebookrecords');
    Route_1.default.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords').middleware('bookrecord_permission:destroyManyBookRecords');
    Route_1.default.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial').middleware('bookrecord_permission:indeximagesinitial');
    Route_1.default.get('/updatedfiles', 'BookrecordsController.updatedFiles');
    Route_1.default.get("/typebooks/:typebooks_id/documents", 'DocumentsController.index');
    Route_1.default.post("/typebooks/:typebooks_id/documents", 'DocumentsController.store');
    Route_1.default.patch("/typebooks/:typebooks_id/documents/:id", 'DocumentsController.update');
    Route_1.default.get("/indeximages", "IndeximagesController.index");
    Route_1.default.get("/indeximages/:id", "IndeximagesController.show");
    Route_1.default.delete("/indeximages/:typebooks_id/:bookrecords_id/:file_name", "IndeximagesController.destroy");
    Route_1.default.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads').middleware('indeximage_permission:uploads');
    Route_1.default.post('/indeximages/download/:id', 'IndeximagesController.download').as('download').middleware('indeximage_permission:download');
    Route_1.default.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture').middleware('indeximage_permission:uploadCapture');
    Route_1.default.post("/login", "AuthenticationController.login");
    Route_1.default.post("/logout", "AuthenticationController.logout");
    Route_1.default.post("/authorizeaccessimages", "AuthenticationController.authorizeAccessImages");
    Route_1.default.post("/resetpassword", "UserPasswordsController.resetPassword");
    Route_1.default.post("/updatepassword", "UserPasswordsController.updatePassword");
    Route_1.default.post("/token", "TokensController.store");
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