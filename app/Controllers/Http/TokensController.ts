import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import AuditLogger from 'App/Services/Audit/AuditLogger'
import Database from '@ioc:Adonis/Lucid/Database'
import Token from 'App/Models/Token'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { sendValidateConnection } from 'App/Services/googleDrive/googledrive'
import Encryption from '@ioc:Adonis/Core/Encryption'
import Env from '@ioc:Adonis/Core/Env'

const { google } = require('googleapis')
const GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive']

export default class TokensController {

    private isEnabled(value: any) {
        return value === true || value === 1 || value === '1'
    }

    private async authorizeCloudAdmin(ctx: HttpContextContract) {
        const authenticate = await ctx.auth.use('api').authenticate()

        if (Number(authenticate.companies_id) !== 1 || !this.isEnabled(authenticate.superuser)) {
            throw new BadRequestException('Acesso não liberado', 403, 'token_forbidden')
        }

        return authenticate
    }

    private validateJsonField(value: string | undefined, field: string) {
        if (value === undefined) return

        try {
            JSON.parse(value)
        } catch (error) {
            throw new BadRequestException(`${field} inválido`, 422, 'token_invalid_json')
        }
    }

    private inspectEncryptedJson(value: any) {
        const result = {
            exists: false,
            decryptable: false,
            json_valid: false,
            data: null as any,
        }

        if (typeof value !== 'string' || value.trim() === '') {
            return result
        }

        result.exists = true

        try {
            const decryptedValue = Encryption.decrypt(value)
            result.decryptable = true
            result.data = JSON.parse(decryptedValue)
            result.json_valid = true
        } catch (error) {
            result.data = null
        }

        return result
    }

    private parseCredentialsJson(value: string) {
        try {
            const parsed = JSON.parse(value)
            const credentials = parsed.web || parsed.installed

            if (!credentials?.client_id || !credentials?.client_secret) {
                throw new Error()
            }

            return parsed
        } catch (error) {
            throw new BadRequestException('credentials inválido', 422, 'token_invalid_credentials')
        }
    }

    private getOAuthClientCredentials(credentials: any) {
        return credentials?.web || credentials?.installed || null
    }

