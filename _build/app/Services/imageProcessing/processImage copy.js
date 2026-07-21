"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
function processImage(inputPath) {
    return new Promise((resolve, reject) => {
        try {
            if (!fs_1.default.existsSync(inputPath)) {
                return reject(new Error(`Arquivo não encontrado: ${inputPath}`));
            }
            const script = path_1.default.resolve(__dirname, './process_image.py');
            if (!fs_1.default.existsSync(script)) {
                return reject(new Error(`Script Python não encontrado: ${script}`));
            }
            const { dir, name, ext } = path_1.default.parse(inputPath);
            const outputPath = path_1.default.join(dir, `${name}c${ext}`);
            const proc = (0, child_process_1.spawn)('python3', [script, inputPath, outputPath], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            let out = '';
            let err = '';
            proc.stdout.on('data', (d) => (out += d.toString()));
            proc.stderr.on('data', (d) => (err += d.toString()));
            proc.on('error', (error) => {
                reject(new Error(`Erro ao executar Python: ${error.message}`));
            });
            proc.on('close', (code) => {
                if (code === 0) {
                    console.log("Processamento concluído com sucesso.");
                    return resolve(out.trim() || outputPath);
                }
                reject(new Error(err || `process_image.py saiu com código ${code}`));
            });
        }
        catch (error) {
            reject(new Error(`Erro inesperado: ${error.message}`));
        }
    });
}
exports.processImage = processImage;
//# sourceMappingURL=processImage%20copy.js.map