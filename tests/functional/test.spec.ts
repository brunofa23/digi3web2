import { test } from '@japa/runner'
import { assert } from 'console'
import { DateTime } from 'luxon'
import supertest from 'supertest'


const BASE_URL = 'http://127.0.0.1:3333/api'

test.group('Companies', (group) => {
  //CAREACU 
  //const token = 'MTA.EkuHcWEQST7-SO1Dv5_vszK33nCMS2AoHESOEfSrMUlFyul6m3o0QrON6cjK'
  //DIGI3 
  const token = 'MTE.bohAV-lIRI496INqPgKLb4mstvJP1oieEN5useiyAqYYq8KIOCwAxXIHDFKP'
  test('Get Company', async ({ client }) => {
    const body = await supertest(BASE_URL).get('/companies')
      .set('Authorization', 'bearer ' + token)
      .expect(201)
    console.log(">>>CLIENT", body)

  }).tags(['GetCompany'])


  test('store Company', async ({ client }) => {

    const companyPayload = {
      "name": "CARTORIO BELO HORIZONTE11",
      "shortname": "BELOHORIZONTE11",
      "address": "Rua Hum",
      "number": "250",
      "complement": "A",
      "postalcode": "1111111",
      "district": "Centro",
      "city": "Teste",
      "state": "MG",
      "cnpj": "32323232111232",
      "responsablename": "Maria",
      "phoneresponsable": "31985228611",
      "email": "teste@teste.com.br",
      "status": 1
    }

    const body = await supertest(BASE_URL).post('/companies')
      .set('Authorization', 'bearer ' + token)
      .send(companyPayload)
    //.expect(201)
    console.log(">>>CLIENT", body)

  }).tags(['storeCompany'])



})

// test.group('Companies', (group) => {

//   test('Create Company', async (assert) => {
//     const companyPayload = {
//       name: 'teste_teste',
//       shortname: 'teste_shortname',
//       foldername: 'teste_1',
//     }


//     //const body = await supertest(BASE_URL).get('/companies').send(companyPayload).expect(200)
//   }).tags(['CreateCompany'])



// })

// test.group('Data', (assert) => {

//   test('Testando dates', async () => {
//     const data = Date.format(DateTime.now())
//     console.log(data)
//   }).tags(['datas'])

//   test('Testando sleep', async () => {
//     const data = Date.format(DateTime.now())
//     console.log("teste", data)
//   }).tags(['sleep'])


// })



//test.group('User', (assert) => {
  // test('display welcome page', async ({ client, assert }) => {
  //   const userPayload = { email: 'teste@teste10', username: 'test10', password: '12345', avatar: '' }
  //   const response = await client.post('/users').json(userPayload)

  // }).tags(['teste2'])

  // test('it should return 409 when email is already in use', async ({ client }) => {
  //   const user = await UserFactory.create()

    // const response = await client.post('/users').json({
    //   email: 'Isabella_Schuliqwst@gmail.com',
    //   username: 'Michelle Sawqwayn',
    //   password: user.password,
    // })
    // response.assertStatus(201)

  // }).tags(['teste3'])

// })