"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromFileBuffer = exports.extractPdfSearchableTextFromBuffer = exports.extractDocumentTextFromBuffer = void 0;
const vision_1 = __importDefault(require("@google-cloud/vision"));
const fs_1 = require("fs");
const path_1 = require("path");
const pdf_parse_1 = require("pdf-parse");
let client = null;
function getClient() {
    if (!client) {
        const defaultKeyFilename = (0, path_1.join)(process.cwd(), 'config', 'credentials', 'google-vision-service-account.json');
        const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultKeyFilename;
        if (!(0, fs_1.existsSync)(keyFilename)) {
            throw new Error(`Credencial do Google Vision não encontrada em: ${keyFilename}`);
        }
        client = new vision_1.default.ImageAnnotatorClient({ keyFilename });
    }
    return client;
}
async function extractDocumentTextFromBuffer(imageBuffer) {
    const [result] = await getClient().documentTextDetection({
        image: {
            content: imageBuffer,
        },
    });
    return result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || '';
}
exports.extractDocumentTextFromBuffer = extractDocumentTextFromBuffer;
function normalizeExtractedText(value) {
    return String(value || '')
        .replace(/\r/g, '\n')
        .replace(/\n\s*--\s*\d+\s+of\s+\d+\s*--\s*/gi, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
async function extractPdfSearchableTextFromBuffer(pdfBuffer) {
    const parser = new pdf_parse_1.PDFParse({ data: pdfBuffer });
    try {
        const result = await parser.getText();
        const text = normalizeExtractedText(result?.text || '');
        return text.length >= 10 ? text : '';
    }
    finally {
        await parser.destroy();
    }
}
exports.extractPdfSearchableTextFromBuffer = extractPdfSearchableTextFromBuffer;
async function extractTextFromFileBuffer(fileBuffer, fileNameOrExtension) {
    const normalizedFileName = String(fileNameOrExtension || '').toLowerCase();
    if (normalizedFileName === 'pdf' || normalizedFileName.endsWith('.pdf')) {
        return extractPdfSearchableTextFromBuffer(fileBuffer);
    }
    return extractDocumentTextFromBuffer(fileBuffer);
}
exports.extractTextFromFileBuffer = extractTextFromFileBuffer;
//# sourceMappingURL=googleVision.js.map