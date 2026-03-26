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
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-white font-display tracking-tight">Recettes</h1>
        <Link to="/import" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-text-muted hover:text-white transition-colors border border-white/10"><DatabaseBackup size={18} /></Link>
      </header>

      <div className="relative mb-6">
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher une recette..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-mint/50 outline-none font-body transition-all" />
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-1 px-1">
        {proteins.map(p => (
          <button key={p.id} onClick={() => setActiveProtein(p.id)} className={`${p.id === activeProtein ? "btn-primary" : "btn-ghost"} py-2 px-4 text-xs whitespace-nowrap`}>{p.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(recipe => (
          <div key={recipe.id} className="glass-card group hover:border-mint/30 transition-all hover:scale-[1.01] cursor-pointer">
            <h2 className="text-lg font-bold text-white mb-4 leading-tight group-hover:text-mint transition-colors">{recipe.name}</h2>
            <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
              <span className="badge text-gold text-[10px] tracking-widest">{recipe.protein}</span>
              <span className="text-text-muted text-[10px] font-mono flex items-center gap-1 uppercase"><Clock3 size={12} /> {recipe.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}