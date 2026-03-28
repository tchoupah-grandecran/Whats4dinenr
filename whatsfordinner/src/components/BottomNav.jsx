import { Link, useLocation } from "react-router-dom";
import { Home, LayoutList, BookOpen, ShoppingBasket } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/menu", icon: LayoutList, label: "Menu" },
    { path: "/recipes", icon: BookOpen, label: "Recettes" },
    { path: "/cart", icon: ShoppingBasket, label: "Courses" }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-20 bg-mint border-t border-forest-deepest/10 shadow-[0_-4px_20px_rgba(6,9,7,0.05)] pb-[env(safe-area-inset-bottom)] pointer-events-auto">
      
      <nav className="flex justify-around items-center h-[70px] px-2 max-w-3xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex flex-col items-center justify-center w-20 h-full transition-all duration-300"
              /* On force la couleur ici pour éviter l'opacité CSS qui crée les points noirs */
              style={{ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-inactive)' }}
            >
              <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 scale-110' : 'translate-y-1'}`}>
                <Icon 
                  size={26} 
                  strokeWidth={isActive ? 2.5 : 2}
                  /* Ces propriétés assurent un rendu propre des jonctions */
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </div>
              
              <span className={`text-[10px] font-display font-black uppercase tracking-widest transition-all duration-300 ${
                isActive ? 'opacity-100 mt-1.5' : 'opacity-0 h-0 overflow-hidden'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
    </div>
  );
}