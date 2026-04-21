"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables from backend/.env as early as possible.
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, '../.env'),
});
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
}));
app.use((0, body_parser_1.json)({ limit: '5mb' }));
app.use((0, body_parser_1.urlencoded)({ extended: true }));
(0, routes_1.registerRoutes)(app);
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Recruitment chatbot backend listening on port ${port}`);
});
