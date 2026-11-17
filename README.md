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
- `words.js` — listes de mots (généré, ne pas modifier à la main)
- `tools/` — génération des listes de mots

## Listes de mots

- **Solutions** (~1 240 mots courants) : `tools/solutions.txt`, triées à la main à partir des
  mots de 5 lettres les plus fréquents (liste [FrequencyWords](https://github.com/hermitdave/FrequencyWords)).
- **Propositions acceptées** (~5 900 mots, conjugaisons et pluriels compris) : tous les mots de
  5 lettres du dictionnaire [an-array-of-french-words](https://www.npmjs.com/package/an-array-of-french-words)
  (licence MIT), plus les ajouts de `tools/extra-guesses.txt`.

Pour ajouter des mots, modifiez `tools/solutions.txt` ou `tools/extra-guesses.txt`, puis régénérez :

```sh
npm pack an-array-of-french-words && tar xzf an-array-of-french-words-*.tgz
node tools/build-words.mjs package/index.json
```
