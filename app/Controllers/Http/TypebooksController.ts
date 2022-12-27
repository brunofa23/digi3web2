import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'
import Bookrecord from 'App/Models/Bookrecord'
import Company from 'App/Models/Company'


export default class TypebooksController {


  // public async bookRecords({ request, params, response }) {


  //   if (!params.id)
  //     return "erro"

  //   const { codstart, codend, bookstart, bookend, approximateterm, year, letter, sheetstart, sheetend, side, sheetzero, lastPagesOfEachBook } = request.requestData

  //   let query = " 1=1 "
  //   if (!codstart && !codend && !approximateterm && !year && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false'))
  //     query = " sheet > 0  "
  //   else {

  //     //cod**************************************************
  //     if (codstart != undefined && codend == undefined)
  //       query += ` and cod =${codstart} `
  //     else
  //       if (codstart != undefined && codend != undefined)
  //         query += ` and cod >=${codstart} `

  //     if (codend != undefined)
  //       query += ` and cod <= ${codend}`
  //     //book ************************************************
  //     if (bookstart != undefined && bookend == undefined)
  //       query += ` and book =${bookstart} `
  //     else
  //       if (bookstart != undefined && bookend != undefined)
  //         query += ` and book >=${bookstart} `

  //     if (bookend != undefined)
  //       query += ` and book <= ${bookend}`

  //     //sheet **********************************************
  //     if (sheetstart != undefined && sheetend == undefined)
  //       query += ` and sheet =${sheetstart} `
  //     else
  //       if (sheetstart != undefined && sheetend != undefined)
  //         query += ` and sheet >=${sheetstart} `

  //     if (sheetend != undefined)
  //       query += ` and sheet <= ${sheetend}`

  //     //side *************************************************
  //     if (side != undefined)
  //       query += ` and side = '${side}' `

  //     //aproximate_term **************************************
  //     if (approximateterm != undefined)
  //       query += ` and approximate_term=${approximateterm}`
  //     //year ***********************************************
  //     if (year != undefined)
  //       query += ` and year =${year} `

  //     //sheetzero*****************************************
  //     if (sheetzero)
  //       query += ` and sheet>=0`
  //   }

  //   //last pages of each book****************************
  //   if (lastPagesOfEachBook) {
  //     query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `
  //   }


  //   const page = request.input('page', 1)
  //   const limit = 20

  //   const data = await Bookrecord.query()
  //     .where("companies_id", '=', params.id)
  //     .preload('indeximage')
  //     .where('typebooks_id', '=', params.typebooks_id)
  //     .whereRaw(query).paginate(page, limit)


  //   console.log("DATA>>>", data)
  //   //return response.send( data )
  //   return response.send({ data })
  // }

  //inserir livro
  public async store({ request, params, response }: HttpContextContract) {

    const body = request.only(Typebook.fillable)
    body.companies_id = params.companies_id

    try {
      await Company.findByOrFail('id', params.companies_id)
      const data = await Typebook.create(body)
      response.status(201)
      return {
        message: "Criado com sucesso",
        data: data,
      }

    } catch (error) {
      return error//response.status(401)
    }

  }

  //listar livro
  public async index({ request, params, response }) {

    const { name, status, books_id } = request.requestData

    if (!params.companies_id)
      return "error"

    if (!name && !status && !books_id) {
      const data = await Typebook.query().where("companies_id", '=', params.companies_id)
      return response.send({ data })
    }
    else {

      let query = " 1=1 "
      let _status
      if (status !== undefined) {
        if (status === 'TRUE' || status === '1')
          _status = 1
        else
          if (status === 'FALSE' || status === '0')
            _status = 0
        query += ` and status =${_status} `
      }

      if (name !== undefined)
        query += ` and name like '%${name}%' `

      if (books_id !== undefined) {
        query += ` and books_id = ${books_id} `
      }

      const data
        = await Typebook.query().where("companies_id", '=', params.companies_id)
          .preload('bookrecords').preload('book')
          .whereRaw(query)


      return response.send(data)
    }


  }

//retorna um registro
  public async show({ params }: HttpContextContract) {

    const data = await Typebook.query()
                .where("companies_id","=",params.companies_id)
                .andWhere('id',"=",params.id)
    return {
      data: data,
    }
  }

  //delete
  public async destroy({ params }: HttpContextContract) {
    const data = await Typebook.query()
    .where("companies_id","=",params.companies_id)
    .andWhere('id',"=",params.id).delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }

  //patch ou put
  public async update({ request, params }: HttpContextContract) {

    const body = request.only(Typebook.fillable)

    body.id = params.id
    body.companies_id = params.companies_id

    const data = await Typebook.query()
    .where("companies_id","=",params.companies_id)
    .andWhere('id',"=",params.id).update(body)

    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      body: body,
      params: params.id
    }

  }

}
