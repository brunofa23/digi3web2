import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Company from 'App/Models/Company'

export default class extends BaseSeeder {
  public async run() {
    await Company.createMany(

      [
        {
          "id": 1,
          "name": "Digi3",
          "shortname": "Digi3",
          "address": "Rua Maria Magalhães de Souza",
          "number": 180,
          "complement": "Casa",
          "postalcode": 30820530,
          "district": "Alípio de Melo",
          "city": "Belo Horizonte",
          "state": "MG",
          "cnpj": 1111111111111111,
          "responsablename": "Vandir",
          "phoneresponsable": 31985228619,
          "email": "sistemasdigi3@gmail.com",
          "status": 1,
          "created_at": "",
          "updated_at": ""
        },
        {
          "id": 2,
          "name": "Cartório de Venda Nova",
          "shortname": "vendanova",
          "address": "Rua Teste",
          "number": 200,
          "complement": "",
          "postalcode": "",
          "district": "Centro",
          "city": "Belo Horizonte",
          "state": "MG",
          "cnpj": 2222222222222222,
          "responsablename": "Vandir",
          "phoneresponsable": "",
          "email": "teste@gmail.com",
          "status": 1,
          "created_at": "",
          "updated_at": ""
        },
       
      ]



    )
  }
}
