export default function StatusCard({ status }) {
  const configs = {
    'no-menu': { title: "C'est vide !", desc: "Planifiez votre premier menu.", icon: "✍️", color: "bg-orange-100" },
    'menu-ready': { title: "Menu prêt", desc: "Il est temps de faire la liste.", icon: "📝", color: "bg-blue-100" },
    'cart-active': { title: "Aux courses !", desc: "Articles restants à trouver.", icon: "🛒", color: "bg-green-100" },
    'cart-done': { title: "Tout est là", desc: "Prêt à cuisiner de bons plats ?", icon: "🍳", color: "bg-purple-100" },
  };

  const config = configs[status];

  return (
    <div className={`p-8 organic-shape ${config.color} shadow-inner flex flex-col items-center text-center transition-all`}>
      <span className="text-5xl mb-4">{config.icon}</span>
      <h3 className="text-xl font-serif font-bold">{config.title}</h3>
      <p className="text-sm opacity-80 mt-2">{config.desc}</p>
    </div>
  );
}