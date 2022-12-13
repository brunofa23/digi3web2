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


  Route.post('typebooks/:id/indeximages/uploads', 'indeximagesController.uploads').as('uploads')


  // Route.post('/indeximages/uploads', async ({ request }) => {
  //   console.log("UPLOADS");

  //   const images = request.files('images',{
  //     size: '2mb',
  //     extnames:['jpg', 'png', 'jpeg', 'pdf']
  //   })

  //   let cont = 1
  //   for (let image of images) {

  //     if(!image){
  //       console.log("não é imagem")
  //     }
  //     if(!image.isValid){
  //       console.log("Error", image.errors);

  //     }

  //     await image.move(Application.tmpPath('uploads'),{name:`cont${cont}.${image.extname}`,overwrite:true})
  //     cont++
  //     console.log("Name:",image.fieldName, ' ClienteName', image.clientName, 'tamanho:', image.size, 'path:', image.tmpPath, 'ext', image.extname);

  //   }

  // })


}).prefix('/api')



