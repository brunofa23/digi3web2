

export default class validations {

    public async validations(code: string) {
        const dados = require('../Validations/listMessage.json')
        const message = dados.find(el => el.code === code);
        //message.code = `${prefix}_${code}`
        return message

    }


}
