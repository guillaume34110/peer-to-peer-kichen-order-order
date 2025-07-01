import { menuItems } from './menu.js';
import { t, getCurrentLanguage, setLanguage } from './i18n.js';
import { formatPrice } from './utils.js';
import { 
  initializeOrderForTable,
  updateStateFromServer,
  getCurrentOrder, 
  getSelectedTable, 
  setSelectedTable, 
  getOrderTotal,
  getConnectionStatus 
} from './state.js';
import { sendAddItem, sendRemoveItem, requestState } from './websocket.js';

// Éléments DOM
let elements = {};

// Initialiser l'interface
export const initializeUI = () => {
  cacheElements();
  setupEventListeners();
  renderMenu();
  renderLanguageSelector();
  updateUI();
};

// Mettre en cache les éléments DOM
const cacheElements = () => {
  elements = {
    tableSelect: document.getElementById('table-select'),
    menuGrid: document.getElementById('menu-grid'),
    orderList: document.getElementById('order-list'),
    orderTotal: document.getElementById('order-total'),
    languageSelector: document.getElementById('language-selector'),
    connectionStatus: document.getElementById('connection-status'),
    orderSection: document.getElementById('order-section')
  };
};

// Configuration des événements
const setupEventListeners = () => {
  // Changement de table
  elements.tableSelect.addEventListener('change', handleTableChange);
  
  // Événements de connexion WebSocket
  window.addEventListener('websocket-status', handleConnectionStatus);
  
  // Messages reçus du WebSocket
  window.addEventListener('websocket-message', handleWebSocketMessage);
  
  // Mise à jour d'état du WebSocket
  window.addEventListener('websocket-state-update', handleStateUpdate);
  
  // Changement de langue
  elements.languageSelector.addEventListener('change', handleLanguageChange);
};

// Gestion du changement de table
const handleTableChange = (event) => {
  const tableNumber = parseInt(event.target.value);
  if (tableNumber) {
    setSelectedTable(tableNumber);
    initializeOrderForTable(tableNumber);
    updateOrderDisplay();
    // Demander l'état actuel au serveur si connecté
    if (getConnectionStatus()) {
      requestState();
    }
  }
};

// Gestion du changement de langue
const handleLanguageChange = (event) => {
  const newLanguage = event.target.value;
  setLanguage(newLanguage);
  updateUI();
};

// Gestion du statut de connexion
const handleConnectionStatus = (event) => {
  updateConnectionStatus();
  
  // Demander l'état initial lors de la connexion
  if (getConnectionStatus()) {
    requestState();
  }
};

// Gestion de la mise à jour d'état complète du serveur
const handleStateUpdate = (event) => {
  const serverState = event.detail;
  console.log('🔄 Mise à jour automatique depuis la kitchen:', serverState);
  
  // Compter les commandes reçues
  const orderCount = serverState.orders ? serverState.orders.length : 0;
  console.log(`📊 ${orderCount} commandes dans le nouvel état`);
  
  // Mettre à jour l'état local
  updateStateFromServer(serverState);
  
  // Rafraîchir l'affichage
  updateOrderDisplay();
  
  // Notification visuelle temporaire (optionnel)
  showStateUpdateNotification(orderCount);
};

// Gestion des autres messages WebSocket
const handleWebSocketMessage = (event) => {
  const message = event.detail;
  console.log('Message WebSocket reçu:', message);
  
  // Traitement d'autres types de messages si nécessaire
};

// Rendu du menu en grille
const renderMenu = () => {
  const menuHtml = menuItems.map(item => `
    <div class="menu-item" data-item-id="${item.id}">
      <div class="menu-item-name">${item.name[getCurrentLanguage()]}</div>
      <div class="menu-item-price">${formatPrice(item.price)}</div>
    </div>
  `).join('');
  
  elements.menuGrid.innerHTML = menuHtml;
  
  // Ajouter les événements de clic
  elements.menuGrid.querySelectorAll('.menu-item').forEach(itemElement => {
    itemElement.addEventListener('click', () => {
      const itemId = itemElement.dataset.itemId;
      handleMenuItemClick(itemId);
    });
  });
};

