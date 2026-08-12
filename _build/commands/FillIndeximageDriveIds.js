"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
class FillIndeximageDriveIds extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.limit = 20;
        this.dryRun = false;
    }
    async run() {
        const typebooksId = Number(this.typebook);
        const limit = Number(this.limit || 20);
        if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
            this.logger.error('Informe um typebook válido. Exemplo: --typebook=236');
            return;
        }
        if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
            this.logger.error('Informe um limite entre 1 e 200. Exemplo: --limit=20');
            return;
        }
        const typebook = await Typebook_1.default
            .query()
            .preload('company')
            .where('id', typebooksId)
            .first();
        if (!typebook) {
            this.logger.error(`Typebook ${typebooksId} não encontrado.`);
            return;
        }
        if (!typebook.path || !typebook.company?.cloud) {
            this.logger.error('Typebook sem pasta ou empresa sem cloud configurada.');
            return;
        }
        const folder = await (0, googledrive_1.sendSearchFile)(typebook.path, typebook.company.cloud);
        if (!folder?.[0]?.id) {
            this.logger.error(`Pasta não encontrada no Drive: ${typebook.path}`);
            return;
        }
        const images = await Indeximage_1.default
            .query()
            .where('companies_id', typebook.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .where((query) => {
            query.whereNull('drive_file_id');
            query.orWhere('drive_file_id', '');
        })
            .orderBy('updated_at', 'asc')
            .limit(limit);
        if (images.length === 0) {
            this.logger.info('Nenhuma imagem antiga sem drive_file_id encontrada.');
            return;
        }
        const result = {
            processed: 0,
            updated: 0,
            notFound: 0,
            duplicated: 0,
            errors: 0,
        };
        this.logger.info(`Processando ${images.length} imagem(ns) do typebook ${typebooksId}.`);
        for (const image of images) {
            result.processed++;
            try {
                const foundFiles = await (0, googledrive_1.sendSearchFile)(image.file_name, typebook.company.cloud, folder[0].id);
                if (!Array.isArray(foundFiles) || foundFiles.length === 0) {
                    result.notFound++;
                    this.logger.warning(`Não encontrado: ${image.file_name}`);
                    continue;
                }
                if (foundFiles.length > 1) {
                    result.duplicated++;
                    this.logger.warning(`Duplicado no Drive: ${image.file_name}`);
                    continue;
                }
                if (this.dryRun) {
                    this.logger.info(`[dry-run] ${image.file_name} -> ${foundFiles[0].id}`);
                    continue;
                }
                await Indeximage_1.default
                    .query()
                    .where('companies_id', image.companies_id)
                    .andWhere('typebooks_id', image.typebooks_id)
                    .andWhere('bookrecords_id', image.bookrecords_id)
                    .andWhere('seq', image.seq)
                    .where((query) => {
                    query.whereNull('drive_file_id');
                    query.orWhere('drive_file_id', '');
                })
                    .update({
                    drive_file_id: foundFiles[0].id,
                });
                result.updated++;
                this.logger.success(`Atualizado: ${image.file_name}`);
            }
            catch (error) {
                result.errors++;
                this.logger.error(`Erro ao processar ${image.file_name}: ${error.message || error}`);
            }
        }
        this.logger.info(`Resumo: processados=${result.processed}, atualizados=${result.updated}, não encontrados=${result.notFound}, duplicados=${result.duplicated}, erros=${result.errors}`);
    }
}
FillIndeximageDriveIds.commandName = 'indeximages:fill-drive-ids';
FillIndeximageDriveIds.description = 'Preenche drive_file_id de indeximages antigas em lotes pequenos';
FillIndeximageDriveIds.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.number({ description: 'ID do typebook que será processado' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "typebook", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Quantidade máxima de imagens para processar' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "limit", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Apenas simula a busca, sem atualizar o banco' }),
    __metadata("design:type", Boolean)
], FillIndeximageDriveIds.prototype, "dryRun", void 0);
exports.default = FillIndeximageDriveIds;
//# sourceMappingURL=FillIndeximageDriveIds.js.map