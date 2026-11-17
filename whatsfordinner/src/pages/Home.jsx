import { createElement, useState } from "react";
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
  const homeSteps = [
    { step: 1, eyebrow: "01", label: "Composer le menu", icon: Sparkles },
    { step: 2, eyebrow: "02", label: "Ajuster les recettes", icon: PenLine },
    { step: 3, eyebrow: "03", label: "Faire les courses", icon: ShoppingBag },
    { step: 4, eyebrow: "04", label: "Cuisiner", icon: Utensils },
  ];

  if (!userData) return <div className="p-6"><SkeletonLoader type="home" /></div>;

  return (
    <div className="min-h-[calc(100vh-6rem)] px-6 pb-32 pt-10 text-app-text animate-fade-in md:px-12 lg:px-16">
      <main className="mx-auto w-full max-w-6xl">
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
            <div className="mx-auto w-full max-w-6xl">
              <header className="mb-2">
                <div className="flex items-end justify-between gap-6">
                  <h1 className="mt-3 font-display text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.82] tracking-[-0.055em]">
                    Cette semaine
                  </h1>
                  {household?.name && (
                    <span className="hidden pb-1 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-app-text)]/25 md:block">
                      {household.name}
                    </span>
                  )}
                </div>
                {household?.name && (
                  <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-app-text)]/25 md:hidden">
                    {household.name}
                  </p>
                )}
              </header>

              <section className="relative mt-12 hidden md:block lg:mt-20">
                <div className="absolute left-0 right-0 top-0 h-px bg-[var(--color-app-text)]/15" />
                <div className="grid grid-cols-4">
                  {homeSteps.map(({ step, eyebrow, label, icon: StepIcon }) => {
                    const active = cycleState.step === step;
                    const completed = cycleState.step > step;
                    return (
                      <div key={step} className={`relative px-4 pt-8 text-center transition-all ${active ? "home-active" : "home-step"}`}>
                        <span className={`absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${active ? "bg-[var(--color-accent-ocre)] ring-8 ring-[var(--color-accent-ocre)]/10" : completed ? "bg-[var(--color-accent-ocre)]/45" : "bg-[var(--color-app-text)]/15"}`} />
                        {createElement(StepIcon, { className: `mx-auto mb-4 ${active ? "text-[var(--color-accent-ocre)]" : "text-[var(--color-app-text)]/30"}`, size: 20, strokeWidth: 1.7 })}
                        <span className={`block text-[9px] font-bold tracking-[0.18em] ${active ? "text-[var(--color-accent-ocre)]" : "text-[var(--color-app-text)]/35"}`}>
                          {active ? `ÉTAPE ${eyebrow}` : eyebrow}
                        </span>
                        <p className={`mt-3 text-sm font-bold ${active ? "text-[var(--color-app-text)]" : "text-[var(--color-app-text)]/60"}`}>
                          {label}
                        </p>
                        {active && (
                          <div className="mx-auto mt-8 max-w-sm home-active-content">
                            <h2 className="font-display text-[clamp(2.3rem,4vw,4rem)] leading-[0.9] tracking-[-0.04em]">
                              {cycleState.title.replace(/!$/, ".")}
                            </h2>
                            <p className="mt-5 text-sm leading-relaxed text-[var(--color-app-text)]/45">
                              {cycleState.desc}
                            </p>
                            <button onClick={cycleState.action} className="btn-primary mx-auto mt-8 min-w-56">
                              {cycleState.btnText} <ArrowRight size={17} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="relative mt-10 md:hidden">
                <div className="absolute bottom-3 left-[7px] top-0 w-px bg-[var(--color-app-text)]/10" />
                <div className="flex flex-col gap-8">
                  {homeSteps.map(({ step, eyebrow, label, icon: StepIcon }) => {
                    const active = cycleState.step === step;
                    const completed = cycleState.step > step;
                    return (
                      <div key={step} className="relative pl-8">
                        <span className={`absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 ${active ? "border-[var(--color-accent-ocre)] bg-[var(--color-app-bg)] shadow-[0_0_0_5px_var(--color-app-bg)]" : completed ? "border-[var(--color-accent-ocre)] bg-[var(--color-accent-ocre)]" : "border-[var(--color-app-text)]/20 bg-[var(--color-app-bg)]"}`} />
                        <div className="flex items-center gap-3">
                          {createElement(StepIcon, { className: active ? "text-[var(--color-accent-ocre)]" : "text-[var(--color-app-text)]/35", size: 17, strokeWidth: 1.7 })}
                          <span className={`text-[9px] font-bold tracking-[0.18em] ${active ? "text-[var(--color-accent-ocre)]" : "text-[var(--color-app-text)]/35"}`}>
                            {active ? `ÉTAPE ${eyebrow}` : eyebrow}
                          </span>
                          <p className={`text-sm font-bold ${active ? "text-[var(--color-app-text)]" : "text-[var(--color-app-text)]/55"}`}>
                            {label}
                          </p>
                        </div>
                        {active && (
                          <div className="mt-6 home-active-content">
                            <h2 className="font-display text-[clamp(2.5rem,12vw,4rem)] leading-[0.9] tracking-[-0.04em]">
                              {cycleState.title.replace(/!$/, ".")}
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-[var(--color-app-text)]/45">
                              {cycleState.desc}
                            </p>
                            <button onClick={cycleState.action} className="btn-primary mt-7 w-full">
                              {cycleState.btnText} <ArrowRight size={17} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <SkeletonLoader type="home" />
          )
        )}
      </main>
    </div>
  );
}
