"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Usergroup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Usergroup"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class UsergroupsController {
    ensureDigi3Superuser(authenticate) {
        if (!authenticate.superuser || Number(authenticate.companies_id) !== 1) {
            throw new BadRequestException_1.default('Acesso permitido somente ao superusuário da empresa Digi3', 403, 'usergroup_admin_forbidden');
        }
    }
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        const canManageUsers = (0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, 5);
        if (!canManageUsers) {
            throw new BadRequestException_1.default('Acesso permitido somente para usuários com permissão de cadastro de usuários', 403, 'user_permission_forbidden');
        }
        const { permissiongroup_id } = request.only(['permissiongroup_id']);
        const permissiongroupId = Number(permissiongroup_id);
        try {
            const data = await Usergroup_1.default.query()
                .if(!authenticate.superuser, query => {
                query.where('inactive', false)
                    .where('available_for_user_creation', true);
            })
                .if(Number.isInteger(permissiongroupId) && permissiongroupId > 0, query => {
                query.whereHas('groupxpermission', subQuery => {
                    subQuery.where('permissiongroup_id', permissiongroupId);
                });
            })
                .orderBy('name');
            return response.ok(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao buscar lançamentos', 401, error);
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        this.ensureDigi3Superuser(authenticate);
        const body = await request.validate({
            schema: Validator_1.schema.create({
                name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(60)]),
                inactive: Validator_1.schema.boolean.optional(),
                available_for_user_creation: Validator_1.schema.boolean.optional(),
            }),
        });
        try {
            const data = await Usergroup_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao criar grupo', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        this.ensureDigi3Superuser(authenticate);
        const body = await request.validate({
            schema: Validator_1.schema.create({
                name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(60)]),
                inactive: Validator_1.schema.boolean.optional(),
                available_for_user_creation: Validator_1.schema.boolean.optional(),
            }),
        });
        try {
            const usergroup = await Usergroup_1.default.findOrFail(params.id);
            const data = await usergroup.merge(body).save();
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao atualizar grupo', 401, error);
        }
    }
}
exports.default = UsergroupsController;
//# sourceMappingURL=UsergroupsController.js.map