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


const currencyConverter = (numeroBrasileiro: String) => {
  // Remover pontos de milhar
  const numeroSemMilhar = numeroBrasileiro.replace(/\./g, '');
  // Trocar a vírgula por ponto
  const numeroDecimal = numeroSemMilhar.replace(',', '.');
  // Converter para float e arredondar para 2 casas decimais
  const numeroFormatado = parseFloat(numeroDecimal).toFixed(2);

  return numeroFormatado;
}



export { DeleteFiles, logInJson, currencyConverter, verifyPermission }
