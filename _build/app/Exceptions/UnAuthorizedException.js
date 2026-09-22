"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
class UnAuthorizedException extends standalone_1.Exception {
    async handle(error, ctx) {
        console.log("ERRROR>>>>", error);
        ctx.response.status(error.status).send({
            code: error.code,
            message: error.message,
            status: error.status,
        });
    }
}
exports.default = UnAuthorizedException;
//# sourceMappingURL=UnAuthorizedException.js.map