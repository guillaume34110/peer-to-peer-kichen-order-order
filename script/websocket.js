import { getCurrentTimestamp } from './utils.js';
import { setConnectionStatus } from './state.js';

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

// URL fixe pour le tunnel localtunnel
const WS_URL = 'wss://kitchen-ws.loca.lt';

// Initialiser la connexion WebSocket
export const initializeWebSocket = () => {
  console.log(`🔌 Connexion à ${WS_URL}`);
  
  socket = new WebSocket(WS_URL);
  
  socket.onopen = () => {
    console.log('✅ Connexion WebSocket établie');
    setConnectionStatus(true);
    reconnectAttempts = 0;
    dispatchConnectionEvent('connected');
  };
  
  socket.onclose = () => {
    console.log('❌ Connexion WebSocket fermée');
    setConnectionStatus(false);
    dispatchConnectionEvent('disconnected');
    
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        console.log(`🔄 Reconnexion ${reconnectAttempts}/${maxReconnectAttempts}`);
        initializeWebSocket();
      }, reconnectDelay);
    }
  };
  
  socket.onerror = (error) => {
    console.error('❌ Erreur WebSocket:', error);
    setConnectionStatus(false);
    dispatchConnectionEvent('error');
  };
  
  socket.onmessage = (event) => {
    console.log('📥 Message reçu (aperçu):', event.data.substring(0, 200) + '...');
    try {
      console.log(`[${new Date().toISOString()}] --- LOG: WebSocket data received.`);
      const message = JSON.parse(event.data);
      console.log(`[${new Date().toISOString()}] --- LOG: JSON data parsed.`);
      handleServerMessage(message);
    } catch (error) {
      console.error('❌ Erreur parsing message:', error);
    }
  };
};

// Envoyer un produit ajouté
export const sendAddItem = (table, item) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket non connecté');
    return false;
  }
  
  const message = {
    table,
    timestamp: getCurrentTimestamp(),
    item: {
      id: item.id,
      price: item.price,
      name: item.name,
      ingredients: item.ingredients || [],
      supplements: item.supplements || []
    }
  };
  
  socket.send(JSON.stringify(message));
  console.log('📤 Envoi item:', message);
  return true;
};

// Envoyer une annulation de produit
export const sendRemoveItem = (table, item) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket non connecté');
    return false;
  }
  
  const message = {
    table,
    timestamp: getCurrentTimestamp(),
    action: "remove",
    item: {
      id: item.id,
      price: item.price,
      name: item.name,
      ingredients: item.ingredients || [],
      supplements: item.supplements || []
    }
  };
  
  socket.send(JSON.stringify(message));
  console.log('📤 Envoi annulation:', message);
  return true;
};

// Envoyer une modification d'item (nouvelle route)
export const sendModifyItem = (originalTimestamp, item, removedIngredients, addedIngredients, supplements = []) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket non connecté');
    return false;
  }
  
  const message = {
    action: "modify",
    originalTimestamp: originalTimestamp,
    timestamp: getCurrentTimestamp(),
    item: {
      id: item.id,
      price: item.price,
      name: item.name
    },
    ingredientsRemoved: removedIngredients || [],
    ingredientsAdded: addedIngredients || [],
    supplements: supplements
  };
  
  socket.send(JSON.stringify(message));
  console.log('📤 Envoi modification:', message);
  return true;
};

// Demander l'état complet au serveur
export const requestState = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('❌ Impossible de demander l\'état - WebSocket non connecté');
    return false;
  }
  
  const message = {
    action: "getState",
    timestamp: Date.now()
  };
  
  socket.send(JSON.stringify(message));
  console.log('🔄 Demande d\'état envoyée');
  return true;
};

// Demander le menu au serveur
export const requestMenu = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('❌ Impossible de demander le menu - WebSocket non connecté');
    return false;
  }
  
  const message = {
    action: "getMenu",
    timestamp: Date.now()
  };
  
  socket.send(JSON.stringify(message));
  console.log('📋 Demande de menu envoyée');
  return true;
};

// Demander la liste des ingrédients au serveur
export const requestIngredients = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('❌ Impossible de demander les ingrédients - WebSocket non connecté');
    return false;
  }
  
  const message = {
    action: "getIngredients",
    timestamp: Date.now()
  };
  
  socket.send(JSON.stringify(message));
  console.log('🥬 Demande d\'ingrédients envoyée');
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

// Gérer les messages reçus du serveur
const handleServerMessage = (message) => {
  console.log('📨 Traitement message serveur:', message);
  
  // Gérer les erreurs
  if (message.error) {
    console.error('❌ Erreur serveur:', message.error);
    const event = new CustomEvent('websocket-error', { detail: message.error });
    window.dispatchEvent(event);
    return;
  }
  
  // Gérer la réponse du menu
  if (message.menu && Array.isArray(message.menu)) {
    console.log('📋 Menu reçu:', message.menu);
    if (message.menu.length > 0) {
      console.log('🖼️ Image base64 reçue (aperçu 1er item):', message.menu[0].image ? message.menu[0].image.substring(0, 70) + '...' : 'Pas d\'image');
    }
    console.log(`[${new Date().toISOString()}] --- LOG: Before dispatching 'websocket-menu-received' event.`);
    const event = new CustomEvent('websocket-menu-received', { detail: message.menu });
    window.dispatchEvent(event);
    console.log(`[${new Date().toISOString()}] --- LOG: After dispatching 'websocket-menu-received' event.`);
    return;
  }
  
  // Gérer la réponse des ingrédients
  if (message.ingredients && Array.isArray(message.ingredients)) {
    console.log('🥬 Ingrédients reçus:', message.ingredients);
    const event = new CustomEvent('websocket-ingredients-received', { detail: message.ingredients });
    window.dispatchEvent(event);
    return;
  }
  
  // Détecter les mises à jour d'état depuis la kitchen
  if (message.orders && Array.isArray(message.orders)) {
    console.log('📦 État mis à jour reçu:', message);
    handleKitchenStateUpdate(message);
  } else {
    // Autres types de messages
    const event = new CustomEvent('websocket-message', { detail: message });
    window.dispatchEvent(event);
  }
};

// Traiter les mises à jour d'état depuis la kitchen
const handleKitchenStateUpdate = (stateUpdate) => {
  const tableInfo = stateUpdate.totalTables !== undefined ? `Configuration cuisine: ${stateUpdate.totalTables} tables.` : '';
  console.log(`📊 Mise à jour: ${stateUpdate.orders.length} commandes reçues. ${tableInfo}`);
  
  // Dispatcher l'état complet vers l'UI
  const event = new CustomEvent('websocket-state-update', { detail: stateUpdate });
  window.dispatchEvent(event);
}; 