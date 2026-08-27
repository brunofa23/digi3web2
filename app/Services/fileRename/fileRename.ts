
import Bookrecord from "App/Models/Bookrecord";
import Typebook from "App/Models/Typebook";
import Indeximage from "App/Models/Indeximage";
import Application from '@ioc:Adonis/Core/Application'
import Company from 'App/Models/Company'
import ErrorlogImage from "App/Models/ErrorlogImage";
import BadRequestException from "App/Exceptions/BadRequestException";
import { err } from "pino-std-serializers";
import { DateTime } from "luxon";
import { promises as fsp } from 'fs'
import crypto from 'crypto'



import {
  sendUploadFiles,
  sendCreateFolder,
  sendSearchFile,
  sendDownloadFile,
  sendDeleteFile,
  sendListAllFiles,
  sendRenameFile
} from "App/Services/googleDrive/googledrive"
import { file } from "googleapis/build/src/apis/file";
import PdfOptimizer from "../imageProcessing/PdfOptimizer";
import { processImage } from 'App/Services/imageProcessing/processImage'
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query";
import Document from "App/Models/Document";

//const authorize = require('App/Services/googleDrive/googledrive')
const fs = require('fs');
//const path = require('path')
import path from 'path'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function safeDriveSearchLog(result) {
  if (Array.isArray(result)) {
    return { isArray: true, length: result.length }
  }

  return {
    isArray: false,
    message: result?.message,
    code: result?.code,
    type: result?.type,
  }
}

const pendingRenameQueue = new Map<string, number>()
let pendingRenameTimer = null
let isPendingRenameQueueRunning = false
const pendingRenameBatchSize = 5
const pendingRenameDelayMs = 1000
const maxPendingRenameRoundsByTypebook = 50
const maxGoogleDriveDeleteBatchSize = 20

function hasDataImageLookup(dataImages: any) {
  return Boolean(
    dataImages?.id ||
    dataImages?.book ||
    dataImages?.sheet ||
    dataImages?.side ||
    dataImages?.cod ||
    dataImages?.approximateTerm ||
    dataImages?.indexBook
  )
}

function invalidFileRename(fileName: string, reason: string) {
  return {
    isInvalidFileRename: true,
    fileName: path.basename(fileName || ''),
    reason,
  }
}

function isInvalidFileRename(result: any) {
  return !result || result.isInvalidFileRename || !result.file_name
}

function normalizeInvalidFileRename(fileName: string, result: any) {
  if (result?.isInvalidFileRename) return result

  return invalidFileRename(
    fileName,
    'Não foi possível identificar o registro correspondente para este arquivo.'
  )
}

function getBookRecordNotFoundReason(objFileName: any, matchedFilePattern: string) {
  switch (matchedFilePattern) {
    case 'book_cod':
      return `Nenhum bookrecord encontrado para livro ${objFileName.book} e código ${objFileName.cod}.`
    case 'book_sheet_side':
    case 'book_sheet_side_insert':
      return `Nenhum bookrecord encontrado para livro ${objFileName.book}, folha ${objFileName.sheet} e lado ${objFileName.side}.`
    case 'book_term':
      return `Nenhum bookrecord encontrado para livro ${objFileName.book} e termo aproximado ${objFileName.approximate_term}.`
    case 'document_prot':
      return `Nenhum documento encontrado para livro ${objFileName.book} e protocolo ${objFileName.prot}.`
    case 'id':
      return `Nenhum bookrecord encontrado para id ${objFileName.id} e código ${objFileName.cod}.`
    default:
      return 'Nenhum bookrecord encontrado para os dados informados.'
  }
}

const acceptedFileNameFormats = 'L1(1).jpg, L1_5_F.jpg, L1F(5)F.jpg, L1F(5)V.jpg, T1(123).jpg ou P1(123).jpg.'

function throwInvalidFiles(invalidFiles: any[]) {
  const hasInvalidFormat = invalidFiles.some((file) => String(file.reason || '').includes('Formato não aceito'))
  const message = [
    'Alguns arquivos não puderam ser enviados:',
    ...invalidFiles.map((file) => {
      if (String(file.reason || '').includes('Formato não aceito')) return `- ${file.fileName}`
      return `- ${file.fileName}: ${file.reason}`
    }),
    ...(hasInvalidFormat ? ['', `Formatos aceitos: ${acceptedFileNameFormats}`] : []),
  ].join('\n')

  const error = new BadRequestException(message, 422, 'invalid_image_file_names')
  ;(error as any).invalidFiles = invalidFiles
  throw error
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

async function getLocalFileMetadata(filePath: string) {
  const stat = await fsp.stat(filePath)
  const hash = crypto.createHash('md5')

  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve())
    stream.on('error', reject)
  })

  return {
    size: stat.size,
    md5Checksum: hash.digest('hex'),
  }
}

