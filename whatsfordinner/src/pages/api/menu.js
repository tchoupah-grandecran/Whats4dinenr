// Replacement for selectRandomRecipes
export default async function handleMenuGeneration(req, res) {
  const { householdId } = req.body;
  const allRecipes = await fetchAllRecipes();
  const shuffled = allRecipes.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 7);

  // Instead of PropertiesService, we store this in our DB/Sheet 
  // tied to the specific HouseholdID
  await saveHouseholdState(householdId, {
    menu: selected,
    cart: null, // Resetting cart on new menu
    date: new Date().toISOString()
  });

  res.status(200).json(selected);
}