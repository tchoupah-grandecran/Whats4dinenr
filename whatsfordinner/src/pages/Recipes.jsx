import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { BookOpen, Search, Plus, ExternalLink, X, ChefHat } from "lucide-react";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // États pour le formulaire d'ajout
  const [isAdding, setIsAdding] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ name: "", protein: "végétarien", time: "", pdfLink: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Récupération des recettes depuis Firestore
  const fetchRecipes = async () => {
    try {
      const recipesSnap = await getDocs(collection(db, "recipes"));
      const recipesList = recipesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(recipesList);
    } catch (error) {
      console.error("Erreur lors du chargement des recettes :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // 2. Fonction pour ajouter une recette
  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!newRecipe.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "recipes"), {
        name: newRecipe.name.trim(),
        protein: newRecipe.protein,
        time: newRecipe.time.trim() || "30 min",
        pdfLink: newRecipe.pdfLink.trim() || null,
        createdAt: new Date().toISOString()
      });
      
      // On met à jour l'affichage localement sans recharger la page
      setRecipes([{ id: docRef.id, ...newRecipe }, ...recipes]);
      setIsAdding(false);
      setNewRecipe({ name: "", protein: "végétarien", time: "", pdfLink: "" });
    } catch (error) {
      console.error("Erreur d'ajout :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction de couleur pour les tags (identique au Menu)
  const getProteinColor = (protein) => {
    switch (protein?.toLowerCase()) {
      case 'bœuf': case 'porc': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'poulet': return 'text-gold bg-gold/10 border-gold/20';
      case 'poisson': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'végétarien': return 'text-mint bg-mint/10 border-mint/20';
      default: return 'text-sage bg-sage/10 border-sage/20';
    }
  };

  // Filtrage par recherche
  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.protein.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="pt-20 text-center text-white">Chargement du grimoire...</div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-32 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gold">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-white tracking-tight">
              Recettes
            </h1>
            <p className="font-body text-text-muted text-xs uppercase tracking-widest font-bold mt-1">
              {recipes.length} plats enregistrés
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center hover:bg-gold/20 transition-colors"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </header>

      {/* RECHERCHE */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text"
          placeholder="Chercher un plat, une viande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors font-body text-sm"
        />
      </div>

      {/* LISTE DES RECETTES */}
      <div className="flex flex-col gap-3">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-10 text-text-muted font-body text-sm">
            Aucune recette ne correspond à votre recherche.
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group">
              <div className="flex flex-col gap-1.5">
                <span className="font-display font-bold text-white text-base leading-tight">
                  {recipe.name}
                </span>
                <div className="flex gap-2 items-center">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getProteinColor(recipe.protein)}`}>
                    {recipe.protein}
                  </span>
                  <span className="text-text-muted font-body text-xs flex items-center gap-1">
                    ⏱ {recipe.time}
                  </span>
                </div>
              </div>
              
              {/* Bouton PDF s'il y a un lien */}
              {recipe.pdfLink ? (
                <a 
                  href={recipe.pdfLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                  title="Voir le PDF"
                >
                  <ExternalLink size={18} />
                </a>
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white/10">
                  <ChefHat size={18} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL D'AJOUT DE RECETTE (S'affiche en surimpression) */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-forest-mid border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            
            <button 
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={24} />
            </button>

            <h2 className="font-display text-2xl font-black text-white mb-6">Nouvelle Recette</h2>
            
            <form onSubmit={handleAddRecipe} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Nom du plat</label>
                <input required type="text" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold/50" placeholder="ex: Lasagnes Maison" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Catégorie</label>
                  <select value={newRecipe.protein} onChange={e => setNewRecipe({...newRecipe, protein: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold/50 appearance-none">
                    <option value="végétarien">Végétarien</option>
                    <option value="poulet">Poulet</option>
                    <option value="bœuf">Bœuf</option>
                    <option value="porc">Porc</option>
                    <option value="poisson">Poisson</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Temps</label>
                  <input type="text" value={newRecipe.time} onChange={e => setNewRecipe({...newRecipe, time: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold/50" placeholder="ex: 45 min" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Lien PDF (Optionnel)</label>
                <input type="url" value={newRecipe.pdfLink} onChange={e => setNewRecipe({...newRecipe, pdfLink: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold/50" placeholder="https://drive.google.com/..." />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-4 w-full py-4 rounded-xl font-display font-black text-forest-deepest bg-gradient-to-r from-gold to-gold-deep hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {isSubmitting ? "Ajout..." : "Enregistrer la recette"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}