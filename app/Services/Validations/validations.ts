

export default class validations {

    constructor(code: String) {
        const dados = require('../Validations/listMessage.json')
        const message = dados.find(el => el.code === code);
        return message
    }


    // public async validations(code: string) {
    //     const dados = require('../Validations/listMessage.json')
    //     const message = dados.find(el => el.code === code);
    //     //message.code = `${prefix}_${code}`
    //     return message

    // }


}
