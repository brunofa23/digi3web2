
import Bookrecord from "App/Models/Bookrecord";

async function transformFileNameToId(fileName, typebook_id) {

    //FORMATO L10(10).JPG
    let name
    if (fileName.toUpperCase().startsWith('L')) {
        let separators = ["L", '\'', '(', ')', '|', '-'];
        let arrayFileName = fileName.split(new RegExp('([' + separators.join('') + '])'));

        if (!isNaN(arrayFileName[4]) && !isNaN(arrayFileName[2])) {
            const query = ` cod =${arrayFileName[4]} and book = ${arrayFileName[2]} `

            name = await Bookrecord.query()
                .preload('bookrecords')
                .where('typebooks_id', '=', typebook_id)
                .whereRaw(query)
            //name = await Bookrecord.find(44)
            //name = "WWWWWWWWWW"
            console.log("NNNNNAME:", name);
        }

    }

    //console.log("NOME:::>>", `id${name.id}(${name.cod})`);

    return `id${name.id}(${name.cod})`

}


module.exports = { transformFileNameToId }
