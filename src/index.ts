import express from 'express';
import { google } from 'googleapis';
import * as uuid from 'uuid';
const uuidv4 = uuid.v4;
import fs from 'fs';

const app = express();
app.use(express.json());

// === Google Sheets setup ===
const SERVICE_ACCOUNT_FILE = 'google-service-account.json';

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

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

    const rows = operations.map((op: any) => [
      uuidv4(),                 // operation_id
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to write to Google Sheets' });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
