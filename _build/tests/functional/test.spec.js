"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const supertest_1 = __importDefault(require("supertest"));
const BASE_URL = 'http://127.0.0.1:3333/api';
const token = 'MTE.bohAV-lIRI496INqPgKLb4mstvJP1oieEN5useiyAqYYq8KIOCwAxXIHDFKP';
runner_1.test.group('Companies', (group) => {
    (0, runner_1.test)('Get Company', async ({ client }) => {
        const body = await (0, supertest_1.default)(BASE_URL).get('/companies')
            .set('Authorization', 'bearer ' + token)
            .expect(201);
        console.log(">>>CLIENT", body);
    }).tags(['GetCompany']);
    (0, runner_1.test)('store Company', async ({ client }) => {
        const companyPayload = {
            "name": "CARTORIO BELO HORIZONTE15",
            "shortname": "BELOHORIZONTE15",
            "address": "Rua Hum",
            "number": "250",
            "complement": "A",
            "postalcode": "1111111",
            "district": "Centro",
            "city": "Teste",
            "state": "MG",
            "cnpj": "32323232111232",
            "responsablename": "Maria",
            "phoneresponsable": "31985228611",
            "email": "teste@teste.com.br",
            "status": 1
        };
        const body = await (0, supertest_1.default)(BASE_URL).post('/companies')
            .set('Authorization', 'bearer ' + token)
            .send(companyPayload);
        console.log(">>>CLIENT", body);
    }).tags(['storeCompany']);
    (0, runner_1.test)('update Company', async ({ client }) => {
        const companyPayload = {
            "name": "teste 777",
            "shortname": "",
            "address": "Rua Hum",
            "number": "250",
            "complement": "A",
            "postalcode": "1111111",
            "district": "Centro",
            "city": "Teste",
            "state": "MG",
            "cnpj": "32323232111232",
            "responsablename": "Maria adsf",
            "phoneresponsable": "31985228611",
            "email": "XXXXXXX@teste.com.br",
            "status": 1
        };
        const id = 14;
        const body = await (0, supertest_1.default)(BASE_URL).put(`/companies/${id}`).set('Authorization', 'bearer ' + token)
            .send(companyPayload);
    }).tags(['updateCompany']);
});
runner_1.test.group('Users', (group) => {
    (0, runner_1.test)('Get User', async ({ client }) => {
        const body = await (0, supertest_1.default)(BASE_URL).get('/users')
            .set('Authorization', 'bearer ' + token)
            .expect(200);
        console.log(">>>User", body);
    }).tags(['GetUser']);
    (0, runner_1.test)('Store User', async ({ client }) => {
        const userPayload = {
            "name": "durval55",
            "username": "durval5005",
            "email": "teste@teste.br",
            "password": "12345",
            "remember_me_token": "12345",
            "superuser": 1,
            "permission_level": 1,
            "status": 1,
            "companies_id": 4
        };
        const body = await (0, supertest_1.default)(BASE_URL).post('/users')
            .set('Authorization', 'bearer ' + token)
            .send(userPayload)
            .expect(201);
    }).tags(['StoreUser']);
});
runner_1.test.group('Typebook', (group) => {
    (0, runner_1.test)('Get Typebook', async ({ client }) => {
        const body = await (0, supertest_1.default)(BASE_URL).get('/typebooks')
            .set('Authorization', 'bearer ' + token)
            .expect(200);
        console.log(">>>typebooks", body);
    }).tags(['GetTypebook']);
});
//# sourceMappingURL=test.spec.js.map