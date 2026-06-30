"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmployeeVerification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerification"));
class EmployeeVerificationsController {
    async index({ auth, request, response }) {
        await auth.use('api').authenticate();
        const qs = request.qs();
        const employees_id = qs.employees_id ? Number(qs.employees_id) : null;
        const status = qs.status ?? null;
        const query = EmployeeVerification_1.default.query();
        if (employees_id) {
            query.where('employees_id', employees_id);
        }
        if (status) {
            query.where('status', status);
        }
        const data = await query
            .orderBy('created_at', 'desc');
        return response.ok(data);
    }
}
exports.default = EmployeeVerificationsController;
//# sourceMappingURL=EmployeeVerificationsController.js.map