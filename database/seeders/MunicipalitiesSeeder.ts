import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import https from 'https'

interface IbgeMunicipality {
  id: number
  nome: string
  'regiao-imediata'?: {
    'regiao-intermediaria'?: {
      UF?: { id: number; sigla: string }
    }
  }
  microrregiao?: {
    mesorregiao?: {
      UF?: { id: number; sigla: string }
    }
  }
}

function fetchMunicipalities(): Promise<IbgeMunicipality[]> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => { body += chunk })
        response.on('end', () => {
          if (response.statusCode !== 200) {
            reject(new Error(`IBGE respondeu com status ${response.statusCode}`))
            return
          }

          try {
            resolve(JSON.parse(body))
          } catch (error) {
            reject(error)
          }
        })
      }
    )

    request.setTimeout(20000, () => request.destroy(new Error('Tempo limite ao consultar o IBGE')))
    request.on('error', reject)
  })
}

export default class extends BaseSeeder {
  public async run() {
    const municipalities = await fetchMunicipalities()
    if (!Array.isArray(municipalities) || municipalities.length < 5500) {
      throw new Error('A lista de municípios recebida do IBGE está incompleta')
    }

    const rows = municipalities.map((municipality) => {
      const uf = municipality['regiao-imediata']?.['regiao-intermediaria']?.UF
        || municipality.microrregiao?.mesorregiao?.UF

      if (!municipality.id || !municipality.nome || !uf?.sigla || !uf.id) {
        throw new Error(`Município do IBGE sem dados obrigatórios: ${municipality.id || 'sem código'}`)
      }

      return {
        ibge_code: municipality.id,
        name: municipality.nome,
        uf: uf.sigla,
        uf_ibge_code: uf.id,
      }
    })

    await Database.transaction(async (trx) => {
      for (let index = 0; index < rows.length; index += 300) {
        const batch = rows.slice(index, index + 300)
        const values = batch.map(() => '(?, ?, ?, ?)').join(', ')
        const bindings = batch.flatMap((row) => [row.ibge_code, row.name, row.uf, row.uf_ibge_code])

        await trx.rawQuery(
          `INSERT INTO municipalities (ibge_code, name, uf, uf_ibge_code)
           VALUES ${values}
           ON DUPLICATE KEY UPDATE name = VALUES(name), uf = VALUES(uf), uf_ibge_code = VALUES(uf_ibge_code)`,
          bindings
        )
      }
    })
  }
}
