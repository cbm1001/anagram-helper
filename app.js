const MAX_LETTERS = 13;

const input = document.querySelector("#letters");
const ring = document.querySelector("#ring");
const tiles = document.querySelector("#tiles");
const centerWord = document.querySelector("#centerWord");
const shuffleButton = document.querySelector("#shuffle");
const clearButton = document.querySelector("#clear");
const scratch = document.querySelector("#scratch");

let letters = [];
let selectedTileIds = [];
let dragState = null;
let nextTileId = 1;

const cleanLetters = (value) =>
  value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, MAX_LETTERS)
    .split("");

const createTile = (letter) => ({
  id: `tile-${nextTileId++}`,
  letter,
  flipped: false,
});

const word = () => letters.map((tile) => tile.letter).join("");

const noteWord = () =>
  selectedTileIds
    .map((id) => letters.find((tile) => tile.id === id)?.letter)
    .filter(Boolean)
    .join("");

const tileSize = () => {
  const count = Math.max(letters.length, 1);
  const ringSize = ring.getBoundingClientRect().width || 360;
  return Math.max(38, Math.min(66, ringSize * (count > 10 ? 0.105 : 0.12)));
};

const radius = () => {
  const ringSize = ring.getBoundingClientRect().width || 360;
  return ringSize * (letters.length > 9 ? 0.38 : 0.36);
};

const repeatedLetters = () => {
  const counts = letters.reduce((map, tile) => {
    map[tile.letter] = (map[tile.letter] || 0) + 1;
    return map;
  }, {});
  return new Set(Object.keys(counts).filter((letter) => counts[letter] > 1));
};

const setControls = () => {
  const hasLetters = letters.length > 0;
  shuffleButton.disabled = letters.length < 2;
  clearButton.disabled = !hasLetters;
};

const syncScratch = () => {
  scratch.value = noteWord();
};

const renderTiles = () => {
  tiles.innerHTML = "";
  const count = letters.length;
  if (!count) return;

  const size = tileSize();
  const orbit = radius();
  const repeats = repeatedLetters();

  letters.forEach((tileData, index) => {
    const angle = -90 + (360 / count) * index;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.textContent = tileData.flipped ? "" : tileData.letter;
    tile.dataset.index = String(index);
    tile.dataset.id = tileData.id;
    tile.style.setProperty("--tile-size", `${size}px`);
    tile.style.transform = `rotate(${angle}deg) translate(${orbit}px) rotate(${-angle}deg)`;
    tile.setAttribute(
      "aria-label",
      tileData.flipped
        ? `Blank card, position ${index + 1} of ${count}. Click to reveal ${tileData.letter}.`
        : `${tileData.letter}, position ${index + 1} of ${count}. Click to add to working notes.`
    );

    if (repeats.has(tileData.letter)) tile.classList.add("is-repeated");
    if (tileData.flipped) tile.classList.add("is-flipped");

    tile.addEventListener("click", handleTileClick);
    tile.addEventListener("pointerdown", startDrag);
    tile.addEventListener("keydown", handleTileKeydown);
    tiles.appendChild(tile);
  });
};

const render = () => {
  selectedTileIds = selectedTileIds.filter((id) => letters.some((tile) => tile.id === id));
  input.value = word();
  centerWord.textContent = letters.length ? word() : "ANAGRAM";
  syncScratch();
  renderTiles();
  setControls();
};

const shuffle = () => {
  const next = [...letters];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const randomise = () => {
  if (letters.length < 2) return;
  const before = word();
  let next = shuffle();
  let attempts = 0;
  while (next.map((tile) => tile.letter).join("") === before && attempts < 8) {
    next = shuffle();
    attempts += 1;
  }
  letters = next;
  render();
};

const applyInput = () => {
  const next = cleanLetters(input.value);
  if (next.join("") !== word()) {
    letters = next.map(createTile);
    selectedTileIds = [];
  }
  render();
};

const reorder = (fromIndex, toIndex) => {
  if (fromIndex === toIndex || toIndex < 0 || toIndex >= letters.length) return;
  const next = [...letters];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  letters = next;
  render();
};

const toggleTile = (id) => {
  const tile = letters.find((item) => item.id === id);
  if (!tile) return;

  tile.flipped = !tile.flipped;
  if (tile.flipped) {
    selectedTileIds.push(tile.id);
  } else {
    selectedTileIds = selectedTileIds.filter((selectedId) => selectedId !== tile.id);
  }
  render();
};

const angleFromPointer = (event) => {
  const box = ring.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const radians = Math.atan2(event.clientY - cy, event.clientX - cx);
  return ((radians * 180) / Math.PI + 450) % 360;
};

const indexFromPointer = (event) => {
  if (!letters.length) return 0;
  const angle = angleFromPointer(event);
  return Math.round(angle / (360 / letters.length)) % letters.length;
};

function handleTileClick(event) {
  if (event.currentTarget.dataset.skipClick === "true") {
    delete event.currentTarget.dataset.skipClick;
    return;
  }
  toggleTile(event.currentTarget.dataset.id);
}

function startDrag(event) {
  if (letters.length < 2) return;
  const tile = event.currentTarget;
  dragState = {
    fromIndex: Number(tile.dataset.index),
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    tile,
  };
  tile.setPointerCapture(event.pointerId);
  tile.addEventListener("pointermove", moveDrag);
  tile.addEventListener("pointerup", endDrag);
  tile.addEventListener("pointercancel", endDrag);
}

function moveDrag(event) {
  if (!dragState) return;
  const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
  if (distance < 7 && !dragState.moved) return;

  dragState.moved = true;
  dragState.tile.classList.add("is-dragging");
  const size = tileSize();
  const orbit = radius();
  const angle = angleFromPointer(event) - 90;
  dragState.tile.style.setProperty("--tile-size", `${size}px`);
  dragState.tile.style.transform = `rotate(${angle}deg) translate(${orbit}px) rotate(${-angle}deg)`;
}

function endDrag(event) {
  if (!dragState) return;
  const tile = dragState.tile;
  tile.releasePointerCapture(event.pointerId);
  tile.removeEventListener("pointermove", moveDrag);
  tile.removeEventListener("pointerup", endDrag);
  tile.removeEventListener("pointercancel", endDrag);
  tile.classList.remove("is-dragging");

  if (dragState.moved) {
    tile.dataset.skipClick = "true";
    reorder(dragState.fromIndex, indexFromPointer(event));
  }
  dragState = null;
}

function handleTileKeydown(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleTile(event.currentTarget.dataset.id);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    reorder(index, Math.max(0, index - 1));
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    reorder(index, Math.min(letters.length - 1, index + 1));
  }
}

input.addEventListener("input", applyInput);
shuffleButton.addEventListener("click", randomise);

clearButton.addEventListener("click", () => {
  letters = [];
  selectedTileIds = [];
  render();
  input.focus();
});

scratch.addEventListener("input", () => {
  scratch.value = cleanLetters(scratch.value).join("");
});

window.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target === input || event.target === scratch) return;

  if (event.key === " " || event.key.toLowerCase() === "r") {
    event.preventDefault();
    randomise();
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    letters.pop();
    selectedTileIds = selectedTileIds.filter((id) => letters.some((tile) => tile.id === id));
    render();
  }
});

window.addEventListener("resize", renderTiles);

render();