async function findDuplicateIndeximage(
  companiesId: number,
  typebooksId: number,
  bookrecordsId: number,
  driveFolderId: string,
  md5Checksum: string,
  fileSize: number
) {
  if (!companiesId || !typebooksId || !bookrecordsId || !driveFolderId || !md5Checksum || !fileSize) return null

  return Indeximage.query()
    .where('companies_id', companiesId)
    .andWhere('typebooks_id', typebooksId)
    .andWhere('bookrecords_id', bookrecordsId)
    .andWhere('drive_folder_id', driveFolderId)
    .andWhere('drive_md5_checksum', md5Checksum)
    .andWhere('drive_file_size', fileSize)
    .first()
}

function getUploadReportItem(objfileRename: any, image: any, idParent: string) {
  return {
    file_name: objfileRename.file_name,
    original_file_name: image?.clientName || path.basename(String(image || objfileRename.file_name)),
    companies_id: objfileRename.companies_id,
    typebooks_id: objfileRename.typebooks_id,
    bookrecords_id: objfileRename.bookrecords_id,
    seq: objfileRename.seq,
    cod: objfileRename.register || objfileRename.cod,
    book: objfileRename.book,
    sheet: objfileRename.sheet,
    side: objfileRename.side,
    approximate_term: objfileRename.approximate_term,
    indexbook: objfileRename.indexbook,
    drive_folder_id: objfileRename.drive_folder_id || idParent,
  }
}

// async function downloadImage(fileName, typebook_id, company_id, cloud_number: number) {
//   const directoryParent = await Typebook.query()
//     .where('id', '=', typebook_id)
//     .andWhere('companies_id', '=', company_id).first()
//   const parent = await sendSearchFile(directoryParent?.path, cloud_number)
//   const extension = path.extname(fileName);
//   const fileId = await sendSearchFile(fileName, cloud_number, parent[0].id)
//   const download = await sendDownloadFile(fileId[0].id, extension, cloud_number)
//   return download
// }
async function downloadImage(fileName, typebook_id, company_id, cloud_number: number) {
  // 🔹 Busca o diretório principal
  const directoryParent = await Typebook.query()
    .where('id', typebook_id)
    .andWhere('companies_id', company_id)
    .first()

  if (!directoryParent) {
    throw new Error(`Typebook ${typebook_id} não encontrado para empresa ${company_id}`)
  }

  // 🔹 Busca a pasta principal na nuvem
  const parent = await sendSearchFile(directoryParent.path, cloud_number)
  if (!parent?.length) {
    console.log('erro 155454 downloadImage pasta nao encontrada', {
      fileName,
      typebook_id,
      company_id,
      cloud_number,
      path: directoryParent.path,
      parent: safeDriveSearchLog(parent),
    })
    throw new Error(`Pasta ${directoryParent.path} não encontrada na nuvem`)
  }

  // 🔹 Busca o arquivo dentro da pasta principal
  const extension = path.extname(fileName)
  const fileId = await sendSearchFile(fileName, cloud_number, parent[0].id)

  if (!fileId?.length) {
    throw new Error(`Arquivo ${fileName} não encontrado na pasta ${directoryParent.path}`)
  }

  // 🔹 Faz o download do arquivo
  const download = await sendDownloadFile(fileId[0].id, extension, cloud_number)
  return download
}


//******************************************************************************************** */
// ✅ NOVA função pequena: garante o id da pasta no Drive sem usar sleep e sem re-buscar

async function ensureDriveFolder(path: string, cloud_number: number, companies_id: number): Promise<string> {
  // 1) tenta achar
  const found = await sendSearchFile(path, cloud_number) // ideal: pageSize=1, fields='files(id,name,parents)'
  if (found && found[0]?.id) return found[0].id

  // 2) não achou → pega pasta da empresa (raiz) e cria
  const company = await Company.findByOrFail('id', companies_id)
  const roots = await sendSearchFile(company.foldername, cloud_number) // idem: limitar fields/pageSize
  const parentCompanyId = roots?.[0]?.id
  if (!parentCompanyId) {
    console.log('erro 155454 ensureDriveFolder pasta raiz nao encontrada', {
      path,
      cloud_number,
      companies_id,
      company_foldername: company.foldername,
      found: safeDriveSearchLog(found),
      roots: safeDriveSearchLog(roots),
    })
    throw new BadRequestException('company root folder not found in Google Drive', 404)
  }

  // 3) cria e usa o id retornado (sem buscar de novo, sem sleep)
  const created = await sendCreateFolder(path, cloud_number, parentCompanyId)
  const createdId = created?.id ?? created?.[0]?.id // dependendo de como sua função retorna
  if (!createdId) {
    throw new BadRequestException('failed to create folder on Google Drive', 500)
  }
  return createdId
}

