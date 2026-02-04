import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Permissiongroup from 'App/Models/Permissiongroup'

export default class extends BaseSeeder {
  public async run() {
    //await Permissiongroup.query().delete()
    await Permissiongroup.createMany(
      [
        {
          id: 34,
          name: "Cadastro de Numeração de Selos",
          desc: "Menu -> Cadastros ->Selos"
        },
        {
          id: 35,
          name: "Cadastro de Tributos",
          desc: "Menu -> Cadastros -> Tributos"
        },
      ]
    )
    // Write your database queries inside the run method
  }
}
