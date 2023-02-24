"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { assuredworkloads } = require('googleapis/build/src/apis/assuredworkloads');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = Application_1.default.configPath('tokens/token.json');
const CREDENTIALS_PATH = Application_1.default.configPath('/credentials/credentials.json');
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fsPromises.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    }
    catch (err) {
        return null;
    }
}
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
    console.log("CLIENTE:", client);
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
    const parent = [parents];
    const fileMetadata = {
        name: fileName,
        parents: parent
    };
    const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(`${folderPath}/${fileName}`),
    };
    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
        console.log('File Id:', file.data.id);
        return file.data.id;
    }
    catch (err) {
        console.log("ERRO:::::", err);
        throw err;
    }
}
async function createFolder(authClient, folderName, parentId = undefined) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    var _parentId = [];
    if (parentId)
        _parentId = [parentId];
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: _parentId,
    };
    console.log(">>>FILEMETADATA", fileMetadata);
    try {
        console.log("entrei create folder");
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        console.log('Folder Id:', file.data.id);
        return file.data.id;
    }
    catch (err) {
        throw err;
    }
}
async function searchFile(authClient, fileName, parentId = undefined) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    console.log("CHEGUEI NA PESQUISA searcfile", fileName, "parent", parentId);
    const files = [];
    let query = `name ='${fileName}' `;
    if (parentId)
        query += ` and parents in '${parentId}'`;
    console.log(">>>QUERY", query);
    try {
        const res = await drive.files.list({
            q: query
        });
        Array.prototype.push.apply(files, res.files);
        res.data.files.forEach(function (file) {
            console.log('Found file:', file.name, file.id);
            files.push({ name: file.name, id: file.id });
        });
        return res.data.files;
    }
    catch (error) {
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
async function downloadFile(authClient, fileId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    try {
        const file = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, {
            responseType: 'arraybuffer',
            encoding: null
        });
        console.log(">>>>>>DOWNLOAD", file);
        var imageType = file.headers['content-type'];
        const base64 = Buffer.from(file.data, "utf8").toString("base64");
        var dataURI = 'data:' + imageType + ';base64,' + base64;
        return dataURI;
    }
    catch (err) {
        throw err;
    }
}
async function sendAuthorize() {
    await authorize();
    return true;
}
async function sendListFiles() {
    authorize().then(listFiles).catch(console.error);
}
async function sendUploadFiles(parent, folderPath, fileName) {
    const auth = await authorize();
    uploadFiles(auth, parent, folderPath, fileName);
}
async function sendCreateFolder(folderName, parentId = undefined) {
    const auth = await authorize();
    createFolder(auth, folderName, parentId);
}
async function sendSearchFile(fileName, parentId = undefined) {
    const auth = await authorize();
    return searchFile(auth, fileName, parentId);
}
async function sendSearchOrCreateFolder(folderName, parent = undefined) {
    const auth = await authorize();
    let findFolder = await searchFile(auth, folderName);
    if (findFolder.length > 0)
        return findFolder;
    else {
        await createFolder(auth, folderName);
        findFolder = await searchFile(auth, folderName);
        return findFolder;
    }
}
async function sendDownloadFile(fileId) {
    const auth = await authorize();
    return downloadFile(auth, fileId);
}
module.exports = { sendListFiles, sendUploadFiles, sendAuthorize, sendCreateFolder, sendSearchFile, sendSearchOrCreateFolder, sendDownloadFile };
//# sourceMappingURL=googledrive.js.map