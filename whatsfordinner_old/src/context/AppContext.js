import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  // Logic to determine Home State
  const getHomeState = () => {
    if (!menu) return 'no-menu';
    if (!cart) return 'menu-ready';
    const items = Object.values(cart).flat();
    const isCartDone = items.length > 0 && items.every(i => i.checked);
    if (!isCartDone) return 'cart-active';
    const recipesDone = menu.checkedRecipes?.length === menu.recipes.length;
    return recipesDone ? 'week-done' : 'cart-done';
  };

  return (
    <AppContext.Provider value={{ 
      user, setUser, 
      menu, setMenu, 
      cart, setCart, 
      currentPage, setCurrentPage, 
      getHomeState 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);