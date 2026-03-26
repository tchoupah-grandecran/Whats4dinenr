import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import RegistrationModal from '@/components/auth/RegistrationModal';

export default function HomeView() {
  const { user, menu, setMenu } = useApp(); // Assure-toi d'ajouter setMenu dans ton AppContext si ce n'est pas fait !
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMenu = async () => {
    if (!user?.householdId) return alert("Erreur : Aucun foyer assigné.");
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/menu/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId: user.householdId })
      });
      const data = await res.json();

      if (data.success) {
        setMenu(data.menu); // Met à jour le contexte avec le nouveau menu
        alert("Menu généré avec succès !"); // On remplacera cette alerte par une jolie transition plus tard
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      alert("Erreur de connexion.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Petite machine d'état très simple pour l'instant
  const state = menu ? 'menu-ready' : 'no-menu';

  return (
    <div id="page-home" className="page">
      <div className="home-wrapper">
        <RegistrationModal />
        
        {/* On affiche le composant uniquement si l'utilisateur est connecté */}
        {user && (
          <div className="glass-card home-state-card">
            {state === 'no-menu' && (
              <div className="home-state">
                <div className="home-state-orb orb-teal"><span>✨</span></div>
                <h2 className="home-state-title">Prêt à planifier tes repas ?</h2>
                <button 
                  className="home-cta home-cta--white" 
                  onClick={handleGenerateMenu}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Génération en cours...' : '🎲 Générer mon menu'}
                </button>
              </div>
            )}

            {state === 'menu-ready' && (
              <div className="home-state">
                <div className="home-state-orb orb-gold"><span>📋</span></div>
                <h2 className="home-state-title">Menu de la semaine prêt !</h2>
                <p>7 recettes ont été sélectionnées.</p>
                {/* Plus tard, ce bouton mènera vers le panier */}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}