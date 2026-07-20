import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import FiscalInvoice from 'App/Models/FiscalInvoice'
import FiscalInvoiceEvent from 'App/Models/FiscalInvoiceEvent'

export default class SpedyWebhooksController {
  public async store({ request, response }: HttpContextContract) {
    const payload = request.all()
    const data = payload.data || {}
    const spedyInvoiceId = data.id

    if (!spedyInvoiceId) {
      return response.status(200).send({ success: true })
    }

    const invoice = await FiscalInvoice
      .query()
      .where('spedy_invoice_id', spedyInvoiceId)
      .first()

    if (!invoice) {
      return response.status(200).send({ success: true })
    }

    const oldStatus = invoice.status
    invoice.status = data.status || invoice.status
    invoice.number = data.number ? String(data.number) : invoice.number
    invoice.series = data.series ? String(data.series) : invoice.series
    invoice.processingStatus = data.processingDetail?.status || invoice.processingStatus
    invoice.processingCode = data.processingDetail?.code || invoice.processingCode
    invoice.processingMessage = data.processingDetail?.message || invoice.processingMessage
    invoice.responseJson = data
    await invoice.save()

    await FiscalInvoiceEvent.create({
      companiesId: invoice.companiesId,
      fiscalInvoiceId: invoice.id,
      event: payload.event || 'invoice.status_changed',
      oldStatus,
      newStatus: invoice.status,
      message: invoice.processingMessage || null,
      payloadJson: payload,
    })

    return response.status(200).send({ success: true })
  }
}
