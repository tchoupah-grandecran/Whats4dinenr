import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ChefHat, Loader2 } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : "Chef";
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName,
          firstName: firstName,
          householdId: null,
          createdAt: new Date().toISOString()
        });
      }
      navigate("/");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.6; }
          80% { transform: translateY(-25px) scale(1.3); opacity: 0; }
          100% { transform: translateY(-25px) scale(1.3); opacity: 0; }
        }
        @keyframes finalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-steam { animation: steam 3.5s ease-in-out infinite; }
        .animate-final-appear { animation: finalSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* CONTENEUR PRINCIPAL : Utilise var(--color-app-bg) qui est notre Crème */}
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[var(--color-app-bg)] px-6">

        {/* LE FOND : Points discrets au lieu du motif complexe */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(var(--color-app-text) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* LA CARTE CENTRALE : On passe en mode "Papier Blanc" sur fond Crème */}
        <div className="relative w-full max-w-sm flex flex-col items-center p-12 text-center bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(217,119,6,0.08)] border border-[var(--color-card-border)] animate-final-appear z-10">

          <div className="relative mb-10">
            {/* Vapeur Ocre */}
            <svg className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 text-[var(--color-accent-ocre)]/40 animate-steam" viewBox="0 0 100 100" fill="none">
              <path d="M50 80C55 70 45 60 50 50C55 40 65 40 60 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <path d="M35 75C40 65 30 55 35 45C40 35 50 35 45 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="delay-150"/>
              <path d="M65 75C70 65 60 55 65 45C70 35 80 35 75 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="delay-300"/>
            </svg>

            {/* Icone ChefHat dans un carré très arrondi Ocre */}
            <div className="w-24 h-24 rounded-[2.2rem] bg-[var(--color-accent-ocre)] flex items-center justify-center text-white shadow-[0_15px_35px_rgba(217,119,6,0.25)] relative z-10">
              <ChefHat size={48} strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="font-display text-[2.75rem] text-[var(--color-app-text)] tracking-tight mb-4 leading-[0.9]">
            What's for Dinner
          </h1>

          <p className="font-body text-[var(--color-app-text)]/60 text-base leading-relaxed px-4 mb-12">
            Planifiez votre semaine en un clic, savourez chaque repas.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative flex items-center justify-center gap-4 bg-white text-[var(--color-app-text)] border-2 border-[var(--color-card-border)] hover:border-[var(--color-accent-ocre)] hover:shadow-[0_10px_30px_rgba(217,119,6,0.1)] active:scale-[0.96] disabled:opacity-50 rounded-2xl py-4 px-8 w-full transition-all duration-300 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-[var(--color-accent-ocre)]" size={24} />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-body font-bold text-[15px] tracking-wide">Continuer avec Google</span>
              </>
            )}
          </button>

          {/* Petit message de rassurance en Satoshi */}
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-app-text)]/30">
            Cuisine artisanale • 100% Gratuit
          </p>

        </div>
      </div>
    </>
  );
}
