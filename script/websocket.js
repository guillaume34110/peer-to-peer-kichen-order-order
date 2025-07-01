import { getCurrentTimestamp } from './utils.js';
import { setConnectionStatus } from './state.js';

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

// Initialiser la connexion WebSocket
export const initializeWebSocket = () => {
  const host = window.location.hostname || 'localhost';
  const wsUrl = `ws://${host}:3000`;
  
  console.log(`Tentative de connexion à ${wsUrl}`);
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('Connexion WebSocket établie');
    setConnectionStatus(true);
    reconnectAttempts = 0;
    dispatchConnectionEvent('connected');
  };
  
  socket.onclose = () => {
    console.log('Connexion WebSocket fermée');
    setConnectionStatus(false);
    dispatchConnectionEvent('disconnected');
    
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        console.log(`Tentative de reconnexion ${reconnectAttempts}/${maxReconnectAttempts}`);
        initializeWebSocket();
      }, reconnectDelay);
    }
  };
  
  socket.onerror = (error) => {
    console.error('Erreur WebSocket:', error);
    setConnectionStatus(false);
    dispatchConnectionEvent('error');
  };
  
  socket.onmessage = (event) => {
    console.log('Message reçu:', event.data);
    try {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    } catch (error) {
      console.error('Erreur lors du parsing du message WebSocket:', error);
    }
  };
};

// Envoyer un produit ajouté
export const sendAddItem = (table, item) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket non connecté');
    return false;
  }
  
  const message = {
    table,
    timestamp: getCurrentTimestamp(),
    item: {
      id: item.id,
      price: item.price,
      name: item.name
    }
  };
  
  socket.send(JSON.stringify(message));
  console.log('Envoi item:', message);
  return true;
};

// Envoyer une annulation de produit
export const sendRemoveItem = (table, item) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket non connecté');
    return false;
  }
  
  const message = {
    table,
    timestamp: getCurrentTimestamp(),
    action: "remove",
    item: {
      id: item.id,
      price: item.price,
      name: item.name
    }
  };
  
  socket.send(JSON.stringify(message));
  console.log('Envoi annulation:', message);
  return true;
};

// Obtenir le statut de connexion
export const isConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};

// Fermer la connexion
export const closeConnection = () => {
  if (socket) {
    socket.close();
  }
};

// Dispatcher des événements de connexion
const dispatchConnectionEvent = (status) => {
  const event = new CustomEvent('websocket-status', { detail: status });
  window.dispatchEvent(event);
};

// Envoyer une commande pour récupérer l'état
export const requestState = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket non connecté');
    return false;
  }
  
  const message = {
    action: "getState",
    timestamp: getCurrentTimestamp()
  };
  
  socket.send(JSON.stringify(message));
  console.log('Demande état:', message);
  return true;
};

// Gérer les messages reçus du serveur
const handleServerMessage = (message) => {
  console.log('Traitement du message serveur:', message);
  
  // Détecter les mises à jour d'état automatiques depuis la kitchen
  if (message.orders && Array.isArray(message.orders)) {
    console.log('📦 État mis à jour reçu de la kitchen:', message);
    handleKitchenStateUpdate(message.orders);
  } else {
    // Autres types de messages
    const event = new CustomEvent('websocket-message', { detail: message });
    window.dispatchEvent(event);
  }
};

// Fonction pour traiter les mises à jour d'état depuis la kitchen
const handleKitchenStateUpdate = (orders) => {
  console.log(`Mise à jour: ${orders.length} commandes reçues`);
  
  // Dispatcher un événement avec l'état complet pour mettre à jour l'UI
  const stateData = { orders };
  const event = new CustomEvent('websocket-state-update', { detail: stateData });
  window.dispatchEvent(event);
}; 