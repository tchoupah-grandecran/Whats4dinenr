import { useApp } from '@/context/AppContext';
import RecipeCard from '@/components/features/menu/RecipeCard';

export default function MenuView() {
  const { menu } = useApp();

  const handleSwap = (recipeId) => {
    alert(`Remplacement de l'ID ${recipeId} ! (API à venir)`);
  };

  const handleValidate = () => {
    alert("Génération de la liste de courses ! (API à venir)");
  };

  // Sécurité 1 : S'assurer que menu est bien un tableau (Array) et qu'il contient des éléments
  const hasMenu = Array.isArray(menu) && menu.length > 0;

  if (!hasMenu) {
    return (
      <div id="page-menu" className="page" style={{ padding: '24px 16px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Aucun menu en cours</h2>
        <p style={{ color: 'var(--sage)' }}>Retourne à l'accueil pour générer ton menu de la semaine.</p>
        
        {/* Petit debug caché pour voir ce que contient vraiment menu si ce n'est pas un tableau */}
        <pre style={{ display: 'none' }}>{JSON.stringify(menu)}</pre>
      </div>
    );
  }

  return (
    <div id="page-menu" className="page" style={{ padding: '24px 16px', paddingBottom: '120px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Ton Menu</h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--sage)' }}>Ajuste tes repas si besoin</p>
      </div>

      <div className="menu-list">
        {/* Sécurité 2 : On filtre les éléments nuls ou non définis avant d'afficher */}
        {menu.filter(recipe => recipe && recipe.name).map((recipe, index) => (
          <RecipeCard
            key={`${recipe.id}-${index}`}
            recipe={recipe}
            onSwap={handleSwap}
          />
        ))}
      </div>

      <button className="gradient-btn" onClick={handleValidate}>
        ✅ Valider mon menu
      </button>
    </div>
  );
}