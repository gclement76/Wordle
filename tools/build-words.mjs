// Génère words.js à partir d'un dictionnaire français et de la liste des solutions.
//
// Usage :
//   node tools/build-words.mjs <index.json> [fr_50k.txt]
//
// - <index.json> : dictionnaire du paquet npm « an-array-of-french-words » (licence MIT).
// - [fr_50k.txt] : facultatif, liste de fréquence hermitdave/FrequencyWords. Si elle est
//   fournie, le script écrit aussi tools/candidates.txt (mots courants triés par
//   fréquence) pour aider à compléter tools/solutions.txt à la main.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [dictPath, freqPath] = process.argv.slice(2);
if (!dictPath) {
  console.error("Usage : node tools/build-words.mjs <index.json> [fr_50k.txt]");
  process.exit(1);
}

// Majuscules sans accents (É → E, Ç → C, Œ → OE, Æ → AE).
function normalize(word) {
  return word
    .toUpperCase()
    .replace(/Œ/g, "OE")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const isValid = (w) => /^[A-Z]{5}$/.test(w);

const dictionary = new Set(
  JSON.parse(readFileSync(dictPath, "utf8")).map(normalize).filter(isValid)
);

const readList = (file) =>
  readFileSync(join(here, file), "utf8").split(/\s+/).map(normalize).filter(isValid);

const solutions = [...new Set(readList("solutions.txt"))].sort();

// Mots absents du dictionnaire mais acceptés quand même (ajouts manuels).
for (const word of readList("extra-guesses.txt")) dictionary.add(word);

const extra = [...dictionary].filter((w) => !solutions.includes(w)).sort();

if (freqPath) {
  const known = new Set(solutions);
  const candidates = readFileSync(freqPath, "utf8")
    .split("\n")
    .map((line) => normalize(line.split(" ")[0] || ""))
    .filter((w) => isValid(w) && dictionary.has(w) && !known.has(w));
  writeFileSync(join(here, "candidates.txt"), [...new Set(candidates)].join("\n") + "\n");
}

// Mise en forme : 14 mots par ligne, comme avant.
const block = (words) => {
  const lines = [];
  for (let i = 0; i < words.length; i += 14) lines.push(words.slice(i, i + 14).join(" "));
  return lines.join("\n");
};

const output = `// Fichier généré par tools/build-words.mjs : ne pas modifier à la main.
// Mots français de 5 lettres, en majuscules et sans accents.

// Mots pouvant être tirés comme solution (mots courants, liste : tools/solutions.txt).
const SOLUTIONS = \`
${block(solutions)}
\`.trim().split(/\\s+/);

// Autres mots acceptés comme proposition (dictionnaire « an-array-of-french-words », MIT).
const EXTRA_GUESSES = \`
${block(extra)}
\`.trim().split(/\\s+/);

const VALID_GUESSES = new Set([...SOLUTIONS, ...EXTRA_GUESSES]);
`;

writeFileSync(join(here, "..", "words.js"), output);
console.log(`${solutions.length} solutions, ${solutions.length + extra.length} mots acceptés`);
