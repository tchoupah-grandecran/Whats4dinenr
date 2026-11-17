import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowRight, Loader2, UtensilsCrossed } from "lucide-react";

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
        @keyframes loginReveal { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loginRevealLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes loginRevealScale { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: scale(1); } }
        @keyframes loginLine { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); transform-origin: left; } }
        @keyframes loginFloat { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-9px) rotate(-3deg); } }
        .login-reveal { opacity: 0; animation: loginReveal .8s cubic-bezier(.16,1,.3,1) forwards; }
        .login-reveal-left { opacity: 0; animation: loginRevealLeft .8s cubic-bezier(.16,1,.3,1) forwards; }
        .login-reveal-scale { opacity: 0; animation: loginRevealScale .9s cubic-bezier(.16,1,.3,1) forwards; }
        .login-line { animation: loginLine 1s cubic-bezier(.16,1,.3,1) forwards; transform: scaleX(0); }
        .login-float { animation: loginFloat 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .login-reveal, .login-reveal-left, .login-reveal-scale, .login-line, .login-float { animation: none !important; opacity: 1 !important; transform: none !important; } }
      `}</style>

      <main className="fixed inset-0 z-50 min-h-[100dvh] w-screen overflow-hidden bg-[var(--color-app-bg)] text-[var(--color-app-text)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(var(--color-app-text) .6px, transparent .6px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute -right-[18vw] -top-[20vw] h-[65vw] w-[65vw] max-h-[720px] max-w-[720px] rounded-full bg-[var(--color-accent-ocre)]/[0.045] blur-[2px] md:-right-[10vw] md:-top-[18vw] md:h-[48vw] md:w-[48vw]" />
        <div className="pointer-events-none absolute -left-[30vw] bottom-[-25vw] h-[55vw] w-[55vw] rounded-full border border-[var(--color-accent-ocre)]/[0.07] md:-left-[12vw] md:bottom-[-18vw] md:h-[32vw] md:w-[32vw]" />

        <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-7 py-10 md:px-12 lg:px-20">
          <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16 lg:gap-24">
            <section className="relative">
              <div className="login-reveal-left mb-10 flex items-center gap-3 md:mb-14" style={{ animationDelay: "0.1s" }}>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-app-text)]/30">Dinner</span>
                <span className="h-px w-10 bg-[var(--color-app-text)]/10" />
                <span className="text-[8px] font-black tracking-[0.2em] text-[var(--color-app-text)]/20">01</span>
              </div>
              <div className="login-reveal-scale relative mb-8 h-20 w-20 md:h-24 md:w-24" style={{ animationDelay: "0.25s" }}>
                <div className="absolute inset-0 rounded-full border border-[var(--color-accent-ocre)]/20" />
                <div className="login-float absolute inset-[10px] flex items-center justify-center rounded-full bg-[var(--color-accent-ocre)]/[0.08] text-[var(--color-accent-ocre)]"><UtensilsCrossed size={25} strokeWidth={1.35} /></div>
                <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-accent-ocre)]" />
              </div>
              <div className="login-reveal-left" style={{ animationDelay: "0.35s" }}>
                <span className="mb-5 block font-body text-[9px] font-black uppercase tracking-[0.28em] text-[var(--color-accent-ocre)]">Bienvenue à table</span>
                <h1 className="font-display text-[clamp(4rem,9vw,7.5rem)] leading-[0.76] tracking-[-0.065em]">What&apos;s<br />for<br />Dinner?</h1>
              </div>
              <div className="login-reveal-left mt-10 max-w-[280px] border-l border-[var(--color-accent-ocre)]/25 pl-5 md:mt-14" style={{ animationDelay: "0.5s" }}>
                <p className="text-[12px] leading-[1.65] text-[var(--color-app-text)]/45 md:text-[13px]">Planifiez votre semaine, choisissez vos recettes, faites vos courses, puis profitez du dîner.</p>
              </div>
            </section>

            <section className="login-reveal relative md:pt-20" style={{ animationDelay: "0.65s" }}>
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[var(--color-app-text)]/25">Entrer</span>
                <span className="font-display text-3xl text-[var(--color-app-text)]/[0.07]">01</span>
              </div>
              <div className="login-line mb-8 h-px w-full bg-[var(--color-app-text)]/10" style={{ animationDelay: "0.8s" }} />
              <h2 className="max-w-sm font-display text-[2rem] leading-[0.95] tracking-[-0.035em] md:text-[2.5rem]">On commence<br />par quoi ?</h2>
              <p className="mt-4 max-w-xs text-[12px] leading-[1.6] text-[var(--color-app-text)]/40">Connectez-vous pour retrouver votre cuisine et votre semaine.</p>
              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="group mt-9 flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)]/55 px-5 py-4 backdrop-blur-xl transition-all duration-300 hover:border-[var(--color-accent-ocre)]/30 hover:bg-[var(--color-card-bg)]/80 active:scale-[0.985] disabled:opacity-50">
                <span className="flex items-center gap-3.5">
                  {isLoading ? <Loader2 size={19} className="animate-spin text-[var(--color-accent-ocre)]" /> : <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>}
                  <span className="font-body text-[13px] font-bold tracking-[-0.01em]">{isLoading ? "Connexion..." : "Continuer avec Google"}</span>
                </span>
                {!isLoading && <ArrowRight size={17} strokeWidth={1.7} className="text-[var(--color-app-text)]/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--color-accent-ocre)]" />}
              </button>
              <div className="login-reveal mt-8 flex items-center justify-between gap-4" style={{ animationDelay: "1s" }}>
                <span className="text-[7px] font-black uppercase tracking-[0.22em] text-[var(--color-app-text)]/20">Simplement manger mieux</span>
                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-[var(--color-app-text)]/15">100% gratuit</span>
              </div>
            </section>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-7 right-7 flex items-center justify-between md:left-12 md:right-12">
          <span className="text-[7px] font-black uppercase tracking-[0.25em] text-[var(--color-app-text)]/15">Dinner</span>
          <span className="text-[7px] font-black uppercase tracking-[0.22em] text-[var(--color-app-text)]/15">Plan · Shop · Cook</span>
        </div>
      </main>
    </>
  );
}
