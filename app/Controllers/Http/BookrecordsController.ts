import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Bookrecord from 'App/Models/Bookrecord'
import Indeximage from 'App/Models/Indeximage'
import Env from '@ioc:Adonis/Core/Env'
import BadRequestException from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import Typebook from 'App/Models/Typebook'
const fileRename = require('../../Services/fileRename/fileRename')

export default class BookrecordsController {

  //Listar Bookrecords
  public async index({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const { codstart, codend,
      bookstart, bookend,
      approximateterm,
      indexbook,
      year,
      letter,
      sheetstart, sheetend,
      side, obs, sheetzero, noAttachment, lastPagesOfEachBook, codMax } = request.requestData

    console.log("request", request.requestData)

    let query = " 1=1 "
    if (!codstart && !codend && !approximateterm && !year && !indexbook && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false') &&
      (lastPagesOfEachBook == 'false' || !lastPagesOfEachBook) && noAttachment == 'false' && !obs)
      return null
    else {


      //cod**************************************************
      if (codstart != undefined && codend == undefined)
        query += ` and cod =${codstart} `
      else
        if (codstart != undefined && codend != undefined)
          query += ` and cod >=${codstart} `

      if (codend != undefined)
        query += ` and cod <= ${codend}`
      //book ************************************************
      if (bookstart != undefined && bookend == undefined)
        query += ` and book =${bookstart} `
      else
        if (bookstart != undefined && bookend != undefined)
          query += ` and book >=${bookstart} `

      if (bookend != undefined)
        query += ` and book <= ${bookend}`

      //sheet **********************************************
      if (sheetstart != undefined && sheetend == undefined)
        query += ` and sheet =${sheetstart} `
      else
        if (sheetstart != undefined && sheetend != undefined)
          query += ` and sheet >=${sheetstart} `

      if (sheetend != undefined)
        query += ` and sheet <= ${sheetend}`
      //side *************************************************
      if (side != undefined)
        query += ` and side = '${side}' `
      //aproximate_term **************************************
      if (approximateterm != undefined)
        query += ` and approximate_term=${approximateterm}`
      //obs **************************************
      if (obs != undefined)
        query += ` and obs like '${obs}%'`
      //Index **************************************
      if (indexbook != undefined)
        query += ` and indexbook=${indexbook} `
      //year ***********************************************
      if (year != undefined)
        query += ` and year like '${year}%' `
      //letter ***********************************************
      if (letter != undefined)
        query += ` and letter like '${letter}' `
      //sheetzero*****************************************
      if (!sheetzero || (sheetzero == 'false'))
        query += ` and sheet>0`
    }

    console.log("Query:::", query)
    //last pages of each book****************************
    if (lastPagesOfEachBook) {
      query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `
    }

    //pagination paginação
    const page = request.input('page', 1)
    const limit = Env.get('PAGINATION')


    let data
    if (noAttachment) {
      data = await Bookrecord.query()
        .where('companies_id', '=', authenticate.companies_id)
        .andWhere('typebooks_id', '=', params.typebooks_id)
        .whereNotExists((subquery) => {
          subquery
            .select('id')
            .from('indeximages')
            .whereColumn('indeximages.bookrecords_id', '=', 'bookrecords.id')
            .andWhere('indeximages.typebooks_id', '=', params.typebooks_id);
        })
        .whereRaw(query)
        .orderBy("book", "asc")
        .orderBy("cod", "asc")
        .orderBy("sheet", "asc")
        .paginate(page, limit)
    }
    else if (codMax) {
      data = await Database.from('bookrecords')
        .where('companies_id', authenticate.companies_id)
        .where('typebooks_id', params.typebooks_id)
        .max('cod as codMax');
    }

    else {
      data = await Bookrecord.query()
        .where("companies_id", '=', authenticate.companies_id)
        .andWhere("typebooks_id", '=', params.typebooks_id)
        .preload('indeximage', (queryIndex) => {
          queryIndex.where("typebooks_id", '=', params.typebooks_id)
        })
        .whereRaw(query)
        .orderBy("book", "asc")
        .orderBy("cod", "asc")
        .orderBy("sheet", "asc")
        .paginate(page, limit)

    }

    return response.status(200).send(data)

    // const data = await Bookrecord.query()
    //   .select('bookrecords.*').leftOuterJoin('indeximages', 'bookrecords.id', '=', 'indeximages.bookrecords_id')
    //   .select(Database.raw('(select count(`seq`) from `indeximages` indeximagesA where bookrecords.id=indeximagesA.bookrecords_id limit 1) countfiles'))
    //   .where("bookrecords.companies_id", '=', authenticate.companies_id)
    //   .andWhere("bookrecords.typebooks_id", '=', params.typebooks_id)
    //   .preload('indeximage')
    //   .groupBy('bookrecords.id')
    //   .orderBy("book", "asc")
    //   .orderBy("cod", "asc")
    //   .orderBy("sheet", "asc")
    //   .paginate(page, limit)


  }

  public async show({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)
    return {
      data: data,
    }
  }

  public async store({ auth, request, params, response }: HttpContextContract) {
    const { companies_id } = await auth.use('api').authenticate()
    const body = request.only(Bookrecord.fillable)
    body.companies_id = companies_id

    try {
      const data = await Bookrecord.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }


  }

  public async update({ auth, request, params, response }: HttpContextContract) {

    const { companies_id } = await auth.use('api').authenticate()
    const body = request.only(Bookrecord.fillable)
    body.id = params.id
    body.companies_id = companies_id

    try {
      const data = await Bookrecord.findOrFail(body.id)
      await data.fill(body).save()
      return response.status(201).send({ data, params: params.id })
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async destroy({ auth, request, params, response }: HttpContextContract) {

    const { companies_id } = await auth.use('api').authenticate()
    try {

      //excluir imagens do google drive
      const listOfImagesToDeleteGDrive = await Indeximage.query()
        .preload('typebooks')
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('bookrecords_id', "=", params.id)
        .andWhere('companies_id', "=", companies_id)


      if (listOfImagesToDeleteGDrive.length > 0) {
        var file_name = listOfImagesToDeleteGDrive.map(function (item) {
          return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
        });
        fileRename.deleteFile(file_name)
      }

      await Indeximage.query()
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('bookrecords_id', "=", params.id)
        .andWhere('companies_id', "=", companies_id).delete()

      const data = await Bookrecord.query()
        .where('id', "=", params.id)
        .andWhere('typebooks_id', '=', params.typebooks_id)
        .andWhere('companies_id', "=", companies_id).delete()

      return response.status(201).send({ data, message: "Excluido com sucesso!!" })
    } catch (error) {
      return error

    }

  }
  //EXCLUSÃO EM LOTES
  // public async destroyManyBookRecords({ auth, request, response }: HttpContextContract) {
  //   console.log("destroy many bookrecords>>>")
  //   const { companies_id } = await auth.use('api').authenticate()
  //   const { typebooks_id, Book, startCod, endCod, deleteImages, deleteOnlyImages } = request.only(['typebooks_id', 'Book', 'startCod', 'endCod', 'deleteImages', 'deleteOnlyImages'])

  //   //deleteImages
  //   //se 1  = exclui somente o livro
  //   //se 2 = exclui somente as imagens
  //   //se 3 = exclui imagens e livro

  //   let query = '1 = 1'
  //   if (Book == undefined)
  //     return null
  //   if (typebooks_id != undefined) {
  //     if (Book != undefined) {
  //       query += ` and book=${Book} `
  //     }
  //     if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
  //       query += ` and cod>=${startCod} and cod <=${endCod} `
  //     try {
  //       //deletar imagem no gdrive
  //       const listOfImagesToDeleteGDrive = await Indeximage
  //         .query()
  //         .preload('typebooks')
  //         .whereIn("bookrecords_id",
  //           Database.from('bookrecords')
  //             .select('id')
  //             .where('typebooks_id', '=', typebooks_id)
  //             .andWhere('companies_id', '=', companies_id)
  //             .whereRaw(query))

  //       if (listOfImagesToDeleteGDrive.length > 0) {
  //         var file_name = listOfImagesToDeleteGDrive.map(function (item) {
  //           return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
  //         });
  //         fileRename.deleteFile(file_name)
  //       }
  //       //******************* */
  //       //Exclui indeximages no banco
  //       const dataIndexImages = await Indeximage
  //         .query()
  //         .delete()
  //         .whereIn("bookrecords_id",
  //           Database.from('bookrecords')
  //             .select('id')
  //             .where('typebooks_id', '=', typebooks_id)
  //             .andWhere('companies_id', '=', companies_id)
  //             .whereRaw(query))
  //       //***************************** */

  //       //Exclui os livros
  //       const data = await Bookrecord
  //         .query()
  //         .where('typebooks_id', '=', typebooks_id)
  //         .andWhere('companies_id', '=', companies_id)
  //         .whereRaw(query)
  //         .delete()
  //       return response.status(201).send({ dataIndexImages, data })
  //       //*************************************** */


  //     } catch (error) {
  //       throw new BadRequest('Bad Request update', 401, 'bookrecord_error_102')
  //     }

  //   }
  // }


  //EXCLUSÃO EM LOTES
  public async destroyManyBookRecords({ auth, request, response }: HttpContextContract) {
    console.log("destroy many bookrecords>>>")
    const { companies_id } = await auth.use('api').authenticate()
    const { typebooks_id, Book, startCod, endCod, deleteImages } = request.only(['typebooks_id', 'Book', 'startCod', 'endCod', 'deleteImages'])

    //deleteImages
    //se 1  = exclui somente o livro
    //se 2 = exclui somente as imagens
    //se 3 = exclui imagens e livro

    async function deleteIndexImages() {
      try {
        const deleteData = await Indeximage
          .query()
          .delete()
          .whereIn("bookrecords_id",
            Database.from('bookrecords')
              .select('id')
              .where('typebooks_id', '=', typebooks_id)
              .andWhere('companies_id', '=', companies_id)
              .whereRaw(query))
        return response.status(201).send({ deleteData })
      } catch (error) {
        return error
      }

    }

    async function deleteBookrecord() {
      try {
        const data = await Bookrecord
          .query()
          .where('typebooks_id', '=', typebooks_id)
          .andWhere('companies_id', '=', companies_id)
          .whereRaw(query)
          .delete()
        return response.status(201).send({ data })
      } catch (error) {
        return error
      }
    }

    async function deleteImagesGoogle() {
      try {
        const listOfImagesToDeleteGDrive = await Indeximage
          .query()
          .preload('typebooks')
          .whereIn("bookrecords_id",
            Database.from('bookrecords')
              .select('id')
              .where('typebooks_id', '=', typebooks_id)
              .andWhere('companies_id', '=', companies_id)
              .whereRaw(query))
        if (listOfImagesToDeleteGDrive.length > 0) {
          var file_name = listOfImagesToDeleteGDrive.map(function (item) {
            return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
          });
          fileRename.deleteFile(file_name)
        }
      } catch (error) {
        return error
      }

    }

    let query = '1 = 1'
    if (Book == undefined)
      return null
    if (typebooks_id != undefined) {
      if (Book != undefined) {
        query += ` and book=${Book} `
      }
      if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
        query += ` and cod>=${startCod} and cod <=${endCod} `

      try {
        //se 1  = exclui somente o livro
        if (deleteImages == 1) {
          console.log("EXCLUI SOMENTE LIVRO")
          await deleteIndexImages()
          await deleteBookrecord()
        }
        //se 2 = exclui somente as imagens
        else if (deleteImages == 2) {
          console.log("EXCLUI SOMENTE IMAGENS")
          await deleteImagesGoogle()
          await deleteIndexImages()
        }
        //se 3 = exclui imagens e livro
        else if (deleteImages == 3) {
          console.log("EXCLUI TUDO")
          await deleteImagesGoogle()
          await deleteIndexImages()
          await deleteBookrecord()
        }
      } catch (error) {
        throw new BadRequest('Bad Request update', 401, 'bookrecord_error_102')
      }

    }
  }



  //Cria uma linha 
  public async createorupdatebookrecords({ auth, request, response }) {

    const authenticate = await auth.use('api').authenticate()
    const _request = request.requestBody
    let newRecord: Object[] = []
    let updateRecord: Object[] = []

    for (const iterator of _request) {
      if (!iterator.id) {
        newRecord.push({
          typebooks_id: iterator.typebooks_id,
          books_id: iterator.books_id,
          companies_id: authenticate.companies_id,
          cod: iterator.cod,
          book: iterator.book,
          sheet: iterator.sheet,
          side: iterator.side,
          approximate_term: iterator.approximate_term,
          indexbook: iterator.indexbook,
          obs: iterator.obs,
          letter: iterator.letter,
          year: iterator.year,
          model: iterator.model
        })

      }

      else {
        updateRecord.push({
          id: iterator.id,
          typebooks_id: iterator.typebooks_id,
          books_id: iterator.books_id,
          companies_id: authenticate.companies_id,
          cod: iterator.cod,
          book: iterator.book,
          sheet: iterator.sheet,
          side: iterator.side,
          approximate_term: iterator.approximate_term,
          indexbook: iterator.indexbook,
          obs: iterator.obs,
          letter: iterator.letter,
          year: iterator.year,
          model: iterator.model
        })

      }


    }

    await Bookrecord.createMany(newRecord)
    await Bookrecord.updateOrCreateMany('id', updateRecord)
    return response.status(201).send({ "Mensage": "Sucess!" })


  }

  //gera ou substitui um livro
  public async generateOrUpdateBookrecords({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()

    let {
      generateBooks_id,
      generateBook,
      generateBookdestination,
      generateStartCode,
      generateEndCode,
      generateStartSheetInCodReference,
      generateEndSheetInCodReference,
      generateSheetStart,
      generateSheetIncrement,
      generateSideStart,
      generateAlternateOfSides,
      generateApproximate_term,
      generateApproximate_termIncrement,
      generateIndex,
      generateIndexIncrement,
      generateYear,

    } = request.requestData


    //para alteração de livro
    const _startCode = generateStartCode
    const _endCode = generateEndCode

    //AQUI - FAZER VALIDAÇÃO DOS CAMPOS ANTES DE EXECUTAR
    if (!generateBook || isNaN(generateBook) || generateBook <= 0) {
      let errorValidation = await new validations('bookrecord_error_100')
      throw new BadRequestException(errorValidation.message, errorValidation.status, errorValidation.code)
    }
    if (!generateStartCode || generateStartCode <= 0) {
      let errorValidation = await new validations('bookrecord_error_101')
      throw new BadRequestException(errorValidation.message, errorValidation.status, errorValidation.code)
    }
    if (!generateEndCode || generateEndCode <= 0) {
      let errorValidation = await new validations('bookrecord_error_102')
      throw new BadRequestException(errorValidation.message, errorValidation.status, errorValidation.code)
    }

    let contSheet = !generateSheetStart ? 0 : generateSheetStart
    let contIncrementSheet = 0
    let contFirstSheet = false
    let contFirstSide = false
    let sideNow = 0
    let approximate_term = generateApproximate_term
    let approximate_termIncrement = 0
    let indexBook = generateIndex
    let indexIncrement = 0

    let sheetStart = generateSheetStart
    let sheetIncrement = 0

    const bookrecords: Object[] = []

    for (let index = (generateStartCode + 1); index <= generateEndCode + 1; index++) {

      //if (generateStartCode >= generateStartSheetInCodReference) {


      if (generateSheetStart > 0) {
        if (index == 0) {
          sheetStart = generateSheetStart
          sheetIncrement++
          if (sheetIncrement >= generateSheetIncrement && generateSheetIncrement > 1) {
            generateSheetIncrement = 0
          }
        }
        else {
          if (sheetIncrement >= generateSheetIncrement) {
            sheetIncrement = 0
            sheetStart++
          }
          sheetIncrement++
        }
      }

      if (generateAlternateOfSides == "F")
        generateSideStart = "F"
      else if (generateAlternateOfSides == "V")
        generateSideStart = "V"
      else if (generateAlternateOfSides == "FV") {
        if (contFirstSide == false) {
          generateSideStart = (generateSideStart == "F" ? "V" : "F")
          contFirstSide = true
        }
        generateSideStart = (generateSideStart == "F" ? "V" : "F")
      }
      else if (generateAlternateOfSides == "FFVV") {
        if (sideNow >= 2) {
          generateSideStart = (generateSideStart == "F" ? "V" : "F")
          sideNow = 0
        }
        sideNow++
      }



      if (generateApproximate_term > 0) {
        if (index == 0) {
          approximate_term = generateApproximate_term
          approximate_termIncrement++
          if (approximate_termIncrement >= generateApproximate_termIncrement && generateApproximate_termIncrement > 1) {
            approximate_termIncrement = 0
          }
        }
        else {

          if (approximate_termIncrement >= generateApproximate_termIncrement) {
            approximate_termIncrement = 0
            approximate_term++
          }
          approximate_termIncrement++
        }
      }

      if (generateIndex > 0) {
        if (index == 0) {
          indexBook = generateIndex
          indexIncrement++
          if (indexIncrement >= generateIndexIncrement && generateIndexIncrement > 1) {
            indexIncrement = 0
          }
        }
        else {
          if (indexIncrement >= generateIndexIncrement) {
            indexIncrement = 0
            indexBook++
          }
          indexIncrement++
        }
      }

      if ((!generateEndSheetInCodReference || generateEndSheetInCodReference == 0) && (generateSheetStart == 0) || ((index) <= generateStartSheetInCodReference))
        contSheet = 0
      else {
        contSheet = generateSheetStart
        generateSheetStart++

      }

      bookrecords.push({
        cod: generateStartCode++,
        book: generateBook,
        sheet: ((!generateSheetStart || generateSheetStart == 0) ? undefined : sheetStart),
        side: (!generateSideStart || (generateSideStart != "F" && generateSideStart != "V") ? undefined : generateSideStart),
        approximate_term: ((!generateApproximate_term || generateApproximate_term == 0) ? undefined : approximate_term),
        indexbook: ((!generateIndex || generateIndex == 0) ? undefined : indexBook),
        year: ((!generateYear ? undefined : generateYear)),
        typebooks_id: params.typebooks_id,
        books_id: generateBooks_id,
        companies_id: authenticate.companies_id
      })

    }

    try {
      const data = await Bookrecord.updateOrCreateMany(['cod', 'book', 'books_id', 'companies_id'], bookrecords)
      if (generateBook > 0 && generateBookdestination > 0) {
        await Bookrecord.query().where("companies_id", "=", authenticate.companies_id)
          .andWhere('book', '=', generateBook)
          .andWhereBetween('cod', [_startCode, _endCode]).update({ book: generateBookdestination })
      }

      let successValidation = await new validations('bookrecord_success_100')
      return response.status(201).send(data.length, successValidation.code)

    } catch (error) {
      throw new BadRequestException("Bad Request", 402)
    }

    //SUBSTITUI O NUMERO DO LIVRO
  }


  public async indeximagesinitial({ auth, params }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    let listFiles
    try {
      const foldername = await Typebook.query().where("companies_id", "=", authenticate.companies_id).andWhere("id", "=", params.typebooks_id).first()
      listFiles = await fileRename.indeximagesinitial(foldername, authenticate.companies_id)
    } catch (error) {
      return error
    }

    for (const item of listFiles.bookRecord) {
      try {
        await Bookrecord.create(item)
      } catch (error) {
        console.log("ERRO BOOKRECORD::", error)
      }
    }

    for (const item of listFiles.indexImages) {
      try {
        await Indeximage.create(item)
      } catch (error) {
        console.log("ERRO indeximage::", error)

      }
    }

    return "sucesso!!"

  }


  //********************************************************* */
}
