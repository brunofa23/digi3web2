"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
const BASE_URL = 'http://127.0.0.1:3333';
const Date = require('../../app/Services/Dates/format');
runner_1.test.group('Data', (assert) => {
    (0, runner_1.test)('Testando dates', async () => {
        const data = Date.format(luxon_1.DateTime.now());
        console.log(data);
    });
});
runner_1.test.group('FileRename', () => {
    (0, runner_1.test)('Testando dates', async () => {
        const data = Date.format(luxon_1.DateTime.now());
        console.log(data);
    });
});
//# sourceMappingURL=hello_world.spec.js.map