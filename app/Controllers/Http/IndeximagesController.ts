import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'

import Application from '@ioc:Adonis/Core/Application'

export default class IndeximagesController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)
    //const id = params.id
    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)
    //body.id = id

    const data = await Indeximage.create(body)

    response.status(201)
    return {
      message: "Criado com sucesso",
      data: data,
    }

  }

  public async index({ response }) {
    //const data = await Typebook.all()
    const data = await Indeximage.query()
    //.preload('bookrecords')

    return response.send({ data })
  }


  public async show({ params }: HttpContextContract) {
    const data = await Indeximage.findOrFail(params.id)

    return {
      data: data,
    }
  }

  public async destroy({ params }: HttpContextContract) {
    const data = await Indeximage.findOrFail(params.id)

    await data.delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }

  public async update({ request, params }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)
    body.bookrecords_id = params.id
    body.typebooks_id = params.id2
    body.seq = params.id3


    const data = await Indeximage
      .query()
      .where('bookrecords_id', '=', body.bookrecords_id)
      .where('typebooks_id', '=', body.typebooks_id)
      .where('seq', '=', body.seq)
    //const data = await Indeximage.findMany([3,10, 1] )

    await data.fill(body).save()

    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      //body: body,
      params: params
    }

  }

  public async uploads({ request, params }) {
    console.log("UPLOADS", params.id);


    const images = request.files('images', {
      size: '2mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf']
    })

    let cont = 1
    for (let image of images) {

      //função para retornar o nome transformado do arquivo

      if (!image) {
        console.log("não é imagem")
      }
      if (!image.isValid) {
        console.log("Error", image.errors);

      }

      await image.move(Application.tmpPath('uploads'), { name: `cont${cont}.${image.extname}`, overwrite: true })
      cont++
      console.log("Name:", image.fieldName, ' ClienteName', image.clientName, 'tamanho:', image.size, 'path:', image.tmpPath, 'ext', image.extname);

    }
  }


}
