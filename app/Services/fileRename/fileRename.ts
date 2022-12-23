
import { Request } from "@adonisjs/core/build/standalone";
import Bookrecord from "App/Models/Bookrecord";
import Indeximage from "App/Models/Indeximage";
import Typebook from "App/Models/Typebook";

import { file } from "googleapis/build/src/apis/file";
import Application from '@ioc:Adonis/Core/Application'
import { Auth } from "googleapis";



const authorize = require('App/Services/googleDrive/googledrive')

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


function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}



async function run() {
  await delay(3000);
  console.log('This printed after about 1 second');
}


async function transformFilesNameToId(images, typebook_id) {

  let result: Object[] = []
  let query = ""

  const directoryParent = await Bookrecord.query()
    .preload('typebooks')
    .where('typebooks_id', '=', typebook_id).first()

  authorize.sendAuthorize()
  const idParent = await authorize.sendSearchFile(directoryParent?.typebooks.path)

  console.log("parente", idParent[0]);
  let cont = 0

  for (let image of images) {

    cont++
    if (cont >= 5)
      {
        run()
        cont=0
      }

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

      try {
        const name = await Bookrecord.query()
          .preload('typebooks')
          .where('typebooks_id', '=', typebook_id)
          .whereRaw(query)

        //retorna o ultimo seq
        const data = await Indeximage.query().where('bookrecords_id', name[0].id).andWhere('typebooks_id', '=', typebook_id).orderBy('seq', 'desc').first()
        if (!data)
          this.seq = 0
        else
          this.seq = data.seq + 1


        const fileName = `id${name[0].id}_${this.seq}(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`
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

        if (image && image.isValid) {
          //copia o arquivo para servidor
          await image.move(Application.tmpPath('uploads'), { name: fileName, overwrite: true })
          //copia o arquivo para o googledrive
          await authorize.sendUploadFiles(idParent[0].id, fileName)
          //chamar função para inserir na tabela indeximages
          const dataIndexImage = await Indeximage.create(indexImage)

          //exclui as imagens copiadas***********************
          const fs = require('fs');

          await fs.unlink(`tmp/uploads/${fileName}`, (err) => {
            if (err) {
              throw err;
            }
            console.log("Delete File successfully.");
          });
          //************************************************* */



          result.push(dataIndexImage)
        }

      } catch (error) {
        console.log(error);
      }
    }
  }
  return result

}


module.exports = { transformFileNameToId, transformFilesNameToId }
