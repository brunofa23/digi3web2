import { test } from '@japa/runner'
import supertest from 'supertest'


const BASE_URL = 'http://127.0.0.1:3333/api'

//CAREACU
//const token = 'MTA.EkuHcWEQST7-SO1Dv5_vszK33nCMS2AoHESOEfSrMUlFyul6m3o0QrON6cjK'
//DIGI3
const token = 'MTE.bohAV-lIRI496INqPgKLb4mstvJP1oieEN5useiyAqYYq8KIOCwAxXIHDFKP'
test.group('Companies', (group) => {
  test('Get Company', async ({ client }) => {
    const body = await supertest(BASE_URL).get('/companies')
      .set('Authorization', 'bearer ' + token)
      .expect(201)

  }).tags(['GetCompany'])


  test('store Company', async ({ client }) => {

    const companyPayload = {
      "name": "CARTORIO BELO HORIZONTE15",
      "shortname": "BELOHORIZONTE15",
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

  }).tags(['storeCompany'])

  test('update Company', async ({ client }) => {

    const companyPayload = {
      "name": "teste 777",
      "shortname": "",
      "address": "Rua Hum",
      "number": "250",
      "complement": "A",
      "postalcode": "1111111",
      "district": "Centro",
      "city": "Teste",
      "state": "MG",
      "cnpj": "32323232111232",
      "responsablename": "Maria adsf",
      "phoneresponsable": "31985228611",
      "email": "XXXXXXX@teste.com.br",
      "status": 1
    }
    const id = 14

    const body = await supertest(BASE_URL).put(`/companies/${id}`).set('Authorization', 'bearer ' + token)
      .send(companyPayload)//.expect(201)


  }).tags(['updateCompany'])


  //*******final do grupo */
})


test.group('Users', (group) => {
  test('Get User', async ({ client }) => {
    const body = await supertest(BASE_URL).get('/users')
      .set('Authorization', 'bearer ' + token)
      .expect(200)
  }).tags(['GetUser'])

  test('Store User', async ({ client }) => {

    const userPayload = {
      "name": "durval55",
      "username": "durval5005",
      "email": "teste@teste.br",
      "password": "12345",
      "remember_me_token": "12345",
      "superuser": 1,
      "permission_level": 1,
      "status": 1,
      "companies_id": 4
    }

    const body = await supertest(BASE_URL).post('/users')
      .set('Authorization', 'bearer ' + token)
      .send(userPayload)
      .expect(201)
    //console.log(">>>User", body)
  }).tags(['StoreUser'])




})


test.group('Typebook', (group) => {
  test('Get Typebook', async ({ client }) => {
    const body = await supertest(BASE_URL).get('/typebooks')
      .set('Authorization', 'bearer ' + token)
      .expect(200)
    //console.log(">>>typebooks", body)
  }).tags(['GetTypebook'])





})