    private async revokeGoogleToken(refreshToken: string) {
        const revokeResponse = await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ token: refreshToken }).toString(),
        })

        if (!revokeResponse.ok) {
            throw new BadRequestException('Google não aceitou a revogação do token', 422, 'token_revoke_google_failed')
        }
    }

    private getBackendOAuthRedirectUri(ctx: HttpContextContract) {
        const configuredUrl = Env.get('GOOGLE_DRIVE_OAUTH_CALLBACK_URL', '')

        if (configuredUrl) {
            return configuredUrl
        }

        const request = ctx.request
        const protocol = request.header('x-forwarded-proto')?.split(',')?.[0]?.trim() || request.protocol()
        const host = request.header('x-forwarded-host')?.split(',')?.[0]?.trim() || request.host()

        return `${protocol}://${host}/api/tokens/oauth/callback`
    }

    private getSafeFrontendRedirect(ctx: HttpContextContract, value?: string) {
        const allowedOrigins = String(Env.get('FRONTEND_URL', ''))
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin && origin !== '*')

        const fallbackOrigin = allowedOrigins[0] || ctx.request.header('origin') || 'http://localhost:5173'
        const redirect = new URL(value || '/cloud-tokens', fallbackOrigin)

        if (allowedOrigins.length && !allowedOrigins.includes(redirect.origin)) {
            throw new BadRequestException('URL de retorno não liberada', 422, 'token_invalid_frontend_redirect')
        }

        redirect.pathname = '/cloud-tokens'
        return redirect.toString()
    }

    public async store(ctx: HttpContextContract) {
        const { response, request } = ctx
        const authenticate = await this.authorizeCloudAdmin(ctx)

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

    public async index(ctx: HttpContextContract) {
        const { response } = ctx
        await this.authorizeCloudAdmin(ctx)

        const data = await Database
            .from('tokens as tokens')
            .leftJoin('companies as companies', 'companies.cloud', 'tokens.id')
            .select(
                'tokens.id',
                'tokens.name',
                'tokens.accountname',
                'tokens.status',
                'tokens.created_at',
                'tokens.updated_at'
            )
            .count('companies.id as companies_count')
            .groupBy(
                'tokens.id',
                'tokens.name',
                'tokens.accountname',
                'tokens.status',
                'tokens.created_at',
                'tokens.updated_at'
            )
            .orderBy('tokens.id', 'asc')

        return response.status(200).send({
            data: data.map((token) => ({
                ...token,
                status: this.isEnabled(token.status),
                companies_count: Number(token.companies_count || 0),
            })),
            total: data.length,
        })
    }

    public async test(ctx: HttpContextContract) {
        const { params, response } = ctx
        const authenticate = await this.authorizeCloudAdmin(ctx)

        const token = await Token.query()
            .select('id', 'name', 'accountname', 'status')
            .where('id', params.id)
            .firstOrFail()

        try {
            await sendValidateConnection(token.id)

            await AuditLogger.record(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                action: 'google_drive_token_test',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Usuário ${authenticate.name || authenticate.username} testou conexão da nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    success: true,
                },
            })

            return response.status(200).send({
                data: {
                    id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    connected: true,
                },
                message: 'Conexão validada com sucesso',
            })
        } catch (error) {
            await AuditLogger.record(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                action: 'google_drive_token_test_failed',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Usuário ${authenticate.name || authenticate.username} tentou testar conexão da nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    success: false,
                    error_message: error?.message,
                },
            })

            return response.status(422).send({
                message: error?.message || 'Não foi possível validar a conexão',
            })
        }
    }

    public async updateStatus(ctx: HttpContextContract) {
        const { params, request, response } = ctx
        const authenticate = await this.authorizeCloudAdmin(ctx)

        const statusSchema = schema.create({
            status: schema.boolean(),
        })

        const data = await request.validate({ schema: statusSchema })
        const token = await Database
            .from('tokens')
            .select('id', 'name', 'accountname', 'status', 'token')
            .where('id', params.id)
            .first()

        if (!token) {
            throw new BadRequestException('Nuvem não encontrada', 404, 'token_not_found')
        }

        if (data.status) {
            const tokenInfo = this.inspectEncryptedJson(token.token)

            if (!tokenInfo.decryptable || !tokenInfo.json_valid || !tokenInfo.data?.refresh_token) {
                throw new BadRequestException('Nuvem sem autorização válida. Reautorize a conta Google antes de ativar.', 422, 'token_activation_requires_valid_oauth')
            }
        }

        const beforeData = {
            id: token.id,
            name: token.name,
            accountname: token.accountname,
            status: this.isEnabled(token.status),
        }

        await Database
            .from('tokens')
            .where('id', token.id)
            .update({
                status: data.status,
                updated_at: new Date(),
            })

        await AuditLogger.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: data.status ? 'google_drive_token_activate' : 'google_drive_token_deactivate',
            entityTable: 'tokens',
            entityId: token.id,
            resourceKey: `tokens:${token.id}`,
            entityKey: {
                token_id: token.id,
                name: token.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} ${data.status ? 'ativou' : 'inativou'} a nuvem ${token.name}`,
            beforeData,
            afterData: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status: data.status,
            },
            metadata: {
                token_id: token.id,
                name: token.name,
                accountname: token.accountname,
                previous_status: beforeData.status,
                status: data.status,
            },
        })

        return response.status(200).send({
            data: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status: data.status,
            },
            message: data.status ? 'Nuvem ativada com sucesso' : 'Nuvem inativada com sucesso',
        })
    }

    public async revokePreview(ctx: HttpContextContract) {
        const { params, response } = ctx
        const authenticate = await this.authorizeCloudAdmin(ctx)

        const token = await Database
            .from('tokens')
            .select(
                'id',
                'name',
                'accountname',
                'status',
                'token',
                'credentials'
            )
            .where('id', params.id)
            .first()

        if (!token) {
            throw new BadRequestException('Nuvem não encontrada', 404, 'token_not_found')
        }

        const companies = await Database
            .from('companies')
            .where('cloud', token.id)
            .count('id as total')
            .first()
        const companiesCount = Number(companies?.total || 0)
        const status = this.isEnabled(token.status)
        const tokenInfo = this.inspectEncryptedJson(token.token)
        const credentialsInfo = this.inspectEncryptedJson(token.credentials)
        const credentialsRoot = credentialsInfo.data?.installed || credentialsInfo.data?.web || null
        const warnings: string[] = []

        if (status) {
            warnings.push('Inative a nuvem antes de revogar no Google.')
        }
        if (companiesCount > 0) {
            warnings.push('Remova as empresas vinculadas antes de revogar no Google.')
        }
        if (!tokenInfo.exists) {
            warnings.push('Token OAuth não encontrado no banco.')
        } else if (!tokenInfo.decryptable) {
            warnings.push('Token OAuth não pôde ser descriptografado.')
        } else if (!tokenInfo.json_valid) {
            warnings.push('Token OAuth não está em JSON válido.')
        } else if (!tokenInfo.data?.refresh_token) {
            warnings.push('Refresh token não encontrado no token OAuth.')
        }
        if (!credentialsInfo.exists) {
            warnings.push('Credenciais OAuth não encontradas no banco.')
        } else if (!credentialsInfo.decryptable) {
            warnings.push('Credenciais OAuth não puderam ser descriptografadas.')
        } else if (!credentialsInfo.json_valid) {
            warnings.push('Credenciais OAuth não estão em JSON válido.')
        }

        const readyToRevoke = !status
            && companiesCount === 0
            && tokenInfo.decryptable
            && tokenInfo.json_valid
            && !!tokenInfo.data?.refresh_token

        await AuditLogger.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: 'google_drive_token_revoke_preview',
            entityTable: 'tokens',
            entityId: token.id,
            resourceKey: `tokens:${token.id}`,
            entityKey: {
                token_id: token.id,
                name: token.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} verificou pré-revogação da nuvem ${token.name}`,
            metadata: {
                token_id: token.id,
                name: token.name,
                accountname: token.accountname,
                status,
                companies_count: companiesCount,
                has_refresh_token: !!tokenInfo.data?.refresh_token,
                ready_to_revoke: readyToRevoke,
            },
        })

        return response.status(200).send({
            data: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status,
                companies_count: companiesCount,
                token: {
                    exists: tokenInfo.exists,
                    decryptable: tokenInfo.decryptable,
                    json_valid: tokenInfo.json_valid,
                    has_refresh_token: !!tokenInfo.data?.refresh_token,
                    type: tokenInfo.data?.type || null,
                },
                credentials: {
                    exists: credentialsInfo.exists,
                    decryptable: credentialsInfo.decryptable,
                    json_valid: credentialsInfo.json_valid,
                    type: credentialsInfo.data?.installed ? 'installed' : credentialsInfo.data?.web ? 'web' : null,
                    has_client_id: !!credentialsRoot?.client_id,
                    has_client_secret: !!credentialsRoot?.client_secret,
                },
                requires_inactive_status: true,
                ready_to_revoke: readyToRevoke,
                warnings,
            },
            message: readyToRevoke
                ? 'Nuvem pronta para revogação no Google'
                : 'Nuvem ainda não está pronta para revogação no Google',
        })
    }

    public async revoke(ctx: HttpContextContract) {
        const { params, response } = ctx
        const authenticate = await this.authorizeCloudAdmin(ctx)

        const token = await Database
            .from('tokens')
            .select(
                'id',
                'name',
                'accountname',
                'status',
                'token'
            )
            .where('id', params.id)
            .first()

        if (!token) {
            throw new BadRequestException('Nuvem não encontrada', 404, 'token_not_found')
        }

        const status = this.isEnabled(token.status)
        if (status) {
            throw new BadRequestException('Inative a nuvem antes de revogar no Google', 422, 'token_revoke_requires_inactive')
        }

        const companies = await Database
            .from('companies')
            .where('cloud', token.id)
            .count('id as total')
            .first()
        const companiesCount = Number(companies?.total || 0)

        if (companiesCount > 0) {
            throw new BadRequestException('Remova as empresas vinculadas antes de revogar no Google', 422, 'token_revoke_has_linked_companies')
        }

        const tokenInfo = this.inspectEncryptedJson(token.token)
        if (!tokenInfo.decryptable || !tokenInfo.json_valid || !tokenInfo.data?.refresh_token) {
            throw new BadRequestException('Refresh token não encontrado para revogação', 422, 'token_revoke_refresh_token_missing')
        }

        try {
            await this.revokeGoogleToken(tokenInfo.data.refresh_token)

            await Database
                .from('tokens')
                .where('id', token.id)
                .update({
                    token: null,
                    status: false,
                    updated_at: new Date(),
                })

            await AuditLogger.record(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                action: 'google_drive_token_revoke',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Usuário ${authenticate.name || authenticate.username} revogou credenciais OAuth da nuvem ${token.name}`,
                beforeData: {
                    id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status,
                    has_token: true,
                },
                afterData: {
                    id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: false,
                    has_token: false,
                },
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    revoked: true,
                },
            })

            return response.status(200).send({
                data: {
                    id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: false,
                    token_revoked: true,
                },
                message: 'Token revogado no Google e removido do Digi3',
            })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }

            await AuditLogger.record(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                action: 'google_drive_token_revoke_failed',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Usuário ${authenticate.name || authenticate.username} tentou revogar credenciais OAuth da nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    revoked: false,
                    error_message: error?.message,
                },
            })

            throw new BadRequestException('Não foi possível revogar o token no Google', 422, 'token_revoke_failed')
        }
    }

    public async startOAuth(ctx: HttpContextContract) {
        const { request, response } = ctx
        const authenticate = await this.authorizeCloudAdmin(ctx)

        const oauthSchema = schema.create({
            id: schema.number.optional([rules.unsigned()]),
            name: schema.string({ trim: true }, [rules.maxLength(80)]),
            accountname: schema.string({ trim: true }, [rules.maxLength(255)]),
            credentials: schema.string({ trim: true }),
            frontend_redirect: schema.string.optional({ trim: true }),
        })

        const data = await request.validate({ schema: oauthSchema })
        const existentTokenQuery = Database
            .from('tokens')
            .select('id')
            .where('name', data.name)

        if (data.id) {
            existentTokenQuery.whereNot('id', data.id)
        }

        const existentToken = await existentTokenQuery.first()

        if (existentToken) {
            throw new BadRequestException('Já existe uma nuvem com esse nome', 409, 'token_name_exists')
        }

        const credentialsJson = this.parseCredentialsJson(data.credentials)
        const oauthCredentials = this.getOAuthClientCredentials(credentialsJson)
        const redirectUri = this.getBackendOAuthRedirectUri(ctx)
        const frontendRedirect = this.getSafeFrontendRedirect(ctx, data.frontend_redirect)

        let token: any

        if (data.id) {
            const existingToken = await Database
                .from('tokens')
                .select('id', 'name', 'accountname', 'status', 'token')
                .where('id', data.id)
                .first()

            if (!existingToken) {
                throw new BadRequestException('Nuvem não encontrada', 404, 'token_not_found')
            }

            if (this.isEnabled(existingToken.status)) {
                throw new BadRequestException('Inative a nuvem antes de reautorizar', 422, 'token_reauthorize_requires_inactive')
            }

            const tokenInfo = this.inspectEncryptedJson(existingToken.token)
            if (tokenInfo.data?.refresh_token) {
                throw new BadRequestException('A nuvem ainda possui token OAuth. Revogue o token antigo antes de reautorizar.', 422, 'token_reauthorize_requires_revoked_oauth')
            }

            await Database
                .from('tokens')
                .where('id', existingToken.id)
                .update({
                    name: data.name,
                    accountname: data.accountname,
                    credentials: await Encryption.encrypt(JSON.stringify(credentialsJson)),
                    token: null,
                    status: false,
                    updated_at: new Date(),
                })

            token = {
                id: existingToken.id,
                name: data.name,
                accountname: data.accountname,
                status: false,
            }
        } else {
            token = await Token.create({
                name: data.name,
                accountname: data.accountname,
                credentials: JSON.stringify(credentialsJson),
                status: false,
            })
        }

        const state = Encryption.encrypt(JSON.stringify({
            token_id: token.id,
            user_id: authenticate.id,
            companies_id: authenticate.companies_id,
            frontend_redirect: frontendRedirect,
            expires_at: Date.now() + (10 * 60 * 1000),
        }))

        const oauth2Client = new google.auth.OAuth2(
            oauthCredentials.client_id,
            oauthCredentials.client_secret,
            redirectUri
        )

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: GOOGLE_DRIVE_SCOPES,
            state,
        })

        await AuditLogger.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: 'google_drive_token_oauth_start',
            entityTable: 'tokens',
            entityId: token.id,
            resourceKey: `tokens:${token.id}`,
            entityKey: {
                token_id: token.id,
                name: token.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} iniciou autorização OAuth da nuvem ${token.name}`,
            metadata: {
                token_id: token.id,
                name: token.name,
                accountname: token.accountname,
                redirect_uri: redirectUri,
                reauthorize: !!data.id,
            },
        })

        return response.status(200).send({
            data: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status: token.status,
                auth_url: authUrl,
                redirect_uri: redirectUri,
            },
            message: 'Autorização criada. Continue no Google para concluir.',
        })
    }

    public async oauthCallback(ctx: HttpContextContract) {
        const { request, response } = ctx
        let frontendRedirect = this.getSafeFrontendRedirect(ctx)

        try {
            const code = request.input('code')
            const state = request.input('state')

            if (!code || !state) {
                throw new BadRequestException('Retorno OAuth inválido', 422, 'token_oauth_invalid_callback')
            }

            const stateData = JSON.parse(Encryption.decrypt(state))
            frontendRedirect = stateData.frontend_redirect || frontendRedirect

            if (!stateData.token_id || Number(stateData.expires_at || 0) < Date.now()) {
                throw new BadRequestException('Autorização expirada', 422, 'token_oauth_expired')
            }

            const token = await Token.findOrFail(stateData.token_id)
            const credentialsJson = this.parseCredentialsJson(token.credentials)
            const oauthCredentials = this.getOAuthClientCredentials(credentialsJson)
            const redirectUri = this.getBackendOAuthRedirectUri(ctx)
            const oauth2Client = new google.auth.OAuth2(
                oauthCredentials.client_id,
                oauthCredentials.client_secret,
                redirectUri
            )
            const tokenResponse = await oauth2Client.getToken(code)
            const refreshToken = tokenResponse.tokens?.refresh_token

            if (!refreshToken) {
                throw new BadRequestException('Google não retornou refresh_token. Tente novamente autorizando consentimento.', 422, 'token_oauth_refresh_token_missing')
            }

            token.token = JSON.stringify({
                type: 'authorized_user',
                client_id: oauthCredentials.client_id,
                client_secret: oauthCredentials.client_secret,
                refresh_token: refreshToken,
            })
            token.status = false
            await token.save()

            await AuditLogger.record(ctx, {
                companiesId: stateData.companies_id || null,
                userId: stateData.user_id || null,
                action: 'google_drive_token_oauth_callback',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Autorização OAuth concluída para a nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    has_refresh_token: true,
                },
            })

            const redirectUrl = new URL(frontendRedirect)
            redirectUrl.searchParams.set('cloud_oauth', 'success')
            redirectUrl.searchParams.set('cloud_id', String(token.id))
            return response.redirect(redirectUrl.toString())
        } catch (error) {
            const redirectUrl = new URL(frontendRedirect)
            redirectUrl.searchParams.set('cloud_oauth', 'error')
            redirectUrl.searchParams.set('cloud_message', error?.message || 'Não foi possível concluir autorização Google')
            return response.redirect(redirectUrl.toString())
        }
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
