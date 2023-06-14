
import Bookrecord from "App/Models/Bookrecord";
import Indeximage from "App/Models/Indeximage";
import Application from '@ioc:Adonis/Core/Application'
import Company from 'App/Models/Company'
import BadRequestException from "App/Exceptions/BadRequestException";
import Query from "mysql2/typings/mysql/lib/protocol/sequences/Query";

const authorize = require('App/Services/googleDrive/googledrive')
const fs = require('fs');
const path = require('path')

const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");


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
    //console.log("Delete File successfully.");
  });
}

async function downloadImage(fileName) {

  const extension = path.extname(fileName);
  const fileId = await authorize.sendSearchFile(fileName)
  const download = await authorize.sendDownloadFile(fileId[0].id, extension)

  return download
}

async function transformFilesNameToId(images, params, companies_id, capture = false) {

  //**PARTE ONDE CRIA AS PASTAS */
  const _companies_id = companies_id
  let result: Object[] = []

  //Verificar se existe o caminho da pasta com as imagens
  const folderPath = Application.tmpPath(`/uploads/Client_${companies_id}`)
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath)
    }
  } catch (error) {
    throw new BadRequestException('could not create client directory', 409)
  }

  //retorna o nome do diretório path em typebooks
  const directoryParent = await Bookrecord.query()
    .preload('typebooks')
    .where('typebooks_id', '=', params.typebooks_id)
    .andWhere('companies_id', '=', companies_id).first()

  if (!directoryParent || directoryParent == undefined)
    throw new BadRequestException('undefined book', 409)

  //verifica se existe essa pasta no Google e retorna o id do google
  let parent = await authorize.sendSearchFile(directoryParent?.typebooks.path)

  //se não tiver a pasta vai criar
  if (parent.length == 0) {
    //criar a pasta
    const company = await Company.findByOrFail('id', _companies_id)
    const idFolderCompany = await authorize.sendSearchFile(company.foldername)
    await authorize.sendCreateFolder(directoryParent?.typebooks.path, idFolderCompany[0].id)
    await sleep(2000)
    //return "Erro: Esta pasta não existe no GoogleDrive"
  }

  await sleep(1000);
  const idParent = await authorize.sendSearchFile(directoryParent?.typebooks.path)

  //******************************************************************************** */

  //imagem única para upload
  if (capture) {

    const _fileRename = await fileRename(images, params.typebooks_id, companies_id)

    try {
      await pushImageToGoogle(images, folderPath, _fileRename, idParent[0].id, true)
      //console.log("UPLOAD COM SUCESSO!!!!")
      return images
    } catch (error) {
      console.log(error);
      return error
    }

  }

  let cont = 0
  for (let image of images) {
    cont++
    if (cont >= 6) {
      await sleep(4000);
      cont = 0
    }
    if (!image) {
      console.log("não é imagem")
    }
    if (!image.isValid) {
      console.log("Error", image.errors);
    }
    const _fileRename = await fileRename(image.clientName, params.typebooks_id, companies_id)
    try {
      if (image && image.isValid) {
        result.push(await pushImageToGoogle(image, folderPath, _fileRename, idParent[0].id))
      }
    } catch (error) {
      await new BadRequestException(error + 'pushImageToGoogle', 409)
    }
  }
  return result
}


async function pushImageToGoogle(image, folderPath, objfileRename, idParent, capture = false) {

  try {
    //copia o arquivo para servidor
    if (capture) {
      await fs.rename(image, `${path.dirname(image)}/${objfileRename.file_name}`, function (err) {
        if (err) {
          throw err;
        } else {
          //console.log('Arquivo renomeado');
        }
      });
    }
    else {
      await image.move(folderPath, { name: objfileRename.file_name, overwrite: true })
    }
    //copia o arquivo para o googledrive
    await authorize.sendUploadFiles(idParent, folderPath, `${objfileRename.file_name}`)
    //chamar função para inserir na tabela indeximages
    await Indeximage.create(objfileRename)
    //chamar função de exclusão da imagem
    await deleteImage(`${folderPath}/${objfileRename.file_name}`)
  } catch (error) {
    throw new BadRequestException(error + ' sendUploadFiles', 409)
  }
  return objfileRename.file_name

}

