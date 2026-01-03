"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const uuid = __importStar(require("uuid"));
const uuidv4 = uuid.v4;
const app = (0, express_1.default)();
app.use(express_1.default.json());
// === Google Sheets setup ===
const SERVICE_ACCOUNT_FILE = 'google-service-account.json';
const auth = new googleapis_1.google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
// 👉 ВСТАВЬ СЮДА ID ТАБЛИЦЫ
const SPREADSHEET_ID = '1rZENzPAxhs3pkMOZFVLG-lKdtH4qU119tPlnucTPP2s';
// health-check
app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});
// POST /operations
app.post('/operations', async (req, res) => {
    try {
        const { operations } = req.body;
        if (!operations || !Array.isArray(operations)) {
            return res.status(400).json({ error: 'Invalid operations payload' });
        }
        const rows = operations.map((op) => [
            uuidv4(), // operation_id
            op.date,
            op.type,
            op.amount,
            op.currency,
            op.category,
            op.subcategory,
            op.context,
            op.project,
            op.description,
            op.receipt_id,
            op.receipt_total,
            op.source,
            new Date().toISOString(), // created_at
        ]);
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'operations!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: rows,
            },
        });
        res.json({
            status: 'ok',
            written: rows.length,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to write to Google Sheets' });
    }
});
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
