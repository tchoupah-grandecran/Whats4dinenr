import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { ShoppingBag, Plus, Circle, CheckCircle2, Trash2, List, ChefHat, Store, ChevronDown, ChevronUp } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Cart() {
  const [householdRef, setHouseholdRef] = useState(null);
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [ingredientsMap, setIngredientsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [newItem, setNewItem] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [animatingItems, setAnimatingItems] = useState([]); // Nouveau : pour suivre les items en cours d'animation

  useEffect(() => {
    let unsubscribe = () => {};
    const setupData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const ingSnap = await getDocs(collection(db, "ingredients_dict"));
        const map = {};
        ingSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.name) map[data.name.toLowerCase()] = data.rayon || "Autres";
        });
        setIngredientsMap(map);
      } catch (error) { console.error(error); }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data().householdId) {
        const ref = doc(db, "households", userSnap.data().householdId);
        setHouseholdRef(ref);
        unsubscribe = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            setCart(snap.data().currentCart || []);
            setMenu(snap.data().currentMenu || []);
          }
          setLoading(false);
        });
      }
    };
    setupData();
    return () => unsubscribe();
  }, []);

  const formatQuantity = (qty) => {
    if (!qty) return "";
    const match = String(qty).trim().match(/^([\d.]+)\s*(.*)$/);
    if (!match) return qty;
    const val = parseFloat(match[1]);
    let unit = match[2] || "pc";
    const invariables = ['g', 'kg', 'cl', 'ml', 'l', 'cas', 'cac'];
    if (val > 1 && unit && !invariables.includes(unit.toLowerCase()) && !unit.endsWith('s')) unit += "s";
    return `${val} ${unit}`.trim();
  };

  // NOUVELLE LOGIQUE DE TOGGLE AVEC ANIMATION
  const toggleItemWithAnimation = async (id) => {
    const item = cart.find(i => i.id === id);
    const isChecking = !item.checked;

    if (isChecking) {
      // 1. Marquer l'item comme "en cours d'animation"
      setAnimatingItems(prev => [...prev, id]);

      // 2. Lancer la mise à jour Firebase après un délai de 3.5 secondes (3s d'attente + 0.5s d'animation)
      setTimeout(async () => {
        const updated = cart.map(i => i.id === id ? { ...i, checked: true } : i);
        await updateDoc(householdRef, { currentCart: updated });
        // Retirer de la liste d'animation après la mise à jour
        setAnimatingItems(prev => prev.filter(itemId => itemId !== id));
      }, 3500);
    } else {
      // Si on décoche depuis le panier, pas d'animation de disparition, on met à jour directement
      const updated = cart.map(i => i.id === id ? { ...i, checked: false } : i);
      await updateDoc(householdRef, { currentCart: updated });
    }
  };

  // LOGIQUE DE FILTRAGE (On n'affiche pas les items en cours d'animation)
  const pendingItems = cart.filter(i => !i.checked && !animatingItems.includes(i.id));
  const completedItems = cart.filter(i => i.checked);

  // Groupement des articles EN ATTENTE par rayon
  const groupedPending = pendingItems.reduce((acc, item) => {
    let rayon = item.type === 'manual' ? "Extras" : (ingredientsMap[item.baseName] || "Autres");
    if (!acc[rayon]) acc[rayon] = [];
    acc[rayon].push(item);
    return acc;
  }, {});

  const sortedRayons = Object.keys(groupedPending).sort((a, b) => {
    if (a === "Extras") return 1;
    if (b === "Extras") return -1;
    return a.localeCompare(b);
  });

  if (loading) return <div className="p-6"><SkeletonLoader type="header" /><SkeletonLoader type="cart-item" /></div>;

  return (
    <>
      {/* INJECTION DES KEYFRAMES CSS POUR L'ANIMATION */}
      <style>{`
        @keyframes itemSlideOut {
          0% { transform: translateX(0); opacity: 1; max-height: 80px; padding: 1rem; margin-top: 0; }
          10% { transform: translateX(0); opacity: 0.4; } /* Rayer/Griser */
          90% { transform: translateX(30px); opacity: 0; max-height: 80px; padding: 1rem; margin-top: 0; } /* Glisser */
          100% { transform: translateX(30px); opacity: 0; max-height: 0; padding: 0; margin-top: -1px; } /* Resize */
        }
        .animate-item-exit {
          animation: itemSlideOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 3s; /* L'attente de 3 secondes */
          pointer-events: none; /* Désactiver les clics pendant l'animation */
          overflow: hidden; /* Crucial pour le resize */
        }
        /* Style immédiat dès le clic pour barrer et griser */
        .is-animating {
          opacity: 0.4 !important;
          transition: opacity 0.2s ease;
        }
        .is-animating .ingredient-name {
          text-decoration: line-through;
        }
      `}</style>

      <div className="flex flex-col min-h-screen py-6 px-4 pb-40 animate-fade-in">
        
        {/* HEADER */}
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-forest-deepest shadow-sm"><ShoppingBag size={20} /></div>
            <h1 className="text-2xl font-black text-forest-deepest font-display tracking-tight">Courses</h1>
          </div>
          <button onClick={() => { if(window.confirm("Vider tout le panier ?")) updateDoc(householdRef, { currentCart: [] }) }} className="p-2 rounded-full w-10 h-10 text-red-400 hover:bg-red-50 transition-colors flex items-center justify-center"><Trash2 size={18} /></button>
        </header>

        {/* TOGGLE VUE */}
        <div className="flex bg-forest-deepest/5 p-1 rounded-xl mb-6 shadow-inner transition-colors">
          <button onClick={() => setViewMode("list")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-forest-deepest shadow-sm' : 'text-forest-deepest/40'}`}><List size={16} /> Rayons</button>
          <button onClick={() => setViewMode("recipe")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'recipe' ? 'bg-white text-forest-deepest shadow-sm' : 'text-forest-deepest/40'}`}><ChefHat size={16} /> Recettes</button>
        </div>

        {/* AJOUT MANUEL */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newItem.trim()) return;
          await updateDoc(householdRef, { currentCart: [...cart, { id: Date.now().toString(), name: newItem.trim(), baseName: newItem.trim().toLowerCase(), checked: false, type: 'manual' }] });
          setNewItem("");
        }} className="relative mb-8">
          <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Ajouter un article..." className="w-full bg-forest-deepest/5 border border-forest-deepest/10 rounded-2xl py-4 pl-5 pr-14 text-forest-deepest placeholder-forest-deepest/30 outline-none focus:bg-white transition-all shadow-inner" />
          <button type="submit" className="absolute right-2 top-2 bottom-2 btn-primary p-0 aspect-square rounded-xl"><Plus size={24} /></button>
        </form>

        {/* CONTENU PRINCIPAL */}
        <div className="flex flex-col gap-8 transition-all duration-500">
          
          {/* ARTICLES À ACHETER (Avec animation) */}
          {viewMode === "list" ? (
            sortedRayons.length > 0 ? (
              sortedRayons.map((rayon) => (
                <div key={rayon} className="flex flex-col gap-3">
                  <h3 className="font-display font-black text-forest-deepest/40 uppercase tracking-widest text-[11px] flex items-center gap-2 px-2 transition-opacity duration-300">
                    <Store size={14} /> {rayon}
                  </h3>
                  <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-forest-deepest/5 shadow-sm border-none transition-all duration-300">
                    {/* On inclut temporairement les items en cours d'animation dans le rendu de la liste principale */}
                    {[...groupedPending[rayon], ...cart.filter(i => animatingItems.includes(i.id) && (i.type === 'manual' ? "Extras" : (ingredientsMap[i.baseName] || "Autres")) === rayon)].map(item => {
                      const isAnimating = animatingItems.includes(item.id);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItemWithAnimation(item.id)} 
                          // Application des classes d'animation
                          className={`cart-row bg-transparent ${isAnimating ? 'animate-item-exit is-animating' : ''}`}
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {isAnimating 
                              ? <CheckCircle2 className="text-mint-deep shrink-0" size={24} />
                              : <Circle className="text-forest-deepest/20 shrink-0" size={24} />
                            }
                            <span className="ingredient-name text-forest-deepest transition-all duration-200">
                              {item.name.split(' (')[0]}
                            </span>
                          </div>
                          {item.name.includes('(') && <span className="badge-qty transition-opacity duration-200">{formatQuantity(item.name.split(' (')[1].replace(')', ''))}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : completedItems.length === 0 && (
              <p className="text-center text-forest-deepest/30 text-sm mt-10">Liste vide !</p>
            )
          ) : (
            /* VUE RECETTE (Items non cochés uniquement, l'animation de disparition est gérée par le filtrage) */
            menu.map(recipe => {
              const recipePending = recipe.ingredients?.filter(ing => pendingItems.some(p => p.baseName === ing.name.toLowerCase()));
              if (!recipePending || recipePending.length === 0) return null;
              return (
                <div key={recipe.id} className="glass-card shadow-sm border-none transition-all duration-300">
                  <h3 className="text-forest-deepest font-bold text-lg mb-4">{recipe.name}</h3>
                  {recipePending.map((ing, i) => (
                    <div key={i} onClick={() => toggleItemWithAnimation(cart.find(c => c.baseName === ing.name.toLowerCase())?.id)} className="flex justify-between items-center p-2 -mx-2 rounded-xl hover:bg-forest-deepest/5 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Circle className="text-forest-deepest/20 shrink-0" size={18}/>
                        <span className="text-forest-deepest text-sm font-medium">{ing.name}</span>
                      </div>
                      <span className="badge-qty bg-transparent shadow-none opacity-60">{formatQuantity(ing.quantity)}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}

          {/* SECTION PANIER (Articles cochés) */}
          {completedItems.length > 0 && (
            <div className="mt-4 border-t border-forest-deepest/10 pt-6 animate-fade-in">
              <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center justify-between w-full px-2 mb-4 text-forest-deepest/40 hover:text-forest-deepest transition-colors"
              >
                <span className="font-display font-black uppercase tracking-widest text-[11px]">Déjà dans le panier ({completedItems.length})</span>
                {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showCompleted && (
                <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-forest-deepest/5 opacity-60">
                  {completedItems.map(item => (
                    <div key={item.id} onClick={() => toggleItemWithAnimation(item.id)} className="cart-row">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <CheckCircle2 className="text-mint-deep shrink-0" size={24} />
                        <span className="ingredient-name text-forest-deepest line-through">{item.name.split(' (')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}