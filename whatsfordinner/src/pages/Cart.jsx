import React, { useEffect, useState, useMemo, useRef } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs, setDoc } from "firebase/firestore";
import { ShoppingBag, Plus, Circle, CheckCircle2, Trash2, List, ChefHat, Store, ChevronDown, ChevronUp, X, Tag, AlertCircle } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";
import ConfirmModal from "../components/ConfirmModal";

const getItemAisle = (item, ingredientsMap) => {
  if (item.type === "manual") return item.rayon || "Extras";
  return ingredientsMap[item.baseName] || "Autres";
};

// ─────────────────────────────────────────────────────────────
// Modal : assign an aisle to an unknown ingredient
// ─────────────────────────────────────────────────────────────
function AisleModal({ ingredientName, existingAisles, onConfirm, onDismiss }) {
  const [selected, setSelected] = useState("");
  const [newAisle, setNewAisle] = useState("");
  const [mode, setMode] = useState("pick"); // "pick" | "create"
  const inputRef = useRef(null);

  useEffect(() => {
    if (mode === "create") inputRef.current?.focus();
  }, [mode]);

  const handleConfirm = () => {
    const aisle = mode === "create" ? newAisle.trim() : selected;
    if (!aisle) return;
    onConfirm(aisle);
  };

  const canConfirm = mode === "create" ? newAisle.trim().length > 0 : selected.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-33">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onDismiss}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-[var(--color-card-bg)] rounded-[2.5rem] p-8 shadow-2xl border border-[var(--color-card-border)] animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-[var(--color-accent-ocre)]" strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-app-text)]/40">
                Rayon inconnu
              </span>
            </div>
            <h3 className="font-display text-xl text-[var(--color-app-text)] leading-tight">
              Où ranger{" "}
              <span className="text-[var(--color-accent-ocre)]">«&nbsp;{ingredientName}&nbsp;»</span>&nbsp;?
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="w-10 h-10 rounded-2xl bg-[var(--color-app-text)]/5 flex items-center justify-center text-[var(--color-app-text)]/40 hover:text-[var(--color-app-text)] transition-colors shrink-0 ml-4"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-[var(--color-app-text)]/5 p-1.5 rounded-[2rem] border border-[var(--color-card-border)] shadow-inner mb-6">
          <button
            onClick={() => setMode("pick")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.4rem] transition-all ${
              mode === "pick"
                ? "bg-white dark:bg-white/10 text-[var(--color-accent-ocre)] shadow-md"
                : "text-[#A0A0A0] dark:text-[#505050]"
            }`}
          >
            <Store size={14} strokeWidth={3} /> Existant
          </button>
          <button
            onClick={() => setMode("create")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.4rem] transition-all ${
              mode === "create"
                ? "bg-white dark:bg-white/10 text-[var(--color-accent-ocre)] shadow-md"
                : "text-[#A0A0A0] dark:text-[#505050]"
            }`}
          >
            <Tag size={14} strokeWidth={3} /> Nouveau
          </button>
        </div>

        {/* Content */}
        {mode === "pick" ? (
          <div className="flex flex-wrap gap-2 mb-8 max-h-48 overflow-y-auto">
            {existingAisles.length === 0 ? (
              <p className="text-[var(--color-app-text)]/40 text-xs italic">
                Aucun rayon disponible — créez-en un !
              </p>
            ) : (
              existingAisles.map((aisle) => (
                <button
                  key={aisle}
                  onClick={() => setSelected(aisle)}
                  className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${
                    selected === aisle
                      ? "bg-[var(--color-accent-ocre)] text-white border-[var(--color-accent-ocre)]"
                      : "bg-[var(--color-app-text)]/5 text-[var(--color-app-text)] border-[var(--color-card-border)] hover:bg-[var(--color-app-text)]/10"
                  }`}
                >
                  {aisle}
                </button>
              ))
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={newAisle}
            onChange={(e) => setNewAisle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canConfirm && handleConfirm()}
            placeholder="Ex: Épices, Surgelés…"
            className="w-full bg-[var(--color-app-text)]/5 border border-[var(--color-card-border)] rounded-[2rem] py-5 px-6 text-xs text-[var(--color-app-text)] outline-none focus:ring-4 focus:ring-[var(--color-accent-ocre)]/5 transition-all shadow-inner mb-8"
          />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-5 rounded-[2rem] bg-[var(--color-app-text)]/5 text-[var(--color-app-text)]/60 text-[10px] font-black uppercase tracking-[0.2em] border border-[var(--color-card-border)] active:scale-95 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-5 rounded-[2rem] bg-[var(--color-accent-ocre)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Cart page
// ─────────────────────────────────────────────────────────────
export default function Cart() {
  const [householdRef, setHouseholdRef] = useState(null);
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [ingredientsMap, setIngredientsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [newItem, setNewItem] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const [animatingItems, setAnimatingItems] = useState([]);
  const [exitingItems, setExitingItems] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Aisle modal state
  const [pendingItem, setPendingItem] = useState(null);
  // Stable ref so async callbacks always read latest cart
  const cartRef = useRef(cart);
  const manualItemSequence = useRef(0);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

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
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur setup Cart:", error);
        setLoading(false);
      }
    };
    setupData();
    return () => unsubscribe();
  }, []);

  // ── Derived aisle list ──────────────────────────────────────
  const existingAisles = useMemo(() => {
    const aisles = new Set(Object.values(ingredientsMap));
    return [...aisles].sort((a, b) => a.localeCompare(b, "fr"));
  }, [ingredientsMap]);

  // ── Helpers ─────────────────────────────────────────────────
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

  // ── Add manual item ─────────────────────────────────────────
  const handleAddItem = async (e) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name || !householdRef) return;

    const baseName = name.toLowerCase();
    const knownRayon = ingredientsMap[baseName];
    const existingIds = new Set(cartRef.current.map(item => item.id));
    let itemId;
    do {
      manualItemSequence.current += 1;
      itemId = `manual_${manualItemSequence.current}`;
    } while (existingIds.has(itemId));

    const newCartItem = {
      id: itemId,
      name,
      baseName,
      checked: false,
      type: 'manual',
      rayon: knownRayon || null,
    };

    setNewItem("");

    if (!knownRayon) {
      setPendingItem(newCartItem);
    } else {
      await updateDoc(householdRef, { currentCart: [...cartRef.current, newCartItem] });
    }
  };

  // Called when user picks/creates an aisle in the modal
  const handleAisleConfirmed = async (aisle) => {
    if (!pendingItem || !householdRef) return;

    const itemWithAisle = { ...pendingItem, rayon: aisle };

    const safeId = pendingItem.baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `manual-${pendingItem.id}`;
    const dictRef = doc(db, "ingredients_dict", safeId);
    await setDoc(dictRef, { name: pendingItem.baseName, rayon: aisle }, { merge: true });
    await updateDoc(householdRef, { currentCart: [...cartRef.current, itemWithAisle] });

    setIngredientsMap(prev => ({ ...prev, [pendingItem.baseName]: aisle }));
    setPendingItem(null);
  };

  const handleAisleDismissed = () => {
    if (pendingItem) setNewItem(pendingItem.name);
    setPendingItem(null);
  };

  // ── Toggle with animation ───────────────────────────────────
  const toggleItemWithAnimation = async (id) => {
    const item = cartRef.current.find(i => i.id === id);
    if (!item || !householdRef) return;

    if (!item.checked) {
      setAnimatingItems(prev => [...prev, id]);
      setTimeout(() => setExitingItems(prev => [...prev, id]), 1500);

      setTimeout(async () => {
        const updated = cartRef.current.map(i => i.id === id ? { ...i, checked: true } : i);
        await updateDoc(householdRef, { currentCart: updated });
        setAnimatingItems(prev => prev.filter(itemId => itemId !== id));
        setExitingItems(prev => prev.filter(itemId => itemId !== id));
      }, 2000);
    } else {
      const updated = cartRef.current.map(i => i.id === id ? { ...i, checked: false } : i);
      await updateDoc(householdRef, { currentCart: updated });
    }
  };

  const handleClearCart = async () => {
    if (householdRef) {
      await updateDoc(householdRef, { currentCart: [] });
      setIsClearModalOpen(false);
    }
  };

  // ── Derived lists ────────────────────────────────────────────
  const pendingItems = useMemo(() => cart.filter(i => !i.checked), [cart]);
  const completedItems = useMemo(() => cart.filter(i => i.checked), [cart]);
  const manualPendingItems = useMemo(
    () => pendingItems.filter(item => item.type === "manual"),
    [pendingItems]
  );

  const sortedRayons = useMemo(() => {
    const grouped = pendingItems.reduce((acc, item) => {
      const rayon = getItemAisle(item, ingredientsMap);
      if (!acc[rayon]) acc[rayon] = [];
      acc[rayon].push(item);
      return acc;
    }, {});
    return Object.keys(grouped).sort((a, b) =>
      a === "Extras" ? 1 : b === "Extras" ? -1 : a.localeCompare(b)
    );
  }, [pendingItems, ingredientsMap]);

  // ── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pt-12 px-6 md:px-12 space-y-8 w-full bg-app-bg min-h-screen">
        <SkeletonLoader type="header" />
        <SkeletonLoader type="cart-item" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-4 px-4 md:px-8 pb-48 animate-fade-in bg-app-bg w-full">
      <style>{`
        .item-row-base { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); max-height: 120px; opacity: 1; }
        .is-animating-checked { opacity: 0.4 !important; }
        .is-animating-checked .ingredient-name { text-decoration: line-through !important; }
        .is-exiting { transform: translateX(30px); opacity: 0; max-height: 0; padding: 0; margin: 0; overflow: hidden; }
      `}</style>

      {/* Aisle assignment modal */}
      {pendingItem && (
        <AisleModal
          ingredientName={pendingItem.name}
          existingAisles={existingAisles}
          onConfirm={handleAisleConfirmed}
          onDismiss={handleAisleDismissed}
        />
      )}

      {/* HEADER */}
      <header className="mb-6 flex flex-col gap-4 pt-2">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-accent-ocre)]/10 text-[var(--color-accent-ocre)] text-[10px] font-black uppercase tracking-widest">
                {pendingItems.length} articles restants
              </span>
            </div>
            {/* h1 géré par CSS global (clamp 28–40px) */}
            <h1 className="text-[var(--color-app-text)] leading-none">
              Le Panier
            </h1>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-red-400 shadow-sm active:scale-95 transition-all"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="flex bg-[var(--color-app-text)]/5 p-1.5 rounded-[2rem] border border-[var(--color-card-border)] shadow-inner w-full lg:max-w-md">
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.4rem] transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-[var(--color-accent-ocre)] shadow-md' : 'text-[#A0A0A0] dark:text-[#505050]'}`}
          >
            <List size={14} strokeWidth={3} /> Rayons
          </button>

          <button
            onClick={() => setViewMode("recipe")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.4rem] transition-all ${
              viewMode === 'recipe'
                ? 'bg-white dark:bg-white/10 text-[var(--color-accent-ocre)] shadow-md'
                : 'text-[#A0A0A0] dark:text-[#505050]'
            }`}
          >
            <ChefHat size={14} strokeWidth={3} /> Recettes
          </button>
        </div>
      </header>

      {/* INPUT AJOUT */}
      <form onSubmit={handleAddItem} className="relative mb-8 group max-w-4xl">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Un ajout ?"
          className="w-full bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-[2.5rem] py-5 px-7 text-xs text-[var(--color-app-text)] outline-none focus:ring-4 focus:ring-[var(--color-accent-ocre)]/5 transition-all shadow-sm"
        />
        <button type="submit" className="absolute right-3 top-2.5 bottom-2.5 bg-[var(--color-accent-ocre)] text-white px-3 rounded-[2rem] flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <Plus size={22} strokeWidth={3} />
        </button>
      </form>

      {/* LISTES */}
      <div className={`grid gap-8 ${viewMode === "list" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"}`}>
        {viewMode === "list" ? (
          sortedRayons.map((rayon) => (
            <div key={rayon} className="space-y-2 animate-fade-in h-fit">
              <h3 className="font-display font-bold text-[var(--color-app-text)]/40 text-base flex items-center gap-2.5 px-2">
                <Store size={13} strokeWidth={3} className="text-[var(--color-accent-ocre)]" /> {rayon}
              </h3>
              <div className="bg-white dark:bg-[var(--color-card-bg)] rounded-[1.5rem] overflow-hidden border border-[var(--color-card-border)] shadow-sm divide-y divide-[var(--color-card-border)]">
                {pendingItems.filter(i => getItemAisle(i, ingredientsMap) === rayon).map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemWithAnimation(item.id)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer item-row-base hover:bg-gray-50/50 dark:hover:bg-white/5 ${animatingItems.includes(item.id) ? 'is-animating-checked' : ''} ${exitingItems.includes(item.id) ? 'is-exiting' : ''}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {animatingItems.includes(item.id)
                        ? <CheckCircle2 className="text-[var(--color-accent-ocre)]" size={20} strokeWidth={2.5} />
                        : <Circle className="text-[var(--color-app-text)]/10" size={20} strokeWidth={2.5} />
                      }
                      <span className="ingredient-name text-[var(--color-app-text)] text-xs tracking-tight truncate">
                        {item.name.split(' (')[0]}
                      </span>
                    </div>
                    {item.name.includes('(') && (
                      <span className="bg-[var(--color-accent-ocre)]/5 px-3 py-1 rounded-full text-xs font-black text-[var(--color-accent-ocre)] ml-3">
                        {formatQuantity(item.name.split(' (')[1].replace(')', ''))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <>
            {menu.map(recipe => {
              const recipePending = recipe.ingredients?.filter(ing => pendingItems.some(p => p.type !== "manual" && p.baseName === ing.name.toLowerCase()));
              if (!recipePending || recipePending.length === 0) return null;
              return (
                <div key={recipe.id} className="bg-white dark:bg-[var(--color-card-bg)] p-6 rounded-[2rem] border border-[var(--color-card-border)] shadow-sm animate-fade-in h-fit">
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="w-1 h-5 bg-[var(--color-accent-ocre)] rounded-full"/>
                    <h3 className="text-[var(--color-app-text)] font-display text-lg tracking-tight">{recipe.name}</h3>
                  </div>
                  <div className="space-y-1">
                    {recipePending.map((ing, i) => {
                      const cItem = cart.find(c => c.type !== "manual" && !c.checked && c.baseName === ing.name.toLowerCase());
                      return (
                        <div key={i} onClick={() => cItem && toggleItemWithAnimation(cItem.id)} className={`flex justify-between items-center p-3 -mx-2 rounded-xl hover:bg-gray-50/50 dark:hover:bg-white/5 cursor-pointer transition-all ${animatingItems.includes(cItem?.id) ? 'opacity-30 line-through' : ''}`}>
                          <div className="flex items-center gap-4">
                            {animatingItems.includes(cItem?.id) ? <CheckCircle2 className="text-[var(--color-accent-ocre)]" size={18} /> : <Circle className="text-[var(--color-app-text)]/10" size={18} />}
                            <span className="text-[var(--color-app-text)]/80 text-xs">{ing.name}</span>
                          </div>
                          <span className="text-[var(--color-app-text)]/30 text-[10px] font-black uppercase tracking-widest">{formatQuantity(ing.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {manualPendingItems.length > 0 && (
              <div className="bg-white dark:bg-[var(--color-card-bg)] p-6 rounded-[2rem] border border-[var(--color-card-border)] shadow-sm animate-fade-in h-fit">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-1 h-5 bg-[var(--color-accent-ocre)] rounded-full" />
                  <h3 className="text-[var(--color-app-text)] font-display text-lg tracking-tight">Hors recettes</h3>
                </div>
                <div className="space-y-1">
                  {manualPendingItems.map(item => (
                    <div key={item.id} onClick={() => toggleItemWithAnimation(item.id)} className={`flex items-center gap-4 p-3 -mx-2 rounded-xl hover:bg-gray-50/50 dark:hover:bg-white/5 cursor-pointer transition-all ${animatingItems.includes(item.id) ? 'opacity-30 line-through' : ''}`}>
                      {animatingItems.includes(item.id) ? <CheckCircle2 className="text-[var(--color-accent-ocre)]" size={18} /> : <Circle className="text-[var(--color-app-text)]/10" size={18} />}
                      <span className="text-[var(--color-app-text)]/80 text-xs">{item.name.split(" (")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION DÉJÀ PRIS */}
      {completedItems.length > 0 && (
        <div className="mt-16 pt-6 border-t border-[var(--color-card-border)]">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between w-full max-w-4xl px-6 py-4 bg-[var(--color-app-text)]/5 rounded-2xl text-[var(--color-app-text)]/30 hover:text-[var(--color-app-text)]/50 transition-all border border-transparent hover:border-[var(--color-card-border)]"
          >
            <span className="font-black uppercase tracking-[0.2em] text-[11px]">Déjà acheté ({completedItems.length})</span>
            {showCompleted ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
          </button>

          {showCompleted && (
            <div className={`mt-6 grid gap-3 max-w-6xl ${completedItems.length > 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {completedItems.map(item => (
                <div key={item.id} onClick={() => toggleItemWithAnimation(item.id)} className="bg-white dark:bg-[var(--color-card-bg)]/40 flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-card-border)] opacity-60 cursor-pointer">
                  <CheckCircle2 className="text-[var(--color-accent-ocre)] shrink-0" size={20} strokeWidth={2.5} />
                  <span className="text-[var(--color-app-text)] line-through font-medium text-xs truncate italic">{item.name.split(' (')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMATION */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearCart}
        title="Vider le panier ?"
        message="Cette action supprimera tous les articles de votre liste de courses actuelle. Vous ne pourrez pas revenir en arrière."
        confirmText="Vider tout"
        variant="danger"
      />
    </div>
  );
}
