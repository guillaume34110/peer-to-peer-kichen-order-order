# Kitchen Sender 🍽️

Application web front-end pour la prise de commande côté salle d'un restaurant. Fonctionne 100% en local sur un réseau LAN et communique avec un serveur WebSocket local.

## 🎯 Fonctionnalités

- **Sélection de table** - Choix du numéro de table pour la commande
- **Menu multilingue** - Interface disponible en français et thaï
- **Grille de produits scrollable** - Interface tactile pour tablettes/mobiles
- **Gestion de commande en temps réel** - Ajout et annulation d'articles
- **Communication WebSocket** - Envoi immédiat vers le serveur local
- **Interface responsive** - Optimisée pour mobile, tablette et desktop

## 🧩 Architecture

```
kitchen-sender/
├── index.html              # Page principale
├── script/
│   ├── app.js              # Point d'entrée de l'application
│   ├── websocket.js        # Gestion WebSocket
│   ├── state.js            # État de l'application
│   ├── ui.js               # Interface utilisateur
│   ├── menu.js             # Données du menu
│   ├── i18n.js             # Internationalisation
│   └── utils.js            # Fonctions utilitaires
├── data/
│   └── lang.json           # Traductions FR/TH
├── styles/
│   └── main.css            # Styles CSS
└── README.md
```

## 🚀 Installation et Utilisation

### Prérequis
- Serveur WebSocket local sur le port 3000
- Serveur web local (ou ouverture directe du fichier HTML dans un navigateur moderne)

### Démarrage rapide

1. **Cloner ou télécharger** ce dossier sur votre machine
2. **Servir les fichiers** via un serveur web local :
   ```bash
   # Avec Python 3
   python -m http.server 8080
   
   # Avec Node.js (live-server)
   npx live-server --port=8080
   
   # Ou simplement ouvrir index.html dans un navigateur
   ```

3. **Démarrer votre serveur WebSocket** sur `ws://localhost:3000`

4. **Accéder à l'application** via `http://localhost:8080`

### Configuration du serveur WebSocket

L'application tentera de se connecter automatiquement à :
```
ws://<hostname>:3000
```

Où `<hostname>` est automatiquement détecté (généralement `localhost` en local).

## 📡 Messages envoyés au serveur

### Ajout d'un produit
```json
{
  "table": 4,
  "timestamp": 1720001234,
  "item": {
    "id": "cafe",
    "price": 50,
    "name": {
      "fr": "Café",
      "th": "กาแฟ"
    }
  }
}
```

### Annulation d'un produit
```json
{
  "table": 4,
  "timestamp": 1720001234,
  "action": "remove",
  "item": {
    "id": "cafe",
    "price": 50,
    "name": {
      "fr": "Café",
      "th": "กาแฟ"
    }
  }
}
```

### Demande d'état
```json
{
  "action": "getState",
  "timestamp": 1720001234
}
```

## 📡 Format attendu du serveur

Le serveur doit **toujours** renvoyer l'état complet sous cette forme :

```json
{
  "orders": [
    {
      "orderId": "abc123",
      "table": 4,
      "items": [
        {
          "id": "cafe",
          "price": 50,
          "name": {
            "fr": "Café",
            "th": "กาแฟ"
          }
        },
        {
          "id": "tea",
          "price": 40,
          "name": {
            "fr": "Thé",
            "th": "ชา"
          }
        }
      ]
    },
    {
      "orderId": "def456",
      "table": 7,
      "items": [
        {
          "id": "pizza",
          "price": 220,
          "name": {
            "fr": "Pizza",
            "th": "พิซซ่า"
          }
        }
      ]
    }
  ]
}
```

## 🔄 Synchronisation automatique

L'application écoute en permanence les mises à jour depuis d'autres clients :

```javascript
// Détection automatique des mises à jour d'état
socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    
    if (data.orders && Array.isArray(data.orders)) {
      console.log('📦 État mis à jour reçu de la kitchen:', data);
      handleKitchenStateUpdate(data.orders);
    }
  } catch (error) {
    console.error('Erreur parsing message:', error);
  }
};
```

### Comportement :
- **Ajouts/suppressions** depuis d'autres clients visibles immédiatement
- **Notifications discrètes** en haut à droite lors des mises à jour
- **Pas d'interruption** de l'expérience utilisateur
- **Logs détaillés** dans la console pour le débogage

## 🍽️ Utilisation

1. **Sélectionner une table** dans le menu déroulant
2. **Choisir la langue** (FR/TH) si nécessaire
3. **Cliquer sur les produits** du menu pour les ajouter à la commande
4. **Consulter la commande en cours** dans le panneau de droite
5. **Annuler des articles** avec le bouton "Annuler" si nécessaire

### 🔄 Flux de données

- Les articles sont **envoyés immédiatement** au serveur WebSocket lors du clic
- Le serveur **renvoie toujours l'état complet** de toutes les commandes
- L'application **se synchronise** automatiquement avec l'état reçu du serveur
- **Mises à jour en temps réel** : changements depuis d'autres clients répercutés automatiquement
- Demande automatique de l'état lors de la connexion et du changement de table
- **Notifications visuelles** lors des mises à jour automatiques d'état

## 🔧 Personnalisation

### Ajouter des produits au menu
Éditer le fichier `script/menu.js` :

```javascript
export const menuItems = [
  {
    id: "nouveau_produit",
    price: 120,
    name: {
      fr: "Nouveau Produit",
      th: "ผลิตภัณฑ์ใหม่"
    }
  },
  // ... autres produits
];
```

### Ajouter des traductions
Éditer le fichier `data/lang.json` :

```json
{
  "fr": {
    "nouveauTexte": "Nouveau texte en français"
  },
  "th": {
    "nouveauTexte": "ข้อความใหม่เป็นภาษาไทย"
  }
}
```

### Personnaliser les styles
Éditer le fichier `styles/main.css` pour modifier l'apparence.

## 🌐 Compatibilité

- **Navigateurs modernes** supportant ES6 modules
- **Responsive design** pour mobile, tablette et desktop
- **WebSocket** natif du navigateur
- **Pas de dépendances externes**

## 🔍 Débogage

La console du navigateur affiche des informations détaillées :
- État de la connexion WebSocket
- Messages envoyés/reçus
- Erreurs éventuelles

Ouvrir les **Outils de développement** (F12) pour consulter les logs.

## 📱 Interface

- **Design moderne** avec animations fluides
- **Couleurs sobres** (crème, bleu, gris)
- **Interactions tactiles** optimisées pour tablettes
- **Notifications visuelles** lors d'ajout d'articles
- **Indicateur de connexion** en temps réel 