async function transformFilesNameToId(images, params, companies_id, cloud_number: number, capture = false, dataImages = {}) {
  // **PASTAS LOCAIS** (idempotente e sem sync)
  try {
    const uploadsBasePath = Application.tmpPath('uploads')
    const folderPath = Application.tmpPath(`/uploads/Client_${companies_id}`)
    await fsp.mkdir(uploadsBasePath, { recursive: true })
    await fsp.mkdir(folderPath, { recursive: true })
  } catch (error) {
    throw new BadRequestException('could not create client directory', 409, error)
  }

  // Valida o "directoryParent"
  const directoryParent = await Typebook.query()
    .where('id', params.typebooks_id)
    .andWhere('companies_id', companies_id)
    .first()

  if (!directoryParent) throw new BadRequestException('undefined book', 409)

  // ✅ pega (ou cria) a pasta alvo no Drive e obtém o id sem sleep e sem re-buscar
  const parentId = await ensureDriveFolder(directoryParent.path, cloud_number, companies_id)

  // **imagem única (capture)**
  if (capture) {
    const validateFileRename = await fileRename(images, params.typebooks_id, companies_id, {}, true)
    if (isInvalidFileRename(validateFileRename)) {
      throwInvalidFiles([normalizeInvalidFileRename(images, validateFileRename)])
    }

    const _fileRename = await fileRename(images, params.typebooks_id, companies_id)
    if (isInvalidFileRename(_fileRename)) {
      throwInvalidFiles([normalizeInvalidFileRename(images, _fileRename)])
    }

    try {
      // IMPORTANTE: `await` aqui já garante que o upload terminou no Google
      await pushImageToGoogle(images, Application.tmpPath(`/uploads/Client_${companies_id}`), _fileRename, parentId, cloud_number, true)
      return images
    } catch (error) {
      console.log(error)
      return error
    }
  }

  // **lote**
  const result: Object[] = []
  const validImages: any[] = []
  const invalidFiles: any[] = []

  for (const image of images) {
    if (!image) continue
    if (!image.isValid) {
      console.log("Error", image.errors)
      continue
    }

    const validateFileRename = await fileRename(image.clientName, params.typebooks_id, companies_id, dataImages, true)
    if (isInvalidFileRename(validateFileRename)) {
      invalidFiles.push(normalizeInvalidFileRename(image.clientName, validateFileRename))
      continue
    }

    validImages.push(image)
  }

  if (invalidFiles.length > 0) {
    throwInvalidFiles(invalidFiles)
  }

  for (const image of validImages) {
    const _fileRename = await fileRename(image['clientName'], params.typebooks_id, companies_id, dataImages)
    if (isInvalidFileRename(_fileRename)) {
      throwInvalidFiles([normalizeInvalidFileRename(image['clientName'], _fileRename)])
    }

    try {
      // ✅ `await` garante que cada upload terminou; não precisa de sleep entre eles
      const r = await pushImageToGoogle(
        image,
        Application.tmpPath(`/uploads/Client_${companies_id}`),
        _fileRename,
        parentId,
        cloud_number
      )
      result.push(r)
    } catch (error) {
      throw new BadRequestException(error + 'pushImageToGoogle', 409)
    } finally {

    }
  }

  return result

}

async function validateFilesNameToId(fileNames, params, companies_id, dataImages = {}) {
  const invalidFiles: any[] = []
  const names = Array.isArray(fileNames) ? fileNames : fileNames ? [fileNames] : []

  for (const fileName of names) {
    const validateFileRename = await fileRename(fileName, params.typebooks_id, companies_id, dataImages, true)

    if (isInvalidFileRename(validateFileRename)) {
      invalidFiles.push(normalizeInvalidFileRename(fileName, validateFileRename))
    }
  }

  if (invalidFiles.length > 0) {
    throwInvalidFiles(invalidFiles)
  }

  return { valid: true }
}



async function renameFileGoogle(filename, folderPath, newTitle, cloud_number: number, driveFileId = null) {
  try {
    if (driveFileId) {
      await sendRenameFile(driveFileId, newTitle, cloud_number)
      return true
    }

    const idFolderPath = await sendSearchFile(folderPath, cloud_number)
    if (!idFolderPath?.[0]?.id) return false

    const idFile = await sendSearchFile(filename, cloud_number, idFolderPath[0].id)
    if (!idFile?.[0]?.id) return false

    await sendRenameFile(idFile[0].id, newTitle, cloud_number)
    return true
  } catch (error) {
    return false
  }
}

