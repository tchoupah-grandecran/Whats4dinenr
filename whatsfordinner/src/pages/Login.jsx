import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ChefHat, Loader2 } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

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
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName,
          householdId: null,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* INJECTION DES ANIMATIONS SPÉCIFIQUES À CETTE PAGE */}
      <style>{`
        @keyframes mintGlow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          80% { transform: translateY(-20px) scale(1.2); opacity: 0; }
          100% { transform: translateY(-20px) scale(1.2); opacity: 0; }
        }
        @keyframes finalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-mint-glow { animation: mintGlow 6s ease-in-out infinite; }
        .animate-steam { animation: steam 3s ease-in-out infinite; }
        .animate-final-appear { animation: finalSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
      `}</style>

      {/* CONTENEUR PRINCIPAL VERROUILLÉ */}
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen items-center justify-center overflow-hidden overscroll-none bg-[#060907] px-6">
        
        {/* halo de lumière Mint Diffus (Effet "Wow" de fond) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-mint-deep/10 blur-[120px] rounded-full animate-mint-glow pointer-events-none" />

        {/* CONTENU ENTRANT (avec animation de montée) */}
        <div className="relative w-full max-w-sm flex flex-col items-center p-12 text-center glass-card border-mint/10 shadow-[0_32px_128px_rgba(167,243,208,0.15)] animate-final-appear">
          
          {/* ZONE LOGO + ILLUSTRATION VIVANTE */}
          <div className="relative mb-10 mt-[-20px]">
            {/* ILLUSTRATION : Vapeur Animée SVG (Le Mint est ici !) */}
            <svg 
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 text-mint animate-steam" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M50 80C55 70 45 60 50 50C55 40 65 40 60 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <path d="M35 75C40 65 30 55 35 45C40 35 50 35 45 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="delay-150"/>
              <path d="M65 75C70 65 60 55 65 45C70 35 80 35 75 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="delay-300"/>
            </svg>

            {/* LE LOGO (Toque) */}
            <div className="w-28 h-28 rounded-[2.5rem] glass-panel flex items-center justify-center text-mint border-mint/20 shadow-inner relative z-10">
              <ChefHat size={56} strokeWidth={1.5} />
            </div>
          </div>
          
          {/* NOM DE L'APPLI */}
          <h1 className="font-display text-4xl font-black text-white tracking-tighter mb-4 leading-none">
            What's for Dinner
          </h1>
          
          {/* TAGLINE (Légèrement Mint pour la vie) */}
          <p className="text-mint text-[15px] font-medium mb-12 leading-relaxed opacity-90 px-2">
            Planifiez votre semaine en un clic, savourez chaque repas.
          </p>

          {/* BOUTON DE CONNEXION GOOGLE (Redessiné pour plus de premium) */}
          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="btn-primary w-full py-5 text-base flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black shadow-xl active:scale-[0.98] disabled:bg-gray-200"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-black" size={24} />
            ) : (
              <>
                {/* Icône Google officielle en SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuer avec Google
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}