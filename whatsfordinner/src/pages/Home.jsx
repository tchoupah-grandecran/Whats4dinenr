import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import { 
  X, LogOut, PlusCircle, ArrowRight, UserMinus, Edit2, Check, 
  Sparkles, PenLine, ShoppingBag, Utensils, ChevronRight, Copy
} from "lucide-react";
import PageHeader from "../components/PageHeader";

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
  
  const [copied, setCopied] = useState(false);

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
    setIsProfileOpen(false); setModalAction('none'); setJoinId(""); setCreateName(""); setActionError(""); setIsEditingName(false); setCopied(false);
  };

  const copyId = () => {
    if (userData?.householdId) {
      navigator.clipboard.writeText(userData.householdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      btnText: "Voir la liste de courses", action: () => navigate("/cart")
    };
    return {
      step: 4, icon: Utensils, color: "text-gold-deep", bg: "bg-gold-deep/10",
      title: "Aux fourneaux !", desc: "Le frigo est plein, il n'y a plus qu'à cuisiner.", 
      btnText: "Voir les recettes", action: () => navigate("/menu")
    };
  };

  const cycleState = getCycleState();

  if (loading) return <div className="pt-6 px-4"><SkeletonLoader type="home" /></div>;

  return (
    // LA SOLUTION ANTI-SCROLL : absolute inset-0 avec pb-24 (pour laisser la place à la BottomNav)
    <div className="absolute inset-0 flex flex-col pt-6 pb-24 px-4 overflow-hidden animate-fade-in w-full max-w-4xl mx-auto">
      
      <PageHeader 
  subtitle={userData?.householdId ? `Foyer • ${household?.name}` : "Configuration"}
  title={`Hello, ${userData?.firstName || "Chef"}`}
  actionNode={
    <button 
      onClick={() => setIsProfileOpen(true)} 
      className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-forest-deepest border border-forest-deepest/10 shadow-sm transition-transform active:scale-90"
    >
      <span className="font-black text-lg">{userData?.firstName?.[0]?.toUpperCase()}</span>
    </button>
  }
/>

      <main className="flex-1 flex flex-col justify-center items-center">
        {!userData?.householdId ? (
          <div className="glass-card text-center py-10 max-w-sm w-full">
            <h2 className="text-xl font-bold text-forest-deepest mb-4">Bienvenue !</h2>
            <div className="flex flex-col gap-3 px-6">
              <button onClick={() => { setIsProfileOpen(true); setModalAction('create'); }} className="btn-primary w-full">Créer un foyer</button>
              <button onClick={() => { setIsProfileOpen(true); setModalAction('join'); }} className="btn-secondary w-full">Rejoindre un foyer</button>
            </div>
          </div>
        ) : cycleState ? (
          <div className="glass-card flex flex-col items-center pt-10 px-8 pb-8 text-center max-w-sm w-full">
            <div className={`w-20 h-20 rounded-full ${cycleState.bg} ${cycleState.color} flex items-center justify-center mb-6`}>
              <cycleState.icon size={36} />
            </div>
            <h2 className="font-display font-black text-xl text-forest-deepest mb-2 uppercase">{cycleState.title}</h2>
            <p className="text-forest-deepest/50 text-sm mb-8 leading-relaxed">{cycleState.desc}</p>
            <button onClick={cycleState.action} className="btn-primary w-full flex justify-center items-center gap-2">
              {cycleState.btnText} <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </main>

      {/* MODALE PORTAL EN THEME SOMBRE */}
      {isProfileOpen && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in" 
          style={{ zIndex: 99999, backgroundColor: 'rgba(6, 9, 7, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={closeModal}
        >
          <div 
            className="w-full max-w-sm bg-forest-deepest border border-mint/20 rounded-[2.5rem] p-8 shadow-2xl relative animate-slide-in-bottom max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-6 right-6 text-cream/30 hover:text-mint transition-colors p-2 bg-white/5 rounded-full">
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center mb-8 mt-2">
              <div className="w-20 h-20 rounded-full bg-mint/10 flex items-center justify-center text-mint font-display font-black text-3xl mb-4 border border-mint/20 shadow-sm">
                {userData?.firstName?.[0] || "C"}
              </div>
              <h2 className="text-cream font-display font-black text-2xl tracking-tight leading-none mb-1">{userData?.firstName || "Chef"}</h2>
              <p className="text-mint/60 text-xs font-medium">{user?.email}</p>
            </div>

            {userData?.householdId && (
              <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 shadow-inner">
                <p className="text-[9px] font-black text-mint/50 uppercase tracking-[0.2em] mb-4">Votre Foyer</p>

                {/* NOM DU FOYER */}
                {!isEditingName ? (
                  <div className="flex items-center justify-between group mb-1">
                    <h3 className="text-cream font-black text-2xl tracking-tight truncate mr-2">{household?.name}</h3>
                    <button onClick={() => {setNewHouseholdName(household?.name || ""); setIsEditingName(true);}} className="p-2 text-cream/30 hover:text-mint transition-colors shrink-0"><Edit2 size={16}/></button>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-2">
                    <input type="text" autoFocus value={newHouseholdName} onChange={e => setNewHouseholdName(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-cream text-sm outline-none focus:border-mint transition-all shadow-inner" />
                    <button onClick={handleRenameHousehold} className="text-mint p-2 shrink-0"><Check size={20}/></button>
                    <button onClick={() => setIsEditingName(false)} className="text-cream/30 hover:text-cream p-2 shrink-0"><X size={20}/></button>
                  </div>
                )}
                
                {/* ID DU FOYER - DESIGN ÉPURÉ SANS CADRE */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-cream/40 uppercase tracking-widest font-bold">Identifiant Unique</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cream/60 truncate">{userData.householdId}</span>
                    
                    <button 
                      onClick={copyId} 
                      disabled={copied}
                      className={`flex items-center justify-center h-8 transition-all font-black uppercase tracking-widest shrink-0 ${
                        copied 
                          ? 'text-mint text-[9px]' 
                          : 'text-mint/60 hover:text-mint'
                      }`}
                    >
                      {copied ? (
                        <><Check size={14} className="mr-1" /> Copié !</>
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-10">
              {modalAction === 'join' ? (
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 animate-fade-in">
                  <input type="text" autoFocus value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Coller l'ID du foyer..." className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-cream placeholder-white/30 text-sm mb-4 outline-none focus:border-mint transition-all shadow-inner" />
                  <div className="flex gap-2">
                    <button onClick={handleJoinHousehold} disabled={isProcessing} className="bg-mint text-forest-deepest font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-transform">Valider</button>
                    <button onClick={() => setModalAction('none')} className="bg-white/10 text-cream border border-white/10 font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-sm">Retour</button>
                  </div>
                  {actionError && <p className="text-red-400 text-[10px] mt-4 text-center font-bold uppercase tracking-widest">{actionError}</p>}
                </div>
              ) : modalAction === 'create' ? (
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 animate-fade-in">
                  <input type="text" autoFocus value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Nom du foyer..." className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-cream placeholder-white/30 text-sm mb-4 outline-none focus:border-mint transition-all shadow-inner" />
                  <div className="flex gap-2">
                    <button onClick={handleCreateHousehold} disabled={isProcessing} className="bg-mint text-forest-deepest font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-transform">Créer</button>
                    <button onClick={() => setModalAction('none')} className="bg-white/10 text-cream border border-white/10 font-black flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-sm">Retour</button>
                  </div>
                  {actionError && <p className="text-red-400 text-[10px] mt-4 text-center font-bold uppercase tracking-widest">{actionError}</p>}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={() => setModalAction('join')} className="w-full flex items-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-mint-deep/10 flex items-center justify-center text-mint-deep group-hover:scale-110 transition-transform mr-4"><ArrowRight size={18}/></div>
                    <div className="flex flex-col items-start text-left">
                       <span className="text-[11px] font-black text-cream uppercase tracking-widest">Rejoindre un foyer</span>
                       <span className="text-[9px] text-cream/40 mt-0.5">Utilisez un ID existant</span>
                    </div>
                    <ChevronRight size={16} className="text-cream/20 ml-auto group-hover:text-mint-deep transition-colors" />
                  </button>
                  <button onClick={() => setModalAction('create')} className="w-full flex items-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-mint-deep/10 flex items-center justify-center text-mint-deep group-hover:scale-110 transition-transform mr-4"><PlusCircle size={18}/></div>
                    <div className="flex flex-col items-start text-left">
                       <span className="text-[11px] font-black text-cream uppercase tracking-widest">Créer un foyer</span>
                       <span className="text-[9px] text-cream/40 mt-0.5">Commencez un tout nouveau foyer</span>
                    </div>
                    <ChevronRight size={16} className="text-cream/20 ml-auto group-hover:text-mint-deep transition-colors" />
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="w-full bg-mint hover:bg-[#10b981] text-forest-deepest font-black py-4 rounded-2xl flex justify-center items-center gap-3 mb-4 transition-all uppercase tracking-widest text-[11px]">
              <LogOut size={16} /> Déconnexion
            </button>
            <button onClick={handleDeleteAccount} className="w-full text-red-400 hover:text-red-300 py-2 rounded-xl transition-colors font-black uppercase tracking-[0.2em] text-[9px]">
              Supprimer le compte
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}