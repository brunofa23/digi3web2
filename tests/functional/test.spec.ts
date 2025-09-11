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

  // const teste = await fileRename("L389F(11)F.jpg", 236,10)
  // console.log("Processamento completo!", teste);

  const books_id = await Typebook.findOrFail(236)
  console.log("######", books_id.books_id)

  // const bookRecordFind = await Bookrecord.query()
  // .preload('typebooks')
  //   .where('typebooks_id', 236)
  //   .max('cod as max_cod')
  //   .max('books_id as max_books_id')
  //   .first()//await Typebook.findOrFail(typebooks_id)

  // const regexBookCoverInsertBookrecord = /^L[1-9]\d*C\([1-9]\d*\).*$/
  // const originalFileName = "L236C(1)-fasdf.jpg"
  // const teste = regexBookCoverInsertBookrecord.test(originalFileName.toUpperCase())
  // let objFileName

  // console.log("&&&&&&&:", teste)
  // if (regexBookCoverInsertBookrecord.test(originalFileName.toUpperCase())) {
  //   const arrayFileName = originalFileName
  //     .substring(1)           // tira o "L"
  //     .split(/[()\.]/)       // quebra em F, (, ) e .
  //     .filter(Boolean);       // remove strings vazias
  //   console.log("ENTREI NO NOVO FORMATO @#@#@", arrayFileName)
  //   objFileName = {
  //     book: arrayFileName[0].replace("C", ""),
  //     sheet: 0,
  //     ext: path.extname(originalFileName).toLowerCase()//arrayFileName[3]
  //   }
  //   query.andWhere('book', objFileName.book)
  //   isCreateBookrecord = true

  //   console.log(">>>>", objFileName)
  // }

})
