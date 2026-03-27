import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import StatusCard from "../components/StatusCard";
import SkeletonLoader from "../components/SkeletonLoader";
import { X, LogOut, Users, PlusCircle, ArrowRight, UserMinus, AlertTriangle, Edit2, Check } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [modalAction, setModalAction] = useState('none'); // 'none' | 'join' | 'create'
  
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
      await setDoc(doc(db, "households", newId), { name, currentMenu: [], currentCart: [], createdAt: new Date().toISOString() });
      await updateDoc(doc(db, "users", user.uid), { householdId: newId });
      setUserData(prev => ({ ...prev, householdId: newId }));
      setHousehold({ name, currentMenu: [], currentCart: [] });
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

  if (loading) return (
    <div className="pt-6">
      <SkeletonLoader type="header" />
      <SkeletonLoader type="home" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-[90vh] py-6 px-4 animate-fade-in">
      <header className="flex justify-between items-center mb-8 px-2">
        <div>
          <p className="font-display text-text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
            {userData?.householdId ? `Foyer • ${household?.name}` : "Configuration"}
          </p>
          <h1 className="font-display text-3xl font-black text-white tracking-tight leading-none">Hello, {userData?.firstName}</h1>
        </div>
        <div onClick={() => setIsProfileOpen(true)} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gold font-display font-black text-lg cursor-pointer hover:scale-105 transition-transform border border-white/10">
          {userData?.firstName?.[0]?.toUpperCase()}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        {!userData?.householdId ? (
          <div className="glass-card text-center py-10">
            <h2 className="text-xl font-display font-bold text-white mb-4">Bienvenue !</h2>
            <p className="text-text-secondary text-sm mb-8 px-4">Créez votre foyer ou rejoignez celui de votre partenaire.</p>
            <div className="flex flex-col gap-4 px-4">
              <button onClick={() => { setIsProfileOpen(true); setModalAction('create'); }} className="btn-primary w-full">Créer un foyer</button>
              <button onClick={() => { setIsProfileOpen(true); setModalAction('join'); }} className="btn-secondary w-full">Rejoindre un foyer</button>
            </div>
          </div>
        ) : (
          <StatusCard status={household?.currentMenu?.length > 0 ? 'menu-ready' : 'no-menu'} />
        )}
      </main>

      {/* MODALE DE PROFIL RESTAURÉE */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative animate-slide-in-bottom max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button onClick={closeModal} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={24} /></button>
            
            <div className="flex flex-col items-center mt-2 mb-8">
              <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center text-gold font-black text-3xl mb-4 border border-white/10">{userData?.firstName?.[0]}</div>
              <h2 className="text-white font-display font-black text-2xl tracking-tight">{userData?.firstName}</h2>
              <p className="text-text-muted text-sm font-body">{user?.email}</p>
            </div>

            {userData?.householdId && (
              <div className="bg-black/20 rounded-2xl p-4 mb-6 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Foyer Actuel</span>
                  <span className="text-[9px] font-mono text-white/40">{userData.householdId}</span>
                </div>
                {!isEditingName ? (
                  <div className="flex items-center gap-2 group">
                    <p className="text-white font-bold text-lg">{household?.name}</p>
                    <button onClick={() => {setNewHouseholdName(household?.name?.trim() || ""); setIsEditingName(true);}} className="text-white/30 hover:text-white"><Edit2 size={14}/></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={newHouseholdName} onChange={e => setNewHouseholdName(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-white text-sm outline-none focus:border-mint/50" />
                    <button onClick={handleRenameHousehold} className="text-mint"><Check size={20}/></button>
                    <button onClick={() => setIsEditingName(false)} className="text-white/40"><X size={20}/></button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 mb-8">
              {modalAction === 'join' ? (
                <div className="bg-black/30 p-3 rounded-xl border border-mint/20 animate-fade-in">
                  <input type="text" value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="ID du foyer..." className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm mb-2 outline-none focus:border-mint/50" />
                  <div className="flex gap-2">
                    <button onClick={handleJoinHousehold} className="btn-primary flex-1 py-2 text-xs">Valider</button>
                    <button onClick={() => setModalAction('none')} className="btn-ghost flex-1 py-2 text-xs">Annuler</button>
                  </div>
                </div>
              ) : modalAction === 'create' ? (
                <div className="bg-black/30 p-3 rounded-xl border-gold/20 animate-fade-in">
                  <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Nom du foyer..." className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm mb-2 outline-none focus:border-gold/50" />
                  <div className="flex gap-2">
                    <button onClick={handleCreateHousehold} className="btn-primary flex-1 py-2 text-xs">Créer</button>
                    <button onClick={() => setModalAction('none')} className="btn-ghost flex-1 py-2 text-xs">Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setModalAction('join')} className="btn-ghost w-full justify-start text-xs"><ArrowRight size={16} className="text-mint"/> Rejoindre un foyer</button>
                  <button onClick={() => setModalAction('create')} className="btn-ghost w-full justify-start text-xs"><PlusCircle size={16} className="text-gold"/> Créer un foyer</button>
                </>
              )}
            </div>

            <button onClick={handleLogout} className="btn-secondary w-full mb-4"><LogOut size={18} /> Déconnexion</button>
            <button onClick={handleDeleteAccount} className="btn-danger w-full text-xs py-3 border-none bg-transparent hover:bg-red-500/5"><UserMinus size={16} /> Supprimer le compte</button>
          </div>
        </div>
      )}
    </div>
  );
}
