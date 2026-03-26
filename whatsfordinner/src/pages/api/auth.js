// Replacement for checkUserRegistration and getAllHouseholds
export async function verifyUser(email) {
  const data = await getSheetData('Users!A:D');
  const user = data.find(row => row[0].toLowerCase() === email.toLowerCase());
  
  if (user) {
    return {
      registered: true,
      firstName: user[1],
      householdId: user[2]
    };
  }
  return { registered: false };
}