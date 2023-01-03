/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

import Application from '@ioc:Adonis/Core/Application'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'





Route.group(() => {

  Route.get('/', async () => {
    return { hello: 'world' }
  })

  //BOOKS
  Route.resource("/books", 'BooksController').apiOnly()

  //COMPANIES
  Route.resource("/companies", 'CompaniesController').apiOnly()

  //TYPEBOOKS
  Route.resource("/companies/:companies_id/typebooks", 'TypebooksController').apiOnly


  //BOOKRECORDS
  Route.resource("/companies/:companies_id/typebooks/:typebooks_id/bookrecords", 'BookrecordsController').apiOnly()
  Route.post("/companies/:companies_id/typebooks/:typebooks_id/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookrecords')

  //INDEXIMAGES
  Route.post('/companies/:companies_id/typebooks/:typebooks_id/bookrecords/indeximages/uploads', 'indeximagesController.uploads').as('uploads')

  //USERS
  Route.resource("/companies/:companies_id/users", "UsersController").apiOnly()



  //USER LOGIN
  Route.post('login', async ({ auth, request, response }) => {
    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')


    const user = await User
    .query()
    .preload('company')
    .innerJoin('companies',`companies_id`, 'companies'+'.'+'id')
    .where('username', username)
    .andWhere('companies.shortname', shortname)//.toQuery()
    .firstOrFail()

    user.password = await Hash.make("12345")

    const testeResult = await Hash.verify("$argon2id$v=19$t=3,m=4096,p=1$jN8gat6WY4nJ0NcUaLqqtg$TaQ98qNrmbRAEvTdYJ1g5PWyQk7Ec4EC9OAUdaVQ6hw", "12345")
    return {testeResult, user, password: user.password}

  //   const teste = "12345"
  //   const testehash =  await Hash.make(teste)

  //   return {testeResult, user: testehash, teste}

  //   // Verify password
  //   if (!(await Hash.verify(user.password, password))) {
  //     return response.unauthorized('Invalid credentials')
  //   }

  //   return "deu certo"
  // const token = await auth.use('api').generate(user, {expiresIn: '1 mins'})
  // return token

  })


  Route.get('dashboard', async ({ auth }) => {
    //return auth
    await auth.use('api').authenticate()
    console.log(auth.use('api').user!)
    return "autenticado"
  })




}).prefix('/api')



