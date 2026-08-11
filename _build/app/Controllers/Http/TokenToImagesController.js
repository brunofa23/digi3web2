"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tokentoimage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Tokentoimage"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const crypto_1 = __importDefault(require("crypto"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const luxon_1 = require("luxon");
class TokenToImagesController {
    constructor() {
        this.imageDeviceCookieName = 'digi3_image_device_token';
    }
    hashImageDeviceCookie(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    getImageDeviceCookieOptions() {
        const domain = Env_1.default.get('DEVICE_COOKIE_DOMAIN', '');
        const secure = Env_1.default.get('DEVICE_COOKIE_SECURE', Env_1.default.get('NODE_ENV') === 'production');
        const options = {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            path: '/',
            maxAge: '365 days',
        };
        if (domain) {
            options.domain = domain;
        }
        return options;
    }
    async findImageDeviceByCookie(request, companyId, userId) {
        const cookieToken = request.plainCookie(this.imageDeviceCookieName, null, true);
        if (!cookieToken) {
            return null;
        }
        const data = await Tokentoimage_1.default.query()
            .where('companies_id', companyId)
            .andWhere('users_id', userId)
            .andWhere('token', this.hashImageDeviceCookie(cookieToken))
            .first();
        if (!data?.expires_at || data.expires_at < luxon_1.DateTime.now()) {
            return null;
        }
        return data;
    }
    async setImageDeviceCookie(response, companyId, userId) {
        const cookieToken = crypto_1.default.randomBytes(32).toString('base64url');
        const cookieHash = this.hashImageDeviceCookie(cookieToken);
        const expiresAt = luxon_1.DateTime.now().plus({ days: 365 });
        const tokenToImages = await Tokentoimage_1.default.create({
            companies_id: companyId,
            users_id: userId,
            token: cookieHash,
            expires_at: expiresAt,
        });
        response.plainCookie(this.imageDeviceCookieName, cookieToken, this.getImageDeviceCookieOptions());
        return tokenToImages;
    }
    serializeImageDevice(device) {
        return {
            id: device.id,
            companies_id: device.companies_id,
            users_id: device.users_id,
            expires_at: device.expires_at,
            confirmed: true,
        };
    }
    async index({ auth, response }) {
        const data = await Tokentoimage_1.default.all();
        return response.status(200).send(data);
    }
    async store({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(User_1.default.fillable);
        const accessImage = Number(request.input('accessimage'));
        const accessImageDays = Number.isFinite(accessImage) ? accessImage : -1;
        const user = await User_1.default.query().where('username', body.username)
            .andWhere('companies_id', authenticate.companies_id)
            .first();
        if (!user) {
            const errorValidation = await new validations_1.default('user_error_205');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!(await Hash_1.default.verify(user.password, body.password))) {
            let errorValidation = await new validations_1.default('user_error_206');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const hasPermission = await User_1.default
            .query()
            .where('username', body.username)
            .andWhere('companies_id', authenticate.companies_id)
            .join('groupxpermissions', 'users.usergroup_id', 'groupxpermissions.usergroup_id')
            .where(query => {
            query.where('groupxpermissions.permissiongroup_id', 30).orWhere('users.superuser', 1);
        })
            .select('users.id')
            .first();
        if (!hasPermission) {
            const errorValidation = await new validations_1.default('user_error_201');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const tokenToImages = await this.setImageDeviceCookie(response, authenticate.companies_id, authenticate.id);
        const limitDataAccess = luxon_1.DateTime.local()
            .plus(accessImageDays > 0 ? { days: accessImageDays } : { minutes: 7 })
            .toFormat('yyyy-MM-dd HH:mm');
        authenticate.access_image = limitDataAccess;
        await authenticate.save();
        return response.status(201).send({
            ...this.serializeImageDevice(tokenToImages),
            confirmed: true,
            access_image: limitDataAccess,
        });
    }
    async verifyTokenToImages({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await this.findImageDeviceByCookie(request, authenticate.companies_id, authenticate.id);
        return response.status(200).send(data ? this.serializeImageDevice(data) : null);
    }
}
exports.default = TokenToImagesController;
//# sourceMappingURL=TokenToImagesController.js.map