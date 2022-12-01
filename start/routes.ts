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
Route.group(()=>{

  Route.get('/', async () => {
    return { hello: 'world' }
  })


  Route.resource("/books", 'BooksController').apiOnly()
  Route.get("/typebooks/:id/bookrecords", 'TypebooksController.bookRecords').as('TypebooksController.bookRecords')
  Route.patch("/bookrecords/createorupdatebookrecord", 'BookrecordsController.createorupdatebookrecord')
  Route.patch("/bookrecords/fetchorcreatemany", 'BookrecordsController.fetchOrCreateMany')
  Route.put("/bookrecords/generateorupdatebookrecords", 'BookrecordsController.generateOrUpdateBookRecords')

  Route.delete("/bookrecords/destroymanybookrecords", 'BookrecordsController.destroyManyBookRecords')


  Route.resource("/typebooks", 'TypebooksController').apiOnly()
  Route.resource("/bookrecords", 'BookrecordsController').apiOnly()
  Route.patch("/indeximages/:id/:id2/:id3", "IndeximagesController.update");
  Route.resource("/indeximages", 'IndeximagesController').apiOnly()



}).prefix('/api')



