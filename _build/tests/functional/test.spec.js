"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const processImage_1 = global[Symbol.for('ioc.use')]("App/Services/imageProcessing/processImage");
(0, runner_1.test)('test', async ({ client }) => {
    const inputImage = Application_1.default.tmpPath('/test2/ImagemLivro.jpg');
    const outputImage = Application_1.default.tmpPath('/test2/ImagemLivroAlterada.jpg');
    const result = await (0, processImage_1.processImage)(inputImage, outputImage);
    console.log('✅ OK ->', result);
});
//# sourceMappingURL=test.spec.js.map