"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-serif mb-6 text-dinner-green">Whats4Dinner</h1>
      <p className="text-dinner-green/70 mb-12 max-w-xs">
        Votre petit coin secret pour organiser les repas du foyer, tout en douceur.
      </p>
      
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="organic-shape bg-dinner-green text-dinner-cream px-10 py-6 font-medium shadow-xl hover:scale-105 transition-transform active:scale-95"
      >
        Entrer avec Google
      </button>
      
      <div className="mt-12 text-xs text-dinner-green/40 italic">
        Un foyer, une cuisine, mille souvenirs.
      </div>
    </div>
  );
}