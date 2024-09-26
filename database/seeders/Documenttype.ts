import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Documenttype from 'App/Models/Documenttype'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Documenttype.query().delete()
    await Documenttype.createMany(
      [
        {
          "id": 1,
          "name": "REGISTRO",
        },
        {
          "id": 2,
          "name": "CERTIDÃO",
        },
        {
          "id": 3,
          "name": "PROC. HABILITAÇÃO",
        },
        {
          "id": 4,
          "name": "MANDADOS",
        },
        {
          "id": 5,
          "name": "FOLHA DE SEGURANÇA",
        },
        {
          "id": 6,
          "name": "CPF",
        },
        {
          "id": 7,
          "name": "COMUNICAÇÃO RECEBIDA",
        },
        {
          "id": 8,
          "name": "COMUNICAÇÃO EXPEDIDA",
        },
        {
          "id": 9,
          "name": "COMUNICAÇÃO INTERNA",
        },
      ]
    )

  }
}
