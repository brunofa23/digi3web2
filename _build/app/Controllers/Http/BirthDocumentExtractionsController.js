"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const BirthDocumentExtraction_1 = global[Symbol.for('ioc.use')]("App/Services/ai/BirthDocumentExtraction");
class BirthDocumentExtractionsController {
    async storeDeath({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const file = request.file('file', { size: '8mb', extnames: ['jpg', 'jpeg', 'png', 'pdf'] });
        if (!file?.isValid || !file.tmpPath)
            return response.badRequest({ message: 'Envie uma imagem JPG/PNG ou PDF de até 8 MB.' });
        try {
            return response.ok(await (0, BirthDocumentExtraction_1.extractBirthDocument)({
                fileBuffer: await (0, promises_1.readFile)(file.tmpPath), fileName: file.clientName || '',
                documentType: 'DocumentDeceased', companiesId: user.companies_id, userId: user.id,
            }));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'AI_NOT_CONFIGURED') {
                return response.serviceUnavailable({ message: 'Leitura inteligente ainda não configurada.' });
            }
            console.error('Erro na pré-leitura do documento de óbito:', error instanceof Error ? error.message : error);
            return response.internalServerError({ message: 'Não foi possível ler o documento. Preencha os campos manualmente.' });
        }
    }
    async store({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const documentType = String(request.input('documentType') || '');
        const allowedTypes = [
            'DocumentRegistered', 'DnvDocument', 'DocumentFiliation1', 'ProofResidenceFiliation1',
            'DocumentFiliation2', 'ProofResidenceFiliation2', 'DocumentDeclarant', 'ProofResidenceDeclarant',
        ];
        if (!allowedTypes.includes(documentType))
            return response.badRequest({ message: 'Tipo de anexo inválido.' });
        const file = request.file('file', {
            size: '8mb',
            extnames: ['jpg', 'jpeg', 'png', 'pdf'],
        });
        if (!file?.isValid || !file.tmpPath)
            return response.badRequest({ message: 'Envie uma imagem JPG/PNG ou PDF de até 8 MB.' });
        try {
            return response.ok(await (0, BirthDocumentExtraction_1.extractBirthDocument)({
                fileBuffer: await (0, promises_1.readFile)(file.tmpPath),
                fileName: file.clientName || '',
                documentType,
                companiesId: user.companies_id,
                userId: user.id,
            }));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'AI_NOT_CONFIGURED') {
                return response.serviceUnavailable({ message: 'Leitura inteligente ainda não configurada.' });
            }
            console.error('Erro na pré-leitura do anexo de nascimento:', error instanceof Error ? error.message : error);
            return response.internalServerError({ message: 'Não foi possível ler o anexo. Preencha os campos manualmente.' });
        }
    }
}
exports.default = BirthDocumentExtractionsController;
//# sourceMappingURL=BirthDocumentExtractionsController.js.map