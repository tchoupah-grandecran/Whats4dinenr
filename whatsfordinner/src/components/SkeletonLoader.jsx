import { Store, Tag, Clock3 } from "lucide-react";

export default function SkeletonLoader({ type = "home" }) {
  
  // SKELETON POUR LA PAGE D'ACCUEIL / HEADER
  if (type === "header") {
    return (
      <header className="flex justify-between items-center mb-8 animate-pulse-slow px-4">
        <div>
          <div className="h-3 w-32 bg-white/10 rounded mb-2" />
          <div className="h-8 w-48 bg-white/10 rounded-lg" />
        </div>
        <div className="w-12 h-12 rounded-full bg-white/10" />
      </header>
    );
  }

  // SKELETON POUR LES CARTES DE RECETTES (Menu / Recettes)
  if (type === "recipe-card") {
    return (
      <div className="glass-card animate-pulse-slow">
        <div className="h-6 w-3/4 bg-white/10 rounded-lg mb-4" />
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-white/10 rounded-lg" />
            <div className="h-5 w-16 bg-white/10 rounded-lg" />
          </div>
          <div className="h-5 w-12 bg-white/10 rounded-lg" />
        </div>
      </div>
    );
  }

  // SKELETON POUR LA LISTE DE COURSES
  if (type === "cart-item") {
    return (
      <div className="glass-panel animate-pulse-slow rounded-2xl overflow-hidden mb-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="p-4 flex items-center gap-4 border-b border-white/5 last:border-b-0">
            <div className="w-6 h-6 rounded-full bg-white/10" />
            <div className="flex-1 h-5 bg-white/10 rounded" />
            <div className="w-12 h-5 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // PAR DÉFAUT (Home status)
  return (
    <div className="flex flex-col gap-6 p-4 animate-pulse-slow">
      <div className="glass-card h-64 flex flex-col justify-center items-center">
        <div className="w-20 h-20 rounded-full bg-white/10 mb-4" />
        <div className="h-6 w-1/2 bg-white/10 rounded-lg mb-3" />
        <div className="h-4 w-1/3 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}