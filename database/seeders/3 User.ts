import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run() {

    await User.createMany([
      {
        "companies_id": 1,
        "name": "Administrador",
        "username": "admin",
        "email": "admin@digi3.com.br",
        "password": "Cartorio@12345",
        "remember_me_token": "Cartorio@12345",
        "permission_level": 5,
        "superuser": 1,
        "status": 1
      },


    ])
  }
}
