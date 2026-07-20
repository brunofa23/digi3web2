import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanyFiscalIntegration from 'App/Models/CompanyFiscalIntegration'
import FiscalInvoice from 'App/Models/FiscalInvoice'
import FiscalInvoiceEvent from 'App/Models/FiscalInvoiceEvent'
import Receipt from 'App/Models/Receipt'
import NfseCancelValidator from 'App/Validators/Fiscal/NfseCancelValidator'
import NfseFromReceiptValidator from 'App/Validators/Fiscal/NfseFromReceiptValidator'
import NfseManualInvoiceValidator from 'App/Validators/Fiscal/NfseManualInvoiceValidator'
import NfsePayloadBuilder from 'App/Services/Fiscal/NfsePayloadBuilder'
import SpedyNfseService from 'App/Services/Fiscal/SpedyNfseService'

export default class NfseInvoicesController {
  private spedy = new SpedyNfseService()
  private builder = new NfsePayloadBuilder()

  private async getConfig(companiesId: number) {
    const config = await CompanyFiscalIntegration
      .query()
      .where('companies_id', companiesId)
      .where('provider', 'spedy')
      .where('enabled', true)
      .first()

    if (!config) {
      throw new BadRequestException('Integração Spedy NFS-e não configurada para esta empresa', 400, 'nfse_config_missing')
    }

    return config
  }

  private async registerEvent(invoice: FiscalInvoice, event: string, payload: any, oldStatus?: string | null) {
    await FiscalInvoiceEvent.create({
      companiesId: invoice.companiesId,
      fiscalInvoiceId: invoice.id,
      event,
      oldStatus: oldStatus || null,
      newStatus: invoice.status || null,
      message: invoice.processingMessage || null,
      payloadJson: payload || null,
    })
  }

