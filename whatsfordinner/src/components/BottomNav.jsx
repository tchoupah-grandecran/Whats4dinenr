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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      
      {/* 2. Le conteneur centré avec un padding normal pour décoller la barre du bord */}
      <div className="max-w-md mx-auto pointer-events-auto px-4 pb-4 pt-2">
        
        {/* 3. La barre de navigation avec le style Glassmorphism */}
        <nav className="glass-panel rounded-3xl flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'text-mint bg-white/10 shadow-inner' 
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-transform duration-300 ${isActive ? '-translate-y-0.5' : ''}`} 
                />
                <span className={`text-[10px] font-display tracking-wide font-bold transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
    </div>
  );
}