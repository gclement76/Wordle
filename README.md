# Wordle FR

Un jeu Wordle en français, en HTML/CSS/JavaScript pur, sans dépendance.

## Jouer

Ouvrez simplement `index.html` dans un navigateur (ou publiez le dépôt avec GitHub Pages).

## Règles

- Trouvez le mot de 5 lettres en 6 essais maximum.
- Après chaque proposition, les lettres se colorent :
  - 🟩 **vert** : la lettre est dans le mot, à la bonne place ;
  - 🟨 **jaune** : la lettre est dans le mot, mais mal placée ;
  - ⬛ **gris** : la lettre n'est pas dans le mot.
- Les mots sont sans accents (É = E). Chaque proposition doit être un mot du dictionnaire.
- Cliquez sur « Rejouer » (ou ↻) pour un nouveau mot aléatoire.

Les statistiques (parties, victoires, séries) sont enregistrées dans le navigateur.

## Fichiers

- `index.html` — structure de la page
- `style.css` — mise en forme (thème clair/sombre automatique)
- `game.js` — logique du jeu
- `words.js` — listes de mots (solutions et propositions acceptées)
