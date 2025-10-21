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
await PdfOptimizer.compressIfScanned('/tmp/test2/original.pdf', '/tmp/test2/optimized.pdf')



})
