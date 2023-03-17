import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'


import Bookrecord from 'App/Models/Bookrecord'
import Indeximage from 'App/Models/Indeximage'
import Env from '@ioc:Adonis/Core/Env'


export default class BookrecordsController {

  //Listar Bookrecords
  public async index({ auth, request, params, response }: HttpContextContract) {


    const authenticate = await auth.use('api').authenticate()
    const { codstart, codend, bookstart, bookend, approximateterm, year, letter, sheetstart, sheetend, side, sheetzero, lastPagesOfEachBook } = request.requestData

    let query = " 1=1 "
    if (!codstart && !codend && !approximateterm && !year && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false'))
      query = " sheet > 0  "
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
      //year ***********************************************
      if (year != undefined)
        query += ` and year =${year} `

      //sheetzero*****************************************
      if (sheetzero)
        query += ` and sheet>=0`
    }

    //last pages of each book****************************
    if (lastPagesOfEachBook) {
      query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `
    }


    const page = request.input('page', 1)
    //pagination paginação
    const limit = Env.get('PAGINATION')

    const data = await Bookrecord.query()
      .where("companies_id", '=', authenticate.companies_id)
      .andWhere("typebooks_id", '=', params.typebooks_id)
      .preload('indeximage')
      .whereRaw(query)//.toQuery()
      .orderBy("book", "asc")
      .orderBy("cod", "asc")
      .orderBy("sheet", "asc")
      .paginate(page, limit)

    console.log(">>>sai bookrecord");
    return response.send(data)

  }


  public async show({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)
    //console.log("SHOWWWW:", params)
    return {
      data: data,
    }
  }


  //EXCLUSÃO EM LOTES
  public async destroyManyBookRecords({ auth, request }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()

    const { typebooks_id, Book, startCod, endCod } = request.requestBody
    let query = '1 = 1'

    if (Book == undefined)
      return

    if (typebooks_id != undefined) {
      if (Book != undefined) {
        query += ` and book=${Book} `
      }

      if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
        query += ` and cod>=${startCod} and cod <=${endCod} `

      //deleção tabela index images
      const dataIndexImages = await Indeximage.query().delete()
        .whereIn("bookrecords_id",
          Database.from('bookrecords').select('id').where('typebooks_id', '=', typebooks_id).whereRaw(query)
        )
      const data = await Bookrecord.query().where('typebooks_id', '=', typebooks_id).whereRaw(query).delete()

      return { dataIndexImages, data }
    }
  }


  public async destroy({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)

    await data.delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }


  public async update({ request, params }: HttpContextContract) {
    const body = request.only(Bookrecord.fillable)
    body.id = params.id
    const data = await Bookrecord.findOrFail(body.id)
    await data.fill(body).save()
    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      params: params.id
    }

  }


  public async createorupdatebookrecords({ auth, request, params }) {

    // console.log("entrei na inclusão de um registro");
    // return
    const authenticate = await auth.use('api').authenticate()

    const _request = request.requestBody
    let newRecord: Object[] = []
    let updateRecord: Object[] = []

    //return _request
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
          index: iterator.index,
          obs: iterator.obs,
          letter: iterator.letter,
          year: iterator.year,
          model: iterator.model
        })
        console.log("NEW iterator:::", newRecord)

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
          index: iterator.index,
          obs: iterator.obs,
          letter: iterator.letter,
          year: iterator.year,
          model: iterator.model
        })

        console.log("UPDATE iterator:::", updateRecord)
      }


    }


    await Bookrecord.createMany(newRecord)
    await Bookrecord.updateOrCreateMany('id', updateRecord)
    return "sucesso!!"


  }

  //gera ou substitui um livro
  public async generateOrUpdateBookrecords({ auth, request, params, response }: HttpContextContract) {

    console.log(">>>>>PASSEI PELO generateOrUpdateBookrecords.....")
    const authenticate = await auth.use('api').authenticate()

    let {
      generateBooks_id,
      generateBook,
      generateStartCode,
      generateEndCode,
      generateStartSheetInCodReference,
      generateEndSheetInCodReference,
      generateSheetIncrement,
      generateSideStart,
      generateAlternateOfSides,
      generateApproximate_term,
      generateApproximate_termIncrement,
      generateIndex,
      generateLetter,
      generateYear

    } = request.requestData

    //return { generateBooks_id, generateBook }

    //AQUI - FAZER VALIDAÇÃO DOS CAMPOS ANTES DE EXECUTAR
    if (!generateBook || isNaN(generateBook) || generateBook <= 0) {
      console.log("ERRRRRROR:", response.status(401))
      return response.status(401)
    }

    // const generateBook = 10
    // let generateStartCode = 1
    // const generateEndCode = 40
    // const generateStartSheetInCodReference = 5
    // const generateEndSheetInCodReference = 35
    // const generateSheetIncrement = 2
    // let generateSideStart = "F"
    // const generateAlternateOfSides = "FV"
    // const generateApproximate_term = 1
    // const generateApproximate_termIncrement = 1


    let contSheet = 0
    let contIncrementSheet = 0
    let contFirstSheet = false
    let contFirstSide = false
    let sideNow = 0
    let approximate_term = generateApproximate_term
    let approximate_termIncrement = 0

    const bookrecords: Object[] = []




    for (let index = 0; index < generateEndCode; index++) {

      if (generateStartCode >= generateStartSheetInCodReference) {

        if (contIncrementSheet < generateSheetIncrement) {
          contIncrementSheet++
          if (contFirstSheet == false) {
            contFirstSheet = true
            contSheet++
          }
        } else {
          contIncrementSheet = 1
          contSheet++
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

      if (generateStartCode > generateEndSheetInCodReference)
        contSheet = 0

      bookrecords.push({
        cod: generateStartCode++,
        book: generateBook,
        sheet: ((!generateStartSheetInCodReference && !generateEndSheetInCodReference) || (generateStartSheetInCodReference == 0 && generateEndSheetInCodReference == 0) ? undefined : contSheet),
        side: (!generateSideStart || (generateSideStart != "F" && generateSideStart != "V") ? undefined : generateSideStart),
        approximate_term: ((!generateApproximate_term || generateApproximate_term == 0) ? undefined : approximate_term),
        index: ((!generateIndex || generateIndex == 0) ? undefined : generateIndex),
        letter: ((!generateLetter || !isNaN(generateLetter) ? undefined : generateLetter)),
        year: ((!generateYear ? undefined : generateYear)),
        typebooks_id: params.typebooks_id,
        books_id: generateBooks_id,
        companies_id: authenticate.companies_id

      })


    }

    const data = await Bookrecord.updateOrCreateMany(['cod', 'book', 'books_id', 'companies_id'], bookrecords)

    return data.length

  }


  //********************************************************* */
}
