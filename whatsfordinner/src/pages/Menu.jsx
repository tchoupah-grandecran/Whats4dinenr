import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import {
  RefreshCw, CalendarDays, Trash2,
  ExternalLink, ArrowRight, SlidersHorizontal, X, Users, UtensilsCrossed,
  Check, ShoppingBasket, Clock3, ChevronDown, ShieldAlert,
  ChefHat, Drumstick, Beef, Fish, Leaf, Zap, ShoppingCart, CheckCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonLoader from "../components/SkeletonLoader";
import ConfirmModal from "../components/ConfirmModal";

const MotionDiv = motion.div;

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
  const [showFilters, setShowFilters] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [missingPopoverIndex, setMissingPopoverIndex] = useState(-1);

  const [constraints, setConstraints] = useState({
    allergens: [],
    protein: "all",
    quickMode: false,
    mealCount: 7,
    servings: 2
  });

  const ALLERGENS_LIST = ["Gluten", "Lactose", "Fruits à coque", "Arachides", "Œufs", "Poisson"];

  const PROTEINS_LIST = [
    { id: "all", label: "Omnivore", icon: ChefHat },
    { id: "poulet", label: "Poulet", icon: Drumstick },
    { id: "bœuf", label: "Bœuf", icon: Beef },
    { id: "poisson", label: "Poisson", icon: Fish },
    { id: "végétarien", label: "Végé", icon: Leaf }
  ];

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter(r => {
      const matchProtein = constraints.protein === "all" || r.protein?.toLowerCase() === constraints.protein;
      const recipeTime = parseInt(r.time) || 0;
      const matchQuick = !constraints.quickMode || recipeTime <= 30;
      const hasAllergen = r.allergens?.some(a => constraints.allergens.includes(a));
      return matchProtein && matchQuick && !hasAllergen;
    });
  }, [allRecipes, constraints]);

  const filteredRecipesCount = filteredRecipes.length;

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
              setCart(data.currentCart || []);
              setIsValidated(data.isMenuValidated || false);
              if (data.constraints) setConstraints(data.constraints);
            }
            setLoading(false);
          });
        }
      } catch (error) { console.error(error); setLoading(false); }
    };
    initData();
    return () => unsubscribe();
  }, []);

  const adjustQuantity = (rawQty, servings) => {
    if (!rawQty) return "";
    const ratio = servings / 2;
    const match = String(rawQty).match(/^([\d.]+)\s*(.*)$/);
    if (!match) return rawQty;
    const val = parseFloat(match[1]);
    const unit = match[2] || "";
    return `${Math.round((val * ratio) * 100) / 100} ${unit}`.trim();
  };

  const aggregateQuantities = (quantities) => {
    const sums = {};
    const unparseable = [];
    quantities.forEach(q => {
      const match = String(q).match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = (match[2] || "pc").trim();
        sums[unit] = (sums[unit] || 0) + val;
      } else { unparseable.push(q); }
    });
    const parts = Object.entries(sums).map(([unit, val]) => `${Math.round(val * 100) / 100} ${unit}`);
    return parts.length ? ` (${[...parts, ...unparseable].join(' + ')})` : "";
  };

  const syncMenuAndCart = async (newMenu, options = {}) => {
    const { redirect = false, markValidated = false } = options;
    if (!householdId) return;
    setIsValidating(true);
    try {
      const houseSnap = await getDoc(doc(db, "households", householdId));
      const currentCart = houseSnap.data()?.currentCart || [];
      const manualItems = currentCart.filter(item => item.type !== 'menu');
      const oldMenuItems = currentCart.filter(item => item.type === 'menu');
      const ingMap = {};
      newMenu.forEach(recipe => {
        recipe.ingredients?.forEach(ing => {
          const key = ing.name.trim().toLowerCase();
          if (!ingMap[key]) ingMap[key] = { name: ing.name.trim(), quantities: [] };
          const adjusted = adjustQuantity(ing.quantity, constraints.servings);
          if (adjusted) ingMap[key].quantities.push(adjusted);
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
      const payload = {
        currentMenu: newMenu,
        currentCart: [...manualItems, ...mergedMenuItems],
        constraints: constraints,
        isMenuValidated: markValidated ? true : isValidated
      };
      await updateDoc(doc(db, "households", householdId), payload);
      if (redirect) navigate("/cart");
    } finally { setIsValidating(false); }
  };

  const generateMenu = async () => {
    if (!householdId || allRecipes.length === 0) return;
    setIsGenerating(true);
    try {
      const shuffled = [...filteredRecipes].sort(() => 0.5 - Math.random());
      const selectedRecipes = shuffled.slice(0, constraints.mealCount).map(r => ({...r, cooked: false}));
      await updateDoc(doc(db, "households", householdId), {
        currentMenu: selectedRecipes,
        isMenuValidated: false,
        constraints: constraints
      });
    } finally { setIsGenerating(false); }
  };

  const handleResetMenu = async () => {
    if (householdId) {
      await updateDoc(doc(db, "households", householdId), { isMenuValidated: false });
    }
  };

  const getRecipeDetails = (recipe) => {
    if (!isValidated || !recipe.ingredients || recipe.ingredients.length === 0) return { status: null };
    const ings = recipe.ingredients.map(i => i.name.trim().toLowerCase());
    const relevantCart = cart.filter(i => ings.includes(i.baseName) && i.type === 'menu');
    if (relevantCart.length === 0) return { status: null };
    const missingItems = relevantCart.filter(i => !i.checked);
    return {
      status: missingItems.length === 0 ? 'ready' : 'missing',
      missingCount: missingItems.length,
      missingItems
    };
  };

  if (loading) return <div className="p-6 w-full min-h-screen bg-app-bg"><SkeletonLoader type="header" /></div>;

  return (
    <div className="flex flex-col min-h-screen pt-3 px-4 md:px-8 pb-32 transition-all bg-app-bg">

      {/* ── HEADER ── */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-accent-ocre)]/10 text-[var(--color-accent-ocre)] text-[10px] font-black uppercase tracking-widest">
              {constraints.servings} Pers. / {constraints.mealCount} Repas
            </span>
          </div>
          {/* h1 géré par le CSS global (clamp 28–40px) */}
          <h1 className="font-display text-[clamp(5rem,23vw,25rem)] leading-[0.72] tracking-[-0.05em] text-[var(--color-app-text)]">
            {isValidated ? "Le Menu" : "La Carte"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!isValidated ? (
            <>
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-app-text)] text-sm font-bold shadow-sm active:scale-95 transition-all"
              >
                <SlidersHorizontal size={16} /> Configurer
              </button>
              <button
                onClick={() => menu.length > 0 ? setIsRegenModalOpen(true) : generateMenu()}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--color-accent-ocre)] text-white shadow-lg hover:rotate-180 transition-all duration-700"
              >
                <RefreshCw size={20} className={isGenerating ? "animate-spin" : ""} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-app-text)] text-sm font-bold shadow-sm active:scale-95 transition-all"
            >
              <CalendarDays size={16} /> Nouveau Menu
            </button>
          )}
        </div>
      </header>

      {/* ── CONFIGURATEUR ── */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <MotionDiv
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white dark:bg-[var(--color-card-bg)] w-full max-w-lg rounded-[2rem] p-6 md:p-8 shadow-2xl border border-[var(--color-card-border)] flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="font-display text-2xl text-[var(--color-app-text)]">Configuration</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-[var(--color-app-text)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-7 scrollbar-hide">

                {/* Taille tablée + nb repas */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-app-text)]/40 mb-3">
                      <Users size={12} /> Tablée
                    </label>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-xl border border-[var(--color-card-border)]">
                      <button
                        onClick={() => setConstraints({...constraints, servings: Math.max(1, constraints.servings - 1)})}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-base font-bold"
                      >-</button>
                      <span className="flex-1 text-center font-display text-lg">{constraints.servings} pers.</span>
                      <button
                        onClick={() => setConstraints({...constraints, servings: constraints.servings + 1})}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-base font-bold"
                      >+</button>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-app-text)]/40 mb-3">
                      <UtensilsCrossed size={12} /> Repas
                    </label>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-xl border border-[var(--color-card-border)]">
                      <button
                        onClick={() => setConstraints({...constraints, mealCount: Math.max(1, constraints.mealCount - 1)})}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-base font-bold"
                      >-</button>
                      <span className="flex-1 text-center font-display text-lg">{constraints.mealCount}</span>
                      <button
                        onClick={() => setConstraints({...constraints, mealCount: constraints.mealCount + 1})}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-base font-bold"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Protéine */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-app-text)]/40 mb-3">
                    Protéine
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROTEINS_LIST.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setConstraints({...constraints, protein: p.id})}
                        className={`flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          constraints.protein === p.id
                            ? 'bg-[var(--color-accent-ocre)] text-white border-transparent shadow-md'
                            : 'bg-gray-100 dark:bg-white/5 text-[var(--color-app-text)] border-[var(--color-card-border)]'
                        }`}
                      >
                        <p.icon size={14} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temps + Allergènes */}
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-app-text)]/40 mb-3">
                      <Zap size={12} /> Préparation
                    </label>
                    <button
                      onClick={() => setConstraints({...constraints, quickMode: !constraints.quickMode})}
                      className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all border flex items-center justify-center gap-2 ${
                        constraints.quickMode
                          ? 'bg-amber-400 text-black border-transparent shadow-md'
                          : 'bg-gray-100 dark:bg-white/5 text-[var(--color-app-text)]/40 border-[var(--color-card-border)]'
                      }`}
                    >
                      <Zap size={13} fill={constraints.quickMode ? "currentColor" : "none"} />
                      Prêt en moins de 30 min
                    </button>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-app-text)]/40 mb-3">
                      <ShieldAlert size={12} /> Allergènes à exclure
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGENS_LIST.map((allergen) => (
                        <button
                          key={allergen}
                          onClick={() => setConstraints(prev => ({
                            ...prev,
                            allergens: prev.allergens.includes(allergen)
                              ? prev.allergens.filter(a => a !== allergen)
                              : [...prev.allergens, allergen]
                          }))}
                          className={`px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border ${
                            constraints.allergens.includes(allergen)
                              ? 'bg-red-500 text-white border-transparent'
                              : 'bg-gray-100 dark:bg-white/5 text-[var(--color-app-text)]/60 border-[var(--color-card-border)]'
                          }`}
                        >
                          {allergen}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => { setShowFilters(false); generateMenu(); }}
                disabled={filteredRecipesCount === 0}
                className="btn-primary w-full mt-6 shrink-0"
              >
                Appliquer & Générer
                <ArrowRight size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 ml-1">
                  ({filteredRecipesCount} recettes)
                </span>
              </button>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── GRILLE RECETTES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-[minmax(220px,auto)] gap-4">
        {menu.map((recipe, index) => {
          const details = getRecipeDetails(recipe);
          const isPopoverOpen = missingPopoverIndex === index;
          const editorialPosition = index % 4;
          const featured = editorialPosition === 0;
          const darkCard = editorialPosition === 1;
          const compact = editorialPosition === 3;

          return (
            <MotionDiv
              layout
              key={recipe.id || index}
              className={`group relative flex min-h-full flex-col overflow-hidden rounded-[1.15rem] border p-5 shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 md:p-6 ${featured ? 'md:col-span-2' : ''} ${darkCard ? 'border-transparent bg-[var(--color-accent-ocre-deep)] text-[var(--color-cream)]' : 'border-[var(--color-card-border)] bg-[var(--color-card-bg)]/75 text-[var(--color-app-text)]'} ${recipe.cooked ? 'opacity-40 grayscale scale-[0.98]' : ''}`}
            >
              {featured && <span className="absolute inset-y-0 left-0 z-10 w-1 bg-[var(--color-accent-ocre)]" />}
              <span className={`pointer-events-none absolute bottom-1 right-3 select-none font-display text-6xl leading-none ${darkCard ? 'text-white/[0.05]' : 'text-[var(--color-app-text)]/[0.035]'}`}>{String(index + 1).padStart(2, '0')}</span>
              <div className="mb-4">
                <div className="relative z-10 flex justify-between items-start mb-1">
                  <span className={`text-[8px] font-black uppercase tracking-[0.16em] ${darkCard ? 'text-white/50' : 'text-[var(--color-accent-ocre)]'}`}>
                    {recipe.protein}
                  </span>
                </div>
                <h3 className={`relative z-10 mt-5 font-body font-semibold leading-[1.02] tracking-[-0.03em] ${featured ? 'text-2xl md:mt-10 md:text-4xl' : compact ? 'text-base md:mt-6 md:text-lg' : 'text-lg md:mt-7 md:text-xl'} ${darkCard ? 'text-white' : 'text-[var(--color-app-text)]'}`}>{recipe.name}</h3>
                <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  {(recipe.tags || []).slice(0, featured ? 3 : 2).map(tag => <span key={tag} className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${darkCard ? 'bg-white/[0.08] text-white/45' : 'bg-[var(--color-app-text)]/[0.04] text-[var(--color-app-text)]/40'}`}>{tag}</span>)}
                  {recipe.ingredients?.length > 0 && <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${darkCard ? 'bg-white/[0.08] text-white/45' : 'bg-[var(--color-app-text)]/[0.04] text-[var(--color-app-text)]/40'}`}>{recipe.ingredients.length} ingrédients</span>}
                </div>

                {details.status && (
                  <div className="relative mt-2.5">
                    {details.status === 'ready' ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-green-100 text-green-600">
                        <CheckCheck size={11} /> Prêt à cuisiner
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setMissingPopoverIndex(isPopoverOpen ? -1 : index)}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 active:scale-95 transition-all cursor-pointer"
                        >
                          <ShoppingCart size={11} />
                          {details.missingCount} ingrédient{details.missingCount > 1 ? 's' : ''} manquant{details.missingCount > 1 ? 's' : ''}
                        </button>
                        {isPopoverOpen && (
                          <div className="absolute top-full left-0 mt-1.5 z-50 bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl p-3 shadow-2xl min-w-[180px] max-w-[240px]">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-app-text)]/40">À acheter</p>
                              <button onClick={() => setMissingPopoverIndex(-1)} className="text-[var(--color-app-text)]/30 hover:text-[var(--color-app-text)] transition-colors">
                                <X size={12} />
                              </button>
                            </div>
                            <ul className="flex flex-col gap-1.5">
                              {details.missingItems.map(item => (
                                <li key={item.id} className="flex items-start gap-2 text-[11px] font-medium text-[var(--color-app-text)]/80">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0" />
                                  <span className="leading-tight">{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={`relative z-10 mt-auto flex items-center justify-between gap-2 border-t pt-4 ${darkCard ? 'border-white/10' : 'border-[var(--color-card-border)]'}`}>
                <div className="flex items-center gap-4 text-[10px] font-bold opacity-70">
                  <span className="flex items-center gap-1.5"><Clock3 size={13} className={darkCard ? 'text-white/45' : 'text-[var(--color-accent-ocre)]'} />{recipe.time ? `${recipe.time} min` : '--'}</span>
                  {recipe.servings && <span className="flex items-center gap-1.5"><Users size={13} className="opacity-50" />{recipe.servings} pers.</span>}
                </div>
                <div className="flex items-center gap-2">
                {!isValidated ? (
                  <>
                    <button
                      onClick={() => {
                        const available = filteredRecipes.filter(r => !menu.find(m => m.id === r.id));
                        if (available.length > 0) {
                          const newMenu = [...menu];
                          newMenu[index] = available[Math.floor(Math.random() * available.length)];
                          syncMenuAndCart(newMenu);
                        }
                      }}
                      className="p-3 rounded-xl bg-app-bg text-[var(--color-app-text)]/40 border border-[var(--color-card-border)] hover:text-[var(--color-accent-ocre)] transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => { const n = [...menu]; n.splice(index, 1); syncMenuAndCart(n); }}
                      className="p-3 rounded-xl bg-red-50 text-red-400 border border-transparent hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    {recipe.pdfLink && (
                      <a
                        href={recipe.pdfLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-app-bg text-[var(--color-accent-ocre)] border border-[var(--color-card-border)] font-bold text-xs"
                      >
                        <ExternalLink size={15} /> Recette
                      </a>
                    )}
                    <button
                      onClick={async () => {
                        const newMenu = [...menu];
                        newMenu[index] = { ...newMenu[index], cooked: !newMenu[index].cooked };
                        await updateDoc(doc(db, "households", householdId), { currentMenu: newMenu });
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all shadow-sm ${
                        recipe.cooked ? 'bg-green-500 text-white' : 'bg-[var(--color-accent-ocre)] text-white'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </>
                )}
                </div>
              </div>
            </MotionDiv>
          );
        })}
      </div>

      {/* ── CTA FLOTTANT ── */}
      {!isValidated && menu.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-[60] flex justify-center pointer-events-none">
          <button
            onClick={() => syncMenuAndCart(menu, { redirect: true, markValidated: true })}
            className="btn-primary px-8 h-12 shadow-2xl pointer-events-auto"
          >
            {isValidating
              ? <RefreshCw size={16} className="animate-spin" />
              : <><span>Lancer la semaine</span> <ArrowRight size={16} /></>
            }
          </button>
        </div>
      )}

      {/* ── MODALES ── */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetMenu}
        title="Nouveau menu ?"
        message="Voulez-vous annuler le menu actuel pour en créer un nouveau ? Vos courses déjà effectuées resteront dans le panier."
        confirmText="Nouveau menu"
        variant="primary"
      />
      <ConfirmModal
        isOpen={isRegenModalOpen}
        onClose={() => setIsRegenModalOpen(false)}
        onConfirm={generateMenu}
        title="Tout régénérer ?"
        message="Votre sélection actuelle sera remplacée par de nouvelles recettes basées sur vos filtres."
        confirmText="Régénérer"
        variant="primary"
      />
    </div>
  );
}
