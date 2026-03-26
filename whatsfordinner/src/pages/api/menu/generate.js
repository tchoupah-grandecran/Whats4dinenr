import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { householdId } = req.body;
    if (!householdId) throw new Error('householdId manquant');

    // Connexion globale à Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // 1. Lire les recettes directement depuis le Sheet (contourne le bug du fetch)
    const recipesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Recipes!A2:B', 
    });
    
    const recipeRows = recipesResponse.data.values || [];
    const allRecipes = recipeRows.map(row => ({
      id: row[0],
      name: row[1] || 'Recette sans nom'
    })).filter(r => r.id);

    if (allRecipes.length < 7) throw new Error('Pas assez de recettes dans la base (minimum 7)');

    // 2. Mélanger et prendre 7 recettes au hasard
    const shuffled = allRecipes.sort(() => 0.5 - Math.random());
    const selectedMenu = shuffled.slice(0, 7).map(r => ({ ...r, checked: false })); 

    // 3. Sauvegarder dans l'onglet Households
    // A. Chercher la ligne du foyer
    const hhResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Households!A:A',
    });
    
    const hhRows = hhResponse.data.values || [];
    const rowIndex = hhRows.findIndex(row => row[0] === householdId);
    
    if (rowIndex === -1) throw new Error('Foyer introuvable');
    const actualRow = rowIndex + 1;

    // B. Mettre à jour la colonne D (Menu) et E (Panier vide)
    const menuJsonString = JSON.stringify(selectedMenu);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Households!D${actualRow}:E${actualRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[menuJsonString, ""]],
      },
    });

    // 4. Succès ! On renvoie le menu
    res.status(200).json({ success: true, menu: selectedMenu });
  } catch (error) {
    console.error('Erreur API Generate Menu:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}