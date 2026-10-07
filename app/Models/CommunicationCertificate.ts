import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class CommunicationCertificate extends BaseModel {
  public static table = 'communication_certificates'

  @column({ isPrimary: true }) public id: number
  @column({ columnName: 'companies_id', serializeAs: 'companiesId' }) public companiesId: number
  @column({ columnName: 'usr_id', serializeAs: 'usrId' }) public usrId: number | null
  @column.date({ columnName: 'registration_date', serializeAs: 'registrationDate' }) public registrationDate: DateTime
  @column({ columnName: 'registered_name', serializeAs: 'registeredName' }) public registeredName: string
  @column({ columnName: 'service_type', serializeAs: 'serviceType' }) public serviceType: number
  @column({ columnName: 'delivery_type', serializeAs: 'deliveryType' }) public deliveryType: number
  @column({ columnName: 'communication_type', serializeAs: 'communicationType' }) public communicationType: number
  @column({ columnName: 'origin_office', serializeAs: 'originOffice' }) public originOffice: string
  @column({ columnName: 'origin_obs', serializeAs: 'originObs' }) public originObs: string | null
  @column({ columnName: 'destination_office', serializeAs: 'destinationOffice' }) public destinationOffice: string
  @column({ columnName: 'destination_obs', serializeAs: 'destinationObs' }) public destinationObs: string | null
  @column.dateTime({ columnName: 'created_at', serializeAs: 'createdAt', autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ columnName: 'updated_at', serializeAs: 'updatedAt', autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
