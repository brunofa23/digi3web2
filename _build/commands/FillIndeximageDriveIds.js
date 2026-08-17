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
        this.repeat = false;
        this.sleep = 15;
        this.maxRounds = 50;
        this.ignoredImageKeys = new Set();
    }
    async run() {
        const typebooksId = Number(this.typebook);
        const companiesId = Number(this.company);
        const limit = Number(this.limit || 20);
        const sleepSeconds = Number(this.sleep || 15);
        const maxRounds = Number(this.maxRounds || 50);
        if (!Number.isInteger(companiesId) || companiesId <= 0) {
            this.logger.error('Informe uma empresa válida. Exemplo: --typebook=236 --company=10');
            return;
        }
        const hasTypebookFilter = Number.isInteger(typebooksId) && typebooksId > 0;
        if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
            this.logger.error('Informe um limite entre 1 e 200. Exemplo: --limit=20');
            return;
        }
        if (!Number.isInteger(sleepSeconds) || sleepSeconds < 1 || sleepSeconds > 300) {
            this.logger.error('Informe uma pausa entre 1 e 300 segundos. Exemplo: --sleep=15');
            return;
        }
        if (!Number.isInteger(maxRounds) || maxRounds < 1 || maxRounds > 1000) {
            this.logger.error('Informe max-rounds entre 1 e 1000. Exemplo: --max-rounds=50');
            return;
        }
        if (!hasTypebookFilter && this.dryRun) {
            this.logger.warning('Dry-run sem typebook pode consultar muitos livros. Use --typebook para teste inicial ou mantenha --max-rounds baixo.');
        }
        const typebooks = await this.getTypebooks(companiesId, hasTypebookFilter ? typebooksId : null);
        if (typebooks.length === 0) {
            this.logger.info(hasTypebookFilter
                ? `Typebook ${typebooksId} da empresa ${companiesId} não encontrado ou sem pendências.`
                : `Nenhum typebook com imagens antigas sem drive_file_id encontrado para a empresa ${companiesId}.`);
            return;
        }
        let round = 0;
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalNotFound = 0;
        let totalDuplicated = 0;
        let totalErrors = 0;
        do {
            round++;
            if (this.repeat) {
                this.logger.info(`Rodada ${round}/${maxRounds}`);
            }
            const result = await this.processTypebooks(typebooks, limit);
            totalProcessed += result.processed;
            totalUpdated += result.updated;
            totalNotFound += result.notFound;
            totalDuplicated += result.duplicated;
            totalErrors += result.errors;
            if (result.pending === 0 || !this.repeat || round >= maxRounds)
                break;
            this.logger.info(`Aguardando ${sleepSeconds} segundo(s) para o próximo lote.`);
            await new Promise((resolve) => setTimeout(resolve, sleepSeconds * 1000));
        } while (this.repeat);
        if (this.repeat) {
            this.logger.info(`Resumo geral: rodadas=${round}, processados=${totalProcessed}, atualizados=${totalUpdated}, não encontrados=${totalNotFound}, duplicados=${totalDuplicated}, erros=${totalErrors}`);
        }
    }
    async getTypebooks(companiesId, typebooksId) {
        const query = Typebook_1.default
            .query()
            .preload('company')
            .where('companies_id', companiesId)
            .whereHas('typebooks', (indeximageQuery) => {
            indeximageQuery.where('companies_id', companiesId);
            indeximageQuery.where((query) => {
                query.whereNull('drive_file_id');
                query.orWhere('drive_file_id', '');
            });
        })
            .orderBy('id', 'asc');
        if (typebooksId) {
            query.andWhere('id', typebooksId);
        }
        return query;
    }
    async processTypebooks(typebooks, limit) {
        let remainingLimit = limit;
        const result = {
            pending: 0,
            processed: 0,
            updated: 0,
            notFound: 0,
            duplicated: 0,
            errors: 0,
        };
        for (const typebook of typebooks) {
            if (remainingLimit <= 0)
                break;
            const batchResult = await this.processTypebook(typebook, remainingLimit);
            result.pending += batchResult.pending;
            result.processed += batchResult.processed;
            result.updated += batchResult.updated;
            result.notFound += batchResult.notFound;
            result.duplicated += batchResult.duplicated;
            result.errors += batchResult.errors;
            remainingLimit -= batchResult.processed;
        }
        return result;
    }
    async processTypebook(typebook, limit) {
        const emptyResult = {
            pending: 0,
            processed: 0,
            updated: 0,
            notFound: 0,
            duplicated: 0,
            errors: 0,
        };
        if (!typebook.path || !typebook.company?.cloud) {
            this.logger.warning(`Typebook ${typebook.id} sem pasta ou empresa sem cloud configurada.`);
            return emptyResult;
        }
        const folder = await (0, googledrive_1.sendSearchFile)(typebook.path, typebook.company.cloud);
        if (!folder?.[0]?.id) {
            this.logger.warning(`Pasta não encontrada no Drive para typebook ${typebook.id}: ${typebook.path}`);
            return emptyResult;
        }
        return this.processBatch(typebook, folder[0].id, limit);
    }
    async processBatch(typebook, folderId, limit) {
        const queryLimit = Math.min(limit + this.ignoredImageKeys.size, 1000);
        const candidateImages = await Indeximage_1.default
            .query()
            .where('companies_id', typebook.companies_id)
            .andWhere('typebooks_id', typebook.id)
            .where((query) => {
            query.whereNull('drive_file_id');
            query.orWhere('drive_file_id', '');
        })
            .orderBy('updated_at', 'asc')
            .limit(queryLimit);
        const images = candidateImages
            .filter((image) => !this.ignoredImageKeys.has(this.getImageKey(image)))
            .slice(0, limit);
        if (images.length === 0) {
            this.logger.info('Nenhuma imagem antiga sem drive_file_id encontrada.');
            return {
                pending: 0,
                processed: 0,
                updated: 0,
                notFound: 0,
                duplicated: 0,
                errors: 0,
            };
        }
        const result = {
            pending: images.length,
            processed: 0,
            updated: 0,
            notFound: 0,
            duplicated: 0,
            errors: 0,
        };
        this.logger.info(`Processando ${images.length} imagem(ns) do typebook ${typebook.id}.`);
        for (const image of images) {
            result.processed++;
            try {
                const foundFiles = await (0, googledrive_1.sendSearchFile)(image.file_name, typebook.company.cloud, folderId);
                if (!Array.isArray(foundFiles) || foundFiles.length === 0) {
                    result.notFound++;
                    this.ignoredImageKeys.add(this.getImageKey(image));
                    this.logger.warning(`Não encontrado: ${image.file_name}`);
                    continue;
                }
                if (foundFiles.length > 1) {
                    result.duplicated++;
                    this.ignoredImageKeys.add(this.getImageKey(image));
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
                this.ignoredImageKeys.add(this.getImageKey(image));
                this.logger.error(`Erro ao processar ${image.file_name}: ${error.message || error}`);
            }
        }
        this.logger.info(`Resumo: processados=${result.processed}, atualizados=${result.updated}, não encontrados=${result.notFound}, duplicados=${result.duplicated}, erros=${result.errors}`);
        return result;
    }
    getImageKey(image) {
        return [
            image.companies_id,
            image.typebooks_id,
            image.bookrecords_id,
            image.seq,
        ].join(':');
    }
}
FillIndeximageDriveIds.commandName = 'indeximages:fill-drive-ids';
FillIndeximageDriveIds.description = 'Preenche drive_file_id de indeximages antigas em lotes pequenos';
FillIndeximageDriveIds.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.number({ description: 'ID do typebook que será processado. Se omitido, processa os typebooks da empresa' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "typebook", void 0);
__decorate([
    standalone_1.flags.number({ description: 'ID da empresa dona do typebook' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "company", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Quantidade máxima de imagens para processar' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "limit", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Apenas simula a busca, sem atualizar o banco' }),
    __metadata("design:type", Boolean)
], FillIndeximageDriveIds.prototype, "dryRun", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Continua processando novos lotes até finalizar ou atingir max-rounds' }),
    __metadata("design:type", Boolean)
], FillIndeximageDriveIds.prototype, "repeat", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Pausa em segundos entre lotes quando usar repeat' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "sleep", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Quantidade máxima de rodadas quando usar repeat' }),
    __metadata("design:type", Number)
], FillIndeximageDriveIds.prototype, "maxRounds", void 0);
exports.default = FillIndeximageDriveIds;
//# sourceMappingURL=FillIndeximageDriveIds.js.map