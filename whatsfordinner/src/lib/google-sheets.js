import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SPREADSHEET_ID;

export const sheetsService = {
  // Trouver un utilisateur par email
  async getUserByEmail(email) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:D', // Email, Prénom, Household ID, Date
    });
    const rows = res.data.values || [];
    const userRow = rows.find(row => row[0] === email);
    
    if (!userRow) return null;
    return { email: userRow[0], firstName: userRow[1], householdId: userRow[2] };
  },

  // Récupérer les données du foyer (Menu et Panier)
  async getHousehold(householdId) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Households!A:E', // ID, Nom, Date, Current Menu, Current Cart
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

  // Récupérer toutes les recettes (Bibliothèque)
  async getRecipes() {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Recipes!A:W', // ID, Nom, Ingrédients (C à AIS)...
    });
    return res.data.values || [];
  }
};