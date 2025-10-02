"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
(0, runner_1.test)('test', async ({ client }) => {
    const regexBookCoverInsertBookrecord = /^L([1-9]\d*)C\(([1-9]\d*)\)([a-zA-Z]*)\.(.+)$/i;
    const originalFileName = "L123c(1).JPG";
    let objFileName;
    if (regexBookCoverInsertBookrecord.test(originalFileName.toUpperCase())) {
        console.log("entrei no ccccc");
        const match = originalFileName.match(regexBookCoverInsertBookrecord);
        if (match) {
            objFileName = {
                book: match[1],
                sheet: match[2],
                letter: match[3] || "",
                ext: "." + match[4].toLowerCase(),
            };
            console.log("ENTROU NO TEST!!!", objFileName);
            return;
        }
    }
});
//# sourceMappingURL=test.spec.js.map