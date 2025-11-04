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
import { schema, rules } from '@ioc:Adonis/Core/Validator'
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
      lastPagesOfEachBook, codmax,
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
      created_atstart,
      created_atend,
      document_type_book_id,
      obs_document,
      fin_entity_List
    } = request.qs()

    console.log(created_atstart, "-",obs_document)


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
    else if (codmax) {
      data = await Database.from('bookrecords')
        .where('companies_id', authenticate.companies_id)
        .where('typebooks_id', params.typebooks_id)
        .max('cod as codmax');
      return response.status(200).send(data)

    }
    else {


      queryExecute = Bookrecord.query()
        .where("bookrecords.companies_id", authenticate.companies_id)
        //IF PARAMETER=0 THEN COME ALL
        .if(params.typebooks_id > 0, query => {
          query.andWhere("bookrecords.typebooks_id", params.typebooks_id)
        })
        // .andWhere("bookrecords.typebooks_id", params.typebooks_id)

        .preload('indeximage', (queryIndex) => {
          queryIndex.where("companies_id", '=', authenticate.companies_id)
        })
        // .preload('indeximage', (queryIndex) => {
        //   queryIndex.where("typebooks_id", '=', params.typebooks_id)
        //     .andWhere("companies_id", '=', authenticate.companies_id)
        // })
        .preload('document', query => {
          query.preload('documenttype', query => {
            query.select('name')
          })
            .preload('documenttypebook', query => {
              query.select('description')
            })
            .preload('entity', query => {
              query.select('description')
            })
        })

        // .preload('typebooks', query=>{
        //   query.select('name')
        // })

        // .preload('document', query => {
        //   query.where('typebooks_id', params.typebooks_id)
        //     .andWhere("documents.companies_id", authenticate.companies_id)
        //     .preload('documenttype', query => {
        //       query.select('name')
        //     })
        //     .preload('documenttypebook', query => {
        //       query.select('description')
        //     })
        //     .preload('entity', query=>{
        //       query.select('description')
        //     })
        // })
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

      if (params.typebooks_id == 0)
        queryExecute.preload('typebooks', query => {
          query.select('name')
        })

      queryExecute.whereHas('document', query => {
        //Data inicial
        if (created_atstart != undefined) {
          query.where('created_at', '>=', created_atstart)
        }

        //Data Final
        if (created_atend != undefined) {
          query.where('created_at', '<=', DateTime.fromISO(created_atend).plus({ days: 1 }).toFormat("yyyy-MM-dd"))
        }

        //Protocolo
        if (prot != undefined)
          query.where('documents.prot', prot)
        //Documenttype - tipo de livro
        if (documenttype_id != undefined)
          query.where('documenttype_id', documenttype_id)

        //DOCUMENTTYPEBOOK - type of book to document
        if (document_type_book_id != undefined)
          query.where('document_type_book_id', document_type_book_id)

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
        //OBS
        if (obs_document != undefined)
          query.where('obs', 'like', `%${obs_document}%`)

        //ENTIDADE
        query.if(fin_entity_List, q => {
          const ids = String(fin_entity_List)
            .split(',')               // ['1','2','3']
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id))

          if (ids.length > 1) {
            q.whereIn('fin_entities_id', ids)
          } else if (ids.length === 1) {
            q.where('fin_entities_id', ids[0])
          }
        })
      })
    }
    //*******************************************************************/
    data = await queryExecute.paginate(page, limit)

    return response.status(200).send(data)
  }

  public async fastFind({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { book, sheet, typebook } = request.only(['book', 'sheet', 'typebook'])
    if (!book || !sheet)
      return
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

  public async fastFindDocuments({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { prot, dateStart, dateEnd, book_number, book_name, sheet_number, obs }
      = request.only(['prot', 'dateStart', 'dateEnd', 'book_number', 'book_name', 'sheet_number', 'avert_anot', 'typebook', 'obs'])
    const query = Bookrecord.query()
      .select('bookrecords.*')
      .innerJoin('documents', (join) => {
        join.on('bookrecords.id', 'documents.bookrecords_id')
          .andOn('bookrecords.companies_id', 'documents.companies_id')
      })
      .where("bookrecords.companies_id", authenticate.companies_id)
      .leftOuterJoin('indeximages', (join) => {
        join.on('bookrecords.id', 'indeximages.bookrecords_id')
          .andOn('bookrecords.companies_id', 'indeximages.companies_id')
          .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
      })
      .preload('document')
      .preload('indeximage')
      .preload('typebooks', (subQuery) => {
        subQuery.select('typebooks.name'); // Se necessário, ajuste os campos a serem carregados
        subQuery.where('companies_id', authenticate.companies_id)
      });

    if (prot)
      query.where('documents.prot', '=', prot)
    if (dateStart)
      query.where('documents.created_at', '>=', dateStart)
    if (dateEnd)
      query.where('documents.created_at', '<=', dateEnd)
    if (prot)
      query.where('documents.prot', prot);
    if (book_number)
      query.where('documents.book_number', book_number);
    if (sheet_number)
      query.where('documents.sheet_number', sheet_number);
    //  if (typebook)
    //     query.where('bookrecords.typebooks_id', typebook);
    if (book_name)
      query.where('documents.book_name', book_name)
    if (obs)
      query.where('documents.obs', 'like', `%${obs}%`)

    query.groupBy(
      'bookrecords.id',
      'bookrecords.typebooks_id',
      'bookrecords.books_id',
      'bookrecords.companies_id',
      'bookrecords.cod',
      'bookrecords.book',
      'bookrecords.sheet',
      'bookrecords.side',
      'bookrecords.approximate_term',
      'bookrecords.indexbook',
      'bookrecords.letter',
      'bookrecords.year',
      'bookrecords.model',
    )

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

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(BookrecordValidator)
    const { document } = request.only(['document'])

    try {
      // 🔹 Define informações de contexto
      body.companies_id = authenticate.companies_id
      body.userid = authenticate.id

      // 🔹 Cria o Bookrecord principal
      const bookrecord = await Bookrecord.create(body)

      let createdDocument = null

      // 🔹 Se for um tipo de livro que precisa de Document
      if (bookrecord.books_id === 13 && document) {
        // Remove campos de relacionamento do Document
        const cleanDocument = { ...document }
        delete cleanDocument.documenttype
        delete cleanDocument.documenttypebook

        // Define chaves de relação
        cleanDocument.bookrecords_id = bookrecord.id
        cleanDocument.typebooks_id = bookrecord.typebooks_id
        cleanDocument.books_id = bookrecord.books_id
        cleanDocument.companies_id = bookrecord.companies_id

        // Cria o Document
        createdDocument = await Document.create(cleanDocument)
      }

      // 🔹 Recarrega o Bookrecord com seus relacionamentos
      await bookrecord.load((loader) => {
        loader
          .preload('document', (documentQuery) => {
            documentQuery
              .preload('documenttype')
              .preload('documenttypebook')
          })
      })

      // 🔹 (Opcional) atualiza nome do arquivo
      await fileRename.updateFileName(bookrecord)

      // ✅ Retorno completo
      return response.status(201).send({
        success: true,
        message: 'Registro criado com sucesso',
        bookrecord,
        document: createdDocument,
      })
    } catch (error) {
      console.error('Erro ao criar registro:', error)
      throw new BadRequestException('Erro ao criar registro', 400, error)
    }
  }





  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { document } = request.only(['document'])
    const body = request.only(Bookrecord.fillable)

    try {
      // 🔹 Busca o Bookrecord
      const bookrecord = await Bookrecord.query()
        .where('id', params.id)
        .andWhere('typebooks_id', body.typebooks_id)
        .andWhere('companies_id', authenticate.companies_id)
        .firstOrFail()

      // 🔹 Atualiza campos do Bookrecord
      bookrecord.merge({
        ...body,
        companies_id: authenticate.companies_id,
        userid: authenticate.id,
      })
      await bookrecord.save()

      let updatedDocument = null

      // 🔹 Atualiza o documento vinculado (se aplicável)
      if (bookrecord.books_id === 13 && document && document.id) {
        const doc = await Document.query()
          .where('id', document.id)
          .andWhere('typebooks_id', bookrecord.typebooks_id)
          .andWhere('companies_id', authenticate.companies_id)
          .first()

        if (doc) {
          const cleanDocument = { ...document }
          delete cleanDocument.documenttype
          delete cleanDocument.documenttypebook

          doc.merge(cleanDocument)
          await doc.save()
          updatedDocument = doc
        }
      }

      // 🔹 Recarrega o bookrecord com relacionamentos úteis
      await bookrecord.load((loader) => {
        loader
          .preload('document', (documentQuery) => {
            documentQuery
              .preload('documenttype')
              .preload('documenttypebook')
          })
      })


      await fileRename.updateFileName(bookrecord)

      // ✅ Retorna o objeto atualizado completo
      return response.status(200).send({
        success: true,
        message: 'Registro atualizado com sucesso',
        bookrecord,
        document: updatedDocument,
      })
    } catch (error) {
      console.error('Erro ao atualizar registro:', error)
      throw new BadRequestException('Erro ao atualizar registro', 400, error)
    }
  }





  public async destroy({ auth, params, response }: HttpContextContract) {
    const { companies_id } = await auth.use('api').authenticate()
    try {
      //excluir imagens do google drive
      // const listOfImagesToDeleteGDrive = await Indeximage.query()
      //   .preload('typebooks', (query) => {
      //     query.where('id', params.typebooks_id)
      //       .andWhere('companies_id', companies_id)
      //   })
      //   .where('typebooks_id', params.typebooks_id)
      //   .andWhere('bookrecords_id', params.id)
      //   .andWhere('companies_id', companies_id)

      // if (listOfImagesToDeleteGDrive.length > 0) {
      //   var file_name = listOfImagesToDeleteGDrive.map(function (item) {
      //     return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
      //   });
      //   fileRename.deleteFile(file_name)
      // }

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


  public async generateOrUpdateBookrecords2({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate();

    const body = await request.validate({
      schema: schema.create({
        renumerate_cod: schema.boolean.optional(),
        is_create: schema.boolean.optional(),
        by_sheet: schema.string.optional(),
        start_cod: schema.number(),
        end_cod: schema.number(),
        book: schema.number.optional(),
        book_replace: schema.number.optional(),
        sheet: schema.number.optional(),
        side: schema.string.optional(),
        model_book: schema.string.optional(),
        books_id: schema.number(),
        indexbook: schema.string.optional(),
        year: schema.number.optional(),
        approximate_term: schema.number.optional(),
        obs: schema.string.optional(),
      }),
    });

    if (body.start_cod > body.end_cod) {
      throw new BadRequestException("erro: codigo inicial maior que o final");
    }

    // --- FLUXO DE SUBSTITUIÇÃO SIMPLES ---
    if (body.book_replace && body.book_replace > 0) {
      const updatedCount = await Bookrecord.query()
        .where("companies_id", authenticate.companies_id)
        .andWhere("typebooks_id", params.typebooks_id)
        .where("books_id", body.books_id)
        .andWhere("book", body.book)
        .update({ book: body.book_replace });

      return response.status(200).send({
        message: `Bookrecords atualizados para ${body.book_replace}!`,
        updatedCount,
      });
    }

    // shouldApplyModel => só quando usuário passou sheet ou side ou model_book
    const shouldApplyModel = (body.sheet !== undefined || body.side !== undefined || body.model_book !== undefined);
    // mantido como no código original
    const shouldRenumerate = !!body.renumerate_cod && shouldApplyModel;

    // 🔹 Normalização pedida: se vier 0 ou "0", transformar em null
    const zeroToNull = (v: any) => (v === 0 || v === "0" ? null : v);
    const bodyIndexbook = zeroToNull(body.indexbook);
    const bodyYear = zeroToNull(body.year);
    const bodyApprox = zeroToNull(body.approximate_term);
    const bodyObs = zeroToNull(body.obs);

    function modelBookNext(model_book: string | undefined, side: string | null, sheet: number | null) {
      if (!model_book) return { side, sheet: (sheet ?? 0) + 1 };

      switch (model_book) {
        case "C": return { side: null, sheet: 0 };
        case "F": return { side: "F", sheet: (sheet ?? 0) + 1 };
        case "V": return { side: "V", sheet: (sheet ?? 0) + 1 };
        case "FV": return { side: side === "F" ? "V" : "F", sheet: (sheet ?? 0) + 1 };
        case "FVFV":
          if (side === "F") return { side: "V", sheet };
          return { side: "F", sheet: (sheet ?? 0) + 1 };
        case "F-IMPAR": return { side: "F", sheet: (sheet ?? 0) + 2 };
        case "V-PAR": return { side: "V", sheet: (sheet ?? 0) + 2 };
        default: return { side, sheet: (sheet ?? 0) + 1 };
      }
    }

    try {
      const query = Bookrecord.query()
        .andWhere("companies_id", authenticate.companies_id)
        .andWhere("typebooks_id", params.typebooks_id)
        .where("books_id", body.books_id)
        .andWhere("book", body.book);

      if (body.by_sheet == "S") {
        query.andWhere("sheet", ">=", body.start_cod).andWhere("sheet", "<=", body.end_cod);
      } else {
        query.andWhere("cod", ">=", body.start_cod).andWhere("cod", "<=", body.end_cod);
      }

      const result = await query;

      // =======================
      // RENUMERAÇÃO PURA DE COD
      // =======================
      if (body.renumerate_cod) {
        const sideRank = (s: string | null | undefined) => (s === "F" ? 0 : s === "V" ? 1 : 2);

        const ordered = (result ?? []).slice().sort((a: any, b: any) => {
          if (body.by_sheet == "S") {
            const as = a?.sheet ?? 0;
            const bs = b?.sheet ?? 0;
            if (as !== bs) return as - bs;
            const sa = sideRank(a?.side);
            const sb = sideRank(b?.side);
            if (sa !== sb) return sa - sb;
            return (a?.id ?? 0) - (b?.id ?? 0);
          } else {
            const ac = a?.cod ?? 0;
            const bc = b?.cod ?? 0;
            if (ac !== bc) return ac - bc;
            return (a?.id ?? 0) - (b?.id ?? 0);
          }
        });

        let newCod = (body.sheet ?? body.start_cod);

        const trx = await Database.transaction();
        try {
          for (const rec of ordered) {
            await Bookrecord.query({ client: trx })
              .where("id", rec.id)
              .update({ cod: newCod++ }); // <<< SOMENTE COD >>>
          }
          await trx.commit();

          return response.status(200).send({
            message: "Cod renumerado com sucesso (sem alterar outros campos).",
            updatedCount: ordered.length,
            start_from: body.sheet ?? body.start_cod,
            last_cod: newCod - 1,
          });
        } catch (err) {
          await trx.rollback();
          throw err;
        }
      }

      // helper: sobrescreve só se bodyValue !== undefined && !== null && !== ""
      function overwriteIfValid<T>(bodyValue: T | null | undefined, dbValue: T | undefined): T | undefined {
        return bodyValue !== undefined && bodyValue !== null && bodyValue !== "" ? (bodyValue as T) : dbValue;
      }

      const generatedArray: any[] = [];

      let sequenceSheet = body.sheet ?? body.start_cod;
      const defaultSideForModel = (() => {
        switch (body.model_book) {
          case "F":
          case "F-IMPAR": return "F";
          case "V":
          case "V-PAR": return "V";
          case "FV":
          case "FVFV": return "F";
          default: return body.side ?? null;
        }
      })();
      let sequenceSide = body.side ?? defaultSideForModel;

      const sortRecords = (arr: any[]) =>
        (arr ?? []).slice().sort((a: any, b: any) => {
          const as = a?.sheet ?? 0;
          const bs = b?.sheet ?? 0;
          if (as !== bs) return as - bs;
          return (a?.id ?? 0) - (b?.id ?? 0);
        });

      // ---- GERAÇÃO ----
      if (body.by_sheet == "S") {
        if (body.is_create) {
          for (let sheetNum = body.start_cod; sheetNum <= body.end_cod; sheetNum++) {
            let recordsForSheet = result.filter((r) => r.sheet === sheetNum);
            recordsForSheet = sortRecords(recordsForSheet);

            const minSlots = body.model_book === "FVFV" ? 2 : 1;
            const slotsToProcess = Math.max(recordsForSheet.length, minSlots);

            for (let slot = 0; slot < slotsToProcess; slot++) {
              const baseRecord = recordsForSheet[slot] ?? null;

              if (!shouldApplyModel) {
                const assignedSide = baseRecord?.side ?? null;
                const assignedSheetOut = baseRecord?.sheet ?? sheetNum;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: baseRecord?.cod ?? sheetNum,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });
              } else {
                const assignedSide = sequenceSide ?? defaultSideForModel;
                const assignedSheetOut = sequenceSheet;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: baseRecord?.cod ?? sheetNum,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });

                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                sequenceSide = next.side;
                sequenceSheet = next.sheet ?? sequenceSheet;
              }
            }
          }
        } else {
          const distinctSheets = Array.from(new Set(result.map((r) => r.sheet)))
            .filter((s) => s !== undefined && s !== null)
            .sort((a, b) => a - b);

          for (const sheetVal of distinctSheets) {
            let recordsForSheet = result.filter((r) => r.sheet === sheetVal);
            recordsForSheet = sortRecords(recordsForSheet);

            for (const baseRecord of recordsForSheet) {
              if (!shouldApplyModel) {
                const assignedSide = baseRecord?.side ?? null;
                const assignedSheetOut = baseRecord?.sheet ?? sheetVal;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: baseRecord?.cod ?? sheetVal,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });
              } else {
                const assignedSide = sequenceSide ?? defaultSideForModel;
                const assignedSheetOut = sequenceSheet;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: baseRecord?.cod ?? sheetVal,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });

                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                sequenceSide = next.side;
                sequenceSheet = next.sheet ?? sequenceSheet;
              }
            }
          }
        }
      } else {
        // by cod
        if (body.is_create) {
          for (let cod = body.start_cod; cod <= body.end_cod; cod++) {
            let recordsForCod = result.filter((r) => r.cod === cod);
            recordsForCod = sortRecords(recordsForCod);

            const slotsToProcess = Math.max(recordsForCod.length, 1);
            for (let slot = 0; slot < slotsToProcess; slot++) {
              const baseRecord = recordsForCod[slot] ?? null;

              if (!shouldApplyModel) {
                const assignedSide = baseRecord?.side ?? null;
                const assignedSheetOut = baseRecord?.sheet ?? sequenceSheet;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: cod,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });
              } else {
                const assignedSide = sequenceSide ?? defaultSideForModel;
                const assignedSheetOut = sequenceSheet;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: cod,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });

                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                sequenceSide = next.side;
                sequenceSheet = next.sheet ?? sequenceSheet;
              }
            }
          }
        } else {
          const distinctCods = Array.from(new Set(result.map((r) => r.cod)))
            .filter((c) => c !== undefined && c !== null)
            .sort((a, b) => a - b);

          for (const codVal of distinctCods) {
            let recordsForCod = result.filter((r) => r.cod === codVal);
            recordsForCod = sortRecords(recordsForCod);

            for (const baseRecord of recordsForCod) {
              if (!shouldApplyModel) {
                const assignedSide = baseRecord?.side ?? null;
                const assignedSheetOut = baseRecord?.sheet ?? sequenceSheet;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: codVal,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });
              } else {
                const assignedSide = sequenceSide ?? defaultSideForModel;
                const assignedSheetOut = sequenceSheet;

                generatedArray.push({
                  id: baseRecord?.id,
                  typebooks_id: params.typebooks_id,
                  books_id: baseRecord?.books_id ?? body.books_id,
                  companies_id: authenticate.companies_id,
                  cod: codVal,
                  book: baseRecord?.book ?? body.book,
                  sheet: assignedSheetOut,
                  side: assignedSide,
                  approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                  indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                  year: overwriteIfValid(bodyYear, baseRecord?.year),
                  obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                });

                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                sequenceSide = next.side;
                sequenceSheet = next.sheet ?? sequenceSheet;
              }
            }
          }
        }
      }

      // ---- RENUMERAÇÃO DE COD ----
      if (shouldRenumerate) {

        let newCod = body.sheet ?? body.start_cod;
        const sideRank = (s: string | null | undefined) => (s === "F" ? 0 : s === "V" ? 1 : 2);

        generatedArray.sort((a, b) => {
          if (a.sheet !== b.sheet) return a.sheet - b.sheet;
          const sa = sideRank(a.side); const sb = sideRank(b.side);
          if (sa !== sb) return sa - sb;
          return (a.id ?? 0) - (b.id ?? 0);
        });

        for (const rec of generatedArray) {
          rec.cod = newCod++;
        }
      }

      // ---- RENUMERAÇÃO DE approximate_term ----
      // Só renumera approximate_term se veio no body (usando o valor normalizado)
      if (body.approximate_term !== undefined) {
        let newApprox = (bodyApprox as number | null) ?? null;
        if (newApprox !== null) {
          for (const rec of generatedArray) {
            rec.approximate_term = newApprox++;
          }
        } else {
          // Se usuário passou 0 => null, então zera nos registros gerados
          for (const rec of generatedArray) {
            rec.approximate_term = null;
          }
        }
      }

      // --- UPDATE/INSERT NO BANCO ---
      const trx = await Database.transaction();
      try {
        for (const record of generatedArray) {
          if (record.id) {
            // montar updateData: incluir apenas os campos que devemos realmente alterar
            const updateData: Record<string, any> = {};

            // sheet/side: só atualiza se usuário enviou parâmetros de model (shouldApplyModel)
            if (shouldApplyModel) {
              updateData.sheet = record.sheet;
              updateData.side = record.side;
            }

            // cod: só atualiza se estamos renumerando (no caminho "não puro")
            if (shouldRenumerate) {
              updateData.cod = record.cod;
            }

            // campos controlados individualmente: usar SEMPRE os normalizados (0 -> null) quando vierem no body
            if (body.approximate_term !== undefined) updateData.approximate_term = bodyApprox;
            if (body.indexbook !== undefined) updateData.indexbook = bodyIndexbook;
            if (body.year !== undefined) updateData.year = bodyYear;
            if (body.obs !== undefined) updateData.obs = bodyObs;

            // remove undefined/"" (side pode ser null explicitamente e ainda assim desejado)
            const finalUpdateData = Object.fromEntries(
              Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== "")
            );

            if (Object.keys(finalUpdateData).length > 0) {
              await Bookrecord.query({ client: trx })
                .where("id", record.id)
                .update(finalUpdateData);
            }
          } else if (body.is_create) {
            // criar: sempre precisa informar cod/book/sheet/side (conforme gerado),
            // e usar os normalizados (0 -> null) se vierem no body
            const createPayload: Record<string, any> = {
              typebooks_id: params.typebooks_id,
              books_id: record.books_id,
              companies_id: authenticate.companies_id,
              cod: record.cod,
              book: record.book,
              sheet: record.sheet,
              side: record.side,
            };

            if (body.approximate_term !== undefined) createPayload.approximate_term = bodyApprox;
            if (body.indexbook !== undefined) createPayload.indexbook = bodyIndexbook;
            if (body.year !== undefined) createPayload.year = bodyYear;
            if (body.obs !== undefined) createPayload.obs = bodyObs;

            await Bookrecord.create(createPayload, { client: trx });
          }
        }
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }

      return response.status(200).send({
        message: "Bookrecords atualizados/criados com sucesso!",
        data: generatedArray,
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException("Bad Request", 402, error);
    }
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
    const { book, bookStart, bookEnd, countSheetNotExists, side } = request.qs()

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
        if (bookStart > 0)
          query.andWhere('book', '>=', bookStart)
        if (bookEnd > 0)
          query.andWhere('book', '<=', bookEnd)
      }

      query.groupBy('book', 'indexbook')
      query.orderBy('bookrecords.book')

      const bookSummaryPayload = await query
      //**************************************** */
      //FUNÇÃO PARA CONTAR AS FOLHAS FALTANTES
      async function verifySide(book: number = 0): Promise<string> {
        // Função auxiliar para gerar sequência de números
        const generateSequence = (start: number, end: number): number[] =>
          Array.from({ length: end - start + 1 }, (_, i) => start + i);

        // Função auxiliar para encontrar itens ausentes
        const findMissingItems = (completeList: any[], currentList: any[], keyFn: (item: any) => string): any[] => {
          const currentSet = new Set(currentList.map(keyFn));
          return completeList.filter(item => !currentSet.has(keyFn(item)));
        };

        // Obter registros do banco
        const sheetWithSide = await Bookrecord.query()
          .where('companies_id', authenticate.companies_id)
          .andWhere('typebooks_id', typebooks_id)
          .andWhere('book', book);

        // Transformar registros em array de { sheet, side }
        const sheetCount = sheetWithSide.map(item => ({ sheet: item.sheet, side: item.side }));
        const maxSheet = Math.max(0, ...sheetCount.map(item => item.sheet));

        // Verificar tipo de validação (P para apenas folhas, F/V para folhas com sides)
        if (countSheetNotExists === 'P') {
          const completeSheetList = generateSequence(1, maxSheet);
          const currentSheetSet = new Set(sheetCount.map(item => item.sheet));
          const missingSheets = completeSheetList.filter(sheet => !currentSheetSet.has(sheet));
          return missingSheets.join(', ');
        }

        // Gerar combinações completas de { sheet, side }
        const sides = countSheetNotExists === 'V' ? ['V'] : countSheetNotExists === 'F' ? ['F'] : ['F', 'V'];
        const completeList = generateSequence(1, maxSheet).flatMap(sheet =>
          sides.map(side => ({ sheet, side }))
        );

        // Encontrar combinações ausentes
        const missingItems = findMissingItems(
          completeList,
          sheetCount,
          item => `${item.sheet}-${item.side}`
        );

        if (countSheetNotExists === "I") {
          const oddItens = missingItems.filter(item => item.sheet % 2 !== 0 && item.side === "F")
          return oddItens.map(item => `${item.sheet}${item.side}`).join(', ');
        }

        if (countSheetNotExists === "PA") {
          const pairItens = missingItems.filter(item => item.sheet % 2 == 0 && item.side === "V")
          return pairItens.map(item => `${item.sheet}${item.side}`).join(', ');
        }

        return missingItems.map(item => `${item.sheet}${item.side}`).join(', ');
      }

      //************************************************************ */

      const bookSumaryList = []
      if (countSheetNotExists) {
        for (const item of bookSummaryPayload) {
          //item.noSheet = await countSheet(item.book)
          item.side = await verifySide(item.book)
          bookSumaryList.push(item)
        }
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
    const { typebooks_id } = request.only(['typebooks_id'])

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
      .where('books_id', 13)
      .andWhere('companies_id', authenticate.companies_id)
      .max('cod as max_cod')
    const maxCodDocument = await query.first();

    return response.status(200).send({ max_book: maxBook?.$extras.max_book, max_sheet: maxSheet.$extras.max_sheet, max_cod_document: maxCodDocument?.$extras.max_cod })
  }

  //********************************************************* */
}
