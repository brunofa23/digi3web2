import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import { readFile } from 'fs/promises'
import { extractDocumentTextFromBuffer } from '../app/Services/ocr/googleVision'

export default class VisionTest extends BaseCommand {
  public static commandName = 'vision:test'
  public static description = 'Testa OCR do Google Cloud Vision em uma imagem local'

  @args.string({ description: 'Caminho da imagem local para OCR' })
  public imagePath: string

  public async run() {
    const imageBuffer = await readFile(this.imagePath)
    const text = await extractDocumentTextFromBuffer(imageBuffer)

    if (!text.trim()) {
      this.logger.warning('Nenhum texto encontrado.')
      return
    }

    this.logger.info(text)
  }
}
