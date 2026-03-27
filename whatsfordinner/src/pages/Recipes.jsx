import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Search, Clock3, ChefHat, DatabaseBackup } from "lucide-react";
import { Link } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProtein, setActiveProtein] = useState("all");

  useEffect(() => {
    const fetchRecipes = async () => {
      const snap = await getDocs(collection(db, "recipes"));
      setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchRecipes();
  }, []);

  const proteins = [
    { id: "all", label: "Tous", icon: ChefHat },
    { id: "poulet", label: "Poulet", icon: ChefHat },
    { id: "bœuf", label: "Bœuf", icon: ChefHat },
    { id: "poisson", label: "Poisson", icon: ChefHat },
    { id: "végétarien", label: "Végé", icon: ChefHat }
  ];

  const filtered = recipes.filter(r => 
    (activeProtein === "all" || r.protein?.toLowerCase() === activeProtein) &&
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-6"><SkeletonLoader type="header" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">{[...Array(6)].map((_, i) => <SkeletonLoader key={i} type="recipe-card" />)}</div></div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-32 animate-fade-in">
      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-forest-deepest font-display tracking-tight">Recettes</h1>
        <Link 
          to="/import" 
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-forest-deepest/60 hover:text-forest-deepest hover:bg-forest-deepest/5 transition-colors border-none shadow-sm"
        >
          <DatabaseBackup size={18} />
        </Link>
      </header>

      {/* BARRE DE RECHERCHE */}
      <div className="relative mb-6">
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="Rechercher une recette..." 
          className="w-full bg-forest-deepest/5 border border-forest-deepest/10 rounded-2xl py-4 px-5 text-forest-deepest placeholder-forest-deepest/40 focus:bg-white focus:border-forest-deepest/20 outline-none font-body transition-all shadow-inner" 
        />
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-forest-deepest/30" size={20} />
      </div>

      {/* FILTRES PAR PROTÉINE */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-1 px-1">
        {proteins.map(p => (
          <button 
            key={p.id} 
            onClick={() => setActiveProtein(p.id)} 
            className={`py-2 px-4 text-sm font-bold rounded-full whitespace-nowrap transition-all duration-300 ${
              p.id === activeProtein 
                ? "bg-forest-deepest text-cream shadow-md" 
                : "bg-forest-deepest/5 text-forest-deepest/60 hover:bg-forest-deepest/10 hover:text-forest-deepest"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* LISTE DES RECETTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(recipe => (
          <div key={recipe.id} className="glass-card group hover:border-forest-deepest/20 transition-all hover:scale-[1.01] cursor-pointer">
            <h2 className="text-lg font-bold text-forest-deepest mb-4 leading-tight group-hover:text-mint-deep transition-colors">
              {recipe.name}
            </h2>
            <div className="flex justify-between items-center border-t border-forest-deepest/5 pt-4 mt-auto">
              {/* Le tag protéine utilise le badge standard */}
              <span className="badge">{recipe.protein}</span>
              <span className="text-forest-deepest/50 text-[10px] font-mono flex items-center gap-1 uppercase font-bold">
                <Clock3 size={12} /> {recipe.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}