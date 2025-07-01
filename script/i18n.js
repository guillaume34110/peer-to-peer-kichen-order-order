// Gestion de l'internationalisation
let translations = {};
let currentLanguage = 'fr';

// Chargement des traductions depuis le fichier JSON
export const loadTranslations = async () => {
  try {
    const response = await fetch('./data/lang.json');
    translations = await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement des traductions:', error);
    // Traductions de fallback
    translations = {
      fr: { error: "Erreur de chargement" },
      th: { error: "ข้อผิดพลาดในการโหลด" }
    };
  }
};

// Obtenir la langue actuelle
export const getCurrentLanguage = () => currentLanguage;

// Changer de langue
export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    return true;
  }
  return false;
};

// Obtenir une traduction
export const t = (key) => {
  return translations[currentLanguage]?.[key] || key;
};

// Obtenir les langues disponibles
export const getAvailableLanguages = () => {
  return Object.keys(translations);
}; 