import { getCurrentTimestamp } from './utils.js';
import { setConnectionStatus } from './state.js';

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;
let workingUrl = null;

// Scanner d'IP automatique
const findWorkingWebSocketUrl = () => {
  return new Promise((resolve) => {
    const baseIP = '192.168.1.';
    const port = 3000;
    let found = false;
    let tested = 0;
    const totalToTest = 254;
    
    console.log('🔍 Scan automatique de 192.168.1.1 à 192.168.1.254...');
    
    // Test localhost d'abord (plus rapide)
    const testLocalhost = () => {
      const ws = new WebSocket('ws://localhost:3000');
      const timeout = setTimeout(() => {
        ws.close();
        testIPRange();
      }, 1000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        if (!found) {
          found = true;
          console.log('✅ Trouvé: localhost:3000');
          resolve('ws://localhost:3000');
        }
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        testIPRange();
      };
    };
    
    // Test de la plage IP
    const testIPRange = () => {
      for (let i = 1; i <= 254; i++) {
        const ip = baseIP + i;
        const url = `ws://${ip}:${port}`;
        
        setTimeout(() => {
          if (found) return;
          
          const ws = new WebSocket(url);
          const timeout = setTimeout(() => {
            ws.close();
            tested++;
            if (tested >= totalToTest && !found) {
              console.log('❌ Aucune IP trouvée dans 192.168.1.x');
              resolve(null);
            }
          }, 500); // Timeout court pour chaque IP
          
          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            if (!found) {
              found = true;
              console.log(`✅ Trouvé: ${ip}:${port}`);
              resolve(url);
            }
          };
          
          ws.onerror = () => {
            clearTimeout(timeout);
            tested++;
            if (tested >= totalToTest && !found) {
              console.log('❌ Aucune IP trouvée dans 192.168.1.x');
              resolve(null);
            }
          };
        }, i * 10); // Décalage de 10ms entre chaque test
      }
    };
    
    testLocalhost();
  });
};

// Initialiser la connexion WebSocket
export const initializeWebSocket = async () => {
  // Si on a déjà une URL qui fonctionne, l'utiliser
  if (!workingUrl) {
    console.log('🔍 Recherche automatique de l\'IP WebSocket...');
    workingUrl = await findWorkingWebSocketUrl();
    
    if (!workingUrl) {
      console.error('❌ Impossible de trouver un serveur WebSocket');
      setConnectionStatus(false);
      return;
    }
  }
  
  console.log(`🔌 Connexion à ${workingUrl}`);
  
  socket = new WebSocket(workingUrl);
  
  socket.onopen = () => {
    console.log('✅ Connexion WebSocket établie sur', workingUrl);
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
        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts}/${maxReconnectAttempts}`);
        initializeWebSocket();
      }, reconnectDelay);
    } else {
      // Reset l'URL pour nouveau scan au prochain essai
      workingUrl = null;
    }
  };
  
  socket.onerror = (error) => {
    console.error('❌ Erreur WebSocket:', error);
    setConnectionStatus(false);
    dispatchConnectionEvent('error');
  };
  
  socket.onmessage = (event) => {
    console.log('📥 Message reçu:', event.data);
    try {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    } catch (error) {
      console.error('❌ Erreur lors du parsing du message WebSocket:', error);
    }
  };
};

// Forcer un nouveau scan
export const rescanWebSocketUrl = async () => {
  workingUrl = null;
  if (socket) {
    socket.close();
  }
  await initializeWebSocket();
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