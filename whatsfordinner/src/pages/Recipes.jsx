import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import {
  Search, Clock3, ChefHat, Heart, Users,
  ArrowUpDown, Zap, Leaf, Fish, Drumstick, Beef, X, ExternalLink,
  CalendarPlus, Check
} from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Recipes({ userData }) {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProtein, setActiveProtein] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [householdId, setHouseholdId] = useState(null);
  const [currentMenu, setCurrentMenu] = useState([]);
  const [isMenuValidated, setIsMenuValidated] = useState(false);
  const [addingToMenu, setAddingToMenu] = useState(null);
  const [justAdded, setJustAdded] = useState(null);

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
        const hId = snap.data().householdId;
        if (hId) setHouseholdId(hId);
      }
    });
    return () => unsubFavs();
  }, [userId]);

  useEffect(() => {
    if (!householdId) return;
    const unsubHousehold = onSnapshot(doc(db, "households", householdId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentMenu(data.currentMenu || []);
        setIsMenuValidated(data.isMenuValidated || false);
      }
    });
    return () => unsubHousehold();
  }, [householdId]);

  const menuRecipeIds = useMemo(() => new Set(currentMenu.map(r => r.id)), [currentMenu]);
  const canAddToMenu = !isMenuValidated;

  const handleAddToMenu = async (e, recipe) => {
    e.preventDefault();
    e.stopPropagation();
    if (!householdId || !canAddToMenu || addingToMenu) return;
    setAddingToMenu(recipe.id);
    try {
      await updateDoc(doc(db, "households", householdId), {
        currentMenu: [...currentMenu, recipe],
        isMenuValidated: false,
      });
      setJustAdded(recipe.id);
      setTimeout(() => setJustAdded(null), 2000);
    } catch (err) {
      console.error("Erreur ajout menu:", err);
    } finally {
      setAddingToMenu(null);
    }
  };

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
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeProtein === "fav") return favorites.includes(r.id) && matchesSearch;
      if (activeProtein === "all") return matchesSearch;
      return r.protein?.toLowerCase() === activeProtein && matchesSearch;
    });

    return result.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
  }, [recipes, searchTerm, activeProtein, favorites, sortOrder]);

  const proteins = [
    { id: "all", label: "Tous", icon: ChefHat },
    { id: "fav", label: "Favoris", icon: Heart },
    { id: "poulet", label: "Poulet", icon: Drumstick },
    { id: "bœuf", label: "Bœuf", icon: Beef },
    { id: "poisson", label: "Poisson", icon: Fish },
    { id: "végétarien", label: "Végé", icon: Leaf }
  ];

  if (loading) return <div className="p-6 w-full min-h-screen bg-app-bg"><SkeletonLoader type="header" /></div>;

  return (
    <div className="flex flex-col min-h-screen pt-3 px-4 md:px-8 pb-12 transition-all bg-app-bg w-full">

      {/* HEADER */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-accent-ocre)]/10 text-[var(--color-accent-ocre)] text-[10px] font-black uppercase tracking-widest">
              Bibliothèque
            </span>
          </div>
          {/* h1 géré par CSS global (clamp 28–40px) */}
          <h1 className="font-display text-[clamp(5rem,23vw,25rem)] leading-[0.72] tracking-[-0.05em] text-[var(--color-app-text)]">
            Les Recettes
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-app-text)]/30 mt-1.5">
            {filteredAndSorted.length} pépites culinaires
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Une envie ?"
              className="w-full bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl py-2.5 px-4 pr-10 text-sm text-[var(--color-app-text)] outline-none focus:ring-4 focus:ring-[var(--color-accent-ocre)]/5 transition-all shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-app-text)]/20 hover:text-[var(--color-app-text)]/60"><X size={16}/></button>
            )}
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className={`w-11 h-11 shrink-0 rounded-xl flex flex-col items-center justify-center transition-all border bg-white dark:bg-[var(--color-card-bg)] border-[var(--color-card-border)] active:scale-95 shadow-sm ${sortOrder === 'desc' ? 'text-[var(--color-accent-ocre)]' : 'text-[var(--color-app-text)]/40'}`}
          >
            <ArrowUpDown size={16} className={sortOrder === "desc" ? "rotate-180 transition-transform" : "transition-transform"} />
            <span className="text-[7px] font-black mt-0.5 uppercase tracking-tighter">{sortOrder}</span>
          </button>
        </div>
      </header>

      {/* FILTRES GÉLULES */}
      <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
        {proteins.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProtein(p.id)}
            className={`py-2.5 px-5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 whitespace-nowrap border ${
              p.id === activeProtein
                ? "bg-[var(--color-app-text)] text-white dark:bg-white dark:text-black border-transparent shadow-lg scale-105"
                : "bg-white dark:bg-[var(--color-card-bg)] text-[var(--color-app-text)]/40 border-[var(--color-card-border)] hover:border-[var(--color-accent-ocre)]/30"
            }`}
          >
            <p.icon size={14} fill={(p.id === "fav" && favorites.includes(p.id)) || (p.id === activeProtein && p.id === "fav") ? "currentColor" : "none"} />
            {p.label}
          </button>
        ))}
      </div>

      {/* GRID DES RECETTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 auto-rows-[minmax(190px,auto)] md:auto-rows-[minmax(250px,auto)]">
        {filteredAndSorted.map((recipe, index) => {
          const isInMenu = menuRecipeIds.has(recipe.id);
          const wasJustAdded = justAdded === recipe.id;
          const featured = index % 7 === 0;
          const dark = index % 7 === 3;
          const recipeTime = Number.parseInt(recipe.time, 10);

          return (
            <article
              key={recipe.id}
              className={`group relative flex min-h-full flex-col overflow-hidden rounded-[1.15rem] border p-4 transition-all duration-500 hover:-translate-y-1 md:p-6 ${featured ? "md:col-span-2" : ""} ${dark ? "border-transparent bg-[var(--color-accent-ocre-deep)] text-[var(--color-cream)]" : "border-[var(--color-card-border)] bg-[var(--color-card-bg)]/70 text-[var(--color-app-text)]"} shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]`}
            >
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

              <h3 className={`relative z-10 mt-6 max-w-[520px] font-body font-semibold leading-none tracking-[-0.03em] ${featured ? "text-2xl md:mt-12 md:text-4xl" : "text-lg md:mt-8 md:text-xl"} ${dark ? "text-white" : "text-[var(--color-app-text)]"}`}>
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
                {(recipe.tags || []).filter(tag => !["végé", "vegetarien", "végétarien"].includes(tag.toLowerCase())).slice(0, featured ? 3 : 2).map(tag => <span key={tag} className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${dark ? "bg-white/[0.07] text-white/40" : "bg-[var(--color-app-text)]/[0.035] text-[var(--color-app-text)]/40"}`}>{tag}</span>)}
              </div>

              <div className={`relative z-10 mt-auto flex items-end justify-between gap-3 border-t pt-4 md:pt-5 ${dark ? "border-white/10" : "border-[var(--color-card-border)]"}`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><Clock3 size={13} className={dark ? "text-white/40" : "text-[var(--color-accent-ocre)]"} /><div><div className="text-[7px] font-black uppercase tracking-widest opacity-40">Temps</div><div className="mt-0.5 text-[10px] font-bold opacity-75">{Number.isFinite(recipeTime) ? `${recipeTime} min` : "--"}</div></div></div>
                  {recipe.servings && <div className="flex items-center gap-1.5"><Users size={13} className="opacity-40" /><div><div className="text-[7px] font-black uppercase tracking-widest opacity-40">Pour</div><div className="mt-0.5 text-[10px] font-bold opacity-75">{recipe.servings}</div></div></div>}
                  {recipe.ingredients?.length > 0 && <div className="text-[7px] font-black uppercase tracking-widest opacity-45">{recipe.ingredients.length} ingrédients</div>}
                </div>

                <div className="flex items-center gap-2">
                  {householdId && (
                    <button
                      onClick={(e) => handleAddToMenu(e, recipe)}
                      disabled={isInMenu || !canAddToMenu || addingToMenu === recipe.id}
                      title={
                        isMenuValidated ? "Menu validé — modifications impossibles"
                        : isInMenu ? "Déjà dans le menu"
                        : "Ajouter au menu"
                      }
                      className={`relative z-20 p-2.5 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
                        wasJustAdded || isInMenu
                          ? "bg-green-50 text-green-500 border-green-100 cursor-default"
                          : !canAddToMenu
                          ? "bg-gray-50 dark:bg-white/5 text-[var(--color-app-text)]/20 border-[var(--color-card-border)] cursor-not-allowed"
                          : "bg-gray-50 dark:bg-white/5 text-[var(--color-accent-ocre)] border-[var(--color-card-border)] hover:bg-[var(--color-accent-ocre)] hover:text-white"
                      }`}
                    >
                      {wasJustAdded || isInMenu ? <Check size={16} /> : <CalendarPlus size={16} />}
                    </button>
                  )}

                  {recipe.pdfLink && (
                    <a
                      href={recipe.pdfLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`relative z-20 p-2.5 rounded-xl border transition-all shadow-sm ${dark ? "bg-white text-[var(--color-accent-ocre-deep)]" : "bg-[var(--color-app-text)] text-[var(--color-app-bg)] hover:bg-[var(--color-accent-ocre)]"}`}
                    >
                      <ExternalLink size={16}/>
                    </a>
                  )}
                </div>
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
