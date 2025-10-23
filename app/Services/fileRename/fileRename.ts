
import Bookrecord from "App/Models/Bookrecord";
import Typebook from "App/Models/Typebook";
import Indeximage from "App/Models/Indeximage";
import Application from '@ioc:Adonis/Core/Application'
import Company from 'App/Models/Company'
import ErrorlogImage from "App/Models/ErrorlogImage";
import BadRequestException from "App/Exceptions/BadRequestException";
import { err } from "pino-std-serializers";
import { DateTime } from "luxon";

import {
  sendUploadFiles,
  sendCreateFolder,
  sendSearchFile,
  sendDownloadFile,
  sendDeleteFile,
  sendListAllFiles,
  sendRenameFile
} from "App/Services/googleDrive/googledrive"

//const authorize = require('App/Services/googleDrive/googledrive')
const fs = require('fs');
const path = require('path')

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function deleteImage(folderPath) {
  try {
    fs.unlink(`${folderPath}`, (err) => {
      if (err) {
        throw "ERRO DELETE::" + err;
      }
      return true
    });
  } catch (error) {
    return { "ERRO DELETE::>": err, error }
  }

}

async function downloadImage(fileName, typebook_id, company_id, cloud_number: number) {
  const directoryParent = await Typebook.query()
    .where('id', '=', typebook_id)
    .andWhere('companies_id', '=', company_id).first()
  const parent = await sendSearchFile(directoryParent?.path, cloud_number)
  const extension = path.extname(fileName);
  const fileId = await sendSearchFile(fileName, cloud_number, parent[0].id)
  const download = await sendDownloadFile(fileId[0].id, extension, cloud_number)
  return download
}

async function transformFilesNameToId(images, params, companies_id, cloud_number: number, capture = false, dataImages = {}) {

  //**PARTE ONDE CRIA AS PASTAS */
  const _companies_id = companies_id
  let result: Object[] = []
  //Verificar se existe o caminho da pasta com as imagens
  const uploadsBasePath = Application.tmpPath('uploads')
  const folderPath = Application.tmpPath(`/uploads/Client_${companies_id}`)

  try {
    if (!fs.existsSync(uploadsBasePath)) {
      fs.mkdirSync(uploadsBasePath)
    }
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath)
    }
  } catch (error) {
    throw new BadRequestException('could not create client directory', 409, error)
  }
  //console.log("código 698 - passo 3")
  const directoryParent = await Typebook.query()
    .where('id', '=', params.typebooks_id)
    .andWhere('companies_id', '=', companies_id).first()

  if (!directoryParent || directoryParent == undefined)
    throw new BadRequestException('undefined book', 409)

  //verifica se existe essa pasta no Google e retorna o id do google
  let parent = await sendSearchFile(directoryParent?.path, cloud_number)

  //se não tiver a pasta vai criar
  if (parent.length == 0) {
    //criar a pasta
    const company = await Company.findByOrFail('id', _companies_id)
    const idFolderCompany = await sendSearchFile(company.foldername, cloud_number)

    await sendCreateFolder(directoryParent?.path, cloud_number, idFolderCompany[0].id)
    await sleep(2000)
    //return "Erro: Esta pasta não existe no GoogleDrive"
  }
  await sleep(1000);
  const idParent = await sendSearchFile(directoryParent?.path, cloud_number)

  //console.log("código 5666 - PARTE 4")
  //******************************************************************************** */
  //imagem única para upload
  if (capture) {
    const _fileRename = await fileRename(images, params.typebooks_id, companies_id)
    //console.log("CAPTURE PARTE 4,5>>", _fileRename)
    try {
      //  console.log("código 5666 - PARTE 5")
      await pushImageToGoogle(images, folderPath, _fileRename, idParent[0].id, cloud_number, true)
      return images
    } catch (error) {
      console.log(error);
      return error
    }
  }

  let cont = 0
  let _fileRename
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

    //console.log("código 5666 - PARTE 7",image.clientName,"-", params.typebooks_id,"--", companies_id,"---", dataImages)
    //************************************************************************************************************* */
    _fileRename = await fileRename(image.clientName, params.typebooks_id, companies_id, dataImages)

    try {
      if (image && image.isValid) {
        result.push(await pushImageToGoogle(image, folderPath, _fileRename, idParent[0].id, cloud_number))
      }
    } catch (error) {
      await new BadRequestException(error + 'pushImageToGoogle', 409)
    }
  }

  return result
}

