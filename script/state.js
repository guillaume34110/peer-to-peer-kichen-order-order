import { generateOrderId } from './utils.js';

// État global
const State = {
  data: {
    orders: []
  },
  selectedTable: null,
  isConnected: false,
  menu: [],
  ingredients: [],
  totalTables: 8
};

// Initialiser une nouvelle commande pour une table
export const initializeOrderForTable = (tableNumber) => {
  State.selectedTable = tableNumber;
};

// Mettre à jour l'état complet depuis le serveur
export const updateStateFromServer = (serverState) => {
  State.data.orders = serverState.orders;

  if (serverState.totalTables !== undefined) {
    State.totalTables = serverState.totalTables;
  }
};

// Mettre à jour le menu depuis le serveur
export const updateMenuFromServer = (menuItems) => {
  // On fige chaque item pour éviter toute mutation accidentelle
  State.menu = menuItems.map(item => Object.freeze({ ...item }));
  console.log('📋 Menu mis à jour.');
};

// Mettre à jour les ingrédients depuis le serveur
export const updateIngredientsFromServer = (ingredientsList) => {
  State.ingredients = ingredientsList;
  console.log('🥬 Ingrédients mis à jour.');
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
export const getCurrentOrder = (itemIndex) => {
  if (!State.selectedTable) return null;
  
  const tableOrders = State.data.orders.filter(order => order.table === State.selectedTable);
  
  if (tableOrders.length === 0) {
    return { orderId: null, table: State.selectedTable, items: [] };
  }

  // Aplatir tous les articles de toutes les commandes pour cette table
  const allItems = tableOrders.flatMap(order => 
    (order.items || []).map(item => ({ ...item, parentOrder: order }))
  );

  if (itemIndex !== undefined) {
    // Si un index d'article est fourni, trouver l'article et retourner sa commande parente
    if (itemIndex >= 0 && itemIndex < allItems.length) {
      return allItems[itemIndex].parentOrder;
    } else {
      return null; // Index hors limites
    }
  }

  // Si aucun index n'est fourni, retourner l'objet agrégé pour l'affichage
  return {
    orderId: tableOrders[0].orderId,
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
