import { useApp } from '@/context/AppContext';

export default function StatusCard() {
  const { getHomeState } = useApp();
  const state = getHomeState();

  return (
    <div className="glass-card home-state-card">
      {state === 'no-menu' && (
        <div className="home-state">
          <div className="home-state-orb orb-teal"><span>✨</span></div>
          <h2 className="home-state-title">Prêt à planifier tes repas ?</h2>
          <button className="home-cta home-cta--white">🎲 Générer mon menu</button>
        </div>
      )}
      
      {state === 'cart-active' && (
        <div className="home-state">
          {/* Progress Ring logic from original script */}
          <div className="home-ring-wrap">
             {/* SVG Ring would go here */}
          </div>
          <h2 className="home-state-title">Tu y es presque !</h2>
          <button className="home-cta home-cta--teal">Continuer les courses</button>
        </div>
      )}
      {/* ... other states: menu-ready, cart-done, week-done ... */}
    </div>
  );
}