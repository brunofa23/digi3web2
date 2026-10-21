"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const https_1 = __importDefault(require("https"));
function fetchMunicipalities() {
    return new Promise((resolve, reject) => {
        const request = https_1.default.get('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome', (response) => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => {
                if (response.statusCode !== 200) {
                    reject(new Error(`IBGE respondeu com status ${response.statusCode}`));
                    return;
                }
                try {
                    resolve(JSON.parse(body));
                }
                catch (error) {
                    reject(error);
                }
            });
        });
        request.setTimeout(20000, () => request.destroy(new Error('Tempo limite ao consultar o IBGE')));
        request.on('error', reject);
    });
}
class default_1 extends Seeder_1.default {
    async run() {
        const municipalities = await fetchMunicipalities();
        if (!Array.isArray(municipalities) || municipalities.length < 5500) {
            throw new Error('A lista de municípios recebida do IBGE está incompleta');
        }
        const rows = municipalities.map((municipality) => {
            const uf = municipality['regiao-imediata']?.['regiao-intermediaria']?.UF
                || municipality.microrregiao?.mesorregiao?.UF;
            if (!municipality.id || !municipality.nome || !uf?.sigla || !uf.id) {
                throw new Error(`Município do IBGE sem dados obrigatórios: ${municipality.id || 'sem código'}`);
            }
            return {
                ibge_code: municipality.id,
                name: municipality.nome,
                uf: uf.sigla,
                uf_ibge_code: uf.id,
            };
        });
        await Database_1.default.transaction(async (trx) => {
            for (let index = 0; index < rows.length; index += 300) {
                const batch = rows.slice(index, index + 300);
                const values = batch.map(() => '(?, ?, ?, ?)').join(', ');
                const bindings = batch.flatMap((row) => [row.ibge_code, row.name, row.uf, row.uf_ibge_code]);
                await trx.rawQuery(`INSERT INTO municipalities (ibge_code, name, uf, uf_ibge_code)
           VALUES ${values}
           ON DUPLICATE KEY UPDATE name = VALUES(name), uf = VALUES(uf), uf_ibge_code = VALUES(uf_ibge_code)`, bindings);
            }
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=MunicipalitiesSeeder.js.map