import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { CalendarDays, RefreshCw, ChefHat, Trash2, CheckCircle2, Utensils, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();
  const [householdId, setHouseholdId] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  
  // Nouveaux états synchronisés en temps réel
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [isValidated, setIsValidated] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const initData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const recipesSnap = await getDocs(collection(db, "recipes"));
        setAllRecipes(recipesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().householdId) {
          const hId = userSnap.data().householdId;
          setHouseholdId(hId);
          
          // Magie du Temps Réel : On écoute le Foyer entier (Menu + Caddie + État)
          unsubscribe = onSnapshot(doc(db, "households", hId), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setMenu(data.currentMenu || []);
              setIsValidated(data.isMenuValidated || false);
              setCart(data.currentCart || []); // On récupère le caddie pour l'analyse
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur de chargement :", error);
        setLoading(false);
      }
    };
    initData();
    
    return () => unsubscribe();
  }, []);

  // --- L'AGRÉGATEUR INTELLIGENT ---
  const aggregateQuantities = (quantities) => {
  if (!quantities || quantities.length === 0) return "";
  const sums = {};
  const unparseable = [];

  quantities.forEach(rawQ => {
    const q = String(rawQ).toLowerCase().trim();
    if (!q || q === "null null") return;

    // Regex pour capturer : 1. Nombre (entier ou décimal) | 2. Unité | 3. Le reste (si présent)
    let match = q.match(/^([\d.]+)\s*([a-zA-Zàâäéèêëîïôöùûüç.]+)?/);

    if (match) {
      const val = parseFloat(match[1]);
      let unit = match[2] ? match[2].trim() : "pc"; // "pc" par défaut si vide
      
      // Normalisation simple des unités (ex: g, cl, cas)
      if (unit.endsWith('s') && !['cas', 'cac'].includes(unit)) unit = unit.slice(0, -1);
      
      if (sums[unit] !== undefined) sums[unit] += val;
      else sums[unit] = val;
    } else {
      unparseable.push(rawQ.trim());
    }
  });

  const parts = [];
  for (const [unit, val] of Object.entries(sums)) {
    const roundedVal = Math.round(val * 100) / 100;
    parts.push(`${roundedVal} ${unit}`);
  }
  
  const allParts = [...parts, ...unparseable];
  return allParts.length > 0 ? ` (${allParts.join(' + ')})` : "";
};

  // --- LE MOTEUR DE SYNCHRONISATION MENU <-> CADDIE ---
  const syncMenuAndCart = async (newMenu, options = {}) => {
    const { forceSyncCart = false, redirect = false, markValidated = false } = options;
    if (!householdId) return;
    setIsValidating(true);

    try {
      const houseSnap = await getDoc(doc(db, "households", householdId));
      const currentCart = houseSnap.data()?.currentCart || [];
      
      const manualItems = currentCart.filter(item => item.type !== 'menu');
      const oldMenuItems = currentCart.filter(item => item.type === 'menu');

      if (oldMenuItems.length === 0 && !forceSyncCart) {
        await updateDoc(doc(db, "households", householdId), { currentMenu: newMenu });
        return; // setMenu est géré par onSnapshot
      }

      const ingMap = {};
      newMenu.forEach(recipe => {
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach(ing => {
            const key = ing.name.trim().toLowerCase();
            if (!ingMap[key]) ingMap[key] = { name: ing.name.trim(), quantities: [] };
            if (ing.quantity && ing.quantity.trim() !== "") ingMap[key].quantities.push(ing.quantity.trim());
          });
        }
      });

      const newMenuItems = Object.values(ingMap).map(item => {
  const qtyStr = aggregateQuantities(item.quantities); // Calcule " (500 g)"
  return {
    id: 'menu_' + item.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: `${item.name}${qtyStr}`, // Fusionne le nom "Poulet" + " (500 g)"
    baseName: item.name.toLowerCase(),
    checked: false,
    type: 'menu'
  };
});

      const mergedMenuItems = newMenuItems.map(newItem => {
        const existingItem = oldMenuItems.find(old => old.baseName === newItem.baseName);
        if (existingItem) return { ...newItem, checked: existingItem.checked };
        return newItem;
      });

      const finalCart = [...manualItems, ...mergedMenuItems];

      const payload = {
        currentMenu: newMenu,
        currentCart: finalCart
      };
      
      if (markValidated) payload.isMenuValidated = true;

      await updateDoc(doc(db, "households", householdId), payload);

      if (redirect) navigate("/cart");

    } catch (error) {
      console.error("Erreur de synchro :", error);
    } finally {
      setIsValidating(false);
    }
  };

  // --- ANALYSE DE L'ÉTAT DES COURSES POUR UNE RECETTE ---
  const getRecipeReadiness = (recipe) => {
    if (!isValidated || !recipe.ingredients || recipe.ingredients.length === 0) return null;
    
    const baseNames = recipe.ingredients.map(ing => ing.name.trim().toLowerCase());
    let totalMenuIngredients = 0;
    let checkedIngredients = 0;

    baseNames.forEach(baseName => {
      // On cherche cet ingrédient dans le caddie (parmi ceux générés par le menu)
      const cartItem = cart.find(item => item.baseName === baseName && item.type === 'menu');
      if (cartItem) {
        totalMenuIngredients++;
        if (cartItem.checked) checkedIngredients++;
      }
    });

    if (totalMenuIngredients === 0) return null; // Sécurité si aucun ingrédient
    return checkedIngredients === totalMenuIngredients ? 'ready' : 'missing';
  };

  // --- LES ACTIONS UTILISATEUR ---
  const generateMenu = async () => {
    if (!householdId || allRecipes.length === 0) return;
    setIsGenerating(true);
    try {
      const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
      const selectedRecipes = shuffled.slice(0, 7);

      const houseSnap = await getDoc(doc(db, "households", householdId));
      const manualItems = (houseSnap.data()?.currentCart || []).filter(item => item.type !== 'menu');
      
      await updateDoc(doc(db, "households", householdId), { 
        currentMenu: selectedRecipes,
        currentCart: manualItems,
        isMenuValidated: false 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const swapRecipe = (indexToSwap) => {
    const currentMenuIds = menu.map(r => r.id);
    const availableRecipes = allRecipes.filter(r => !currentMenuIds.includes(r.id));
    if (availableRecipes.length === 0) return;
    const randomNewRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    const newMenu = [...menu];
    newMenu[indexToSwap] = randomNewRecipe;
    syncMenuAndCart(newMenu);
  };

  const removeRecipe = (indexToRemove) => {
    const newMenu = menu.filter((_, index) => index !== indexToRemove);
    syncMenuAndCart(newMenu);
  };

  const markAsCooked = (indexToCook) => {
    const newMenu = menu.filter((_, index) => index !== indexToCook);
    syncMenuAndCart(newMenu, { forceSyncCart: true });
  };

  const validateMenu = () => {
    syncMenuAndCart(menu, { forceSyncCart: true, redirect: true, markValidated: true });
  };

  const getProteinColor = (protein) => {
    switch (protein?.toLowerCase()) {
      case 'bœuf': case 'porc': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'poulet': return 'text-gold bg-gold/10 border-gold/20';
      case 'poisson': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'végétarien': return 'text-mint bg-mint/10 border-mint/20';
      default: return 'text-sage bg-sage/10 border-sage/20';
    }
  };

  if (loading) return <div className="pt-20 text-center text-white">Préparation de la cuisine...</div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-36 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-sage">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-white tracking-tight">Menu de la semaine</h1>
            <p className="font-body text-text-muted text-xs uppercase tracking-widest font-bold mt-1">
              {menu.length > 0 
                ? (isValidated ? `${menu.length} recettes à cuisiner` : `${menu.length} recettes en brouillon`)
                : "Aucun menu planifié"}
            </p>
          </div>
        </div>
        
        {menu.length > 0 && (
          <button onClick={generateMenu} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors" title="Générer un tout nouveau menu">
            <RefreshCw size={18} />
          </button>
        )}
      </header>

      {menu.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center mt-10">
          <div className="w-32 h-32 rounded-full bg-sage/5 flex items-center justify-center mb-6">
            <ChefHat size={48} className="text-sage/40" />
          </div>
          <p className="text-text-secondary text-center font-body text-sm mb-8 px-6">
            Il est temps de planifier la semaine. Nous allons piocher parmi vos {allRecipes.length} recettes.
          </p>
          <button onClick={generateMenu} disabled={isGenerating || allRecipes.length === 0} className="flex items-center gap-3 px-8 py-4 rounded-full font-display font-black text-forest-deepest bg-gradient-to-r from-sage to-mint shadow-[0_0_20px_rgba(122,171,130,0.3)] hover:scale-[1.03] transition-transform disabled:opacity-50">
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <ChefHat size={20} />}
            Générer mon menu
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {menu.map((recipe, index) => {
            
            // Calcul de l'état des courses pour cette recette
            const readiness = getRecipeReadiness(recipe);
            const isReady = readiness === 'ready';
            const isMissing = readiness === 'missing';

            return (
              <div key={`${recipe.id}-${index}`} className="relative glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-sage/30 transition-colors overflow-hidden">
                
                {/* --- BARRES D'ACCENTUATION --- */}
                {isValidated && isReady && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-mint shadow-[0_0_15px_rgba(62,232,138,0.5)]" />
                )}
                {isValidated && isMissing && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold shadow-[0_0_15px_rgba(240,201,74,0.5)] opacity-80" />
                )}

                <div className="flex flex-col gap-1.5 flex-1 min-w-0 pl-2">
                  <span className="font-display font-bold text-white text-base truncate">{recipe.name}</span>
                  <div className="flex gap-2 items-center flex-wrap mt-0.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getProteinColor(recipe.protein)}`}>{recipe.protein}</span>
                    <span className="text-text-muted font-body text-xs">⏱ {recipe.time}</span>
                    
                    {/* --- TEXTE D'INDICATEUR DES COURSES --- */}
                    {isValidated && readiness && (
                      <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isReady ? 'text-mint' : 'text-gold'}`}>
                        {isReady ? '✅ Prêt à cuisiner' : '🛒 Courses à faire'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto pl-2">
                  {!isValidated ? (
                    <>
                      <button onClick={() => swapRecipe(index)} className="px-3 py-2 rounded-xl bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 font-display text-xs font-bold" title="Changer cette recette">
                        <RefreshCw size={14} /> Changer
                      </button>
                      <button onClick={() => removeRecipe(index)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Retirer du menu">
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {recipe.pdfLink && (
                        <a href={recipe.pdfLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center gap-2 font-display text-xs font-bold" title="Ouvrir la recette détaillée">
                          <ExternalLink size={14} /> Recette
                        </a>
                      )}
                      <button onClick={() => markAsCooked(index)} className="px-3 py-2 rounded-xl bg-mint/10 text-mint hover:bg-mint/20 transition-colors flex items-center gap-2 font-display text-xs font-bold" title="Marquer comme cuisiné">
                        <Utensils size={14} /> Cuisiné
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {!isValidated && (
            <>
              <div className="h-20"></div>
              <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center pointer-events-none z-40">
                <button onClick={validateMenu} disabled={isValidating} className="pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full font-display font-black text-forest-deepest bg-gradient-to-r from-mint to-mint-deep shadow-[0_10_30px_rgba(62,232,138,0.4)] hover:scale-[1.03] transition-transform disabled:opacity-50">
                  {isValidating ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={22} />}
                  Valider & Générer le Caddie
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}