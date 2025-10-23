import fs from 'fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { PDFDocument } from 'pdf-lib'

const execFileAsync = promisify(execFile)

export default class PdfOptimizer {

  public static async verificarSeEhPDF(filePath) {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return { valido: false, motivo: 'Arquivo não encontrado.' }
    }

    // Verifica extensão
    const ext = path.extname(filePath).toLowerCase()
    if (ext !== '.pdf') {
      return { valido: false, motivo: 'Arquivo não é um PDF.' }
    }

    // Verifica o tipo MIME (opcional, para maior segurança)
    const assinatura = Buffer.alloc(4)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, assinatura, 0, 4, 0)
    fs.closeSync(fd)

    // PDF começa sempre com "%PDF"
    if (assinatura.toString() !== '%PDF') {
      return { valido: false, motivo: 'Arquivo não possui assinatura de PDF.' }
    }

    return { valido: true, motivo: 'Arquivo PDF válido.' }
  }


  /**
   * Detecta se o PDF é escaneado (imagens) ou possui texto/OCR.
   * Heurística: conta /Image e comandos de texto (Tj/TJ/BT/ET).
   */
  public static async isScannedPdf(filePath: string): Promise<boolean> {
    console.log("IS SCANED STEP 1@", filePath)
    const bytes = fs.readFileSync(filePath)
    console.log("IS SCANED STEP 2.1@")
    const pdfDoc = await PDFDocument.load(bytes)
    console.log("IS SCANED STEP 2.2@")
    const ctx = pdfDoc.context

    console.log("IS SCANED STEP 2.3@")

    let img = 0
    let txt = 0
    for (const [, obj] of ctx.enumerateIndirectObjects()) {
      const s = obj.toString()
      if (s.includes('/Image')) img++
      if (/\b(Tj|TJ|BT|ET)\b/.test(s)) txt++
    }

    console.log("IS SCANED STEP 3@")
    console.log(`📊 Detecção: ${img} imagens, ${txt} blocos de texto`)
    // Considera escaneado se tem imagem e quase nenhum texto
    return img > 0 && txt < 3
  }

  /**
   * Comprime PDF usando Ghostscript.
   * - Mantém texto/OCR (não rasteriza texto).
   * - Recomprime apenas imagens embutidas.
   */
  private static async compressWithGhostscript(input: string, output: string) {
    // Parâmetros equilibrados (ajuste conforme sua necessidade)
    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      '-dPDFSETTINGS=/ebook',              // /screen (mais leve) /ebook /printer /prepress
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',
      '-dEmbedAllFonts=true',
      '-dColorImageDownsampleType=/Bicubic',
      '-dColorImageResolution=150',       // ajuste (120–200) conforme qualidade
      '-dGrayImageDownsampleType=/Bicubic',
      '-dGrayImageResolution=150',
      '-dMonoImageDownsampleType=/Subsample',
      '-dMonoImageResolution=300',
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${output}`,
      input,
    ]

    try {
      await execFileAsync('gs', args, { maxBuffer: 1024 * 1024 * 64 }) // 64MB de stdout/stderr
    } catch (err: any) {
      // se falhar, propaga erro legível
      const msg = err?.stderr?.toString?.() || err?.message || String(err)
      throw new Error(`Ghostscript falhou: ${msg}`)
    }
  }

  /**
   * Se for escaneado → comprime com gs.
   * Se tiver texto/OCR → só regrava (sem perda) para limpar estruturas.
   */
  public static async compressIfScanned(inputPath: string): Promise<void|string> {
    // const verify = await this.verificarSeEhPDF(inputPath)
    // if (!verify.valido) {
    //   console.log("NÃO É PDF")
    //   return
    // }

    console.log("passo 1 ###")
    console.log('🔎 Analisando PDF:', inputPath)
    console.log("passo 1.1 ###")
    const isScanned = await this.isScannedPdf(inputPath)
    console.log("passo 1.2 ###")

    // 🔹 Gera automaticamente o nome do novo arquivo com "c" no final
    const { dir, name, ext } = path.parse(inputPath)
    const outputPath = path.join(dir, `${name}c${ext}`)


    if (!isScanned) {
      console.log("passo 2 ###")
      console.log('📄 PDF com texto/OCR — regravando sem compressão agressiva...')
      const bytes = fs.readFileSync(inputPath)
      const pdfDoc = await PDFDocument.load(bytes)
      const saved = await pdfDoc.save({ useObjectStreams: true })
      fs.writeFileSync(outputPath, saved)

      const orig = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2)
      const out = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
      console.log(`✅ Regravado: ${orig} MB → ${out} MB`)
      return outputPath
    }

    console.log("passo 3 ###")
    console.log('🖼️ PDF escaneado — comprimindo com Ghostscript...')
    await this.compressWithGhostscript(inputPath, outputPath)

    const orig = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2)
    const out = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
    console.log(`✅ Compressão concluída: ${orig} MB → ${out} MB`)
    console.log("passo 4 ###")
    return outputPath

  }

}
