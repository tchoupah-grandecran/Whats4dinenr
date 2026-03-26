import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { ShoppingBag, Plus, Circle, CheckCircle2, Trash2, CheckCheck, List, ChefHat, Store } from "lucide-react";

export default function Cart() {
  const [householdRef, setHouseholdRef] = useState(null);
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [rayonDict, setRayonDict] = useState({});
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  
  // "list" pour la vue par rayons, "recipe" pour la vue par recettes
  const [viewMode, setViewMode] = useState("list"); 

  // 1. Initialisation et écoute TEMPS RÉEL
  useEffect(() => {
    let unsubscribe = () => {};

    const setupData = async () => {
      // 1. Charger le dictionnaire des rayons (si vous l'avez importé)
      try {
        const dictSnap = await getDocs(collection(db, "ingredients_dict"));
        const dict = {};
        dictSnap.forEach(doc => {
          dict[doc.data().name.toLowerCase()] = doc.data().rayon;
        });
        setRayonDict(dict);
      } catch(e) { 
        console.error("Erreur dictionnaire", e); 
      }

      // 2. Charger le caddie en temps réel
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data().householdId) {
        const hId = userSnap.data().householdId;
        const ref = doc(db, "households", hId);
        setHouseholdRef(ref);

        unsubscribe = onSnapshot(ref, (docSnap) => {
          if (docSnap.exists()) {
            setCart(docSnap.data().currentCart || []);
            setMenu(docSnap.data().currentMenu || []);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };

    setupData();
    return () => unsubscribe();
  }, []);

  // 2. Ajouter un article manuellement
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim() || !householdRef) return;

    const newItemObj = {
      id: Date.now().toString(),
      name: newItem.trim(),
      checked: false,
      type: 'manual'
    };

    const updatedCart = [...cart, newItemObj];
    await updateDoc(householdRef, { currentCart: updatedCart });
    setNewItem("");
  };

  // 3. Cocher/Décocher un article par son ID (Vue Liste)
  const toggleItem = async (itemId) => {
    if (!householdRef) return;
    const updatedCart = cart.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    await updateDoc(householdRef, { currentCart: updatedCart });
  };

  // 4. Cocher/Décocher un article par son nom de base (Vue Recette)
  const toggleItemByBaseName = async (baseName) => {
    if (!householdRef) return;
    const itemToToggle = cart.find(i => i.baseName === baseName && i.type === 'menu');
    if (itemToToggle) {
      toggleItem(itemToToggle.id);
    }
  };

  // 5. Terminer les courses
  const clearCart = async () => {
    if (!householdRef) return;
    if (window.confirm("Vider entièrement la liste de courses ?")) {
      await updateDoc(householdRef, { currentCart: [] });
    }
  };

  // Séparation des items pour la logique d'affichage
  const activeItems = cart.filter(i => !i.checked);
  const completedItems = cart.filter(i => i.checked);
  
  const manualActiveItems = cart.filter(i => i.type !== 'menu' && !i.checked);
  const manualCompletedItems = cart.filter(i => i.type !== 'menu' && i.checked);

  // 6. Fonction pour grouper les articles par rayon
  const groupItemsByRayon = (items) => {
    const grouped = {};
    
    items.forEach(item => {
      // On utilise baseName, ou on nettoie le nom (ex: "Tomates (200g)" -> "tomates")
      let searchKey = item.baseName || item.name.split('(')[0].trim().toLowerCase();
      
      // On cherche dans le dictionnaire, sinon on le met dans "Divers"
      const rayon = rayonDict[searchKey] || "Divers";
      
      if (!grouped[rayon]) grouped[rayon] = [];
      grouped[rayon].push(item);
    });

    // On trie alphabétiquement pour un affichage propre
    return Object.keys(grouped).sort().map(rayonName => ({
      rayonName,
      items: grouped[rayonName]
    }));
  };

  const groupedActiveItems = groupItemsByRayon(activeItems);

  if (loading) return <div className="pt-20 text-center text-white">Chargement du caddie...</div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-32 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-mint">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-white tracking-tight">
              Courses
            </h1>
            <p className="font-body text-text-muted text-xs uppercase tracking-widest font-bold mt-1">
              {activeItems.length} article(s) restants
            </p>
          </div>
        </div>
        
        {cart.length > 0 && (
          <button onClick={clearCart} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors" title="Vider la liste">
            <Trash2 size={18} />
          </button>
        )}
      </header>

      {/* TABS (Bascule Vue Liste / Vue Recette) */}
      {cart.length > 0 && (
        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-6 border border-white/5">
          <button 
            onClick={() => setViewMode("list")}
            className={`flex-1 py-2.5 rounded-xl font-display text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white/15 text-white shadow-sm' : 'text-text-muted hover:text-white/70'}`}
          >
            <List size={16} /> Globale
          </button>
          <button 
            onClick={() => setViewMode("recipe")}
            className={`flex-1 py-2.5 rounded-xl font-display text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'recipe' ? 'bg-white/15 text-white shadow-sm' : 'text-text-muted hover:text-white/70'}`}
          >
            <ChefHat size={16} /> Par Recette
          </button>
        </div>
      )}

      {/* FORMULAIRE D'AJOUT MANUEL */}
      <form onSubmit={addItem} className="mb-8 relative">
        <input 
          type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un extra (Pain, Lait...)"
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/50 transition-all font-body"
        />
        <button type="submit" disabled={!newItem.trim()} className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-gradient-to-br from-mint to-mint-deep text-forest-deepest flex items-center justify-center disabled:opacity-50 transition-opacity">
          <Plus size={24} strokeWidth={3} />
        </button>
      </form>

      {/* CONTENU DU CADDIE */}
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center mt-10 text-center px-6">
          <ShoppingBag size={48} className="text-white/10 mb-4" />
          <p className="text-text-secondary font-body text-sm">Votre liste de courses est vide.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ===================== VUE: LISTE GLOBALE (PAR RAYON) ===================== */}
          {viewMode === "list" && (
            <>
              {groupedActiveItems.length > 0 && (
                <div className="flex flex-col gap-6">
                  {groupedActiveItems.map((group) => (
                    <div key={group.rayonName} className="flex flex-col gap-2">
                      
                      <h3 className="font-display font-black text-mint/80 uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
                        <Store size={14} /> {group.rayonName}
                      </h3>
                      
                      <div className="glass-panel rounded-2xl overflow-hidden">
                        {group.items.map((item, index) => (
                          <div 
                            key={item.id} 
                            onClick={() => toggleItem(item.id)} 
                            className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors group ${index !== group.items.length - 1 ? 'border-b border-white/5' : ''}`}
                          >
                            <Circle className="text-white/30 group-hover:text-mint transition-colors shrink-0" size={24} />
                            <span className="font-display font-bold text-white text-[15px] leading-tight flex-1">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {completedItems.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCheck size={14} /> Dans le caddie
                  </h3>
                  <div className="flex flex-col gap-2">
                    {completedItems.map(item => (
                      <div key={item.id} onClick={() => toggleItem(item.id)} className="p-3.5 rounded-2xl flex items-center gap-4 cursor-pointer bg-white/5 border border-white/5 hover:bg-white/10 transition-colors opacity-60">
                        <CheckCircle2 className="text-mint shrink-0" size={20} />
                        <span className="font-display font-bold text-text-secondary text-sm flex-1 line-through decoration-white/20">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===================== VUE: PAR RECETTE ===================== */}
          {viewMode === "recipe" && (
            <div className="flex flex-col gap-8">
              
              {/* Articles ajoutés manuellement (Hors Menu) */}
              {(manualActiveItems.length > 0 || manualCompletedItems.length > 0) && (
                <div className="glass-panel p-5 rounded-3xl border-mint/20">
                  <h3 className="font-display font-black text-mint mb-4 text-lg">Extras & Achats divers</h3>
                  <div className="flex flex-col gap-1">
                    {manualActiveItems.map(item => (
                      <div key={item.id} onClick={() => toggleItem(item.id)} className="flex items-center gap-3 p-2 -mx-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                        <Circle className="text-white/30 shrink-0" size={20} />
                        <span className="font-display font-bold text-white text-sm leading-tight">{item.name}</span>
                      </div>
                    ))}
                    {manualCompletedItems.map(item => (
                      <div key={item.id} onClick={() => toggleItem(item.id)} className="flex items-center gap-3 p-2 -mx-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors opacity-50">
                        <CheckCircle2 className="text-mint shrink-0" size={20} />
                        <span className="font-display font-bold text-text-muted text-sm line-through leading-tight">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingrédients groupés par Recette */}
              {menu.map(recipe => {
                if (!recipe.ingredients || recipe.ingredients.length === 0) return null;
                
                return (
                  <div key={recipe.id} className="glass-panel p-5 rounded-3xl relative overflow-hidden">
                    <h3 className="font-display font-black text-white mb-4 text-lg leading-tight relative z-10">
                      {recipe.name}
                    </h3>
                    
                    <div className="flex flex-col gap-1 relative z-10">
                      {recipe.ingredients.map((ing, idx) => {
                        const baseName = ing.name.trim().toLowerCase();
                        const cartItem = cart.find(c => c.baseName === baseName && c.type === 'menu');
                        const isChecked = cartItem?.checked || false;

                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleItemByBaseName(baseName)} 
                            className={`flex items-start gap-3 p-2 -mx-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${isChecked ? 'opacity-40' : ''}`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? <CheckCircle2 className="text-mint" size={20} /> : <Circle className="text-white/30" size={20} />}
                            </div>
                            <span className={`font-display font-bold text-sm leading-tight ${isChecked ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                              {ing.name} {ing.quantity ? <span className="text-text-secondary opacity-80 font-normal">({ing.quantity})</span> : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>
      )}
    </div>
  );
}