async function renameFileGoogle(filename, folderPath, newTitle, cloud_number: number) {
  try {
    const idFolderPath = await sendSearchFile(folderPath, cloud_number)
    const idFile = await sendSearchFile(filename, cloud_number, idFolderPath[0].id)
    const renameFile = await sendRenameFile(idFile[0].id, newTitle, cloud_number)
  } catch (error) {

  }
}


async function pushImageToGoogle(image, folderPath, objfileRename, idParent, cloud_number, capture = false) {
  //await imageProcessing(folderPath,folderPath)

  console.log("passo 1222 upload @@@@")
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

    //FAZ O TRATAMENTO DA IMAGEM ANTES DE ENVIAR PARA O GDRIVE
    // const fullPathFileInput = path.join(folderPath, objfileRename.file_name)
    // await imageProcessing(fullPathFileInput)
    //copia o arquivo para o googledrive
    const sendUpload = await sendUploadFiles(idParent, folderPath, `${objfileRename.file_name}`, cloud_number)

    if (sendUpload.status === 200) {
      //console.log("IMAGEM INSERIDA COM SUCESSO!!!!!!!!!!!", objfileRename)
      //chamar função para inserir na tabela indeximages
      if (!objfileRename.typeBookFile || objfileRename.typeBookFile == false) {
        const date_atualization = DateTime.now()
        objfileRename.date_atualization = date_atualization.toFormat('yyyy-MM-dd HH:mm')
        await Indeximage.create(objfileRename)
      }
      else if (sendUpload.status !== 200) {
        delete objfileRename.date_atualization
        await ErrorlogImage.create(objfileRename)
      }
      //chamar função de exclusão da imagem
      await deleteImage(`${folderPath}/${objfileRename.file_name}`)
    }
  } catch (error) {
    throw new BadRequestException(error + ' sendUploadFiles', 409)
  }
  return objfileRename.file_name

}

