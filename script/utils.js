// Génération d'un ID unique pour les commandes
export const generateOrderId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Génération d'un timestamp Unix
export const getCurrentTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

// Formatage du prix en devise locale
export const formatPrice = (price, currency = '฿') => {
  return `${price} ${currency}`;
}; 