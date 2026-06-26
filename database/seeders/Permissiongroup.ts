import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Permissiongroup from 'App/Models/Permissiongroup'

export default class extends BaseSeeder {
  public async run() {
    //await Permissiongroup.query().delete()
    await Permissiongroup.createMany(
      [
        {
          id: 40,
          name: "Lançamentos Tabulados",
          desc: "Permite o acesso a lançamentos tabulados."
        },
      ]
    )
    // Write your database queries inside the run method
  }
}
