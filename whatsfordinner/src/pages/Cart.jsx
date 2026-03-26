import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { ShoppingBag, Plus, Circle, CheckCircle2, Trash2, List, ChefHat, Store, Tag } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Cart() {
  const [householdRef, setHouseholdRef] = useState(null);
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};
    const setupData = async () => {
      const user = auth.currentUser;
      if (!user) return;
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

  if (loading) return <div className="p-6"><SkeletonLoader type="header" /><SkeletonLoader type="cart-item" /></div>;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-32 animate-fade-in">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-mint"><ShoppingBag size={20} /></div>
          <h1 className="text-2xl font-black text-white font-display tracking-tight">Courses</h1>
        </div>
        <button onClick={() => updateDoc(householdRef, { currentCart: [] })} className="btn-danger p-2 rounded-full w-10 h-10"><Trash2 size={18} /></button>
      </header>

      <div className="flex bg-black/40 p-1.5 rounded-2xl mb-6 border border-white/5">
        <button onClick={() => setViewMode("list")} className={`flex-1 btn-ghost py-2 text-xs border-none ${viewMode === 'list' ? 'bg-white/10 text-white' : ''}`}><List size={16} /> Globale</button>
        <button onClick={() => setViewMode("recipe")} className={`flex-1 btn-ghost py-2 text-xs border-none ${viewMode === 'recipe' ? 'bg-white/10 text-white' : ''}`}><ChefHat size={16} /> Recettes</button>
      </div>

      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        await updateDoc(householdRef, { currentCart: [...cart, { id: Date.now().toString(), name: newItem.trim(), checked: false, type: 'manual' }] });
        setNewItem("");
      }} className="relative mb-8">
        <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Ajouter un extra..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white outline-none focus:border-mint/50 transition-all" />
        <button type="submit" className="absolute right-2 top-2 bottom-2 btn-primary p-0 aspect-square rounded-xl"><Plus size={24} /></button>
      </form>

      {viewMode === "list" ? (
        <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-white/5">
          {cart.map(item => {
            const match = item.name.match(/^(.*)\s\(([\d.]+\s.*)\)$/);
            const name = match ? match[1] : item.name;
            const qty = match ? match[2] : "";
            return (
              <div key={item.id} onClick={() => toggleItem(item.id)} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors ${item.checked ? 'opacity-30' : ''}`}>
                <div className="flex items-center gap-4 truncate">
                  {item.checked ? <CheckCircle2 className="text-mint" size={24} /> : <Circle className="text-white/20" size={24} />}
                  <span className={`text-white font-bold truncate ${item.checked ? 'line-through' : ''}`}>{name}</span>
                </div>
                {qty && <span className="badge text-text-muted text-[10px] ml-4">{formatQuantity(qty)}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {menu.map(recipe => (
            <div key={recipe.id} className="glass-card">
              <h3 className="text-white font-bold text-lg mb-4">{recipe.name}</h3>
              <div className="flex flex-col gap-1">
                {recipe.ingredients?.map((ing, i) => {
                  const cartItem = cart.find(c => c.baseName === ing.name.toLowerCase() && c.type === 'menu');
                  return (
                    <div key={i} onClick={() => toggleItemByBaseName(ing.name.toLowerCase())} className={`flex justify-between items-center p-2 -mx-2 rounded-xl hover:bg-white/5 cursor-pointer ${cartItem?.checked ? 'opacity-30' : ''}`}>
                      <div className="flex items-center gap-3">
                        {cartItem?.checked ? <CheckCircle2 className="text-mint" size={18}/> : <Circle className="text-white/20" size={18}/>}
                        <span className="text-white text-sm font-medium">{ing.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">{formatQuantity(ing.quantity)}</span>
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