import Application from '@ioc:Adonis/Core/Application'


const fs = require('fs');

async function DeleteFiles(folderPath) {
    fs.unlink(`${folderPath}`, (err) => {
        if (err) {
            throw "ERRO DELETE::" + err;
        }
        return true
    });
}


async function logInJson(value) {

    const pathFile = Application.tmpPath('log.json')
    try {
        if (fs.existsSync(pathFile)) {

            fs.writeFile(pathFile, value, (err) => {
                if (err)
                    console.log(err);
                else {
                    console.log("inserido com sucesso")
                }
            });

        } else {
            console.error('O arquivo não existe:', pathFile);
        }

    } catch (error) {
        console.error('Erro ao adicionar string ao arquivo JSON:', error)
    }
}


module.exports = { DeleteFiles, logInJson }