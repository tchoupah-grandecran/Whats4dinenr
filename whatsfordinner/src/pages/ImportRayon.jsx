import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Store, CheckCircle, Loader2 } from "lucide-react";

export default function ImportRayons() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setStatus("Enregistrement du dictionnaire des rayons...");

    try {
      const rows = text.split("\n").filter(row => row.trim() !== "");
      let count = 0;

      for (let i = 0; i < rows.length; i++) {
        const cols = rows[i].split("\t");
        
        // On suppose que la colonne 1 est l'ingrédient, et la 2 est le rayon
        const ingredient = cols[0]?.trim().toLowerCase();
        const rayon = cols[1]?.trim() || "Divers";

        if (ingredient && ingredient !== "ingrédient" && ingredient !== "nom") {
          // On utilise le nom de l'ingrédient comme ID du document pour le retrouver instantanément plus tard
          // On remplace les espaces et slash par des tirets pour avoir un ID Firebase valide
          const safeId = ingredient.replace(/[^a-z0-9éèêàùç]/g, '-');
          
          await setDoc(doc(db, "ingredients_dict", safeId), {
            name: ingredient,
            rayon: rayon
          });
          count++;
        }
      }

      setStatus(`Succès ! ${count} ingrédients ont été classés dans leurs rayons. 🛒`);
      setText("");
    } catch (error) {
      console.error(error);
      setStatus("Erreur lors de l'importation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen py-10 px-6 animate-in fade-in max-w-lg mx-auto">
      <header className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-mint mb-4">
          <Store size={32} />
        </div>
        <h1 className="font-display text-3xl font-black text-white">Import Rayons</h1>
      </header>

      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
        <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">
          Ordre requis : Ingrédient | Rayon
        </label>
        <textarea 
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Collez ici vos 2 colonnes copiées depuis Google Sheets..."
          className="w-full h-64 bg-black/20 border border-white/10 rounded-2xl p-4 text-white font-body text-sm focus:outline-none focus:border-mint/50"
        />
        <button 
          onClick={handleImport} disabled={isProcessing || !text.trim()}
          className="w-full py-4 rounded-xl font-display font-black text-forest-deepest bg-gradient-to-r from-mint to-mint-deep flex justify-center items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          {isProcessing ? "Importation..." : "Lancer l'importation"}
        </button>
        {status && <div className="mt-4 p-4 rounded-xl bg-white/5 text-center text-sm text-mint">{status}</div>}
      </div>
    </div>
  );
}