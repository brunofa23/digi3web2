import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Documenttype from 'App/Models/Documenttype'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Documenttype.createMany(
      [
        {
          "id": 1,
          "name": "FOLHA DE SEGURANÇA",
        },
        {
          "id": 2,
          "name": "NASCIMENTO (LIVRO A)",
        },
        {
          "id": 3,
          "name": "OBITO (LIVRO C)",
        }

      ]





    )
  }
}
