"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class validations {
    constructor(code) {
        const dados = require('../Validations/listMessage.json');
        const message = dados.find(el => el.code === code);
        console.log("VALIDATIONS", message);
        return message;
    }
}
exports.default = validations;
//# sourceMappingURL=validations.js.map