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

const originalFileName = "P1(0)F - Copia.jpg";

// ✅ Regex explicado abaixo
const regexDocumentAndProt = /^P(\d+)\((\d+)\)(.*?)(?:\.[^.]+)?$/i;


const teste = regexDocumentAndProt.test(originalFileName.toUpperCase())
console.log("!!!!",teste)
//return
const match = originalFileName.match(regexDocumentAndProt);

if (match) {
  const objFileName1 = {
    book: match[1],  // número após o P → 1
    prot: match[2],  // número entre parênteses → 11
    obs: match[3]?.trim() || null, // texto entre parênteses e extensão → "teste teste"
    ext: path.extname(originalFileName).toLowerCase(), // extensão → ".jpg"
  };

  console.log("Resultado:", objFileName1);
} else {
  console.log("❌ Nenhum padrão reconhecido no nome do arquivo.");
}



})
