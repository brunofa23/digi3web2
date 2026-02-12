"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class ReceiptValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            orderCertificateId: Validator_1.schema.number([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'order_certificates', column: 'id' }),
            ]),
            serviceId: Validator_1.schema.number([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'services', column: 'id' }),
            ]),
            free: Validator_1.schema.boolean.optional(),
            applicant: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(90)]),
            cpfApplicant: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(11),
                Validator_1.rules.minLength(11),
                Validator_1.rules.regex(/^\d{11}$/),
            ]),
            registered1: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(90)]),
            cpfRegistered1: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(11),
                Validator_1.rules.minLength(11),
                Validator_1.rules.regex(/^\d{11}$/),
            ]),
            registered2: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(90)]),
            cpfRegistered2: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(11),
                Validator_1.rules.minLength(11),
                Validator_1.rules.regex(/^\d{11}$/),
            ]),
            typebookId: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'typebooks', column: 'id' }),
            ]),
            book: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            sheet: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            side: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(50)]),
            datePrevision: Validator_1.schema.date.optional(),
            dateProtocol: Validator_1.schema.date.optional(),
            dateStamp: Validator_1.schema.date.optional(),
            dateMarriage: Validator_1.schema.date.optional(),
            securitySheet: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(50)]),
            habilitationProccess: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(50)]),
            stamps: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(255)]),
            tributationId: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'tributations', column: 'id' }),
            ]),
            status: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(15)]),
            items: Validator_1.schema.array.optional().members(Validator_1.schema.object().members({
                emolumentId: Validator_1.schema.number([Validator_1.rules.exists({ table: 'emoluments', column: 'id' })]),
                qtde: Validator_1.schema.number.optional(),
                amount: Validator_1.schema.number.optional(),
            })),
        });
        this.messages = {
            'companiesId.required': 'companiesId é obrigatório',
            'orderCertificateId.required': 'orderCertificateId é obrigatório',
            'serviceId.required': 'serviceId é obrigatório',
            'userId.required': 'userId é obrigatório',
            'cpfApplicant.regex': 'cpfApplicant deve conter apenas 11 dígitos',
            'cpfRegistered1.regex': 'cpfRegistered1 deve conter apenas 11 dígitos',
            'cpfRegistered2.regex': 'cpfRegistered2 deve conter apenas 11 dígitos',
        };
    }
}
exports.default = ReceiptValidator;
//# sourceMappingURL=ReceiptValidator.js.map