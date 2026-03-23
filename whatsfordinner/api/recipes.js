// Example Vercel Serverless Function: /api/recipes
import { google } from 'googleapis';

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const range = 'Recipes!A:QH'; // Fetching metadata columns as well

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    const headers = rows[0];
    
    // Logic from your 'code' file to parse "Ingredient (Unit)"
    const recipes = rows.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      duration: row[451], // Corresponding to META_START + 1
      tags: [row[452], row[453], row[454], row[455]].filter(Boolean),
      pdfUrl: row[450]
    }));

    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}