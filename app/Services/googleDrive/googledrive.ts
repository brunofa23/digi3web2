import Token from 'App/Models/Token';
import { types } from '@ioc:Adonis/Core/Helpers'
import sharp from 'sharp'

const fs = require('fs')
const { google } = require('googleapis');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableGoogleDriveError(error) {
  const code = error?.code || error?.errno
  const message = error?.message || ''

  return [
    'ERR_STREAM_PREMATURE_CLOSE',
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
  ].includes(code) || message.includes('Premature close') || message.includes('socket hang up')
}

function sanitizeGoogleDriveError(error, message: string | undefined = undefined) {
  const sanitized: any = new Error(message || error?.message || 'Google Drive request failed')
  sanitized.name = error?.name || 'GoogleDriveError'
  sanitized.code = error?.code
  sanitized.errno = error?.errno
  sanitized.status = error?.status || error?.response?.status
  sanitized.type = error?.type
  sanitized.googleAuthTokenError = error?.googleAuthTokenError || false
  sanitized.googleTransportError = error?.googleTransportError || false
  return sanitized
}

function safeGoogleDriveErrorLog(error) {
  return {
    message: error?.message,
    code: error?.code,
    errno: error?.errno,
    type: error?.type,
    errors: error?.errors,
    responseData: error?.response?.data,
  }
}

function configureGoogleAuthClient(client, cloud_number: number) {
  if (!client || client.__digi3TransporterConfigured || !client.transporter?.request) {
    return client
  }

  const transporter = client.transporter
  const originalRequest = transporter.request.bind(transporter)

  transporter.request = function (opts, callback: any = undefined) {
    const runRequest = async () => {
      const url = String(opts?.url || '')
      const isTokenRequest = url.includes('oauth2.googleapis.com/token')
      const method = String(opts?.method || 'GET').toUpperCase()
      const canRetryRequest = isTokenRequest || ['GET', 'HEAD', 'OPTIONS'].includes(method)

      const requestOptions = {
        ...opts,
        headers: {
          ...(opts?.headers || {}),
          'Accept-Encoding': 'identity',
        },
      }

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          return await originalRequest(requestOptions)
        } catch (error) {
          const retry = attempt < 3 && canRetryRequest && isRetryableGoogleDriveError(error)

          console.log('erro 155454 googleDrive request error', {
            cloud_number,
            url,
            method,
            isTokenRequest,
            attempt,
            retry,
            error: safeGoogleDriveErrorLog(error),
          })

          if (!retry) {
            const sanitizedError = sanitizeGoogleDriveError(error)
            sanitizedError.googleAuthTokenError = isTokenRequest
            sanitizedError.googleTransportError = true
            throw sanitizedError
          }

          await sleep(500 * attempt)
        }
      }
    }

    if (callback) {
      runRequest().then((response) => callback(null, response), callback)
      return
    }

    return runRequest()
  }

  client.__digi3TransporterConfigured = true
  return client
}

async function getToken(cloud_number: number) {
  try {
    if (!cloud_number) {
      throw new Error('Empresa sem configuração de cloud')
    }

    //const token = await Token.findBy("name", 'tokenGoogle')
    const token = await Token.findOrFail(cloud_number)
    if (!token.status) {
      throw new Error(`Nuvem Google Drive inativa: ${cloud_number}`)
    }

    if (types.isNull(token?.token) || typeof token.token !== 'string' || token.token.trim() === '') {
      throw new Error('Nuvem sem autorização válida. Reautorize a conta Google.')
    }

    let parsedToken
    try {
      parsedToken = JSON.parse(token.token)
    } catch (error) {
      throw new Error('Token Google Drive inválido. Reautorize a conta Google.')
    }

    if (!parsedToken?.refresh_token) {
      throw new Error('Nuvem sem refresh token válido. Reautorize a conta Google.')
    }

    token.token = parsedToken
    return token
  } catch (error) {
    console.log("erro 1541", error)
    throw error
  }
}

async function loadSavedCredentialsIfExist(cloud_number: number) {
  const tokenNumber = await getToken(cloud_number)
  if (tokenNumber) {
    try {
      return configureGoogleAuthClient(google.auth.fromJSON(tokenNumber.token), cloud_number);
    } catch (err) {
      return null;
    }
  }
}

