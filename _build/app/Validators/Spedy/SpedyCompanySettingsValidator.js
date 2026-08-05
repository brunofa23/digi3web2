"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SpedyCompanySettingsValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            general: Validator_1.schema.object.optional().anyMembers(),
            productInvoice: Validator_1.schema.object.optional().anyMembers(),
            consumerInvoice: Validator_1.schema.object.optional().anyMembers(),
            serviceInvoice: Validator_1.schema.object.optional().anyMembers(),
        });
        this.messages = {
            required: 'O campo {{ field }} é obrigatório',
        };
    }
}
exports.default = SpedyCompanySettingsValidator;
//# sourceMappingURL=SpedyCompanySettingsValidator.js.map