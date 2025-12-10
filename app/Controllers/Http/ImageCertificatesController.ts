// app/Controllers/Http/UploadImagesController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { uploadImage } from 'App/Services/uploads/uploadImages'

export default class ImageCertificatesController {

  public async store({auth, request, response }: HttpContextContract) {
    console.log("CONTROLLER UPLOAD")

    const authenticate = await auth.use('api').authenticate()
    try {
      const companiesId = authenticate.companies_id

      if (!companiesId) {
        return response.badRequest({ error: 'companyId inválido nos parâmetros da rota' })
      }

      // marriedCertificateId pode vir no body (form-data ou json)
      const marriedCertificateIdInput = request.input('marriedCertificateId')
      const marriedCertificateId = marriedCertificateIdInput
        ? Number(marriedCertificateIdInput)
        : null

        console.log("marriedCertificateId", marriedCertificateId)


      const result = await uploadImage(companiesId, marriedCertificateId, request)

      if (!result) {
        return response.badRequest({ error: 'Arquivo inválido ou não enviado' })
      }

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error(error)
      return response.internalServerError({
        error: 'Erro ao fazer upload da imagem',
        details: error.message,
      })
    }
  }
}
