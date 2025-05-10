"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageProcessing = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
async function imageProcessing(inputImage) {
    const dir = path_1.default.dirname(inputImage);
    const ext = path_1.default.extname(inputImage);
    const base = path_1.default.basename(inputImage, ext);
    const tempImage = path_1.default.join(dir, `${base}_processed${ext}`);
    try {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        console.log("Passo 1: Iniciando o processamento da imagem...");
        const buffer = await (0, sharp_1.default)(inputImage)
            .resize({ width: 2400, withoutEnlargement: true })
            .modulate({ brightness: 1.12, saturation: 1.05 })
            .linear(1.25, -15)
            .sharpen(1.5, 1.0, 0.4)
            .blur(0.3)
            .median(3)
            .normalize()
            .toBuffer();
        await (0, sharp_1.default)(buffer)
            .trim({ threshold: 10 })
            .extend({
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
            background: { r: 0, g: 0, b: 0 }
        })
            .sharpen(1.0, 0.5, 0.25)
            .toFile(tempImage);
        fs_1.default.unlinkSync(inputImage);
        fs_1.default.renameSync(tempImage, inputImage);
        console.log("Passo 2: Imagem recortada e processada com sucesso!");
    }
    catch (err) {
        console.error("Erro ao processar e recortar imagem:", err);
        if (fs_1.default.existsSync(tempImage)) {
            fs_1.default.unlinkSync(tempImage);
        }
    }
}
exports.imageProcessing = imageProcessing;
//# sourceMappingURL=imageProcessing.js.map