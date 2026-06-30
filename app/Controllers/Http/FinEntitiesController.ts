import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Entity from 'App/Models/Entity'
import FinEntityDocumentEmail from 'App/Models/FinEntityDocumentEmail'
import { schema } from '@ioc:Adonis/Core/Validator'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { currencyConverter } from "App/Services/util"
import Mail from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'
export default class FinEntitiesController {
  private maxEmailAttachmentSize = 5 * 1024 * 1024

  private cleanUndefined(payload: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    )
  }

  private normalizeInput(input: Record<string, any>) {
    const normalized = { ...input }

    for (const key of ['description', 'cpf_cnpj', 'email', 'responsible', 'phone', 'obs']) {
      if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
        normalized[key] = undefined
      }
    }

    if (normalized.fin_class_id === '' || normalized.fin_class_id === undefined) {
      normalized.fin_class_id = null
    }

    if (normalized.limit_amount === '' || normalized.limit_amount === undefined) {
      normalized.limit_amount = null
    } else if (typeof normalized.limit_amount === 'string') {
      normalized.limit_amount = Number(currencyConverter(normalized.limit_amount))
    }

    return normalized
  }

  private getEntityIdFromFileName(fileName: string) {
    const match = String(fileName || '').trim().match(/^(\d+)/)
    return match ? Number(match[1]) : null
  }

  public async index({ auth, request, response }) {
    const authenticate = await auth.use('api').authenticate()
    const {description} = request.only(['description'])
    try {
      const query = Entity.query()
        .where('companies_id', authenticate.companies_id)
        .preload('finclass', query => {
          query.select('id', 'description', 'debit_credit', 'cost', 'allocation', 'limit_amount')
        })
        .if(description, query=>{
          query.where('description','like',`%${description}%`)
        })
        const data = await query
      //.andWhere('inactive',false)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      companies_id: schema.number.optional(),
      fin_class_id: schema.number.nullableAndOptional(),
      description: schema.string.nullableAndOptional(),
      cpf_cnpj: schema.string.nullableAndOptional(),
      email: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional(),
      excluded: schema.boolean.nullableAndOptional(),
      limit_amount: schema.number.nullableAndOptional()
    })

    const input = this.normalizeInput(request.all())
    const body = await request.validate({
      schema: querySchema,
      data: input//request.body()
    })
    const payload = this.cleanUndefined({ ...body, companies_id: authenticate.companies_id }) as any
    try {
      const data = await Entity.create(payload)
      await data.load('finclass')
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Erro ao cadastrar entidade financeira', 400, error)
    }

  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      companies_id: schema.number.optional(),
      fin_class_id: schema.number.nullableAndOptional(),
      description: schema.string.nullableAndOptional(),
      cpf_cnpj: schema.string.nullableAndOptional(),
      email: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional(),
      excluded: schema.boolean.nullableAndOptional(),
      limit_amount: schema.number.nullableAndOptional()
    })

    const input = this.normalizeInput(request.all())

    const body = await request.validate({
      schema: querySchema,
      data: input
    })
    const payload = this.cleanUndefined({ ...body, companies_id: authenticate.companies_id }) as any

    try {
      const data = await Entity.findOrFail(params.id)
      await data.merge(payload).save()
      await data.load('finclass')
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar entidade financeira', 400, error)
    }

  }

  public async documentEmailHistory({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const data = await FinEntityDocumentEmail.query()
        .where('companies_id', authenticate.companies_id)
        .orderBy('created_at', 'desc')
        .limit(200)

      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Erro ao listar histórico de envio de documentos', 400, error)
    }
  }

  public async sendDocumentEmails({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const subject = String(request.input('subject') || '').trim()
    const body = String(request.input('body') || '').trim()
    const files = request.files('files', {
      size: '5mb',
      extnames: ['pdf', 'PDF'],
    })

    if (!subject) {
      throw new BadRequestException('Informe o assunto do e-mail', 400, 'subject')
    }

    if (!body) {
      throw new BadRequestException('Informe o corpo do e-mail', 400, 'body')
    }

    if (!files.length) {
      throw new BadRequestException('Selecione pelo menos um arquivo PDF', 400, 'files')
    }

    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
    if (totalSize > this.maxEmailAttachmentSize) {
      throw new BadRequestException('O total dos anexos deve ter no máximo 5 MB', 400, 'files')
    }

    try {
      const filesByEntity = new Map<number, any[]>()

      for (const file of files) {
        const entityId = this.getEntityIdFromFileName(file.clientName)
        if (!entityId) {
          throw new BadRequestException(`O arquivo ${file.clientName} deve iniciar com o código da entidade`, 400, 'files')
        }

        if (!filesByEntity.has(entityId)) {
          filesByEntity.set(entityId, [])
        }

        filesByEntity.get(entityId)!.push(file)
      }

      const results: any[] = []

      for (const [entityId, entityFiles] of filesByEntity.entries()) {
        const entity = await Entity.query()
          .where('id', entityId)
          .where('companies_id', authenticate.companies_id)
          .first()

        if (!entity) {
          throw new BadRequestException(`Entidade ${entityId} não encontrada`, 400, 'files')
        }

        if (!entity.email) {
          throw new BadRequestException(`Entidade ${entityId} não possui e-mail cadastrado`, 400, 'email')
        }

        await Mail.send((message) => {
          message
            .from(Env.get('SMTP_USERNAME', ''), 'Digi3')
            .to(entity.email)
            .subject(subject)
            .text(body)

          for (const file of entityFiles) {
            if (file.tmpPath) {
              message.attach(file.tmpPath, {
                filename: file.clientName,
              })
            }
          }
        })

        for (const file of entityFiles) {
          await FinEntityDocumentEmail.create({
            companies_id: authenticate.companies_id,
            fin_entity_id: entity.id,
            email: entity.email,
            subject,
            body,
            file_name: file.clientName,
            file_size: file.size || 0,
            status: 'sent',
            sent_at: DateTime.local(),
          })
        }

        results.push({
          entity_id: entity.id,
          entity_description: entity.description,
          email: entity.email,
          files: entityFiles.map((file) => file.clientName),
          status: 'sent',
        })
      }

      return response.status(201).send(results)
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException('Erro ao enviar documentos por e-mail', 400, error)
    }
  }

}
