import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Document from 'App/Models/Document'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Indeximage from 'App/Models/Indeximage'
import Database from '@ioc:Adonis/Lucid/Database'
import BadRequest from 'App/Exceptions/BadRequestException'
const fileRename = require('../../Services/fileRename/fileRename')


export default class DocumentsController {

    public async index({ auth, request, params, response }: HttpContextContract) {
        const documentPayload = request.only(Document.fillable)
        try {
            const data = await Document.all()//.whereILike('stringfield1', `%${documentPayload.stringfield1}%`)
            return response.status(200).send(data)
        } catch (error) {
            return error
        }
    }

    public async store({ auth, request, params, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const documentPayload = request.only(Document.fillable)
        documentPayload.companies_id = authenticate.companies_id
        try {
            const data = await Document.create(documentPayload)
            return response.status(201).send(data)
        } catch (error) {
            //return error
            throw new BadRequestException('Bad Request', 401, error)
        }
    }

    public async update({ auth, request, params, response }: HttpContextContract) {

        const { companies_id } = await auth.use('api').authenticate()
        const body = request.only(Document.fillable)
        body.id = params.id
        body.companies_id = companies_id

        try {
            const data = await Document.findOrFail(body.id)
            await data.fill(body).save()
            return response.status(201).send({ data, params: params.id })
        } catch (error) {
            throw new BadRequestException('Bad Request', 401, error)
        }
    }


    public async destroy({ auth, request, params, response }: HttpContextContract) {

        const { companies_id } = await auth.use('api').authenticate()
        try {
            //excluir imagens do google drive
            const listOfImagesToDeleteGDrive = await Indeximage.query()
                .preload('typebooks')
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('documents_id', "=", params.id)
                .andWhere('companies_id', "=", companies_id)


            if (listOfImagesToDeleteGDrive.length > 0) {
                var file_name = listOfImagesToDeleteGDrive.map(function (item) {
                    return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
                });
                fileRename.deleteFile(file_name)
            }

            await Indeximage.query()
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('bookrecords_id', "=", params.id)
                .andWhere('companies_id', "=", companies_id).delete()

            const data = await Document.query()
                .where('id', "=", params.id)
                .andWhere('typebooks_id', '=', params.typebooks_id)
                .andWhere('companies_id', "=", companies_id).delete()

            return response.status(201).send({ data, message: "Excluido com sucesso!!" })
        } catch (error) {
            return error

        }

    }


    //EXCLUSÃO EM LOTES
    public async destroyManyBookRecords({ auth, request, response }: HttpContextContract) {
        const { companies_id } = await auth.use('api').authenticate()
        const { typebooks_id, Box, startCod, endCod, deleteImages } = request.only(['typebooks_id', 'Box', 'startCod', 'endCod', 'deleteImages'])

        //deleteImages
        //se 1  = exclui somente o livro
        //se 2 = exclui somente as imagens
        //se 3 = exclui imagens e livro

        async function deleteIndexImages() {
            try {
                const deleteData = await Indeximage
                    .query()
                    .delete()
                    .whereIn("documents_id",
                        Database.from('documents')
                            .select('id')
                            .where('typebooks_id', '=', typebooks_id)
                            .andWhere('companies_id', '=', companies_id)
                            .whereRaw(query))
                return response.status(201).send({ deleteData })
            } catch (error) {
                return error
            }

        }

        async function deleteBookrecord() {
            try {
                const data = await Document
                    .query()
                    .where('typebooks_id', '=', typebooks_id)
                    .andWhere('companies_id', '=', companies_id)
                    .whereRaw(query)
                    .delete()
                return response.status(201).send({ data })
            } catch (error) {
                return error
            }
        }

        async function deleteImagesGoogle() {
            try {
                const listOfImagesToDeleteGDrive = await Indeximage
                    .query()
                    .preload('typebooks')
                    .whereIn("documents_id",
                        Database.from('documents')
                            .select('id')
                            .where('typebooks_id', '=', typebooks_id)
                            .andWhere('companies_id', '=', companies_id)
                            .whereRaw(query))
                if (listOfImagesToDeleteGDrive.length > 0) {
                    var file_name = listOfImagesToDeleteGDrive.map(function (item) {
                        return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
                    });
                    fileRename.deleteFile(file_name)
                }
            } catch (error) {
                return error
            }

        }

        let query = '1 = 1'
        if (Box == undefined)
            return null
        if (typebooks_id != undefined) {
            if (Box != undefined) {
                query += ` and book=${Box} `
            }
            if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
                query += ` and cod>=${startCod} and cod <=${endCod} `

            try {
                //se 1  = exclui somente o livro
                if (deleteImages == 1) {
                    await deleteIndexImages()
                    await deleteBookrecord()
                }
                //se 2 = exclui somente as imagens
                else if (deleteImages == 2) {
                    await deleteImagesGoogle()
                    await deleteIndexImages()
                }
                //se 3 = exclui imagens e livro
                else if (deleteImages == 3) {
                    await deleteImagesGoogle()
                    await deleteIndexImages()
                    await deleteBookrecord()
                }
            } catch (error) {
                throw new BadRequest('Bad Request update', 401, 'bookrecord_error_102')
            }

        }
    }

    //***************************************************** */
}
