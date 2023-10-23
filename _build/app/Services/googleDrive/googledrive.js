"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Token_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Token"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const fsPromises = require('fs').promises;
const fs = require('fs');
const deleteFiles = require('../util');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = Application_1.default.configPath('tokens/');
const CREDENTIALS_PATH = Application_1.default.configPath('/credentials/credentials.json');
const CREDENTIALS_PATH_FOLDER = Application_1.default.configPath('/credentials/');
async function getToken() {
    try {
        const token = await Token_1.default.findOrFail(1);
        if (!Helpers_1.types.isNull(token?.token)) {
            token.token = JSON.parse(token.token);
            return token;
        }
    }
    catch (error) {
        console.log("erro 1541", error);
        return null;
    }
}
async function getCredentials() {
    try {
        const credentials = await Token_1.default.findOrFail(1);
        credentials.credentials = JSON.parse(credentials.credentials);
        return credentials;
    }
    catch (error) {
        console.log("erro 1542", error);
        return null;
    }
}
async function generateCredentialsToJson() {
    const credentialsDB = await getCredentials();
    const fileNameCredentials = CREDENTIALS_PATH;
    const content = JSON.stringify(credentialsDB?.credentials, null, 2);
    try {
        if (!fs.existsSync(CREDENTIALS_PATH_FOLDER)) {
            console.log("ERRO SEM PASTA CREDENTIALS");
            fs.mkdirSync(CREDENTIALS_PATH_FOLDER);
        }
        await fs.writeFileSync(fileNameCredentials, content, 'utf8');
    }
    catch (error) {
        throw error;
    }
}
async function loadSavedCredentialsIfExist() {
    const tokenNumber = await getToken();
    if (tokenNumber) {
        try {
            return google.auth.fromJSON(tokenNumber.token);
        }
        catch (err) {
            console.log("ERRO DO TOKEN", err);
            return null;
        }
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
    try {
        const token = await Token_1.default.findOrFail(1);
        token.token = payload;
        await token.save();
        await deleteFiles.DeleteFiles(CREDENTIALS_PATH);
        await deleteFiles.DeleteFiles(TOKEN_PATH);
    }
    catch (error) {
        return error;
    }
}
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        await generateCredentialsToJson();
        return;
    }
    try {
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
            setTimeout: 6000000
        });
        if (client.credentials) {
            await saveCredentials(client);
        }
        console.log("CLIENT>>>>>", client);
        return client;
    }
    catch (error) {
        console.error('Erro ao autenticar:', error);
        throw error;
    }
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
    const allFiles = [];
    console.time("VALOR2");
    async function listFiles(pageToken) {
        drive.files.list({
            q: `'${folderId[0].id}' in parents and trashed=false`,
            pageToken: pageToken,
        }, (err, res) => {
            if (err) {
                console.error('Erro ao listar arquivos:', err);
            }
            else {
                const files = res.data.files;
                allFiles.push(...files);
                if (res.data.nextPageToken) {
                    listFiles(res.data.nextPageToken);
                }
                else {
                    console.log(`Quantidade total de arquivos na pasta: ${allFiles.length}`);
                    const allListFiles = [];
                    allFiles.forEach(item => {
                        allListFiles.push(item.name);
                    });
                    console.timeEnd("VALOR2");
                    return allListFiles;
                }
            }
        });
    }
    listFiles(null);
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
//# sourceMappingURL=googledrive.js.map