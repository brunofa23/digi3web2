"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRenameFile = exports.sendListAllFiles = exports.sendDeleteFile = exports.sendDownloadFile = exports.sendSearchOrCreateFolder = exports.sendSearchFile = exports.sendCreateFolder = exports.sendAuthorize = exports.sendUploadFiles = exports.sendListFiles = void 0;
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
async function getToken(cloud_number) {
    try {
        const token = await Token_1.default.findOrFail(cloud_number);
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
async function getCredentials(cloud_number) {
    try {
        const credentials = await Token_1.default.findOrFail(cloud_number);
        credentials.credentials = JSON.parse(credentials.credentials);
        return credentials;
    }
    catch (error) {
        console.log("erro 1542", error);
        return null;
    }
}
async function generateCredentialsToJson(cloud_number) {
    const credentialsDB = await getCredentials(cloud_number);
    const fileNameCredentials = CREDENTIALS_PATH;
    const content = JSON.stringify(credentialsDB?.credentials, null, 2);
    try {
        if (!fs.existsSync(CREDENTIALS_PATH_FOLDER)) {
            fs.mkdirSync(CREDENTIALS_PATH_FOLDER);
        }
        await fs.writeFileSync(fileNameCredentials, content, 'utf8');
    }
    catch (error) {
        throw error;
    }
}
async function loadSavedCredentialsIfExist(cloud_number) {
    const tokenNumber = await getToken(cloud_number);
    if (tokenNumber) {
        try {
            return google.auth.fromJSON(tokenNumber.token);
        }
        catch (err) {
            return null;
        }
    }
}
async function saveCredentials(client, cloud_number) {
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
        const token = await Token_1.default.findOrFail(cloud_number);
        token.token = payload;
        await token.save();
        await deleteFiles.DeleteFiles(CREDENTIALS_PATH);
        await deleteFiles.DeleteFiles(TOKEN_PATH);
    }
    catch (error) {
        return error;
    }
}
async function authorize(cloud_number) {
    let client = await loadSavedCredentialsIfExist(cloud_number);
    if (client) {
        return client;
    }
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        await generateCredentialsToJson(cloud_number);
        return;
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
        });
        return res.data.files;
    }
    catch (error) {
        return error;
    }
}
async function deleteFile(authClient, fileId) {
    try {
        const drive = google.drive({ version: 'v3', auth: authClient });
        const request = drive.files.delete({
            'fileId': fileId
        });
        return request;
    }
    catch (error) {
        throw error;
    }
}
async function renameFile(authClient, fileId, newTitle) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    try {
        const fileMetadata = {
            name: newTitle,
        };
        const updatedFile = await drive.files.update({
            fileId,
            resource: fileMetadata,
        });
    }
    catch (error) {
        console.error('Erro ao renomear o arquivo:', error);
    }
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
            allItems.push(...items);
            pageToken = response.data.nextPageToken;
        } while (pageToken);
        const listFiles = [];
        allItems.forEach(item => {
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
            alt: 'media',
        }, {
            responseType: 'arraybuffer',
            encoding: null
        });
        var imageType;
        if (extension.toLowerCase() == ".jpeg" || extension.toLowerCase() == ".jpg"
            || extension.toLowerCase() == ".gif" || extension.toLowerCase() == ".bmp"
            || extension.toLowerCase() == ".png" || extension.toLowerCase() == ".jfif")
            imageType = file.headers['content-type'];
        else if (extension == ".pdf")
            imageType = "application/pdf";
        const base64 = Buffer.from(file.data, "utf8").toString("base64");
        var dataURI = 'data:' + imageType + ';base64,' + base64;
        const fileDownload = { dataURI, size: file.data.byteLength };
        return fileDownload;
    }
    catch (err) {
        throw err;
    }
}
async function sendAuthorize(cloud_number) {
    await authorize(cloud_number);
    return true;
}
exports.sendAuthorize = sendAuthorize;
async function sendListFiles(cloud_number, folderId = "") {
    const auth = await authorize(cloud_number);
    return listFiles(auth, folderId);
}
exports.sendListFiles = sendListFiles;
async function sendListAllFiles(cloud_number, folderId = "") {
    const auth = await authorize(cloud_number);
    return listAllFiles(auth, folderId);
}
exports.sendListAllFiles = sendListAllFiles;
async function sendUploadFiles(parent, folderPath, fileName, cloud_number) {
    const auth = await authorize(cloud_number);
    const response = uploadFiles(auth, parent, folderPath, fileName);
    return response;
}
exports.sendUploadFiles = sendUploadFiles;
async function sendCreateFolder(folderName, cloud_number, parentId = undefined) {
    const auth = await authorize(cloud_number);
    const id = createFolder(auth, folderName.trim(), parentId);
    return id;
}
exports.sendCreateFolder = sendCreateFolder;
async function sendSearchFile(fileName, cloud_number, parentId = undefined) {
    const auth = await authorize(cloud_number);
    return searchFile(auth, fileName, parentId);
}
exports.sendSearchFile = sendSearchFile;
async function sendDeleteFile(fileId, cloud_number) {
    const auth = await authorize(cloud_number);
    return deleteFile(auth, fileId);
}
exports.sendDeleteFile = sendDeleteFile;
async function sendSearchOrCreateFolder(folderName, cloud_number, parent = undefined) {
    const auth = await authorize(cloud_number);
    let findFolder = await searchFile(auth, folderName);
    if (findFolder.length > 0)
        return findFolder;
    else {
        await createFolder(auth, folderName);
        findFolder = await searchFile(auth, folderName);
        return findFolder;
    }
}
exports.sendSearchOrCreateFolder = sendSearchOrCreateFolder;
async function sendDownloadFile(fileId, extension, cloud_number) {
    const auth = await authorize(cloud_number);
    return downloadFile(auth, fileId, extension);
}
exports.sendDownloadFile = sendDownloadFile;
async function sendRenameFile(fileId, newTitle, cloud_number) {
    const auth = await authorize(cloud_number);
    return renameFile(auth, fileId, newTitle);
}
exports.sendRenameFile = sendRenameFile;
//# sourceMappingURL=googledrive.js.map