import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { sheetsService } from "@/lib/google-sheets";
import StatusCard from "@/components/features/home/StatusCard";

export default async function HomePage() {
  const session = await getServerSession();
  
  // Sécurité renforcée : on s'assure que session ET session.user existent
  if (!session || !session.user) redirect("/login");

  // On dit explicitement à TypeScript de faire confiance à notre structure (via "as any")
  // Cela évite les erreurs sur l'absence de "householdId" dans les types par défaut de NextAuth
  const user = session.user as any;
  const householdId = user.householdId;
  const firstName = user.name?.split(' ')[0] || "Chef";
  
  // Si pour une raison quelconque l'utilisateur n'a pas de householdId, on pourrait le rediriger vers une page de création
  if (!householdId) {
    return <div className="p-10 text-center text-white">Création de foyer requise...</div>;
  }

  const household = await sheetsService.getHousehold(householdId);

  // L'algorithme d'état (fidèle à ton ancien AppContext)
  const getStatus = () => {
    if (!household?.currentMenu || household.currentMenu.length === 0) return 'no-menu';
    if (!household?.currentCart || household.currentCart.length === 0) return 'menu-ready';
    
    // Vérifie si TOUT le panier est coché
    const isCartDone = household.currentCart.every((item: any) => item.checked);
    if (!isCartDone) return 'cart-active';
    
    return 'cart-done';
  };

  const status = getStatus();

  return (
    <div className="flex flex-col min-h-[85vh] py-6 animate-in fade-in duration-1000">
      
      {/* Header : Salutations & Foyer */}
      <header className="flex justify-between items-center px-2 mb-8 relative z-10">
        <div>
          <p className="font-display text-text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
            Foyer • {household?.name || "Jardin Secret"}
          </p>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">
            Hello, {firstName}
          </h1>
        </div>
        
        {/* Avatar Utilisateur (Glassmorphism) */}
        <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gold font-display font-black text-lg border-gold/20 shadow-[0_0_15px_rgba(240,201,74,0.1)] cursor-pointer hover:scale-105 transition-transform">
          {firstName[0].toUpperCase()}
        </div>
      </header>

      {/* Zone Centrale : Status Card */}
      <main className="flex-1 flex flex-col justify-center">
        <StatusCard status={status} />
      </main>

    </div>
  );
}