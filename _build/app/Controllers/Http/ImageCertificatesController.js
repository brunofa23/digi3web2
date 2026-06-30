"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uploadImages_1 = global[Symbol.for('ioc.use')]("App/Services/uploads/uploadImages");
class ImageCertificatesController {
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const companiesId = authenticate.companies_id;
            if (!companiesId) {
                return response.badRequest({ error: 'companyId inválido nos parâmetros da rota' });
            }
            const marriedCertificateIdInput = request.input('marriedCertificateId');
            const marriedCertificateId = marriedCertificateIdInput
                ? Number(marriedCertificateIdInput)
                : null;
            const result = await (0, uploadImages_1.uploadImage)(companiesId, marriedCertificateId, request);
            if (!result) {
                return response.badRequest({ error: 'Arquivo inválido ou não enviado' });
            }
            return response.ok({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                error: 'Erro ao fazer upload da imagem',
                details: error.message,
            });
        }
    }
}
exports.default = ImageCertificatesController;
//# sourceMappingURL=ImageCertificatesController.js.map