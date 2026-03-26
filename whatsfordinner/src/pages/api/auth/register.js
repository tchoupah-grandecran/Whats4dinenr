import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { firstName, mode, householdId, householdName } = req.body;
    
    // Remarque : Pour l'instant, on simule un email, car sur Vercel, 
    // l'utilisateur n'est pas automatiquement connecté à son compte Google.
    // Plus tard, nous pourrons ajouter NextAuth.
    const email = `${firstName.toLowerCase().replace(/\s/g, '')}@example.com`; 

    // Authentification avec le Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    let finalHouseholdId = householdId;

    // Si l'utilisateur crée un nouveau foyer
    if (mode === 'new') {
      finalHouseholdId = `HH_${Date.now()}`;
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Households!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[finalHouseholdId, householdName, new Date().toISOString()]],
        },
      });
    }

    // Ajouter l'utilisateur dans la feuille Users
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Users!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, firstName, finalHouseholdId, new Date().toISOString()]],
      },
    });

    res.status(200).json({ 
      success: true, 
      firstName, 
      householdId: finalHouseholdId,
      email 
    });

  } catch (error) {
    console.error('Erreur API Register:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}