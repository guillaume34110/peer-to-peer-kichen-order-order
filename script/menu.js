// Données du menu avec produits multilingues
export const menuItems = [
  {
    id: "cafe",
    price: 40,
    name: {
      fr: "Café",
      th: "กาแฟ"
    },
    image: "https://picsum.photos/id/225/300/200"
  },
  {
    id: "tea",
    price: 30,
    name: {
      fr: "Thé",
      th: "ชา"
    },
    image: "https://picsum.photos/id/404/300/200"
  },
  {
    id: "water",
    price: 10,
    name: {
      fr: "Eau",
      th: "น้ำ"
    },
    image: "https://picsum.photos/id/30/300/200"
  },
  {
    id: "crepejambonfromageoeuf",
    price: 100,
    name: {
      fr: "Crêpe jambon fromage oeuf",
      th: "ครีบจะมันฟอร์จีโอฟ"
    },
    image: "https://picsum.photos/id/1080/300/200"
  },
  {
    id: "crepechampignonfromageoeuf",
    price: 90,
    name: {
      fr: "Crêpe champignon fromage oeuf",
      th: "ครีบชั่มฟอร์จีโอฟ"
    },
    image: "https://picsum.photos/id/211/300/200"
  },
  {
    id: "crepesucree",
    price: 50,
    name: {
      fr: "Crêpe sucrée",
      th: "ครีบสุกรี"
    },
    image: "https://picsum.photos/id/367/300/200"
  },
  {
    id: "crepechocolatbannane",
    price: 80,
    name: {
      fr: "Crêpe chocolat banane",
      th: "ครีบชอคโละบันนัน"
    },
    image: "https://picsum.photos/id/326/300/200"
  },
];

export const getMenuItemById = (id) => {
  return menuItems.find(item => item.id === id);
}; 