  private mergeSpedyResponse(invoice: FiscalInvoice, data: any) {
    invoice.spedyInvoiceId = data.id || invoice.spedyInvoiceId
    invoice.status = data.status || invoice.status
    invoice.number = data.number ? String(data.number) : invoice.number
    invoice.series = data.series ? String(data.series) : invoice.series
    invoice.rpsNumber = data.rps?.number ? String(data.rps.number) : invoice.rpsNumber
    invoice.processingStatus = data.processingDetail?.status || invoice.processingStatus
    invoice.processingCode = data.processingDetail?.code || invoice.processingCode
    invoice.processingMessage = data.processingDetail?.message || invoice.processingMessage
    invoice.responseJson = data

    if (data.issuedOn) invoice.issuedAt = DateTime.fromISO(data.issuedOn)
    if (data.status === 'canceled') invoice.canceledAt = DateTime.local()
  }

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))

    const query = FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .preload('receipt')
      .orderBy('id', 'desc')

    const status = request.input('status')
    if (status) query.where('status', status)

    const sourceType = request.input('sourceType')
    if (sourceType) query.where('source_type', sourceType)

    const data = await query.paginate(page, perPage)
    return response.status(200).send(data)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .preload('receipt')
      .preload('events', (query) => query.orderBy('id', 'desc'))
      .firstOrFail()

    return response.status(200).send(invoice)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const input = await request.validate(NfseManualInvoiceValidator)
    const config = await this.getConfig(authenticate.companies_id)
    const integrationId = `digi3-manual-${authenticate.companies_id}-${Date.now()}`
    const payload = await this.builder.fromManual(config, input, integrationId)

    const invoice = await FiscalInvoice.create({
      companiesId: authenticate.companies_id,
      sourceType: 'manual',
      provider: 'spedy',
      model: 'serviceInvoice',
      integrationId,
      status: 'sending',
      amount: payload.total.invoiceAmount,
      description: payload.description,
      receiverName: payload.receiver.name,
      receiverDocument: payload.receiver.federalTaxNumber,
      receiverEmail: payload.receiver.email || null,
      payloadJson: payload,
    })

    try {
      const spedyResponse = await this.spedy.createInvoice(config, payload)
      const oldStatus = invoice.status
      this.mergeSpedyResponse(invoice, spedyResponse)
      await invoice.save()
      await this.registerEvent(invoice, 'invoice.created', spedyResponse, oldStatus)

      return response.status(201).send(invoice)
    } catch (error) {
      invoice.status = 'failed'
      invoice.processingMessage = error.message
      await invoice.save()
      await this.registerEvent(invoice, 'invoice.failed', { message: error.message }, 'sending')
      throw error
    }
  }

  public async fromReceipt({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const input = await request.validate(NfseFromReceiptValidator)
    const config = await this.getConfig(authenticate.companies_id)

    const receipt = await Receipt
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.receiptId)
      .preload('service')
      .preload('items', (query) => {
        query.preload('emolument').orderBy('id', 'asc')
      })
      .firstOrFail()

    const integrationId = `digi3-receipt-${authenticate.companies_id}-${receipt.id}`
    const payload = await this.builder.fromReceipt(config, receipt, input, integrationId)

    let invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('integration_id', integrationId)
      .first()

    if (!invoice) {
      invoice = await FiscalInvoice.create({
        companiesId: authenticate.companies_id,
        receiptId: receipt.id,
        sourceType: 'receipt',
        provider: 'spedy',
        model: 'serviceInvoice',
        integrationId,
        status: 'sending',
        amount: payload.total.invoiceAmount,
        description: payload.description,
        receiverName: payload.receiver.name,
        receiverDocument: payload.receiver.federalTaxNumber,
        receiverEmail: payload.receiver.email || null,
        payloadJson: payload,
      })
    } else {
      invoice.merge({
        status: 'sending',
        amount: payload.total.invoiceAmount,
        description: payload.description,
        receiverName: payload.receiver.name,
        receiverDocument: payload.receiver.federalTaxNumber,
        receiverEmail: payload.receiver.email || null,
        payloadJson: payload,
      })
      await invoice.save()
    }

    try {
      const spedyResponse = await this.spedy.createInvoice(config, payload)
      const oldStatus = invoice.status
      this.mergeSpedyResponse(invoice, spedyResponse)
      await invoice.save()
      await this.registerEvent(invoice, 'invoice.created', spedyResponse, oldStatus)

      return response.status(201).send(invoice)
    } catch (error) {
      invoice.status = 'failed'
      invoice.processingMessage = error.message
      await invoice.save()
      await this.registerEvent(invoice, 'invoice.failed', { message: error.message }, 'sending')
      throw error
    }
  }

  public async checkStatus({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const config = await this.getConfig(authenticate.companies_id)

    const invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    if (!invoice.spedyInvoiceId) {
      throw new BadRequestException('Nota ainda não possui ID da Spedy', 400, 'nfse_spedy_id_missing')
    }

    const oldStatus = invoice.status
    const spedyResponse = await this.spedy.getInvoice(config, invoice.spedyInvoiceId)
    this.mergeSpedyResponse(invoice, spedyResponse)
    await invoice.save()
    await this.registerEvent(invoice, 'invoice.status_checked', spedyResponse, oldStatus)

    return response.status(200).send(invoice)
  }

  public async reconcileStatus({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const config = await this.getConfig(authenticate.companies_id)

    const invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    if (!invoice.spedyInvoiceId) {
      throw new BadRequestException('Nota ainda não possui ID da Spedy', 400, 'nfse_spedy_id_missing')
    }

    const oldStatus = invoice.status
    const spedyResponse = await this.spedy.checkStatus(config, invoice.spedyInvoiceId)
    this.mergeSpedyResponse(invoice, spedyResponse)
    await invoice.save()
    await this.registerEvent(invoice, 'invoice.reconciled', spedyResponse, oldStatus)

    return response.status(200).send(invoice)
  }

  public async cancel({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const input = await request.validate(NfseCancelValidator)
    const config = await this.getConfig(authenticate.companies_id)

    const invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    if (!invoice.spedyInvoiceId) {
      throw new BadRequestException('Nota ainda não possui ID da Spedy', 400, 'nfse_spedy_id_missing')
    }

    const oldStatus = invoice.status
    const spedyResponse = await this.spedy.cancelInvoice(config, invoice.spedyInvoiceId, input.justification)
    this.mergeSpedyResponse(invoice, spedyResponse)
    await invoice.save()
    await this.registerEvent(invoice, 'invoice.canceled', spedyResponse, oldStatus)

    return response.status(200).send(invoice)
  }

  public async xml({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const config = await this.getConfig(authenticate.companies_id)
    const invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    if (!invoice.spedyInvoiceId) {
      throw new BadRequestException('Nota ainda não possui ID da Spedy', 400, 'nfse_spedy_id_missing')
    }

    const file = await this.spedy.download(config, invoice.spedyInvoiceId, 'xml')
    response.header('content-type', file.headers['content-type'] || 'application/xml')
    return response.status(200).send(file.rawBody)
  }

  public async pdf({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const config = await this.getConfig(authenticate.companies_id)
    const invoice = await FiscalInvoice
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    if (!invoice.spedyInvoiceId) {
      throw new BadRequestException('Nota ainda não possui ID da Spedy', 400, 'nfse_spedy_id_missing')
    }

    const file = await this.spedy.download(config, invoice.spedyInvoiceId, 'pdf')
    response.header('content-type', file.headers['content-type'] || 'application/pdf')
    return response.status(200).send(file.rawBody)
  }
}
