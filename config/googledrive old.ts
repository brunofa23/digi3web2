import { GoogleApis } from "googleapis";

const fsPromises = require('fs').promises;
const fs = require('fs')

const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { assuredworkloads } = require('googleapis/build/src/apis/assuredworkloads');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const TOKEN_PATH = path.join(process.cwd(), 'config/tokens/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'config/credentials/credentials.json');

console.log("TOKEN_PATH>>", TOKEN_PATH);

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fsPromises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

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

/**
 * Load or request or authorization to call APIs.
 *
 */
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

  console.log("cliente::::", client);
  return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */

// async function uploadFilesBackup(authClient) {
//   const drive = google.drive({ version: 'v3', auth: authClient });

//   let parents = ['1SUx-ExjG-qpltDCCaXV_OWgCs-tQZuEr']
//   //parents[0] = '1E5-xpRXwImV6QZdPv-amoGYV8MZqfZp4'

//   const fileMetadata = {
//     name: 'photo.jpg',
//     parents: parents
//   };
//   const media = {
//     mimeType: 'image/jpeg',
//     body: fs.createReadStream(path.join(process.cwd(), 'config/files/photo.jpg')),
//   };
//   console.log("MEDIA", media)
//   try {
//     const file = await drive.files.create({
//       resource: fileMetadata,
//       media: media,
//       fields: 'id'

//     });
//     console.log("CAMINHO IMAGEM::", path.join(process.cwd(), 'config/files/photo.jpg'));
//     console.log('File Id:', file.data.id);
//     return file.data.id;
//   } catch (err) {
//     // TODO(developer) - Handle error
//     console.log("ERRO:::::", err);
//     throw err;
//   }

// }

async function uploadFiles(authClient) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  let parents = ['1SUx-ExjG-qpltDCCaXV_OWgCs-tQZuEr']
  //parents[0] = '1E5-xpRXwImV6QZdPv-amoGYV8MZqfZp4'

  const fileMetadata = {
    name: 'photo.jpg',
    parents: parents
  };
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(path.join(process.cwd(), 'config/files/photo.jpg')),
  };
  console.log("MEDIA", media)
  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'

    });
    console.log("CAMINHO IMAGEM::", path.join(process.cwd(), 'config/files/photo.jpg'));
    console.log('File Id:', file.data.id);
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    console.log("ERRO:::::", err);
    throw err;
  }

}

async function createFolder(authClient) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const fileMetadata = {
    name: 'Nascimento',
    mimeType: 'application/vnd.google-apps.folder',
  };

  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });
    console.log('Folder Id:', file.data.id);
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }

}

async function searchFile(authClient){
  const drive = google.drive({ version: 'v3', auth: authClient });

  const files = []

  try {
    const res = await drive.files.list({
      q: "name = 'Nascimento' ",
      //q: "mimeType = 'application/vnd.google-apps.folder'"
      //name:'Nascimento',
      // fields: 'nextPageToken, files(id, name)',
      // spaces: 'drive'
      //name: 'repetida3.jpg'
    });
    Array.prototype.push.apply(files, res.files);
    res.data.files.forEach(function(file) {
      console.log('Found file:', file.name, file.id);
    });
    return res.data.files;

  } catch (error) {
    throw error;
  }


}


async function listFiles(authClient) {
  console.log("authClient", authClient);
  const drive = google.drive({ version: 'v3', auth: authClient });
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });

  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }
  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}


//****************************************************************** */
async function sendAuthorize(){
   await authorize()
   return true
}

async function sendListFiles(){
  authorize().then(listFiles).catch(console.error);
}

async function sendUploadFiles(){
  //const auth = await authorize()
  //uploadFiles(auth)

  authorize().then(uploadFiles).catch(console.error)
}

async function sendCreateFolder() {
  authorize().then(createFolder).catch(console.error)
}

async function sendSearchFile() {
  authorize().then(searchFile).catch(console.error)
}

//export default {sendListFiles, sendUploadFiles, sendAuthorize}
module.exports = {sendListFiles, sendUploadFiles, sendAuthorize, sendCreateFolder, sendSearchFile}
