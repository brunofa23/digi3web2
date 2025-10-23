"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const source_map_support_1 = __importDefault(require("source-map-support"));
const standalone_1 = require("@adonisjs/core/build/standalone");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tmpPath = path_1.default.join(__dirname, 'tmp', 'uploads');
try {
    if (!fs_1.default.existsSync(tmpPath)) {
        fs_1.default.mkdirSync(tmpPath, { recursive: true });
        console.log('📁 Pasta tmp/uploads criada:', tmpPath);
    }
}
catch (err) {
    console.error('❌ Erro ao criar pasta tmp/uploads:', err);
}
source_map_support_1.default.install({ handleUncaughtExceptions: false });
new standalone_1.Ignitor(__dirname).httpServer().start();
//# sourceMappingURL=server.js.map