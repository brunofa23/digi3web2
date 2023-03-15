"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");
class AuthenticationController {
    async login({ auth, request, response }) {
        const username = request.input('username');
        const shortname = request.input('shortname');
        const password = request.input('password');
        const user = await User_1.default
            .query()
            .preload('company')
            .where('username', username)
            .whereHas('company', builder => {
            builder.where('shortname', shortname);
        })
            .firstOrFail();
        if (!(await Hash_1.default.verify(user.password, password))) {
            return response.unauthorized('Invalid credentials');
        }
        const token = await auth.use('api').generate(user, {
            expiresIn: '30 days',
            name: 'For the CLI app'
        });
        console.log(">>>Fez login...", { token });
        logtail.debug("debug", { token, user });
        logtail.flush();
        return { token, user };
    }
    async logout({ auth, response }) {
        await auth.use('api').revoke();
        return {
            revoked: true
        };
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=AuthenticationController.js.map