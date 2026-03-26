export default function RecipeCard({ recipe, onSwap }) {
  return (
    <div 
      className="glass-card" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '12px 16px', 
        marginBottom: '12px', 
        borderRadius: 'var(--radius-2xl)',
        gap: '16px'
      }}
    >
      {/* Plus tard, on pourra mettre la vraie image de la recette ici */}
      <div 
        className="recipe-icon" 
        style={{ 
          fontSize: '2rem', 
          background: 'var(--forest-deep)',
          padding: '10px',
          borderRadius: '16px'
        }}
      >
        🍽️
      </div>

      <div className="recipe-info" style={{ flex: 1 }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.1rem', 
          color: 'var(--text-primary)',
          fontWeight: '600'
        }}>
          {recipe.name}
        </h3>
      </div>

      {/* Le bouton pour remplacer la recette */}
      <button
        onClick={() => onSwap(recipe.id)}
        style={{ 
          background: 'transparent', 
          border: '1px solid var(--sage)', 
          color: 'var(--sage)', 
          padding: '8px', 
          borderRadius: '50%', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Remplacer cette recette"
      >
        🔄
      </button>
    </div>
  );
}