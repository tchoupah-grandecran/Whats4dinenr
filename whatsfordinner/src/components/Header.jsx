import { useState } from "react";
import { Settings } from "lucide-react";
import ProfileModal from "./ProfileModal";

export default function Header({ userData, household }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      {/*
          1. glass-panel : gère le flou et le fond via ton CSS
          2. px-6 py-4 : on réduit un peu le padding vertical pour libérer de l'espace
          3. pt-[env(safe-area-inset-top)] : vital pour les iPhone avec encoche
      */}
      <header className="fixed top-0 left-0 w-full z-[100] glass-panel px-6 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center transition-all duration-300">
        <div className="flex flex-col">
          <p className="font-body text-app-text/40 text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5">
            {userData?.householdId ? `Foyer • ${household?.name || "..."}` : "Configuration"}
          </p>
          <h1 className="font-display text-xl text-app-text tracking-tight leading-none">
            Hello, {userData?.firstName || "Chef"}
          </h1>
        </div>

        <button
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-2xl bg-app-bg/50 border border-card-border flex items-center justify-center shadow-sm active:scale-90 transition-all text-app-text/60"
        >
          <Settings size={20} strokeWidth={1.8} />
        </button>
      </header>

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        userData={userData}
        household={household}
      />
    </>
  );
}
