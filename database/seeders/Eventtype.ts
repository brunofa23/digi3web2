import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Eventtype from 'App/Models/Eventtype'

export default class extends BaseSeeder {
  public async run() {
    await Eventtype.createMany(
      [
        {
          "id": 1,
          "name": "Criação de Livros",
          "description": ""

        },
        {
          "id": 2,
          "name": "Ajustar Imagens",
          "description": ""

        },
        {
          "id": 3,
          "name": "Outros",
          "description": ""

        },
      ]
    )

  }
}
