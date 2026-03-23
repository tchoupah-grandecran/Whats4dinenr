import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function RegistrationModal() {
  const { setUser, isRegistered } = useApp();
  const [step, setStep] = useState('info'); // info or household
  const [formData, setFormData] = useState({
    firstName: '',
    mode: 'existing', // 'existing' or 'new'
    householdId: '',
    householdName: '',
  });

  if (isRegistered) return null;

  const handleSubmit = async () => {
    // Call the /api/auth/register route defined above
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) setUser(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container registration-modal">
        <h2 className="modal-title">🏠 Bienvenue sur DinnerTime !</h2>
        
        <div className="input-group">
          <label className="input-label">Votre prénom</label>
          <input 
            className="input-field"
            type="text" 
            placeholder="Prénom"
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
        </div>

        <div className="radio-group">
          <label className={`radio-option ${formData.mode === 'existing' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="mode" 
              value="existing" 
              checked={formData.mode === 'existing'}
              onChange={() => setFormData({...formData, mode: 'existing'})}
            />
            <span>Rejoindre un foyer</span>
          </label>
          <label className={`radio-option ${formData.mode === 'new' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="mode" 
              value="new" 
              onChange={() => setFormData({...formData, mode: 'new'})}
            />
            <span>Créer un foyer</span>
          </label>
        </div>

        {formData.mode === 'new' ? (
          <input 
            className="input-field"
            placeholder="Nom du foyer (ex: Famille Dupont)"
            onChange={(e) => setFormData({...formData, householdName: e.target.value})}
          />
        ) : (
          <select 
            className="select-field"
            onChange={(e) => setFormData({...formData, householdId: e.target.value})}
          >
            <option value="">Sélectionner un foyer...</option>
            {/* Populate from /api/households */}
          </select>
        )}

        <button className="btn-register gradient-btn" onClick={handleSubmit}>
          S'inscrire
        </button>
      </div>
    </div>
  );
}