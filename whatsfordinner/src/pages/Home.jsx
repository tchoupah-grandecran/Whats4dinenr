import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import { ArrowRight, Sparkles, PenLine, ShoppingBag, Utensils } from "lucide-react";

export default function Home({ userData, household }) {
  const navigate = useNavigate();

  const [actionType, setActionType] = useState('none');
  const [joinId, setJoinId] = useState("");
  const [createName, setCreateName] = useState("");
  const [actionError, setActionError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateHousehold = async () => {
    if (!createName.trim()) return;
    setIsProcessing(true);
    try {
      const newId = `HH_${Date.now()}`;
      await setDoc(doc(db, "households", newId), {
        name: createName.trim(),
        currentMenu: [], currentCart: [], isMenuValidated: false, createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { householdId: newId });
    } catch { setActionError("Erreur lors de la création."); }
    finally { setIsProcessing(false); }
  };

  const handleJoinHousehold = async () => {
    if (!joinId.trim()) return;
    setIsProcessing(true);
    try {
      const houseSnap = await getDoc(doc(db, "households", joinId.trim()));
      if (houseSnap.exists()) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { householdId: joinId.trim() });
      } else { setActionError("Foyer introuvable."); }
    } catch { setActionError("Erreur."); }
    finally { setIsProcessing(false); }
  };

  const getCycleState = () => {
    if (!household) return null;
    const menuCount = household.currentMenu?.length || 0;
    const isValidated = household.isMenuValidated || false;
    const uncheckedCartItems = (household.currentCart || []).filter(i => !i.checked).length;

    if (menuCount === 0) return {
      step: 1, icon: Sparkles, color: "text-[var(--color-accent-ocre)]", bg: "bg-[var(--color-accent-ocre)]/10",
      title: "C'est l'heure du menu !", desc: "Générez vos 7 repas de la semaine en un clic.",
      btnText: "Générer mon menu", action: () => navigate("/menu")
    };
    if (menuCount > 0 && !isValidated) return {
      step: 2, icon: PenLine, color: "text-[var(--color-accent-ocre)]", bg: "bg-[var(--color-accent-ocre)]/10",
      title: "Menu en brouillon", desc: "Ajustez vos recettes et validez pour créer la liste de courses.",
      btnText: "Vérifier le menu", action: () => navigate("/menu")
    };
    if (menuCount > 0 && isValidated && uncheckedCartItems > 0) return {
      step: 3, icon: ShoppingBag, color: "text-[var(--color-app-text)]", bg: "bg-[var(--color-app-text)]/10",
      title: "Direction les rayons !", desc: `Il vous reste ${uncheckedCartItems} article(s) à acheter.`,
      btnText: "Voir les courses", action: () => navigate("/cart")
    };
    return {
      step: 4, icon: Utensils, color: "text-[var(--color-accent-ocre-deep)]", bg: "bg-[var(--color-accent-ocre-deep)]/10",
      title: "Aux fourneaux !", desc: "Le frigo est plein, il n'y a plus qu'à cuisiner.",
      btnText: "Voir les recettes", action: () => navigate("/menu")
    };
  };

  const cycleState = getCycleState();

  if (!userData) return <div className="p-6"><SkeletonLoader type="home" /></div>;

  return (
    <div className="flex flex-col min-h-[70vh] justify-center px-4 animate-fade-in">
      <main className="max-w-sm mx-auto w-full">
        {!userData?.householdId ? (
          /* ÉCRAN SANS FOYER */
          <div className="glass-card bg-white dark:bg-[var(--color-card-bg)] text-center py-10 px-6">
            <h2 className="text-xl font-display text-[var(--color-app-text)] mb-4">Bienvenue !</h2>
            {actionType === 'none' ? (
              <div className="flex flex-col gap-4">
                <button onClick={() => setActionType('create')} className="btn-primary w-full">Créer un foyer</button>
                <button onClick={() => setActionType('join')} className="btn-secondary w-full">Rejoindre un foyer</button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <input
                  type="text"
                  value={actionType === 'create' ? createName : joinId}
                  onChange={e => actionType === 'create' ? setCreateName(e.target.value) : setJoinId(e.target.value)}
                  placeholder={actionType === 'create' ? "Nom du foyer..." : "ID du foyer..."}
                  className="w-full bg-app-bg border border-[var(--color-card-border)] rounded-2xl p-4 mb-4 text-[var(--color-app-text)] outline-none"
                />
                <div className="flex gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={actionType === 'create' ? handleCreateHousehold : handleJoinHousehold}
                    className="btn-primary flex-1"
                  >
                    {isProcessing ? "..." : "Valider"}
                  </button>
                  <button onClick={() => setActionType('none')} className="btn-secondary flex-1">Retour</button>
                </div>
                {actionError && <p className="text-red-500 text-xs mt-2">{actionError}</p>}
              </div>
            )}
          </div>
        ) : (
          /* ÉCRAN CYCLE */
          cycleState ? (
            <div className="glass-card bg-white dark:bg-[var(--color-card-bg)] flex flex-col items-center pt-10 px-8 pb-8 text-center relative shadow-2xl">
              <div className="absolute top-0 left-0 right-0 flex justify-between px-8 pt-5">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`h-1.5 flex-1 mx-0.5 rounded-full ${cycleState.step >= s ? 'bg-[var(--color-accent-ocre)]' : 'bg-[var(--color-accent-ocre)]/10'}`} />
                ))}
              </div>
              <div className={`w-16 h-16 rounded-[1.5rem] ${cycleState.bg} ${cycleState.color} flex items-center justify-center mb-5 mt-2`}>
                <cycleState.icon size={28} />
              </div>
              {/* h2 aligné sur le même poids visuel que Menu.jsx h1 */}
              <h2 className="font-display text-xl text-[var(--color-app-text)] mb-2">{cycleState.title}</h2>
              <p className="font-body text-[var(--color-app-text)]/50 text-sm mb-8 leading-relaxed">{cycleState.desc}</p>
              <button onClick={cycleState.action} className="btn-primary w-full py-4 flex justify-center items-center gap-3">
                {cycleState.btnText} <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <SkeletonLoader type="home" />
          )
        )}
      </main>
    </div>
  );
}
