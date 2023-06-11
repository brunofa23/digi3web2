"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
Route_1.default.group(() => {
    Route_1.default.get('/', async () => {
        return { hello: 'Hello World v58' };
    });
    Route_1.default.get("/books", 'BooksController.index').middleware("level_permission:get");
    Route_1.default.post("/books", 'BooksController.store').middleware("level_permission:post");
    Route_1.default.patch("/books/:id", 'BooksController.update').middleware("level_permission:patch");
    Route_1.default.delete("/books/:id", 'BooksController.destroy').middleware("level_permission:destroy");
    Route_1.default.get('/typebooks', 'TypebooksController.index');
    Route_1.default.get('/typebooks/:id', 'TypebooksController.show').middleware('typebook_permission:get');
    Route_1.default.post('/typebooks', 'TypebooksController.store').middleware('typebook_permission:post');
    Route_1.default.patch('/typebooks/:id', 'TypebooksController.update').middleware('typebook_permission:patch');
    Route_1.default.delete('/typebooks/:id', 'TypebooksController.destroy').middleware('typebook_permission:destroy');
    Route_1.default.resource("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController').apiOnly();
    Route_1.default.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords');
    Route_1.default.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords');
    Route_1.default.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords');
    Route_1.default.post('/typebooks/:typebooks_id/indeximagesinitial', 'BookrecordsController.indeximagesinitial');
    Route_1.default.resource("/indeximages", "IndeximagesController").apiOnly();
    Route_1.default.post('/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'IndeximagesController.uploads').as('uploads');
    Route_1.default.post('/indeximages/download/:id', 'IndeximagesController.download').as('download');
    Route_1.default.post('/typebooks/:typebooks_id/indeximages/uploadcapture', 'IndeximagesController.uploadCapture');
    Route_1.default.resource("/users", "UsersController").apiOnly();
    Route_1.default.post("/login", "AuthenticationController.login");
    Route_1.default.post("/logout", "AuthenticationController.logout");
    Route_1.default.get('dashboard', async ({ auth }) => {
        await auth.use('api').authenticate();
        return auth.use('api').user;
    });
}).prefix('/api');
Route_1.default.group(() => {
    Route_1.default.resource("/companies", 'CompaniesController').apiOnly();
}).prefix('/api').middleware('level_permission:superuser');
Route_1.default.get('/api/test/middleware/level', ({ response }) => {
    return response.json({ ok: true });
}).middleware('level_permission:3');
Route_1.default.group(() => {
    Route_1.default.get('/test', ({ response }) => {
        return response.json({ ok: true });
    }).middleware('level_permission:4');
}).prefix('/api/company/:company_id').middleware('company_permission');
//# sourceMappingURL=routes.js.map