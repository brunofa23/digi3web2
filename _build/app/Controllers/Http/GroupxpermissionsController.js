"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Groupxpermission_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Groupxpermission"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class GroupxpermissionsController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await Groupxpermission_1.default.query()
                .where('excluded', false);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        try {
            const updateSchema = Validator_1.schema.create({
                permissions: Validator_1.schema.array().members(Validator_1.schema.number([Validator_1.rules.exists({ table: 'permissiongroups', column: 'id' })])),
            });
            const { permissions } = await request.validate({ schema: updateSchema });
            await Groupxpermission_1.default.query()
                .where('usergroup_id', params.id)
                .delete();
            const createManyPermission = permissions.map((id) => ({
                usergroup_id: params.id,
                permissiongroup_id: id,
            }));
            if (permissions.length === 0) {
                return response.status(200).send([]);
            }
            const result = await Groupxpermission_1.default.createMany(createManyPermission);
            return response.status(201).send(result);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async PermissiongroupXUsergroup({ auth, params, response }) {
        try {
            await auth.use('api').authenticate();
            const data = await Database_1.default
                .from('permissiongroups as p')
                .leftJoin('groupxpermissions as gp', function () {
                this
                    .on('p.id', '=', 'gp.permissiongroup_id')
                    .andOnVal('gp.usergroup_id', '=', params.usergroup_id);
            })
                .select('p.id', 'p.name as permissiongroups', Database_1.default.raw('CASE WHEN gp.usergroup_id IS NOT NULL THEN true ELSE false END AS have_permission'))
                .orderBy('p.id');
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
}
exports.default = GroupxpermissionsController;
//# sourceMappingURL=GroupxpermissionsController.js.map