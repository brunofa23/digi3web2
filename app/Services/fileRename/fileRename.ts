
import { Request } from "@adonisjs/core/build/standalone";
import Bookrecord from "App/Models/Bookrecord";
import Indeximage from "App/Models/Indeximage";
import { file } from "googleapis/build/src/apis/file";

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
  //let result = []
  let seq = 0
  let fileName = ""
  let query = ""

  for (let image of images) {

    if (image.clientName.toUpperCase().startsWith('L')){
      let separators = ["L", '\'', '(', ')', '|', '-'];
      let arrayFileName = image.clientName.split(new RegExp('([' + separators.join('') + '])'));
      query = ` cod =${arrayFileName[4]} and book = ${arrayFileName[2]} `

    }

    const name = await Bookrecord.query()
      .preload('bookrecords')
      .where('typebooks_id', '=', typebook_id)
      .whereRaw(query)

    const data = await Indeximage.query().where('bookrecords_id', name[0].id).andWhere('typebooks_id', '=', typebook_id).orderBy('seq', 'desc').first()
    if (!data)
      seq = 0
    else
      seq = data.seq


    //fileName = `id${name[0].id}_${seq}_(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`
    fileName = `id${name[0].id}_${seq}_(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`
    const obj = name
    result.push({fileName, obj})
    //result.push({fileName: fileName, obj})
  }
  //console.log(result);
  return result

}


module.exports = { transformFileNameToId, transformFilesNameToId }
