import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { 
  Search, Clock3, ChefHat, DatabaseBackup, Heart, 
  ArrowUpDown, Zap, Leaf, Fish, Drumstick, Beef, Hash, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProtein, setActiveProtein] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [userRef, setUserRef] = useState(null);

  const proteinConfig = {
    poulet: { label: "Poulet", icon: Drumstick },
    bœuf: { label: "Bœuf", icon: Beef },
    poisson: { label: "Poisson", icon: Fish },
    végétarien: { label: "Végé", icon: Leaf },
    default: { label: "Autre", icon: ChefHat }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uRef = doc(db, "users", user.uid);
    setUserRef(uRef);

    const unsubFavs = onSnapshot(uRef, (snap) => {
      if (snap.exists()) setFavorites(snap.data().favoriteRecipes || []);
    });

    const fetchRecipes = async () => {
      try {
        const snap = await getDocs(collection(db, "recipes"));
        setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };

    fetchRecipes();
    return () => unsubFavs();
  }, []);

  // RATIONALISATION DES TAGS
  const allTags = useMemo(() => {
    const tags = new Set();
    recipes.forEach(r => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach(tag => {
          if(tag) tags.add(tag.trim().toLowerCase());
        });
      }
    });
    return Array.from(tags).map(t => t.charAt(0).toUpperCase() + t.slice(1)).sort();
  }, [recipes]);

  const toggleFavorite = async (e, recipeId) => {
    e.preventDefault(); e.stopPropagation();
    if (favorites.includes(recipeId)) {
      await updateDoc(userRef, { favoriteRecipes: arrayRemove(recipeId) });
    } else {
      await updateDoc(userRef, { favoriteRecipes: arrayUnion(recipeId) });
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = recipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesMainFilter = true;
      if (activeProtein === "fav") matchesMainFilter = favorites.includes(r.id);
      else if (activeProtein === "fast") matchesMainFilter = (parseInt(r.time) <= 20);
      else if (activeProtein !== "all") matchesMainFilter = r.protein?.toLowerCase() === activeProtein;

      const matchesTag = activeTag === "all" || 
                        (r.tags && r.tags.some(t => t.toLowerCase() === activeTag.toLowerCase()));
      
      return matchesSearch && matchesMainFilter && matchesTag;
    });

    return result.sort((a, b) => {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
  }, [recipes, searchTerm, activeProtein, activeTag, favorites, sortOrder]);

  const mainFilters = [
    { id: "all", label: "Tous", icon: ChefHat },
    { id: "fav", label: "Favoris", icon: Heart },
    { id: "fast", label: "Rapide", icon: Zap },
    { id: "poulet", label: "Poulet", icon: Drumstick },
    { id: "bœuf", label: "Bœuf", icon: Beef },
    { id: "poisson", label: "Poisson", icon: Fish },
    { id: "végétarien", label: "Végé", icon: Leaf }
  ];

  if (loading) return <div className="p-6 w-full"><SkeletonLoader type="header" /><div className="grid gap-4 mt-6">{[...Array(6)].map((_, i) => <SkeletonLoader key={i} type="recipe-card" />)}</div></div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 md:px-8 animate-fade-in w-full">
      <header className="mb-6 flex justify-between items-center w-full">
        <h1 className="text-2xl md:text-3xl font-black text-forest-deepest font-display tracking-tight uppercase">Recettes</h1>
        <Link to="/import" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-forest-deepest/60 shadow-sm hover:bg-forest-deepest hover:text-white transition-all">
          <DatabaseBackup size={18} />
        </Link>
      </header>

      {/* RECHERCHE ET TRI */}
      <div className="flex gap-3 mb-6 w-full">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Rechercher..." 
            className="w-full bg-white/80 border border-forest-deepest/10 rounded-2xl py-4 px-5 text-forest-deepest outline-none shadow-inner focus:bg-white transition-all" 
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-forest-deepest/20" size={20} />
        </div>
        <button 
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="w-14 h-[58px] shrink-0 border border-forest-deepest/10 rounded-2xl flex items-center justify-center bg-white/80 text-forest-deepest/40 hover:bg-forest-deepest hover:text-white transition-all shadow-sm"
        >
          <ArrowUpDown size={20} className={sortOrder === "desc" ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
      </div>

      {/* FILTRES PRINCIPAUX */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
        {mainFilters.map(p => (
          <button 
            key={p.id} 
            onClick={() => setActiveProtein(activeProtein === p.id ? "all" : p.id)} 
            className={`py-2.5 px-5 text-xs font-bold rounded-full transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${
              p.id === activeProtein 
                ? "bg-forest-deepest text-cream scale-105" 
                : "bg-white/90 text-forest-deepest/50 border border-forest-deepest/5"
            }`}
          >
            <p.icon size={14} fill={(p.id === "fav" && activeProtein === "fav") ? "currentColor" : "none"} />
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTRES DE TAGS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-4 px-4">
        {allTags.map(tag => (
          <button 
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? "all" : tag)}
            className={`py-1.5 px-4 text-[10px] font-bold rounded-xl border transition-all uppercase tracking-widest ${
              activeTag === tag 
                ? "bg-mint-deep border-mint-deep text-white" 
                : "bg-white/40 border-forest-deepest/5 text-forest-deepest/40 hover:bg-white/80"
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* GRID : Utilisation de items-start pour éviter l'étirement vertical */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full items-start">
        {filteredAndSorted.map(recipe => {
          const ProtIcon = proteinConfig[recipe.protein?.toLowerCase()]?.icon || proteinConfig.default.icon;
          
          return (
            <div key={recipe.id} className="glass-card flex flex-col justify-between group h-auto">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-forest-deepest leading-tight mb-2 uppercase line-clamp-2">{recipe.name}</h2>
                  
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recipe.tags && recipe.tags.map((tag, idx) => (
                      <span key={idx} className="text-[9px] font-bold text-forest-deepest/30 bg-forest-deepest/5 px-1.5 py-0.5 rounded uppercase">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {(parseInt(recipe.time) <= 20) && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-mint-deep bg-mint-deep/10 px-2 py-1 rounded uppercase tracking-tighter shadow-sm border border-mint-deep/10">
                        <Zap size={10} fill="currentColor" /> Rapide
                      </span>
                    )}
                  </div>
                </div>
                
                {/* ACTIONS */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    className={`p-2.5 rounded-xl transition-all ${favorites.includes(recipe.id) ? "bg-red-50 text-red-500 shadow-sm" : "bg-forest-deepest/5 text-forest-deepest/20 hover:text-forest-deepest/40"}`}
                  >
                    <Heart size={18} fill={favorites.includes(recipe.id) ? "currentColor" : "none"} />
                  </button>

                  {recipe.pdfLink && (
                    <a 
                      href={recipe.pdfLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2.5 rounded-xl bg-forest-deepest/5 text-forest-deepest/40 hover:bg-forest-deepest hover:text-white transition-all flex items-center justify-center"
                      title="Voir la recette"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 mt-4 border-t border-forest-deepest/5">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-forest-deepest/40 uppercase">
                  <ProtIcon size={12} />
                  {recipe.protein || "Autre"}
                </span>
                <span className="text-[10px] font-mono font-bold text-forest-deepest/20 flex items-center gap-1">
                  <Clock3 size={12} /> {recipe.time || "--"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}