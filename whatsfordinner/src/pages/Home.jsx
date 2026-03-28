import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import { 
  X, LogOut, PlusCircle, ArrowRight, UserMinus, Edit2, Check, 
  Sparkles, PenLine, ShoppingBag, Utensils, ChevronRight 
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [modalAction, setModalAction] = useState('none');
  const [joinId, setJoinId] = useState("");
  const [createName, setCreateName] = useState("");
  const [actionError, setActionError] = useState("");
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const fetchData = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setUserData(uData);
          if (uData.householdId) {
            const houseSnap = await getDoc(doc(db, "households", uData.householdId));
            if (houseSnap.exists()) setHousehold(houseSnap.data());
          }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, navigate]);

  const handleCreateHousehold = async () => {
    if (!createName.trim()) return;
    setIsProcessing(true);
    setActionError("");
    try {
      const newId = `HH_${Date.now()}`;
      const name = createName.trim();
      await setDoc(doc(db, "households", newId), { name, currentMenu: [], currentCart: [], isMenuValidated: false, createdAt: new Date().toISOString() });
      await updateDoc(doc(db, "users", user.uid), { householdId: newId });
      setUserData(prev => ({ ...prev, householdId: newId }));
      setHousehold({ name, currentMenu: [], currentCart: [], isMenuValidated: false });
      closeModal();
    } catch (e) { setActionError("Erreur lors de la création."); } finally { setIsProcessing(false); }
  };

  const handleJoinHousehold = async () => {
    if (!joinId.trim()) return;
    setIsProcessing(true);
    setActionError("");
    try {
      const houseSnap = await getDoc(doc(db, "households", joinId.trim()));
      if (houseSnap.exists()) {
        await updateDoc(doc(db, "users", user.uid), { householdId: joinId.trim() });
        setUserData(prev => ({ ...prev, householdId: joinId.trim() }));
        setHousehold(houseSnap.data());
        closeModal();
      } else { setActionError("Foyer introuvable."); }
    } catch (e) { setActionError("Erreur de connexion."); } finally { setIsProcessing(false); }
  };

  const handleRenameHousehold = async () => {
    if (!newHouseholdName.trim() || !userData?.householdId) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "households", userData.householdId), { name: newHouseholdName.trim() });
      setHousehold(prev => ({ ...prev, name: newHouseholdName.trim() }));
      setIsEditingName(false);
    } finally { setIsProcessing(false); }
  };

  const handleLogout = async () => { await signOut(auth); navigate("/login"); };
  
  const handleDeleteAccount = async () => {
    if (!window.confirm("Action irréversible. Supprimer votre compte ?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/login");
    } catch (e) { alert("Erreur. Reconnectez-vous avant de supprimer."); }
  };

  const closeModal = () => {
    setIsProfileOpen(false); setModalAction('none'); setJoinId(""); setCreateName(""); setActionError(""); setIsEditingName(false);
  };

  const getCycleState = () => {
    if (!household) return null;
    const menuCount = household.currentMenu?.length || 0;
    const isValidated = household.isMenuValidated || false;
    const uncheckedCartItems = (household.currentCart || []).filter(i => !i.checked).length;

    if (menuCount === 0) return {
      step: 1, icon: Sparkles, color: "text-mint-deep", bg: "bg-mint-deep/10",
      title: "C'est l'heure du menu !", desc: "Générez vos 7 repas de la semaine en un clic.", 
      btnText: "Générer mon menu", action: () => navigate("/menu")
    };

    if (menuCount > 0 && !isValidated) return {
      step: 2, icon: PenLine, color: "text-orange-500", bg: "bg-orange-500/10",
      title: "Menu en brouillon", desc: "Ajustez vos recettes et validez pour créer la liste de courses.", 
      btnText: "Vérifier le menu", action: () => navigate("/menu")
    };

    if (menuCount > 0 && isValidated && uncheckedCartItems > 0) return {
      step: 3, icon: ShoppingBag, color: "text-forest-deepest", bg: "bg-forest-deepest/10",
      title: "Direction les rayons !", desc: `Il vous reste ${uncheckedCartItems} article(s) à acheter.`, 
      btnText: "Voir la liste de courses", action: () => navigate("/cart"),
      secondaryBtnText: "Voir le menu en cours", secondaryAction: () => navigate("/menu")
    };

    return {
      step: 4, icon: Utensils, color: "text-gold-deep", bg: "bg-gold-deep/10",
      title: "Aux fourneaux !", desc: "Le frigo est plein, il n'y a plus qu'à cuisiner.", 
      btnText: "Voir les recettes", action: () => navigate("/menu")
    };
  };

  const cycleState = getCycleState();

  if (loading) return (
    <div className="pt-6 px-4">
      <SkeletonLoader type="header" />
      <SkeletonLoader type="home" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-[90vh] py-6 px-4 animate-fade-in w-full max-w-4xl mx-auto">
      
      <header className="flex justify-between items-center mb-10 px-2 w-full">
        <div>
          <p className="font-display text-forest-deepest/50 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
            {userData?.householdId ? `Foyer • ${household?.name}` : "Configuration"}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-forest-deepest tracking-tight leading-none">
            Hello, {userData?.firstName || "Chef"}
          </h1>
        </div>
        <button 
          onClick={() => setIsProfileOpen(true)} 
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl glass-panel flex items-center justify-center text-forest-deepest font-display font-black text-lg cursor-pointer hover:scale-105 transition-all border border-forest-deepest/10 shadow-sm"
        >
          {userData?.firstName?.[0]?.toUpperCase() || "C"}
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center w-full">
        {!userData?.householdId ? (
          <div className="glass-card text-center py-12 max-w-sm mx-auto w-full">
            <h2 className="text-xl font-display font-bold text-forest-deepest mb-4 uppercase tracking-tight">Bienvenue !</h2>
            <p className="text-forest-deepest/60 text-sm mb-8 px-6 leading-relaxed">Créez votre propre foyer ou rejoignez celui de votre partenaire pour synchroniser vos menus.</p>
            <div className="flex flex-col gap-4 px-6">
              <button onClick={() => { setIsProfileOpen(true); setModalAction('create'); }} className="btn-primary w-full shadow-lg">Créer un foyer</button>
              <button onClick={() => { setIsProfileOpen(true); setModalAction('join'); }} className="btn-secondary w-full">Rejoindre un foyer</button>
            </div>
          </div>
        ) : cycleState ? (
          <div className="glass-card flex flex-col items-center pt-10 px-8 pb-6 text-center relative overflow-hidden group max-w-sm mx-auto w-full">
            <div className="absolute top-0 left-0 right-0 flex justify-between px-8 pt-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`h-1.5 flex-1 mx-0.5 rounded-full transition-all duration-700 ${cycleState.step >= step ? 'bg-forest-deepest' : 'bg-forest-deepest/10'}`} />
              ))}
            </div>
            
            <div className={`w-24 h-24 rounded-full ${cycleState.bg} ${cycleState.color} flex items-center justify-center mb-6 mt-6 shadow-inner transition-transform duration-500 group-hover:scale-110`}>
              <cycleState.icon size={44} strokeWidth={1.5} />
            </div>
            
            <h2 className="font-display font-black text-2xl text-forest-deepest mb-3 tracking-tight uppercase leading-tight">{cycleState.title}</h2>
            <p className="text-forest-deepest/60 text-[15px] mb-10 leading-relaxed max-w-[250px]">{cycleState.desc}</p>
            
            <div className="w-full flex flex-col gap-2 mt-auto">
              <button onClick={cycleState.action} className="btn-primary w-full shadow-xl flex justify-center items-center gap-2 group">
                {cycleState.btnText} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {cycleState.secondaryBtnText && (
                <button 
                  onClick={cycleState.secondaryAction} 
                  className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-forest-deepest/40 hover:text-forest-deepest transition-colors rounded-xl"
                >
                  {cycleState.secondaryBtnText}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* MODALE DE PROFIL - POSITIONNÉE AU DESSUS DE TOUT */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-deepest/60 backdrop-blur-md p-4 animate-fade-in">
          <div 
            className="w-full max-w-sm bg-forest-deepest border border-mint/20 rounded-[2.5rem] p-8 shadow-2xl relative animate-slide-in-bottom max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()} /* Empêche la fermeture au clic sur la modale */
          >
            
            <button onClick={closeModal} className="absolute top-6 right-6 text-cream/40 hover:text-mint transition-colors bg-white/5 p-2 rounded-full">
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center mt-4 mb-10">
              <div className="w-24 h-24 rounded-full bg-mint/10 flex items-center justify-center text-mint font-display font-black text-4xl mb-4 border border-mint/20 shadow-2xl">
                {userData?.firstName?.[0] || "C"}
              </div>
              <h2 className="text-cream font-display font-black text-2xl tracking-tight">{userData?.firstName || "Chef"}</h2>
              <p className="text-mint/60 text-sm font-medium">{user?.email}</p>
            </div>

            {userData?.householdId && (
              <div className="bg-white/5 rounded-3xl p-5 mb-8 border border-white/10 shadow-inner">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-mint/50 uppercase tracking-[0.2em]">Foyer Actuel</span>
                  <span className="text-[9px] font-mono text-white/20">#{userData.householdId.slice(-6)}</span>
                </div>
                {!isEditingName ? (
                  <div className="flex items-center justify-between group">
                    <p className="text-cream font-black text-xl tracking-tight">{household?.name}</p>
                    <button onClick={() => {setNewHouseholdName(household?.name?.trim() || ""); setIsEditingName(true);}} className="p-2 text-white/30 hover:text-mint transition-colors"><Edit2 size={16}/></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={newHouseholdName} onChange={e => setNewHouseholdName(e.target.value)} className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-cream text-sm outline-none focus:border-mint transition-all" />
                    <button onClick={handleRenameHousehold} className="text-mint p-2"><Check size={24}/></button>
                    <button onClick={() => setIsEditingName(false)} className="text-white/40 p-2"><X size={24}/></button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 mb-10">
              {modalAction === 'join' ? (
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 animate-fade-in">
                  <input type="text" value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Coller l'ID du foyer..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-cream placeholder-white/20 text-sm mb-4 outline-none focus:border-mint transition-all shadow-inner" />
                  <div className="flex gap-2">
                    <button onClick={handleJoinHousehold} disabled={isProcessing} className="bg-mint text-forest-deepest font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-transform active:scale-95">Valider</button>
                    <button onClick={() => setModalAction('none')} className="bg-white/10 text-cream font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest">Retour</button>
                  </div>
                  {actionError && <p className="text-red-400 text-[10px] mt-4 text-center font-bold">{actionError}</p>}
                </div>
              ) : modalAction === 'create' ? (
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 animate-fade-in">
                  <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Nom de votre foyer..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-cream placeholder-white/20 text-sm mb-4 outline-none focus:border-mint transition-all shadow-inner" />
                  <div className="flex gap-2">
                    <button onClick={handleCreateHousehold} disabled={isProcessing} className="bg-mint text-forest-deepest font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-transform active:scale-95">Créer</button>
                    <button onClick={() => setModalAction('none')} className="bg-white/10 text-cream font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest">Retour</button>
                  </div>
                  {actionError && <p className="text-red-400 text-[10px] mt-4 text-center font-bold">{actionError}</p>}
                </div>
              ) : (
                <>
                  <button onClick={() => setModalAction('join')} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-cream p-5 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center text-mint group-hover:scale-110 transition-transform"><ArrowRight size={18}/></div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Rejoindre un foyer</span>
                    </div>
                    <ChevronRight size={16} className="opacity-20" />
                  </button>
                  <button onClick={() => setModalAction('create')} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-cream p-5 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center text-mint group-hover:scale-110 transition-transform"><PlusCircle size={18}/></div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Créer mon foyer</span>
                    </div>
                    <ChevronRight size={16} className="opacity-20" />
                  </button>
                </>
              )}
            </div>

            <button onClick={handleLogout} className="w-full bg-mint hover:bg-[#10b981] text-forest-deepest font-display font-black py-4 rounded-2xl flex justify-center items-center gap-3 mb-4 hover:shadow-[0_8px_25px_rgba(167,243,208,0.3)] transition-all uppercase tracking-widest text-xs">
              <LogOut size={18} /> Déconnexion
            </button>
            <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 text-[10px] py-4 text-red-400 hover:text-red-300 transition-colors font-black uppercase tracking-[0.2em]">
              <UserMinus size={16} /> Supprimer le compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}