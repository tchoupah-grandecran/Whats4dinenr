import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import StatusCard from "../components/StatusCard";
import { X, LogOut, Users, PlusCircle, ArrowRight, UserMinus, AlertTriangle, Edit2, Check } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États de la modale
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [modalAction, setModalAction] = useState('none'); // 'none' | 'join' | 'create'
  
  // États pour "Rejoindre" et "Créer"
  const [joinId, setJoinId] = useState("");
  const [createName, setCreateName] = useState("");
  const [actionError, setActionError] = useState("");
  
  // États pour "Renommer le foyer"
  const [isEditingName, setIsEditingName] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const user = auth.currentUser;

  // 1. Récupération des données au chargement
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setUserData(uData);

          if (uData.householdId) {
            const houseRef = doc(db, "households", uData.householdId);
            const houseSnap = await getDoc(houseRef);
            if (houseSnap.exists()) {
              setHousehold(houseSnap.data());
            }
          }
        }
      } catch (error) {
        console.error("Erreur de récupération:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  // 2. Créer un NOUVEAU foyer (avec le nom choisi)
  const handleCreateHousehold = async () => {
    if (!createName.trim()) return;
    setIsProcessing(true);
    setActionError("");

    try {
      const newHouseholdId = `HH_${Date.now()}`;
      const finalName = createName.trim();
      
      await setDoc(doc(db, "households", newHouseholdId), {
        name: finalName,
        currentMenu: [],
        currentCart: [],
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, "users", user.uid), {
        householdId: newHouseholdId
      });

      setUserData(prev => ({ ...prev, householdId: newHouseholdId }));
      setHousehold({ name: finalName, currentMenu: [], currentCart: [] });
      closeModal();
    } catch (error) {
      console.error(error);
      setActionError("Erreur lors de la création du foyer.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. REJOINDRE un foyer existant
  const handleJoinHousehold = async () => {
    if (!joinId.trim()) return;
    setIsProcessing(true);
    setActionError("");

    try {
      const houseRef = doc(db, "households", joinId.trim());
      const houseSnap = await getDoc(houseRef);
      
      if (houseSnap.exists()) {
        await updateDoc(doc(db, "users", user.uid), {
          householdId: joinId.trim()
        });
        setUserData(prev => ({ ...prev, householdId: joinId.trim() }));
        setHousehold(houseSnap.data());
        closeModal();
      } else {
        setActionError("Foyer introuvable. Vérifiez l'ID.");
      }
    } catch (error) {
      console.error(error);
      setActionError("Erreur lors de la connexion.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. RENOMMER le foyer
  const handleRenameHousehold = async () => {
    if (!newHouseholdName.trim() || !userData?.householdId) {
      setIsEditingName(false);
      return;
    }
    
    setIsProcessing(true);
    try {
      const trimmedName = newHouseholdName.trim();
      await updateDoc(doc(db, "households", userData.householdId), {
        name: trimmedName
      });
      setHousehold(prev => ({ ...prev, name: trimmedName }));
      setIsEditingName(false);
    } catch (error) {
      console.error("Erreur de renommage:", error);
      alert("Erreur lors du renommage du foyer.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Se déconnecter
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // 6. SUPPRIMER le compte
  const handleDeleteAccount = async () => {
    const confirm = window.confirm("ATTENTION : Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/login");
    } catch (error) {
      console.error("Erreur de suppression:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Sécurité Firebase : Votre session est trop ancienne. Veuillez vous déconnecter, vous reconnecter, puis réessayer.");
      } else {
        alert("Une erreur est survenue lors de la suppression du compte.");
      }
    }
  };

  // Helper pour tout réinitialiser en fermant la modale
  const closeModal = () => {
    setIsProfileOpen(false);
    setModalAction('none');
    setJoinId("");
    setCreateName("");
    setActionError("");
    setIsEditingName(false);
  };

  const getStatus = () => {
    if (!household?.currentMenu || household.currentMenu.length === 0) return 'no-menu';
    if (!household?.currentCart || household.currentCart.length === 0) return 'menu-ready';
    const isCartDone = household.currentCart.every(item => item.checked);
    if (!isCartDone) return 'cart-active';
    return 'cart-done';
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-white">Chargement...</div>;

  return (
    <div className="flex flex-col min-h-[90vh] py-6 px-4 animate-in fade-in duration-700">
      
      <header className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <p className="font-display text-text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
            {userData?.householdId ? `Foyer • ${household?.name}` : "Configuration"}
          </p>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">
            Hello, {userData?.firstName}
          </h1>
        </div>
        
        <div 
          onClick={() => setIsProfileOpen(true)}
          title="Voir mon profil"
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gold font-display font-black text-lg cursor-pointer hover:scale-105 transition-transform hover:border-gold/50"
        >
          {userData?.firstName?.[0]?.toUpperCase()}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        {!userData?.householdId ? (
          <div className="glass-panel rounded-3xl p-8 text-center">
            <h2 className="text-xl font-display font-bold text-white mb-4">Bienvenue à bord !</h2>
            <p className="text-text-secondary text-sm mb-8">
              Pour commencer, créez un foyer ou rejoignez celui de votre conjoint(e) grâce à son ID.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setIsProfileOpen(true); setModalAction('create'); }}
                className="w-full py-4 rounded-full font-display font-bold text-forest-deepest bg-gradient-to-r from-sage to-mint shadow-[0_0_20px_rgba(122,171,130,0.3)] hover:scale-[1.02] transition-transform"
              >
                Créer un nouveau foyer
              </button>
              <button 
                onClick={() => { setIsProfileOpen(true); setModalAction('join'); }}
                className="w-full py-4 rounded-full font-display font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Rejoindre un foyer existant
              </button>
            </div>
          </div>
        ) : (
          <StatusCard status={getStatus()} />
        )}
      </main>

      {/* ================= MODALE DE PROFIL ================= */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto bg-forest-mid border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 scrollbar-hide">
            
            <button onClick={closeModal} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>

            {/* EN-TÊTE PROFIL */}
            <div className="flex flex-col items-center mt-2 mb-6 text-center">
              <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center text-gold font-display font-black text-3xl mb-4 shadow-[0_0_20px_rgba(240,201,74,0.15)]">
                {userData?.firstName?.[0]?.toUpperCase()}
              </div>
              <h2 className="font-display text-2xl font-black text-white tracking-tight">
                {userData?.firstName}
              </h2>
              <p className="font-body text-text-muted text-sm mt-1">
                {user?.email}
              </p>
            </div>
            
            {/* INFOS FOYER ACTUEL */}
            {userData?.householdId && (
              <div className="bg-black/20 rounded-2xl p-4 mb-6 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sage/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="flex justify-between items-center gap-3 mb-4 relative z-10">
                  <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-1.5 shrink-0">
                    <Users size={12} /> Foyer Actuel
                  </h3>
                  <span className="text-[9px] font-mono text-text-muted bg-black/30 px-1.5 py-0.5 rounded border border-white/5 break-all select-all opacity-70 group-hover:opacity-100 transition-opacity">
                    {userData.householdId}
                  </span>
                </div>

                {/* CHAMP NOM DU FOYER & ÉDITION (AVEC CORRECTION DU CURSEUR) */}
                {!isEditingName ? (
                  <div className="flex items-center gap-2 relative z-10 group/edit">
                    <p className="font-display text-white font-bold text-lg leading-tight">
                      {household?.name}
                    </p>
                    <button 
                      onClick={() => {
                        // LE FAMEUX .trim() QUI RÈGLE LE PROBLÈME D'ESPACE !
                        setNewHouseholdName(household?.name ? household.name.trim() : "");
                        setIsEditingName(true);
                      }}
                      className="text-text-muted opacity-50 group-hover/edit:opacity-100 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                      title="Renommer"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 relative z-10 mt-1">
                    <input 
                      type="text" 
                      value={newHouseholdName} 
                      onChange={e => setNewHouseholdName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameHousehold()}
                      autoFocus
                      className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-display font-bold focus:outline-none focus:border-mint/50"
                    />
                    <button onClick={handleRenameHousehold} disabled={isProcessing} className="text-mint hover:bg-mint/10 p-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="text-text-muted hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS FOYER */}
            <div className="flex flex-col gap-2 mb-8 relative z-10">
              
              {/* REJOINDRE */}
              {modalAction !== 'join' ? (
                <button onClick={() => setModalAction('join')} className="w-full py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-between px-4 text-sm font-display font-bold border border-white/5">
                  <span className="flex items-center gap-2"><ArrowRight size={16} className="text-mint" /> Rejoindre un autre foyer</span>
                </button>
              ) : (
                <div className="bg-black/20 p-3 rounded-xl border border-white/10 flex flex-col gap-2 animate-in slide-in-from-top-2">
                  <input type="text" value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Collez l'ID du foyer..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-mint/50 font-mono" />
                  {actionError && <p className="text-[10px] text-red-400 px-1">{actionError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => {setModalAction('none'); setActionError("");}} className="flex-1 py-2 rounded-lg bg-white/5 text-text-muted text-xs hover:bg-white/10 transition-colors">Annuler</button>
                    <button onClick={handleJoinHousehold} disabled={isProcessing || !joinId.trim()} className="flex-1 py-2 rounded-lg bg-mint/20 text-mint font-bold text-xs hover:bg-mint/30 transition-colors disabled:opacity-50">Rejoindre</button>
                  </div>
                </div>
              )}

              {/* CRÉER */}
              {modalAction !== 'create' ? (
                <button 
                  onClick={() => {
                    if(userData?.householdId && !window.confirm("Créer un nouveau foyer vous déconnectera du foyer actuel. Continuer ?")) return;
                    setModalAction('create');
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-between px-4 text-sm font-display font-bold border border-white/5"
                >
                  <span className="flex items-center gap-2"><PlusCircle size={16} className="text-gold" /> Créer un nouveau foyer</span>
                </button>
              ) : (
                <div className="bg-black/20 p-3 rounded-xl border border-white/10 flex flex-col gap-2 animate-in slide-in-from-top-2">
                  <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Nom du nouveau foyer..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-gold/50" autoFocus />
                  {actionError && <p className="text-[10px] text-red-400 px-1">{actionError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => {setModalAction('none'); setActionError("");}} className="flex-1 py-2 rounded-lg bg-white/5 text-text-muted text-xs hover:bg-white/10 transition-colors">Annuler</button>
                    <button onClick={handleCreateHousehold} disabled={isProcessing || !createName.trim()} className="flex-1 py-2 rounded-lg bg-gold/20 text-gold font-bold text-xs hover:bg-gold/30 transition-colors disabled:opacity-50">Créer</button>
                  </div>
                </div>
              )}
            </div>
            
            {/* DÉCONNEXION */}
            <button onClick={handleLogout} className="w-full py-3.5 mb-6 rounded-xl font-display font-bold text-white bg-white/5 hover:bg-white/10 transition-colors flex justify-center items-center gap-2 border border-white/10 relative z-10">
              <LogOut size={18} /> Se déconnecter
            </button>

            {/* ZONE DANGEREUSE */}
            <div className="border-t border-red-500/10 pt-2 relative z-10">
              <button onClick={handleDeleteAccount} className="w-full py-3 rounded-xl font-display font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors flex justify-center items-center gap-2 text-sm">
                <UserMinus size={16} /> Supprimer mon compte
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}