import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'


import Bookrecord from 'App/Models/Bookrecord'
import Indeximage from 'App/Models/Indeximage'

export default class BookrecordsController {

  public async index({ request, response }: HttpContextContract) {
    const body = request.only(Bookrecord.fillable)
    const data = await Bookrecord.query()
      .preload('bookrecords')
      .where('typebooks_id', '=', body.id)


    //*** PARA CRIAR QUERY ESPECÍFICA */
    // const data = await Database.from('bookrecords').select(
    //   'typebooks_id',
    //   'books_id',
    //   'cod',
    //   'book',
    //   'sheet',
    //   'side',
    //   'approximate_term',
    //   'index',
    //   'obs',
    //   'letter',
    //   'year',
    //   'model',
    // )

    return response.send({ data })
  }

  public async store({ request, params, response }: HttpContextContract) {
    const body = request.only(Bookrecord.fillable)
    const id = params.id

    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)

    body.id = id

    const data = await Bookrecord.create(body)

    response.status(201)
    return {
      message: 'Criado com sucesso',
      data: data,
    }
  }


  public async show({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)
    //console.log("SHOWWWW:", params)
    return {
      data: data,
    }
  }

  public async destroyManyBookRecords({ request }: HttpContextContract) {

    const { typebook_id, book, codIni, codFim } = request.requestBody
    let query = '1 = 1'

    if (book == undefined)
      return

    if (typebook_id != undefined) {
      if (book != undefined) {
        query += ` and book=${book} `
      }
      if (codIni != undefined && codFim != undefined)
        query += ` and cod>=${codIni} and cod <=${codFim} `

      //deleção tabela index images
      const dataIndexImages = await Indeximage.query().delete()
          .whereIn("bookrecords_id",
            Database.from('bookrecords').select('id').where('typebooks_id', '=', typebook_id).whereRaw(query)
            )
      //delete from indeximages where bookrecords_id in (select id from bookrecords where `typebooks_id` = 7 and 1 = 1 and book=1 and cod>=1 and cod <=3)

      const data = await Bookrecord.query().where('typebooks_id', '=', typebook_id).whereRaw(query).delete()
      return {dataIndexImages, data }
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


  public async createorupdatebookrecord({ request }) {


    console.log(request.requestBody)

    const _request = request.requestBody
    let newRecord: Object[] = []
    let updateRecord: Object[] = []

    for (const iterator of _request) {

      if (!iterator.id)
        newRecord.push({
          typebooks_id: iterator.typebooks_id,
          books_id: iterator.books_id,
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
      else
        updateRecord.push({
          id: iterator.id,
          typebooks_id: iterator.typebooks_id,
          books_id: iterator.books_id,
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

    }

    console.log("NEW iterator:::", newRecord)
    console.log("UPDATE iterator:::", updateRecord)

    await Bookrecord.createMany(newRecord)
    await Bookrecord.updateOrCreateMany('id', updateRecord)
    return "sucesso!!"


  }


  public async generateOrUpdateBookRecords({ request, response }) {

    // console.log(request.requestData)
    console.log("EXECUTEI generateOrUpdateBookRecords")

    let {
      generateTypeBook_id,
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
      generateApproximate_termIncrement
    } = request.requestData

    //AQUI - FAZER VALIDAÇÃO DOS CAMPOS ANTES DE EXECUTAR
    // if (!generateBook || isNaN(generateBook) || generateBook <= 0) {
    //   console.log("ERRRRRROR:", response.status(401))
    //   return response.status(401)
    // }

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
    const bookrecords: Object[] = []

    for (let index = 0; index < generateEndCode; index++) {

      console.log("generateStartCode", generateStartCode, " - generateStartSheetInCodReference", generateStartSheetInCodReference,);

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
        } else if (generateAlternateOfSides == "FFVV") {
          if (sideNow >= 2) {
            generateSideStart = (generateSideStart == "F" ? "V" : "F")
            sideNow = 0
          }
          sideNow++
        }

      }
      if (generateStartCode > generateEndSheetInCodReference)
        contSheet = 0

      bookrecords.push({
        cod: generateStartCode++,
        book: generateBook,
        sheet: contSheet,
        side: generateSideStart,
        typebooks_id: generateTypeBook_id,
        books_id: generateBooks_id
      })

    }

    const data = await Bookrecord.updateOrCreateMany(['cod', 'book'], bookrecords)
    return data.length



  }


  //Para geração de bookrecords (gerar novo livro)
  public async fetchOrCreateMany({ request }) {


    const { sheet, book, books_id, typebooks_id } = request.requestData


    let cod = 1
    let sheetCount = 1

    //AQUI - FAZER VALIDAÇÃO DOS CAMPOS ANTES DE EXECUTAR
    console.log("Executei fetchorCreateMany")
    if (!sheet || isNaN(sheet) || sheet < 0) {
      return "erro"//status 400
    }

    const booksRecordsToCreate: Object[] = []
    while (sheetCount <= sheet) {
      booksRecordsToCreate.push({ cod: cod++, book, sheet: sheetCount, books_id, typebooks_id })
      sheetCount++
    }

    //const data = await Bookrecord.fetchOrCreateMany(['cod', 'book'], booksRecordsToCreate)
    console.log("EXECUTEI fetchOrCreateMany")
    //return data.length

  }



  //************************ */


}
