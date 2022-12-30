import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Typebook from 'App/Models/Typebook'

export default class extends BaseSeeder {
  public async run() {


    await Typebook.createMany(
      [
        {
          "id": 1,
          "companies_id": 1,
          "name": "NASCIMENTO",
          "status": 1,
          "path": "NASCIMENTO",
          "books_id": 3,
        },
        {
          "id": 2,
          "companies_id": 1,
          "name": "CASAMENTO",
          "status": 1,
          "path": "CASAMENTO",
          "books_id": 2,
        },
        {
          "id": 3,
          "companies_id": 1,
          "name": "B Auxiliar",
          "status": 1,
          "path": "BAUXILIAR",
          "books_id": 2,
        },
        {
          "id": 4,
          "companies_id": 1,
          "name": "Óbito",
          "status": 1,
          "path": "OBITO",
          "books_id": 4,
        },

        {
          "id": 1,
          "companies_id": 2,
          "name": "NASCIMENTO",
          "status": 1,
          "path": "NASCIMENTO",
          "books_id": 3,
        },
        {
          "id": 2,
          "companies_id": 2,
          "name": "CASAMEMENTO",
          "status": 1,
          "path": "CASAMENTO",
          "books_id": 2,
        },
        {
          "id": 3,
          "companies_id": 2,
          "name": "OBITO",
          "status": 1,
          "path": "OBITO",
          "books_id": 4,
        },
        {
          "id": 4,
          "companies_id": 2,
          "name": "B AUXILIAR",
          "status": 1,
          "path": "BAUXILIAR",
          "books_id": 2,
        },

      ]



    )



  }
}
