import Application from '@ioc:Adonis/Core/Application'
import { GoogleApis } from "googleapis";
import { auth } from "googleapis/build/src/apis/file";
import Config from 'App/Models/Config';
import Encryption from '@ioc:Adonis/Core/Encryption'

const fsPromises = require('fs').promises;
const fs = require('fs')

const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { assuredworkloads } = require('googleapis/build/src/apis/assuredworkloads');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = Application.configPath('tokens/token.json')
const CREDENTIALS_PATH = Application.configPath('/credentials/credentials.json')

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function getToken() {
  const config = await Config.query().where("name", '=', 'tokenGoogle').first()
  console.log("valor do token", config?.valuetext)

  let tokenDecryption = new Config()
  tokenDecryption = config
  tokenDecryption.valuetext = "tttttttttt"
  console.log("TOKENDRCRYP", tokenDecryption.valuetext)

  const decryptToken = Encryption.decrypt("z3F45cdqjqTVgsdYvIfcYJ2XVAIvYnfKt0GaU7MecDEwKrzhn-HJYk0y8NStWx2IqALrKl0OvtqT6ir60fwpBNLgEMaFLOoA47pMGCYL1UpkBAaIpGMYOH4MtBnB_YDDCLwH-A8gD9z9N9ps3DOvHk4JlbrqsCtCK_8O7maRcusEUeXHXDZlIVeTOKfwa280jJXd0XquXhuUmyqYX_Bi392TOXa0UG_MRZtpY2Vs6c6D6xSjbcXhxtCsuNBoRjo3t4Xp4N4dPbAahhE0fYFmKLIWVdaq1knyaR9oqsRXKPwCFONzwxlAGaa9sonUhcGhWb2rpc9WOKQhs959uUrB19qM4HkctSFkSlGdwkpQMBP_Y0fAM5Tk5T-Qw1PCu5CA35HUyGR3w0HK3jaYB7oqjS8kRrJjC0JiNisk_ah4XDgnF4u4tzJxbIQUt9_QxFD_.TVdXOFo0WGlKOGJxMnVFUw.xdSEOyPlNRM07Dq3geLhvlFc2-9VYsbY2kQIpvYPxvk")
  //console.log("DESCRYPT>>", decryptToken)
  //config?.valuetext = "teste teste"

  console.log("config abaixo", config)
  return config
}

async function loadSavedCredentialsIfExist() {
  const tokenNumber = await getToken()

  if (tokenNumber) {
    try {
      return google.auth.fromJSON(JSON.parse(tokenNumber.valuetext));
    } catch (err) {
      return null;
    }
  }
}

// async function loadSavedCredentialsIfExist() {
//   try {
//     const content = await fsPromises.readFile(TOKEN_PATH);
//     const credentials = JSON.parse(content);
//     return google.auth.fromJSON(credentials);
//   } catch (err) {
//     return null;
//   }
// }

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */

