"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmployeeVerification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerification"));
const EmployeeVerificationXCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXCertificate"));
const MarriedCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/MarriedCertificate"));
const BornCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/BornCertificate"));
const EmployeeVerificationXCertificateValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/EmployeeVerificationXCertificateValidator"));
class EmployeeVerificationXCertificatesController {
    async index({ auth, request }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const { married_certificate_id, born_certificate_id, employee_verification_id } = request.qs();
        const query = EmployeeVerificationXCertificate_1.default.query()
            .where('companiesId', companiesId);
        if (married_certificate_id) {
            query.where('marriedCertificateId', Number(married_certificate_id));
        }
        if (born_certificate_id) {
            query.where('bornCertificateId', Number(born_certificate_id));
        }
        if (employee_verification_id) {
            query.where('employeeVerificationId', Number(employee_verification_id));
        }
        return query
            .preload('marriedCertificate')
            .preload('bornCertificate')
            .preload('employeeVerification')
            .preload('company')
            .preload('user');
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const userId = authenticate.id;
        const payload = await request.validate({
            schema: EmployeeVerificationXCertificateValidator_1.default.createSchema,
            messages: EmployeeVerificationXCertificateValidator_1.default.messages,
        });
        const hasMarriedCertificate = payload.marriedCertificateId !== undefined;
        const hasBornCertificate = payload.bornCertificateId !== undefined;
        if (hasMarriedCertificate === hasBornCertificate) {
            return response.status(422).json({
                message: 'Informe exatamente um certificado de casamento ou de nascimento',
            });
        }
        const certificate = hasMarriedCertificate
            ? await MarriedCertificate_1.default.query()
                .where('id', payload.marriedCertificateId)
                .where('companiesId', companiesId)
                .first()
            : await BornCertificate_1.default.query()
                .where('id', payload.bornCertificateId)
                .where('companiesId', companiesId)
                .first();
        if (!certificate) {
            return response.status(422).json({
                message: hasMarriedCertificate
                    ? 'O certificado de casamento informado não pertence a esta empresa'
                    : 'O certificado de nascimento informado não pertence a esta empresa',
            });
        }
        const verification = await EmployeeVerification_1.default.query()
            .where('id', payload.employeeVerificationId)
            .where('companiesId', companiesId)
            .where('local', 'certificate')
            .where('inactive', false)
            .first();
        if (!verification) {
            return response.status(422).json({
                message: 'A conferência de funcionário informada não está disponível para certificados nesta empresa',
            });
        }
        const alreadyExistsQuery = EmployeeVerificationXCertificate_1.default.query()
            .where('employeeVerificationId', payload.employeeVerificationId)
            .where('companiesId', companiesId);
        if (hasMarriedCertificate) {
            alreadyExistsQuery.where('marriedCertificateId', payload.marriedCertificateId);
        }
        else {
            alreadyExistsQuery.where('bornCertificateId', payload.bornCertificateId);
        }
        const alreadyExists = await alreadyExistsQuery.first();
        if (alreadyExists) {
            return response.status(409).json({
                message: 'Já existe um vínculo para este certificado e conferência de funcionário nesta empresa',
            });
        }
        const item = await EmployeeVerificationXCertificate_1.default.create({
            marriedCertificateId: payload.marriedCertificateId ?? null,
            bornCertificateId: payload.bornCertificateId ?? null,
            companiesId,
            employeeVerificationId: payload.employeeVerificationId,
            userId,
            status: payload.status ?? '',
            date: payload.date,
        });
        await item.refresh();
        return item;
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const item = await EmployeeVerificationXCertificate_1.default.query()
            .where('id', params.id)
            .where('companiesId', companiesId)
            .preload('marriedCertificate')
            .preload('bornCertificate')
            .preload('employeeVerification')
            .preload('company')
            .preload('user')
            .first();
        if (!item) {
            return response.status(404).json({
                message: 'Registro não encontrado',
            });
        }
        return item;
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const item = await EmployeeVerificationXCertificate_1.default.query()
            .where('id', params.id)
            .where('companiesId', companiesId)
            .first();
        if (!item) {
            return response.status(404).json({
                message: 'Registro não encontrado',
            });
        }
        const payload = await request.validate({
            schema: EmployeeVerificationXCertificateValidator_1.default.updateSchema,
            messages: EmployeeVerificationXCertificateValidator_1.default.messages,
        });
        const hasMarriedCertificate = payload.marriedCertificateId !== undefined;
        const hasBornCertificate = payload.bornCertificateId !== undefined;
        if (hasMarriedCertificate && hasBornCertificate) {
            return response.status(422).json({
                message: 'Informe apenas um certificado de casamento ou de nascimento',
            });
        }
        if (payload.employeeVerificationId !== undefined) {
            const verification = await EmployeeVerification_1.default.query()
                .where('id', payload.employeeVerificationId)
                .where('companiesId', companiesId)
                .where('local', 'certificate')
                .where('inactive', false)
                .first();
            if (!verification) {
                return response.status(422).json({
                    message: 'A conferência de funcionário informada não está disponível para certificados nesta empresa',
                });
            }
            item.employeeVerificationId = payload.employeeVerificationId;
        }
        if (payload.marriedCertificateId !== undefined) {
            const certificate = await MarriedCertificate_1.default.query()
                .where('id', payload.marriedCertificateId)
                .where('companiesId', companiesId)
                .first();
            if (!certificate) {
                return response.status(422).json({
                    message: 'O certificado de casamento informado não pertence a esta empresa',
                });
            }
            item.marriedCertificateId = payload.marriedCertificateId;
            item.bornCertificateId = null;
        }
        if (payload.bornCertificateId !== undefined) {
            const certificate = await BornCertificate_1.default.query()
                .where('id', payload.bornCertificateId)
                .where('companiesId', companiesId)
                .first();
            if (!certificate) {
                return response.status(422).json({
                    message: 'O certificado de nascimento informado não pertence a esta empresa',
                });
            }
            item.bornCertificateId = payload.bornCertificateId;
            item.marriedCertificateId = null;
        }
        if (payload.status !== undefined) {
            item.status = payload.status;
        }
        if (payload.date !== undefined) {
            item.date = payload.date;
        }
        await item.save();
        await item.refresh();
        return item;
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const item = await EmployeeVerificationXCertificate_1.default.query()
            .where('id', params.id)
            .where('companiesId', companiesId)
            .first();
        if (!item) {
            return response.status(404).json({
                message: 'Registro não encontrado',
            });
        }
        await item.delete();
        return response.status(204);
    }
}
exports.default = EmployeeVerificationXCertificatesController;
//# sourceMappingURL=EmployeeVerificationXCertificatesController.js.map