async function fileRename(originalFileName, typebooks_id, companies_id, dataImages = {}) {
  //console.log("cheguei aqui filerename", originalFileName, "-", typebooks_id, "--", companies_id, "---", dataImages)

  let objFileName
  let separators
  let arrayFileName
  let isCreateBookrecord = false
  let isCreateCover = false
  //Format L1(1).jpg = Livro 1 e Código 1
  const regexBookAndCod = /^L\d+\(\d+\).*$/;
  //Formato L1_1_F.jpg = Livro 1, Folha 1 e Lado Frente
  const regexBookSheetSide = /^L\d+_\d+_[FV].*/;
  //Format T123(123)livro.jpg
  const regexBookAndTerm = /^T\d+\(\d+\)(.*?)\.\w+$/;
  //Format P1(123).jpg para prot do Documents
  const regexDocumentAndProt = /^P\d+\(\d+\).*$/;
  //FORMATO L122F(1)F.jpg para Livro e folha e verifica ou insere registro no bookrecord
  const regexBookSheetSideInsertBookrecord = /^l(\d+)f\((\d+)\)([vf])(\d)?[^.]*\.(\w+)$/i;
  //FORMATO DE CAPA OU SEJA L999C(1).jpg OU SEJA PEGA O LIVRO E FOLHA 0
  const regexBookCoverInsertBookrecord = /^L([1-9]\d*)C\(([1-9]\d*)\)([a-zA-Z]*)\.(.+)$/i;

  const query = Bookrecord.query()
    .preload('indeximage', query => {
      query.where('indeximages.typebooks_id', typebooks_id)
      query.andWhere('indeximages.companies_id', '=', companies_id)
    })
    .where('bookrecords.typebooks_id', '=', typebooks_id)
    .andWhere('bookrecords.companies_id', '=', companies_id)

  //********************************************************** */
  if (dataImages.typeBookFile) {
    let fileName
    const ext = path.extname(originalFileName).toLowerCase()

    switch (true) {
      case (dataImages.book && dataImages.sheet && dataImages.side):
        fileName = `L${dataImages.book}_${dataImages.sheet}_${dataImages.side}-${dataImages.typeBookFile}${ext}`
        break

      case (dataImages.book && dataImages.cod):
        fileName = `L${dataImages.book}(${dataImages.cod})-${dataImages.typeBookFile}${ext}`
        break

      case (dataImages.book && dataImages.approximateTerm):
        fileName = `T${dataImages.book}(${dataImages.approximateTerm})-${dataImages.typeBookFile}${ext}`
        break
    }

    return {
      file_name: fileName,
      typebooks_id,
      companies_id,
      previous_file_name: originalFileName,
      typeBookFile: true
    }
  }

  // -------------------------------------------------------
  // Se não for typeBookFile → entra no switch de regex
  // -------------------------------------------------------

  switch (true) {
    case regexBookCoverInsertBookrecord.test(originalFileName.toUpperCase()): {
      const match = originalFileName.match(regexBookCoverInsertBookrecord)
      if (match) {
        objFileName = {
          book: match[1],
          sheet: 0,//match[2],
          letter: match[3] || "",
          ext: "." + match[4].toLowerCase(),
        }
        query.andWhere('book', objFileName.book)
        isCreateCover = true
      }
      break
    }

    case regexBookSheetSideInsertBookrecord.test(originalFileName): {
      const match = originalFileName.match(regexBookSheetSideInsertBookrecord);
      if (match) {
        objFileName = {
          book: match[1],        // número entre L e F → 123
          sheet: match[2],       // número entre parênteses → 1
          side: match[3].toUpperCase(), // letra depois do parêntese → F/V
          indexbook: match[4] ? Number(match[4]) : null, // primeiro dígito após F/V
          ext: path.extname(originalFileName).toLowerCase() //"." + match[5].toLowerCase(), // extensão do arquivo
        };


        query.andWhere('book', objFileName.book)
        query.andWhere('sheet', objFileName.sheet)
        query.andWhere('side', objFileName.side)
        if (objFileName?.indexbook)
          query.andWhere('indexbook', objFileName.indexbook)
        else query.andWhereNull('indexbook')

        isCreateBookrecord = true
        break
      }
    }

    case regexBookAndCod.test(originalFileName.toUpperCase()): {
      separators = ["L", '\'', '(', ')', '|', '-']
      arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'))

      objFileName = {
        type: arrayFileName[1],
        book: arrayFileName[2],
        cod: arrayFileName[4],
        ext: arrayFileName[6]
      }
      query.andWhere('cod', objFileName.cod)
      query.andWhere('book', objFileName.book)
      break
    }

    case regexBookSheetSide.test(originalFileName.toUpperCase()): {
      separators = ["L", '_', '|', '-']
      arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'))

      objFileName = {
        type: arrayFileName[1],
        book: arrayFileName[2],
        sheet: arrayFileName[4],
        side: arrayFileName[6][0],
        ext: path.extname(originalFileName).toLowerCase()
      }
      query.andWhere('book', objFileName.book)
      query.andWhere('sheet', objFileName.sheet)
      query.andWhere('side', objFileName.side)
      break
    }

    case path.basename(originalFileName).startsWith('Id'): {
      const arrayFileName = path.basename(originalFileName).split(/[_,.\s]/)
      objFileName = {
        id: arrayFileName[0].replace('Id', ''),
        cod: arrayFileName[1].replace('(', '').replace(')', ''),
        ext: `.${arrayFileName[arrayFileName.length - 1]}`
      }
      originalFileName = path.basename(originalFileName)
      query.andWhere('id', objFileName.id)
      query.andWhere('cod', objFileName.cod)
      break
    }

    case regexBookAndTerm.test(originalFileName.toUpperCase()): {
      const arrayFileName = originalFileName.substring(1).split(/[()\.]/)
      objFileName = {
        book: arrayFileName[0],
        approximate_term: arrayFileName[1],
        ext: `.${arrayFileName[3]}`
      }
      query.andWhere('approximate_term', objFileName.approximate_term)
      query.andWhere('book', objFileName.book)
      break
    }

    case regexDocumentAndProt.test(originalFileName.toUpperCase()): {
      const arrayFileName = originalFileName.substring(1).split(/[()\.]/)
      objFileName = {
        book: arrayFileName[0],
        prot: arrayFileName[1],
        ext: `.${arrayFileName[3]}`
      }
      query.andWhere('book', objFileName.book)
      query.whereHas('document', q => {
        q.where('documents.prot', objFileName.prot)
      })
      break
    }

    default: {
      if (dataImages.id) query.andWhere('id', dataImages.id)
      if (dataImages.book) query.andWhere('book', dataImages.book)
      if (dataImages.sheet) query.andWhere('sheet', dataImages.sheet)
      if (dataImages.side) query.andWhere('side', dataImages.side)
      if (dataImages.cod) query.andWhere('cod', dataImages.cod)
      if (dataImages.approximateTerm) query.andWhere('approximate_term', dataImages.approximateTerm)
      if (dataImages.indexBook) query.andWhere('indexbook', dataImages.indexBook)

      objFileName = { ext: path.extname(originalFileName).toLowerCase() }
    }
  }

  //********************************************************** */


  try {

    let bookRecord = await query.first()
    let seq = 0
    // *****************************************************************
    if (bookRecord === null || isCreateCover) {
      if (isCreateBookrecord || isCreateCover) {
        try {
          const query = Typebook.query()
            .where('companies_id', companies_id)
            .andWhere('id', typebooks_id)//.first()
          const book = await query.first()
          //console.log("passo 1:", query.toQuery())

          const query2 = Bookrecord.query()
            .where('typebooks_id', typebooks_id)
            .andWhere('companies_id', companies_id)
            .max('cod as max_cod')//.first()

          const bookRecordFind = await query2.first()
          //console.log("passo 2:", query2.toQuery())

          const { ext, ...objFileNameWithoutExt } = objFileName
          const objectInsert = {
            books_id: book.books_id,
            typebooks_id: typebooks_id,
            companies_id: companies_id,
            cod: bookRecordFind?.$extras.max_cod + 1,
            ...objFileNameWithoutExt
          }
          bookRecord = await Bookrecord.create(objectInsert)
          seq = 1

        } catch (error) {
          console.log("!!!!!!!", error)
        }
      } else {
        return
      }
    } else {
      if (bookRecord.indeximage.length == 0) {
        seq = 1
      }
      else {
        seq = bookRecord.indeximage[bookRecord.indeximage.length - 1].seq + 1
      }
    }


    let fileRename
    try {
      fileRename = {
        file_name: await mountNameFile(bookRecord, seq, objFileName.ext),
        bookrecords_id: bookRecord.id,
        typebooks_id,
        companies_id,
        seq,
        ext: objFileName.ext,
        //previous_file_name: originalFileName
      }
    } catch (error) {
      return error
    }
    return fileRename
  } catch (error) {
    return error
  }

}

