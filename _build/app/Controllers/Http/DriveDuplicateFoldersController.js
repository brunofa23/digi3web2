"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DriveDuplicateFolderScanService_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/DriveDuplicateFolderScanService"));
class DriveDuplicateFoldersController {
    constructor() {
        this.service = new DriveDuplicateFolderScanService_1.default();
    }
    async authorized({ auth, response }) {
        const user = await auth.use('api').authenticate();
        if (user.superuser)
            return true;
        response.status(403).send({ message: 'Acesso permitido somente a superusuários.' });
        return false;
    }
    async index(ctx) {
        if (!await this.authorized(ctx))
            return;
        try {
            return ctx.response.status(200).send(await this.service.getSnapshot());
        }
        catch (error) {
            console.error('Erro ao consultar pesquisa de pastas duplicadas:', error);
            return ctx.response.status(500).send({ message: 'Não foi possível consultar a pesquisa de pastas duplicadas.' });
        }
    }
    async refresh(ctx) {
        if (!await this.authorized(ctx))
            return;
        try {
            return ctx.response.status(202).send(await this.service.start());
        }
        catch (error) {
            console.error('Erro ao iniciar pesquisa de pastas duplicadas:', error);
            return ctx.response.status(500).send({ message: 'Não foi possível iniciar a pesquisa de pastas duplicadas.' });
        }
    }
}
exports.default = DriveDuplicateFoldersController;
//# sourceMappingURL=DriveDuplicateFoldersController.js.map