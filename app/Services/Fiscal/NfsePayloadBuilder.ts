import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanyFiscalIntegration from 'App/Models/CompanyFiscalIntegration'
import Receipt from 'App/Models/Receipt'
import ServiceFiscalConfig from 'App/Models/ServiceFiscalConfig'

type FiscalDefaults = {
  federalServiceCode?: string | null
  cityServiceCode?: string | null
  nbsCode?: string | null
  taxationType?: string | null
  issRate?: number | null
  issWithheld?: boolean | null
}

export default class NfsePayloadBuilder {
  private onlyDigits(value?: string | null) {
    return value ? String(value).replace(/\D/g, '') : null
  }

  private invoiceAmountFromReceipt(receipt: Receipt) {
    const items = receipt.items || []
    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    if (total <= 0) {
      throw new BadRequestException('Recibo não possui valor para emissão da NFS-e', 400, 'nfse_receipt_amount_missing')
    }

    return total
  }

  private async fiscalDefaults(config: CompanyFiscalIntegration, serviceId?: number | null): Promise<FiscalDefaults> {
    let serviceConfig: ServiceFiscalConfig | null = null

    if (serviceId) {
      serviceConfig = await ServiceFiscalConfig
        .query()
        .where('companies_id', config.companiesId)
        .where('service_id', serviceId)
        .where('enabled', true)
        .first()
    }

    return {
      federalServiceCode: serviceConfig?.federalServiceCode || config.defaultFederalServiceCode,
      cityServiceCode: serviceConfig?.cityServiceCode || config.defaultCityServiceCode,
      nbsCode: serviceConfig?.nbsCode || config.defaultNbsCode,
      taxationType: serviceConfig?.taxationType || config.defaultTaxationType,
      issRate: serviceConfig?.issRate || config.defaultIssRate,
      issWithheld: serviceConfig?.issWithheld ?? false,
    }
  }

  private buildDescription(receipt: Receipt, override?: string | null) {
    if (override) return override

    const serviceName = receipt.service?.name || 'Prestação de serviços'
    const lines = [`Ref. recibo #${receipt.id}`, serviceName]

    const items = receipt.items || []
    items.forEach((item) => {
      if (item.emolument?.name) {
        lines.push(`- ${item.emolument.name} (Qtd: ${item.qtde || 1})`)
      }
    })

    return lines.join('\n')
  }

  private ensureReceiver(receiver: any, fallback: any = {}) {
    const name = receiver?.name || fallback.name
    const federalTaxNumber = this.onlyDigits(receiver?.federalTaxNumber || fallback.federalTaxNumber)

    if (!name || !federalTaxNumber) {
      throw new BadRequestException('Tomador da NFS-e incompleto', 400, 'nfse_receiver_missing')
    }

    if (!receiver?.address) {
      throw new BadRequestException('Endereço do tomador é obrigatório para emissão da NFS-e', 400, 'nfse_receiver_address_missing')
    }

    return {
      name,
      federalTaxNumber,
      email: receiver.email || null,
      address: {
        street: receiver.address.street,
        number: receiver.address.number || undefined,
        district: receiver.address.district,
        postalCode: this.onlyDigits(receiver.address.postalCode),
        city: receiver.address.city,
      },
    }
  }

  private ensureFiscalCodes(payload: any) {
    if (!payload.federalServiceCode) {
      throw new BadRequestException('Código federal de serviço não configurado', 400, 'nfse_federal_service_code_missing')
    }

    if (!payload.cityServiceCode) {
      throw new BadRequestException('Código municipal de serviço não configurado', 400, 'nfse_city_service_code_missing')
    }

    if (!payload.taxationType) {
      throw new BadRequestException('Tipo de tributação da NFS-e não configurado', 400, 'nfse_taxation_type_missing')
    }
  }

  public async fromManual(config: CompanyFiscalIntegration, input: any, integrationId: string) {
    const defaults = await this.fiscalDefaults(config)
    const issRate = input.total.issRate ?? defaults.issRate ?? undefined
    const issAmount = input.total.issAmount ?? (issRate ? Number((input.total.invoiceAmount * issRate).toFixed(2)) : undefined)

    const payload: any = {
      integrationId,
      effectiveDate: input.effectiveDate || DateTime.local().toISO(),
      status: 'enqueued',
      sendEmailToCustomer: input.sendEmailToCustomer ?? false,
      description: input.description,
      federalServiceCode: input.federalServiceCode || defaults.federalServiceCode,
      cityServiceCode: input.cityServiceCode || defaults.cityServiceCode,
      nbsCode: input.nbsCode || defaults.nbsCode || undefined,
      taxationType: input.taxationType || defaults.taxationType,
      receiver: input.receiver,
      total: {
        ...input.total,
        issRate,
        issAmount,
        issWithheld: input.total.issWithheld ?? defaults.issWithheld ?? false,
      },
    }

    this.ensureFiscalCodes(payload)
    return payload
  }

  public async fromReceipt(config: CompanyFiscalIntegration, receipt: Receipt, input: any, integrationId: string) {
    const defaults = await this.fiscalDefaults(config, receipt.serviceId)
    const invoiceAmount = input.total?.invoiceAmount ?? this.invoiceAmountFromReceipt(receipt)
    const issRate = input.total?.issRate ?? defaults.issRate ?? undefined
    const issAmount = input.total?.issAmount ?? (issRate ? Number((invoiceAmount * issRate).toFixed(2)) : undefined)

    const payload: any = {
      integrationId,
      effectiveDate: input.effectiveDate || DateTime.local().toISO(),
      status: 'enqueued',
      sendEmailToCustomer: input.sendEmailToCustomer ?? false,
      description: this.buildDescription(receipt, input.description),
      federalServiceCode: input.federalServiceCode || defaults.federalServiceCode,
      cityServiceCode: input.cityServiceCode || defaults.cityServiceCode,
      nbsCode: input.nbsCode || defaults.nbsCode || undefined,
      taxationType: input.taxationType || defaults.taxationType,
      receiver: this.ensureReceiver(input.receiver, {
        name: receipt.applicant,
        federalTaxNumber: receipt.cpfApplicant,
      }),
      total: {
        ...(input.total || {}),
        invoiceAmount,
        issRate,
        issAmount,
        issWithheld: input.total?.issWithheld ?? defaults.issWithheld ?? false,
      },
    }

    this.ensureFiscalCodes(payload)
    return payload
  }
}
