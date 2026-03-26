import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { DatabaseBackup, CheckCircle, Loader2 } from "lucide-react";

export default function Import() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setStatus("Nettoyage de la base de données...");

    try {
      // 1. Suppression des anciennes recettes
      const recipesSnap = await getDocs(collection(db, "recipes"));
      const deletePromises = recipesSnap.docs.map(recipeDoc => 
        deleteDoc(doc(db, "recipes", recipeDoc.id))
      );
      await Promise.all(deletePromises);

      setStatus("Importation de la nouvelle nomenclature...");

      const rows = text.split("\n").filter(row => row.trim() !== "");
      const headers = rows[0].split("\t").map(h => h.toLowerCase().trim());
      
      // Repérage des colonnes pivots
      const pdfIndex = headers.findIndex(h => h.includes('pdf'));
      const timeIndex = headers.findIndex(h => h.includes('temps') || h.includes('durée'));
      
      let count = 0;

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split("\t");
        if (!cols[1]) continue; // Skip si pas de nom de recette

        const recipeId = cols[0]?.trim();
        const name = cols[1]?.trim();
        const pdfLink = cols[pdfIndex]?.trim() || "";
        const time = cols[timeIndex]?.trim() || "30 min";

        // --- EXTRACTION DES INGRÉDIENTS (3 par 3) ---
        // On commence à l'index 2 (Qté 1) et on s'arrête avant le PDF
        const ingredients = [];
        for (let j = 2; j < pdfIndex; j += 3) {
          const qte = cols[j]?.trim();
          const unite = cols[j+1]?.trim();
          const nom = cols[j+2]?.trim();

          if (nom) {
            // On stocke la quantité et l'unité ensemble pour le moteur de calcul
            // Exemple: "200" + "g" + "Poulet" -> "200 g Poulet"
            ingredients.push({
              name: nom,
              quantity: `${qte || ""} ${unite || ""}`.trim()
            });
          }
        }

        // --- EXTRACTION DES TAGS ---
        const tags = [];
        for (let t = timeIndex + 1; t < cols.length; t++) {
          if (cols[t]?.trim()) tags.push(cols[t].trim());
        }

        // Détermination de la protéine (basée sur les ingrédients ou tags)
        const allText = (name + " " + tags.join(" ")).toLowerCase();
        let protein = "Végétarien";
        if (allText.includes("poulet")) protein = "Poulet";
        else if (allText.includes("bœuf") || allText.includes("boeuf")) protein = "Bœuf";
        else if (allText.includes("porc") || allText.includes("lardon")) protein = "Porc";
        else if (allText.includes("poisson") || allText.includes("saumon") || allText.includes("crevette")) protein = "Poisson";

        await addDoc(collection(db, "recipes"), {
          sheetId: recipeId,
          name: name,
          protein: protein,
          time: time,
          pdfLink: pdfLink,
          tags: tags,
          ingredients: ingredients,
          createdAt: new Date().toISOString()
        });
        
        count++;
      }

      setStatus(`Succès ! ${count} recettes importées avec la nouvelle nomenclature. 🎉`);
      setText("");
    } catch (error) {
      console.error(error);
      setStatus(`Erreur : ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen py-10 px-6 max-w-lg mx-auto pb-32">
      <header className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-mint mb-4">
          <DatabaseBackup size={32} />
        </div>
        <h1 className="font-display text-3xl font-black text-white">Import Pro</h1>
        <p className="font-body text-text-muted mt-2">Format : Qté | Unité | Ingrédient</p>
      </header>

      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez votre tableau Google Sheets ici..."
          className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-white font-body text-xs focus:outline-none focus:border-mint/50"
        />

        <button 
          onClick={handleImport}
          disabled={isProcessing || !text.trim()}
          className="w-full py-4 rounded-xl font-display font-black text-forest-deepest bg-gradient-to-r from-mint to-mint-deep flex justify-center items-center gap-2 transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          {isProcessing ? "Traitement..." : "Lancer l'importation"}
        </button>

        {status && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-mint/30 text-center text-sm font-body text-mint font-bold">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}