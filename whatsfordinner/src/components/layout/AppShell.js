import { useApp } from '@/context/AppContext';
import Header from './Header';
import Navbar from './Navbar';
import HomeView from '@/pages/HomeView';
import MenuView from '@/pages/MenuView';
import CartView from '@/pages/CartView';
import RecipesView from '@/pages/RecipesView';

export default function AppShell() {
  const { currentPage } = useApp();

  // Mapping pages to components, replacing the manual hide/show logic
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomeView />;
      case 'menu': return <MenuView />;
      case 'cart': return <CartView />;
      case 'recipes': return <RecipesView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="app-container">
      <div className="botanical-bg" />
      <Header />
      
      <main className="page-content">
        {renderPage()}
      </main>

      {/* Footer is hidden on home page, mirroring your original logic */}
      {currentPage !== 'home' && <Navbar />}
    </div>
  );
}