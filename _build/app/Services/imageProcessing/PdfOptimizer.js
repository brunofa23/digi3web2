"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const pdf_lib_1 = require("pdf-lib");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
async function tryExec(cmd, args) {
    try {
        const { stdout, stderr } = await execFileAsync(cmd, args, { maxBuffer: 1024 * 1024 * 16 });
        return { ok: true, stdout, stderr };
    }
    catch (e) {
        return { ok: false, error: e, stdout: e?.stdout?.toString?.(), stderr: e?.stderr?.toString?.() };
    }
}
function fileSizeBytes(filePath) {
    return fs_1.default.existsSync(filePath) ? fs_1.default.statSync(filePath).size : 0;
}
async function normalizePdf(inputPath) {
    const { dir, name, ext } = node_path_1.default.parse(inputPath);
    const tmp = node_path_1.default.join(dir, `${name}.norm.tmp${ext}`);
    const qpdfVer = await tryExec('qpdf', ['--version']);
    if (qpdfVer.ok) {
        const res = await tryExec('qpdf', ['--decrypt', '--object-streams=generate', '--linearize', inputPath, tmp]);
        if (res.ok && fs_1.default.existsSync(tmp) && fileSizeBytes(tmp) > 0)
            return tmp;
    }
    const muVer = await tryExec('mutool', ['-v']);
    if (muVer.ok) {
        const res = await tryExec('mutool', ['clean', '-gggg', inputPath, tmp]);
        if (res.ok && fs_1.default.existsSync(tmp) && fileSizeBytes(tmp) > 0)
            return tmp;
    }
    return inputPath;
}
async function compressWithGhostscriptNeutral(input, output) {
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
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${output}`,
        input,
    ];
    const r = await tryExec('gs', args);
    if (!r.ok)
        throw new Error(`Ghostscript (neutral) falhou: ${r.stderr || r.stdout || r.error?.message}`);
}
class PdfOptimizer {
    static async verificarSeEhPDF(filePath) {
        if (!fs_1.default.existsSync(filePath)) {
            return { valido: false, motivo: 'Arquivo não encontrado.' };
        }
        const ext = node_path_1.default.extname(filePath).toLowerCase();
        if (ext !== '.pdf') {
            return { valido: false, motivo: 'Arquivo não é um PDF.' };
        }
        const assinatura = Buffer.alloc(4);
        const fd = fs_1.default.openSync(filePath, 'r');
        fs_1.default.readSync(fd, assinatura, 0, 4, 0);
        fs_1.default.closeSync(fd);
        if (assinatura.toString() !== '%PDF') {
            return { valido: false, motivo: 'Arquivo não possui assinatura de PDF.' };
        }
        return { valido: true, motivo: 'Arquivo PDF válido.' };
    }
    static async isScannedPdf(filePath) {
        const bytes = fs_1.default.readFileSync(filePath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(bytes, {
            ignoreEncryption: true,
            throwOnInvalidObject: false,
        });
        const ctx = pdfDoc.context;
        let img = 0;
        let txt = 0;
        for (const [, obj] of ctx.enumerateIndirectObjects()) {
            const s = obj.toString();
            if (s.includes('/Image'))
                img++;
            if (/\b(Tj|TJ|BT|ET)\b/.test(s))
                txt++;
        }
        return img > 0 && txt < 3;
    }
    static async compressWithGhostscript(input, output) {
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
        ];
        const r = await tryExec('gs', args);
        if (!r.ok) {
            const msg = r.stderr || r.stdout || r.error?.message || 'Falha desconhecida';
            throw new Error(`Ghostscript falhou: ${msg}`);
        }
    }
    static async compressIfScanned(inputPath) {
        const isScanned = await this.isScannedPdf(inputPath);
        const { dir, name, ext } = node_path_1.default.parse(inputPath);
        const outputPath = node_path_1.default.join(dir, `${name}c${ext}`);
        if (fs_1.default.existsSync(outputPath)) {
            try {
                fs_1.default.unlinkSync(outputPath);
            }
            catch { }
        }
        const normalized = await normalizePdf(inputPath);
        try {
            if (isScanned) {
                await this.compressWithGhostscript(normalized, outputPath);
            }
            else {
                await compressWithGhostscriptNeutral(normalized, outputPath);
            }
        }
        catch (e) {
            try {
                fs_1.default.copyFileSync(inputPath, outputPath);
            }
            catch { }
        }
        return outputPath;
    }
}
exports.default = PdfOptimizer;
//# sourceMappingURL=PdfOptimizer.js.map