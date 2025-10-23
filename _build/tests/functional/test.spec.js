"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const PdfOptimizer_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/imageProcessing/PdfOptimizer"));
(0, runner_1.test)('test', async ({ client }) => {
    console.log("sucesso!!");
    const inputImage = Application_1.default.tmpPath('/test2/ContaLuz.pdf');
    const outputImage = Application_1.default.tmpPath('/test2/optimized.pdf');
    console.log("input>>", inputImage);
    const teste = await PdfOptimizer_1.default.compressIfScanned(inputImage);
    console.log("retorno", teste);
});
//# sourceMappingURL=test.spec.js.map