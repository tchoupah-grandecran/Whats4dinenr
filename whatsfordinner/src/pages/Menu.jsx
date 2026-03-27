import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { CalendarDays, RefreshCw, ChefHat, Trash2, CheckCircle2, Utensils, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Menu() {
  const navigate = useNavigate();
  const [householdId, setHouseholdId] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
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
          unsubscribe = onSnapshot(doc(db, "households", hId), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setMenu(data.currentMenu || []);
              setIsValidated(data.isMenuValidated || false);
              setCart(data.currentCart || []);
            }
            setLoading(false);
          });
        }
      } catch (error) { console.error(error); setLoading(false); }
    };
    initData();
    return () => unsubscribe();
  }, []);

  const aggregateQuantities = (quantities) => {
    if (!quantities || quantities.length === 0) return "";
    const sums = {};
    const unparseable = [];
    const invariables = ['g', 'kg', 'cl', 'ml', 'l', 'cas', 'cac'];

    quantities.forEach(rawQ => {
      const q = String(rawQ).toLowerCase().trim();
      let match = q.match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        const val = parseFloat(match[1]);
        let unit = match[2] ? match[2].trim() : "pc";
        if (unit.endsWith('s') && !['cas', 'cac'].includes(unit)) unit = unit.slice(0, -1);
        sums[unit] = (sums[unit] || 0) + val;
      } else { unparseable.push(rawQ); }
    });

    const parts = Object.entries(sums).map(([unit, val]) => {
      const rounded = Math.round(val * 100) / 100;
      let displayUnit = (rounded > 1 && !invariables.includes(unit)) ? unit + "s" : unit;
      return `${rounded} ${displayUnit}`.trim();
    });
    return parts.length || unparseable.length ? ` (${[...parts, ...unparseable].join(' + ')})` : "";
  };

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
        return;
      }

      const ingMap = {};
      newMenu.forEach(recipe => {
        recipe.ingredients?.forEach(ing => {
          const key = ing.name.trim().toLowerCase();
          if (!ingMap[key]) ingMap[key] = { name: ing.name.trim(), quantities: [] };
          if (ing.quantity) ingMap[key].quantities.push(ing.quantity);
        });
      });

      const newMenuItems = Object.values(ingMap).map(item => ({
        id: 'menu_' + item.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: `${item.name}${aggregateQuantities(item.quantities)}`,
        baseName: item.name.toLowerCase(),
        checked: false,
        type: 'menu'
      }));

      const mergedMenuItems = newMenuItems.map(newItem => {
        const existing = oldMenuItems.find(old => old.baseName === newItem.baseName);
        return existing ? { ...newItem, checked: existing.checked } : newItem;
      });

      const payload = { currentMenu: newMenu, currentCart: [...manualItems, ...mergedMenuItems] };
      if (markValidated) payload.isMenuValidated = true;
      await updateDoc(doc(db, "households", householdId), payload);
      if (redirect) navigate("/cart");
    } finally { setIsValidating(false); }
  };

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

  const swapRecipe = (index) => {
    const currentIds = menu.map(r => r.id);
    const available = allRecipes.filter(r => !currentIds.includes(r.id));
    if (available.length === 0) return;
    const newMenu = [...menu];
    newMenu[index] = available[Math.floor(Math.random() * available.length)];
    syncMenuAndCart(newMenu);
  };

  const getRecipeStatus = (recipe) => {
    if (!isValidated || !recipe.ingredients || recipe.ingredients.length === 0) return null;
    const ings = recipe.ingredients.map(i => i.name.trim().toLowerCase());
    const relevantCart = cart.filter(i => ings.includes(i.baseName) && i.type === 'menu');
    
    if (relevantCart.length === 0) return null;
    const checked = relevantCart.filter(i => i.checked).length;
    return checked === relevantCart.length ? 'ready' : 'missing';
  };

  if (loading) return <div className="p-6"><SkeletonLoader type="header" />{[...Array(4)].map((_, i) => <SkeletonLoader key={i} type="recipe-card" />)}</div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-36 animate-fade-in">
      
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-forest-deepest"><CalendarDays size={20} /></div>
          <div>
            <h1 className="font-display text-2xl font-black text-forest-deepest leading-tight">Menu Hebdo</h1>
            {menu.length > 0 && (
              <p className="font-display text-[10px] uppercase tracking-widest text-forest-deepest/60 mt-1 font-bold">
                {isValidated ? "Validé" : "Brouillon"} • {menu.length} repas
              </p>
            )}
          </div>
        </div>
        {menu.length > 0 && (
          <button 
            onClick={() => { if(window.confirm("Générer un tout nouveau menu de 7 recettes ? L'actuel sera écrasé.")) generateMenu(); }} 
            className="p-2.5 rounded-full text-forest-deepest/60 hover:text-forest-deepest hover:bg-forest-deepest/5 transition-colors"
            title="Générer un tout nouveau menu"
          >
            <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
          </button>
        )}
      </header>

      {menu.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-4 text-center">
          <div className="w-24 h-24 rounded-full glass-panel flex items-center justify-center text-forest-deepest/40 mb-6 shadow-xl">
            <ChefHat size={40} />
          </div>
          <h2 className="font-display font-black text-xl text-forest-deepest mb-3">Planifiez votre semaine</h2>
          <p className="text-forest-deepest/70 text-sm mb-10 leading-relaxed">
            Nous allons tirer 7 recettes au hasard parmi les {allRecipes.length} recettes de votre Foyer pour composer votre menu.
          </p>
          <button 
            onClick={generateMenu} 
            disabled={isGenerating || allRecipes.length === 0} 
            className="btn-primary w-full max-w-xs shadow-[0_10px_30px_rgba(6,9,7,0.15)]"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <ChefHat size={20} />}
            Générer mon menu
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {menu.map((recipe, index) => {
            const status = getRecipeStatus(recipe);
            return (
              <div key={index} className="glass-card relative overflow-hidden group">
                
                {/* Barre latérale colorée (Vert foncé) si le repas est prêt */}
                {status === 'ready' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-mint-deep shadow-[2px_0_10px_rgba(16,185,129,0.3)]" />}
                
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0 flex-1 pl-1">
                    <h3 className="text-forest-deepest font-bold text-lg leading-tight truncate">{recipe.name}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Le tag Protéine utilise le style badge par défaut (Gris/Vert subtil) */}
                      <span className="badge">{recipe.protein}</span>
                      
                      {/* NOUVEAU : Les tags de statuts très lisibles */}
                      {status && (
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          status === 'ready' 
                            ? 'bg-mint-deep/15 text-mint-deep' /* Vert intense pour Prêt */
                            : 'bg-orange-500/15 text-orange-600' /* Orange doux pour Courses */
                        }`}>
                          {status === 'ready' ? '● Prêt' : '○ Courses'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isValidated ? (
                      <>
                        <button onClick={() => swapRecipe(index)} className="btn-ghost" title="Changer cette recette">
                          <RefreshCw size={16} />
                        </button>
                        <button onClick={() => syncMenuAndCart(menu.filter((_, i) => i !== index))} className="p-2.5 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Retirer">
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        {recipe.pdfLink && (
                          <a href={recipe.pdfLink} target="_blank" rel="noreferrer" className="btn-ghost" title="Voir la recette">
                            <ExternalLink size={16}/>
                          </a>
                        )}
                        <button onClick={() => syncMenuAndCart(menu.filter((_, i) => i !== index), {forceSyncCart: true})} className="p-2.5 rounded-full text-mint-deep hover:text-forest-deepest hover:bg-mint transition-colors" title="Marqué comme cuisiné">
                          <Utensils size={16}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isValidated && menu.length > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-0 right-0 px-6 z-40 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button 
              onClick={() => syncMenuAndCart(menu, { redirect: true, markValidated: true, forceSyncCart: true })} 
              className="btn-primary w-full shadow-[0_10px_40px_rgba(6,9,7,0.2)]"
            >
              <CheckCircle2 size={20} /> Valider le panier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}