import Application from '@ioc:Adonis/Core/Application'

const fs = require('fs');
async function DeleteFiles(folderPath) {
  // fs.unlink(`${folderPath}`, (err) => {
  //   if (err) {
  //     throw "ERRO DELETE::" + err;
  //   }
  //   return true
  // });
}


//VERIFICA SE POSSUI A PERMISSÃO NO ARRAY GROUPXPERMISSION
const verifyPermission = (isSuperuser = false, permissions = [], permission_id) => {
  if (isSuperuser)
    return true
  const result = permissions?.some(p => p.permissiongroup_id === permission_id);
  return result;
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



const currencyConverter = (input: string): string => {
   if (typeof input !== 'string' || input.trim() === '') {
    return '0.00'; // ou retorne null, ou lance erro, conforme sua lógica
  }
  let valor: number;
  if (input.includes(',')) {
    // Formato brasileiro: 1.234,56
    const numeroSemMilhar = input.replace(/\./g, '');
    const numeroDecimal = numeroSemMilhar.replace(',', '.');
    valor = parseFloat(numeroDecimal);
  } else {
    // Formato internacional: 1234.56
    valor = parseFloat(input);
  }
  const numeroFormatado = valor.toFixed(2);
  return numeroFormatado;
};


export { DeleteFiles, logInJson, currencyConverter, verifyPermission }
