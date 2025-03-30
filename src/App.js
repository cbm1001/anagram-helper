import React, { useState } from "react";

export default function App() {
  const [letters, setLetters] = useState("");
  const [shuffled, setShuffled] = useState([]);

  const handleInputChange = (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    setLetters(input);
    setShuffled(input.split(""));
  };

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handleRandomise = () => {
    setShuffled(shuffleArray(shuffled));
  };

  const handleClear = () => {
    setLetters("");
    setShuffled([]);
  };

  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  const positions = shuffled.map((letter, index, array) => {
    const angle = (2 * Math.PI * index) / array.length;
    return {
      letter,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div style={{ textAlign: "center", padding: "30px", fontFamily: "sans-serif" }}>
      <h2>Anagram Helper</h2>
      <input
        type="text"
        value={letters}
        onChange={handleInputChange}
        maxLength={15}
        placeholder="Enter letters"
        style={{
          fontSize: "20px",
          padding: "10px",
          width: "300px",
          border: "2px solid #999",
          borderRadius: "8px",
          marginBottom: "20px"
        }}
      />
      <div
        style={{
          position: "relative",
          width: "300px",
          height: "300px",
          margin: "30px auto",
          border: "1px dashed #ccc"
        }}
      >
        {positions.map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -50%)",
              fontSize: "24px",
              fontWeight: "bold",
              backgroundColor: "#ffd",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #888",
            }}
          >
            {pos.letter}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "20px" }}>
        <button onClick={handleRandomise} style={{ marginRight: "10px", padding: "10px 20px" }}>
          Randomise
        </button>
        <button onClick={handleClear} style={{ padding: "10px 20px" }}>
          Clear
        </button>
      </div>
    </div>
  );
}
