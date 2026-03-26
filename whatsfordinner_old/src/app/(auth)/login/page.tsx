"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-6 relative">
      
      {/* Halo lumineux d'ambiance en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] bg-[#7aab82]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-12 w-full max-w-md">
        
        {/* En-tête typographique */}
        <div className="space-y-4">
          <h1 className="font-display text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight">
            Whats4Dinner
          </h1>
          <p className="font-body text-[#9bc3a5] text-lg font-light">
            L'organisation des repas,<br/>repensée pour votre foyer.
          </p>
        </div>
        
        {/* Bouton CTA Modern / Glassmorphism */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="group relative flex items-center justify-center gap-4 w-full sm:w-auto px-8 py-4 glass-panel rounded-full transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_0_30px_rgba(122,171,130,0.15)]"
        >
          {/* Logo Google SVG pur */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-display font-bold text-white tracking-wide text-[15px]">
            Continuer avec Google
          </span>
        </button>

      </div>

      {/* Footer minimaliste */}
      <div className="absolute bottom-10 font-display text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold">
        Un foyer • Une cuisine • Mille souvenirs
      </div>
    </div>
  );
}