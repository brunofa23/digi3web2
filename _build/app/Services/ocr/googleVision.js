"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOcrPageFromBuffer = exports.extractTextFromFileBuffer = exports.extractPdfOcrTextFromBuffer = exports.extractPdfSearchableTextFromBuffer = exports.extractDocumentTextFromBuffer = exports.extractDocumentOcrFromBuffer = void 0;
const vision_1 = __importDefault(require("@google-cloud/vision"));
const fs_1 = require("fs");
const path_1 = require("path");
const pdf_parse_1 = require("pdf-parse");
let client = null;
const PDF_OCR_MAX_PAGES = Number(process.env.OCR_PDF_MAX_PAGES || 5);
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
async function extractDocumentOcrFromBuffer(imageBuffer) {
    const [result] = await getClient().documentTextDetection({
        image: {
            content: imageBuffer,
        },
    });
    const page = result.fullTextAnnotation?.pages?.[0];
    const words = [];
    for (const block of page?.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
            for (const word of paragraph.words || []) {
                const text = (word.symbols || []).map((symbol) => symbol.text || '').join('').trim();
                const vertices = word.boundingBox?.vertices || [];
                const xs = vertices.map((vertex) => Number(vertex.x)).filter(Number.isFinite);
                const ys = vertices.map((vertex) => Number(vertex.y)).filter(Number.isFinite);
                if (!text || !xs.length || !ys.length)
                    continue;
                words.push({
                    text,
                    left: Math.min(...xs),
                    top: Math.min(...ys),
                    right: Math.max(...xs),
                    bottom: Math.max(...ys),
                    confidence: Number(word.confidence) || 0,
                });
            }
        }
    }
    return {
        text: result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || '',
        words,
        width: Number(page?.width) || 0,
        height: Number(page?.height) || 0,
    };
}
exports.extractDocumentOcrFromBuffer = extractDocumentOcrFromBuffer;
async function extractDocumentTextFromBuffer(imageBuffer) {
    return (await extractDocumentOcrFromBuffer(imageBuffer)).text;
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
    const result = await extractPdfSearchableTextAndPageCount(pdfBuffer);
    return result.text;
}
exports.extractPdfSearchableTextFromBuffer = extractPdfSearchableTextFromBuffer;
async function extractPdfSearchableTextAndPageCount(pdfBuffer) {
    const parser = new pdf_parse_1.PDFParse({ data: pdfBuffer });
    try {
        const result = await parser.getText();
        const text = normalizeExtractedText(result?.text || '');
        const totalPages = Number(result?.total || result?.pages?.length || 0);
        return {
            text: text.length >= 10 ? text : '',
            totalPages: Number.isInteger(totalPages) && totalPages > 0 ? totalPages : null,
        };
    }
    finally {
        await parser.destroy();
    }
}
function getPdfOcrPageLimit(totalPages) {
    const maxPages = Number.isInteger(PDF_OCR_MAX_PAGES) && PDF_OCR_MAX_PAGES > 0
        ? Math.min(PDF_OCR_MAX_PAGES, 5)
        : 5;
    return totalPages ? Math.min(totalPages, maxPages) : maxPages;
}
async function extractPdfOcrTextFromBuffer(pdfBuffer, totalPages = null) {
    const pageLimit = getPdfOcrPageLimit(totalPages);
    const pages = Array.from({ length: pageLimit }, (_, index) => index + 1);
    const [result] = await getClient().batchAnnotateFiles({
        requests: [{
                inputConfig: {
                    content: pdfBuffer,
                    mimeType: 'application/pdf',
                },
                features: [{
                        type: 'DOCUMENT_TEXT_DETECTION',
                    }],
                pages,
            }],
    });
    const responses = result.responses?.[0]?.responses || [];
    const texts = responses
        .map((responseItem) => responseItem.fullTextAnnotation?.text || responseItem.textAnnotations?.[0]?.description || '')
        .filter((text) => text.trim());
    return normalizeExtractedText(texts.join('\n\n'));
}
exports.extractPdfOcrTextFromBuffer = extractPdfOcrTextFromBuffer;
async function extractTextFromFileBuffer(fileBuffer, fileNameOrExtension) {
    const normalizedFileName = String(fileNameOrExtension || '').toLowerCase();
    if (normalizedFileName === 'pdf' || normalizedFileName.endsWith('.pdf')) {
        const searchable = await extractPdfSearchableTextAndPageCount(fileBuffer);
        if (searchable.text)
            return searchable.text;
        try {
            return await extractPdfOcrTextFromBuffer(fileBuffer, searchable.totalPages);
        }
        catch {
            return '';
        }
    }
    return extractDocumentTextFromBuffer(fileBuffer);
}
exports.extractTextFromFileBuffer = extractTextFromFileBuffer;
async function extractOcrPageFromBuffer(fileBuffer, fileNameOrExtension) {
    if (String(fileNameOrExtension || '').toLowerCase().endsWith('.pdf')) {
        return { text: await extractTextFromFileBuffer(fileBuffer, fileNameOrExtension), words: [], width: 0, height: 0 };
    }
    return extractDocumentOcrFromBuffer(fileBuffer);
}
exports.extractOcrPageFromBuffer = extractOcrPageFromBuffer;
//# sourceMappingURL=googleVision.js.map