function enqueuePendingRenameProcessing(companiesId, typebooksId) {
  if (!companiesId || !typebooksId) return

  const queueKey = `${companiesId}:${typebooksId}`
  const currentRounds = pendingRenameQueue.get(queueKey) || 0
  pendingRenameQueue.set(
    queueKey,
    Math.min(currentRounds + 1, maxPendingRenameRoundsByTypebook)
  )

  schedulePendingRenameProcessing()
}

function schedulePendingRenameProcessing() {
  if (pendingRenameTimer || isPendingRenameQueueRunning) return

  pendingRenameTimer = setTimeout(() => {
    pendingRenameTimer = null
    processPendingRenameQueue()
  }, pendingRenameDelayMs)
}

async function processPendingRenameQueue() {
  if (isPendingRenameQueueRunning) return

  isPendingRenameQueueRunning = true

  try {
    while (pendingRenameQueue.size > 0) {
      const queueKey = pendingRenameQueue.keys().next().value
      const rounds = pendingRenameQueue.get(queueKey) || 1

      if (rounds <= 1) {
        pendingRenameQueue.delete(queueKey)
      } else {
        pendingRenameQueue.set(queueKey, rounds - 1)
      }

      const [companiesId, typebooksId] = queueKey.split(':').map(Number)
      await processPendingRenameBatch(companiesId, typebooksId)
      await sleep(pendingRenameDelayMs)
    }
  } catch (error) {
    console.error('Erro ao processar fila de renomeação de imagens:', error)
  } finally {
    isPendingRenameQueueRunning = false

    if (pendingRenameQueue.size > 0) {
      schedulePendingRenameProcessing()
    }
  }
}

async function processPendingRenameBatch(companiesId, typebooksId) {
  const typebook = await Typebook.query()
    .preload('company')
    .where('companies_id', companiesId)
    .andWhere('id', typebooksId)
    .first()

  if (!typebook?.path || !typebook.company?.cloud) return

  const pendingImages = await Indeximage.query()
    .where('companies_id', companiesId)
    .andWhere('typebooks_id', typebooksId)
    .whereNotNull('previous_file_name')
    .orderBy('updated_at', 'desc')
    .limit(pendingRenameBatchSize)

  for (const image of pendingImages) {
    if (!image.file_name || !image.previous_file_name) continue

    const fileWasRenamed = await renameFileGoogle(
      image.file_name,
      typebook.path,
      image.previous_file_name,
      typebook.company.cloud,
      image.drive_file_id
    )

    if (!fileWasRenamed) continue

    await Indeximage.query()
      .where('companies_id', companiesId)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('bookrecords_id', image.bookrecords_id)
      .andWhere('seq', image.seq)
      .andWhere('file_name', image.file_name)
      .update({
        file_name: image.previous_file_name,
        previous_file_name: null,
      })
  }
}


