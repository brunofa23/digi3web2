"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class validations {
    async validations(code) {
        const dados = require('../Validations/listMessage.json');
        const message = dados.find(el => el.code === code);
        return message;
    }
}
exports.default = validations;
//# sourceMappingURL=validations.js.map