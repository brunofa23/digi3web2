"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { assuredworkloads } = require('googleapis/build/src/apis/assuredworkloads');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = path.join(process.cwd(), 'config/tokens/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'config/credentials/credentials.json');
console.log("TOKEN_PATH>>", TOKEN_PATH);
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

    console.log("AUTHORIZE....")

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
async function uploadFiles(authClient) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    let parents = ['1SUx-ExjG-qpltDCCaXV_OWgCs-tQZuEr'];
    const fileMetadata = {
        name: 'photo.jpg',
        parents: parents
    };
    const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(path.join(process.cwd(), 'config/files/photo.jpg')),
    };
    console.log("MEDIA", media);
    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
        console.log("CAMINHO IMAGEM::", path.join(process.cwd(), 'config/files/photo.jpg'));
        console.log('File Id:', file.data.id);
        return file.data.id;
    }
    catch (err) {
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
    }
    catch (err) {
        throw err;
    }
}
async function searchFile(authClient) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const files = [];
    try {
        const res = await drive.files.list({
            q: "name = 'Nascimento' ",
        });
        Array.prototype.push.apply(files, res.files);
        res.data.files.forEach(function (file) {
            console.log('Found file:', file.name, file.id);
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
async function sendAuthorize() {
    await authorize();
    return true;
}
async function sendListFiles() {
    authorize().then(listFiles).catch(console.error);
}
async function sendUploadFiles() {
    authorize().then(uploadFiles).catch(console.error);
}
async function sendCreateFolder() {
    authorize().then(createFolder).catch(console.error);
}
async function sendSearchFile() {
    authorize().then(searchFile).catch(console.error);
}
module.exports = { sendListFiles, sendUploadFiles, sendAuthorize, sendCreateFolder, sendSearchFile };
//# sourceMappingURL=googledrive%20old.js.map