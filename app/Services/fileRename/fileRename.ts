
import Bookrecord from "App/Models/Bookrecord";

async function transformFileNameToId(fileName, typebook_id) {

    //FORMATO L10(10).JPG
    console.log("filename", fileName, "typebook_id", typebook_id );

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
        }

    }

    console.log("NAME:",name[0].id);
    //console.log("NOME:::>>", `id${name.id}(${name.cod})`);
    //return `id${name.id}(${name.cod})`
    return name

}


module.exports = { transformFileNameToId }
