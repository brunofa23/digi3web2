"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Stamp_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Stamp"));
const StampValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/StampValidator"));
class StampsController {
    async index({ auth, request }) {
        const authenticate = await auth.use('api').authenticate();
        const { page = 1, perPage = 20, finished } = request.qs();
        const query = Stamp_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .orderBy('id', 'asc');
        if (finished === 'true' || finished === 'false') {
            query.where('finished', finished === 'true');
        }
        const stamps = await query.paginate(page, perPage);
        return stamps;
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const stamp = await Stamp_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .first();
        if (!stamp) {
            return response.notFound({ message: 'Stamp não encontrado' });
        }
        return stamp;
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await request.validate(StampValidator_1.default);
        const stamp = await Stamp_1.default.create({
            ...data,
            companies_id: authenticate.companies_id,
        });
        return response.created(stamp);
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const stamp = await Stamp_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .first();
        if (!stamp) {
            return response.notFound({ message: 'Stamp não encontrado' });
        }
        const data = await request.validate(StampValidator_1.default);
        stamp.merge(data);
        await stamp.save();
        return stamp;
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const stamp = await Stamp_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .first();
        if (!stamp) {
            return response.notFound({ message: 'Stamp não encontrado' });
        }
        await stamp.delete();
        return response.noContent();
    }
    async sequence({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const quantityParam = Number(params.quantity);
        if (!quantityParam || isNaN(quantityParam) || quantityParam <= 0) {
            return response.badRequest({ message: 'Quantidade inválida' });
        }
        const quantity = quantityParam;
        const trx = await Database_1.default.transaction();
        try {
            const stamps = await Stamp_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('finished', false)
                .where('inactive', false)
                .orderBy('id', 'asc')
                .forUpdate();
            const sequence = [];
            let remaining = quantity;
            for (const stamp of stamps) {
                if (remaining <= 0)
                    break;
                let current = stamp.current ?? stamp.start - 1;
                while (remaining > 0) {
                    current += 1;
                    if (stamp.end && current > stamp.end) {
                        stamp.finished = true;
                        stamp.current = stamp.end;
                        break;
                    }
                    sequence.push(`${stamp.serial}${current}`);
                    stamp.current = current;
                    remaining--;
                    if (stamp.end && current === stamp.end) {
                        stamp.finished = true;
                        break;
                    }
                }
            }
            if (remaining > 0) {
                throw new BadRequestException_1.default('Não há selos disponíveis em quantidade suficiente.', 409, 'stamp_sequence_insufficient');
            }
            for (const stamp of stamps.filter((item) => item.$isDirty)) {
                await stamp.save();
            }
            await trx.commit();
            return {
                quantityRequested: quantity,
                quantityGenerated: sequence.length,
                sequence,
                sequence_joined: sequence.map((code) => `${code};`).join(''),
            };
        }
        catch (error) {
            await trx.rollback();
            throw error;
        }
    }
}
exports.default = StampsController;
//# sourceMappingURL=StampsController.js.map