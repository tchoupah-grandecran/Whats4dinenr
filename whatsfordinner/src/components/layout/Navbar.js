import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const { currentPage, setCurrentPage } = useApp();

  const navItems = [
    { id: 'home', icon: 'https://i.imgur.com/BMSUxce.png', label: 'Accueil' },
    { id: 'menu', icon: 'https://i.imgur.com/5UXji4g.png', label: 'Menu' },
    { id: 'cart', icon: 'https://i.imgur.com/TZckSBM.png', label: 'Panier' },
    { id: 'recipes', icon: 'https://i.imgur.com/aF24M2a.png', label: 'Recettes' }
  ];

  // Replaces the data-active attribute and manual class toggling
  return (
    <footer id="section-footer">
      <nav className="nav-menu">
        {navItems.map((item, index) => (
          <div 
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <img src={item.icon} alt={item.label} />
          </div>
        ))}
        {/* CSS handles the animated indicator based on active index */}
        <div className={`nav-indicator pos-${currentPage}`} />
      </nav>
    </footer>
  );
}