"use client";
import Link from "next/link";

export default function StatusCard({ status }: { status: string }) {
  const configs: Record<string, any> = {
    'no-menu': {
      title: "Le frigo est vide",
      desc: "Trouvons de l'inspiration pour la semaine.",
      icon: "✍️",
      colorClass: "bg-sage",
      cta: "Générer un menu",
      href: "/menu",
      btnClass: "bg-gradient-to-r from-gold to-gold-deep shadow-[0_0_20px_rgba(240,201,74,0.3)]"
    },
    'menu-ready': {
      title: "Menu planifié",
      desc: "Prêt à générer votre liste de courses.",
      icon: "📝",
      colorClass: "bg-gold",
      cta: "Faire la liste",
      href: "/cart",
      btnClass: "bg-gradient-to-r from-gold to-gold-deep shadow-[0_0_20px_rgba(240,201,74,0.3)]"
    },
    'cart-active': {
      title: "Aux courses !",
      desc: "Il vous reste des articles à trouver.",
      icon: "🛒",
      colorClass: "bg-mint",
      cta: "Ouvrir la liste",
      href: "/cart",
      btnClass: "bg-gradient-to-r from-mint to-mint-deep shadow-[0_0_20px_rgba(62,232,138,0.3)]"
    },
    'cart-done': {
      title: "Tout est là",
      desc: "À vos fourneaux, prêt, cuisinez !",
      icon: "🍳",
      colorClass: "bg-gold-deep",
      cta: "Voir les recettes",
      href: "/recipes",
      btnClass: "bg-gradient-to-r from-gold to-gold-deep shadow-[0_0_20px_rgba(240,201,74,0.3)]"
    },
  };

  const config = configs[status] || configs['no-menu'];

  return (
    <div className="relative w-full max-w-sm mx-auto mt-8">
      {/* Halo lumineux d'ambiance dynamique */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 ${config.colorClass} rounded-full blur-[90px] opacity-20 pointer-events-none`} />

      {/* Cinematic Card (Glassmorphism) */}
      <div className="glass-panel rounded-3xl p-8 flex flex-col items-center text-center relative z-10 transition-transform duration-500 hover:scale-[1.02]">
        
        {/* Orbe Flottante (Icône) */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 ${config.colorClass} blur-xl opacity-40 rounded-full animate-pulse`} />
          <div className="w-20 h-20 glass-panel rounded-full flex items-center justify-center text-4xl relative z-10 border-white/20">
            {config.icon}
          </div>
        </div>

        {/* Typographie */}
        <h2 className="font-display text-2xl font-black text-white mb-2 tracking-tight">
          {config.title}
        </h2>
        <p className="font-body text-text-secondary text-sm mb-10">
          {config.desc}
        </p>

        {/* Bouton d'action principal */}
        <Link
          href={config.href}
          className={`w-full py-4 rounded-full font-display font-bold text-forest-deepest text-[15px] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${config.btnClass}`}
        >
          {config.cta}
        </Link>
      </div>
    </div>
  );
}