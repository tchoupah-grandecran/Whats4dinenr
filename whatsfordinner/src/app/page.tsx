import { getServerSession } from "next-auth";
import { sheetsService } from "@/lib/google-sheets";
import StatusCard from "@/components/features/home/StatusCard";

export default async function HomePage() {
  const session = await getServerSession();
  
  if (!session) return null; // Géré par le middleware normalement

  // Récupération des données en temps réel depuis le Sheets
  const household = await sheetsService.getHousehold(session.user.householdId);
  
  // Logique d'état (inspirée de votre AppContext)
  const getStatus = () => {
    if (!household?.currentMenu?.length) return 'no-menu';
    if (!household?.currentCart?.length) return 'menu-ready';
    
    const isCartDone = household.currentCart.every((item: any) => item.checked);
    if (!isCartDone) return 'cart-active';
    
    return 'cart-done';
  };

  const status = getStatus();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif">Hello, {session.user.firstName}</h2>
          <p className="text-sm opacity-60">Foyer : {household?.name}</p>
        </div>
        <div className="w-12 h-12 organic-shape bg-dinner-accent/20 flex items-center justify-center">
          <span className="text-xl">🥗</span>
        </div>
      </header>

      {/* Carte d'état dynamique */}
      <StatusCard status={status} />

      {/* Quick Actions (Visibles selon l'état) */}
      <div className="grid grid-cols-1 gap-4">
        {status === 'no-menu' && (
          <button className="glass-card p-6 rounded-2xl text-left border-l-4 border-dinner-accent">
            <h3 className="font-bold">Générer un menu</h3>
            <p className="text-sm opacity-70">Trouvons de l'inspiration pour la semaine.</p>
          </button>
        )}
      </div>
    </div>
  );
}