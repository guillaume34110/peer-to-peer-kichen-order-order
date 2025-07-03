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

// Gestion du nombre de tables
export const getTableCount = () => {
  const stored = localStorage.getItem('tableCount');
  return stored ? parseInt(stored) : 6;
};

export const setTableCount = (count) => {
  const newCount = Math.max(1, Math.min(50, count)); // Min 1, max 50
  localStorage.setItem('tableCount', newCount.toString());
  return newCount;
}; 