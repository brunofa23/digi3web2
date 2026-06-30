"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stamp_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Stamp"));
const StampValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/StampValidator"));
class StampsController {
    async index({ auth, request }) {
        const authenticate = await auth.use('api').authenticate();
        const { page = 1, perPage = 20 } = request.qs();
        const stamps = await Stamp_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .orderBy('id', 'asc')
            .paginate(page, perPage);
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
        const stamps = await Stamp_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('finished', false)
            .where('inactive', false)
            .orderBy('id', 'asc');
        if (!stamps.length) {
            return response.notFound({
                message: 'Nenhum stamp disponível (finished = 0 e inactive = 0)',
            });
        }
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
                const code = `${stamp.serial}${current}`;
                sequence.push(code);
                stamp.current = current;
                remaining--;
                if (stamp.end && current === stamp.end) {
                    stamp.finished = true;
                    break;
                }
            }
        }
        await Promise.all(stamps
            .filter((s) => s.$isDirty)
            .map((s) => s.save()));
        if (!sequence.length) {
            return response.notFound({
                message: 'Não foi possível gerar a sequência com os stamps disponíveis',
            });
        }
        const sequenceJoinedWithSemicolon = sequence.map((code) => `${code};`).join('');
        return {
            quantityRequested: quantity,
            quantityGenerated: sequence.length,
            sequence,
            sequence_joined: sequenceJoinedWithSemicolon,
        };
    }
}
exports.default = StampsController;
//# sourceMappingURL=StampsController.js.map