"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
(0, runner_1.test)('test', async ({ client }) => {
    const regexBookSheetSideInsertBookrecord = /^l(\d+)f\((\d+)\)([vf])(\d)?[^.]*\.(\w+)$/i;
    const examples = [
        "L123F(1)f.JPG",
        "L123F(1)v1.JPG",
        "L123F(1)f155aaaa.JPG",
        "L123F(1)V-primeira.JPG",
        "l10f(3)F3extra.png"
    ];
    const originalFileName = "L123F(1)f155aaaa.JPG";
    const match = originalFileName.match(regexBookSheetSideInsertBookrecord);
    if (match) {
        const objFileName = {
            book: match[1],
            sheet: match[2],
            side: match[3].toUpperCase(),
            indexbook: match[4] ? Number(match[4]) : null,
            ext: "." + match[5].toLowerCase(),
        };
        console.log("✅ VALIDADO:", originalFileName, objFileName);
    }
    else {
        console.log("❌ NÃO ENTRA NO FORMATO:", originalFileName);
    }
});
//# sourceMappingURL=test.spec.js.map