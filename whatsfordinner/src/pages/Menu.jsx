import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { 
  RefreshCw, ChefHat, Trash2, CheckCircle2, Utensils, ExternalLink, 
  X, Clock, Beef, Drumstick, Fish, Leaf, Check,
  Minus, Plus, Wheat, Milk, BottleWine, Ham
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import PageHeader from "../components/PageHeader";

// Icône SVG personnalisée pour la Cacahuète (imitant le style Lucide-react)
const PeanutIcon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14.6 9.4A5.5 5.5 0 0 0 8 5 5 5 0 0 0 3.3 9.4c-.6.9-.9 2.5-.2 4a5 5 0 0 0 4.7 3.6 5.5 5.5 0 0 0 6.6 4.4 5 5 0 0 0 4.7-3.6c.7-1.5.4-3.1-.2-4a5.5 5.5 0 0 0-4.3-4.4z"/>
    <path d="M12 12c.5-.5 1-1 2-1" />
    <path d="M9 13c-.5.5-1 1-2 1" />
  </svg>
);

export default function Menu() {
  const navigate = useNavigate();
  const [householdId, setHouseholdId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [isValidated, setIsValidated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // --- ÉTATS POUR LES FILTRES DU MENU ---
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [recipeCount, setRecipeCount] = useState(7);
  const [filterExpress, setFilterExpress] = useState(false);
  const [filterProteins, setFilterProteins] = useState([]);
  const [filterTags, setFilterTags] = useState([]);

  // --- ÉTAT POUR L'ACCORDÉON DES COURSES ---
  const [expandedRecipeIndex, setExpandedRecipeIndex] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    const initData = async () => {
      const user = auth.currentUser;
      if (!user) { navigate("/login"); return; }
      
      try {
        const recipesSnap = await getDocs(collection(db, "recipes"));
        setAllRecipes(recipesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setUserData(uData);
          if (uData.householdId) {
            setHouseholdId(uData.householdId);
            unsubscribe = onSnapshot(doc(db, "households", uData.householdId), (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                setMenu(data.currentMenu || []);
                setIsValidated(data.isMenuValidated || false);
                setCart(data.currentCart || []);
              }
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      } catch (error) { console.error(error); setLoading(false); }
    };
    initData();
    return () => unsubscribe();
  }, [navigate]);

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
      
      const manualItems = markValidated ? [] : currentCart.filter(item => item.type !== 'menu');
      const oldMenuItems = currentCart.filter(item => item.type === 'menu');

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

      const mergedMenuItems = markValidated 
        ? newMenuItems 
        : newMenuItems.map(newItem => {
            const existing = oldMenuItems.find(old => old.baseName === newItem.baseName);
            return existing ? { ...newItem, checked: existing.checked } : newItem;
          });

      const payload = { 
        currentMenu: newMenu, 
        currentCart: [...manualItems, ...mergedMenuItems] 
      };
      
      if (markValidated) payload.isMenuValidated = true;
      
      await updateDoc(doc(db, "households", householdId), payload);
      if (redirect) navigate("/cart");
    } finally { setIsValidating(false); }
  };

  const availableRecipes = allRecipes?.filter(recipe => {
    if (filterExpress && parseInt(recipe.time || 999) > 30) return false;
    
    if (filterProteins.length > 0) {
      const recProt = recipe.protein?.toLowerCase() || "autre";
      if (!filterProteins.includes(recProt)) return false;
    }
    
    const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
    const ingredientsStr = JSON.stringify(recipe.ingredients || "").toLowerCase();

    for (const tag of filterTags) {
      if (tag === "végé" && !tags.includes("végé")) return false;
      if (tag === "sans gluten" && !tags.includes("sans gluten")) return false;
      if (tag === "sans lactose" && !tags.includes("sans lactose")) return false;
      if (tag === "sans sauce soja" && ingredientsStr.includes("sauce soja")) return false;
      
      if (tag === "sans fruits à coque") {
        if (
          ingredientsStr.includes("cacahuète") ||
          ingredientsStr.includes("cacahuete") ||
          ingredientsStr.includes("amande") ||
          ingredientsStr.includes("noisette") ||
          ingredientsStr.includes("noix")
        ) {
          return false;
        }
      }
    }
    
    return true;
  }) || [];

  const handleGenerateFilteredMenu = async () => {
    if (availableRecipes.length === 0 || !householdId) return;
    setIsGenerating(true); 
    
    try {
      const shuffled = [...availableRecipes].sort(() => 0.5 - Math.random());
      const selectedRecipes = shuffled.slice(0, Math.min(recipeCount, availableRecipes.length));

      await updateDoc(doc(db, "households", householdId), {
        currentMenu: selectedRecipes,
        isMenuValidated: false,
        currentCart: [] 
      });

      setIsFilterModalOpen(false);
    } catch (error) {
      console.error("Erreur de génération :", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleProtein = (prot) => {
    setFilterProteins(prev => 
      prev.includes(prot) ? prev.filter(p => p !== prot) : [...prev, prot]
    );
  };

  const toggleDietTag = (tagId) => {
    if (tagId === "") { setFilterTags([]); return; }
    setFilterTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const swapRecipe = (index) => {
    const currentIds = menu.map(r => r.id);
    const available = availableRecipes.filter(r => !currentIds.includes(r.id));
    if (available.length === 0) {
      alert("Aucune autre recette ne correspond à vos filtres actuels.");
      return;
    }
    const newMenu = [...menu];
    newMenu[index] = available[Math.floor(Math.random() * available.length)];
    syncMenuAndCart(newMenu);
  };

  // NOUVEAU : On récupère plus de détails pour le statut (nombre restants et détails)
  const getRecipeDetails = (recipe) => {
    if (!isValidated || !recipe.ingredients || recipe.ingredients.length === 0) return { status: null };
    const ings = recipe.ingredients.map(i => i.name.trim().toLowerCase());
    const relevantCart = cart.filter(i => ings.includes(i.baseName) && i.type === 'menu');
    
    if (relevantCart.length === 0) return { status: null };
    
    const missingItems = relevantCart.filter(i => !i.checked);
    const missingCount = missingItems.length;
    
    return {
      status: missingCount === 0 ? 'ready' : 'missing',
      missingCount,
      missingItems
    };
  };

  const getProteinIcon = (protein) => {
  const p = protein?.toLowerCase().trim();
  if (p === 'poulet') return <Drumstick size={12} />;
  if (p === 'bœuf' || p === 'boeuf') return <Beef size={12} />;
  if (p === 'poisson') return <Fish size={12} />;
  if (p === 'porc') return <Ham size={12} />;
  if (p === 'végétarien' || p === 'végé') return <Leaf size={12} />;
  return <ChefHat size={12} />; // Icône par défaut
};

  if (loading) return <div className="p-6 pt-24"><SkeletonLoader type="header" />{[...Array(4)].map((_, i) => <SkeletonLoader key={i} type="recipe-card" />)}</div>;

  return (
    <div className="flex flex-col min-h-screen pt-24 px-4 pb-36 animate-fade-in w-full max-w-4xl mx-auto">
      
      <PageHeader 
        subtitle={menu.length > 0 ? (isValidated ? "Menu validé" : "Brouillon en cours") : "Cette semaine"}
        title="Menu Hebdo"
        actionNode={
          menu.length > 0 && (
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-forest-deepest border border-forest-deepest/10 shadow-sm transition-transform active:scale-90"
            >
              <RefreshCw size={20} className={isGenerating ? "animate-spin" : ""} />
            </button>
          )
        }
      />

      {menu.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-4 text-center">
          <div className="w-24 h-24 rounded-full glass-panel flex items-center justify-center text-forest-deepest/40 mb-6 shadow-xl">
            <ChefHat size={40} />
          </div>
          <h2 className="font-display font-black text-xl text-forest-deepest mb-3 text-center">Planifiez votre semaine</h2>
          <p className="text-forest-deepest/70 text-sm mb-10 leading-relaxed text-center">
            Configurez vos préférences pour générer votre menu de la semaine.
          </p>
          <button 
            onClick={() => setIsFilterModalOpen(true)} 
            disabled={isGenerating || allRecipes.length === 0} 
            className="btn-primary w-full max-w-xs"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <ChefHat size={20} />}
            Générer mon menu
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {menu.map((recipe, index) => {
            const details = getRecipeDetails(recipe);
            const isExpanded = expandedRecipeIndex === index;

            return (
              <div 
                key={index} 
                className={`glass-card relative overflow-hidden group transition-all duration-300 ${
                  details.status === 'missing' ? 'cursor-pointer hover:bg-white/60' : ''
                }`}
                onClick={() => {
                  // On ouvre le tiroir que si le menu est validé et qu'il manque des courses
                  if (details.status === 'missing') {
                    setExpandedRecipeIndex(isExpanded ? null : index);
                  }
                }}
              >
                {details.status === 'ready' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-mint-deep shadow-[2px_0_10px_rgba(16,185,129,0.3)]" />}
                
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1 pl-1">
                    {/* MODIFICATION : Suppression de 'truncate' et ajustement pour multilignes */}
                    <h3 className="text-forest-deepest font-bold text-lg leading-tight">{recipe.name}</h3>
                    
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {recipe.protein && recipe.protein.toLowerCase() !== 'autre' && (
  <span className="badge flex items-center gap-1.5">
    {getProteinIcon(recipe.protein)}
    {recipe.protein}
  </span>
)}
                      
                      {recipe.tags && recipe.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-forest-deepest/40 bg-forest-deepest/5 px-2 py-0.5 rounded-full uppercase tracking-widest border border-forest-deepest/5">
                          #{t}
                        </span>
                      ))}

                      {details.status && (
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          details.status === 'ready' 
                            ? 'bg-mint-deep/15 text-mint-deep'
                            : 'bg-orange-500/15 text-orange-600'
                        }`}>
                          {/* MODIFICATION : Affichage du compte précis */}
                          {details.status === 'ready' ? '● Prêt' : `○ Courses (${details.missingCount} restant${details.missingCount > 1 ? 's' : ''})`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    {/* MODIFICATION : Lien PDF toujours présent, avec stopPropagation pour ne pas déclencher le clic de la carte */}
                    {recipe.pdfLink && (
                      <a href={recipe.pdfLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="btn-ghost" title="Voir la recette">
                        <ExternalLink size={16}/>
                      </a>
                    )}
                    
                    {!isValidated ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); swapRecipe(index); }} className="btn-ghost" title="Changer cette recette">
                          <RefreshCw size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); syncMenuAndCart(menu.filter((_, i) => i !== index)); }} className="p-2.5 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); syncMenuAndCart(menu.filter((_, i) => i !== index), {forceSyncCart: true}); }} className="p-2.5 rounded-full text-mint-deep hover:text-forest-deepest hover:bg-mint transition-colors">
                        <Utensils size={16}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* MODIFICATION : Accordéon d'ingrédients manquants */}
                {details.status === 'missing' && isExpanded && (
                  <div className="mt-4 pt-3 border-t border-forest-deepest/5 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] font-black text-forest-deepest/40 uppercase tracking-widest mb-2 pl-1">À acheter :</p>
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {details.missingItems.map(item => (
                        <li key={item.id} className="text-xs font-medium text-forest-deepest/80 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                          <span className="leading-tight">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              disabled={isValidating}
              className="btn-primary w-full shadow-[0_10px_40px_rgba(6,9,7,0.2)]"
            >
              {isValidating ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              Valider le panier
            </button>
          </div>
        </div>
      )}

      {/* MODALE DE FILTRES - PORTAL */}
      {isFilterModalOpen && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in" 
          style={{ zIndex: 99999, backgroundColor: 'rgba(6, 9, 7, 0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-forest-deepest border border-mint/20 rounded-[2.5rem] p-8 shadow-2xl relative animate-slide-in-bottom max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setIsFilterModalOpen(false)} className="absolute top-6 right-6 text-cream/30 hover:text-mint transition-colors p-2 bg-white/5 rounded-full">
              <X size={20} />
            </button>
            
            <h2 className="text-cream font-display font-black text-2xl tracking-tight mb-8 mt-2 leading-tight">
              Préférences<br/><span className="text-mint">du Menu</span>
            </h2>

            {/* NOMBRE DE RECETTES */}
            <div className="mb-8">
              <p className="text-[10px] font-black text-mint/50 uppercase tracking-[0.2em] mb-3">Nombre de recettes</p>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2">
                <button 
                  onClick={() => setRecipeCount(Math.max(1, recipeCount - 1))}
                  className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cream hover:bg-white/10 transition-colors"
                >
                  <Minus size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-cream leading-none">{recipeCount}</span>
                </div>
                <button 
                  onClick={() => setRecipeCount(Math.min(14, recipeCount + 1))}
                  className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cream hover:bg-white/10 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* FILTRE : TEMPS (EXPRESS) */}
            <div className="mb-8">
              <p className="text-[10px] font-black text-mint/50 uppercase tracking-[0.2em] mb-3">Temps de préparation</p>
              <button 
                onClick={() => setFilterExpress(!filterExpress)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                  filterExpress 
                    ? 'bg-mint/10 border-mint/30 text-cream'
                    : 'bg-white/5 border-white/5 text-cream/60 hover:bg-white/10 hover:text-cream'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Express (Max 30 min)</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${filterExpress ? 'border-mint bg-mint' : 'border-white/20'}`}>
                  {filterExpress && <Check size={12} className="text-forest-deepest" />}
                </div>
              </button>
            </div>

            {/* FILTRE : PROTÉINES */}
            <div className="mb-8">
              <p className="text-[10px] font-black text-mint/50 uppercase tracking-[0.2em] mb-3">Protéines souhaitées</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'poulet', label: 'Poulet', icon: Drumstick },
                  { id: 'bœuf', label: 'Bœuf', icon: Beef },
                  { id: 'porc', label: 'Porc', icon: Ham },
                  { id: 'poisson', label: 'Poisson', icon: Fish }
                ].map(prot => {
                  const isSelected = filterProteins.includes(prot.id);
                  return (
                    <button
                      key={prot.id}
                      onClick={() => toggleProtein(prot.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-mint border-mint text-forest-deepest shadow-sm' 
                          : 'bg-white/5 border-white/5 text-cream/50 hover:bg-white/10 hover:text-cream'
                      }`}
                    >
                      <prot.icon size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{prot.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FILTRE : RÉGIME / EXCLUSION CUMULABLES */}
            <div className="mb-10">
              <p className="text-[10px] font-black text-mint/50 uppercase tracking-[0.2em] mb-3">Régime & Allergies</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleDietTag("")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                    filterTags.length === 0 
                      ? 'bg-white/20 border-white/40 text-cream shadow-sm' 
                      : 'bg-transparent border-white/10 text-cream/40 hover:border-white/20 hover:text-cream/80'
                  }`}
                >
                  Aucun
                </button>
                {[
                  { id: 'végé', label: 'Végétarien', icon: Leaf },
                  { id: 'sans gluten', label: 'Sans Gluten', icon: Wheat },
                  { id: 'sans lactose', label: 'Sans Lactose', icon: Milk },
                  { id: 'sans sauce soja', label: 'Sans Soja', icon: BottleWine },
                  { id: 'sans fruits à coque', label: 'Sans Fruits à Coque', icon: PeanutIcon }
                ].map(tag => {
                  const isSelected = filterTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleDietTag(tag.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-mint border-mint text-forest-deepest shadow-sm' 
                          : 'bg-transparent border-white/10 text-cream/40 hover:border-white/20 hover:text-cream/80'
                      }`}
                    >
                      {tag.icon && <tag.icon size={12} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOUTON GÉNÉRER AVEC COMPTEUR DYNAMIQUE */}
            <button 
              onClick={handleGenerateFilteredMenu}
              disabled={availableRecipes.length === 0 || isGenerating}
              className={`w-full py-4 rounded-2xl flex flex-col justify-center items-center transition-all ${
                availableRecipes.length > 0 
                  ? 'bg-mint text-forest-deepest hover:bg-[#10b981] shadow-lg active:scale-95' 
                  : 'bg-white/5 text-cream/20 cursor-not-allowed'
              }`}
            >
              <span className="font-black uppercase tracking-widest text-[11px] mb-0.5 flex items-center gap-2">
                {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : null}
                {availableRecipes.length > 0 ? 'Générer le menu' : 'Aucune recette trouvée'}
              </span>
              <span className="text-[9px] font-mono font-bold opacity-60">
                {availableRecipes.length} recette{availableRecipes.length > 1 ? 's' : ''} correspondante{availableRecipes.length > 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}