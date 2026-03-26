import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, ShoppingBag, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { id: 'home', path: '/', icon: Home, label: 'Accueil' },
    { id: 'menu', path: '/menu', icon: CalendarDays, label: 'Menu' },
    { id: 'cart', path: '/cart', icon: ShoppingBag, label: 'Courses' },
    { id: 'recipes', path: '/recipes', icon: BookOpen, label: 'Recettes' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        
        {/* Barre de navigation Glassmorphism */}
        <nav className="glass-panel border-b-0 border-x-0 rounded-t-3xl px-6 py-4 flex justify-between items-center relative overflow-hidden bg-forest-deepest/80">
          
          {/* Ligne lumineuse subtile au-dessus */}
          <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex flex-col items-center gap-1.5 p-2 w-16 group"
              >
                {/* Fond de l'icône active (juste un fade-in doux maintenant) */}
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 rounded-2xl -z-10 animate-in fade-in duration-300" />
                )}

                <Icon
                  size={24}
                  className={`transition-colors duration-300 ${
                    isActive 
                      ? 'text-gold drop-shadow-[0_0_8px_rgba(240,201,74,0.6)]' 
                      : 'text-text-muted group-hover:text-white'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                <span
                  className={`font-display text-[9px] font-bold tracking-widest uppercase transition-colors duration-300 ${
                    isActive ? 'text-gold' : 'text-text-muted group-hover:text-white'
                  }`}
                >
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