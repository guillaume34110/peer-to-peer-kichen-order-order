import { generateOrderId } from './utils.js';

// État global simplifié
const State = {
  data: {
    orders: []       // Array simple d'orders avec orderId inclus - PAS BESOIN DE TABLES !
  },
  selectedTable: null,
  isConnected: false
};

// Initialiser une nouvelle commande pour une table
export const initializeOrderForTable = (tableNumber) => {
  State.selectedTable = tableNumber;
};

// Mettre à jour l'état complet depuis le serveur
export const updateStateFromServer = (serverState) => {
  State.data = serverState;
};

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
  
  return currentOrder.items.reduce((total, item) => total + item.price, 0);
};

// Obtenir le statut de connexion
export const getConnectionStatus = () => State.isConnected;

// Définir le statut de connexion
export const setConnectionStatus = (status) => {
  State.isConnected = status;
};

// Obtenir l'état complet (pour debug)
export const getFullState = () => State; 