async function saveCredentials(client) {

  const content = await fsPromises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });


  await fsPromises.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function uploadFiles(authClient, parents, folderPath, fileName) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  const parent = [parents]

  // Crie uma instância de ResumableUpload para o arquivo
  const resumableUpload = drive.files.create({
    requestBody: {
      name: fileName,
      parents: parent, // opcional
    },
    media: {
      mimeType: 'image/jpeg|image/png|image/jpg',
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
  console.log(`Arquivo carregado com sucesso! ID do arquivo: ${response.data.id}`);

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

async function searchFile(authClient, fileName, parentId = undefined) {

  const drive = google.drive({ version: 'v3', auth: authClient });
  const files: Object[] = []
  const fileNamedecoded = decodeURIComponent(fileName);
  let query = `name ='${fileNamedecoded}' `
  if (parentId)
    query += ` and parents in '${parentId}'`
  query += " and trashed=false "


  try {
    const res = await drive.files.list({
      q: query
    });

    Array.prototype.push.apply(files, res.files);
    res.data.files.forEach(function (file) {
      files.push({ name: file.name, id: file.id })
      console.log('Found file:', file.name, file.id);
    });
    return res.data.files
  } catch (error) {
    return error;
  }
}

async function deleteFile(authClient, fileId) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  const request = drive.files.delete({
    'fileId': fileId
  })
  return request
}


async function listFiles(authClient, folderId = "") {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const res = await drive.files.list({
    q: `'${folderId[0].id}' in parents and trashed=false`,
    //pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });

  const files = res.data.files;
  if (files.length === 0) {
    //console.log('No files found.');
    return;
  }
  //console.log('Files:');
  const listFiles = files.map((file) => {
    return file.name
  });

  return listFiles
}


async function listAllFiles(authClient, folderId = "") {
  const drive = google.drive({ version: 'v3', auth: authClient });

  //console.log("FOLDER ID>>>:::", folderId)

  try {
    let allItems = [];
    // Variáveis de controle para paginação
    let pageToken = null;
    const pageSize = 100;

    do {
      // Solicite a lista de arquivos na pasta com base no token de página atual
      const response = await drive.files.list({
        q: `'${folderId[0].id}' in parents and trashed=false`,
        pageSize: pageSize,
        pageToken: pageToken,
        fields: 'nextPageToken, files(name)',
      });

      // Obtenha os itens da resposta
      const items = response.data.files;

      // Adicione os itens à lista principal
      allItems = allItems.concat(items);

      // Atualize o token de página para a próxima página (se houver)
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    // Agora, a lista `allItems` contém todos os itens da pasta

    // Faça o que for necessário com a lista completa

    const listFiles = []
    await allItems.forEach(item => {
      listFiles.push(item.name)
    });
    return listFiles
  }
  catch (error) {
    //console.error('Erro ao listar os itens:', error);
  }



}


async function downloadFile(authClient, fileId, extension) {

  const drive = google.drive({ version: 'v3', auth: authClient });

  try {
    const file = await drive.files.get({
      fileId: fileId,
      //mimeType: 'application/pdf',
      alt: 'media'
    },
      {
        responseType: 'arraybuffer',
        encoding: null
      }

    );

    var imageType
    if (extension == ".jpeg" || extension == ".jpg" || extension == ".gif" || extension == ".bmp")
      imageType = file.headers['content-type'];
    else if (extension == ".pdf")
      imageType = "application/pdf"

    const base64 = Buffer.from(file.data, "utf8").toString("base64")
    var dataURI = 'data:' + imageType + ';base64,' + base64;

    return dataURI
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}



//****************************************************************** */
async function sendAuthorize() {

  await authorize()
  return true
}

async function sendListFiles(folderId = "") {
  //authorize().then(listFiles(folderId)).catch(console.error);
  const auth = await authorize()
  return listFiles(auth, folderId)

}

async function sendListAllFiles(folderId = "") {
  //authorize().then(listFiles(folderId)).catch(console.error);
  const auth = await authorize()
  return listAllFiles(auth, folderId)

}

async function sendUploadFiles(parent, folderPath, fileName) {
  const auth = await authorize()
  const response = uploadFiles(auth, parent, folderPath, fileName)
  return response
}

async function sendCreateFolder(folderName, parentId = undefined) {
  const auth = await authorize()
  const id = createFolder(auth, folderName.trim(), parentId)
  return id
}

async function sendSearchFile(fileName, parentId = undefined) {
  const auth = await authorize()
  return searchFile(auth, fileName, parentId)


}

async function sendDeleteFile(fileId) {
  const auth = await authorize()
  return deleteFile(auth, fileId)
}

async function sendSearchOrCreateFolder(folderName, parent = undefined) {

  const auth = await authorize()
  let findFolder = await searchFile(auth, folderName)

  if (findFolder.length > 0)
    return findFolder
  else {
    await createFolder(auth, folderName)
    findFolder = await searchFile(auth, folderName)
    return findFolder
  }


}

async function sendDownloadFile(fileId, extension) {
  const auth = await authorize()
  return downloadFile(auth, fileId, extension)
}




module.exports = { sendListFiles, sendUploadFiles, sendAuthorize, sendCreateFolder, sendSearchFile, sendSearchOrCreateFolder, sendDownloadFile, sendDeleteFile, sendListAllFiles }
