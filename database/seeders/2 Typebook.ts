import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Typebook from 'App/Models/Typebook'

export default class extends BaseSeeder {
  public async run () {


await Typebook.createMany(
  [
    {

        "name": "Livro E",
        "status": 1,
        "path": "C:\\Livro E\\",
        "books_id": 6,
    },
    {
        "name": "Livro D",
        "status": 1,
        "path": "C:\\Livro D\\",
        "books_id": 5,
    },
    {
        "name": "B Auxiliar",
        "status": 1,
        "path": "C:\\bauxiliar\\",
        "books_id": 2,
    },
    {
        "name": "Óbito",
        "status": 1,
        "path": "C:\\obito\\",
        "books_id": 4,
    },
    {
        "name": "Nascimento Antigo",
        "status": 1,
        "path": "C:\\Nascimento\\",
        "books_id": 3,
    },
    {
        "name": "Nascimento Novo",
        "status": 1,
        "path": "C:\\Nascimento Novo\\",
        "books_id": 3,
    },
    {
        "name": "Casamento Novo",
        "status": 1,
        "path": "C:\\Casamento Novo\\",
        "books_id": 2,
    },
    {
        "name": "Casamento",
        "status": 1,
        "path": "C:\\Casamento\\",
        "books_id": 2,
    }
]



)



  }
}
