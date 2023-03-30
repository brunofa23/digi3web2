"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");
Route_1.default.group(() => {
    Route_1.default.get('/', async () => {
        return { hello: 'Hello World v32' };
    });
    Route_1.default.resource("/books", 'BooksController').apiOnly();
    Route_1.default.resource("/companies", 'CompaniesController').apiOnly();
    Route_1.default.resource("/typebooks", 'TypebooksController').apiOnly();
    Route_1.default.resource("/typebooks/:typebooks_id/bookrecords", 'BookrecordsController').apiOnly();
    Route_1.default.post("typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords');
    Route_1.default.patch("bookrecords/createorupdatebookrecords", 'BookrecordsController.createorupdatebookrecords');
    Route_1.default.post("bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords');
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
    Route_1.default.get('/test', async () => {
        return Application_1.default.configPath('tokens/token.json');
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