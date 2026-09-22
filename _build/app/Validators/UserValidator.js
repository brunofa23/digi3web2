"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class UserValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            id: Validator_1.schema.number.optional(),
            companies_id: Validator_1.schema.number(),
            usergroup_id: Validator_1.schema.number(),
            name: Validator_1.schema.string({}, [Validator_1.rules.maxLength(45)]),
            username: Validator_1.schema.string({}, [Validator_1.rules.maxLength(45)]),
            email: Validator_1.schema.string.optional({}, [Validator_1.rules.email(), Validator_1.rules.maxLength(255)]),
            password: Validator_1.schema.string.nullableAndOptional(),
            remember_me_token: Validator_1.schema.string.optional(),
            permission_level: Validator_1.schema.number(),
            superuser: Validator_1.schema.boolean(),
            status: Validator_1.schema.boolean(),
            access_images_permanent: Validator_1.schema.boolean.nullableAndOptional()
        });
    }
}
exports.default = UserValidator;
//# sourceMappingURL=UserValidator.js.map