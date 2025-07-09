"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPermission = exports.currencyConverter = exports.logInJson = exports.DeleteFiles = void 0;
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs = require('fs');
async function DeleteFiles(folderPath) {
}
exports.DeleteFiles = DeleteFiles;
const verifyPermission = (isSuperuser = false, permissions = [], permission_id) => {
    if (isSuperuser)
        return true;
    const result = permissions?.some(p => p.permissiongroup_id === permission_id);
    return result;
};
exports.verifyPermission = verifyPermission;
async function logInJson(value) {
    const pathFile = Application_1.default.tmpPath('log.json');
    try {
        if (fs.existsSync(pathFile)) {
            fs.writeFile(pathFile, value, (err) => {
                if (err)
                    console.log(err);
                else {
                    console.log("inserido com sucesso");
                }
            });
        }
        else {
            console.error('O arquivo não existe:', pathFile);
        }
    }
    catch (error) {
        console.error('Erro ao adicionar string ao arquivo JSON:', error);
    }
}
exports.logInJson = logInJson;
const currencyConverter = (input) => {
    if (typeof input !== 'string' || input.trim() === '') {
        return '0.00';
    }
    let valor;
    if (input.includes(',')) {
        const numeroSemMilhar = input.replace(/\./g, '');
        const numeroDecimal = numeroSemMilhar.replace(',', '.');
        valor = parseFloat(numeroDecimal);
    }
    else {
        valor = parseFloat(input);
    }
    const numeroFormatado = valor.toFixed(2);
    return numeroFormatado;
};
exports.currencyConverter = currencyConverter;
//# sourceMappingURL=util.js.map