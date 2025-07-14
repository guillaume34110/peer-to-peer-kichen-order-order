import { t, getCurrentLanguage, setLanguage } from './i18n.js';
import { formatPrice, validateImageBase64 } from './utils.js';
import { 
  initializeOrderForTable,
  updateStateFromServer,
  updateMenuFromServer,
  updateIngredientsFromServer,
  getCurrentOrder, 
  getSelectedTable, 
  setSelectedTable, 
  getOrderTotal,
  getConnectionStatus,
  getTablesWithOrders,
  getMenu,
  getIngredients,
  getTotalTables
} from './state.js';
import { sendAddItem, sendRemoveItem, sendModifyItem, requestState, requestMenu, requestIngredients } from './websocket.js';

// Éléments DOM
let elements = {};

// Initialiser l'interface
export const initializeUI = () => {
  cacheElements();
  setupEventListeners();
  renderMenu(); // Affichera le message de chargement
  renderLanguageSelector();
  updateTableDisplay(getTotalTables());
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
    menuCollapseBtn: document.getElementById('menu-collapse-btn'),
    orderCollapseBtn: document.getElementById('order-collapse-btn'),
    orderContent: document.getElementById('order-content'),
    menuSection: document.querySelector('.menu-section'),
    moneyGiven: document.getElementById('money-given'),
    changeAmount: document.getElementById('change-amount'),
    header: document.querySelector('.header'),
    categoryFilter: document.getElementById('category-filter')
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
  
  // Réception du menu du WebSocket
  window.addEventListener('websocket-menu-received', handleMenuReceived);
  
  // Réception des ingrédients du WebSocket
  window.addEventListener('websocket-ingredients-received', handleIngredientsReceived);
  
  // Gestion des erreurs WebSocket
  window.addEventListener('websocket-error', handleWebSocketError);
  
  // Changement de langue
  elements.languageSelector.addEventListener('change', handleLanguageChange);
  
  // Boutons de collapse
  elements.menuCollapseBtn.addEventListener('click', handleMenuCollapse);
  elements.orderCollapseBtn.addEventListener('click', handleOrderCollapse);
  
  // Calcul du rendu de monnaie
  elements.moneyGiven.addEventListener('input', calculateChange);
  
  // Filtrage par catégorie
  elements.categoryFilter.addEventListener('change', handleCategoryChange);
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

// Générer les options de catégories
const generateCategoryOptions = () => {
  const menu = getMenu();
  const categories = new Map();
  
  // Option "Toutes les catégories"
  categories.set('all', { id: 'all', name: { fr: 'Toutes les catégories', th: 'ทุกหมวดหมู่' } });
  
  // Extraire les catégories uniques du menu
  menu.forEach(item => {
    if (item.category && item.category.id) {
      categories.set(item.category.id, item.category);
    }
  });
  
  // Générer les options HTML
  const options = Array.from(categories.values()).map(category => {
    return `<option value="${category.id}">${category.name[getCurrentLanguage()]}</option>`;
  });
  
  // Mettre à jour le sélecteur
  elements.categoryFilter.innerHTML = options.join('');
};

// Gestion du changement de catégorie
const handleCategoryChange = () => {
  renderMenu();
};

// Gestion de la réception du menu
const handleMenuReceived = (event) => {
  console.log(`[${new Date().toISOString()}] --- LOG: UI received 'websocket-menu-received' event.`);
  const menuItems = event.detail;
  console.log('📋 Menu reçu dans UI:', menuItems);
  
  // Debug: vérifier les prix reçus
  menuItems.forEach(item => {
    console.log(`💰 Prix pour ${item.id}: ${item.price} (formaté: ${formatPrice(item.price)})`);
  });
  
  // Mettre à jour le menu dans l'état
  updateMenuFromServer(menuItems);
  console.log(`[${new Date().toISOString()}] --- LOG: Menu updated in state.`);
  
  // Générer les options de catégories
  generateCategoryOptions();
  
  // Re-rendre le menu
  renderMenu();
};

// Gestion de la réception des ingrédients
const handleIngredientsReceived = (event) => {
  const ingredientsList = event.detail;
  console.log('🥬 Ingrédients reçus dans UI:', ingredientsList);
  
  // Mettre à jour les ingrédients dans l'état
  updateIngredientsFromServer(ingredientsList);
};

// Gestion des erreurs WebSocket
const handleWebSocketError = (event) => {
  const errorMessage = event.detail;
  console.error('❌ Erreur WebSocket reçue:', errorMessage);
  
  // Afficher l'erreur à l'utilisateur
  alert(`Erreur: ${errorMessage}`);
};

// Gestion du statut de connexion
const handleConnectionStatus = (event) => {
  updateConnectionStatus();
  
  // Demander le menu, les ingrédients et l'état initial lors de la connexion
  if (getConnectionStatus()) {
    requestMenu();
    requestIngredients();
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
  
  // Debug: vérifier les modifications dans les items
  if (serverState.orders) {
    serverState.orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          console.log('🔍 Item reçu du serveur:', item.id, item);
        });
      }
    });
  }
  
  // Mettre à jour l'état local
  updateStateFromServer(serverState);
  
  // Rafraîchir l'affichage
  updateOrderDisplay();
  updateTableDisplay(getTotalTables());
  
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
  console.log(`[${new Date().toISOString()}] --- LOG: Starting menu render.`);
  const menu = getMenu();
  
  if (!menu || menu.length === 0) {
    elements.menuGrid.innerHTML = '<div class="menu-loading">Chargement du menu...</div>';
    return;
  }
  
  // Filtrer par catégorie sélectionnée
  const selectedCategory = elements.categoryFilter ? elements.categoryFilter.value : 'all';
  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : menu.filter(item => item.category && item.category.id === selectedCategory);
  
  const menuHtml = filteredMenu.map(item => {
    // Debug: vérifier le prix utilisé pour le rendu
    console.log(`🎨 Rendu - Prix pour ${item.id}: ${item.price} (formaté: ${formatPrice(item.price)})`);
    
    // Vérifier la disponibilité
    const isAvailable = !item.quantity || item.quantity.infinite || item.quantity.amount > 0;
    const itemClass = isAvailable ? 'menu-item' : 'menu-item menu-item-unavailable';
    
    // Générer la pastille de quantité si nécessaire
    let quantityBadge = '';
    if (item.quantity && !item.quantity.infinite) {
      const badgeClass = item.quantity.amount <= 5 ? 'menu-item-quantity-badge low-stock' : 'menu-item-quantity-badge';
      quantityBadge = `<div class="${badgeClass}">${item.quantity.amount}</div>`;
    }
    
    // L'image est maintenant directement en base64, on valide et utilise l'image
    console.log(`🖼️ Traitement de l'image pour ${item.id}:`, item.image ? item.image.substring(0, 70) + '...' : 'Pas d\'image');
    const validatedImage = validateImageBase64(item.image);
    return `
      <div class="${itemClass}" data-item-id="${item.id}" data-available="${isAvailable}" style="background-image: url('${validatedImage}');">
        <div class="menu-item-price-badge">${formatPrice(item.price)}</div>
        ${quantityBadge}
        <div class="menu-item-name-band">
          <span class="menu-item-name">${item.name[getCurrentLanguage()]}</span>
        </div>
      </div>
    `;
  }).join('');
  
  elements.menuGrid.innerHTML = filteredMenu.length > 0 
    ? menuHtml 
    : `<div class="menu-loading">${t('noCategoryItems')}</div>`;
  
  // Ajouter les événements de clic
  elements.menuGrid.querySelectorAll('.menu-item').forEach(itemElement => {
    itemElement.addEventListener('click', () => {
      const itemId = itemElement.dataset.itemId;
      const isAvailable = itemElement.dataset.available === 'true';
      
      if (isAvailable) {
        handleMenuItemClick(itemId);
      } else {
        alert('Cet article n\'est plus disponible');
      }
    });
  });
};

