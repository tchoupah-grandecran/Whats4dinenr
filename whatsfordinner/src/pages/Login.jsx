import { useState } from "react";
import { useNavigate } from "react-router-dom"; /* 1. ON IMPORTE LA NAVIGATION */
import { auth, db } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ChefHat, Loader2 } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); /* 2. ON INITIALISE LA NAVIGATION */

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
  // On récupère le prénom (le premier mot du displayName)
  const firstName = user.displayName ? user.displayName.split(' ')[0] : "Chef";
  
  await setDoc(userRef, {
    email: user.email,
    name: user.displayName,
    firstName: firstName, // <-- ON AJOUTE LE PRÉNOM ICI
    householdId: null,
    createdAt: new Date().toISOString()
  });
}
      
      /* 3. LE CORRECTIF EST ICI : On force le passage à la page d'accueil ! */
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
          20% { opacity: 0.8; }
          80% { transform: translateY(-20px) scale(1.2); opacity: 0; }
          100% { transform: translateY(-20px) scale(1.2); opacity: 0; }
        }
        @keyframes finalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-steam { animation: steam 3s ease-in-out infinite; }
        .animate-final-appear { animation: finalSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
      `}</style>

      {/* CONTENEUR PRINCIPAL */}
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen items-center justify-center overflow-hidden overscroll-none bg-mint px-6">
        
        {/* LE FOND ORGANIQUE DISCRET */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='c'%3E%3Cpath d='M0-10l5 10c1 2 2 4 2 6 0 5-4 10-8 10-2 0-3-1-3-3s1-3 3-3c2 0 4-1 4-3s-1-3-3-5l-1-1 1-1zm0 0l-5-10m0 0l5 10'/%3E%3Ccircle cx='-5' cy='-15' r='2'/%3E%3C/g%3E%3Cg id='t'%3E%3Ccircle cx='0' cy='0' r='10'/%3E%3Cpath d='M-3-10c1 0 1 1 0 2s-1-1 0-2zm4 0c1 0 1 1 0 2s-1-1 0-2z'/%3E%3C/g%3E%3Cg id='b'%3E%3Cpath d='M0 0v10m-3-10l3 10m3-10l-3 10'/%3E%3Cpath d='M-3-5a5 5 0 0 1 6 0l2 2a5 5 0 0 1 0 6l-2 2a5 5 0 0 1-6 0l-2-2a5 5 0 0 1 0-6l2-2z'/%3E%3C/g%3E%3Cg id='s'%3E%3Cpath d='M0 0c0 5 5 10 10 10h10v-10c0-5-5-10-10-10h-10z'/%3E%3Cpath d='M10 0l5 5m5-5l-5-5m0 0l5-5m-5 5l-5-5'/%3E%3C/g%3E%3C/defs%3E%3Cg fill='%23060907' fill-opacity='0.06'%3E%3Cuse href='%23c' transform='translate(50, 60) scale(1.2) rotate(15)'/%3E%3Cuse href='%23t' transform='translate(180, 40) scale(0.8) rotate(-20)'/%3E%3Cuse href='%23b' transform='translate(330, 70) scale(1.5) rotate(45)'/%3E%3Cuse href='%23s' transform='translate(90, 190) scale(0.9) rotate(-60)'/%3E%3Cuse href='%23c' transform='translate(260, 160) scale(0.7) rotate(-140)'/%3E%3Cuse href='%23t' transform='translate(360, 220) scale(1.4) rotate(80)'/%3E%3Cuse href='%23b' transform='translate(40, 310) scale(1.1) rotate(-10)'/%3E%3Cuse href='%23s' transform='translate(180, 340) scale(1.3) rotate(110)'/%3E%3Cuse href='%23t' transform='translate(310, 330) scale(0.9) rotate(25)'/%3E%3Cuse href='%23c' transform='translate(150, 280) scale(1.5) rotate(40)'/%3E%3Cuse href='%23b' transform='translate(250, 360) scale(0.8) rotate(170)'/%3E%3Cuse href='%23s' transform='translate(380, 130) scale(1.1) rotate(-80)'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '400px 400px',
            backgroundPosition: 'center'
          }}
        />

        {/* LA CARTE CENTRALE */}
        <div className="relative w-full max-w-sm flex flex-col items-center p-10 text-center bg-[#060907] rounded-[2.5rem] shadow-[0_32px_80px_rgba(6,9,7,0.4)] border border-white/5 animate-final-appear z-10">
          
          <div className="relative mb-8 mt-[-10px]">
            <svg className="absolute -top-9 left-1/2 -translate-x-1/2 w-16 h-16 text-mint/80 animate-steam" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 80C55 70 45 60 50 50C55 40 65 40 60 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M35 75C40 65 30 55 35 45C40 35 50 35 45 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="delay-150"/>
              <path d="M65 75C70 65 60 55 65 45C70 35 80 35 75 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="delay-300"/>
            </svg>

            <div className="w-28 h-28 rounded-[2rem] bg-mint flex items-center justify-center text-forest-deepest shadow-[inset_0_4px_12px_rgba(255,255,255,0.4)] relative z-10 transition-transform duration-300 hover:scale-105 hover:rotate-2">
              <ChefHat size={56} strokeWidth={1.5} />
            </div>
          </div>
          
          <h1 className="font-display text-4xl font-black text-white tracking-tighter mb-4 leading-none">
            What's for Dinner
          </h1>
          
          <p className="text-mint/80 text-[15px] font-medium leading-relaxed px-2 max-w-[280px]">
            Planifiez votre semaine en un clic, savourez chaque repas.
          </p>

          <div className="w-full flex justify-center mt-12 mb-2">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 bg-[#0a0f0c] text-mint border border-mint/30 hover:bg-mint/10 hover:border-mint hover:shadow-[0_0_20px_rgba(167,243,208,0.15)] shadow-xl active:scale-[0.98] disabled:opacity-50 rounded-full py-3.5 px-8 text-sm max-w-[280px] w-auto transition-all duration-300 font-display font-bold uppercase tracking-wider"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-mint" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="whitespace-nowrap">Continuer avec Google</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}