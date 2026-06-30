"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class StampValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = this.ctx.request.method() === 'POST'
            ? Validator_1.schema.create({
                serial: Validator_1.schema.string({ trim: true }, [
                    Validator_1.rules.maxLength(5),
                ]),
                start: Validator_1.schema.number([
                    Validator_1.rules.unsigned(),
                ]),
                end: Validator_1.schema.number.optional([
                    Validator_1.rules.unsigned(),
                ]),
                current: Validator_1.schema.number.optional([
                    Validator_1.rules.unsigned(),
                ]),
                finished: Validator_1.schema.boolean.optional(),
                inactive: Validator_1.schema.boolean.optional(),
            })
            : Validator_1.schema.create({
                companies_id: Validator_1.schema.number.optional([
                    Validator_1.rules.unsigned(),
                    Validator_1.rules.exists({ table: 'companies', column: 'id' }),
                ]),
                serial: Validator_1.schema.string.optional({ trim: true }, [
                    Validator_1.rules.maxLength(5),
                ]),
                start: Validator_1.schema.number.optional([
                    Validator_1.rules.unsigned(),
                ]),
                end: Validator_1.schema.number.optional([
                    Validator_1.rules.unsigned(),
                ]),
                current: Validator_1.schema.number.optional([
                    Validator_1.rules.unsigned(),
                ]),
                finished: Validator_1.schema.boolean.optional(),
                inactive: Validator_1.schema.boolean.optional(),
            });
        this.messages = {
            'companies_id.required': 'Empresa é obrigatória',
            'companies_id.exists': 'Empresa informada é inválida',
            'serial.required': 'O campo serial é obrigatório',
            'serial.maxLength': 'O serial deve ter no máximo {{ options.maxLength }} caracteres',
            'start.required': 'O campo início (start) é obrigatório',
        };
    }
}
exports.default = StampValidator;
//# sourceMappingURL=StampValidator.js.map