async function mountNameFile(bookRecord: Bookrecord, seq: Number, extFile: String) {
  //Id{id}_{seq}({cod})_{typebook_id}_{book}_{sheet}_{approximate_term}_{side}_{books_id}.{extensão}
  //Id{nasc_id}_{seq}({termo})_{livrotipo_reg}_{livro}_{folha}_{termoNovo}_{lado}_{tabarqbin.tabarqbin_reg}_{indice}_{anotacao}_{letra}_{ano}_{data do arquivo}{extensão}
  if (!extFile.startsWith('.'))
    extFile = path.extname(extFile).toLowerCase()
  let dateNow: DateTime = DateTime.now()
  dateNow = dateNow.toFormat('yyyyMMddHHmm')

  return `Id${bookRecord.id}_${seq}(${bookRecord.cod})_${bookRecord.typebooks_id}_${bookRecord.book}_${!bookRecord.sheet || bookRecord.sheet == null ? "" : bookRecord.sheet}_${!bookRecord.approximate_term || bookRecord.approximate_term == null ? '' : bookRecord.approximate_term}_${!bookRecord.side || bookRecord.side == null ? '' : bookRecord.side}_${bookRecord.books_id}_${!bookRecord.indexbook || bookRecord.indexbook == null ? '' : bookRecord.indexbook}_${!bookRecord.obs || bookRecord.obs == null ? '' : bookRecord.obs}_${!bookRecord.letter || bookRecord.letter == null ? '' : bookRecord.letter}_${!bookRecord.year || bookRecord.year == null ? '' : bookRecord.year}_${dateNow}${extFile.toLowerCase()}`
}

