import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { 
  Search, Clock3, ChefHat, DatabaseBackup, FileText, Heart, 
  ArrowUpDown, Zap, Leaf, Fish, Drumstick, Beef 
} from "lucide-react";
import { Link } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProtein, setActiveProtein] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [userRef, setUserRef] = useState(null);

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

  const toggleFavorite = async (e, recipeId) => {
    e.preventDefault(); e.stopPropagation();
    if (favorites.includes(recipeId)) {
      await updateDoc(userRef, { favoriteRecipes: arrayRemove(recipeId) });
    } else {
      await updateDoc(userRef, { favoriteRecipes: arrayUnion(recipeId) });
    }
  };

  // GESTION DU FILTRE (Désactivation si déjà actif)
  const handleFilterClick = (proteinId) => {
    if (activeProtein === proteinId) {
      setActiveProtein("all"); // On revient à "Tous" si on reclique sur le filtre actif
    } else {
      setActiveProtein(proteinId);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = recipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeProtein === "fav") return favorites.includes(r.id) && matchesSearch;
      if (activeProtein === "all") return matchesSearch;
      return r.protein?.toLowerCase() === activeProtein && matchesSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === "time") {
        return (parseInt(a.time) || 999) - (parseInt(b.time) || 999);
      }
      return a.name.localeCompare(b.name);
    });
  }, [recipes, searchTerm, activeProtein, favorites, sortBy]);

  // ICÔNES PERSONNALISÉES PAR PROTÉINE
  const proteins = [
    { id: "all", label: "Tous", icon: ChefHat },
    { id: "fav", label: "Favoris", icon: Heart },
    { id: "poulet", label: "Poulet", icon: Drumstick },
    { id: "bœuf", label: "Bœuf", icon: Beef },
    { id: "poisson", label: "Poisson", icon: Fish },
    { id: "végétarien", label: "Végé", icon: Leaf }
  ];

  if (loading) return <div className="p-6"><SkeletonLoader type="header" /><div className="grid gap-4 mt-6">{[...Array(6)].map((_, i) => <SkeletonLoader key={i} type="recipe-card" />)}</div></div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-32 animate-fade-in">
      <header className="mb-6 flex justify-between items-center px-1">
        <h1 className="text-2xl font-black text-forest-deepest font-display tracking-tight">Recettes</h1>
        <Link to="/import" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-forest-deepest/60 shadow-sm"><DatabaseBackup size={18} /></Link>
      </header>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full bg-forest-deepest/5 border border-forest-deepest/10 rounded-2xl py-4 px-5 text-forest-deepest outline-none shadow-inner" />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-forest-deepest/20" size={20} />
        </div>
        <button 
          onClick={() => setSortBy(sortBy === "name" ? "time" : "name")}
          className={`w-14 border rounded-2xl flex items-center justify-center transition-all ${sortBy === 'time' ? 'bg-mint-deep border-mint-deep text-white shadow-md' : 'bg-forest-deepest/5 border-forest-deepest/10 text-forest-deepest/40'}`}
        >
          <ArrowUpDown size={20} />
        </button>
      </div>

      {/* FILTRES GÉLULES */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-4 px-4">
        {proteins.map(p => (
          <button 
            key={p.id} 
            onClick={() => handleFilterClick(p.id)} 
            className={`py-2.5 px-5 text-xs font-bold rounded-full transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${
              p.id === activeProtein 
                ? "bg-forest-deepest text-cream scale-105" 
                : "bg-white text-forest-deepest/50 border border-forest-deepest/5 hover:bg-forest-deepest/5"
            }`}
          >
            <p.icon size={14} fill={p.id === "fav" && activeProtein === "fav" ? "currentColor" : "none"} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSorted.map(recipe => (
          <div key={recipe.id} className="glass-card p-5 group relative shadow-sm border-none transition-transform hover:scale-[1.01]">
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-forest-deepest truncate leading-tight">{recipe.name}</h2>
                <div className="flex gap-2 mt-1.5">
                  {(parseInt(recipe.time) <= 20) && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-mint-deep uppercase tracking-tighter bg-mint-deep/10 px-1.5 py-0.5 rounded">
                      <Zap size={10} /> Rapide
                    </span>
                  )}
                  {recipe.isLowCal && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-600 uppercase tracking-tighter bg-orange-500/10 px-1.5 py-0.5 rounded">
                      <Leaf size={10} /> Healthy
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={(e) => toggleFavorite(e, recipe.id)}
                  className={`p-2.5 rounded-xl transition-all ${favorites.includes(recipe.id) ? "bg-red-50 text-red-500 shadow-sm" : "bg-forest-deepest/5 text-forest-deepest/20 hover:text-forest-deepest/40"}`}
                >
                  <Heart size={18} fill={favorites.includes(recipe.id) ? "currentColor" : "none"} />
                </button>
                {recipe.pdfLink && (
                  <a href={recipe.pdfLink} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-forest-deepest/5 text-forest-deepest/40 hover:bg-forest-deepest hover:text-white transition-all"><FileText size={18} /></a>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-forest-deepest/5">
              <span className="badge flex items-center gap-1.5 text-[10px]"><ChefHat size={12} className="opacity-40" />{recipe.protein}</span>
              <span className={`text-[10px] font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider ${sortBy === 'time' ? 'text-mint-deep' : 'text-forest-deepest/40'}`}>
                <Clock3 size={14} /> {recipe.time || "--"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}