import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run() {

    await User.createMany([
      {
        "companies_id": 1,
        "name": "Bruno",
        "username": "bruno",
        "email": "teste@teste.br",
        "remember_me_token": "bruno",
        "status": 1,
      },
      {
        "companies_id": 1,
        "name": "João",
        "username": "joao",
        "email": "teste@teste.br",
        "remember_me_token": "12345",
        "status": 1,
      },
      {
        "companies_id": 1,
        "name": "Maria",
        "username": "maria",
        "email": "teste@teste.br",
        "remember_me_token": "12345",
        "status": 1,
      },


      {
        "companies_id": 2,
        "name": "Carlos",
        "username": "carlos",
        "email": "teste@teste.br",
        "remember_me_token": "12345",
        "status": 1,
      },
      {
        "companies_id": 2,
        "name": "José",
        "username": "jose",
        "email": "teste@teste.br",
        "remember_me_token": "12345",
        "status": 1,
      }

    ])
  }
}
