const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const FLIP_DELAY = 300; // ms entre chaque tuile retournée
const STATS_KEY = "wordle-fr-stats";

const KEYBOARD_LAYOUT = [
  ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
  ["ENTRER", "W", "X", "C", "V", "B", "N", "⌫"],
];

// Priorité des états pour colorer le clavier (on ne rétrograde jamais une touche).
const STATE_RANK = { absent: 1, present: 2, correct: 3 };

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const messageEl = document.getElementById("message");
const modalEl = document.getElementById("modal");

let solution = "";
let guesses = [];
let currentGuess = "";
let gameOver = false;
let revealing = false;
let messageTimer = null;

/**
 * Compare une proposition à la solution.
 * Deux passes pour gérer correctement les lettres en double :
 * d'abord les lettres bien placées, puis les lettres mal placées
 * dans la limite des occurrences restantes dans la solution.
 */
function evaluateGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill("absent");
  const remaining = {};

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
    } else {
      remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const letter = guess[i];
    if (remaining[letter] > 0) {
      result[i] = "present";
      remaining[letter]--;
    }
  }

  return result;
}

function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

/**
 * Ajuste la page à la hauteur réellement visible, puis calcule la taille
 * des tuiles pour que la grille tienne dans l'espace laissé par le clavier.
 * Fait en JS car les unités CSS récentes (dvh, cqh) ne sont pas fiables
 * sur tous les navigateurs mobiles.
 */
function fitLayout() {
  const root = document.documentElement;
  root.style.setProperty("--app-height", `${window.innerHeight}px`);

  const container = boardEl.parentElement;
  const gap = 6;
  const fromWidth = (container.clientWidth - gap * (WORD_LENGTH - 1)) / WORD_LENGTH;
  const fromHeight = (container.clientHeight - 16 - gap * (MAX_GUESSES - 1)) / MAX_GUESSES;
  const size = Math.floor(Math.max(24, Math.min(62, fromWidth, fromHeight)));
  root.style.setProperty("--tile", `${size}px`);
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  for (const keys of KEYBOARD_LAYOUT) {
    const row = document.createElement("div");
    row.className = "kb-row";
    for (const key of keys) {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.textContent = key;
      btn.dataset.key = key;
      if (key === "ENTRER" || key === "⌫") btn.classList.add("wide");
      if (key === "⌫") btn.setAttribute("aria-label", "Effacer");
      btn.addEventListener("click", () => {
        btn.blur();
        handleKey(key);
      });
      row.appendChild(btn);
    }
    keyboardEl.appendChild(row);
  }
}

function newGame() {
  solution = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
  guesses = [];
  currentGuess = "";
  gameOver = false;
  revealing = false;
  modalEl.classList.add("hidden");
  clearTimeout(messageTimer);
  messageEl.classList.remove("visible");
  buildBoard();
  buildKeyboard();
}

function handleKey(key) {
  if (gameOver || revealing) return;

  if (key === "ENTRER") {
    submitGuess();
  } else if (key === "⌫") {
    if (currentGuess.length > 0) {
      currentGuess = currentGuess.slice(0, -1);
      updateCurrentRow();
    }
  } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
    currentGuess += key;
    updateCurrentRow();
  }
}

function updateCurrentRow() {
  const row = boardEl.children[guesses.length];
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = row.children[i];
    const letter = currentGuess[i] || "";
    tile.textContent = letter;
    tile.classList.toggle("filled", letter !== "");
  }
}

function submitGuess() {
  const row = boardEl.children[guesses.length];

  if (currentGuess.length < WORD_LENGTH) {
    showMessage("Pas assez de lettres");
    shakeRow(row);
    return;
  }
  if (!VALID_GUESSES.has(currentGuess)) {
    showMessage("Mot inconnu");
    shakeRow(row);
    return;
  }

  const guess = currentGuess;
  const result = evaluateGuess(guess, solution);
  guesses.push(guess);
  currentGuess = "";
  revealRow(row, guess, result);
}

function revealRow(row, guess, result) {
  revealing = true;
  [...row.children].forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.add("flip");
      // Change la couleur à mi-rotation.
      setTimeout(() => tile.classList.add(result[i]), 250);
    }, i * FLIP_DELAY);
  });

  setTimeout(() => {
    revealing = false;
    updateKeyboard(guess, result);
    checkEnd(row, guess);
  }, WORD_LENGTH * FLIP_DELAY + 250);
}

function updateKeyboard(guess, result) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const key = keyboardEl.querySelector(`[data-key="${guess[i]}"]`);
    if (!key) continue;
    const current = key.dataset.state;
    if (!current || STATE_RANK[result[i]] > STATE_RANK[current]) {
      key.classList.remove("absent", "present", "correct");
      key.classList.add(result[i]);
      key.dataset.state = result[i];
    }
  }
}

function checkEnd(row, guess) {
  if (guess === solution) {
    gameOver = true;
    row.classList.add("win");
    const praise = ["Génial !", "Magnifique !", "Impressionnant !", "Splendide !", "Bravo !", "Ouf !"];
    showMessage(praise[guesses.length - 1]);
    recordResult(true);
    setTimeout(() => showModal(true), 1500);
  } else if (guesses.length >= MAX_GUESSES) {
    gameOver = true;
    showMessage(solution, 2500);
    recordResult(false);
    setTimeout(() => showModal(false), 1500);
  }
}

function shakeRow(row) {
  row.classList.remove("shake");
  void row.offsetWidth; // relance l'animation
  row.classList.add("shake");
}

function showMessage(text, duration = 1500) {
  messageEl.textContent = text;
  messageEl.classList.add("visible");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => messageEl.classList.remove("visible"), duration);
}

function loadStats() {
  const empty = { played: 0, wins: 0, streak: 0, best: 0 };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(STATS_KEY)) };
  } catch {
    return empty;
  }
}

function recordResult(won) {
  const stats = loadStats();
  stats.played++;
  if (won) {
    stats.wins++;
    stats.streak++;
    stats.best = Math.max(stats.best, stats.streak);
  } else {
    stats.streak = 0;
  }
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Stockage indisponible (navigation privée…) : on ignore.
  }
}

function showModal(won) {
  const stats = loadStats();
  document.getElementById("modal-title").textContent = won ? "Bravo !" : "Perdu…";
  document.getElementById("modal-word").innerHTML = won
    ? `Trouvé en <strong>${guesses.length}</strong> essai${guesses.length > 1 ? "s" : ""}.`
    : `Le mot était <strong>${solution}</strong>.`;
  document.getElementById("stat-played").textContent = stats.played;
  document.getElementById("stat-winrate").textContent =
    stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  document.getElementById("stat-streak").textContent = stats.streak;
  document.getElementById("stat-best").textContent = stats.best;
  modalEl.classList.remove("hidden");
  document.getElementById("replay").focus();
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!modalEl.classList.contains("hidden")) return;

  if (e.key === "Enter") {
    e.preventDefault();
    handleKey("ENTRER");
  } else if (e.key === "Backspace") {
    handleKey("⌫");
  } else {
    // Retire les accents (é → E) pour accepter toute saisie.
    const letter = e.key.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
    if (/^[A-Z]$/.test(letter)) handleKey(letter);
  }
});

document.getElementById("replay").addEventListener("click", newGame);
document.getElementById("new-game").addEventListener("click", (e) => {
  e.currentTarget.blur();
  newGame();
});

window.addEventListener("resize", fitLayout);
if (window.visualViewport) window.visualViewport.addEventListener("resize", fitLayout);

newGame();
fitLayout();
