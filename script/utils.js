import { getCurrentLanguage } from './i18n.js';

// Générer un identifiant unique pour les commandes
export const generateOrderId = () => {
  return 'order_' + Math.random().toString(36).substring(2, 15);
};

// Obtenir un timestamp pour les commandes
export const getCurrentTimestamp = () => {
  return Date.now();
};

// Formater un prix en euros
export const formatPrice = (price) => {
  if (price === undefined || price === null) {
    console.warn('⚠️ Prix indéfini ou null');
    return '0 ฿';
  }
  
  // Fix: Si le prix est une chaîne, le convertir en nombre
  if (typeof price === 'string') {
    price = parseFloat(price.replace(',', '.'));
  }
  
  if (isNaN(price)) {
    console.warn('⚠️ Prix invalide:', price);
    return '0 ฿';
  }
  
  const options = {};
  
  // Si le prix est un entier, ne pas afficher de décimales
  if (price % 1 === 0) {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  } else {
    options.minimumFractionDigits = 2;
    options.maximumFractionDigits = 2;
  }

  // Utiliser toLocaleString pour le formatage correct par pays
  const formattedPrice = price.toLocaleString('fr-FR', options);
  
  return `${formattedPrice} ฿`;
};

// Vérifier et formater une image base64
export const validateImageBase64 = (imageData) => {
  // Image par défaut en cas d'échec
  const defaultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAA70lEQVR4nO3bQQ0AIRAEwcMJBCEIOeAfy/yoqiTz2Gzft3Ngzm8HwF+GMGEIExbTqE/fvrubhbxlCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwYQgThjBhCBOGMGEIE4YwMfc2GNluAeo/AAAAAElFTkSuQmCC';
  
  console.log(`🖼️ Validation de l'image (entrée):`, typeof imageData === 'string' ? imageData.substring(0, 70) + '...' : 'Pas une chaîne');

  if (!imageData) {
    console.warn('⚠️ Image manquante, utilisation de l\'image par défaut');
    return defaultImage;
  }
  
  // Vérifier si c'est déjà un format base64 correct
  if (imageData.startsWith('data:image/')) {
    console.log('🖼️ Validation: Image déjà au format base64 correct.');
    return imageData;
  }
  
  // Si c'est une URL traditionnelle
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    console.warn('⚠️ URL d\'image détectée au lieu de base64:', imageData);
    return defaultImage;
  }
  
  // Si c'est une chaîne base64 sans en-tête, ajouter l'en-tête
  try {
    if (!imageData.includes(';base64,')) {
      // Essayer de détecter le type d'image (simple heuristique)
      // Par défaut, considérer comme jpeg
      console.log('🖼️ Validation: Ajout de l\'en-tête "data:image/jpeg;base64,".');
      return `data:image/jpeg;base64,${imageData}`;
    }
    return imageData;
  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'image:', error);
    return defaultImage;
  }
};

// --- LocalStorage Helpers ---

/**
 * Sauvegarde une valeur dans le localStorage après l'avoir convertie en JSON.
 * @param {string} key - La clé sous laquelle sauvegarder les données.
 * @param {*} value - La valeur à sauvegarder.
 */
export const setItemInLocalStorage = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de "${key}" dans le localStorage:`, error);
  }
};

/**
 * Récupère une valeur depuis le localStorage et la parse depuis JSON.
 * @param {string} key - La clé à récupérer.
 * @returns {*} La valeur désérialisée, ou null si la clé n'existe pas ou en cas d'erreur.
 */
export const getItemFromLocalStorage = (key) => {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return null;
    }
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de "${key}" depuis le localStorage:`, error);
    return null;
  }
}; 