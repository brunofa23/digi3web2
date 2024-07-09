import xlsx from 'xlsx'
import path from 'path'

async function readFile(filePath:string="") {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.xls' || extension === '.xlsx' || extension === '.csv') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    const columns =xlsx.utils.sheet_to_json(sheet,{header:1});
    //console.log("EXTENSION", data)
    return {data,header:columns[0]}
  } else {
    console.error('Unsupported file format.');
  }

}
module.exports = {readFile}


// import {readFile}from "App/Services/readFile/readFile"
// const teste = await readFile('/tmp/uploads/testeImportacao.xlsx')
// console.log("book.....", teste)