async function pushImageToGoogle(image, folderPath, objfileRename, idParent, cloud_number, capture = false) {

  try {
    let localFilePath = path.join(folderPath, objfileRename.file_name)

    //copia o arquivo para servidor
    if (capture) {
      localFilePath = path.join(path.dirname(image), objfileRename.file_name)
      await fsp.rename(image, localFilePath)
    }
    else {
      const newPath = path.join(folderPath, objfileRename.file_name)//`${folderPath}/${objfileRename.file_name}`

      await image.move(folderPath, { name: objfileRename.file_name, overwrite: true })
      if (image.subtype.toLowerCase() === 'pdf') {
        const returnPathFile = await PdfOptimizer.compressIfScanned(`${folderPath}/${objfileRename.file_name}`)
        fs.renameSync(returnPathFile, newPath);
      }
      //UTILIZA A FUNÇÃO EM PYTHON PARA MELHORAR IMAGEM
      //else
      //   if (image.type == 'image') {
      //     console.log("Entrei no image 1$$$$")
      //     const returnPathFile = await processImage(`${folderPath}/${objfileRename.file_name}`)
      //     console.log("Entrei no image 2$$$$")
      //     console.log('é imagem', returnPathFile)
      //     fs.renameSync(returnPathFile, newPath)
      //   }

    }

    const localMetadata = await getLocalFileMetadata(localFilePath)
    const duplicateIndeximage = await findDuplicateIndeximage(
      objfileRename.companies_id,
      objfileRename.typebooks_id,
      objfileRename.bookrecords_id,
      idParent,
      localMetadata.md5Checksum,
      localMetadata.size
    )

    if (duplicateIndeximage) {
      await deleteImage(localFilePath)

      return {
        ...getUploadReportItem(objfileRename, image, idParent),
        uploaded: false,
        skipped: true,
        reason: 'duplicate_file',
        message: 'Arquivo já enviado anteriormente para esta pasta.',
        drive_file_size: localMetadata.size,
        drive_md5_checksum: localMetadata.md5Checksum,
        drive_folder_id: idParent,
        duplicate: {
          file_name: duplicateIndeximage.file_name,
          drive_file_id: duplicateIndeximage.drive_file_id,
          same_name: duplicateIndeximage.file_name === objfileRename.file_name,
        },
      }
    }

    //FAZ O TRATAMENTO DA IMAGEM ANTES DE ENVIAR PARA O GDRIVE
    // const fullPathFileInput = path.join(folderPath, objfileRename.file_name)
    // await imageProcessing(fullPathFileInput)
    //copia o arquivo para o googledrive
    const sendUpload = await sendUploadFiles(idParent, folderPath, `${objfileRename.file_name}`, cloud_number)

    if (sendUpload.status !== 200) {
      delete objfileRename.date_atualization
      await ErrorlogImage.create(objfileRename)
      throw new BadRequestException('Falha ao enviar arquivo para o Google Drive', 409)
    }

    const driveFileSize = sendUpload.data?.size ? Number(sendUpload.data.size) : localMetadata.size
    const driveMd5Checksum = sendUpload.data?.md5Checksum || localMetadata.md5Checksum
    const driveFolderId = Array.isArray(sendUpload.data?.parents) && sendUpload.data.parents.length
      ? sendUpload.data.parents[0]
      : idParent

    if (sendUpload.data?.md5Checksum && sendUpload.data.md5Checksum !== localMetadata.md5Checksum) {
      throw new BadRequestException('Checksum retornado pelo Google Drive diferente do arquivo enviado', 409)
    }

    if (sendUpload.data?.size && Number(sendUpload.data.size) !== localMetadata.size) {
      throw new BadRequestException('Tamanho retornado pelo Google Drive diferente do arquivo enviado', 409)
    }

    //chamar função para inserir na tabela indeximages
    if (!objfileRename.typeBookFile || objfileRename.typeBookFile == false) {
      objfileRename.drive_file_id = sendUpload.data?.id || null
      objfileRename.drive_file_size = driveFileSize
      objfileRename.drive_md5_checksum = driveMd5Checksum
      objfileRename.drive_folder_id = driveFolderId
      const date_atualization = DateTime.now()
      objfileRename.date_atualization = date_atualization.toFormat('yyyy-MM-dd HH:mm')
      await Indeximage.create(objfileRename)
    }

    //chamar função de exclusão da imagem
    await deleteImage(`${folderPath}/${objfileRename.file_name}`)
  } catch (error) {
    throw new BadRequestException(error + ' sendUploadFiles', 409)
  }
  return {
    ...getUploadReportItem(objfileRename, image, idParent),
    uploaded: true,
    skipped: false,
    drive_file_id: objfileRename.drive_file_id || null,
    drive_file_size: objfileRename.drive_file_size || null,
    drive_md5_checksum: objfileRename.drive_md5_checksum || null,
    drive_folder_id: objfileRename.drive_folder_id || idParent,
  }

}

