import { test } from '@japa/runner'
import Application from '@ioc:Adonis/Core/Application'
//const sharp = require('sharp');
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileRename } from "App/Services/fileRename/fileRename"
import Bookrecord from 'App/Models/Bookrecord'
import Typebook from 'App/Models/Typebook'

test('test', async ({ client }) => {

  // const regexBookSheetSideInsertBookrecord = /^l\d+f\(\d+\)[vf]/i;
  // const originalFileName = "L123F(1)f.JPG";
  // let objFileName

  // if (regexBookSheetSideInsertBookrecord.test(originalFileName)) {
  //   console.log("entrei no VALIDADO!!!")
  //   const match = originalFileName.match(regexBookSheetSideInsertBookrecord);
  //   // console.log(">>>>>>>>",match)
  //   if (match) {
  //     objFileName = {
  //       book: match[1],                               // número do livro → 123
  //        sheet: match[2],                              // número da folha → 1
  //        letter: match[3] || "",                       // letras opcionais → ABC
  //        //ext: "." + match[4].toLowerCase(),            // extensão → .jpg
  //     };

  //     console.log("ENTROU NO TEST!!!", objFileName)
  //   }
  // }
  // else console.log("NÃO ENTRA NO FORMATO")


  const regexBookSheetSideInsertBookrecord = /^l(\d+)f\((\d+)\)([vf])(\d)?[^.]*\.(\w+)$/i;

const examples = [
  "L123F(1)f.JPG",
  "L123F(1)v1.JPG",
  "L123F(1)f155aaaa.JPG",
  "L123F(1)V-primeira.JPG",
  "l10f(3)F3extra.png"
];

const originalFileName ="L123F(1)f155aaaa.JPG"

//for (const originalFileName of examples) {
  const match = originalFileName.match(regexBookSheetSideInsertBookrecord);

  if (match) {
    const objFileName = {
      book: match[1],        // número entre L e F → 123
      sheet: match[2],       // número entre parênteses → 1
      side: match[3].toUpperCase(), // letra depois do parêntese → F/V
      indexbook: match[4] ? Number(match[4]) : null, // primeiro dígito após F/V
      ext: "." + match[5].toLowerCase(), // extensão do arquivo
    };

    console.log("✅ VALIDADO:", originalFileName, objFileName);
  } else {
    console.log("❌ NÃO ENTRA NO FORMATO:", originalFileName);
  }
//}




})
