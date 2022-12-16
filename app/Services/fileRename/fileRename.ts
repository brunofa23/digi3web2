
import { Request } from "@adonisjs/core/build/standalone";
import Bookrecord from "App/Models/Bookrecord";
import Indeximage from "App/Models/Indeximage";
import { file } from "googleapis/build/src/apis/file";
import Application from '@ioc:Adonis/Core/Application'

async function transformFileNameToId(image, typebook_id) {

  const fileName = image.clientName
  let name

  //FORMATO L10(10).JPG
  if (fileName.toUpperCase().startsWith('L')) {
    let separators = ["L", '\'', '(', ')', '|', '-'];
    let arrayFileName = fileName.split(new RegExp('([' + separators.join('') + '])'));
    if (!isNaN(arrayFileName[4]) && !isNaN(arrayFileName[2])) {
      const query = ` cod =${arrayFileName[4]} and book = ${arrayFileName[2]} `
      name = await Bookrecord.query()
        .preload('bookrecords')
        .where('typebooks_id', '=', typebook_id)
        .whereRaw(query)
    }

  }

  console.log("VALIDANDO SEQ::", name[0].id, " SEQ:", name[0].bookrecords[name[0].bookrecords.length - 1])
  // return {
  //   fileName: `id${name[0].id}_${name[0].bookrecords[name[0].bookrecords.length - 1].seq}(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`,
  //   name: name[0].id, seq: name[0].bookrecords[name[0].bookrecords.length - 1],
  // }

  return {
    fileName: `id${name[0].id}_(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`,
    name: name[0].id, seq: name[0].bookrecords[name[0].bookrecords.length - 1],
  }

  //Id{bookrecords.id}_{indeximages.seq}({bookrecords.cod})_{bookrecords.typebooks_id}
  //_{bookrecords.book}_{bookrecords.sheet}_{bookrecords.approximate_term}_{bookrecords.side}_{bookrecords.books_id}_{datetime}{extension}

}


async function transformFilesNameToId(images, typebook_id) {

  let result: Object[] = []
  let seq = 0
  let fileName = ""
  let query = ""

  for (let image of images) {

    if (!image) {
      console.log("não é imagem")
    }
    if (!image.isValid) {
      console.log("Error", image.errors);
    }

    if (image.clientName.toUpperCase().startsWith('L')) {
      let separators = ["L", '\'', '(', ')', '|', '-'];
      let arrayFileName = image.clientName.split(new RegExp('([' + separators.join('') + '])'));
      query = ` cod =${arrayFileName[4]} and book = ${arrayFileName[2]} `

    }

    const name = await Bookrecord.query()
      //.preload('indeximage')
      .where('typebooks_id', '=', typebook_id)
      .whereRaw(query)

    //retorna o ultimo seq
    const data = await Indeximage.query().where('bookrecords_id', name[0].id).andWhere('typebooks_id', '=', typebook_id).orderBy('seq', 'desc').first()
    if (!data)
      this.seq = 0
    else
      this.seq = data.seq+1


    fileName = `id${name[0].id}_${this.seq}_(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`
    const obj = name

    const bookrecords_id = name[0].id
    const typebooks_id = typebook_id
    const seq = this.seq
    const ext = image.extname
    const file_name = fileName
    const previous_file_name = image.clientName

    const indexImage = {
      bookrecords_id,
      typebooks_id,
      seq,
      ext,
      file_name,
      previous_file_name
    }


    if (image && image.isValid)
    {
      await image.move(Application.tmpPath('uploads'), {name: fileName, overwrite: true })
      //chamar função para inserir na tabela indeximages
      const dataIndexImage = await Indeximage.create(indexImage)
      result.push(dataIndexImage)
    }

  }
  return result

}


module.exports = { transformFileNameToId, transformFilesNameToId }
