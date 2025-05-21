import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Permissiongroup from 'App/Models/Permissiongroup'

export default class extends BaseSeeder {
  public async run () {
    await Permissiongroup.createMany(
      [
        {
          
        }
      ]
    )
    // Write your database queries inside the run method
  }
}