// Gestion du clic sur un item du menu
const handleMenuItemClick = (itemId) => {
  const tableNumber = getSelectedTable();
  if (!tableNumber) {
    alert(t('selectTable'));
    return;
  }
  
  const menuItem = menuItems.find(item => item.id === itemId);
  if (!menuItem) return;
  
  // Envoyer au serveur WebSocket - il renverra l'état complet
  const success = sendAddItem(tableNumber, menuItem);
  
  if (!success) {
    alert('Erreur de connexion - Impossible d\'ajouter l\'article');
  }
};



// Rendu de la commande actuelle
const renderOrder = () => {
  const currentOrder = getCurrentOrder();
  
  if (!currentOrder || !currentOrder.items || !currentOrder.items.length) {
    elements.orderList.innerHTML = `<div class="empty-order">${t('emptyOrder')}</div>`;
    elements.orderTotal.textContent = formatPrice(0);
    return;
  }
  
  const orderHtml = currentOrder.items.map((item, index) => `
    <div class="order-item">
      <div class="order-item-info">
        <span class="order-item-name">${item.name[getCurrentLanguage()]}</span>
        <span class="order-item-price">${formatPrice(item.price)}</span>
      </div>
      <button class="cancel-item-btn" data-item-index="${index}">
        ${t('cancel')}
      </button>
    </div>
  `).join('');
  
  elements.orderList.innerHTML = orderHtml;
  elements.orderTotal.textContent = formatPrice(getOrderTotal());
  
  // Ajouter les événements d'annulation
  elements.orderList.querySelectorAll('.cancel-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemIndex = parseInt(btn.dataset.itemIndex);
      handleCancelItem(itemIndex);
    });
  });
};

// Gestion de l'annulation d'un item
const handleCancelItem = (itemIndex) => {
  const tableNumber = getSelectedTable();
  const currentOrder = getCurrentOrder();
  
  if (currentOrder && currentOrder.items && currentOrder.items[itemIndex]) {
    const itemToRemove = currentOrder.items[itemIndex];
    
    // Envoyer la demande d'annulation au serveur - il renverra l'état complet
    const success = sendRemoveItem(tableNumber, itemToRemove);
    
    if (!success) {
      alert('Erreur de connexion - Impossible d\'annuler l\'article');
    }
  }
};

// Rendu du sélecteur de langue
const renderLanguageSelector = () => {
  elements.languageSelector.innerHTML = `
    <option value="fr" ${getCurrentLanguage() === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
    <option value="th" ${getCurrentLanguage() === 'th' ? 'selected' : ''}>🇹🇭 ไทย</option>
  `;
};

// Mise à jour du statut de connexion
const updateConnectionStatus = () => {
  const isConnected = getConnectionStatus();
  const statusElement = elements.connectionStatus;
  
  statusElement.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
  statusElement.textContent = isConnected ? t('connected') : t('disconnected');
};

// Notification visuelle pour les mises à jour d'état
const showStateUpdateNotification = (orderCount) => {
  // Ne pas afficher de notification si pas d'UI visible ou table non sélectionnée
  if (!getSelectedTable()) return;
  
  const notification = document.createElement('div');
  notification.className = 'state-update-notification';
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #3498db;
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    font-size: 0.9rem;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  `;
  notification.textContent = `🔄 État mis à jour (${orderCount} commandes)`;
  
  document.body.appendChild(notification);
  
  // Animation d'apparition
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 100);
  
  // Suppression automatique
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 2000);
};

// Mise à jour de l'affichage de la commande
const updateOrderDisplay = () => {
  renderOrder();
};

// Mise à jour complète de l'interface
export const updateUI = () => {
  // Mettre à jour les textes traduits
  document.querySelector('[data-translate="table"]').textContent = t('table');
  document.querySelector('[data-translate="menu"]').textContent = t('menu');
  document.querySelector('[data-translate="order"]').textContent = t('order');
  document.querySelector('[data-translate="total"]').textContent = t('total');
  document.querySelector('[data-translate="language"]').textContent = t('language');
  document.querySelector('[data-translate="connectionStatus"]').textContent = t('connectionStatus');
  
  // Re-rendre le menu avec la nouvelle langue
  renderMenu();
  renderOrder();
  updateConnectionStatus();
}; 