// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'dinner-green': '#2D4B3E', // Vert profond
        'dinner-cream': '#F9F7F2', // Fond papier recyclé
        'dinner-accent': '#D4A373', // Sable chaud
      },
      backgroundImage: {
        'grain': "url('/textures/grain.png')",
        'subtle-pattern': "url('/textures/leaf-pattern.svg')",
      },
      borderRadius: {
        'organic': '30% 70% 70% 30% / 30% 30% 70% 70%', // Forme patatoïde
      }
    },
  },
}