import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import {
  Clock3, ChefHat, Heart, Users,
  ArrowUpDown, Zap, Leaf, Fish, Drumstick, Beef, X, ExternalLink, SlidersHorizontal
} from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

const normalize = (value = "") => value
  .toLocaleLowerCase("fr")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim();

export default function Recipes({ userData }) {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProtein, setActiveProtein] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  const userId = userData?.uid || auth.currentUser?.uid;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const snap = await getDocs(collection(db, "recipes"));
        setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const uRef = doc(db, "users", userId);
    const unsubFavs = onSnapshot(uRef, (snap) => {
      if (snap.exists()) {
        setFavorites(snap.data().favoriteRecipes || []);
      }
    });
    return () => unsubFavs();
  }, [userId]);

  const toggleFavorite = async (recipeId) => {
    if (!userId) return;
    const uRef = doc(db, "users", userId);
    const isFav = favorites.includes(recipeId);
    try {
      await updateDoc(uRef, {
        favoriteRecipes: isFav ? arrayRemove(recipeId) : arrayUnion(recipeId)
      });
    } catch (err) { console.error("Erreur Favoris:", err); }
  };

  const filteredAndSorted = useMemo(() => {
    let result = recipes.filter(r => {
      const matchesSearch = normalize(r.name).includes(normalize(searchTerm));
      const protein = normalize(r.protein);
      const selectedProtein = normalize(activeProtein);
      const matchesProtein = ["all", "fav", "express"].includes(activeProtein)
        || protein === selectedProtein;
      const matchesFavorite = activeProtein !== "fav" || favorites.includes(r.id);
      const matchesExpress = activeProtein !== "express" || (Number.parseInt(r.time, 10) <= 25);
      return matchesSearch && matchesProtein && matchesFavorite && matchesExpress;
    });

    return result.sort((a, b) => {
      const nameA = normalize(a.name);
      const nameB = normalize(b.name);
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
  }, [recipes, searchTerm, activeProtein, favorites, sortOrder]);

  const proteins = [
    { id: "all", label: "Toutes", detail: "Toute la bibliothèque", icon: ChefHat },
    { id: "fav", label: "Favoris", detail: "Tes recettes fétiches", icon: Heart },
    { id: "express", label: "Express", detail: "25 min ou moins", icon: Zap },
    { id: "poulet", label: "Poulet", detail: "Volaille", icon: Drumstick },
    { id: "bœuf", label: "Bœuf", detail: "Viande rouge", icon: Beef },
    { id: "poisson", label: "Poisson", detail: "Poissons & mer", icon: Fish },
    { id: "végétarien", label: "Végé", detail: "Sans viande", icon: Leaf }
  ];

  if (loading) return <div className="p-6 w-full min-h-screen bg-app-bg"><SkeletonLoader type="header" /></div>;

  return (
    <div className="flex flex-col min-h-screen pt-3 px-4 md:px-8 pb-12 transition-all bg-app-bg w-full">

      {/* HEADER */}
      <section aria-labelledby="recipes-title" className="mb-5 pt-2">
        <h1 id="recipes-title" className="mb-5 font-display text-[clamp(3.5rem,9vw,7rem)] leading-[0.78] tracking-[-0.055em] text-[var(--color-app-text)]">
          Recettes
        </h1>

        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Chercher une recette..."
              className="h-[46px] w-full rounded-[1.1rem] border border-[var(--color-card-border)] bg-[var(--color-card-bg)]/75 px-5 pr-11 text-sm text-[var(--color-app-text)] shadow-[0_6px_20px_rgba(36,32,28,0.035)] outline-none transition-all placeholder:text-[var(--color-app-text)]/30 focus:border-[var(--color-accent-ocre)]/35 focus:ring-4 focus:ring-[var(--color-accent-ocre)]/5"
            />
            {searchTerm && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-app-text)]/35 hover:text-[var(--color-app-text)]/70"><X size={16}/></button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(open => !open)}
            aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
            aria-expanded={showFilters}
            aria-controls="recipe-filter-panel"
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[1.1rem] border transition-all active:scale-95 ${showFilters ? "border-[var(--color-app-text)] bg-[var(--color-app-text)] text-[var(--color-cream)]" : "border-[var(--color-card-border)] bg-[var(--color-card-bg)]/75 text-[var(--color-app-text)]/55 hover:text-[var(--color-app-text)]"}`}
          >
            <SlidersHorizontal size={17} strokeWidth={1.8} />
          </button>
        </div>

        {showFilters && (
          <div id="recipe-filter-panel" className="mt-3 rounded-[1.2rem] border border-[var(--color-card-border)] bg-[var(--color-card-bg)]/80 p-3 shadow-[0_8px_24px_rgba(36,32,28,0.04)]">
            <div className="grid grid-cols-3 gap-2">
              {proteins.map(p => {
                const Icon = p.icon;
                const selected = activeProtein === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProtein(p.id)}
                    aria-pressed={selected}
                    className={`flex h-[62px] flex-col items-center justify-center gap-1 rounded-[0.9rem] border text-[9px] font-black uppercase tracking-[0.08em] transition-colors ${selected ? "border-[var(--color-app-text)] bg-[var(--color-app-text)] text-[var(--color-cream)]" : "border-[var(--color-card-border)] bg-[var(--color-app-bg)]/55 text-[var(--color-app-text)] hover:border-[var(--color-accent-ocre)]/35"}`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setSortOrder(order => order === "asc" ? "desc" : "asc")}
              className="mt-2 flex h-[42px] w-full items-center justify-center gap-2 rounded-[0.9rem] border border-[var(--color-card-border)] bg-[var(--color-app-bg)]/55 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-app-text)]/60 transition-colors hover:text-[var(--color-accent-ocre)]"
            >
              <ArrowUpDown size={14} className={sortOrder === "desc" ? "rotate-180 transition-transform" : "transition-transform"} />
              Tri : {sortOrder === "asc" ? "A → Z" : "Z → A"}
            </button>
          </div>
        )}
      </section>

      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-card-border)] pb-3 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-app-text)]/30">
        <span>{activeProtein === "all" ? "Toutes les recettes" : `${proteins.find(p => p.id === activeProtein)?.label || "Recettes"} · recettes`}</span>
        <span>{filteredAndSorted.length} résultat{filteredAndSorted.length === 1 ? "" : "s"}</span>
      </div>

      {/* GRID DES RECETTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 auto-rows-[minmax(190px,auto)] md:auto-rows-[minmax(250px,auto)]">
        {filteredAndSorted.length === 0 ? (
          <div className="col-span-full rounded-[1.5rem] border border-[var(--color-card-border)] bg-[var(--color-card-bg)]/55 px-6 py-12 text-center">
            <p className="font-display text-2xl">Aucune recette trouvée</p>
            <p className="mt-2 text-sm text-[var(--color-app-text)]/45">Essaie un autre filtre ou une autre recherche.</p>
            <button
              onClick={() => { setActiveProtein("all"); setSearchTerm(""); }}
              className="mt-5 rounded-full bg-[var(--color-accent-ocre)] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white"
            >
              Réinitialiser
            </button>
          </div>
        ) : filteredAndSorted.map((recipe, index) => {
          const editorialPosition = index % 4;
          const featured = editorialPosition === 0;
          const dark = editorialPosition === 1;
          const compact = editorialPosition === 3;
          const recipeTime = Number.parseInt(recipe.time, 10);

          return (
            <article
              key={recipe.id}
              className={`group relative flex min-h-full flex-col overflow-hidden rounded-[1.15rem] border p-4 transition-all duration-500 hover:-translate-y-1 md:p-6 ${featured ? "md:col-span-2" : ""} ${dark ? "border-transparent bg-[var(--color-accent-ocre-deep)] text-[var(--color-cream)]" : "border-[var(--color-card-border)] bg-[var(--color-card-bg)]/70 text-[var(--color-app-text)]"} shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]`}
            >
              {featured && <span className="absolute inset-y-0 left-0 z-10 w-1 bg-[var(--color-accent-ocre)]" />}
              <span className={`pointer-events-none absolute bottom-1 right-3 select-none font-display text-5xl leading-none md:text-7xl ${dark ? "text-white/[0.04]" : "text-[var(--color-app-text)]/[0.03]"}`}>{String(index + 1).padStart(2, "0")}</span>
              <div className="relative z-10 flex justify-between items-start gap-3">
                <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] ${dark ? "text-white/50" : "text-[var(--color-accent-ocre)]"}`}>
                  <span>{recipe.protein || "Cuisine"}</span>{featured && <><span className="h-1 w-1 rounded-full bg-current/40" /><span className="opacity-60">À la une</span></>}
                </div>
                <button
                  onClick={() => toggleFavorite(recipe.id)}
                  aria-label={favorites.includes(recipe.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className={`relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110 ${dark ? "bg-white/10 text-white/60 hover:text-white" : "bg-[var(--color-app-text)]/5 text-[var(--color-app-text)]/25 hover:text-[var(--color-accent-ocre)]"}`}
                >
                  <Heart
                    size={16}
                    fill={favorites.includes(recipe.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <h3 className={`relative z-10 mt-6 max-w-[520px] font-body font-semibold leading-none tracking-[-0.03em] ${featured ? "text-2xl md:mt-12 md:text-4xl" : compact ? "text-base md:mt-6 md:text-lg" : "text-lg md:mt-8 md:text-xl"} ${dark ? "text-white" : "text-[var(--color-app-text)]"}`}>
                {recipe.name}
              </h3>

              <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
                {Number.isFinite(recipeTime) && recipeTime <= 25 && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${dark ? "bg-white/10 text-white/70" : "bg-[var(--color-accent-ocre)]/10 text-[var(--color-accent-ocre)]"}`}>
                    <Zap size={9} fill="currentColor" /> Express
                  </span>
                )}
                {recipe.isLowCal && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${dark ? "bg-white/10 text-white/60" : "bg-[var(--color-app-text)]/5 text-[var(--color-app-text)]/50"}`}>
                    <Leaf size={9} /> Léger
                  </span>
                )}
                {(recipe.tags || []).filter(tag => !["végé", "vegetarien", "végétarien", "vegetarienne", "végétarienne"].includes(tag.trim().toLowerCase())).slice(0, featured ? 3 : 2).map(tag => <span key={tag} className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${dark ? "bg-white/[0.07] text-white/40" : "bg-[var(--color-app-text)]/[0.035] text-[var(--color-app-text)]/40"}`}>{tag}</span>)}
              </div>

              <div className={`relative z-10 mt-auto flex items-end justify-between gap-3 border-t pt-4 md:pt-5 ${dark ? "border-white/10" : "border-[var(--color-card-border)]"}`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><Clock3 size={13} className={dark ? "text-white/40" : "text-[var(--color-accent-ocre)]"} /><div><div className="text-[7px] font-black uppercase tracking-widest opacity-40">Temps</div><div className="mt-0.5 text-[10px] font-bold opacity-75">{Number.isFinite(recipeTime) ? `${recipeTime} min` : "--"}</div></div></div>
                  {recipe.servings && <div className="flex items-center gap-1.5"><Users size={13} className="opacity-40" /><div><div className="text-[7px] font-black uppercase tracking-widest opacity-40">Pour</div><div className="mt-0.5 text-[10px] font-bold opacity-75">{recipe.servings}</div></div></div>}
                </div>

                {recipe.pdfLink && <a href={recipe.pdfLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} aria-label={`Ouvrir la recette ${recipe.name}`} className={`relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1 ${dark ? "bg-white text-[var(--color-accent-ocre-deep)] hover:bg-white/90" : "bg-[var(--color-app-text)] text-[var(--color-app-bg)] hover:bg-[var(--color-accent-ocre)] hover:text-white"}`}><ExternalLink size={15} /></a>}
              </div>
            </article>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .badge-recipe {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 10px;
          letter-spacing: 0.05em;
        }
      `}} />
    </div>
  );
}
