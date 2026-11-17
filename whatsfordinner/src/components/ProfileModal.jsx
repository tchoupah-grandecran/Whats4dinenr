import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, Check, Copy, Edit2, Home, Link2, LogOut, Moon,
  Monitor, Plus, Sun, X,
} from "lucide-react";
import { createElement, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const MotionDiv = motion.div;
const MotionSection = motion.section;
const easing = [0.16, 1, 0.3, 1];

function SectionHeading({ number, label, detail, icon: SectionIcon }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-card-border text-app-text/45">
          {createElement(SectionIcon, { size: 14, strokeWidth: 1.7 })}
        </span>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[.2em] text-app-text/35">{number} · {label}</p>
          <h3 className="mt-0.5 text-[11px] font-semibold tracking-wide text-app-text">{detail}</h3>
        </div>
      </div>
    </div>
  );
}

export default function ProfileModal({ isOpen, onClose, userData, household }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "auto");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [actionError, setActionError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (household?.name) setTempName(household.name);
  }, [household]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (value) => {
      if (value === "dark") root.classList.add("dark");
      else if (value === "light") root.classList.remove("dark");
      else window.matchMedia("(prefers-color-scheme: dark)").matches
        ? root.classList.add("dark")
        : root.classList.remove("dark");
    };
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim() || !userData?.uid) return;
    setIsProcessing(true);
    setActionError("");
    try {
      const householdRef = doc(collection(db, "households"));
      await setDoc(householdRef, {
        name: newHouseholdName.trim(),
        adminId: userData.uid,
        members: [userData.uid],
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "users", userData.uid), { householdId: householdRef.id });
      setIsCreating(false);
      setNewHouseholdName("");
      onClose();
    } catch {
      setActionError("Erreur lors de la création du foyer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinId.trim() || !userData?.uid) return;
    setIsProcessing(true);
    setActionError("");
    try {
      const householdId = joinId.trim();
      const householdSnap = await getDoc(doc(db, "households", householdId));
      if (!householdSnap.exists()) {
        setActionError("ID de foyer introuvable.");
        return;
      }
      await updateDoc(doc(db, "users", userData.uid), { householdId });
      setIsJoining(false);
      setJoinId("");
      onClose();
    } catch {
      setActionError("Erreur lors de la jonction au foyer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateName = async () => {
    if (!tempName.trim() || tempName.trim() === household?.name) {
      setIsEditingName(false);
      return;
    }
    setIsProcessing(true);
    setActionError("");
    try {
      await updateDoc(doc(db, "households", userData.householdId), { name: tempName.trim() });
      setIsEditingName(false);
    } catch {
      setActionError("Impossible de modifier le nom du foyer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyId = async () => {
    if (!userData?.householdId) return;
    try {
      await navigator.clipboard.writeText(userData.householdId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setActionError("Impossible de copier l’ID.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const closeAction = () => {
    setIsCreating(false);
    setIsJoining(false);
    setActionError("");
  };

  const themeLabel = { light: "Clair", dark: "Sombre", auto: "Système" }[theme];
  const themes = [
    { id: "light", icon: Sun, label: "Clair" },
    { id: "auto", icon: Monitor, label: "Système" },
    { id: "dark", icon: Moon, label: "Sombre" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <MotionDiv
            aria-hidden="true"
            className="absolute inset-0 bg-app-text/45 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <MotionDiv
            role="dialog" aria-modal="true" aria-labelledby="profile-title"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.45, ease: easing }}
            onClick={(event) => event.stopPropagation()}
            className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-card-border bg-card-bg text-app-text shadow-[0_30px_80px_rgba(0,0,0,0.16)] scrollbar-hide sm:rounded-[2rem]"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.018]" style={{ backgroundImage: "radial-gradient(var(--color-app-text) 0.5px, transparent 0.5px)", backgroundSize: "28px 28px" }} />
            <div className="relative flex items-center justify-between border-b border-card-border px-6 py-4 sm:px-8">
              <p className="text-[8px] font-bold uppercase tracking-[.28em] text-app-text/45">Votre espace</p>
              <button onClick={onClose} aria-label="Fermer le profil" className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-app-text/55 transition hover:bg-app-bg hover:text-app-text">
                <X size={17} strokeWidth={1.7} />
              </button>
            </div>

            <div className="relative space-y-7 px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
              <MotionSection initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: easing }} className="relative flex min-h-28 items-end justify-between border-b border-card-border pb-6">
                <div className="flex items-end gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.25rem] border border-card-border bg-app-bg font-display text-3xl text-accent-ocre sm:h-[72px] sm:w-[72px]">
                    {auth.currentUser?.photoURL ? <img src={auth.currentUser.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : (userData?.firstName?.[0] || "C").toUpperCase()}
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-card-bg bg-accent-ocre" />
                  </div>
                  <div className="pb-0.5">
                    <p className="mb-1 text-[8px] font-bold uppercase tracking-[.22em] text-app-text/40">Bonjour</p>
                    <h2 id="profile-title" className="font-display text-[2rem] leading-[.95] tracking-tight text-app-text sm:text-[2.35rem]">{userData?.firstName || "Chef"}</h2>
                    <p className="mt-2 text-[10px] text-app-text/45 sm:text-[11px]">{auth.currentUser?.email || ""}</p>
                  </div>
                </div>
                <span aria-hidden="true" className="hidden select-none font-display text-[5.5rem] leading-[.7] text-app-text/[.045] sm:block">01</span>
              </MotionSection>

              <MotionSection initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.45, ease: easing }}>
                <SectionHeading number="02" label="Foyer" detail="Votre cuisine" icon={Home} />
                <div className="relative overflow-hidden rounded-[1.35rem] border border-card-border bg-app-bg p-5">
                  <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full border border-app-text/[.035]" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[8px] font-bold uppercase tracking-[.18em] text-app-text/40">Foyer actuel</p>
                      {isEditingName ? (
                        <input autoFocus value={tempName} onChange={(event) => setTempName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleUpdateName()} className="w-full rounded-lg border border-accent-ocre/30 bg-card-bg px-3 py-2 font-display text-lg outline-none" />
                      ) : <p className="truncate font-display text-[1.4rem] leading-tight text-app-text">{household?.name || "Sans nom"}</p>}
                    </div>
                    <button onClick={isEditingName ? handleUpdateName : () => setIsEditingName(true)} disabled={isProcessing} aria-label={isEditingName ? "Enregistrer le nom" : "Modifier le nom du foyer"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-card-border bg-card-bg text-app-text/55 transition hover:border-accent-ocre/30 hover:text-accent-ocre disabled:opacity-50">
                      {isEditingName ? <Check size={16} /> : <Edit2 size={15} />}
                    </button>
                  </div>
                  <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-card-border pt-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-[8px] font-bold uppercase tracking-[.16em] text-app-text/35">ID de partage</p>
                      <p className="truncate font-mono text-[10px] text-app-text/55">{userData?.householdId || "—"}</p>
                    </div>
                    <button onClick={copyId} disabled={!userData?.householdId} className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[.12em] text-accent-ocre transition hover:bg-card-bg disabled:opacity-40">
                      {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copié" : "Copier"}
                    </button>
                  </div>
                </div>
              </MotionSection>

              <MotionSection initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45, ease: easing }}>
                <div className="mb-3 flex items-center justify-between px-1">
                  <div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-app-text/35">03 · Ambiance</p><h3 className="mt-0.5 text-[11px] font-semibold tracking-wide">Apparence</h3></div>
                  <span className="text-[8px] font-bold uppercase tracking-[.15em] text-app-text/35">{themeLabel}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map(({ id, icon: ThemeIcon, label }) => (
                    <button key={id} onClick={() => setTheme(id)} aria-pressed={theme === id} className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 transition ${theme === id ? "border-accent-ocre/25 bg-accent-ocre/[.08] text-accent-ocre" : "border-card-border bg-card-bg text-app-text/45 hover:text-app-text"}`}>
                      {createElement(ThemeIcon, { size: 16, strokeWidth: 1.7 })}<span className="text-[8px] font-bold uppercase tracking-[.12em]">{label}</span>
                    </button>
                  ))}
                </div>
              </MotionSection>

              <MotionSection initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.45, ease: easing }}>
                <SectionHeading number="04" label="Partager" detail="Le foyer" icon={Link2} />
                <div className="space-y-2">
                  <AnimatePresence mode="wait" initial={false}>
                    {isCreating ? (
                      <MotionDiv key="create" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="rounded-[1.2rem] border border-accent-ocre/20 bg-accent-ocre/[.035] p-4">
                          <p className="mb-3 text-[8px] font-bold uppercase tracking-[.18em] text-app-text/45">Nouveau foyer</p>
                          <input autoFocus placeholder="Nom du foyer" value={newHouseholdName} onChange={(event) => setNewHouseholdName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleCreateHousehold()} className="mb-2 w-full rounded-lg border border-card-border bg-card-bg px-3 py-3 text-xs outline-none focus:border-accent-ocre/40" />
                          <div className="flex gap-2"><button onClick={handleCreateHousehold} disabled={isProcessing || !newHouseholdName.trim()} className="flex-1 rounded-lg bg-accent-ocre px-3 py-2.5 text-[9px] font-bold uppercase tracking-[.14em] text-white disabled:opacity-50">{isProcessing ? "Création…" : "Créer"}</button><button onClick={closeAction} className="rounded-lg border border-card-border px-3 py-2.5 text-app-text/60" aria-label="Annuler"><X size={15} /></button></div>
                        </div>
                      </MotionDiv>
                    ) : isJoining ? (
                      <MotionDiv key="join" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="rounded-[1.2rem] border border-accent-ocre/20 bg-accent-ocre/[.035] p-4">
                          <p className="mb-3 text-[8px] font-bold uppercase tracking-[.18em] text-app-text/45">Rejoindre un foyer</p>
                          <input autoFocus placeholder="Coller l’ID du foyer" value={joinId} onChange={(event) => setJoinId(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleJoinHousehold()} className="mb-2 w-full rounded-lg border border-card-border bg-card-bg px-3 py-3 text-xs outline-none focus:border-accent-ocre/40" />
                          <div className="flex gap-2"><button onClick={handleJoinHousehold} disabled={isProcessing || !joinId.trim()} className="flex-1 rounded-lg bg-accent-ocre px-3 py-2.5 text-[9px] font-bold uppercase tracking-[.14em] text-white disabled:opacity-50">{isProcessing ? "Connexion…" : "Rejoindre"}</button><button onClick={closeAction} className="rounded-lg border border-card-border px-3 py-2.5 text-app-text/60" aria-label="Annuler"><X size={15} /></button></div>
                        </div>
                      </MotionDiv>
                    ) : (
                      <MotionDiv key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        <button onClick={() => { setIsCreating(true); setActionError(""); }} className="group flex w-full items-center justify-between gap-4 rounded-xl border border-card-border bg-card-bg px-4 py-3.5 text-left transition hover:border-accent-ocre/30 hover:bg-app-bg">
                          <span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-bg text-accent-ocre"><Plus size={16} /></span><span className="text-[9px] font-bold uppercase tracking-[.14em]">Créer un nouveau foyer</span></span><ArrowUpRight size={15} className="text-app-text/35 transition group-hover:text-accent-ocre" />
                        </button>
                        <button onClick={() => { setIsJoining(true); setActionError(""); }} className="group flex w-full items-center justify-between gap-4 rounded-xl border border-card-border bg-card-bg px-4 py-3.5 text-left transition hover:border-accent-ocre/30 hover:bg-app-bg">
                          <span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-bg text-accent-ocre"><Link2 size={15} /></span><span className="text-[9px] font-bold uppercase tracking-[.14em]">Rejoindre via un ID</span></span><ArrowUpRight size={15} className="text-app-text/35 transition group-hover:text-accent-ocre" />
                        </button>
                      </MotionDiv>
                    )}
                  </AnimatePresence>
                </div>
                {actionError && <p role="alert" className="mt-2 px-1 text-[10px] text-red-600">{actionError}</p>}
              </MotionSection>

              <MotionSection initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.45, ease: easing }} className="border-t border-card-border pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div><p className="font-display text-lg leading-none">Dinner</p><p className="mt-1 text-[9px] text-app-text/40">À bientôt à table.</p></div>
                  <button onClick={handleLogout} className="flex items-center gap-2 rounded-full px-3 py-2 text-[8px] font-bold uppercase tracking-[.15em] text-red-600/70 transition hover:bg-red-500/[.06] hover:text-red-600"><LogOut size={14} /> Déconnexion</button>
                </div>
                <p className="text-center text-[7px] font-bold uppercase tracking-[.28em] text-app-text/[.22]">Plan · Shop · Cook</p>
              </MotionSection>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
}
