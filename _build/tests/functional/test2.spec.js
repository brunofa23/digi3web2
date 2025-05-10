"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
(0, runner_1.test)('test2', async ({ client }) => {
    const inputImage = Application_1.default.tmpPath(`transferir.jpeg`);
    const outputImage = Application_1.default.tmpPath('/test2/processed.jpg');
    const dir = path_1.default.dirname(outputImage);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    async function enhanceAndCropManuscript() {
        try {
            console.log("Passo 1: Iniciando o processamento da imagem com melhoria de contraste...");
            const buffer = await (0, sharp_1.default)(inputImage)
                .resize({ width: 2400, withoutEnlargement: true })
                .modulate({
                brightness: 1.12,
                saturation: 1.05
            })
                .linear(1.25, -15)
                .sharpen(1.5, 1.0, 0.4)
                .blur(0.3)
                .median(3)
                .normalize()
                .toBuffer();
            await (0, sharp_1.default)(buffer)
                .trim({ threshold: 12 })
                .extend({
                top: 10,
                bottom: 10,
                left: 10,
                right: 10,
                background: { r: 0, g: 0, b: 0 }
            })
                .toFile(outputImage);
            console.log("Passo 2: Imagem recortada e melhorada com sucesso!");
        }
        catch (err) {
            console.error("Erro ao processar e recortar imagem:", err);
        }
    }
    await enhanceAndCropManuscript();
    console.log("Processamento completo!");
});
//# sourceMappingURL=test2.spec.js.map