import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import BadRequestException from 'App/Exceptions/BadRequestException'

const ufItems = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export default class MunicipalitiesController {
  public async index({ request }: HttpContextContract) {
    const uf = String(request.input('uf') || '').trim().toUpperCase()
    if (!ufItems.includes(uf)) {
      throw new BadRequestException('Informe uma UF válida.', 400, 'municipality_invalid_uf')
    }

    return Database
      .from('municipalities')
      .where('uf', uf)
      .select('ibge_code as ibgeCode', 'name', 'uf', 'uf_ibge_code as ufIbgeCode')
      .orderBy('name', 'asc')
  }
}
