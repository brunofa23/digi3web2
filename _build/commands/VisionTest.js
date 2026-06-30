"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
const promises_1 = require("fs/promises");
const googleVision_1 = require("../app/Services/ocr/googleVision");
class VisionTest extends standalone_1.BaseCommand {
    async run() {
        const imageBuffer = await (0, promises_1.readFile)(this.imagePath);
        const text = await (0, googleVision_1.extractDocumentTextFromBuffer)(imageBuffer);
        if (!text.trim()) {
            this.logger.warning('Nenhum texto encontrado.');
            return;
        }
        this.logger.info(text);
    }
}
VisionTest.commandName = 'vision:test';
VisionTest.description = 'Testa OCR do Google Cloud Vision em uma imagem local';
__decorate([
    standalone_1.args.string({ description: 'Caminho da imagem local para OCR' }),
    __metadata("design:type", String)
], VisionTest.prototype, "imagePath", void 0);
exports.default = VisionTest;
//# sourceMappingURL=VisionTest.js.map