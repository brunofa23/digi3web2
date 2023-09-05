const fs = require('fs');

async function DeleteFiles(folderPath) {
    fs.unlink(`${folderPath}`, (err) => {
        if (err) {
            throw "ERRO DELETE::" + err;
        }
        console.log("Delete File successfully.");
        return true
    });
}






module.exports = { DeleteFiles }