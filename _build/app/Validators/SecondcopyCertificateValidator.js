"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SecondcopyCertificateValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            documenttypeId: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'documenttypes', column: 'id' }),
            ]),
            paymentMethod: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(10),
            ]),
            applicant: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'people', column: 'id' }),
            ]),
            registered1: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'people', column: 'id' }),
            ]),
            typebookId: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'typebooks', column: 'id' }),
            ]),
            book1: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            sheet1: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            term1: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(10)
            ]),
            city1: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            registered2: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
                Validator_1.rules.exists({ table: 'people', column: 'id' }),
            ]),
            book2: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            sheet2: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            city2: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            obs: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            inactive: Validator_1.schema.boolean.optional()
        });
        this.messages = {
            'documenttypeId.exists': 'Tipo de documento inválido',
            'paymentMethod.maxLength': 'Forma de pagamento deve ter no máximo 10 caracteres',
            'applicant.exists': 'Solicitante inválido',
            'registered1.exists': 'Registrado 1 inválido',
            'registered2.exists': 'Registrado 2 inválido',
            'book1.unsigned': 'Livro 1 inválido',
            'sheet1.unsigned': 'Folha 1 inválida',
            'book2.unsigned': 'Livro 2 inválido',
            'sheet2.unsigned': 'Folha 2 inválida',
        };
    }
}
exports.default = SecondcopyCertificateValidator;
//# sourceMappingURL=SecondcopyCertificateValidator.js.map