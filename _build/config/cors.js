"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const frontendUrl = Env_1.default.get('FRONTEND_URL', '*');
const frontendOrigins = frontendUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
function isDevelopmentOrigin(origin) {
    return Env_1.default.get('NODE_ENV') === 'development'
        && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}):517[34]$/.test(origin);
}
const corsConfig = {
    enabled: (request) => request.url().startsWith('/api'),
    origin: (origin) => {
        if (frontendUrl === '*') {
            return true;
        }
        return frontendOrigins.includes(origin) || isDevelopmentOrigin(origin);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    headers: true,
    exposeHeaders: [
        'cache-control',
        'content-language',
        'content-type',
        'expires',
        'last-modified',
        'pragma',
    ],
    credentials: true,
    maxAge: 86400,
};
exports.default = corsConfig;
//# sourceMappingURL=cors.js.map