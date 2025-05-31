import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Groupxpermission from 'App/Models/Groupxpermission'
export default class extends BaseSeeder {
  public async run() {
    await Groupxpermission.createMany(
      [
        { usergroup_id: 1, permissiongroup_id: 1 },
        { usergroup_id: 1, permissiongroup_id: 2 },
        { usergroup_id: 1, permissiongroup_id: 3 },
        { usergroup_id: 1, permissiongroup_id: 4 },
        { usergroup_id: 1, permissiongroup_id: 5 },
        { usergroup_id: 1, permissiongroup_id: 6 },
        { usergroup_id: 1, permissiongroup_id: 7 },
        { usergroup_id: 1, permissiongroup_id: 8 },
        { usergroup_id: 1, permissiongroup_id: 9 },
        { usergroup_id: 1, permissiongroup_id: 10 },
        { usergroup_id: 1, permissiongroup_id: 11 },
        { usergroup_id: 1, permissiongroup_id: 12 },
        { usergroup_id: 1, permissiongroup_id: 13 },
        { usergroup_id: 1, permissiongroup_id: 14 },
        { usergroup_id: 1, permissiongroup_id: 15 },
        { usergroup_id: 1, permissiongroup_id: 16 },
        { usergroup_id: 1, permissiongroup_id: 17 },
        { usergroup_id: 1, permissiongroup_id: 18 },
        { usergroup_id: 1, permissiongroup_id: 19 },
        { usergroup_id: 1, permissiongroup_id: 20 },
        { usergroup_id: 1, permissiongroup_id: 21 },
        { usergroup_id: 1, permissiongroup_id: 22 },
        { usergroup_id: 1, permissiongroup_id: 23 },
        { usergroup_id: 1, permissiongroup_id: 24 },
        { usergroup_id: 1, permissiongroup_id: 25 },
        { usergroup_id: 1, permissiongroup_id: 26 },
        { usergroup_id: 1, permissiongroup_id: 27 },
        { usergroup_id: 1, permissiongroup_id: 28 },
        { usergroup_id: 1, permissiongroup_id: 29 },
      ]
    )
    // Write your database queries inside the run method
  }
}
