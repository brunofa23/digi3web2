"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
exports.default = Env_1.default.rules({
    HOST: Env_1.default.schema.string({ format: 'host' }),
    PORT: Env_1.default.schema.number(),
    APP_KEY: Env_1.default.schema.string(),
    APP_NAME: Env_1.default.schema.string(),
    WEBAUTHN_RP_NAME: Env_1.default.schema.string.optional(),
    WEBAUTHN_RP_ID: Env_1.default.schema.string.optional(),
    WEBAUTHN_ORIGIN: Env_1.default.schema.string.optional(),
    FRONTEND_URL: Env_1.default.schema.string.optional(),
    DEVICE_COOKIE_DOMAIN: Env_1.default.schema.string.optional(),
    DEVICE_COOKIE_SECURE: Env_1.default.schema.boolean.optional(),
    DRIVE_DISK: Env_1.default.schema.enum(['local']),
    GOOGLE_APPLICATION_CREDENTIALS: Env_1.default.schema.string.optional(),
    NODE_ENV: Env_1.default.schema.enum(['development', 'production', 'test']),
});
//# sourceMappingURL=env.js.map