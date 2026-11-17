import { Link, useLocation } from "react-router-dom";
import { Home, ListTodo, BookOpen, ShoppingBasket } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/menu", icon: ListTodo, label: "Menu" },
    { path: "/recipes", icon: BookOpen, label: "Recettes" },
    { path: "/cart", icon: ShoppingBasket, label: "Courses" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none">
      <nav className="
        pointer-events-auto
        max-w-[390px] mx-auto relative
        bg-card-bg/85 backdrop-blur-2xl border border-card-border
        shadow-[0_12px_40px_rgba(0,0,0,0.10)]
        rounded-[1.7rem]
        flex justify-around items-center
        h-[68px] px-2
      ">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-accent-ocre/20" />
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
              <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-[opacity,transform,background-color] duration-200 ${
                isActive
                  ? 'text-accent-ocre bg-accent-ocre/10 scale-110 opacity-100'
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
