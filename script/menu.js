// Données du menu avec produits multilingues
export const menuItems = [
  {
    id: "cafe",
    price: 40,
    name: {
      fr: "Café",
      th: "กาแฟ"
    }
  },
  {
    id: "tea",
    price: 30,
    name: {
      fr: "Thé",
      th: "ชา"
    }
  },
  {
    id: "water",
    price: 10,
    name: {
      fr: "Eau",
      th: "น้ำ"
    }
  },
  {
    id: "crepejambonfromageoeuf",
    price: 100,
    name: {
      fr: "Crêpe jambon fromage oeuf",
      th: "ครีบจะมันฟอร์จีโอฟ"
    }
  },
  {
    id: "crepechampignonfromageoeuf",
    price: 90,
    name: {
      fr: "Crêpe champignon fromage oeuf",
      th: "ครีบชั่มฟอร์จีโอฟ"
    }
  },
  {
    id: "crepesucree",
    price: 50,
    name: {
      fr: "Crêpe sucrée",
      th: "ครีบสุกรี"
    }
  },
  {
    id: "crepechocolatbannane",
    price: 80,
    name: {
      fr: "Crêpe chocolat banane",
      th: "ครีบชอคโละบันนัน"
    }
  },
];

export const getMenuItemById = (id) => {
  return menuItems.find(item => item.id === id);
}; 