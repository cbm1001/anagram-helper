import React, { useState } from "react";
import "./App.css";

const MAX_LETTERS = 14;
const SVG_SIZE = 340;
const CENTER = SVG_SIZE / 2;
const RADIUS = 130;
const TILE_R = 22;

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [letters, setLetters] = useState("");
  const [displayed, setDisplayed] = useState([]);

  const handleInputChange = (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, MAX_LETTERS);
    setLetters(input);
    setDisplayed(input.split(""));
  };

  const handleRandomise = () => {
    if (displayed.length > 1) {
      setDisplayed(shuffleArray(displayed));
    }
  };

  const handleClear = () => {
    setLetters("");
    setDisplayed([]);
  };

  const positions = displayed.map((letter, index) => {
    // Start at top (-π/2) so first letter appears at 12 o'clock
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / displayed.length;
    return {
      letter,
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Anagram Circle</h1>
        <p className="subtitle">Cryptic crossword anagram helper</p>
      </header>

      <main className="app-main">
        <div className="input-row">
          <input
            type="text"
            value={letters}
            onChange={handleInputChange}
            maxLength={MAX_LETTERS}
            placeholder="Type up to 14 letters…"
            className="letter-input"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <span className="letter-count">{letters.length}/{MAX_LETTERS}</span>
        </div>

        <div className="circle-container">
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            aria-label="Anagram circle"
          >
            {/* Guide circle */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#d0c8f0"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />

            {/* Centre dot */}
            {displayed.length > 0 && (
              <circle cx={CENTER} cy={CENTER} r="3" fill="#c0b8e8" />
            )}

            {/* Letter tiles */}
            {positions.map((pos, i) => (
              <g key={i}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={TILE_R}
                  fill="#ffffff"
                  stroke="#7c6fcf"
                  strokeWidth="2"
                  filter="url(#tile-shadow)"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="tile-letter"
                >
                  {pos.letter}
                </text>
              </g>
            ))}

            {/* Drop shadow filter */}
            <defs>
              <filter id="tile-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#00000022" />
              </filter>
            </defs>
          </svg>

          {displayed.length === 0 && (
            <p className="empty-hint">Enter some letters to get started</p>
          )}
        </div>

        <div className="button-row">
          <button
            className="btn btn-randomise"
            onClick={handleRandomise}
            disabled={displayed.length < 2}
          >
            ⟳ Randomise
          </button>
          <button
            className="btn btn-clear"
            onClick={handleClear}
            disabled={displayed.length === 0}
          >
            ✕ Clear
          </button>
        </div>
      </main>
    </div>
  );
}
