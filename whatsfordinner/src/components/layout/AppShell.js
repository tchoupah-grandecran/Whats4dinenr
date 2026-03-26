import { useApp } from '@/context/AppContext';
import Header from './Header';
import Navbar from './Navbar';
import HomeView from '@/pages_view/homeview';
import MenuView from '@/pages_view/menuview';
import CartView from '@/pages_view/cartview';
import RecipesView from '@/pages_view/recipiesview';

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

      {/* On affiche TOUJOURS la Navbar maintenant ! */}
      <Navbar />
    </div>
  );
}