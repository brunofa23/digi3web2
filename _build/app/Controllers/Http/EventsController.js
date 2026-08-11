"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Event"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class EventsController {
    async index({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const event = await Event_1.default
                .query()
                .preload('company', query => {
                query.select('name');
            })
                .preload('user', query => {
                query.select('name');
            })
                .preload('eventtype', query => {
                query.select('name');
            });
            return response.status(200).send(event);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async store({ request, response }) {
        const body = request.only(Event_1.default.fillable);
        const data = await Event_1.default.create(body);
        return response.status(201).send(data);
    }
    async update({ request, params, response }) {
        const body = request.only(Event_1.default.fillable);
        body.id = params.id;
        const data = await Event_1.default.findOrFail(body.id);
        body.createdAt = data.$attributes.createdAt;
        await data.fill(body).save();
        return response.status(201).send(data);
    }
    async destroy({ params, response }) {
        const data = await Event_1.default.findOrFail(params.id);
        await data.delete();
        return response.status(204).send({ message: "Excluido" });
    }
}
exports.default = EventsController;
//# sourceMappingURL=EventsController.js.map