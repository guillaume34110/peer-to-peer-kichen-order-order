// Données du menu avec produits multilingues
export const menuItems = [
  {
    id: "cafe",
    price: 50,
    name: {
      fr: "Café",
      th: "กาแฟ"
    }
  },
  {
    id: "tea",
    price: 40,
    name: {
      fr: "Thé",
      th: "ชา"
    }
  },
  {
    id: "cappuccino",
    price: 70,
    name: {
      fr: "Cappuccino",
      th: "คาปูชิโน"
    }
  },
  {
    id: "latte",
    price: 80,
    name: {
      fr: "Latte",
      th: "ลาเต้"
    }
  },
  {
    id: "orange_juice",
    price: 60,
    name: {
      fr: "Jus d'orange",
      th: "น้ำส้มคั้น"
    }
  },
  {
    id: "water",
    price: 20,
    name: {
      fr: "Eau",
      th: "น้ำ"
    }
  },
  {
    id: "croissant",
    price: 45,
    name: {
      fr: "Croissant",
      th: "ครัวซองต์"
    }
  },
  {
    id: "sandwich",
    price: 120,
    name: {
      fr: "Sandwich",
      th: "แซนด์วิช"
    }
  },
  {
    id: "salad",
    price: 150,
    name: {
      fr: "Salade",
      th: "สลัด"
    }
  },
  {
    id: "soup",
    price: 90,
    name: {
      fr: "Soupe",
      th: "ซุป"
    }
  },
  {
    id: "pasta",
    price: 180,
    name: {
      fr: "Pâtes",
      th: "พาสต้า"
    }
  },
  {
    id: "pizza",
    price: 220,
    name: {
      fr: "Pizza",
      th: "พิซซ่า"
    }
  }
];

export const getMenuItemById = (id) => {
  return menuItems.find(item => item.id === id);
}; 