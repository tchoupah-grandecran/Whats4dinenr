import { Link, useLocation } from "react-router-dom";
import { Home, CalendarDays, ChefHat, ShoppingBag } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/menu", icon: CalendarDays, label: "Menu" },
    { path: "/recipes", icon: ChefHat, label: "Recettes" },
    { path: "/cart", icon: ShoppingBag, label: "Courses" }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-mint border-t border-forest-deepest/10 shadow-[0_-4px_20px_rgba(6,9,7,0.05)] pb-[env(safe-area-inset-bottom)] pointer-events-auto">
      
      <nav className="flex justify-around items-center h-[60px] px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${
                isActive 
                  ? 'text-forest-deepest' /* Actif : Vert foncé (Dark Green) */
                  : 'text-forest-deepest/40 hover:text-forest-deepest/60' /* Inactif : Gris (Vert foncé à 40% d'opacité) */
              }`}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-all duration-300 ${isActive ? '-translate-y-0.5 scale-110' : 'translate-y-2 scale-100'}`} 
              />
              <span className={`text-[10px] font-body font-bold tracking-wide transition-all duration-300 ${
                isActive ? 'opacity-100 h-auto mt-1' : 'opacity-0 h-0 overflow-hidden m-0'
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