import { motion, AnimatePresence } from "framer-motion";
import {
  X, LogOut, Sun, Moon, Monitor, Edit2, Check,
  PlusCircle, Copy, Home as HomeIcon, Link, Trash2
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc, setDoc, getDoc, collection } from "firebase/firestore";
import { useState, useEffect } from "react";

const MotionDiv = motion.div;

export default function ProfileModal({ isOpen, onClose, userData, household }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "auto");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // États pour les nouvelles actions
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [joinId, setJoinId] = useState("");

  const [actionError, setActionError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (household?.name) setTempName(household.name);
  }, [household]);

  // Thème (Logique inchangée)
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t) => {
      if (t === "dark") root.classList.add("dark");
      else if (t === "light") root.classList.remove("dark");
      else {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        isDark ? root.classList.add("dark") : root.classList.remove("dark");
      }
    };
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- ACTIONS FOYER ---

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return;
    setIsProcessing(true);
    try {
      const newHouseholdRef = doc(collection(db, "households"));
      const hId = newHouseholdRef.id;

      await setDoc(newHouseholdRef, {
        name: newHouseholdName.trim(),
        adminId: userData.uid,
        members: [userData.uid],
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, "users", userData.uid), { householdId: hId });
      setIsCreating(false);
      setNewHouseholdName("");
      onClose(); // On ferme pour rafraîchir le contexte
    } catch { setActionError("Erreur lors de la création."); }
    finally { setIsProcessing(false); }
  };

  const handleJoinHousehold = async () => {
    if (!joinId.trim()) return;
    setIsProcessing(true);
    try {
      const hRef = doc(db, "households", joinId.trim());
      const hSnap = await getDoc(hRef);

      if (!hSnap.exists()) {
        setActionError("ID de foyer introuvable.");
        return;
      }

      await updateDoc(doc(db, "users", userData.uid), { householdId: joinId.trim() });
      setIsJoining(false);
      setJoinId("");
      onClose();
    } catch { setActionError("Erreur lors de la jonction."); }
    finally { setIsProcessing(false); }
  };

  const handleUpdateName = async () => {
    if (!tempName.trim() || tempName === household?.name) {
      setIsEditingName(false);
      return;
    }
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "households", userData.householdId), { name: tempName.trim() });
      setIsEditingName(false);
    } catch { setActionError("Erreur modification."); }
    finally { setIsProcessing(false); }
  };

  const copyId = () => {
    if (userData?.householdId) {
      navigator.clipboard.writeText(userData.householdId);
      alert("ID copié !");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <MotionDiv
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-[var(--color-app-text)]/100 hover:text-[var(--color-accent-ocre)] transition-colors">
              <X size={24} />
            </button>

            {/* Profil User */}
<div className="flex flex-col items-center mb-8 pt-4">
  <div className="w-20 h-20 rounded-[2.5rem] bg-app-bg border border-[var(--color-card-border)] flex items-center justify-center text-[var(--color-accent-ocre)] font-display text-4xl mb-4 shadow-inner overflow-hidden">
    {auth.currentUser?.photoURL ? (
      <img
        src={auth.currentUser.photoURL}
        alt="Profil"
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer" // Important pour éviter les erreurs de chargement d'image Google
      />
    ) : (
      userData?.firstName?.[0] || "C"
    )}
  </div>
  <h2 className="text-[var(--color-app-text)] font-display text-3xl tracking-tight mb-1">
    {userData?.firstName || "Chef"}
  </h2>
  <p className="text-[var(--color-app-text)]/40 text-xs font-medium">
    {auth.currentUser?.email}
  </p>
</div>

            {/* Section Foyer Actuel */}
            <div className="mb-8 space-y-4">
              <h3 className="text-[14px] font-black text-[var(--color-app-text)]/30 px-2">Foyer Actuel</h3>
              <div className="bg-app-bg rounded-[2rem] border border-[var(--color-card-border)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditingName ? (
                      <input
                        autoFocus
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-white dark:bg-black/20 border border-[var(--color-accent-ocre)] rounded-xl px-3 py-2 text-lg font-display w-full outline-none focus:ring-2 ring-[var(--color-accent-ocre)]/20"
                      />
                    ) : (
                      <p className="text-xl font-display text-[var(--color-app-text)]">{household?.name || "Sans nom"}</p>
                    )}
                  </div>
                  <button
                    onClick={isEditingName ? handleUpdateName : () => setIsEditingName(true)}
                    className="ml-4 p-2.5 text-[var(--color-accent-ocre)] hover:bg-[var(--color-accent-ocre)]/10 rounded-xl transition-colors"
                  >
                    {isEditingName ? <Check size={22} /> : <Edit2 size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-card-border)]">
                  <div>
                    <p className="text-[9px] uppercase font-black text-[var(--color-app-text)]/30 mb-0.5">ID de partage</p>
                    <p className="text-[11px] font-mono font-medium text-[var(--color-app-text)]/60">{userData?.householdId || "---"}</p>
                  </div>
                  <button onClick={copyId} className="p-2.5 text-[var(--color-app-text)]/40 hover:text-[var(--color-app-text)] transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Thème */}
            <div className="mb-8">
              <h3 className="text-[14px] font-black text-[var(--color-app-text)]/30 px-2 mb-3">Apparence</h3>
              <div className="grid grid-cols-3 gap-2 bg-app-bg p-1.5 rounded-[1.8rem] border border-[var(--color-card-border)]">
                {[
                  { id: 'light', icon: Sun, label: 'Clair' },
                  { id: 'auto', icon: Monitor, label: 'Auto' },
                  { id: 'dark', icon: Moon, label: 'Sombre' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={`flex flex-col items-center py-3 rounded-2xl transition-all ${theme === item.id ? 'bg-white dark:bg-[var(--color-card-bg)] text-[var(--color-accent-ocre)] shadow-md' : 'text-[var(--color-app-text)]/30 hover:text-[var(--color-app-text)]/50'}`}
                  >
                    <item.icon size={18} />
                    <span className="text-[9px] font-black uppercase mt-1.5 tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Foyer : Créer / Rejoindre */}
            <div className="space-y-3 mb-10">
              <h3 className="text-[14px] font-black text-[var(--color-app-text)]/30 px-2">Gestion du foyer</h3>

              {/* Créer un foyer */}
              <div className="space-y-2">
                {!isCreating ? (
                   <button onClick={() => {setIsCreating(true); setIsJoining(false);}} className="w-full flex items-center justify-between p-4 bg-app-bg rounded-2xl border border-[var(--color-card-border)] text-[10px] font-black text-[var(--color-app-text)]/60 hover:text-[var(--color-accent-ocre)] transition-all uppercase tracking-widest">
                    Créer un nouveau foyer <HomeIcon size={16} />
                  </button>
                ) : (
                  <div className="bg-app-bg p-4 rounded-2xl border border-[var(--color-accent-ocre)]/30 space-y-3">
                    <input
                      placeholder="Nom du foyer..."
                      value={newHouseholdName}
                      onChange={(e) => setNewHouseholdName(e.target.value)}
                      className="w-full bg-white dark:bg-black/20 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-[var(--color-card-border)]"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCreateHousehold} disabled={isProcessing} className="flex-1 bg-[var(--color-accent-ocre)] text-white text-[10px] font-black py-3 rounded-xl uppercase">Valider</button>
                      <button onClick={() => setIsCreating(false)} className="px-4 py-3 bg-white dark:bg-white/5 text-[var(--color-app-text)] text-[10px] font-black rounded-xl uppercase">Annuler</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rejoindre un foyer */}
              <div className="space-y-2">
                {!isJoining ? (
                  <button onClick={() => {setIsJoining(true); setIsCreating(false);}} className="w-full flex items-center justify-between p-4 bg-app-bg rounded-2xl border border-[var(--color-card-border)] text-[10px] font-black text-[var(--color-app-text)]/60 hover:text-[var(--color-accent-ocre)] transition-all uppercase tracking-widest">
                    Rejoindre via un ID <Link size={16} />
                  </button>
                ) : (
                  <div className="bg-app-bg p-4 rounded-2xl border border-[var(--color-accent-ocre)]/30 space-y-3">
                    <input
                      placeholder="Coller l'ID du foyer..."
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      className="w-full bg-white dark:bg-black/20 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-[var(--color-card-border)]"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleJoinHousehold} disabled={isProcessing} className="flex-1 bg-[var(--color-accent-ocre)] text-white text-[10px] font-black py-3 rounded-xl uppercase">Rejoindre</button>
                      <button onClick={() => setIsJoining(false)} className="px-4 py-3 bg-white dark:bg-white/5 text-[var(--color-app-text)] text-[10px] font-black rounded-xl uppercase">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 dark:bg-red-500/10 text-red-500 font-black py-4 rounded-2xl flex justify-center items-center gap-3 transition-all text-[10px] uppercase tracking-[0.2em] border border-red-200/50 dark:border-red-500/20 active:scale-95"
            >
              <LogOut size={16} /> Déconnexion
            </button>

            {actionError && <p className="text-center text-red-500 text-[10px] mt-4 font-black uppercase tracking-tighter">{actionError}</p>}
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
}
