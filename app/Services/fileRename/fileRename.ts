
import { Request } from "@adonisjs/core/build/standalone";
import Bookrecord from "App/Models/Bookrecord";
import Indeximage from "App/Models/Indeximage";
import Typebook from "App/Models/Typebook";

import { file } from "googleapis/build/src/apis/file";
import Application from '@ioc:Adonis/Core/Application'
import { Auth } from "googleapis";

const authorize = require('App/Services/googleDrive/googledrive')
const fs = require('fs');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function deleteImage(folderPath) {
  fs.unlink(`${folderPath}`, (err) => {
    if (err) {
      throw err;
    }
    console.log("Delete File successfully.");
  });
}

async function transformFilesNameToId(images, params, companies_id) {


  // const folder = await authorize.sendCreateFolder("1")
  // //let parent1 = await authorize.sendSearchFile("subTESTE")
  // return folder



  let result: Object[] = []
  let query = ""

  //Verificar se existe o caminho da pasta com as imagens
  const folderPath = Application.tmpPath(`/uploads/Client_${companies_id}`)


  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath)
    }
  } catch (error) {
    return error
  }

  //retorna o nome do diretório path em typebooks
  const directoryParent = await Bookrecord.query()
    .preload('typebooks')
    .where('typebooks_id', '=', params.typebooks_id)
    .andWhere('companies_id', '=', companies_id).first()



  if (!directoryParent || directoryParent == undefined)
    return "LIVRO SEM REGISTROS PARA VINCULAR IMAGENS"

   const authorizeGoogle = await authorize.sendAuthorize()

   //verifica se existe essa pasta no Google e retorna o id do google
   let parent = await authorize.sendSearchFile(directoryParent?.typebooks.path)
  //se não tiver a pasta vai criar
  if (parent.length == 0) {
    //criar a pasta
    await authorize.sendCreateFolder(directoryParent?.typebooks.path)

  }
  await sleep(1000);
  const idParent = await authorize.sendSearchFile(directoryParent?.typebooks.path)

  let cont = 0
  for (let image of images) {

    cont++
    if (cont >= 5) {
      console.log("Begin");
      await sleep(2000);
      console.log("End");
      cont = 0
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
          .where('typebooks_id', '=', params.typebooks_id)
          .andWhere('companies_id', '=', this.companies_id)
          .whereRaw(query)


        //retorna o ultimo seq
        const data = await Indeximage.query()
          .where('bookrecords_id', name[0].id)
          .andWhere('typebooks_id', '=', params.typebooks_id)
          .andWhere('companies_id', '=', this.companies_id)
          .orderBy('seq', 'desc').first()

        //return { teste: "teste", data }

        if (!data)
          this.seq = 0
        else
          this.seq = data.seq + 1


        const fileName = `id${name[0].id}_${this.seq}(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}_.${image.extname}`
        const bookrecords_id = name[0].id
        const typebooks_id = params.typebooks_id
        const companies_id = this.companies_id
        const seq = this.seq
        const ext = image.extname
        const file_name = fileName
        const previous_file_name = image.clientName

        const indexImage = {
          bookrecords_id,
          typebooks_id,
          companies_id,
          seq,
          ext,
          file_name,
          previous_file_name
        }

        console.log("passei aqui...")

        if (image && image.isValid) {
          //copia o arquivo para servidor
          await image.move(folderPath, { name: fileName, overwrite: true })
          //copia o arquivo para o googledrive
          await authorize.sendUploadFiles(idParent[0].id, folderPath, `${fileName}`)
          //chamar função para inserir na tabela indeximages
          const dataIndexImage = await Indeximage.create(indexImage)
          //chamar função de exclusão da imagem
          await deleteImage(`${folderPath}/${fileName}`)

          result.push(dataIndexImage)
        }

      } catch (error) {
        console.log(error);
      }
    }
  }
  console.log("total:", result.length);

  return result.length

}




module.exports = { transformFilesNameToId }
