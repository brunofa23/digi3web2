"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Situation_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Situation"));
class SituationsController {
    async index({ auth }) {
        await auth.use('api').authenticate();
        return await Situation_1.default
            .query()
            .where('inactive', false)
            .orderBy('id', 'asc');
    }
}
exports.default = SituationsController;
//# sourceMappingURL=SituationsController.js.map