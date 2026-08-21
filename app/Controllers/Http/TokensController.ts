import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import AuditLogger from 'App/Services/Audit/AuditLogger'
import Token from 'App/Models/Token'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class TokensController {

    private validateJsonField(value: string | undefined, field: string) {
        if (value === undefined) return

        try {
            JSON.parse(value)
        } catch (error) {
            throw new BadRequestException(`${field} inválido`, 422, 'token_invalid_json')
        }
    }

    public async store(ctx: HttpContextContract) {
        const { auth, response, request } = ctx
        const authenticate = await auth.use('api').authenticate()

        if (authenticate.companies_id !== 1 || authenticate.superuser !== true) {
            throw new BadRequestException('Acesso não liberado', 403, 'token_forbidden')
        }

        const tokenSchema = schema.create({
            id: schema.number.optional([rules.unsigned()]),
            name: schema.string({ trim: true }, [rules.maxLength(80)]),
            token: schema.string.optional({ trim: true }),
            credentials: schema.string.optional({ trim: true }),
            accountname: schema.string({ trim: true }, [rules.maxLength(255)]),
            status: schema.boolean.optional(),
        })

        const { id: _ignoredId, ...data } = await request.validate({ schema: tokenSchema })

        this.validateJsonField(data.token, 'token')
        this.validateJsonField(data.credentials, 'credentials')

        const existentToken = await Token.findBy('name', data.name)
        const beforeData = existentToken?.serialize()
        const persistedToken = await Token.updateOrCreate({ name: data.name }, data)

        await AuditLogger.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: existentToken ? 'google_drive_token_update' : 'google_drive_token_create',
            entityTable: 'tokens',
            entityId: persistedToken.id,
            resourceKey: `tokens:${persistedToken.id}`,
            entityKey: {
                token_id: persistedToken.id,
                name: persistedToken.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} alterou credenciais da nuvem ${persistedToken.name}`,
            beforeData,
            afterData: persistedToken,
            metadata: {
                token_id: persistedToken.id,
                name: persistedToken.name,
                accountname: persistedToken.accountname,
                status: persistedToken.status,
                token_changed: data.token !== undefined,
                credentials_changed: data.credentials !== undefined,
            },
        })

        return response.status(200).send("salvo")
    }


    // public async index({ auth, response, request }) {

    //     await auth.use('api').authenticate()
    //     try {
    //         const token = await Token.findBy('name', 'tokenGoogle')
    //         return response.status(200).send(token)
    //     } catch (error) {
    //         throw error
    //         //throw new BadRequest('Bad Request', 401, 'erro')
    //     }

    // }
}
