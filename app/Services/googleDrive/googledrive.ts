import Application from '@ioc:Adonis/Core/Application'
import Token from 'App/Models/Token';
import { types } from '@ioc:Adonis/Core/Helpers'

const fsPromises = require('fs').promises;
const fs = require('fs')
const deleteFiles = require('../util')
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = Application.configPath('tokens/')
const CREDENTIALS_PATH = Application.configPath('/credentials/credentials.json')
const CREDENTIALS_PATH_FOLDER = Application.configPath('/credentials/')

async function getToken(cloud_number: number) {
  try {
    //const token = await Token.findBy("name", 'tokenGoogle')
    const token = await Token.findOrFail(cloud_number)
    if (!types.isNull(token?.token)) {
      token.token = JSON.parse(token.token)
      return token
    }
  } catch (error) {
    console.log("erro 1541", error)
    return null
  }
}

async function getCredentials(cloud_number: number) {
  try {
    //const credentials = await Token.findBy("name", 'tokenGoogle')
    const credentials = await Token.findOrFail(cloud_number)
    credentials.credentials = JSON.parse(credentials.credentials)
    return credentials
  } catch (error) {
    console.log("erro 1542", error)
    return null
  }
}

async function generateCredentialsToJson(cloud_number: number) {
  const credentialsDB = await getCredentials(cloud_number)
  const fileNameCredentials = CREDENTIALS_PATH
  const content = JSON.stringify(credentialsDB?.credentials, null, 2);
  try {
    if (!fs.existsSync(CREDENTIALS_PATH_FOLDER)) {
      fs.mkdirSync(CREDENTIALS_PATH_FOLDER)
    }
    await fs.writeFileSync(fileNameCredentials, content, 'utf8');
  } catch (error) {
    throw error
  }

}

async function loadSavedCredentialsIfExist(cloud_number: number) {
  const tokenNumber = await getToken(cloud_number)
  if (tokenNumber) {
    try {
      return google.auth.fromJSON(tokenNumber.token);
    } catch (err) {
      return null;
    }
  }
}

async function saveCredentials(client, cloud_number: number) {
  const content = await fsPromises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  try {
    const token = await Token.findOrFail(cloud_number)
    token.token = payload
    await token.save()
    await deleteFiles.DeleteFiles(CREDENTIALS_PATH)
    await deleteFiles.DeleteFiles(TOKEN_PATH)

  } catch (error) {
    return error
  }


}

async function authorize(cloud_number: number) {
  let client = await loadSavedCredentialsIfExist(cloud_number);
  if (client) {
    return client;
  }

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    await generateCredentialsToJson(cloud_number);
    return
  }

  try {
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
      setTimeout: 6000000
    });
    if (client.credentials) {
      await saveCredentials(client, cloud_number);
    }

    return client;

  } catch (error) {
    console.error('Erro ao autenticar:', error);
    throw error;
  }
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
    });
    return res.data.files
  } catch (error) {
    return error;
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
  } catch (error) {
    console.error('Erro ao renomear o arquivo:', error);
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


async function listAllFiles(authClient, folderId = "") {
  const drive = google.drive({ version: 'v3', auth: authClient });

  try {
    //console.time("valor1")
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
      //allItems = allItems.concat(items);
      allItems.push(...items);
      // Atualize o token de página para a próxima página (se houver)
      pageToken = response.data.nextPageToken;
    } while (pageToken);
    // Agora, a lista `allItems` contém todos os itens da pasta
    // Faça o que for necessário com a lista completa

    const listFiles = []
    allItems.forEach(item => {
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
      alt: 'media',
    },
      {
        responseType: 'arraybuffer',
        encoding: null
      }

    );

    var imageType
    if (extension.toLowerCase() == ".jpeg" || extension.toLowerCase() == ".jpg"
      || extension.toLowerCase() == ".gif" || extension.toLowerCase() == ".bmp"
      || extension.toLowerCase() == ".png"
    )
      imageType = file.headers['content-type'];
    else if (extension == ".pdf")
      imageType = "application/pdf"

    const base64 = Buffer.from(file.data, "utf8").toString("base64")
    var dataURI = 'data:' + imageType + ';base64,' + base64;
    const fileDownload = { dataURI, size: file.data.byteLength }
    return fileDownload
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

//****************************************************************** */
//****************************************************************** */
async function sendAuthorize(cloud_number: number) {
  await authorize(cloud_number)
  return true
}

async function sendListFiles(cloud_number: number, folderId = "") {
  //authorize().then(listFiles(folderId)).catch(console.error);
  const auth = await authorize(cloud_number)
  return listFiles(auth, folderId)

}

async function sendListAllFiles(cloud_number: number, folderId = "") {
  //authorize().then(listFiles(folderId)).catch(console.error);
  const auth = await authorize(cloud_number)
  return listAllFiles(auth, folderId)

}

async function sendUploadFiles(parent, folderPath, fileName, cloud_number: number) {
  const auth = await authorize(cloud_number)
  const response = uploadFiles(auth, parent, folderPath, fileName)
  return response
}

async function sendCreateFolder(folderName, cloud_number: number, parentId = undefined,) {
  const auth = await authorize(cloud_number)
  const id = createFolder(auth, folderName.trim(), parentId)
  return id
}

async function sendSearchFile(fileName, cloud_number: number, parentId = undefined) {


  const auth = await authorize(cloud_number)
  return searchFile(auth, fileName, parentId)
}

async function sendDeleteFile(fileId, cloud_number: number) {
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

async function sendRenameFile(fileId, newTitle, cloud_number: number) {
  const auth = await authorize(cloud_number)
  return renameFile(auth, fileId, newTitle)

}

module.exports = { sendListFiles, sendUploadFiles, sendAuthorize, sendCreateFolder, sendSearchFile, sendSearchOrCreateFolder, sendDownloadFile, sendDeleteFile, sendListAllFiles, sendRenameFile }
