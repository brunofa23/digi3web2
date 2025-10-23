"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
function processImage(inputPath) {
    return new Promise((resolve, reject) => {
        const script = path_1.default.resolve(__dirname, './process_image.py');
        const { dir, name, ext } = path_1.default.parse(inputPath);
        const outputPath = path_1.default.join(dir, `${name}c${ext}`);
        const proc = (0, child_process_1.spawn)('python3', [script, inputPath, outputPath], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let out = '';
        let err = '';
        proc.stdout.on('data', (d) => (out += d.toString()));
        proc.stderr.on('data', (d) => (err += d.toString()));
        proc.on('close', (code) => {
            if (code === 0) {
                return resolve(out.trim() || outputPath);
            }
            reject(new Error(err || `process_image.py exited with code ${code}`));
        });
    });
}
exports.processImage = processImage;
//# sourceMappingURL=processImage.js.map