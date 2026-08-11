"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
class BadRequestException extends standalone_1.Exception {
    async handle(error, ctx) {
        const payload = {
            code: error.code,
            message: error.message,
            status: error.status,
        };
        if (error.invalidFiles) {
            payload.invalidFiles = error.invalidFiles;
        }
        return ctx.response.status(error.status).send(payload);
    }
}
exports.default = BadRequestException;
//# sourceMappingURL=BadRequestException.js.map