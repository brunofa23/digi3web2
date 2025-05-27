import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Usergroup from 'App/Models/Usergroup'
export default class extends BaseSeeder {
  public async run() {
    // Write your database queries inside the run method
    await Usergroup.createMany(
      [
        {
          name: "Digi3",
        },
        {
          name: "Titular",
        },
        {
          name: "Substituto",
        },
        {
          name: "Escrevente",
        },
        {
          name: "Auxiliar",
        }
      ]
    )
  }
}
