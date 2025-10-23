import { test } from '@japa/runner'
import Application from '@ioc:Adonis/Core/Application'
//const sharp = require('sharp');
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileRename } from "App/Services/fileRename/fileRename"
import Bookrecord from 'App/Models/Bookrecord'
import Typebook from 'App/Models/Typebook'
import PdfOptimizer from 'App/Services/imageProcessing/PdfOptimizer'


test('test', async ({ client }) => {

  console.log("sucesso!!")

  const inputImage = Application.tmpPath('/test2/ContaLuz.pdf');//'input.jpg';
  const outputImage = Application.tmpPath('/test2/optimized.pdf')//'processed.jpg';

console.log("input>>", inputImage)
const teste = await PdfOptimizer.compressIfScanned(inputImage)
console.log("retorno",teste)



})
