"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'documents';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').notNullable().unsigned();
            table.integer('bookrecords_id').notNullable().unsigned().references('bookrecords.id').onDelete('CASCADE');
            table.integer('box2');
            table.integer('prot');
            table.integer('month');
            table.integer('yeardoc');
            table.integer('intfield1');
            table.string('stringfield1', 350);
            table.dateTime('datefield1');
            table.integer('intfield2');
            table.string('stringfield2', 350);
            table.dateTime('datefield2');
            table.integer('intfield3');
            table.string('stringfield3', 350);
            table.dateTime('datefield3');
            table.integer('intfield4');
            table.string('stringfield4', 350);
            table.dateTime('datefield4');
            table.integer('intfield5');
            table.string('stringfield5', 350);
            table.dateTime('datefield5');
            table.integer('intfield6');
            table.string('stringfield6', 350);
            table.dateTime('datefield6');
            table.integer('intfield7');
            table.string('stringfield7', 350);
            table.dateTime('datefield7');
            table.integer('intfield8');
            table.string('stringfield8', 350);
            table.dateTime('datefield8');
            table.integer('intfield9');
            table.string('stringfield9', 350);
            table.dateTime('datefield9');
            table.integer('intfield10');
            table.string('stringfield10', 350);
            table.dateTime('datefield10');
            table.integer('intfield11');
            table.string('stringfield11', 350);
            table.dateTime('datefield11');
            table.integer('intfield12');
            table.string('stringfield12', 350);
            table.dateTime('datefield12');
            table.integer('intfield13');
            table.string('stringfield13', 350);
            table.dateTime('datefield13');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1695066928220_documents.js.map