async function deleteFile(listFiles: [{}], cloud_number: number) {
  try {

    const idFolder = await sendSearchFile(listFiles[0]['path'], cloud_number)
    let idFile
    for (const file of listFiles) {
      idFile = await sendSearchFile(file['file_name'], cloud_number, idFolder[0].id)
      await sendDeleteFile(idFile[0].id, cloud_number)
    }
    return "excluido!!!"
  } catch (error) {
    throw error
  }
}

async function updateFileName(bookRecord: Bookrecord) {
  try {
    const _indexImage = await Indeximage.query()
      .preload('typebooks', (query) => {
        query.where('id', bookRecord.typebooks_id)
          .andWhere('companies_id', bookRecord.companies_id)
      })
      .where('indeximages.bookrecords_id', bookRecord.id)
      .andWhere('indeximages.typebooks_id', bookRecord.typebooks_id)
      .andWhere('indeximages.companies_id', bookRecord.companies_id)


    if (_indexImage.length > 0) {
      for (const data of _indexImage) {
        const newFileName = await mountNameFile(bookRecord, data?.seq, data.file_name)
        await Indeximage.query()
          .where('bookrecords_id', '=', data.bookrecords_id)
          .andWhere('typebooks_id', '=', data.typebooks_id)
          .andWhere('companies_id', '=', data.companies_id)
          .andWhere('seq', '=', data.seq)
          .update({ previous_file_name: newFileName })
      }
    }


  } catch (error) {
    throw error
  }


}

async function totalFilesInFolder(folderName, cloud_number: number) {
  try {
    const idFolder = await sendSearchFile(folderName, cloud_number)
    const listFiles = await sendListAllFiles(cloud_number, idFolder)
    if (listFiles) {
      return listFiles
    }
    else return 0
  } catch (error) {
    return 0
  }
}
//**************************************************** */

async function indeximagesinitial(folderName, companies_id, cloud_number, listFilesImages = []) {

  let listFiles
  if (listFilesImages.length > 0) {
    listFiles = listFilesImages
  } else {
    listFiles = await totalFilesInFolder(folderName?.path, cloud_number)
  }
  listFiles = listFiles.filter(item => item.startsWith("Id" || "id" || "ID"))
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
    //para documentos
    const yeardoc = fileSplit[4] == '' ? null : fileSplit[4] //documentos
    const month = fileSplit[6] //documentos

    return {
      id, typebooks_id, books_id, companies_id, cod, book, sheet, side,
      approximate_term, indexbook, obs, letter, year, yeardoc, month
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

export { transformFilesNameToId, downloadImage, fileRename, deleteFile, indeximagesinitial, totalFilesInFolder, renameFileGoogle, mountNameFile, updateFileName }
