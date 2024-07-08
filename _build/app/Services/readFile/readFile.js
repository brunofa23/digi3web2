"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = __importDefault(require("xlsx"));
const path_1 = __importDefault(require("path"));
async function readFile(filePath = "") {
    const extension = path_1.default.extname(filePath).toLowerCase();
    if (extension === '.xls' || extension === '.xlsx' || extension === '.csv') {
        const workbook = xlsx_1.default.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx_1.default.utils.sheet_to_json(sheet);
        return data;
    }
    else {
        console.error('Unsupported file format.');
    }
}
module.exports = { readFile };
//# sourceMappingURL=readFile.js.map