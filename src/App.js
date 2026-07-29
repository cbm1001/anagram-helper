import React, { useMemo, useState } from "react";
import "./App.css";

const MAX_LETTERS = 15;

const sanitizeInput = (value) => value.toUpperCase().replace(/[^A-Z]/g, "");

const shuffleLetters = (letters) => {
  const arr = [...letters];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function App() {
  const [inputValue, setInputValue] = useState("");
  const [shuffledLetters, setShuffledLetters] = useState([]);

  const handleInputChange = (event) => {
    const cleaned = sanitizeInput(event.target.value).slice(0, MAX_LETTERS);
    setInputValue(cleaned);
    setShuffledLetters(shuffleLetters(cleaned.split("")));
  };

  const handleRandomise = () => {
    setShuffledLetters((current) => {
      const source = current.length ? current : inputValue.split("");
      return shuffleLetters(source);
    });
  };

  const handleClear = () => {
    setInputValue("");
    setShuffledLetters([]);
  };

  const positions = useMemo(() => {
    if (!shuffledLetters.length) return [];

    const radius = 135;
    const center = 175;

    return shuffledLetters.map((letter, index) => {
      const angle = (2 * Math.PI * index) / shuffledLetters.length - Math.PI / 2;
      return {
        letter,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
  }, [shuffledLetters]);

  return (
    <div className="app-shell">
      <div className="card">
        <header className="card__header">
          <p className="eyebrow">Crossword utility</p>
          <h1>Anagram Ring Helper</h1>
          <p className="lede">
            Enter up to 15 letters, then shuffle them into a circular layout to
            spark new word ideas.
          </p>
        </header>

        <label className="field" htmlFor="letters-input">
          <div className="field__top">
            <span className="label">Letters</span>
            <span className="counter">{inputValue.length}/{MAX_LETTERS}</span>
          </div>
          <input
            id="letters-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            maxLength={MAX_LETTERS}
            placeholder="Example: anagramwizard"
            className="text-input"
            spellCheck="false"
          />
        </label>

        <div className="actions">
          <button
            type="button"
            className="button"
            onClick={handleRandomise}
            disabled={!inputValue}
          >
            Randomise letters
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={handleClear}
            disabled={!inputValue && !shuffledLetters.length}
          >
            Clear
          </button>
        </div>

        <div className="ring" aria-live="polite">
          {positions.length === 0 && (
            <p className="ring__placeholder">
              Type some letters to see them swirl around the ring.
            </p>
          )}
          {positions.map((pos, index) => (
            <span
              key={`${pos.letter}-${index}`}
              className="ring__letter"
              style={{ left: pos.x, top: pos.y }}
            >
              {pos.letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
