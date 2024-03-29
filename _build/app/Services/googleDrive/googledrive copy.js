"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
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
async function getToken() {
    const config = await Config_1.default.query().where("name", '=', 'tokenGoogle').first();
    let tokenDecryption = new Config_1.default();
    try {
        if (config && config.valuetext) {
            tokenDecryption = config;
            tokenDecryption.valuetext = Encryption_1.default.decrypt(config?.valuetext);
            tokenDecryption.valuetext = JSON.parse(tokenDecryption.valuetext);
        }
    }
    catch (error) {
        console.log("erro 1541", error);
    }
    return config;
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
    const resumableUpload = drive.files.create({
        requestBody: {
            name: fileName,
            parents: parent,
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
            if (err.statusCode === 408) {
                console.log('Tentando reconectar o upload...');
                resumableUpload.start();
            }
            else {
                console.error('Não é possível reconectar o upload. Erro irreparável.');
            }
        },
    });
    const response = await resumableUpload;
    return response;
    console.log(`Arquivo carregado com sucesso! ID do arquivo: ${response.data.id}`);
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
    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return file.data.id;
    }
    catch (err) {
        throw err;
    }
}
async function searchFile(authClient, fileName, parentId = undefined) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const files = [];
    const fileNamedecoded = decodeURIComponent(fileName);
    let query = `name ='${fileNamedecoded}' `;
    if (parentId)
        query += ` and parents in '${parentId}'`;
    query += " and trashed=false ";
    try {
        const res = await drive.files.list({
            q: query
        });
        Array.prototype.push.apply(files, res.files);
        res.data.files.forEach(function (file) {
            files.push({ name: file.name, id: file.id });
            console.log('Found file:', file.name, file.id);
        });
        return res.data.files;
    }
    catch (error) {
        return error;
    }
}
async function deleteFile(authClient, fileId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const request = drive.files.delete({
        'fileId': fileId
    });
    return request;
}
async function listFiles(authClient, folderId = "") {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.list({
        q: `'${folderId[0].id}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name)',
    });
    const files = res.data.files;
    if (files.length === 0) {
        return;
    }
    const listFiles = files.map((file) => {
        return file.name;
    });
    return listFiles;
}
async function listAllFiles(authClient, folderId = "") {
    const drive = google.drive({ version: 'v3', auth: authClient });
    try {
        let allItems = [];
        let pageToken = null;
        const pageSize = 100;
        do {
            const response = await drive.files.list({
                q: `'${folderId[0].id}' in parents and trashed=false`,
                pageSize: pageSize,
                pageToken: pageToken,
                fields: 'nextPageToken, files(name)',
            });
            const items = response.data.files;
            allItems = allItems.concat(items);
            pageToken = response.data.nextPageToken;
        } while (pageToken);
        const listFiles = [];
        await allItems.forEach(item => {
            listFiles.push(item.name);
        });
        return listFiles;
    }
    catch (error) {
    }
}
async function downloadFile(authClient, fileId, extension) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    try {
        const file = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, {
            responseType: 'arraybuffer',
            encoding: null
        });
        var imageType;
        if (extension == ".jpeg" || extension == ".jpg" || extension == ".gif" || extension == ".bmp")
            imageType = file.headers['content-type'];
        else if (extension == ".pdf")
            imageType = "application/pdf";
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
async function sendListFiles(folderId = "") {
    const auth = await authorize();
    return listFiles(auth, folderId);
}
async function sendListAllFiles(folderId = "") {
    const auth = await authorize();
    return listAllFiles(auth, folderId);
}
async function sendUploadFiles(parent, folderPath, fileName) {
    const auth = await authorize();
    const response = uploadFiles(auth, parent, folderPath, fileName);
    return response;
}
async function sendCreateFolder(folderName, parentId = undefined) {
    const auth = await authorize();
    const id = createFolder(auth, folderName.trim(), parentId);
    return id;
}
async function sendSearchFile(fileName, parentId = undefined) {
    const auth = await authorize();
    return searchFile(auth, fileName, parentId);
}
async function sendDeleteFile(fileId) {
    const auth = await authorize();
    return deleteFile(auth, fileId);
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
async function sendDownloadFile(fileId, extension) {
    const auth = await authorize();
    return downloadFile(auth, fileId, extension);
}
module.exports = { sendListFiles, sendUploadFiles, sendAuthorize, sendCreateFolder, sendSearchFile, sendSearchOrCreateFolder, sendDownloadFile, sendDeleteFile, sendListAllFiles };
//# sourceMappingURL=googledrive%20copy.js.map