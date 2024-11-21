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
import { DateTime } from 'luxon'

const fileRename = require('../../Services/fileRename/fileRename')
export default class BookrecordsController {

  public async index({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const { codstart, codend,
      bookstart, bookend,
      approximateterm,
      indexbook,
      year,
      letter,
      sheetstart, sheetend,
      side, obs, sheetzero, noAttachment,
      lastPagesOfEachBook, codMax,
      document,
      month,
      yeardoc,
      prot,
      documenttype_id,
      free,
      averb_anot,
      book_name,
      book_number,
      sheet_number,
      created_atStart,
      created_atEnd
    } = request.requestData
    let query = " 1=1 "

    if (!codstart && !codend && !approximateterm && !year && !indexbook && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false') &&
      (lastPagesOfEachBook == 'false' || !lastPagesOfEachBook) && noAttachment == 'false' && !obs)
      return null
    //last pages of each book****************************
    if (lastPagesOfEachBook) {
      query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `
    }

    //pagination paginação
    const page = request.input('page', 1)
    const limit = Env.get('PAGINATION')
    let data
    let queryExecute
    if (noAttachment) {

      queryExecute = Bookrecord.query()
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

      //data = await queryExecute.paginate(page, limit)
    }
    else if (codMax) {
      data = await Database.from('bookrecords')
        .where('companies_id', authenticate.companies_id)
        .where('typebooks_id', params.typebooks_id)
        .max('cod as codMax');
      return response.status(200).send(data)

    }
    else {

      queryExecute = Bookrecord.query()
        .where("bookrecords.companies_id", authenticate.companies_id)
        .andWhere("bookrecords.typebooks_id", params.typebooks_id)
        .preload('indeximage', (queryIndex) => {
          queryIndex.where("typebooks_id", '=', params.typebooks_id)
            .andWhere("companies_id", '=', authenticate.companies_id)
        })
        .preload('document', query => {
          query.where('typebooks_id', params.typebooks_id)
            .andWhere("companies_id", authenticate.companies_id)
        })
        .whereRaw(query)
        .orderBy("book", "asc")
        .orderBy("cod", "asc")
        .orderBy("sheet", "asc")
    }

    //CODIGO*****************************************************
    if (codstart != undefined && codend == undefined)
      queryExecute.where('cod', codstart)
    else
      if (codstart != undefined && codend != undefined)
        queryExecute.where('cod', '>=', codstart)
    if (codend != undefined)
      queryExecute.where('cod', '<=', codend)
    //BOOK ************************************************
    if (bookstart != undefined && bookend == undefined)
      queryExecute.where('book', bookstart)
    else
      if (bookstart != undefined && bookend != undefined)
        queryExecute.where('book', '>=', bookstart)
    if (bookend != undefined)
      queryExecute.where('book', '<=', bookend)
    //SHEET **********************************************
    if (sheetstart != undefined && sheetend == undefined)
      queryExecute.where('sheet', sheetstart)
    else
      if (sheetstart != undefined && sheetend != undefined)
        queryExecute.where('sheet', '>=', sheetstart)
    if (sheetend != undefined)
      queryExecute.where('sheet', '<=', sheetend)

    //side *************************************************
    if (side != undefined)
      queryExecute.where('side', side)
    //aproximate_term **************************************
    if (approximateterm != undefined)
      queryExecute.where('approximate_term', approximateterm)
    //obs **************************************
    if (obs != undefined)
      queryExecute.where('obs', obs)
    //Index **************************************
    if (indexbook != undefined)
      queryExecute.where('indexbook', indexbook)
    //year ***********************************************
    if (year != undefined)
      queryExecute.where('year', year)
    //letter ***********************************************
    if (letter != undefined)
      queryExecute.where('letter', letter)
    //sheetzero*****************************************
    if (document != 'true')
      if (!sheetzero || (sheetzero == 'false'))
        queryExecute.where('sheet', '>', 0)

    //DOCUMENTOS***************************************************
    if (document == 'true') {
      queryExecute.whereHas('document', query => {
        //Data inicial
        if (created_atStart != undefined)
          query.where('created_at', '>=', created_atStart)

        //Data Final
        if (created_atEnd != undefined)
          query.where('created_at', '<=', DateTime.fromISO(created_atEnd).plus({ days: 1 }).toFormat("yyyy-MM-dd"))

        //Protocolo
        if (prot != undefined)
          query.where('documents.prot', prot)
        //Documenttype - tipo de livro
        if (documenttype_id != undefined)
          query.where('documenttype_id', documenttype_id)
        //Free - se é gratuito
        if (free == 'true') {
          query.where('free', 1)
        }
        //Averb_anot - se é gratuito
        if (averb_anot == 'true') {
          query.where('averb_anot', 1)
        }
        //Nome do livro
        if (book_name != undefined)
          query.where('book_name', book_name)
        //Numero do livro
        if (book_number != undefined)
          query.where('book_number', book_number)
        //Numero do livro
        if (sheet_number != undefined)
          query.where('sheet_number', sheet_number)
        //Mes
        if (month != undefined)
          query.where('month', month)
        //Ano
        if (yeardoc != undefined)
          query.where('yeardoc', yeardoc)
      })
    }
    //*******************************************************************/
    //console.log(queryExecute.toQuery())
    data = await queryExecute.paginate(page, limit)
    return response.status(200).send(data)
  }

  public async fastFind({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { book, sheet, typebook } = request.only(['book', 'sheet', 'typebook'])

    const query = Bookrecord.query()
      .where("bookrecords.companies_id", authenticate.companies_id)
      .preload('indeximage', (subQuery) => {
        subQuery.select('indeximages.*'); // Se necessário, ajuste os campos a serem carregados
        subQuery.where('companies_id', authenticate.companies_id)
      })
      .preload('typebooks', (subQuery) => {
        subQuery.select('typebooks.*'); // Se necessário, ajuste os campos a serem carregados
        subQuery.where('companies_id', authenticate.companies_id)
      });

    if (book)
      query.where('bookrecords.book', book);
    if (sheet)
      query.where('bookrecords.sheet', sheet);
    if (typebook)
      query.where('bookrecords.typebooks_id', typebook);

    query.orderBy('bookrecords.book', 'asc')
      .orderBy('bookrecords.cod', 'asc')
      .orderBy('bookrecords.sheet', 'asc');
    const data = await query

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
    const { document } = request.only(['document'])//await request.validate(DocumentValidator)
    body.companies_id = companies_id
    const bodyDocument = document

    try {
      const data = await Bookrecord.create(body)
      if (body.books_id == 13 && data.id) {
        bodyDocument.bookrecords_id = data.id
        bodyDocument.typebooks_id = body.typebooks_id
        bodyDocument.books_id = body.books_id
        bodyDocument.companies_id = body.companies_id
        await Document.create(bodyDocument)
      }
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }


  }

  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(Bookrecord.fillable)
    const { document } = request.only(['document'])

    body.id = params.id
    body.companies_id = authenticate.companies_id
    body.userid = authenticate.id
    try {
      await Bookrecord.query()
        .where('id', body.id)
        .andWhere('typebooks_id', body.typebooks_id)
        .andWhere('companies_id', authenticate.companies_id)
        .update(body)
      if (body.books_id == 13 && body.id) {
        await Document.query()
          .where('id', document.id)
          .andWhere('typebooks_id', body.typebooks_id)
          .andWhere('companies_id', authenticate.companies_id)
          .update(document)
      }
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
        .where('typebooks_id', params.typebooks_id)
        .andWhere('bookrecords_id', params.id)
        .andWhere('companies_id', companies_id)
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

        return response.status(201).send({ deleteData })
      } catch (error) {
        return error
      }

    }

    async function deleteBookrecord(query) {
      try {
        const data = await Bookrecord
          .query()
          .where('typebooks_id', typebooks_id)
          .andWhere('companies_id', companies_id)
          .whereRaw(query)
          .delete()

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

      if (startCod > 0 && (endCod == undefined || endCod == 0))
        query += ` and cod=${startCod} `
      else
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
          const book = record.book

          if (generateBookdestination > 0) {
            record.book = generateBookdestination
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
      foldername = await Typebook
        .query()
        .preload('company')
        .where("companies_id", "=", authenticate.companies_id)
        .andWhere("id", "=", params.typebooks_id).first()

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
          await fileRename.renameFileGoogle(iterator.file_name, foldername.path, iterator.previous_file_name, foldername.company.cloud)

          //2 - modificar na coluna de file_name e setar para nulo na coluna previous_file_name
          await Indeximage.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere("typebooks_id", "=", params.typebooks_id)
            .andWhere("bookrecords_id", iterator.bookrecords_id)
            .andWhere("seq", iterator.seq)
            .andWhere("file_name", iterator.file_name)
            .update({ file_name: iterator.previous_file_name, previous_file_name: null })

        }
      }

      listFiles = await fileRename.indeximagesinitial(foldername, authenticate.companies_id, foldername.company.cloud)
    } catch (error) {
      console.log(error)
    }
    //***************************************************** */
    for (const item of listFiles.bookRecord) {
      try {
        const { yeardoc, month, ...itemBook } = item
        const create = await Bookrecord.create(itemBook)
        if (item.books_id == 13)
          await Document.create({ bookrecords_id: create.id, month: item.month, yeardoc: item.yeardoc })
      } catch (error) {
        console.log("chequiei aqui 77 error", error)
        //return error
      }
    }

    for (const item of listFiles.indexImages) {
      try {
        await Indeximage.create(item)
      } catch (error) {
        //return error
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

  public async bookSummary({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const typebooks_id = params.typebooks_id
    const { book, bookStart, bookEnd } = request.qs()
    console.log("body:", bookStart, bookEnd, request.qs())

    try {
      const query = Database
        .from('bookrecords')
        .select('book', 'indexbook')
        .min('cod as initialCod')
        .max('cod as finalCod')
        .min('sheet as initialSheet')
        .max('sheet as finalSheet')
        .count('* as totalRows')
        .select(Database.raw(`(select CONCAT(CAST(MIN(sheet) AS CHAR), side)  from bookrecords bkr where bkr.companies_id = bookrecords.companies_id and bkr.typebooks_id = bookrecords.typebooks_id and bkr.book=bookrecords.book and side = 'V' and sheet=1 group by side, book, typebooks_id, companies_id )as sheetInicial`))
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
       AND indeximages.companies_id = ${authenticate.companies_id}
       AND indeximages.typebooks_id = ${typebooks_id}
       GROUP BY bkr.book, bkr.indexbook
         ) as totalFiles
  `))
        .where('companies_id', authenticate.companies_id)
        .andWhere('typebooks_id', typebooks_id)
      if (book > 0) {
        query.andWhere('book', book)
      } else if (bookStart > 0 || bookEnd > 0) {
        if(bookStart >0)
          query.andWhere('book','>=', bookStart)
        if(bookEnd >0)
          query.andWhere('book','<=', bookEnd)
      }

      query.groupBy('book', 'indexbook')
      query.orderBy('bookrecords.book')

      //console.log(query.toQuery())

      const bookSummaryPayload = await query
      //**************************************** */
      //FUNÇÃO PARA CONTAR FOLHAS NÃO EXISTENTES
      async function countSheet(book) {
        const query = `WITH RECURSIVE NumberList AS (
                                SELECT 1 AS sheet
                                UNION ALL
                                SELECT sheet + 1
                                FROM NumberList
                                WHERE sheet < (select max(sheet)from bookrecords where companies_id=${authenticate.companies_id} and typebooks_id=${typebooks_id} and book=${book})
                                )
                              SELECT nl.sheet
                              FROM NumberList nl
                              WHERE NOT EXISTS (
                              SELECT 1
                              FROM bookrecords br
                              WHERE br.sheet = nl.sheet
                               AND br.companies_id = ${authenticate.companies_id}
                                AND br.typebooks_id =  ${typebooks_id}
                                and br.book = ${book}
                          );`

        const result = await Database.rawQuery(query);
        const data = result[0] || []
        const values = data.map(row => row.sheet);
        const valuesString = values.join(',')
        return valuesString
      }

      const bookSumaryList = []
      for (const item of bookSummaryPayload) {
        item.noSheet = await countSheet(item.book)
        bookSumaryList.push(item)
      }
      return response.status(200).send(bookSummaryPayload)

    } catch (error) {
      return error
    }

  }

  public async sheetWithSide({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { typebooks_id, book } = params
    const query = `WITH RECURSIVE NumberList AS (
        SELECT 1 AS sheet
        UNION ALL
        SELECT sheet + 1
        FROM NumberList
        WHERE sheet < (select max(sheet)from bookrecords where companies_id=${authenticate.companies_id} and typebooks_id=${typebooks_id} and book=${book})
      ),
      Sides AS (
        SELECT 'V' AS side
        UNION ALL
        SELECT 'F' AS side
      ),
      PossibleCombinations AS (
        SELECT nl.sheet, s.side
        FROM NumberList nl
        CROSS JOIN Sides s
      )
      SELECT pc.sheet, pc.side
      FROM PossibleCombinations pc
      WHERE NOT EXISTS (
        SELECT 1
        FROM bookrecords br
        WHERE br.sheet = pc.sheet
          AND br.side = pc.side
          AND br.companies_id = ${authenticate.companies_id}
        AND br.typebooks_id =  ${typebooks_id}
        and br.book = ${book}
      );`

    const result = await Database.rawQuery(query);
    const data = result[0] || []
    const values = data.map(row => `${row.sheet}${row.side}`);
    const valuesString = values.join(', ')
    return response.status(200).send(valuesString)


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

      return response.status(200).send(payLoad)

    } catch (error) {
      return error
    }

  }


  public async generateOrUpdateBookrecordsDocument({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    let { startCod, endCod, year, month, box, prot, box_replace } = request.requestData
    let bookRecord = {}
    let document = {}
    let cod = startCod

    if (year == -1)
      document.yeardoc = null
    else
      if (year)
        document.yeardoc = year

    if (month == -1)
      document.month = null
    else
      if (month)
        document.month = month


    if (startCod > endCod)
      //   let errorValidation = await new validations('bookrecord_error_102')
      throw new BadRequestException("erro: codigo inicial maior que o final")


    while (startCod <= endCod) {
      try {

        bookRecord = {
          cod: startCod,
          typebooks_id: params.typebooks_id,
          books_id: 13,
          book: box,
          companies_id: authenticate.companies_id,
        }

        const verifyBookRecord = await Bookrecord.query()
          .where('cod', bookRecord.cod)
          .andWhere('companies_id', authenticate.companies_id)
          .andWhere('typebooks_id', bookRecord.typebooks_id)
          .andWhere('books_id', 13)
          .andWhere('book', bookRecord.book).first()



        if (verifyBookRecord) {
          //update
          if (box_replace)
            bookRecord.book = box_replace

          const bookRecordId = await Bookrecord.query()
            .where('id', verifyBookRecord.id)
            .andWhere('typebooks_id', verifyBookRecord.typebooks_id)
            .andWhere('companies_id', verifyBookRecord.companies_id)
            .andWhere('books_id', 13)
            .update(bookRecord)
          document.bookrecords_id = verifyBookRecord.id
          if (prot)
            document.prot = prot++
          const documentUpdate = await Document.query()
            .where('bookrecords_id', verifyBookRecord.id)
            .andWhere('typebooks_id', verifyBookRecord.typebooks_id)
            .andWhere('companies_id', verifyBookRecord.companies_id)
            .andWhere('books_id', 13)
            .update(document)
        } else {
          //create

          const bookRecordId = await Bookrecord.create(bookRecord)
          document.bookrecords_id = bookRecordId.id
          document.typebooks_id = bookRecord.typebooks_id
          document.books_id = 13
          document.companies_id = bookRecord.companies_id

          if (prot)
            document.prot = prot++
          await Document.create(document)
        }

        startCod++

      } catch (error) {
        throw new BadRequestException("Bad Request", 402, error)
      }
    }

    let successValidation = await new validations('bookrecord_success_100')
    return response.status(201).send(successValidation.code)
  }

  public async maxBookRecord({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { box, typebooks_id } = request.only(['box', 'typebooks_id'])

    if (typebooks_id == undefined)
      return

    const maxBook = await Bookrecord.query()
      .where('typebooks_id', typebooks_id)
      .andWhere('companies_id', authenticate.companies_id)
      .max('book as max_book')
      .first();
    let maxSheet
    if (maxBook) {
      maxSheet = await Bookrecord.query()
        .where('typebooks_id', typebooks_id)
        .andWhere('companies_id', authenticate.companies_id)
        .andWhere('book', maxBook?.$extras.max_book)
        .max('sheet as max_sheet')
        .first();
    }
    const query = Bookrecord.query()
      .where('typebooks_id', typebooks_id)
      .andWhere('companies_id', authenticate.companies_id)
      // if(box)
      //   query.andWhere('book', box)
      .max('cod as max_cod').first()
    const maxCodDocument = await query;

    return response.status(200).send({ max_book: maxBook?.$extras.max_book, max_sheet: maxSheet.$extras.max_sheet, max_cod_document: maxCodDocument?.$extras.max_cod })
  }

  //********************************************************* */
}
