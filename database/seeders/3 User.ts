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
        "password": "12345",
        "remember_me_token": "12345",
        "permission_level": 5,
        "superuser": 1,
        "status": 1
      },
      {
        "companies_id": 2,
        "name": "vendanova",
        "username": "admin",
        "email": "teste@teste.br",
        "password": "12345",
        "remember_me_token": "bruno",
        "permission_level": 3,
        "status": 0,
      },
      /*
      {
        "companies_id": 1,
        "name": "Maria",
        "username": "maria",
        "email": "teste@teste.br",
        "password":"12345",
        "remember_me_token": "12345",
        "permission_level":5,
        "status": 1,
      },


      {
        "companies_id": 2,
        "name": "Bruno",
        "username": "admin",
        "email": "teste@teste.br",
        "password":"12345",
        "remember_me_token": "bruno",
        "permission_level":5,
        "status": 1,
      },
      {
        "companies_id": 2,
        "name": "José",
        "username": "jose",
        "email": "teste@teste.br",
        "password":"12345",
        "remember_me_token": "12345",
        "permission_level":5,
        "status": 1,
      }*/

    ])
  }
}
