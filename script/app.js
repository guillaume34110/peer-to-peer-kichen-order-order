// Application principale - Point d'entrée
import { loadTranslations } from './i18n.js';
import { initializeUI} from './ui.js';
import { initializeWebSocket, requestState, requestMenu, requestIngredients } from './websocket.js';
import { getConnectionStatus } from './state.js';

// Initialisation de l'application
const initializeApp = async () => {
  try {
    console.log('🚀 Démarrage de Kitchen Sender...');
    
    // Chargement des traductions
    console.log('📖 Chargement des traductions...');
    await loadTranslations();
    
    // Initialisation de l'interface utilisateur
    console.log('🖥️ Initialisation de l\'interface...');
    initializeUI();
    
    // Initialisation de la connexion WebSocket
    console.log('🔌 Connexion au serveur WebSocket...');
    initializeWebSocket();
    
    // Écouter l'état de la connexion pour demander les données
    window.addEventListener('websocket-status', (event) => {
      if (event.detail === 'connected') {
        console.log('📊 Demande de l\'état initial, du menu et des ingrédients...');
        requestState();
        requestMenu();
        requestIngredients();
      }
    });
    
  
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
    
    // Affichage d'un message d'erreur à l'utilisateur
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #e74c3c;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    errorMessage.textContent = 'Erreur lors du chargement de l\'application. Veuillez recharger la page.';
    document.body.appendChild(errorMessage);
  }
};

// Démarrage de l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Gestion de la fermeture de l'application
window.addEventListener('beforeunload', () => {
  console.log('🔌 Fermeture de la connexion WebSocket...');
  // La connexion sera fermée automatiquement par le navigateur
}); 