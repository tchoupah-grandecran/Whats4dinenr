import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // On récupère les colonnes A (ID) et B (Nom) de l'onglet Recipes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Recipes!A2:B', // On commence à la ligne 2 pour ignorer les en-têtes
    });

    const rows = response.data.values || [];
    
    // On transforme le tableau de tableaux en tableau d'objets
    const recipes = rows.map(row => ({
      id: row[0],
      name: row[1] || 'Recette sans nom'
    })).filter(r => r.id); // On garde uniquement celles qui ont un ID

    res.status(200).json({ success: true, recipes });
  } catch (error) {
    console.error('Erreur API Recipes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}