async function fileRename(originalFileName: string, typebooks_id, companies_id, dataImages: any = {}, validateOnly = false) {
  let objFileName
  let separators
  let arrayFileName
  let isCreateBookrecord = false
  let isCreateCover = false
  let matchedFilePattern = ''
  //Format L1(1).jpg = Livro 1 e Código 1
  const regexBookAndCod = /^L\d+\(\d+\).*$/;
  //Formato L1_1_F.jpg = Livro 1, Folha 1 e Lado Frente
  const regexBookSheetSide = /^L\d+_\d+_[FV].*/;
  //Format T123(123)livro.jpg
  const regexBookAndTerm = /^T\d+\(\d+\)(.*?)\.\w+$/;
  //Format P1(123)obs.jpg para prot do Documents
  const regexDocumentAndProt = /^P(\d+)\((\d+)\)(.*?)(?:\.[^.]+)?$/i; ///^P\d+\(\d+\).*$/;
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

    if (!fileName) {
      return invalidFileRename(
        originalFileName,
        'Dados insuficientes para nomear arquivo do tipo informado.'
      )
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
      matchedFilePattern = 'book_cover'
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
      matchedFilePattern = 'book_sheet_side_insert'
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
      matchedFilePattern = 'book_cod'
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
      matchedFilePattern = 'book_sheet_side'
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
      matchedFilePattern = 'id'
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
      matchedFilePattern = 'book_term'
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
      matchedFilePattern = 'document_prot'
      const match = originalFileName.match(regexDocumentAndProt);
      if (match) {
        objFileName = {
          book: match[1],  // número após o P → 1
          prot: match[2],  // número entre parênteses → 11
          obs: match[3]?.trim() || null, // texto entre parênteses e extensão → "teste teste"
          ext: path.extname(originalFileName).toLowerCase(), // extensão → ".jpg"
        };
      }

      query.andWhere('book', objFileName.book)
      query.whereHas('document', q => {
        q.where('documents.prot', objFileName.prot)
      })
      isCreateBookrecord = true
      break
    }

    default: {
      if (!hasDataImageLookup(dataImages)) {
        return invalidFileRename(
          originalFileName,
          'Formato não aceito.'
        )
      }

      matchedFilePattern = 'data_images'
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

    //console.log("passei aqui dentro do DOCUMENT###", query.toQuery())
    let bookRecord = await query.first()
    let seq = 0
    // *****************************************************************
    if (bookRecord === null || isCreateCover) {
      if (isCreateBookrecord || isCreateCover) {
        if (validateOnly) {
          const book = await Typebook.query()
            .where('companies_id', companies_id)
            .andWhere('id', typebooks_id)
            .first()

          if (!book) {
            return invalidFileRename(originalFileName, 'Tipo de livro não encontrado para criação do bookrecord.')
          }

          return { file_name: originalFileName }
        }

        try {
          const query = Typebook.query()
            .where('companies_id', companies_id)
            .andWhere('id', typebooks_id)//.first()
          const book = await query.first()
          if (!book) {
            return invalidFileRename(originalFileName, 'Tipo de livro não encontrado para criação do bookrecord.')
          }

          const query2 = Bookrecord.query()
            .where('typebooks_id', typebooks_id)
            .andWhere('companies_id', companies_id)
            .max('cod as max_cod')//.first()

          const bookRecordFind = await query2.first()
          const { ext, prot, obs, ...objFileNameWithoutExt } = objFileName
          const objectInsert = {
            books_id: book.books_id,
            typebooks_id: typebooks_id,
            companies_id: companies_id,
            cod: bookRecordFind?.$extras.max_cod + 1,
            ...objFileNameWithoutExt
          }
          bookRecord = await Bookrecord.create(objectInsert)

          //if prot exist then generate the document row
          //if (prot)
          await Document.create({
            bookrecords_id: bookRecord.id,
            typebooks_id: bookRecord.typebooks_id,
            books_id: bookRecord.books_id,
            companies_id: bookRecord.companies_id,
            prot: prot == 0 ? null : prot,
            obs
          })

          seq = 1

        } catch (error) {
          console.log("!!!!!!!", error)
          return invalidFileRename(originalFileName, 'Não foi possível criar o bookrecord para este arquivo.')
        }
      } else {
        return invalidFileRename(originalFileName, getBookRecordNotFoundReason(objFileName, matchedFilePattern))
      }
    } else {
      if (validateOnly) {
        return { file_name: originalFileName }
      }

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

async function mountNameFile(bookRecord: Bookrecord, seq: number, extFile: string) {
  return mountNameFileWithTimestamp(bookRecord, seq, extFile)
}

function getStableFileTimestamp(fileName: string, fallbackDate?: DateTime | null) {
  const timestamp = path.basename(fileName || '').match(/_(\d{8,14})(?=\.[^.]+$)/)?.[1]
  if (timestamp) return timestamp

  if (fallbackDate?.isValid) return fallbackDate.toFormat('yyyyMMddHHmm')

  return DateTime.now().toFormat('yyyyMMddHHmm')
}

async function mountNameFileWithTimestamp(bookRecord: Bookrecord, seq: number, extFile: string, fileTimestamp?: string) {
  //Id{id}_{seq}({cod})_{typebook_id}_{book}_{sheet}_{approximate_term}_{side}_{books_id}.{extensão}
  //Id{nasc_id}_{seq}({termo})_{livrotipo_reg}_{livro}_{folha}_{termoNovo}_{lado}_{tabarqbin.tabarqbin_reg}_{indice}_{anotacao}_{letra}_{ano}_{data do arquivo}{extensão}
  if (!extFile.startsWith('.'))
    extFile = path.extname(extFile).toLowerCase()
  const dateFile = fileTimestamp || DateTime.now().toFormat('yyyyMMddHHmm')
  return `Id${bookRecord.id}_${seq}(${bookRecord.cod})_${bookRecord.typebooks_id}_${bookRecord.book}_${!bookRecord.sheet || bookRecord.sheet == null ? "" : bookRecord.sheet}_${!bookRecord.approximate_term || bookRecord.approximate_term == null ? '' : bookRecord.approximate_term}_${!bookRecord.side || bookRecord.side == null ? '' : bookRecord.side}_${bookRecord.books_id}_${!bookRecord.indexbook || bookRecord.indexbook == null ? '' : bookRecord.indexbook}_${!bookRecord.obs || bookRecord.obs == null ? '' : bookRecord.obs}_${!bookRecord.letter || bookRecord.letter == null ? '' : bookRecord.letter}_${!bookRecord.year || bookRecord.year == null ? '' : bookRecord.year}_${dateFile}${extFile.toLowerCase()}`
}

async function deleteFile(listFiles: any[], cloud_number: number) {
  try {
    if (!Array.isArray(listFiles) || listFiles.length === 0) {
      return "nenhum arquivo para excluir"
    }

    if (listFiles.length > maxGoogleDriveDeleteBatchSize) {
      throw new Error(`Exclusão em massa bloqueada no Google Drive: ${listFiles.length} arquivos`)
    }

    const idFolder = await sendSearchFile(listFiles[0]['path'], cloud_number)
    if (!idFolder?.[0]?.id) {
      throw new Error('Pasta Google Drive não encontrada para exclusão')
    }

    let idFile
    for (const file of listFiles) {
      idFile = await sendSearchFile(file['file_name'], cloud_number, idFolder[0].id)
      if (!idFile?.[0]?.id) continue
      await sendDeleteFile(idFile[0].id, cloud_number)
    }
    return "excluido!!!"
  } catch (error) {
    throw error
  }
}

async function updateFileName(bookRecord: Bookrecord, schedulePendingRename = true) {
  try {
    const _indexImage = await Indeximage.query()
      .preload('typebooks', (query) => {
        query.where('id', bookRecord.typebooks_id)
          .andWhere('companies_id', bookRecord.companies_id)
      })
      .where('indeximages.bookrecords_id', bookRecord.id)
      .andWhere('indeximages.typebooks_id', bookRecord.typebooks_id)
      .andWhere('indeximages.companies_id', bookRecord.companies_id)
    let hasPendingRename = false
    if (_indexImage.length > 0) {
      for (const data of _indexImage) {
        const fileTimestamp = getStableFileTimestamp(data.file_name, data.date_atualization || data.createdAt)
        const newFileName = await mountNameFileWithTimestamp(bookRecord, data?.seq, data.file_name, fileTimestamp)
        await Indeximage.query()
          .where('bookrecords_id', '=', data.bookrecords_id)
          .andWhere('typebooks_id', '=', data.typebooks_id)
          .andWhere('companies_id', '=', data.companies_id)
          .andWhere('seq', '=', data.seq)
          .update({ previous_file_name: newFileName })
        hasPendingRename = true
      }
    }

    if (hasPendingRename && schedulePendingRename) {
      enqueuePendingRenameProcessing(bookRecord.companies_id, bookRecord.typebooks_id)
    }

  } catch (error) {
    throw error
  }


}

async function totalFilesInFolder(folderName, cloud_number: number, book=[]) {
  try {
    const idFolder = await sendSearchFile(folderName, cloud_number)
    const listFiles = await sendListAllFiles(cloud_number, idFolder, book)
    if (listFiles) {
      return listFiles
    }
    else return 0
  } catch (error) {
    return 0
  }
}
//**************************************************** */

// async function indeximagesinitial(folderName, companies_id, cloud_number, listFilesImages = []) {

//   let listFiles
//   if (listFilesImages.length > 0) {
//     listFiles = listFilesImages
//   } else {
//     listFiles = await totalFilesInFolder(folderName?.path, cloud_number)
//   }
//   listFiles = listFiles.filter(item => item.startsWith("Id" || "id" || "ID"))
//   //Id{nasc_id}_{seq}({termo})_{livrotipo_reg}_{livro}_{folha}_{termoNovo}_{lado}_{tabarqbin.tabarqbin_reg}_{indice}_{anotacao}_{letra}_{ano}_{data do arquivo}{extensão}
//   const objlistFilesBookRecord = listFiles.map((file) => {
//     const fileSplit = file.split("_")
//     const id = fileSplit[0].match(/\d+/g)[0];
//     const typebooks_id = fileSplit[2]
//     const books_id = fileSplit[7].match(/\d+/g)[0];
//     const cod = fileSplit[1].match(/\((\d+)\)/)[0].replace(/\(|\)/g, '');
//     const book = fileSplit[3] == '' ? null : fileSplit[3]
//     const sheet = fileSplit[4] == '' ? null : fileSplit[4]
//     const side = fileSplit[6]
//     const approximate_term = fileSplit[5]
//     const indexbook = fileSplit[8] == '' ? null : fileSplit[8]
//     const obs = fileSplit[9]
//     const letter = fileSplit[10]
//     const year = fileSplit[11]
//     //para documentos
//     const yeardoc = fileSplit[4] == '' ? null : fileSplit[4] //documentos
//     const month = fileSplit[6] //documentos

//     return {
//       id, typebooks_id, books_id, companies_id, cod, book, sheet, side,
//       approximate_term, indexbook, obs, letter, year, yeardoc, month
//     }

//   });


//   const indexImages = listFiles.map((file) => {
//     const fileSplit = file.split("_")
//     const bookrecords_id = fileSplit[0].match(/\d+/g)[0];
//     const typebooks_id = fileSplit[2]
//     const seq = fileSplit[1].match(/^(\d+)/)[0];
//     const ext = path.extname(file);

//     return {
//       bookrecords_id, typebooks_id, companies_id, seq,
//       ext, file_name: file, previous_file_name: file
//     }
//   });

//   const uniqueIds = {};
//   const bookRecord = objlistFilesBookRecord.filter(obj => {
//     if (!uniqueIds[obj.id]) {
//       uniqueIds[obj.id] = true;
//       return true;
//     }
//     return false;
//   });



//   bookRecord.sort((a, b) => a.id - b.id);
//   indexImages.sort((a, b) => a.id - b.id);

//   return { bookRecord, indexImages }


// }
//import path from 'path'

async function indeximagesinitial(folderName, companies_id, cloud_number, listFilesImages = [], book=[]) {
  console.log("@@PASSO 66.1")
  let listFiles = []

  if (Array.isArray(listFilesImages) && listFilesImages.length > 0) {
    console.log("@@PASSO 66.2##")
    listFiles = listFilesImages
  } else {
    console.log("@@PASSO 66.3##")
    listFiles = await totalFilesInFolder(folderName?.path, cloud_number, book)
  }

  console.log("@@PASSO 66.2")

  const bookRecord = []
  const indexImages = []
  const uniqueIds = new Set()


  console.log("@@PASSO 66.3")

  for (const file of listFiles) {
    console.log("@@PASSO 66.4")
    if (!/^id/i.test(file)) continue

    const fileSplit = file.split('_')
    if (!fileSplit || fileSplit.length < 12) continue

    const idMatch = fileSplit[0]?.match(/\d+/g)
    const codMatch = fileSplit[1]?.match(/\((\d+)\)/)
    const seqMatch = fileSplit[1]?.match(/^(\d+)/)

    if (!idMatch || !idMatch[0] || !seqMatch || !seqMatch[0]) continue

    const id = idMatch[0]
    const typebooks_id = fileSplit[2]
    const bookrecords_id = id
    const seq = seqMatch[0]
    const ext = path.extname(file)

    const booksMatch = fileSplit[7]?.match(/\d+/g)
    const books_id = booksMatch && booksMatch[0] ? booksMatch[0] : null
    const cod = codMatch && codMatch[1] ? codMatch[1] : null
    const book = fileSplit[3] === '' ? null : fileSplit[3]
    const sheet = fileSplit[4] === '' ? null : fileSplit[4]
    const side = fileSplit[6] || null
    const approximate_term = fileSplit[5] === '' ? null : fileSplit[5]
    const indexbook = fileSplit[8] === '' ? null : fileSplit[8]
    const obs = fileSplit[9] === '' ? null : fileSplit[9]
    const letter = fileSplit[10] === '' ? null : fileSplit[10]
    const year = fileSplit[11] === '' ? null : fileSplit[11]

    const yeardoc = fileSplit[4] === '' ? null : fileSplit[4]
    const month = fileSplit[6] === '' ? null : fileSplit[6]

    if (!uniqueIds.has(id)) {
      uniqueIds.add(id)

      bookRecord.push({
        id,
        typebooks_id,
        books_id,
        companies_id,
        cod,
        book,
        sheet,
        side,
        approximate_term,
        indexbook,
        obs,
        letter,
        year,
        yeardoc,
        month,
      })
    }

    indexImages.push({
      bookrecords_id,
      typebooks_id,
      companies_id,
      seq,
      ext,
      file_name: file,
      previous_file_name: file,
    })
  }

  bookRecord.sort((a, b) => Number(a.id) - Number(b.id))
  indexImages.sort((a, b) => {
    const idDiff = Number(a.bookrecords_id) - Number(b.bookrecords_id)
    if (idDiff !== 0) return idDiff
    return Number(a.seq) - Number(b.seq)
  })

  console.log("@@PASSO 66.5")

  return { bookRecord, indexImages }
}



export { transformFilesNameToId, validateFilesNameToId, downloadImage, fileRename, deleteFile, indeximagesinitial, totalFilesInFolder, renameFileGoogle, mountNameFile, updateFileName }
