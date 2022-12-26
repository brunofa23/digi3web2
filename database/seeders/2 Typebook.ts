import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Typebook from 'App/Models/Typebook'

export default class extends BaseSeeder {
  public async run() {


    await Typebook.createMany(
      [
        {
          "id":1,
          "companies_id": 1,
          "name": "Livro E",
          "status": 1,
          "path": "LIVROE",
          "books_id": 6,
        },
        {
          "id":2,
          "companies_id": 1,
          "name": "Livro D",
          "status": 1,
          "path": "LIVROD",
          "books_id": 5,
        },
        {
          "id":3,
          "companies_id": 1,
          "name": "B Auxiliar",
          "status": 1,
          "path": "LIVROBAUXILIAR",
          "books_id": 2,
        },
        {
          "id":4,
          "companies_id": 1,
          "name": "Óbito",
          "status": 1,
          "path": "LIVROOBITO",
          "books_id": 4,
        },
        {
          "id":5,
          "companies_id": 1,
          "name": "Nascimento Antigo",
          "status": 1,
          "path": "LIVRONASCIMENTO",
          "books_id": 3,
        },
        {
          "id":6,
          "companies_id": 1,
          "name": "Nascimento Novo",
          "status": 1,
          "path": "LIVRONASCIMENTONOVO",
          "books_id": 3,
        },
        {
          "id":7,
          "companies_id": 1,
          "name": "Casamento Novo",
          "status": 1,
          "path": "LIVROCASAMENTONOVO",
          "books_id": 2,
        },
        {
          "id":8,
          "companies_id": 1,
          "name": "Casamento",
          "status": 1,
          "path": "LIVROCASAMENTO",
          "books_id": 2,
        },



        {
          "id":1,
          "companies_id": 2,
          "name": "B Auxiliar",
          "status": 1,
          "path": "LIVROBAUXILIAR",
          "books_id": 2,
        },
        {
          "id":2,
          "companies_id": 2,
          "name": "Óbito",
          "status": 1,
          "path": "LIVROOBITO",
          "books_id": 4,
        },
        {
          "id":3,
          "companies_id": 2,
          "name": "Nascimento Antigo",
          "status": 1,
          "path": "LIVRONASCIMENTO",
          "books_id": 3,
        },
      ]



    )



  }
}
