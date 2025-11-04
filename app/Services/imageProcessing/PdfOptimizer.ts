import fs from 'fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { PDFDocument } from 'pdf-lib'

const execFileAsync = promisify(execFile)

/** Utilitário: executa binário e captura stdout/stderr sem quebrar a app */
async function tryExec(cmd: string, args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { maxBuffer: 1024 * 1024 * 16 })
    return { ok: true, stdout, stderr }
  } catch (e: any) {
    return { ok: false, error: e, stdout: e?.stdout?.toString?.(), stderr: e?.stderr?.toString?.() }
  }
}

function fileSizeBytes(filePath: string): number {
  return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
}

/** Normaliza/Repara PDF com qpdf ou mutool, se disponíveis */
async function normalizePdf(inputPath: string): Promise<string> {
  const { dir, name, ext } = path.parse(inputPath)
  const tmp = path.join(dir, `${name}.norm.tmp${ext}`)

  // qpdf
  const qpdfVer = await tryExec('qpdf', ['--version'])
  if (qpdfVer.ok) {
    const res = await tryExec('qpdf', ['--decrypt', '--object-streams=generate', '--linearize', inputPath, tmp])
    if (res.ok && fs.existsSync(tmp) && fileSizeBytes(tmp) > 0) return tmp
  }

  // mutool
  const muVer = await tryExec('mutool', ['-v'])
  if (muVer.ok) {
    const res = await tryExec('mutool', ['clean', '-gggg', inputPath, tmp])
    if (res.ok && fs.existsSync(tmp) && fileSizeBytes(tmp) > 0) return tmp
  }

  return inputPath
}

/** Ghostscript "neutral" (regrava/compacta sem perda agressiva — bom p/ PDFs com texto) */
async function compressWithGhostscriptNeutral(input: string, output: string) {
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.6',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dSubsetFonts=true',
    '-dEmbedAllFonts=true',
    '-dColorImageDownsampleType=/Bicubic',
    '-dGrayImageDownsampleType=/Bicubic',
    '-dMonoImageDownsampleType=/Bicubic',
    // sem forçar resoluções aqui (neutral)
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${output}`,
    input,
  ]
  const r = await tryExec('gs', args)
  if (!r.ok) throw new Error(`Ghostscript (neutral) falhou: ${r.stderr || r.stdout || r.error?.message}`)
}

export default class PdfOptimizer {

  public static async verificarSeEhPDF(filePath) {
    if (!fs.existsSync(filePath)) {
      return { valido: false, motivo: 'Arquivo não encontrado.' }
    }

    const ext = path.extname(filePath).toLowerCase()
    if (ext !== '.pdf') {
      return { valido: false, motivo: 'Arquivo não é um PDF.' }
    }

    const assinatura = Buffer.alloc(4)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, assinatura, 0, 4, 0)
    fs.closeSync(fd)

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
    const bytes = fs.readFileSync(filePath)
    // carregamento tolerante para evitar quebra em PDFs "esquisitos"
    const pdfDoc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    })
    const ctx = pdfDoc.context
    let img = 0
    let txt = 0
    for (const [, obj] of ctx.enumerateIndirectObjects()) {
      const s = obj.toString()
      if (s.includes('/Image')) img++
      if (/\b(Tj|TJ|BT|ET)\b/.test(s)) txt++
    }
    return img > 0 && txt < 3
  }

  /**
   * Comprime PDF usando Ghostscript (perfil "ebook" – bom para escaneados).
   * Mantém texto/OCR e recomprime apenas imagens embutidas.
   */
  private static async compressWithGhostscript(input: string, output: string) {
    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      '-dPDFSETTINGS=/ebook',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',
      '-dEmbedAllFonts=true',
      '-dColorImageDownsampleType=/Bicubic',
      '-dColorImageResolution=150',
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

    const r = await tryExec('gs', args)
    if (!r.ok) {
      const msg = r.stderr || r.stdout || r.error?.message || 'Falha desconhecida'
      throw new Error(`Ghostscript falhou: ${msg}`)
    }
  }

  /**
   * Se for escaneado → GS "ebook".
   * Se tiver texto/OCR → normaliza e regrava com GS "neutral" (sem usar pdf-lib.save()).
   * Retorna sempre o caminho de saída.
   */
  public static async compressIfScanned(inputPath: string): Promise<void | string> {
    const isScanned = await this.isScannedPdf(inputPath)

    const { dir, name, ext } = path.parse(inputPath)
    const outputPath = path.join(dir, `${name}c${ext}`)

    // remove output prévio
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath) } catch {}
    }

    // Normaliza antes (ajuda em PDFs com árvore /Pages problemática)
    const normalized = await normalizePdf(inputPath)

    // Escolhe perfil conforme heurística
    try {
      if (isScanned) {
        await this.compressWithGhostscript(normalized, outputPath) // perfil "ebook"
      } else {
        await compressWithGhostscriptNeutral(normalized, outputPath) // perfil "neutral"
      }
    } catch (e) {
      // Fallback final: se algo falhar, tenta pelo menos copiar o original p/ manter contrato
      try {
        fs.copyFileSync(inputPath, outputPath)
      } catch {}
    }

    return outputPath
  }

}
