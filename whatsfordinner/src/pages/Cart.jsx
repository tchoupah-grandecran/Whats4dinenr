import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { ShoppingBag, Plus, Circle, CheckCircle2, Trash2, List, ChefHat, Store } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Cart() {
  const [householdRef, setHouseholdRef] = useState(null);
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [ingredientsMap, setIngredientsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [newItem, setNewItem] = useState("");

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
          if (data.name) {
            map[data.name.toLowerCase()] = data.rayon || "Autres";
          }
        });
        setIngredientsMap(map);
      } catch (error) {
        console.error("Erreur chargement rayons:", error);
      }

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

  const toggleItem = async (id) => {
    const updated = cart.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    await updateDoc(householdRef, { currentCart: updated });
  };

  const toggleItemByBaseName = (baseName) => {
    const item = cart.find(c => c.baseName === baseName && c.type === 'menu');
    if (item) toggleItem(item.id);
  };

  const groupedCart = cart.reduce((acc, item) => {
    let rayon = "Autres";
    if (item.type === 'manual') {
      rayon = "Extras (Ajouts manuels)";
    } else if (item.baseName && ingredientsMap[item.baseName]) {
      rayon = ingredientsMap[item.baseName];
    }

    if (!acc[rayon]) acc[rayon] = [];
    acc[rayon].push(item);
    return acc;
  }, {});

  const sortedRayons = Object.keys(groupedCart).sort((a, b) => {
    if (a.includes("Extras")) return 1;
    if (b.includes("Extras")) return -1;
    if (a === "Autres") return 1;
    if (b === "Autres") return -1;
    return a.localeCompare(b);
  });

  if (loading) return <div className="p-6"><SkeletonLoader type="header" /><SkeletonLoader type="cart-item" /></div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-32 animate-fade-in">
      
      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-forest-deepest"><ShoppingBag size={20} /></div>
          <h1 className="text-2xl font-black text-forest-deepest font-display tracking-tight">Courses</h1>
        </div>
        <button onClick={() => updateDoc(householdRef, { currentCart: [] })} className="p-2 rounded-full w-10 h-10 text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"><Trash2 size={18} /></button>
      </header>

      {/* LE NOUVEAU TOGGLE (Segmented Control iOS) */}
      <div className="flex bg-forest-deepest/5 p-1 rounded-xl mb-6">
        <button 
          onClick={() => setViewMode("list")} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            viewMode === 'list' 
              ? 'bg-white text-forest-deepest shadow-sm' 
              : 'text-forest-deepest/50 hover:text-forest-deepest'
          }`}
        >
          <List size={16} /> Globale
        </button>
        <button 
          onClick={() => setViewMode("recipe")} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            viewMode === 'recipe' 
              ? 'bg-white text-forest-deepest shadow-sm' 
              : 'text-forest-deepest/50 hover:text-forest-deepest'
          }`}
        >
          <ChefHat size={16} /> Recettes
        </button>
      </div>

      {/* AJOUT MANUEL (Adapté au nouveau thème) */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        await updateDoc(householdRef, { currentCart: [...cart, { id: Date.now().toString(), name: newItem.trim(), checked: false, type: 'manual' }] });
        setNewItem("");
      }} className="relative mb-8">
        <input 
          type="text" 
          value={newItem} 
          onChange={e => setNewItem(e.target.value)} 
          placeholder="Ajouter un extra..." 
          /* Nouvelles classes pour l'input : Fond subtil, texte sombre, focus blanc */
          className="w-full bg-forest-deepest/5 border border-forest-deepest/10 rounded-2xl py-4 pl-5 pr-14 text-forest-deepest placeholder-forest-deepest/40 outline-none focus:bg-white focus:border-forest-deepest/20 transition-all shadow-inner" 
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 btn-primary p-0 aspect-square rounded-xl"><Plus size={24} /></button>
      </form>

      {/* VUE LISTE (Regroupée par rayons) */}
      {viewMode === "list" ? (
        <div className="flex flex-col gap-6">
          {sortedRayons.length === 0 && (
            <p className="text-center text-forest-deepest/50 text-sm mt-10">Votre liste de courses est vide.</p>
          )}
          
          {sortedRayons.map((rayonName) => (
            <div key={rayonName} className="flex flex-col gap-3">
              {/* Titre du rayon en vert forêt doux */}
              <h3 className="font-display font-black text-forest-deepest/50 uppercase tracking-widest text-[11px] flex items-center gap-2 px-2">
                <Store size={14} /> {rayonName}
              </h3>
              
              <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-forest-deepest/5">
                {groupedCart[rayonName].map(item => {
                  const match = item.name.match(/^(.*)\s\(([\d.]+\s.*)\)$/);
                  const name = match ? match[1] : item.name;
                  const qty = match ? match[2] : "";
                  
                  return (
                    <div key={item.id} onClick={() => toggleItem(item.id)} className={`cart-row ${item.checked ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Checkbox dynamique */}
                        {item.checked ? <CheckCircle2 className="text-mint-deep shrink-0" size={24} /> : <Circle className="text-forest-deepest/20 shrink-0" size={24} />}
                        <span className={`ingredient-name text-forest-deepest ${item.checked ? 'line-through' : ''}`}>{name}</span>
                      </div>
                      {qty && <span className="badge-qty">{formatQuantity(qty)}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VUE RECETTES */
        <div className="flex flex-col gap-6">
          {menu.map(recipe => (
            <div key={recipe.id} className="glass-card">
              <h3 className="text-forest-deepest font-bold text-lg mb-4">{recipe.name}</h3>
              <div className="flex flex-col gap-1">
                {recipe.ingredients?.map((ing, i) => {
                  const cartItem = cart.find(c => c.baseName === ing.name.toLowerCase() && c.type === 'menu');
                  return (
                    <div key={i} onClick={() => toggleItemByBaseName(ing.name.toLowerCase())} className={`flex justify-between items-center p-2 -mx-2 rounded-xl hover:bg-forest-deepest/5 cursor-pointer transition-colors ${cartItem?.checked ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-3">
                        {cartItem?.checked ? <CheckCircle2 className="text-mint-deep shrink-0" size={18}/> : <Circle className="text-forest-deepest/20 shrink-0" size={18}/>}
                        <span className={`text-forest-deepest text-sm font-medium ${cartItem?.checked ? 'line-through' : ''}`}>{ing.name}</span>
                      </div>
                      <span className="badge-qty bg-transparent shadow-none opacity-70">{formatQuantity(ing.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}