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
    <div className="fixed bottom-0 left-0 w-full z-[100] px-6 pb-8 pointer-events-none">
      <nav className="
        pointer-events-auto
        max-w-md mx-auto
        bg-card-bg border border-card-border
        shadow-[0_20px_50px_rgba(0,0,0,0.2)]
        rounded-[2.5rem]
        flex justify-around items-center
        h-20 px-4
      ">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              {/* Icône : transition rapide uniquement sur l'opacité et le transform */}
              <div className={`transition-[opacity,transform] duration-200 ${
                isActive
                  ? 'text-accent-ocre scale-110 opacity-100'
                  : 'text-app-text opacity-25'
              }`}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  strokeOpacity={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </div>

              {/* Label : pas de transition compliquée ici */}
              <span className={`
                text-[9px] font-black uppercase tracking-[0.1em] mt-1.5
                ${isActive ? 'text-accent-ocre' : 'text-app-text opacity-30'}
              `}>
                {item.label}
              </span>

              {/* L'indicateur : On utilise transform scaleX au lieu de width pour la performance */}
              <div
                className={`
                  h-0.5 bg-accent-ocre rounded-full mt-1
                  transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                  ${isActive ? 'w-3 scale-x-100' : 'w-3 scale-x-0'}
                `}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
