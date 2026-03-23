const API_URL = '/api';

export const dinnerApi = {
  // Replaces google.script.run.getCurrentMenu()
  getMenu: async (householdId) => {
    const res = await fetch(`${API_URL}/menu?householdId=${householdId}`);
    return res.json();
  },

  // Replaces google.script.run.toggleCartItem()
  toggleItem: async (householdId, category, itemName) => {
    return fetch(`${API_URL}/cart/toggle`, {
      method: 'POST',
      body: JSON.stringify({ householdId, category, itemName })
    }).then(r => r.json());
  }
};