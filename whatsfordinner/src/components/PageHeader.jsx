// src/components/PageHeader.jsx
export default function PageHeader({ subtitle, title, actionNode }) {
  return (
    <header 
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-16 z-50 bg-mint/70 backdrop-blur-xl border-b border-forest-deepest/5 px-4 md:px-8 flex items-center justify-between shadow-[0_10px_40px_-15px_rgba(6,9,7,0.1)]"
    >
      {/* GAUCHE :stacked subtitle & title (Superposition compacte) */}
      <div className="flex flex-col min-w-0 pr-4 mt-1">
        <p className="font-display text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold text-forest-deepest/40 truncate -mb-0.5">
          {subtitle}
        </p>
        <h1 className="font-display text-xl md:text-2xl font-black text-forest-deepest tracking-tight leading-none truncate">
          {title}
        </h1>
      </div>

      {/* DROITE : Action button(s) - Passés en props */}
      {actionNode && (
        <div className="flex items-center shrink-0 ml-auto">
          {/* C'est ici que tu passeras tes boutons (Profil, Générer, Trash, etc.) */}
          {actionNode}
        </div>
      )}
    </header>
  );
}