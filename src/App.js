import React, { useState } from "react";
import "./App.css";

const MAX_LETTERS = 15;
const SVG_SIZE = 340;
const CENTER = SVG_SIZE / 2;
const RADIUS = 130;
const TILE_R = 22;

// Ordered longest-first so the greediest (most diagnostic) cluster wins.
// Covers common suffixes, prefixes, digraphs and trigraphs found in English.
const PATTERNS = [
  // 5-letter
  'ATION', 'ITION', 'TIONS', 'MENTS', 'INESS', 'OUSLY', 'ATION',
  // 4-letter suffixes
  'TION', 'SION', 'NESS', 'MENT', 'ABLE', 'IBLE', 'IGHT', 'OUGH',
  'TURE', 'ANCE', 'ENCE', 'IOUS', 'EOUS', 'LESS', 'LING', 'RING',
  'TING', 'OUND', 'IGHT', 'IGHT', 'NESS',
  // 4-letter prefixes / other clusters
  'OVER', 'ANTI', 'SEMI', 'SELF', 'IGHT',
  // 3-letter suffixes
  'ING', 'ION', 'LLY', 'FUL', 'ISH', 'ISM', 'IST', 'IVE', 'ATE',
  'ERY', 'ARY', 'ORY', 'OUS', 'OUR', 'OWN', 'GHT', 'TCH', 'NGS',
  // 3-letter consonant clusters
  'STR', 'SCR', 'SPR', 'SPL', 'THR', 'SHR', 'PHR', 'NTH',
  // 3-letter prefixes
  'PRE', 'OUT', 'UNI', 'DIS', 'MIS', 'NON',
  // 2-letter digraphs (most common first)
  'TH', 'SH', 'CH', 'PH', 'WH', 'CK', 'QU', 'NG', 'NT', 'GH',
  'ST', 'TR', 'PR', 'WR', 'SC', 'SK', 'SN', 'SW', 'GN', 'KN',
];

function hasLetters(pool, needed) {
  const p = [...pool];
  for (const ch of needed) {
    const i = p.indexOf(ch);
    if (i === -1) return false;
    p.splice(i, 1);
  }
  return true;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Finds the highest-priority pattern present in `letters`, keeps it
// as a consecutive block, and shuffles everything else around it.
function smartShuffle(letters) {
  if (letters.length <= 1) return [...letters];

  let remaining = [...letters];
  let cluster = null;

  for (const pat of PATTERNS) {
    const patArr = pat.split('');
    if (hasLetters(remaining, patArr)) {
      for (const ch of patArr) remaining.splice(remaining.indexOf(ch), 1);
      cluster = patArr;
      break;
    }
  }

  if (!cluster) return shuffleArray(letters);

  const rest = shuffleArray(remaining);
  const pos = Math.floor(Math.random() * (rest.length + 1));
  return [...rest.slice(0, pos), ...cluster, ...rest.slice(pos)];
}

export default function App() {
  const [letters, setLetters] = useState('');
  const [displayed, setDisplayed] = useState([]);

  const handleInputChange = (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, MAX_LETTERS);
    setLetters(input);
    setDisplayed(input.split(''));
  };

  const handleRandomise = () => {
    if (displayed.length > 1) setDisplayed(smartShuffle(displayed));
  };

  const handleClear = () => {
    setLetters('');
    setDisplayed([]);
  };

  const positions = displayed.map((letter, index) => {
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
        {/* Editable input */}
        <div className="input-row">
          <input
            type="text"
            value={letters}
            onChange={handleInputChange}
            maxLength={MAX_LETTERS}
            placeholder="Type up to 15 letters…"
            className="letter-input"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <span className="letter-count">{letters.length}/{MAX_LETTERS}</span>
        </div>

        {/* Read-only current arrangement */}
        {displayed.length > 0 && (
          <div className="arrangement-row" aria-label="Current arrangement (read only)">
            {displayed.map((ch, i) => (
              <span key={i} className="arrangement-chip">{ch}</span>
            ))}
          </div>
        )}

        {/* Circle */}
        <div className="circle-container">
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            aria-hidden="true"
          >
            <defs>
              <filter id="tile-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#00000022" />
              </filter>
            </defs>

            <circle
              cx={CENTER} cy={CENTER} r={RADIUS}
              fill="none" stroke="#d0c8f0" strokeWidth="1.5" strokeDasharray="6 4"
            />
            {displayed.length > 0 && (
              <circle cx={CENTER} cy={CENTER} r="3" fill="#c0b8e8" />
            )}

            {positions.map((pos, i) => (
              <g key={i}>
                <circle
                  cx={pos.x} cy={pos.y} r={TILE_R}
                  fill="#ffffff" stroke="#7c6fcf" strokeWidth="2"
                  filter="url(#tile-shadow)"
                />
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="central"
                  className="tile-letter"
                >
                  {pos.letter}
                </text>
              </g>
            ))}
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
