"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class ReceiptItemValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            receiptId: Validator_1.schema.number([
                Validator_1.rules.exists({ table: 'receipts', column: 'id' }),
            ]),
            serviceId: Validator_1.schema.number([
                Validator_1.rules.exists({ table: 'services', column: 'id' }),
            ]),
            emolumentId: Validator_1.schema.number([
                Validator_1.rules.exists({ table: 'emoluments', column: 'id' }),
            ]),
            qtde: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
            ]),
            amount: Validator_1.schema.string.optional(),
        });
        this.messages = {
            'receiptId.required': 'Informe o receiptId',
            'serviceId.required': 'Informe o serviceId',
            'emolumentId.required': 'Informe o emolumentId',
            'qtde.unsigned': 'qtde não pode ser negativo',
            'amount.range': 'amount fora do limite permitido',
            'receiptId.exists': 'receiptId inválido',
            'serviceId.exists': 'serviceId inválido',
            'emolumentId.exists': 'emolumentId inválido',
        };
    }
}
exports.default = ReceiptItemValidator;
//# sourceMappingURL=ReceiptitemValidator.js.map