async function loadSavedCredentialsOrFail(cloud_number: number) {
  const auth = await loadSavedCredentialsIfExist(cloud_number)

  if (!auth) {
    throw new Error('Nuvem sem autorização válida. Reautorize a conta Google.')
  }

  return auth
}

async function validateGoogleDriveConnection(authClient) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  await drive.about.get({
    fields: 'user(emailAddress)'
  })

  return true
}

async function authorize(cloud_number: number) {
  return loadSavedCredentialsOrFail(cloud_number)
}


async function uploadFiles(authClient, parents, folderPath, fileName, mimeType = 'image/jpeg|image/png|image/jpg') {
  const drive = google.drive({ version: 'v3', auth: authClient });
  const parent = [parents]

  // Crie uma instância de ResumableUpload para o arquivo
  const resumableUpload = drive.files.create({
    requestBody: {
      name: fileName,
      parents: parent, // opcional
    },
    media: {
      mimeType,
      body: fs.createReadStream(`${folderPath}/${fileName}`),
    },
    fields: 'id, name, size',
    supportsTeamDrives: true,
    useResumableUpload: true,
  }, {
    onUploadProgress: (event) => {
      const progress = Math.round((event.bytesRead / event.bytesTotal) * 100);
    },
    onError: (err) => {
      console.error(`Ocorreu um erro durante o upload: ${err}`);

      // Verifica se o erro foi causado por uma falha na conexão
      if (err.statusCode === 408) {
        console.log('Tentando reconectar o upload...');
        resumableUpload.start();
      } else {
        console.error('Não é possível reconectar o upload. Erro irreparável.');
      }
    },

  });

  // Inicie o upload
  const response = await resumableUpload;
  return response

}

async function createFolder(authClient, folderName, parentId = undefined) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  var _parentId = []
  if (parentId)
    _parentId = [parentId]
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: _parentId,
  };

  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }

}

async function searchFile(authClient, fileName, parentId = undefined, cloud_number: number | undefined = undefined) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  const files: Object[] = []
  const fileNamedecoded = decodeURIComponent(fileName);
  let query = `name ='${fileNamedecoded}' `
  if (parentId)
    query += ` and parents in '${parentId}'`
  query += " and trashed=false "

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await drive.files.list({
        q: query
      });

      const driveFiles = res.data.files || []
      driveFiles.forEach(function (file) {
        files.push({ name: file.name, id: file.id })
      });
      return driveFiles
    } catch (error) {
      const retry = attempt < 2 && !error?.googleAuthTokenError && !error?.googleTransportError && isRetryableGoogleDriveError(error)

      console.log('erro 155454 googleDrive searchFile error', {
        fileName: fileNamedecoded,
        parentId,
        cloud_number,
        query,
        attempt,
        retry,
        error: safeGoogleDriveErrorLog(error),
      })

      if (!retry) {
        throw sanitizeGoogleDriveError(error)
      }

      await sleep(500)
    }
  }
}

async function deleteFile(authClient, fileId) {
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const request = drive.files.delete({
      'fileId': fileId
    })
    return request
  } catch (error) {
    throw error
  }

}

//RENOMERAR ARQUIVOS**************************************************************** */
async function renameFile(authClient, fileId: String, newTitle: String) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  try {
    const fileMetadata = {
      name: newTitle,
    };
    const updatedFile = await drive.files.update({
      fileId,
      resource: fileMetadata,
    });
    return updatedFile
  } catch (error) {
    console.error('Erro ao renomear o arquivo:', error);
    throw error
  }
}