async function fileRename(originalFileName, typebooks_id, companies_id) {

  let query
  let objFileName
  let separators
  let arrayFileName
  //Format L1(1).jpg
  //if (originalFileName.toUpperCase().startsWith('L')) {
  const regexBookAndCod = /^L\d+\(\d+\).*$/;
  //const regexBookSheetSide = /^L\d_\d_[A-Za-z].*/;
  const regexBookSheetSide = /^L\d+_\d+_[FV].*/;

  if (regexBookAndCod.test(originalFileName.toUpperCase())) {
    separators = ["L", '\'', '(', ')', '|', '-'];
    arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
    objFileName = {
      type: arrayFileName[1],
      book: arrayFileName[2],
      cod: arrayFileName[4],
      ext: arrayFileName[6]
    }
    query = ` cod =${objFileName.cod} and book = ${objFileName.book} `
  }
  else
    if (regexBookSheetSide.test(originalFileName.toUpperCase())) {
      separators = ["L", '_', '|', '-'];
      arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
      objFileName = {
        type: arrayFileName[1],
        book: arrayFileName[2],
        sheet: arrayFileName[4],
        side: arrayFileName[6][0],
        ext: path.extname(originalFileName).toLowerCase()
      }
      //console.log("ENTREI NO LIVRO FOLHA E LADO", arrayFileName, "livro:", objFileName.book, "folha:", objFileName.sheet, "side::", objFileName.side, "ext", objFileName.ext)
      query = ` book = ${objFileName.book} and sheet =${objFileName.sheet} and side='${objFileName.side}'`
      //console.log("BOOK SHEET SIDE", query)
    }
    //ARQUIVOS QUE INICIAM COM ID
    else if (path.basename(originalFileName).startsWith('Id')) {
      const arrayFileName = path.basename(originalFileName).split(/[_,.\s]/)
      objFileName = {
        id: arrayFileName[0].replace('Id', ''),
        cod: arrayFileName[1].replace('(', '').replace(')', ''),
        ext: `.${arrayFileName[4]}`
      }
      originalFileName = path.basename(originalFileName)
      query = ` id=${objFileName.id} and cod=${objFileName.cod} `
    }

  try {
    const name = await Bookrecord.query()
      .preload('typebooks')
      .where('typebooks_id', '=', typebooks_id)
      .andWhere('companies_id', '=', companies_id)
      .whereRaw(query)
    //console.log("name>>>>>", name)

    //retorna o ultimo seq
    const _seq = await Indeximage.query()
      .where('bookrecords_id', name[0].id)
      .andWhere('typebooks_id', '=', typebooks_id)
      .andWhere('companies_id', '=', companies_id)
      .orderBy('seq', 'desc').first()

    const seq = (!_seq ? 0 : _seq.seq + 1)

    //**FORMATO DE GRAVAÇÃO DOS ARQUIVOS (LAYOUT DE SAIDA)*************
    //Id{id}_{seq}({cod})_{typebook_id}_{book}_{sheet}_{approximate_term}_{side}_{books_id}.{extensão}
    const fileRename = {
      file_name: `Id${name[0].id}_${seq}(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${!name[0].sheet || name[0].sheet == null ? "" : name[0].sheet}_${!name[0].approximate_term || name[0].approximate_term == null ? '' : name[0].approximate_term}_${!name[0].side || name[0].side == null ? '' : name[0].side}_${name[0].books_id}${objFileName.ext.toLowerCase()}`,
      bookrecords_id: name[0].id,
      typebooks_id,
      companies_id,
      seq,
      ext: objFileName.ext,
      previous_file_name: originalFileName
    }

    //console.log("FILERENAME", fileRename)
    return fileRename

  } catch (error) {
    return error
  }

}

async function deleteFile(listFiles: [{}]) {

  const idFolder = await authorize.sendSearchFile(listFiles[0]['path'])
  let idFile
  for (const file of listFiles) {
    idFile = await authorize.sendSearchFile(file['file_name'], idFolder[0].id)
    await authorize.sendDeleteFile(idFile[0].id)
  }
  return "excluido!!!"

}

async function totalFilesInFolder(folderName) {
  try {
    const idFolder = await authorize.sendSearchFile(folderName)
    const listFiles = await authorize.sendListAllFiles(idFolder)
    if (listFiles) {
      //console.log("TOTAL DE ARQUIVOS::", listFiles.length)
      return listFiles
    }
    else return 0
  } catch (error) {
    return 0
  }


}
async function indeximagesinitial(folderName, companies_id) {
  const listFiles = await totalFilesInFolder(folderName?.path)
  //Id{nasc_id}_{seq}({termo})_{livrotipo_reg}_{livro}_{folha}_{termoNovo}_{lado}_{tabarqbin.tabarqbin_reg}_{indice}_{anotacao}_{letra}_{ano}_{data do arquivo}{extensão}
  const objlistFilesBookRecord = listFiles.map((file) => {
    const fileSplit = file.split("_")

    const id = fileSplit[0].match(/\d+/g)[0];
    const typebooks_id = fileSplit[2]
    const books_id = fileSplit[7].match(/\d+/g)[0];
    const cod = fileSplit[1].match(/\((\d+)\)/)[0].replace(/\(|\)/g, '');
    const book = fileSplit[3] == '' ? null : fileSplit[3]
    const sheet = fileSplit[4] == '' ? null : fileSplit[4]
    const side = fileSplit[6]
    const approximate_term = fileSplit[5]
    const indexbook = fileSplit[8] == '' ? null : fileSplit[8]
    const obs = fileSplit[9]
    const letter = fileSplit[10]
    const year = fileSplit[11]

    return {
      id, typebooks_id, books_id, companies_id, cod, book, sheet, side,
      approximate_term, indexbook, obs, letter, year
    }
  });

  const indexImages = listFiles.map((file) => {
    const fileSplit = file.split("_")

    const bookrecords_id = fileSplit[0].match(/\d+/g)[0];
    const typebooks_id = fileSplit[2]
    const seq = fileSplit[1].match(/^(\d+)/)[0];
    const ext = path.extname(file);

    return {
      bookrecords_id, typebooks_id, companies_id, seq,
      ext, file_name: file, previous_file_name: file
    }
  });

  const uniqueIds = {};
  const bookRecord = objlistFilesBookRecord.filter(obj => {
    if (!uniqueIds[obj.id]) {
      uniqueIds[obj.id] = true;
      return true;
    }
    return false;
  });


  bookRecord.sort((a, b) => a.id - b.id);
  indexImages.sort((a, b) => a.id - b.id);
  return { bookRecord, indexImages }


}

module.exports = { transformFilesNameToId, downloadImage, fileRename, deleteFile, indeximagesinitial, totalFilesInFolder }
