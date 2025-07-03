import { menuItems } from './menu.js';
import { t, getCurrentLanguage, setLanguage } from './i18n.js';
import { formatPrice, getTableCount, setTableCount } from './utils.js';
import { 
  initializeOrderForTable,
  updateStateFromServer,
  getCurrentOrder, 
  getSelectedTable, 
  setSelectedTable, 
  getOrderTotal,
  getConnectionStatus,
  getTablesWithOrders
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
  updateTableDisplay(getTableCount());
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
    orderSection: document.getElementById('order-section'),
    tableCount: document.getElementById('table-count'),
    decreaseTables: document.getElementById('decrease-tables'),
    increaseTables: document.getElementById('increase-tables'),
    menuCollapseBtn: document.getElementById('menu-collapse-btn'),
    orderCollapseBtn: document.getElementById('order-collapse-btn'),
    orderContent: document.getElementById('order-content'),
    menuSection: document.querySelector('.menu-section'),
    moneyGiven: document.getElementById('money-given'),
    changeAmount: document.getElementById('change-amount'),
    header: document.querySelector('.header')
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
  
  // Contrôles du nombre de tables
  elements.decreaseTables.addEventListener('click', handleDecreaseTable);
  elements.increaseTables.addEventListener('click', handleIncreaseTable);
  
  // Boutons de collapse
  elements.menuCollapseBtn.addEventListener('click', handleMenuCollapse);
  elements.orderCollapseBtn.addEventListener('click', handleOrderCollapse);
  
  // Calcul du rendu de monnaie
  elements.moneyGiven.addEventListener('input', calculateChange);
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

// Gestion des contrôles de table
const handleDecreaseTable = () => {
  const current = getTableCount();
  const newCount = setTableCount(current - 1);
  updateTableDisplay(newCount);
};

const handleIncreaseTable = () => {
  const current = getTableCount();
  const newCount = setTableCount(current + 1);
  updateTableDisplay(newCount);
};

// Générer les options de table
const generateTableOptions = (count) => {
  const tablesWithOrders = getTablesWithOrders();
  const options = ['<option value="">table</option>'];
  
  for (let i = 1; i <= count; i++) {
    const hasOrder = tablesWithOrders.includes(i);
    const tableText = `Table ${i}`;
    
    if (hasOrder) {
      // Utiliser des espaces pour séparer le texte et l'indicateur
      const spacing = '\u00A0'.repeat(2); // Espaces non-sécables
      options.push(`<option value="${i}">${tableText}${spacing}🟢</option>`);
    } else {
      options.push(`<option value="${i}">${tableText}</option>`);
    }
  }
  return options.join('');
};

// Mettre à jour l'affichage des tables
const updateTableDisplay = (count) => {
  const currentSelection = elements.tableSelect.value;
  elements.tableCount.textContent = count;
  elements.tableSelect.innerHTML = generateTableOptions(count);
  
  // Restaurer la sélection si elle est toujours valide
  if (currentSelection && parseInt(currentSelection) <= count) {
    elements.tableSelect.value = currentSelection;
  }
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
    <div class="menu-item" data-item-id="${item.id}" style="background-image: url('${item.image}');">
      <div class="menu-item-price-badge">${formatPrice(item.price)}</div>
      <div class="menu-item-name-band">
        <span class="menu-item-name">${item.name[getCurrentLanguage()]}</span>
      </div>
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
    <option value="fr" ${getCurrentLanguage() === 'fr' ? 'selected' : ''}>🇫🇷</option>
    <option value="th" ${getCurrentLanguage() === 'th' ? 'selected' : ''}>🇹🇭</option>
  `;
};

// Mise à jour du statut de connexion
const updateConnectionStatus = () => {
  const isConnected = getConnectionStatus();
  
  if (isConnected) {
    elements.header.classList.remove('disconnected');
    elements.header.classList.add('connected');
  } else {
    elements.header.classList.remove('connected');
    elements.header.classList.add('disconnected');
  }
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
  // Mettre à jour aussi le sélecteur de tables pour les indicateurs
  updateTableDisplay(getTableCount());
  // Recalculer le rendu de monnaie
  calculateChange();
};

// Mise à jour complète de l'interface
export const updateUI = () => {
  // Mettre à jour les textes traduits
  document.querySelector('[data-translate="menu"]').textContent = t('menu');
  document.querySelector('[data-translate="order"]').textContent = t('order');
  document.querySelector('[data-translate="total"]').textContent = t('total');
  
  // Re-rendre le menu avec la nouvelle langue
  renderMenu();
  renderOrder();
  updateConnectionStatus();
};

// Gestion des contrôles de collapse
const handleMenuCollapse = () => {
  const isCollapsed = elements.menuGrid.classList.contains('collapsed');
  
  if (isCollapsed) {
    elements.menuGrid.classList.remove('collapsed');
    elements.menuSection.classList.remove('collapsed');
    elements.menuCollapseBtn.textContent = '−';
  } else {
    elements.menuGrid.classList.add('collapsed');
    elements.menuSection.classList.add('collapsed');
    elements.menuCollapseBtn.textContent = '+';
  }
};

const handleOrderCollapse = () => {
  const isCollapsed = elements.orderContent.classList.contains('collapsed');
  
  if (isCollapsed) {
    elements.orderContent.classList.remove('collapsed');
    elements.orderSection.classList.remove('collapsed');
    elements.orderCollapseBtn.textContent = '−';
  } else {
    elements.orderContent.classList.add('collapsed');
    elements.orderSection.classList.add('collapsed');
    elements.orderCollapseBtn.textContent = '+';
  }
};

// Calcul du rendu de monnaie
const calculateChange = () => {
  const total = getOrderTotal();
  const moneyGiven = parseFloat(elements.moneyGiven.value) || 0;
  const change = moneyGiven - total;
  
  if (moneyGiven === 0) {
    elements.changeAmount.textContent = 'Rendu: 0 ฿';
    elements.changeAmount.style.color = '#666';
  } else if (change >= 0) {
    elements.changeAmount.textContent = `Rendu: ${formatPrice(change)}`;
    elements.changeAmount.style.color = '#27ae60';
  } else {
    elements.changeAmount.textContent = `Manque: ${formatPrice(Math.abs(change))}`;
    elements.changeAmount.style.color = '#e74c3c';
  }
}; 