// Gestion du clic sur un item du menu
const handleMenuItemClick = (itemId, selectedSupplements = []) => {
  const tableNumber = getSelectedTable();
  if (!tableNumber) {
    alert(t('selectTable'));
    return;
  }
  
  const menuItem = getMenu().find(item => item.id === itemId);
  if (!menuItem) return;
  
  // Clonage profond pour éviter la mutation du menu
  const itemToAdd = JSON.parse(JSON.stringify(menuItem));

  // Appliquer les suppléments sélectionnés (si fournis)
  itemToAdd.supplements = selectedSupplements;
  let supplementTotal = 0;
  if (selectedSupplements && selectedSupplements.length > 0 && menuItem.supplements) {
    supplementTotal = selectedSupplements.reduce((sum, suppId) => {
      const supp = menuItem.supplements.find(s => s.id === suppId);
      return sum + (supp ? supp.price : 0);
    }, 0);
  }
  itemToAdd.price = menuItem.price + supplementTotal;
  
  console.log('🛒 Envoi item avec suppléments:', {
    id: itemId,
    basePrice: menuItem.price,
    supplements: selectedSupplements,
    supplementTotal,
    finalPrice: itemToAdd.price
  });
  
  // Envoyer au serveur WebSocket - il renverra l'état complet
  const success = sendAddItem(tableNumber, itemToAdd);
  
  if (success) {
    // Demander la mise à jour du menu pour refléter les nouvelles quantités
    requestMenu();
  } else {
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
  
  const orderHtml = currentOrder.items.map((item, index) => {
    const modifications = getItemModifications(item);
    const hasModifications = modifications.removed.length > 0 || modifications.added.length > 0 || modifications.supplements.length > 0;
    
    // Debug: afficher si des modifications sont détectées
    if (hasModifications) {
      console.log('🎯 Item avec modifications:', item.id, modifications);
    }
    
    return `
      <div class="order-item">
        <div class="order-item-main">
          <div class="order-item-info">
            <span class="order-item-name">${item.name[getCurrentLanguage()]}</span>
            <span class="order-item-price">${formatPrice(item.price)}</span>
          </div>
          <div class="order-item-actions">
            <button class="edit-item-btn" data-item-index="${index}" title="Modifier les ingrédients">
              ✏️
            </button>
            <button class="cancel-item-btn" data-item-index="${index}">
              ${t('cancel')}
            </button>
          </div>
        </div>
        ${hasModifications ? `
          <div class="item-modifications">
            ${modifications.removed.length > 0 ? `
              <div class="modification-group">
                <span class="modification-label">${t('removed')}:</span>
                <div class="modification-tags">
                  ${modifications.removed.map(ingredient => `
                    <span class="modification-tag removed">${ingredient}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${modifications.added.length > 0 ? `
              <div class="modification-group">
                <span class="modification-label">${t('added')}:</span>
                <div class="modification-tags">
                  ${modifications.added.map(ingredient => `
                    <span class="modification-tag added">${ingredient}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${modifications.supplements.length > 0 ? `
              <div class="modification-group">
                <span class="modification-label">Suppléments:</span>
                <div class="modification-tags">
                  ${modifications.supplements.map(supplement => `
                    <span class="modification-tag supplement">${supplement.name}${supplement.price ? ` (+${formatPrice(supplement.price)})` : ''}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${modifications.supplementPrice > 0 ? `
              <div class="modification-group">
                <span class="modification-label">Total suppléments:</span>
                <div class="modification-tags">
                  <span class="modification-tag supplement">+${formatPrice(modifications.supplementPrice)}</span>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  elements.orderList.innerHTML = orderHtml;
  elements.orderTotal.textContent = formatPrice(getOrderTotal());
  
  // Ajouter les événements d'annulation et d'édition
  elements.orderList.querySelectorAll('.cancel-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemIndex = parseInt(btn.dataset.itemIndex);
      handleCancelItem(itemIndex);
    });
  });
  
  elements.orderList.querySelectorAll('.edit-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemIndex = parseInt(btn.dataset.itemIndex);
      handleEditItem(itemIndex);
    });
  });
};

// Obtenir les modifications d'un item
const getItemModifications = (item) => {
  const removed = item.ingredientsRemoved || item.removedIngredients || [];
  const added = item.ingredientsAdded || item.addedIngredients || [];

  // Debug: afficher les modifications trouvées
  if (removed.length > 0 || added.length > 0 || item.supplementPrice > 0) {
    console.log('🔍 Modifications trouvées pour', item.id, ':', { removed, added, supplementPrice: item.supplementPrice });
  }

  // Récupérer les informations des suppléments depuis le menu original
  const menuItem = getMenu().find(menuItem => menuItem.id === item.id);
  const supplements = [];

  if (item.supplements && Array.isArray(item.supplements) && item.supplements.length > 0 && menuItem && menuItem.supplements) {
    item.supplements.forEach(supplementId => {
      const supplement = menuItem.supplements.find(s => s.id === supplementId);
      if (supplement) {
        supplements.push({
          name: supplement.name || supplement.id,
          price: supplement.price || 0
        });
      }
    });
  }

  // Calculer le prix total des suppléments en fonction du nombre d'ingrédients ajoutés
  const supplementTotal = (item.supplementPrice || 0) * (added.length || 0);

  return {
    removed: removed.map(id => {
      const ingredient = getIngredients().find(ing => ing.id === id);
      return ingredient ? ingredient.name[getCurrentLanguage()] : id;
    }),
    added: added.map(id => {
      const ingredient = getIngredients().find(ing => ing.id === id);
      return ingredient ? ingredient.name[getCurrentLanguage()] : id;
    }),
    supplements,
    supplementPrice: supplementTotal
  };
};

// Gestion de l'annulation d'un item
const handleCancelItem = (itemIndex) => {
  const tableNumber = getSelectedTable();
  const currentOrder = getCurrentOrder();
  
  if (currentOrder && currentOrder.items && currentOrder.items[itemIndex]) {
    const itemToRemove = currentOrder.items[itemIndex];
    
    // Envoyer la demande d'annulation au serveur - il renverra l'état complet
    const success = sendRemoveItem(tableNumber, itemToRemove);
    
    if (success) {
      // Demander la mise à jour du menu pour refléter les nouvelles quantités
      requestMenu();
    } else {
      alert('Erreur de connexion - Impossible d\'annuler l\'article');
    }
  }
};

// Gestion de l'édition d'un item
const handleEditItem = (itemIndex) => {
  // Obtenir l'objet de commande agrégé pour trouver l'item sur lequel on a cliqué
  const aggregatedOrder = getCurrentOrder(); 
  if (!aggregatedOrder || !aggregatedOrder.items[itemIndex]) return;
  const clickedItem = aggregatedOrder.items[itemIndex];

  // Obtenir la commande parente spécifique en utilisant l'index
  const parentOrder = getCurrentOrder(itemIndex);
  if (!parentOrder) return;

  // L'item original n'a pas la propriété 'parentOrder', nous le trouvons dans la commande parente
  // Ceci est nécessaire car `showIngredientEditor` a besoin de l'objet item original.
  const originalItem = parentOrder.items.find(item => 
    item.id === clickedItem.id && (!item.timestamp || item.timestamp === clickedItem.timestamp)
  );

  if (originalItem) {
    showIngredientEditor(originalItem, parentOrder);
  } else {
    console.error("Impossible de retrouver l'item original dans la commande parente.");
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

// Notification de succès pour les modifications
const showModificationSuccessNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'modification-success-notification';
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    font-size: 0.9rem;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  `;
  notification.textContent = '✅ Modification enregistrée';
  
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
  updateTableDisplay(getTotalTables());
  // Recalculer le rendu de monnaie
  calculateChange();
};

// Mise à jour complète de l'interface
export const updateUI = () => {
  // Mettre à jour les textes traduits
  document.querySelector('[data-translate="menu"]').textContent = t('menu');
  document.querySelector('[data-translate="order"]').textContent = t('order');
  document.querySelector('[data-translate="total"]').textContent = t('total');
  
  // Mettre à jour les options de catégories avec la nouvelle langue
  generateCategoryOptions();
  
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

// Afficher l'éditeur d'ingrédients
const showIngredientEditor = (item, order) => {
  const ingredients = getIngredients();
  const originalIngredients = item.ingredients || [];
  // Récupérer les modifications existantes (support des deux formats)
  const removedIngredients = item.ingredientsRemoved || item.removedIngredients || [];
  const addedIngredients = item.ingredientsAdded || item.addedIngredients || [];
  
  // Debug: afficher les modifications trouvées
  console.log('🔍 Éditeur - Item:', item.id);
  console.log('🔍 Éditeur - Ingrédients originaux:', originalIngredients);
  console.log('🔍 Éditeur - Ingrédients retirés:', removedIngredients);
  console.log('🔍 Éditeur - Ingrédients ajoutés:', addedIngredients);
  
  // Créer la modal
  const modal = document.createElement('div');
  modal.className = 'ingredient-editor-modal';
  modal.innerHTML = `
    <div class="ingredient-editor-content">
      <div class="ingredient-editor-header">
        <h3>${t('editTitle')} ${item.name[getCurrentLanguage()]}</h3>
        <button class="close-editor-btn">✕</button>
      </div>
      
      <div class="ingredient-sections">
        <div class="ingredient-section">
          <h4>${t('originalIngredients')}</h4>
          <div class="original-ingredients">
            ${originalIngredients.map(ingredientId => {
              const ingredient = ingredients.find(ing => ing.id === ingredientId);
              const isRemoved = removedIngredients.includes(ingredientId);
              return `
                <label class="ingredient-checkbox ${isRemoved ? 'removed' : ''}">
                  <input type="checkbox" 
                         data-ingredient-id="${ingredientId}" 
                         ${!isRemoved ? 'checked' : ''} 
                         class="original-ingredient-checkbox">
                  <span>${ingredient ? ingredient.name[getCurrentLanguage()] : ingredientId}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
        
        <div class="ingredient-section">
          <h4>${t('addIngredients')}</h4>
          <div class="add-ingredient-controls">
            <select class="add-ingredient-select">
              <option value="">${t('selectIngredient')}</option>
              ${ingredients
                .filter(ing => !originalIngredients.includes(ing.id) && !addedIngredients.includes(ing.id))
                .map(ing => `<option value="${ing.id}">${ing.name[getCurrentLanguage()]}</option>`)
                .join('')}
            </select>
            <button class="add-ingredient-btn">${t('add')}</button>
          </div>
          <div class="added-ingredients">
            ${addedIngredients.map(ingredientId => {
              const ingredient = ingredients.find(ing => ing.id === ingredientId);
              return `
                <div class="added-ingredient-tag">
                  <span>${ingredient ? ingredient.name[getCurrentLanguage()] : ingredientId}</span>
                  <button class="remove-added-ingredient" data-ingredient-id="${ingredientId}">✕</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      
      <div class="ingredient-editor-actions">
        <button class="save-modifications-btn">${t('save')}</button>
        <button class="cancel-modifications-btn">${t('cancelMod')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Gestionnaires d'événements
  const closeBtn = modal.querySelector('.close-editor-btn');
  const cancelBtn = modal.querySelector('.cancel-modifications-btn');
  const saveBtn = modal.querySelector('.save-modifications-btn');
  const addBtn = modal.querySelector('.add-ingredient-btn');
  const addSelect = modal.querySelector('.add-ingredient-select');
  const originalCheckboxes = modal.querySelectorAll('.original-ingredient-checkbox');
  
  // Fermer la modal
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Gestion des ingrédients originaux (retrait)
  originalCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const label = checkbox.closest('.ingredient-checkbox');
      if (checkbox.checked) {
        label.classList.remove('removed');
      } else {
        label.classList.add('removed');
      }
    });
  });
  
  // Ajouter un ingrédient
  addBtn.addEventListener('click', () => {
    const selectedId = addSelect.value;
    if (!selectedId) return;
    
    const ingredient = ingredients.find(ing => ing.id === selectedId);
    const addedContainer = modal.querySelector('.added-ingredients');
    
    const newTag = document.createElement('div');
    newTag.className = 'added-ingredient-tag';
    newTag.innerHTML = `
      <span>${ingredient ? ingredient.name[getCurrentLanguage()] : selectedId}</span>
      <button class="remove-added-ingredient" data-ingredient-id="${selectedId}">✕</button>
    `;
    
    addedContainer.appendChild(newTag);
    addSelect.value = '';
    
    // Mettre à jour les options disponibles
    updateAddIngredientOptions(modal);
  });
  
  // Supprimer un ingrédient ajouté
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-added-ingredient')) {
      e.target.closest('.added-ingredient-tag').remove();
      updateAddIngredientOptions(modal);
    }
  });
  
  // Sauvegarder les modifications
  saveBtn.addEventListener('click', () => {
    const removedIngredients = [];
    const addedIngredients = [];
    
    // Collecter les ingrédients retirés
    originalCheckboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        removedIngredients.push(checkbox.dataset.ingredientId);
      }
    });
    
    // Collecter les ingrédients ajoutés
    modal.querySelectorAll('.added-ingredient-tag').forEach(tag => {
      const ingredientId = tag.querySelector('.remove-added-ingredient').dataset.ingredientId;
      addedIngredients.push(ingredientId);
    });
    
    // Désactiver le bouton pendant l'envoi
    saveBtn.disabled = true;
    saveBtn.textContent = 'Envoi...';
    
    // Mettre à jour l'item
    updateItemIngredients(item, order, removedIngredients, addedIngredients);
    
    // Fermer la modal après un court délai pour permettre l'envoi
    setTimeout(() => {
      closeModal();
      showModificationSuccessNotification();
    }, 500);
  });
  
  // Mettre à jour les options d'ajout d'ingrédients
  updateAddIngredientOptions(modal);
};

// Mettre à jour les options d'ajout d'ingrédients
const updateAddIngredientOptions = (modal) => {
  const ingredients = getIngredients();
  const originalIngredients = Array.from(modal.querySelectorAll('.original-ingredient-checkbox'))
    .map(cb => cb.dataset.ingredientId);
  const addedIngredients = Array.from(modal.querySelectorAll('.added-ingredient-tag'))
    .map(tag => tag.querySelector('.remove-added-ingredient').dataset.ingredientId);
  
  const select = modal.querySelector('.add-ingredient-select');
  const availableIngredients = ingredients.filter(ing => 
    !originalIngredients.includes(ing.id) && !addedIngredients.includes(ing.id)
  );
  
  select.innerHTML = `
    <option value="">${t('selectIngredient')}</option>
    ${availableIngredients.map(ing => `<option value="${ing.id}">${ing.name[getCurrentLanguage()]}</option>`).join('')}
  `;
};

// Récupérer le timestamp original d'un item
const getOriginalTimestamp = (item, order) => {
  // Priorité 1: timestamp de l'item lui-même
  if (item.timestamp) {
    return item.timestamp;
  }
  
  // Priorité 2: timestamp de la commande
  if (order.timestamp) {
    return order.timestamp;
  }
  
  // Priorité 3: orderId de la commande (si c'est un timestamp)
  if (order.orderId) {
    const timestampFromOrderId = parseInt(order.orderId.split('_')[1]);
    if (!isNaN(timestampFromOrderId)) {
      return timestampFromOrderId;
    }
  }
  
  return null;
};

// Mettre à jour les ingrédients d'un item
const updateItemIngredients = (item, order, removedIngredients, addedIngredients) => {
  const originalTimestamp = order.timestamp || (order.orderId ? order.orderId.split('_')[1] : null);

  if (!originalTimestamp) {
    console.error('❌ Impossible de trouver le timestamp original pour la modification');
    alert('Erreur - Impossible de modifier cet article (timestamp manquant)');
    return;
  }
  
  // Envoyer la modification au serveur
  sendModifyItem(originalTimestamp, item, removedIngredients, addedIngredients);
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