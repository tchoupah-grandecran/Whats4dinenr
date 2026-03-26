import { google } from 'googleapis';

// On garde l'instance en mémoire (cache) pour ne pas la recréer à chaque fois
let sheetsInstance = null;

function getSheets() {
  if (!sheetsInstance) {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsInstance = google.sheets({ version: 'v4', auth });
  }
  return { sheets: sheetsInstance, spreadsheetId: process.env.SPREADSHEET_ID };
}

export const sheetsService = {
  async getUserByEmail(email) {
    const { sheets, spreadsheetId } = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:D',
    });
    const rows = res.data.values || [];
    const userRow = rows.find(row => row[0] === email);
    
    if (!userRow) return null;
    return { email: userRow[0], firstName: userRow[1], householdId: userRow[2] };
  },

  async getHousehold(householdId) {
    const { sheets, spreadsheetId } = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Households!A:E',
    });
    const rows = res.data.values || [];
    const row = rows.find(r => r[0] === householdId);
    if (!row) return null;

    return {
      id: row[0],
      name: row[1],
      currentMenu: row[3] ? JSON.parse(row[3]) : [],
      currentCart: row[4] ? JSON.parse(row[4]) : []
    };
  },

  async getRecipes() {
    const { sheets, spreadsheetId } = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Recipes!A:W',
    });
    return res.data.values || [];
  }
};