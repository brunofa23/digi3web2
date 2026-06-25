"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDocumentTextFromBuffer = void 0;
const vision_1 = __importDefault(require("@google-cloud/vision"));
const fs_1 = require("fs");
const path_1 = require("path");
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
//# sourceMappingURL=googleVision.js.map