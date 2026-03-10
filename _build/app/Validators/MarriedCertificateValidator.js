"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class MarriedCertificateValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            groomPersonId: this.isCreate
                ? Validator_1.schema.number.optional([Validator_1.rules.unsigned()])
                : Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            fatherGroomPersonId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            motherGroomPersonId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            bridePersonId: this.isCreate
                ? Validator_1.schema.number.optional([Validator_1.rules.unsigned()])
                : Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            fahterBridePersonId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            motherBridePersonId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            witnessPersonId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            witness2PersonId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            statusId: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            dthrSchedule: Validator_1.schema.date.optional({ format: 'yyyy-MM-dd HH:mm:ss' }),
            dthrMarriage: Validator_1.schema.date.optional({ format: 'yyyy-MM-dd HH:mm:ss' }),
            type: Validator_1.schema.string.optional({ trim: true }),
            obs: Validator_1.schema.string.optional({ trim: true }),
            churchName: Validator_1.schema.string.optional({ trim: true }),
            churchCity: Validator_1.schema.string.optional({ trim: true }),
            maritalRegime: Validator_1.schema.string.optional({ trim: true }),
            prenup: Validator_1.schema.boolean.optional(),
            registryOfficePrenup: Validator_1.schema.string.optional({ trim: true }),
            addresRegistryOfficePrenup: Validator_1.schema.string.optional({ trim: true }),
            bookRegistryOfficePrenup: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            sheetRegistryOfficePrenup: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.unsigned()]),
            dthrPrenup: Validator_1.schema.date.optional({ format: 'yyyy-MM-dd' }),
            cerimonyLocation: Validator_1.schema.string.optional({ trim: true }),
            otherCerimonyLocation: Validator_1.schema.string.optional({ trim: true }),
            nameFormerSpouse: Validator_1.schema.string.optional({ trim: true }),
            dthrDivorceSpouse: Validator_1.schema.date.optional({ format: 'yyyy-MM-dd' }),
            nameFormerSpouse2: Validator_1.schema.string.optional({ trim: true }),
            dthrDivorceSpouse2: Validator_1.schema.date.optional({ format: 'yyyy-MM-dd' }),
            inactive: Validator_1.schema.boolean.optional(),
            statusForm: Validator_1.schema.enum(['draft', 'writing', 'finish'])
        });
        this.messages = {
            'groomPersonId.required': 'O noivo é obrigatório.',
            'bridePersonId.required': 'A noiva é obrigatória.',
            'dthrSchedule.date.format': 'dthrSchedule deve estar no formato yyyy-MM-dd HH:mm:ss.',
            'dthrMarriage.date.format': 'dthrMarriage deve estar no formato yyyy-MM-dd HH:mm:ss.',
            'dthrPrenup.date.format': 'dthrPrenup deve estar no formato yyyy-MM-dd.',
            'dthrDivorceSpouse.date.format': 'dthrDivorceSpouse deve estar no formato yyyy-MM-dd.',
            'dthrDivorceSpouse2.date.format': 'dthrDivorceSpouse2 deve estar no formato yyyy-MM-dd.',
        };
    }
    get isCreate() {
        return this.ctx?.request.method().toUpperCase() === 'POST';
    }
}
exports.default = MarriedCertificateValidator;
//# sourceMappingURL=MarriedCertificateValidator.js.map