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
const app_1 = require("./app");
// Local/dev server entrypoint. Vercel uses `api/index.ts` instead.
const app = (0, app_1.createApp)();
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Recruitment chatbot backend listening on port ${port}`);
});
