import fs from 'fs'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'

export default class PdfOptimizer {
  /**
   * Verifica se o PDF é escaneado (imagem) ou OCR/textual.
   * Retorna true se for escaneado.
   */
  public static async isScannedPdf(filePath: string): Promise<boolean> {
    const bytes = fs.readFileSync(filePath)
    const pdfDoc = await PDFDocument.load(bytes)
    const context = pdfDoc.context

    let hasText = false
    let hasImage = false

    for (const [, obj] of context.enumerateIndirectObjects()) {
      const str = obj.toString()

      // Procura por comandos e fontes de texto
      if (str.includes('/Font') || str.match(/\b(Tj|TJ|BT|ET)\b/)) {
        hasText = true
      }
      // Procura por objetos de imagem
      if (str.includes('/Image')) {
        hasImage = true
      }
    }

    // Se tem imagem e não tem texto, consideramos escaneado
    return hasImage && !hasText
  }

  /**
   * Compacta o PDF apenas se ele for escaneado.
   * Mantém o original se for OCR/textual.
   */
  public static async compressIfScanned(inputPath: string, outputPath: string): Promise<void> {
    console.log('🔎 Analisando PDF:', inputPath)

    const isScanned = await this.isScannedPdf(inputPath)

    if (!isScanned) {
      console.log('📄 PDF contém texto/OCR — não será comprimido.')
      fs.copyFileSync(inputPath, outputPath)
      return
    }

    console.log('🖼️ PDF escaneado detectado — iniciando compressão...')

    // Lê o PDF original
    const buffer = fs.readFileSync(inputPath)

    // ⚠️ Compressão básica: recompressão global (funciona para PDFs 100% imagem)
    // Para PDFs multi-página ou com imagens embutidas, a otimização real exige extração de imagens individuais
    const compressedBuffer = await sharp(buffer)
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer()

    // Grava resultado
    fs.writeFileSync(outputPath, compressedBuffer)

    // Mostra resultado
    const originalSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2)
    const optimizedSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
    console.log(`✅ Compressão concluída: ${originalSize} MB → ${optimizedSize} MB`)
  }
}
