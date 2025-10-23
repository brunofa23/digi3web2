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
        const pdfDoc = await pdf_lib_1.PDFDocument.load(bytes);
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
        try {
            await execFileAsync('gs', args, { maxBuffer: 1024 * 1024 * 64 });
        }
        catch (err) {
            const msg = err?.stderr?.toString?.() || err?.message || String(err);
            throw new Error(`Ghostscript falhou: ${msg}`);
        }
    }
    static async compressIfScanned(inputPath) {
        const isScanned = await this.isScannedPdf(inputPath);
        const { dir, name, ext } = node_path_1.default.parse(inputPath);
        const outputPath = node_path_1.default.join(dir, `${name}c${ext}`);
        if (!isScanned) {
            const bytes = fs_1.default.readFileSync(inputPath);
            const pdfDoc = await pdf_lib_1.PDFDocument.load(bytes);
            const saved = await pdfDoc.save({ useObjectStreams: true });
            fs_1.default.writeFileSync(outputPath, saved);
            return outputPath;
        }
        await this.compressWithGhostscript(inputPath, outputPath);
        return outputPath;
    }
}
exports.default = PdfOptimizer;
//# sourceMappingURL=PdfOptimizer.js.map