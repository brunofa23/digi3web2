"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const path_1 = __importDefault(require("path"));
(0, runner_1.test)('test', async ({ client }) => {
    const originalFileName = "P1(0)F - Copia.jpg";
    const regexDocumentAndProt = /^P(\d+)\((\d+)\)(.*?)(?:\.[^.]+)?$/i;
    const teste = regexDocumentAndProt.test(originalFileName.toUpperCase());
    console.log("!!!!", teste);
    const match = originalFileName.match(regexDocumentAndProt);
    if (match) {
        const objFileName1 = {
            book: match[1],
            prot: match[2],
            obs: match[3]?.trim() || null,
            ext: path_1.default.extname(originalFileName).toLowerCase(),
        };
        console.log("Resultado:", objFileName1);
    }
    else {
        console.log("❌ Nenhum padrão reconhecido no nome do arquivo.");
    }
});
//# sourceMappingURL=test.spec.js.map