import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Bookrecord from 'App/Models/Bookrecord'
import Indeximage from 'App/Models/Indeximage'
import Env from '@ioc:Adonis/Core/Env'
import BadRequestException from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import Typebook from 'App/Models/Typebook'
import Document from 'App/Models/Document'
import BookrecordValidator from 'App/Validators/BookrecordValidator'
import DocumentValidator from 'App/Validators/DocumentValidator'
const fileRename = require('../../Services/fileRename/fileRename')
import { validator, schema } from '@ioc:Adonis/Core/Validator'



export default class BookrecordsController {

  //Listar Bookrecords
  public async index1({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const { codstart, codend,
      bookstart, bookend,
      approximateterm,
      indexbook,
      year,
      letter,
      sheetstart, sheetend,
      side, obs, sheetzero, noAttachment, lastPagesOfEachBook, codMax } = request.requestData

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
            .andWhere('indeximages.typebooks_id', '=', params.typebooks_id)
            .andWhere("companies_id", '=', authenticate.companies_id)
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
            .andWhere("companies_id", '=', authenticate.companies_id)
        })
        .preload('document')
        .whereRaw(query)
        .orderBy("book", "asc")
        .orderBy("cod", "asc")
        .orderBy("sheet", "asc")
        .paginate(page, limit)
    }
    return response.status(200).send(data)
  }

  public async index({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()


    const { codstart, codend,
      bookstart, bookend,
      approximateterm,
      indexbook,
      year,
      letter,
      sheetstart, sheetend,
      side, obs, sheetzero,
      noAttachment,
      lastPagesOfEachBook,
      codMax,
      //VARIÁVEIS DE DOCUMENTO
      document,
      prot,
      month,
      yeardoc,
      intfield1,
      stringfield1,
      datefield1,
      intfield2,
      stringfield2,
      datefield2,
      intfield3,
      stringfield3,
      datefield3,
      intfield4,
      stringfield4,
      datefield4,
    }
      = request.requestData

    let query = " 1=1 "
    let queryDocument = "1=1"
    let queryParams = []


    if (!codstart && !codend && !approximateterm && !year && !indexbook && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false') &&
      (lastPagesOfEachBook == 'false' || !lastPagesOfEachBook) && noAttachment == 'false' && !obs && !document)
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
      if (!document) {
        if (!sheetzero || (sheetzero == 'false'))
          query += ` and sheet>0`
      }
      //DOCUMENTS***************************************************************** */

      if (prot)
        queryDocument += ` and prot =${prot}`
      if (month)
        queryDocument += ` and month=${month}`
      if (yeardoc)
        queryDocument += ` and yeardoc=${yeardoc} `
      if (intfield1)
        queryDocument += ` and intfield1=${intfield1}`
      if (stringfield1) {
        queryDocument += ` and stringfield1=?`
        queryParams.push(stringfield1)
      }
      if (datefield1) {
        queryDocument += ` and datefield1=?`
        queryParams.push(datefield1)
      }
      if (intfield2)
        queryDocument += ` and intfield2=${intfield2}`
      if (stringfield2) {
        queryDocument += ` and stringfield2=?`
        queryParams.push(stringfield2)
      }
      if (datefield2) {
        queryDocument += ` and datefield2=?`
        queryParams.push(datefield2)
      }
      if (intfield3)
        queryDocument += ` and intfield3=${intfield3}`
      if (stringfield3) {
        queryDocument += ` and stringfield3=?`
        queryParams.push(stringfield3)
      }
      if (datefield3) {
        queryDocument += ` and datefield3=?`
        queryParams.push(datefield3)
      }
      if (intfield4)
        queryDocument += ` and intfield4=${intfield4}`
      if (stringfield4) {
        queryDocument += ` and stringfield4=?`
        queryParams.push(stringfield4)
      }
      if (datefield4) {
        queryDocument += ` and datefield4=?`
        queryParams.push(datefield4)
      }
    }

    //last pages of each book****************************
    if (lastPagesOfEachBook) {
      query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `
    }

    //pagination paginação
    const page = request.input('page', 1)
    const limit = Env.get('PAGINATION')

    queryDocument = await Database.raw(queryDocument, queryParams)
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
            .andWhere('indeximages.typebooks_id', '=', params.typebooks_id)
            .andWhere("companies_id", '=', authenticate.companies_id)
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

      console.log("cheguei no 1550", queryDocument)
      let queryFull = Bookrecord.query()
        .where("companies_id", '=', authenticate.companies_id)
        .andWhere("typebooks_id", '=', params.typebooks_id)
        .preload('indeximage', (queryIndex) => {
          queryIndex.where("typebooks_id", '=', params.typebooks_id)
            .andWhere("companies_id", '=', authenticate.companies_id)
        })
        .preload('document')
        .whereRaw(query)
        .orderBy("book", "asc")
        .orderBy("cod", "asc")
        .orderBy("sheet", "asc")
      if (document)
        queryFull.whereHas('document', (query) => {
          query.whereRaw(queryDocument)
        })
      queryFull.paginate(page, limit)
      data = await queryFull
      console.log(data)

    }
    return response.status(200).send(data)
  }

  public async show({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)
    return {
      data: data,
    }
  }

  public async store({ auth, request, params, response }: HttpContextContract) {
    const { companies_id } = await auth.use('api').authenticate()
    const body = await request.validate(BookrecordValidator)
    const bodyDocument = await request.validate(DocumentValidator)
    body.companies_id = companies_id

    try {
      const data = await Bookrecord.create(body)
      if (body.books_id == 13 && data.id) {
        bodyDocument.bookrecords_id = data.id
        console.log("Salvar documentos aqui...", bodyDocument)
        await Document.create(bodyDocument)
      }
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }


  }

  public async update({ auth, request, params, response }: HttpContextContract) {
    console.log("Passei generateOrUpdateBookrecords...")
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(Bookrecord.fillable)

    body.id = params.id
    body.companies_id = authenticate.companies_id
    body.userid = authenticate.id

    try {
      await Bookrecord.query()
        .where('id', '=', body.id)
        .andWhere('typebooks_id', '=', body.typebooks_id)
        .andWhere('companies_id', '=', authenticate.companies_id)
        .update(body)
      fileRename.updateFileName(body)
      return response.status(201).send({ body, params: params.id })
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async destroy({ auth, request, params, response }: HttpContextContract) {

    const { companies_id } = await auth.use('api').authenticate()
    try {

      //excluir imagens do google drive
      const listOfImagesToDeleteGDrive = await Indeximage.query()
        .preload('typebooks', (query) => {
          query.where('id', params.typebooks_id)
            .andWhere('companies_id', companies_id)
        })
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
  public async destroyManyBookRecords({ auth, request, response }: HttpContextContract) {
    const { companies_id } = await auth.use('api').authenticate()
    const { typebooks_id, Book, Bookend, startCod, endCod, deleteImages } = request.only(['typebooks_id', 'Book', 'Bookend', 'startCod', 'endCod', 'deleteImages'])
    //console.log("destroy many bookrecords>>>", typebooks_id, Book, Bookend, startCod, endCod, deleteImages)

    //deleteImages
    //se 1  = exclui somente o livro
    //se 2 = exclui somente as imagens
    //se 3 = exclui imagens e livro

    async function deleteIndexImages(query) {
      try {
        const deleteData = await Database
          .from('indeximages')
          .innerJoin('bookrecords', function () {
            this.on('indeximages.bookrecords_id', 'bookrecords.id')
              .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
              .andOn('indeximages.companies_id', 'bookrecords.companies_id');
          })
          .where('indeximages.typebooks_id', typebooks_id)
          .andWhere('indeximages.companies_id', companies_id)
          .whereRaw(query)
          .delete()
        //console.log(deleteData)

        return response.status(201).send({ deleteData })
      } catch (error) {
        return error
      }

    }

    async function deleteBookrecord(query) {
      try {

        //console.log("typebook", typebooks_id)
        //await Database.rawQuery('delete from `bookrecords` where `typebooks_id` = 12 and `companies_id` = 9 and 1 = 1 and book=1 ')

        const data = await Bookrecord
          .query()
          .where('typebooks_id', typebooks_id)
          .andWhere('companies_id', companies_id)
          .whereRaw(query)
          .delete()


        //console.log(data)

        return response.status(201).send({ data })
      } catch (error) {
        return error
      }
    }

    async function deleteImagesGoogle(query) {
      try {
        const listOfImagesToDeleteGDrive = await Indeximage
          .query()
          .preload('typebooks', (query) => {
            query.where('id', typebooks_id)
              .andWhere('companies_id', companies_id)
          })
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

      if (Book != undefined && (Bookend > 0 && Bookend !== undefined)) {
        query += ` and book >=${Book} and book <=${Bookend}`
      } else
        if (Book != undefined) {
          query += ` and book=${Book} `
        }

      if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
        query += ` and cod>=${startCod} and cod <=${endCod} `

      try {
        //se 1  = exclui somente o livro
        if (deleteImages == 1) {

          deleteIndexImages(query)
          deleteBookrecord(query)
          return
        }
        //se 2 = exclui somente as imagens
        else if (deleteImages == 2) {

          //await deleteImagesGoogle(query)
          await deleteIndexImages(query)
        }
        //se 3 = exclui imagens e livro
        else if (deleteImages == 3) {

          //await deleteImagesGoogle(query)
          await deleteIndexImages(query)
          await deleteBookrecord(query)
        }
      } catch (error) {
        throw new BadRequest('Bad Request update', 401, 'bookrecord_error_102')
      }

    }
  }

  //Cria uma linha 
  public async createorupdatebookrecords({ auth, request, response }) {
    console.log("Passei createorupdatebookrecords...")
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
    console.log("Passei generateOrUpdateBookrecords...")
    const authenticate = await auth.use('api').authenticate()

    let {
      generateBooks_id,
      generateBook,
      generateBookdestination,
      generateStartCode,
      generateEndCode,
      generateStartSheetInCodReference,
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

    let contFirstSide = false
    let sideNow = 0
    let approximate_term = generateApproximate_term
    let approximate_termIncrement = 0
    let indexBook = generateIndex
    let indexIncrement = generateIndexIncrement
    let sheetStart = 0//generateSheetStart
    let sheetIncrement = 0

    const bookrecords: Object[] = []

    //if (generateBookdestination <= 0 || !generateBookdestination || generateBookdestination == undefined) {
    for (let index = (generateStartCode + 1); index <= generateEndCode + 1; index++) {

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

      //INDEX******************************************************************************
      // if (indexIncrement > 0) {
      //   if (index == (generateStartCode + 1))
      //     indexBook = generateIndex
      //   else
      //     generateIndex++
      // }
      // if (generateIndex > 0) {
      //   if (index == 0) {
      //     indexBook = generateIndex
      //     indexIncrement++
      //     if (indexIncrement >= generateIndexIncrement && generateIndexIncrement > 1) {
      //       indexIncrement = 0
      //     }
      //   }
      //   else {
      //     if (indexIncrement >= generateIndexIncrement) {
      //       indexIncrement = 0
      //       indexBook++
      //     }
      //     indexIncrement++
      //   }
      // }
      //********************************************************************************************** */
      if (generateStartSheetInCodReference <= generateStartCode) {
        if (generateSheetIncrement == 1) {
          sheetStart = generateSheetStart
          generateStartSheetInCodReference++
          generateSheetStart++
        }
        else if (generateSheetIncrement == 2) {
          if (sheetIncrement < 2) {
            sheetStart = generateSheetStart
            sheetIncrement++
          }
          if (sheetIncrement == 2) {
            sheetIncrement = 0
            generateStartSheetInCodReference++
            generateSheetStart++
          }
        } else if (generateSheetIncrement == 3) {
          if (sheetIncrement < 3) {
            sheetStart = generateSheetStart
            sheetIncrement++
          }
          if (sheetIncrement == 3) {
            sheetIncrement = 0
            generateStartSheetInCodReference++
            generateSheetStart++
          }
        } else if (generateSheetIncrement == 4) {
          if (sheetIncrement < 4) {
            sheetStart = generateSheetStart
            sheetIncrement++
          }
          if (sheetIncrement == 4) {
            sheetIncrement = 0
            generateStartSheetInCodReference++
            generateSheetStart++
          }
        }
      }

      //console.log("indexbook", generateIndex, indexIncrement)
      bookrecords.push({
        cod: generateStartCode++,
        book: generateBook,
        sheet: ((!generateSheetStart || generateSheetStart == 0) ? undefined : sheetStart),
        side: (!generateSideStart || (generateSideStart != "F" && generateSideStart != "V") ? undefined : generateSideStart),
        approximate_term: ((!generateApproximate_term || generateApproximate_term == 0) ? undefined : approximate_term),
        indexbook: (!generateIndex ? null : generateIndex), //((!generateIndex || generateIndex == 0) ? undefined : indexBook),
        year: ((!generateYear ? undefined : generateYear)),
        typebooks_id: params.typebooks_id,
        books_id: generateBooks_id,
        companies_id: authenticate.companies_id,
        userid: authenticate.id
      })

    }
    //}

    try {
      for (const record of bookrecords) {

        const existingRecord = await Bookrecord.query()
          .where('cod', record.cod)
          .andWhere('book', record.book)
          .andWhere('books_id', record.books_id)
          .andWhere('typebooks_id', record.typebooks_id)
          .andWhere('companies_id', record.companies_id)
          .first()

        if (existingRecord) {
          //console.log("record", record, generateBookdestination)
          const book = record.book

          if (generateBookdestination > 0) {
            record.book = generateBookdestination
            //console.log("record", record, generateBookdestination)
          }

          await Bookrecord.query()
            .where('cod', record.cod)
            .andWhere('book', book)
            .andWhere('books_id', record.books_id)
            .andWhere('typebooks_id', record.typebooks_id)
            .andWhere('companies_id', record.companies_id)
            .update(record)

          const bookrecord = await Bookrecord.query()
            .where('cod', record.cod)
            .andWhere('book', book)
            .andWhere('books_id', record.books_id)
            .andWhere('typebooks_id', record.typebooks_id)
            .andWhere('companies_id', record.companies_id).first()

          record.id = existingRecord.id

          fileRename.updateFileName(bookrecord)

        } else {
          // Faça a lógica de criação aqui
          //console.log("NÃO EXISTE...FAZER INSERT")
          await Bookrecord.create(record)
        }
      }

      let successValidation = await new validations('bookrecord_success_100')
      return response.status(201).send(successValidation.code)

    } catch (error) {
      throw new BadRequestException("Bad Request", 402, error)
    }

    //SUBSTITUI O NUMERO DO LIVRO
  }


  public async indeximagesinitial({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    let listFiles
    let foldername
    try {
      foldername = await Typebook.query().where("companies_id", "=", authenticate.companies_id).andWhere("id", "=", params.typebooks_id).first()
      //console.log("FOLDER NAME>>>", foldername?.name, foldername?.path, foldername?.id)
      if (foldername) {
        await Typebook.query()
          .where('companies_id', '=', authenticate.companies_id)
          .andWhere('id', '=', foldername?.id)
          .update({ dateindex: 'Indexing', totalfiles: null })

      } else
        throw "ERROR::SEM PASTA DE IMAGENS"
      //ROTINA DE ALTERAR NOME DOS ARQUIVOS MODIFICADOS ENTRA AQUI
      const listFilesToModify =
        await Indeximage.query()
          .where("companies_id", "=", authenticate.companies_id)
          .andWhere("typebooks_id", "=", params.typebooks_id)
          .whereNotNull('previous_file_name')

      if (listFilesToModify) {
        for (const iterator of listFilesToModify) {
          //1 - modificar o aquivo no gdrive
          await fileRename.renameFileGoogle(iterator.file_name, foldername.path, iterator.previous_file_name)

          //console.log("passo 5", iterator.file_name, foldername.path, iterator.previous_file_name)
          //2 - modificar na coluna de file_name e setar para nulo na coluna previous_file_name
          await Indeximage.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere("typebooks_id", "=", params.typebooks_id)
            .andWhere("bookrecords_id", iterator.bookrecords_id)
            .andWhere("seq", iterator.seq)
            .andWhere("file_name", iterator.file_name)
            .update({ file_name: iterator.previous_file_name, previous_file_name: null })
          //console.log("LISTA DE ARQUIVOS modificados>>>>>", iterator.file_name, foldername.path, iterator.previous_file_name)

        }
      }
      //************************************************** */
      listFiles = await fileRename.indeximagesinitial(foldername, authenticate.companies_id)
    } catch (error) {
      console.log(error)
    }

    for (const item of listFiles.bookRecord) {
      try {
        //console.log("ITEM>>>>>>>>>", item)
        const create = await Bookrecord.create(item)
        //console.log("create>>>", create)
      } catch (error) {
        //console.log("ERRO BOOKRECORD::", error)
      }
    }

    for (const item of listFiles.indexImages) {
      try {
        await Indeximage.create(item)
      } catch (error) {
        //console.log("ERRO indeximage::", error)

      }
    }

    try {
      const typebookPayload = await Typebook.query()
        .where('companies_id', '=', authenticate.companies_id)
        .andWhere('id', '=', foldername.id)
        .update({ dateindex: new Date(), totalfiles: listFiles.indexImages.length })
      return response.status(201).send(typebookPayload)
    } catch (error) {
      return error
    }
  }


  public async bookSummary({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const typebooks_id = params.typebooks_id
    try {
      const bookSummaryPayload = await Database
        .from('bookrecords')
        .select('book', 'indexbook')
        .min('cod as initialCod')
        .max('cod as finalCod')
        .count('* as totalRows')
        .select(Database.raw(`
    (SELECT COUNT(*)
     FROM indeximages
     INNER JOIN bookrecords bkr ON
       (indeximages.bookrecords_id = bkr.id AND
       indeximages.companies_id = bkr.companies_id AND
       indeximages.typebooks_id = bkr.typebooks_id)
     WHERE bkr.companies_id = bookrecords.companies_id
       AND bkr.typebooks_id = bookrecords.typebooks_id
       AND bkr.book = bookrecords.book
       AND (IFNULL(bkr.indexbook,999999) = IFNULL(bookrecords.indexbook,999999))
       GROUP BY bkr.book, bkr.indexbook 
         ) as totalFiles
  `))
        .where('companies_id', authenticate.companies_id)
        .where('typebooks_id', typebooks_id)
        .groupBy('book', 'indexbook')
        .orderBy('bookrecords.book')

      //console.log("SUMMARY", bookSummaryPayload)
      return response.status(200).send(bookSummaryPayload)

    } catch (error) {
      return error
    }

  }


  public async updatedFiles({ auth, request, response }: HttpContextContract) {
    //const authenticate = await auth.use('api').authenticate()

    const { datestart, dateend, companies_id, bookstart, bookend, sheetstart, sheetend, side, typebooks_id } =
      request.only(['datestart', 'dateend', 'companies_id', 'bookstart', 'bookend', 'sheetstart', 'sheetend', 'typebooks_id', 'side'])

    let query = '1=1'

    if (companies_id == undefined || companies_id == null) {
      throw new BadRequestException('Bad Request', 401, "Sem empresa Selecionada")
    }
    //typebooks**************************************************
    if (typebooks_id)
      query += ` and bookrecords.typebooks_id=${typebooks_id}`

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

    try {
      const payLoad = await Database.from('bookrecords')
        .innerJoin('indeximages', (queryImages) => {
          queryImages.on('indeximages.bookrecords_id', 'bookrecords.id')
            .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
            .andOn('indeximages.companies_id', 'bookrecords.companies_id');
        })
        .select('bookrecords.*')
        .select('indeximages.file_name', 'indeximages.date_atualization')
        .whereBetween('indeximages.date_atualization', [datestart, dateend])
        .andWhere('bookrecords.companies_id', companies_id)
        .whereRaw(query)
      //console.log(payLoad)

      return response.status(200).send(payLoad)

    } catch (error) {
      return error
    }

  }



  //********************************************************* */
}