//******************************************************************* */
async function listFiles(authClient, folderId = "") {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const res = await drive.files.list({
    q: `'${folderId[0].id}' in parents and trashed=false`,
    //pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });

  const files = res.data.files;
  if (files.length === 0) {

    return;
  }

  const listFiles = files.map((file) => {
    return file.name
  });

  return listFiles
}


// async function listAllFiles(authClient, folderId = "", book="") {
//   const drive = google.drive({ version: 'v3', auth: authClient });

//   try {
//     //console.time("valor1")
//     let allItems = [];
//     // Variáveis de controle para paginação
//     let pageToken = null;
//     const pageSize = 100;
//     do {
//       // Solicite a lista de arquivos na pasta com base no token de página atual
//       console.log("PASSO 1533@@")
//       const response = await drive.files.list({
//         q: `'${folderId[0].id}' in parents and trashed=false`,
//         pageSize: pageSize,
//         pageToken: pageToken,
//         fields: 'nextPageToken, files(name)',
//       });
//       // Obtenha os itens da resposta
//       const items = response.data.files;
//       // Adicione os itens à lista principal
//       //allItems = allItems.concat(items);
//       console.log("PASSO 1544@@")
//       allItems.push(...items);
//       // Atualize o token de página para a próxima página (se houver)
//       pageToken = response.data.nextPageToken;
//     } while (pageToken);
//     // Agora, a lista `allItems` contém todos os itens da pasta
//     // Faça o que for necessário com a lista completa

//     const listFiles = []
//     allItems.forEach(item => {
//       listFiles.push(item.name)
//     });

//     return listFiles
//   }
//   catch (error) {
//     //console.error('Erro ao listar os itens:', error);
//   }
// }
async function listAllFiles(authClient, folderId = "", codigos = []) {
  const drive = google.drive({ version: "v3", auth: authClient });

  try {
    let pageToken = null;
    const pageSize = 100;
    const listFiles = [];

    const folder = folderId[0].id;

    let query = `'${folder}' in parents and trashed=false`;

    if (Array.isArray(codigos) && codigos.length > 0) {
      const filtros = codigos
        .filter(c => c !== null && c !== undefined && c !== "")
        .map(c => `name contains '_${String(c).replace(/'/g, "\\'")}_'`);

      if (filtros.length > 0) {
        query += ` and (${filtros.join(" or ")})`;
      }
    }

    do {
      const response = await drive.files.list({
        q: query,
        pageSize,
        pageToken,
        fields: "nextPageToken, files(name)",
      });

      const items = response.data.files || [];

      for (const item of items) {
        listFiles.push(item.name);
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    return listFiles;
  } catch (error) {
    console.error("Erro ao listar os itens:", error);
    return [];
  }
}

async function listAllFilesMetadata(authClient, folderId = "", codigos = []) {
  const drive = google.drive({ version: "v3", auth: authClient });

  try {
    let pageToken = null;
    const pageSize = 100;
    const listFiles = [];
    const folder = folderId[0].id;

    let query = `'${folder}' in parents and trashed=false`;

    if (Array.isArray(codigos) && codigos.length > 0) {
      const filtros = codigos
        .filter(c => c !== null && c !== undefined && c !== "")
        .map(c => `name contains '_${String(c).replace(/'/g, "\\'")}_'`);

      if (filtros.length > 0) {
        query += ` and (${filtros.join(" or ")})`;
      }
    }

    do {
      const response = await drive.files.list({
        q: query,
        pageSize,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType)",
      });

      const items = response.data.files || [];

      for (const item of items) {
        listFiles.push({
          id: item.id,
          name: item.name,
          mimeType: item.mimeType,
        });
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    return listFiles;
  } catch (error) {
    console.error("Erro ao listar os itens com metadados:", error);
    return [];
  }
}



async function downloadFile(authClient, fileId, extension) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  try {
    const file = await drive.files.get({
      fileId: fileId,
      //mimeType: 'application/pdf',
      alt: 'media',
    },
      {
        responseType: 'arraybuffer',
        encoding: null
      }

    );

    const normalizedExtension = String(extension || '').toLowerCase()
    let fileBuffer = Buffer.from(file.data)
    let imageType

    if (normalizedExtension === ".tif" || normalizedExtension === ".tiff") {
      fileBuffer = await sharp(fileBuffer).png().toBuffer()
      imageType = "image/png"
    } else if ([".jpeg", ".jpg", ".gif", ".bmp", ".png", ".jfif", ".webp"].includes(normalizedExtension)) {
      imageType = file.headers['content-type'];
    } else if (normalizedExtension == ".pdf") {
      imageType = "application/pdf"
    } else {
      imageType = file.headers['content-type'] || 'application/octet-stream'
    }

    const base64 = fileBuffer.toString("base64")
    var dataURI = 'data:' + imageType + ';base64,' + base64;
    const fileDownload = { dataURI, size: fileBuffer.length }
    return fileDownload
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

async function downloadFileBuffer(authClient, fileId) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const file = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(file.data);
}

//****************************************************************** */
//****************************************************************** */
async function sendAuthorize(cloud_number: number) {
  await authorize(cloud_number)
  return true
}

async function sendValidateConnection(cloud_number: number) {
  const auth = await loadSavedCredentialsOrFail(cloud_number)

  try {
    await validateGoogleDriveConnection(auth)
    return true
  } catch (error) {
    const googleError = error?.response?.data?.error || error?.code

    if (googleError === 'invalid_grant' || error?.googleAuthTokenError) {
      throw new Error('Autorização Google inválida ou expirada. Reautorize a conta Google.')
    }

    throw sanitizeGoogleDriveError(error, 'Não foi possível validar a conexão com o Google Drive.')
  }
}

async function sendListFiles(cloud_number: number, folderId = "") {
  //authorize().then(listFiles(folderId)).catch(console.error);
  const auth = await authorize(cloud_number)
  return listFiles(auth, folderId)

}

async function sendListAllFiles(cloud_number: number, folderId = "", book = []) {
  //authorize().then(listFiles(folderId)).catch(console.error);
  const auth = await authorize(cloud_number)
  return listAllFiles(auth, folderId, book)

}

async function sendListAllFilesMetadata(cloud_number: number, folderId = "", book = []) {
  const auth = await authorize(cloud_number)
  return listAllFilesMetadata(auth, folderId, book)
}

async function sendUploadFiles(parent, folderPath, fileName, cloud_number: number, mimeType = undefined) {
  const auth = await authorize(cloud_number)
  const response = uploadFiles(auth, parent, folderPath, fileName, mimeType)
  return response
}

// async function sendCreateFolder(folderName, cloud_number: number, parentId = undefined,) {
//   const auth = await authorize(cloud_number)
//   const id = createFolder(auth, folderName.trim(), parentId)
//   return id
// }

async function sendCreateFolder(folderName, cloud_number: number, parentId = undefined) {
  const auth = await authorize(cloud_number)

  // 1) tenta achar algo com esse nome (mantendo o mesmo search que você já usa)
  const found = await searchFile(auth, folderName.trim(), parentId)

  // Se achou, retorna o id do primeiro resultado
  if (Array.isArray(found) && found.length > 0 && found[0]?.id) {
    return found[0].id
  }

  // 2) se não achou, cria e retorna o id (mesmo comportamento anterior)
  const id = await createFolder(auth, folderName.trim(), parentId)
  return id
}


async function sendSearchFile(fileName, cloud_number: number, parentId = undefined) {
  const auth = await authorize(cloud_number)
  return searchFile(auth, fileName, parentId, cloud_number)
}

async function sendDeleteFile(fileId, cloud_number: number) {
  if (!cloud_number) {
    throw new Error('Empresa sem configuração de cloud')
  }

  if (!fileId || typeof fileId !== 'string') {
    throw new Error('Arquivo Google Drive inválido para exclusão')
  }

  const auth = await authorize(cloud_number)
  return deleteFile(auth, fileId)
}

async function sendSearchOrCreateFolder(folderName, cloud_number: number, parent = undefined) {

  const auth = await authorize(cloud_number)
  let findFolder = await searchFile(auth, folderName)
  if (findFolder.length > 0)
    return findFolder
  else {
    await createFolder(auth, folderName)
    findFolder = await searchFile(auth, folderName)
    return findFolder
  }
}

async function sendDownloadFile(fileId, extension, cloud_number: number) {
  const auth = await authorize(cloud_number)
  return downloadFile(auth, fileId, extension)
}

async function sendDownloadFileBuffer(fileId, cloud_number: number) {
  const auth = await authorize(cloud_number)
  return downloadFileBuffer(auth, fileId)
}

async function sendRenameFile(fileId, newTitle, cloud_number: number) {
  if (!cloud_number) {
    throw new Error('Empresa sem configuração de cloud')
  }

  if (!fileId || typeof fileId !== 'string') {
    throw new Error('Arquivo Google Drive inválido para renomeação')
  }

  if (!newTitle || typeof newTitle !== 'string' || newTitle.trim() === '') {
    throw new Error('Novo nome de arquivo Google Drive inválido')
  }

  const auth = await authorize(cloud_number)
  return renameFile(auth, fileId, newTitle)

}

export { sendListFiles, sendUploadFiles, sendAuthorize, sendValidateConnection, sendCreateFolder, sendSearchFile, sendSearchOrCreateFolder, sendDownloadFile, sendDownloadFileBuffer, sendDeleteFile, sendListAllFiles, sendListAllFilesMetadata, sendRenameFile }
