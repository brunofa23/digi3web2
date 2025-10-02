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

  const regexBookCoverInsertBookrecord = /^L([1-9]\d*)C\(([1-9]\d*)\)([a-zA-Z]*)\.(.+)$/i;
  const originalFileName = "L123c(1).JPG";
  let objFileName

  if (regexBookCoverInsertBookrecord.test(originalFileName.toUpperCase())) {
    console.log("entrei no ccccc")
    const match = originalFileName.match(regexBookCoverInsertBookrecord);

    if (match) {
      objFileName = {
        book: match[1],                               // número do livro → 123
        sheet: match[2],                              // número da folha → 1
        letter: match[3] || "",                       // letras opcionais → ABC
        ext: "." + match[4].toLowerCase(),            // extensão → .jpg
      };

      console.log("ENTROU NO TEST!!!", objFileName)
      return
      // query.andWhere('book', objFileName.book)
      // isCreateCover = true

    }

  })
