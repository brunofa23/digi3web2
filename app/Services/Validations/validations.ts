

export default class validations {

    constructor(code: String) {
        const dados = require('../Validations/listMessage.json')
        const message = dados.find(el => el.code === code);
        //        console.log("VALIDATIONS", message)
        return message
    }

}
