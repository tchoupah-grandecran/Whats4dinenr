import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { firstName, householdId, householdName, email } = req.body;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  try {
    let finalHouseholdId = householdId;

    // Create a new household if requested (Logic from your code)
    if (householdName) {
      finalHouseholdId = `HH_${Date.now()}`;
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Households!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[finalHouseholdId, householdName, new Date().toISOString()]] },
      });
    }

    // Append the new user
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Users!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[email, firstName, finalHouseholdId, new Date().toISOString()]] },
    });

    res.status(200).json({ success: true, firstName, householdId: finalHouseholdId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}