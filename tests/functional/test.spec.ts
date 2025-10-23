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
import { processImage } from 'App/Services/imageProcessing/processImage'

test('test', async ({ client }) => {


  const inputImage = Application.tmpPath('/test2/ImagemLivro.jpg');//'input.jpg';
  const outputImage = Application.tmpPath('/test2/ImagemLivroAlterada.jpg')//'processed.jpg';

 // ⚡ use await para esperar o resultado
  const result = await processImage(inputImage, outputImage)

  console.log('✅ OK ->', result)


})
