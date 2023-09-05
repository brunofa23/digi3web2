import { test } from '@japa/runner'
import { DateTime } from 'luxon'


const BASE_URL = 'http://127.0.0.1:3333'

const Date = require('../../app/Services/Dates/format')
// test.group('Data', (assert) => {

//   test('Testando dates', async () => {
//     const data = Date.format(DateTime.now())
//     console.log(data)
//   })
// })

// test.group('FileRename', () => {

//   test('Testando dates', async () => {
//     const data = Date.format(DateTime.now())
//     console.log(data)
//   })
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