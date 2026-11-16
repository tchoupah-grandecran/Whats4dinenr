import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs, setDoc } from "firebase/firestore";
import { Plus, Circle, CheckCircle2, Trash2, List, ChefHat, Store, ChevronDown, ChevronUp, X } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";
import PageHeader from "../components/PageHeader";

export default function Cart() {
  const [householdRef, setHouseholdRef] = useState(null);
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [ingredientsMap, setIngredientsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [newItem, setNewItem] = useState("");
  const [pendingManualItem, setPendingManualItem] = useState("");
  const [selectedRayon, setSelectedRayon] = useState("");
  const [newRayon, setNewRayon] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  // États pour l'animation de sortie
  const [animatingItems, setAnimatingItems] = useState([]); // Items rayés (immédiat)
  const [exitingItems, setExitingItems] = useState([]); // Items en train de glisser/disparaître

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
      } catch (error) { console.error("Erreur dictionnaire:", error); }

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

  const toggleItemWithAnimation = async (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (!item.checked) {
      // 1. PHASE IMMÉDIATE : Griser et rayer
      setAnimatingItems(prev => [...prev, id]);

      // 2. PHASE DISPARITION (après 2 secondes de battement)
      setTimeout(() => {
        setExitingItems(prev => [...prev, id]);
      }, 2000);

      // 3. PHASE FIREBASE (après l'animation de glisse)
      setTimeout(async () => {
        const updated = cart.map(i => i.id === id ? { ...i, checked: true } : i);
        await updateDoc(householdRef, { currentCart: updated });
        
        // Nettoyage
        setAnimatingItems(prev => prev.filter(itemId => itemId !== id));
        setExitingItems(prev => prev.filter(itemId => itemId !== id));
      }, 2600);
    } else {
      // Décocher depuis le panier : instantané
      const updated = cart.map(i => i.id === id ? { ...i, checked: false } : i);
      await updateDoc(householdRef, { currentCart: updated });
    }
  };

  // Performance : on recalcule les rayons uniquement si le panier change
  const pendingItems = useMemo(() => cart.filter(i => !i.checked), [cart]);
  const completedItems = useMemo(() => cart.filter(i => i.checked), [cart]);
  const knownRayons = useMemo(() => [...new Set([
    ...Object.values(ingredientsMap),
    ...cart.map(item => item.rayon).filter(Boolean)
  ])].sort((a, b) => a.localeCompare(b, "fr")), [ingredientsMap, cart]);

  const normalizeName = value => value.trim().toLocaleLowerCase("fr");
  const rayonForItem = item => item.type === "manual"
    ? (item.rayon || "Extras")
    : (ingredientsMap[normalizeName(item.baseName || "")] || "Autres");

  const addManualItem = async (name, rayon) => {
    const normalizedName = normalizeName(name);
    const item = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: name.trim(), baseName: normalizedName, checked: false, type: "manual", rayon };
    await updateDoc(householdRef, { currentCart: [...cart, item] });
    const safeId = normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `manual-${Date.now()}`;
    await setDoc(doc(db, "ingredients_dict", safeId), { name: normalizedName, rayon });
    setIngredientsMap(previous => ({ ...previous, [normalizedName]: rayon }));
    setNewItem("");
    setPendingManualItem("");
    setNewRayon("");
    setSelectedRayon("");
  };

  const sortedRayons = useMemo(() => {
    const grouped = pendingItems.reduce((acc, item) => {
      let rayon = rayonForItem(item);
      if (!acc[rayon]) acc[rayon] = [];
      acc[rayon].push(item);
      return acc;
    }, {});
    return Object.keys(grouped).sort((a, b) => a === "Extras" ? 1 : b === "Extras" ? -1 : a.localeCompare(b));
  }, [pendingItems, ingredientsMap]);

  if (loading) return <div className="p-6"><SkeletonLoader type="header" /><SkeletonLoader type="cart-item" /></div>;

  return (
    <>
      <style>{`
        .item-row-base {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 100px;
          opacity: 1;
        }
        /* État : vient d'être coché */
        .is-animating-checked {
          opacity: 0.4 !important;
        }
        .is-animating-checked .ingredient-name {
          text-decoration: line-through !important;
        }
        /* État : en train de sortir de la liste */
        .is-exiting {
          transform: translateX(40px);
          opacity: 0;
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
          margin: 0;
          border: none;
          pointer-events: none;
          overflow: hidden;
        }
      `}</style>

      <div className="flex flex-col min-h-screen py-24 px-4 pb-40 animate-fade-in">
        
        {/* HEADER */}
        <PageHeader 
  subtitle={`${pendingItems.length} articles restants`}
  title="Courses"
  actionNode={
    <button 
      onClick={() => { if(window.confirm("Vider tout le panier ?")) updateDoc(householdRef, { currentCart: [] }) }} 
      className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors border border-red-500/10 shadow-sm"
    >
      <Trash2 size={20} />
    </button>
  }
/>

        {/* TOGGLE VUE */}
        <div className="flex bg-forest-deepest/5 p-1 rounded-xl mb-6 shadow-inner transition-colors">
          <button onClick={() => setViewMode("list")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-forest-deepest shadow-sm' : 'text-forest-deepest/40'}`}><List size={16} /> Rayons</button>
          <button onClick={() => setViewMode("recipe")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'recipe' ? 'bg-white text-forest-deepest shadow-sm' : 'text-forest-deepest/40'}`}><ChefHat size={16} /> Recettes</button>
        </div>

        {/* AJOUT MANUEL */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          const name = newItem.trim();
          if (!name) return;
          const knownRayon = ingredientsMap[normalizeName(name)];
          if (knownRayon) await addManualItem(name, knownRayon);
          else {
            setPendingManualItem(name);
            setSelectedRayon(knownRayons[0] || "");
          }
        }} className="relative mb-8">
          <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Ajouter un article..." className="w-full bg-forest-deepest/5 border border-forest-deepest/10 rounded-2xl py-4 pl-5 pr-14 text-forest-deepest placeholder-forest-deepest/30 outline-none focus:bg-white transition-all shadow-inner" />
          <button type="submit" className="absolute right-2 top-2 bottom-2 btn-primary p-0 aspect-square rounded-xl"><Plus size={24} /></button>
        </form>

        <div className="flex flex-col gap-8">
          {viewMode === "list" ? (
            sortedRayons.map((rayon) => (
              <div key={rayon} className="flex flex-col gap-3">
                <h3 className="font-display font-black text-forest-deepest/40 uppercase tracking-widest text-[11px] flex items-center gap-2 px-2 transition-opacity">
                  <Store size={14} /> {rayon}
                </h3>
                <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-forest-deepest/5 border-none shadow-sm">
                  {pendingItems.filter(i => rayonForItem(i) === rayon).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => toggleItemWithAnimation(item.id)} 
                      className={`cart-row item-row-base ${animatingItems.includes(item.id) ? 'is-animating-checked' : ''} ${exitingItems.includes(item.id) ? 'is-exiting' : ''}`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {animatingItems.includes(item.id)
                          ? <CheckCircle2 className="text-mint-deep shrink-0 animate-fade-in" size={24} />
                          : <Circle className="text-forest-deepest/20 shrink-0" size={24} />
                        }
                        <span className="ingredient-name text-forest-deepest transition-all">
                          {item.name.split(' (')[0]}
                        </span>
                      </div>
                      {item.name.includes('(') && <span className="badge-qty">{formatQuantity(item.name.split(' (')[1].replace(')', ''))}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* VUE RECETTE */
            <>
            {menu.map(recipe => {
              const recipePending = recipe.ingredients?.filter(ing => pendingItems.some(p => p.type !== "manual" && p.baseName === normalizeName(ing.name)));
              if (!recipePending || recipePending.length === 0) return null;
              return (
                <div key={recipe.id} className="glass-card shadow-sm border-none">
                  <h3 className="text-forest-deepest font-bold text-lg mb-4">{recipe.name}</h3>
                  {recipePending.map((ing, i) => {
                    const cItem = cart.find(c => c.type !== "manual" && c.baseName === normalizeName(ing.name) && !c.checked);
                    return (
                      <div key={i} onClick={() => toggleItemWithAnimation(cItem?.id)} className={`flex justify-between items-center p-2 -mx-2 rounded-xl hover:bg-forest-deepest/5 cursor-pointer ${animatingItems.includes(cItem?.id) ? 'opacity-30 line-through' : ''}`}>
                        <div className="flex items-center gap-3">
                          {animatingItems.includes(cItem?.id) ? <CheckCircle2 className="text-mint-deep" size={18}/> : <Circle className="text-forest-deepest/20" size={18}/>}
                          <span className="text-forest-deepest text-sm font-medium">{ing.name}</span>
                        </div>
                        <span className="badge-qty bg-transparent shadow-none opacity-60">{formatQuantity(ing.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {pendingItems.filter(item => item.type === "manual").length > 0 && (
              <div className="glass-card shadow-sm border-none">
                <h3 className="text-forest-deepest font-bold text-lg mb-4">Hors recettes</h3>
                {pendingItems.filter(item => item.type === "manual").map(item => (
                  <div key={item.id} onClick={() => toggleItemWithAnimation(item.id)} className={`flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-forest-deepest/5 cursor-pointer ${animatingItems.includes(item.id) ? 'opacity-30 line-through' : ''}`}>
                    {animatingItems.includes(item.id) ? <CheckCircle2 className="text-mint-deep" size={18}/> : <Circle className="text-forest-deepest/20" size={18}/>}
                    <span className="text-forest-deepest text-sm font-medium">{item.name.split(' (')[0]}</span>
                  </div>
                ))}
              </div>
            )}
            </>
          )}

          {/* PANIER (DÉJÀ COCHÉS) */}
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
      {pendingManualItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="manual-rayon-title">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div><h2 id="manual-rayon-title" className="text-xl font-black text-forest-deepest">Quel rayon pour cet article ?</h2><p className="text-sm text-forest-deepest/60 mt-1">« {pendingManualItem} » sera classé ici et mémorisé.</p></div>
              <button type="button" onClick={() => setPendingManualItem("")} className="p-2 rounded-xl hover:bg-forest-deepest/5" aria-label="Fermer"><X size={20}/></button>
            </div>
            {knownRayons.length > 0 && <label className="block text-sm font-bold mt-5 mb-2">Rayons connus<select value={selectedRayon} onChange={e => { setSelectedRayon(e.target.value); setNewRayon(""); }} className="w-full mt-2 bg-white border border-forest-deepest/10 rounded-xl p-3 font-medium">{knownRayons.map(rayon => <option key={rayon} value={rayon}>{rayon}</option>)}</select></label>}
            <label className="block text-sm font-bold mt-4 mb-2">Proposer un nouveau rayon<input value={newRayon} onChange={e => setNewRayon(e.target.value)} onFocus={() => setSelectedRayon("")} placeholder="Ex. Épicerie" className="w-full mt-2 bg-white border border-forest-deepest/10 rounded-xl p-3 font-medium outline-none focus:border-mint-deep" /></label>
            <button type="button" disabled={!newRayon.trim() && !selectedRayon} onClick={() => addManualItem(pendingManualItem, newRayon.trim() || selectedRayon)} className="btn-primary w-full py-3 rounded-xl mt-4 disabled:opacity-40">Ajouter au panier</button>
          </div>
        </div>
      )}
    </>
  );
}
