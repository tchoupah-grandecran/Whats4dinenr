import { useApp } from '@/context/AppContext';

export default function Header() {
  const { user } = useApp();
  
  // On récupère le prénom ou on met "..." par défaut
  const firstName = user?.firstName || '...';
  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?';

  return (
    <header id="section-header">
      <div className="greetings-header">
        <div className="user-avatar" title="Mon compte">
          {initial}
        </div>
        <div className="greeting-text-group">
          <span className="text-hello">👋 Hello,</span>
          <span className="text-username">{firstName} !</span>
        </div>
      </div>
    </header>
  );
}