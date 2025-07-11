import { generateOrderId } from './utils.js';
import { getItemFromLocalStorage, setItemInLocalStorage } from './utils.js';

// État global, initialisé avec les données du localStorage si disponibles
const State = {
  data: {
    orders: getItemFromLocalStorage('orders') || []
  },
  selectedTable: null,
  isConnected: false,
  menu: getItemFromLocalStorage('menu') || [],
  ingredients: getItemFromLocalStorage('ingredients') || [],
  totalTables: getItemFromLocalStorage('totalTables') || 8
};

// Initialiser une nouvelle commande pour une table
export const initializeOrderForTable = (tableNumber) => {
  State.selectedTable = tableNumber;
};

// Mettre à jour l'état complet depuis le serveur
export const updateStateFromServer = (serverState) => {
  State.data.orders = serverState.orders;
  setItemInLocalStorage('orders', State.data.orders);

  if (serverState.totalTables !== undefined) {
    State.totalTables = serverState.totalTables;
    setItemInLocalStorage('totalTables', State.totalTables);
  }
};

// Mettre à jour le menu depuis le serveur
export const updateMenuFromServer = (menuItems) => {
  // On fige chaque item pour éviter toute mutation accidentelle
  State.menu = menuItems.map(item => Object.freeze({ ...item }));
  setItemInLocalStorage('menu', State.menu);
  console.log('📋 Menu mis à jour et sauvegardé dans le localStorage.');
};

// Mettre à jour les ingrédients depuis le serveur
export const updateIngredientsFromServer = (ingredientsList) => {
  State.ingredients = ingredientsList;
  setItemInLocalStorage('ingredients', State.ingredients);
  console.log('🥬 Ingrédients mis à jour et sauvegardés dans le localStorage.');
};

// Obtenir le menu
export const getMenu = () => State.menu;

// Obtenir les ingrédients
export const getIngredients = () => State.ingredients;

// Obtenir le nombre total de tables
export const getTotalTables = () => State.totalTables;

// Obtenir toutes les commandes
export const getAllOrders = () => State.data.orders;

// Obtenir la commande pour la table sélectionnée
export const getCurrentOrder = () => {
  if (!State.selectedTable) return null;
  
  // Filtrer tous les orders pour cette table et agréger les items
  const tableOrders = State.data.orders.filter(order => order.table === State.selectedTable);
  
  if (tableOrders.length === 0) {
    return {
      orderId: null,
      table: State.selectedTable,
      items: []
    };
  }
  
  // Si un seul order pour cette table, le retourner directement
  if (tableOrders.length === 1) {
    return tableOrders[0];
  }
  
  // Si plusieurs orders, agréger tous les items
  const allItems = [];
  let orderId = tableOrders[0].orderId; // Prendre le premier orderId
  
  tableOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      allItems.push(...order.items);
    } else if (order.item) {
      // Si format avec un seul item par order
      allItems.push(order.item);
    }
  });
  
  return {
    orderId,
    table: State.selectedTable,
    items: allItems
  };
};

// Obtenir le numéro de table sélectionné
export const getSelectedTable = () => State.selectedTable;

// Définir le numéro de table
export const setSelectedTable = (tableNumber) => {
  State.selectedTable = tableNumber;
};

// Calculer le total de la commande pour la table sélectionnée
export const getOrderTotal = () => {
  const currentOrder = getCurrentOrder();
  if (!currentOrder || !currentOrder.items) return 0;
  
  // Additionner le prix réel de chaque item (incluant suppléments)
  const total = currentOrder.items.reduce((total, item) => {
    let itemPrice = item.price || 0;
    
    // Ajouter le prix des suppléments s'il y en a (seulement pour cet item spécifique)
    if (item.supplementPrice && item.supplementPrice > 0) {
      itemPrice = itemPrice + item.supplementPrice;
      console.log(`💰 Supplément appliqué à ${item.id} (timestamp: ${item.timestamp}): +${item.supplementPrice}`);
    }
    
    console.log(`💰 Calcul total - Item: ${item.id} (timestamp: ${item.timestamp}), Prix final: ${itemPrice}`);
    return total + itemPrice;
  }, 0);
  
  console.log(`📊 Total calculé pour table ${State.selectedTable}: ${total}`);
  return total;
};
// Obtenir le statut de connexion
export const getConnectionStatus = () => State.isConnected;

// Définir le statut de connexion
export const setConnectionStatus = (status) => {
  State.isConnected = status;
};

// Obtenir l'état complet (pour debug)
export const getFullState = () => State;

// Obtenir les tables qui ont des commandes en cours
export const getTablesWithOrders = () => {
  const tablesWithOrders = new Set();
  State.data.orders.forEach(order => {
    if (order.table && order.items && order.items.length > 0) {
      tablesWithOrders.add(order.table);
    }
  });
  return Array.from(tablesWithOrders);
}; 
