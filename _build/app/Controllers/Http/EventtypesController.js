"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eventtype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Eventtype"));
class EventtypesController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await Eventtype_1.default.query();
        return response.status(200).send(data);
    }
}
exports.default = EventtypesController;
//# sourceMappingURL=EventtypesController.js.map