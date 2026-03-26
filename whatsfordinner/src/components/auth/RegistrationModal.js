import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function RegistrationModal() {
  const { user, setUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    mode: 'new', // Par défaut sur "new" pour faciliter ton premier test
    householdId: '',
    householdName: '',
  });

  // Si l'utilisateur est déjà connecté (le user existe), on cache la modale
  if (user) return null;

  const handleSubmit = async () => {
    // 1. Validation des champs
    if (!formData.firstName) return alert('Veuillez entrer votre prénom');
    if (formData.mode === 'new' && !formData.householdName) return alert('Veuillez entrer un nom de foyer');
    if (formData.mode === 'existing' && !formData.householdId) return alert('Veuillez sélectionner un foyer');

    setIsLoading(true);

    try {
      // 2. Appel à notre nouvelle API Vercel
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      // 3. Traitement de la réponse
      if (data.success) {
        // Met à jour le contexte global, ce qui va automatiquement cacher cette modale !
        setUser({
          firstName: data.firstName,
          householdId: data.householdId,
          email: data.email
        });
      } else {
        alert('Erreur API: ' + data.error);
      }
    } catch (error) {
      console.error("Erreur détaillée:", error);
      alert('Erreur de connexion au serveur. Vérifiez la console (F12).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container registration-modal">
        <h2 className="modal-title">🏠 Bienvenue sur DinnerTime !</h2>
        
        <div className="input-group" style={{ marginBottom: '16px' }}>
          <label className="input-label">Votre prénom</label>
          <div className="input-field">
            <input 
              type="text" 
              placeholder="Prénom"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
        </div>

        <div className="radio-group" style={{ marginBottom: '16px' }}>
          <label className={`radio-option ${formData.mode === 'existing' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="mode" 
              value="existing" 
              checked={formData.mode === 'existing'}
              onChange={() => setFormData({...formData, mode: 'existing'})}
            />
            <span className="radio-label">Rejoindre un foyer existant</span>
          </label>
          
          <label className={`radio-option ${formData.mode === 'new' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="mode" 
              value="new" 
              checked={formData.mode === 'new'}
              onChange={() => setFormData({...formData, mode: 'new'})}
            />
            <span className="radio-label">Créer un nouveau foyer</span>
          </label>
        </div>

        {formData.mode === 'new' ? (
          <div className="input-field" style={{ marginBottom: '24px' }}>
            <input 
              type="text"
              placeholder="Nom du foyer (ex: Famille Dupont)"
              value={formData.householdName}
              onChange={(e) => setFormData({...formData, householdName: e.target.value})}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
        ) : (
          <select 
            className="select-field"
            value={formData.householdId}
            onChange={(e) => setFormData({...formData, householdId: e.target.value})}
            style={{ marginBottom: '24px' }}
          >
            <option value="">-- Sélectionner un foyer --</option>
            {/* Plus tard, nous créerons l'API pour récupérer la vraie liste ici */}
            <option value="HH_TEST">Foyer de Test (Temporaire)</option>
          </select>
        )}

        <button 
          className="btn-register gradient-btn" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Inscription...' : "S'inscrire"}
        </button>
      </div>
    </div>
  );
}