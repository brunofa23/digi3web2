import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Company from 'App/Models/Company'

export default class extends BaseSeeder {
  public async run () {
    await Company.createMany(

      [
        {
          "id": 1,
          "name": "Digi3",
          "address": "Rua Maria Magalhães de Souza",
          "number": 180,
          "complement": "Casa",
          "cep": 30820530,
          "district": "Alípio de Melo",
          "city": "Belo Horizonte",
          "state": "MG",
          "cnpj": 1111111111111111,
          "responsablename": "Bruno",
          "phoneresponsable": 31985228619,
          "email": "sistemasdigi3@gmail.com",
          "status": 1,
          "created_at": "",
          "updated_at": ""
        },
        {
          "id": 2,
          "name": "Cartório de Registro Civil Sete Lagoas",
          "address": "Rua Teste",
          "number": 200,
          "complement": "",
          "cep": "",
          "district": "Centro",
          "city": "Sete Lagoas",
          "state": "MG",
          "cnpj": 2222222222222222,
          "responsablename": "Vandir",
          "phoneresponsable": "",
          "email": "teste@gmail.com",
          "status": 1,
          "created_at": "",
          "updated_at": ""
        },
        {
          "id": 3,
          "name": "Cartório Empresa Teste",
          "address": "Rua Hum",
          "number": 250,
          "complement": "",
          "cep": "",
          "district": "Centro",
          "city": "Teste",
          "state": "MG",
          "cnpj": 3232323232323232,
          "responsablename": "Maria",
          "phoneresponsable": "",
          "email": "teste@teste",
          "status": 1,
          "created_at": "",
          "updated_at": ""
        }
      ]



    )
  }
}
