import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import { readFile } from "App/Services/readFile/readFile"
import Bookrecord from 'App/Models/Bookrecord'
import Document from 'App/Models/Document'
import Database from '@ioc:Adonis/Lucid/Database'
import { DeleteFiles } from 'App/Services/util'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'

function hasRequiredProperties(obj, properties) {
  return properties.every(property => obj.hasOwnProperty(property));
}
const requiredProperties = ['id', 'cod', 'book'];

export default class ReadFilesController {

  public async readFile({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { typebooks_id, books_id } = request.only(['typebooks_id', 'books_id'])
    const file = request.file('file', {
      size: '100mb',
      extnames: ['xls', 'xlsx', 'csv']
    })

    if (!file?.isValid || file === undefined) {
      return file?.errors
    }

    await file?.move(Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`))
    const filePath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}/${file.clientName}`)
    const bookrecords = await readFile(filePath)
    //validando se a planilha possui as colunas ['id', 'cod', 'book']
    const containsAll = requiredProperties.every(element => bookrecords.header.includes(element));
    if(!containsAll)
    {
      await DeleteFiles(filePath)
      return response.status(400).send('typebook_error_103')
    }
    //console.log("verificando>>", containsAll)
    for (const cell of bookrecords.header) {
      if(cell==='' || cell===undefined || cell===null)
      {
        console.log("Alguma coluna inválida:",cell)
        await DeleteFiles(filePath)
        return response.status(400).send('typebook_error_103')
      }
    }
    let totUpdate=0
    let totCreate=0
    const trx = await Database.beginGlobalTransaction()
    for (const bookrecord of bookrecords.data) {
      const hasProperties = hasRequiredProperties(bookrecord, requiredProperties);
      if (!hasProperties)
        continue
      try {

        const searchPayload = await Bookrecord.query()
          .where('id', bookrecord.id)
          .andWhere('typebooks_id', typebooks_id)
          .andWhere('books_id', books_id)
          .andWhere('companies_id', authenticate.companies_id).first()

        if (searchPayload) {
          await Bookrecord.query(trx)
            .where('id', bookrecord.id)
            .andWhere('typebooks_id', typebooks_id)
            .andWhere('books_id', books_id)
            .andWhere('companies_id', authenticate.companies_id)
            .update({ cod: bookrecord.cod, book: bookrecord.book })

          const update = await Document.query(trx)
            .where('bookrecords_id', bookrecord.id)
            .andWhere('typebooks_id', typebooks_id)
            .andWhere('books_id', books_id)
            .andWhere('companies_id', authenticate.companies_id)
            .update({
              bookrecords_id: bookrecord.id,
              typebooks_id: typebooks_id,
              books_id: books_id,
              companies_id: authenticate.companies_id,
              box2: bookrecord.box2,
              month: bookrecord.month,
              yeardoc: bookrecord.yeardoc,
              intfield1: bookrecord.intfield1,
              stringfield1: bookrecord.stringfield1,
              datefield1: bookrecord.datefield1,
              intfield2: bookrecord.intfield2,
              stringfield2: bookrecord.stringfield2,
              datefield2: bookrecord.datefield2,
              intfield3: bookrecord.intfield3,
              stringfield3: bookrecord.stringfield3,
              datefield3: bookrecord.datefield3,
              intfield4: bookrecord.intfield4,
              stringfield4: bookrecord.stringfield4,
              datefield4: bookrecord.datefield4,
              intfield5: bookrecord.intfield5,
              stringfield5: bookrecord.stringfield5,
              datefield5: bookrecord.datefield5,
              intfield6: bookrecord.intfield6,
              stringfield6: bookrecord.stringfield6,
              datefield6: bookrecord.datefield6,
              intfield7: bookrecord.intfield7,
              stringfield7: bookrecord.stringfield7,
              datefield7: bookrecord.datefield7,
              intfield8: bookrecord.intfield8,
              stringfield8: bookrecord.stringfield8,
              datefield8: bookrecord.datefield8,
              intfield9: bookrecord.intfield9,
              stringfield9: bookrecord.stringfield9,
              datefield9: bookrecord.datefield9,
              intfield10: bookrecord.intfield10,
              stringfield10: bookrecord.stringfield10,
              datefield10: bookrecord.datefield10,
              intfield11: bookrecord.intfield11,
              stringfield11: bookrecord.stringfield11,
              datefield11: bookrecord.datefield11,
              intfield12: bookrecord.intfield12,
              stringfield12: bookrecord.stringfield12,
              datefield12: bookrecord.datefield12,
              intfield13: bookrecord.intfield13,
              stringfield13: bookrecord.stringfield13,
              datefield13: bookrecord.datefield13
            })
            if(update)
              totUpdate++

        }
        else {//CREATE
          await Bookrecord.create({
            id: bookrecord.id,
            typebooks_id: typebooks_id,
            books_id: books_id,
            companies_id: authenticate.companies_id,
            cod: bookrecord.cod,
            book: bookrecord.book
          }, trx)

          const create = await Document.create({
            bookrecords_id: bookrecord.id,
            typebooks_id: typebooks_id,
            books_id: books_id,
            companies_id: authenticate.companies_id,
            box2: bookrecord.box2,
            month: bookrecord.month,
            yeardoc: bookrecord.yeardoc,
            intfield1: bookrecord.intfield1,
            stringfield1: bookrecord.stringfield1,
            datefield1: bookrecord.datefield1,
            intfield2: bookrecord.intfield2,
            stringfield2: bookrecord.stringfield2,
            datefield2: bookrecord.datefield2,
            intfield3: bookrecord.intfield3,
            stringfield3: bookrecord.stringfield3,
            datefield3: bookrecord.datefield3,
            intfield4: bookrecord.intfield4,
            stringfield4: bookrecord.stringfield4,
            datefield4: bookrecord.datefield4,
            intfield5: bookrecord.intfield5,
            stringfield5: bookrecord.stringfield5,
            datefield5: bookrecord.datefield5,
            intfield6: bookrecord.intfield6,
            stringfield6: bookrecord.stringfield6,
            datefield6: bookrecord.datefield6,
            intfield7: bookrecord.intfield7,
            stringfield7: bookrecord.stringfield7,
            datefield7: bookrecord.datefield7,
            intfield8: bookrecord.intfield8,
            stringfield8: bookrecord.stringfield8,
            datefield8: bookrecord.datefield8,
            intfield9: bookrecord.intfield9,
            stringfield9: bookrecord.stringfield9,
            datefield9: bookrecord.datefield9,
            intfield10: bookrecord.intfield10,
            stringfield10: bookrecord.stringfield10,
            datefield10: bookrecord.datefield10,
            intfield11: bookrecord.intfield11,
            stringfield11: bookrecord.stringfield11,
            datefield11: bookrecord.datefield11,
            intfield12: bookrecord.intfield12,
            stringfield12: bookrecord.stringfield12,
            datefield12: bookrecord.datefield12,
            intfield13: bookrecord.intfield13,
            stringfield13: bookrecord.stringfield13,
            datefield13: bookrecord.datefield13
          })
          if(create.id)
            totCreate++

        }
        await trx.commit()
      } catch (error) {
        await trx.rollback()
        throw error
      }

    }
    //EXCLUIR O ARQUIVO *****************************************
    await DeleteFiles(filePath)
    return response.status(201).send({resp:"Import Success!", totCreate, totUpdate})
  }
}
