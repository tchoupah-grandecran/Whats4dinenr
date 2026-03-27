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
    <div className="fixed bottom-0 left-0 w-full z-50 bg-[#060907]/75 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      
      {/* Conteneur des icônes (hauteur fixe standard iOS ~55px) */}
      <nav className="flex justify-around items-center h-[55px] px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive 
                  ? 'text-mint' 
                  : 'text-text-muted hover:text-white/80'
              }`}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} 
              />
              <span className="text-[10px] font-body font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
    </div>
  );
}