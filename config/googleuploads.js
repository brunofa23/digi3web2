/**
 * Insert new file.
 * @return{obj} file Id
 * */

const path = require('path');
async function uploadBasic() {

    console.log("entrei no upload");
    const fs = require('fs');
    const { GoogleAuth } = require('google-auth-library');
    const { google } = require('googleapis');

    // Get credentials and build service
    // TODO (developer) - Use appropriate auth mechanism for your app
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/drive',
    });
    const service = google.drive({ version: 'v3', auth });


    const fileMetadata = {
        name: 'photo.jpg',
    };
    const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(path.join(process.cwd(), 'config/files/photo.jpg')),
    };
    try {
        const file = await service.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log("CAMINHO IMAGEM::", path.join(process.cwd(), 'config/files/photo.jpg'));
        console.log('File Id:', file.data.id);
        return file.data.id;
    } catch (err) {
        // TODO(developer) - Handle error
        console.log("ERRO:::::",err);
        throw err;
    }
}


