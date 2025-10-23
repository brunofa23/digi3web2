"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const pdf_lib_1 = require("pdf-lib");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
class PdfOptimizer {
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
        console.log(`📊 Detecção: ${img} imagens, ${txt} blocos de texto`);
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
    static async compressIfScanned(inputPath, outputPath) {
        console.log('🔎 Analisando PDF:', inputPath);
        const isScanned = await this.isScannedPdf(inputPath);
        if (!isScanned) {
            console.log('📄 PDF com texto/OCR — regravando sem compressão agressiva...');
            const bytes = fs_1.default.readFileSync(inputPath);
            const pdfDoc = await pdf_lib_1.PDFDocument.load(bytes);
            const saved = await pdfDoc.save({ useObjectStreams: true });
            fs_1.default.writeFileSync(outputPath, saved);
            const orig = (fs_1.default.statSync(inputPath).size / 1024 / 1024).toFixed(2);
            const out = (fs_1.default.statSync(outputPath).size / 1024 / 1024).toFixed(2);
            console.log(`✅ Regravado: ${orig} MB → ${out} MB`);
            return;
        }
        console.log('🖼️ PDF escaneado — comprimindo com Ghostscript...');
        await this.compressWithGhostscript(inputPath, outputPath);
        const orig = (fs_1.default.statSync(inputPath).size / 1024 / 1024).toFixed(2);
        const out = (fs_1.default.statSync(outputPath).size / 1024 / 1024).toFixed(2);
        console.log(`✅ Compressão concluída: ${orig} MB → ${out} MB`);
    }
}
exports.default = PdfOptimizer;
//# sourceMappingURL=PdfOptimizer.js.map