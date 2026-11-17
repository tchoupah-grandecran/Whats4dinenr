import { useState } from "react";
import { auth } from "../lib/firebase";
import ProfileModal from "./ProfileModal";

export default function Header({ userData, household }) {
  const [showProfile, setShowProfile] = useState(false);
  const [failedPhotoURL, setFailedPhotoURL] = useState(null);
  const photoURL = auth.currentUser?.photoURL;

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-[100] glass-panel px-6 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center transition-all duration-300">
        <div className="flex flex-col">
          <p className="font-body text-app-text/40 text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5">
            {userData?.householdId ? `Foyer • ${household?.name || "..."}` : "Configuration"}
          </p>
          <p className="font-display text-xl text-app-text tracking-tight leading-none">
            Hello, {userData?.firstName || "Chef"}
          </p>
        </div>

        <button
          onClick={() => setShowProfile(true)}
          aria-label="Ouvrir mon profil"
          className="w-11 h-11 rounded-full bg-app-bg border border-card-border flex items-center justify-center shadow-sm active:scale-95 transition-all text-app-text/60 font-body text-sm font-semibold"
        >
          {photoURL && failedPhotoURL !== photoURL ? (
            <img
              src={photoURL}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setFailedPhotoURL(photoURL)}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            (userData?.firstName?.[0] || "C").toUpperCase()
          )}
        </button>
      </div>

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        userData={userData}
        household={household}
      />
    </>
  );
}
