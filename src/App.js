import React, { useRef, useEffect, useState } from 'react';
import './App.css';

// ── Vector helpers ────────────────────────────────────────────────────────────

function vecLimit(vx, vy, max) {
  const m2 = vx * vx + vy * vy;
  if (m2 > max * max) {
    const s = max / Math.sqrt(m2);
    return [vx * s, vy * s];
  }
  return [vx, vy];
}

function vecSetMag(vx, vy, m) {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag < 1e-6) return [0, 0];
  const s = m / mag;
  return [vx * s, vy * s];
}

// ── Bird factory ──────────────────────────────────────────────────────────────

function makeBird(W, H) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1.5 + Math.random() * 2;
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    brightness: 0.65 + Math.random() * 0.35,
  };
}

function createBirds(n, W, H) {
  return Array.from({ length: n }, () => makeBird(W, H));
}

// ── Boids simulation step ─────────────────────────────────────────────────────

function stepBoids(birds, p, W, H) {
  const sepR2 = p.separationRadius * p.separationRadius;
  const aliR2 = p.alignmentRadius * p.alignmentRadius;
  const cohR2 = p.cohesionRadius * p.cohesionRadius;
  const n = birds.length;

  // Compute steerings separately so they're based on un-updated positions
  const sx = new Float32Array(n);
  const sy = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const b = birds[i];
    let sepX = 0, sepY = 0, sepN = 0;
    let aliVx = 0, aliVy = 0, aliN = 0;
    let cohX = 0, cohY = 0, cohN = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const o = birds[j];
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < sepR2 && d2 > 0) {
        const d = Math.sqrt(d2);
        sepX -= dx / d;
        sepY -= dy / d;
        sepN++;
      }
      if (d2 < aliR2) {
        aliVx += o.vx; aliVy += o.vy; aliN++;
      }
      if (d2 < cohR2) {
        cohX += o.x; cohY += o.y; cohN++;
      }
    }

    let stx = 0, sty = 0;

    if (sepN > 0) {
      let [dx, dy] = vecSetMag(sepX / sepN, sepY / sepN, p.maxSpeed);
      [dx, dy] = vecLimit(dx - b.vx, dy - b.vy, p.maxForce);
      stx += dx * p.separationWeight;
      sty += dy * p.separationWeight;
    }
    if (aliN > 0) {
      let [dx, dy] = vecSetMag(aliVx / aliN, aliVy / aliN, p.maxSpeed);
      [dx, dy] = vecLimit(dx - b.vx, dy - b.vy, p.maxForce);
      stx += dx * p.alignmentWeight;
      sty += dy * p.alignmentWeight;
    }
    if (cohN > 0) {
      let [dx, dy] = vecSetMag(cohX / cohN - b.x, cohY / cohN - b.y, p.maxSpeed);
      [dx, dy] = vecLimit(dx - b.vx, dy - b.vy, p.maxForce);
      stx += dx * p.cohesionWeight;
      sty += dy * p.cohesionWeight;
    }

    sx[i] = stx;
    sy[i] = sty;
  }

  for (let i = 0; i < n; i++) {
    const b = birds[i];
    b.vx += sx[i];
    b.vy += sy[i];
    [b.vx, b.vy] = vecLimit(b.vx, b.vy, p.maxSpeed);

    // Enforce a minimum speed so birds never stall
    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (spd < p.maxSpeed * 0.25) {
      [b.vx, b.vy] = vecSetMag(b.vx, b.vy, p.maxSpeed * 0.25);
    }

    b.x += b.vx;
    b.y += b.vy;

    // Wrap around edges
    if (b.x < 0) b.x += W;
    if (b.x > W) b.x -= W;
    if (b.y < 0) b.y += H;
    if (b.y > H) b.y -= H;
  }
}

// ── Default parameters ────────────────────────────────────────────────────────

const DEFAULTS = {
  numBirds: 150,
  separationRadius: 28,
  separationWeight: 1.5,
  alignmentRadius: 60,
  alignmentWeight: 1.0,
  cohesionRadius: 60,
  cohesionWeight: 1.0,
  maxSpeed: 3.5,
  maxForce: 0.08,
  trails: true,
  showPerception: false,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const canvasRef = useRef(null);
  const birdsRef = useRef([]);
  const paramsRef = useRef(DEFAULTS);
  const [params, setParams] = useState(DEFAULTS);

  const updateParam = (key, val) => {
    const next = { ...paramsRef.current, [key]: val };
    paramsRef.current = next;
    setParams(next);
  };

  // Main simulation + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      if (birdsRef.current.length === 0) {
        birdsRef.current = createBirds(paramsRef.current.numBirds, w, h);
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const loop = () => {
      const p = paramsRef.current;
      const birds = birdsRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // Background — semi-transparent for trail effect
      ctx.fillStyle = p.trails ? 'rgba(10, 12, 25, 0.28)' : '#0a0c19';
      ctx.fillRect(0, 0, W, H);

      stepBoids(birds, p, W, H);

      // Perception zone circles (behind birds)
      if (p.showPerception && birds.length > 0) {
        const t = birds[0];
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;

        ctx.strokeStyle = 'rgba(107, 203, 119, 0.3)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.cohesionRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 217, 61, 0.4)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.alignmentRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.separationRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      // Draw all birds as arrow shapes
      for (const b of birds) {
        const angle = Math.atan2(b.vy, b.vx);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const L = 7, BW = 3;

        ctx.beginPath();
        ctx.moveTo(b.x + L * cos,                        b.y + L * sin);
        ctx.lineTo(b.x - L * 0.5 * cos + BW * sin,      b.y - L * 0.5 * sin - BW * cos);
        ctx.lineTo(b.x - L * 0.3 * cos,                  b.y - L * 0.3 * sin);
        ctx.lineTo(b.x - L * 0.5 * cos - BW * sin,      b.y - L * 0.5 * sin + BW * cos);
        ctx.closePath();
        const br = Math.floor(b.brightness * 210);
        const bg = Math.floor(b.brightness * 230);
        ctx.fillStyle = `rgba(${br}, ${bg}, 255, 0.88)`;
        ctx.fill();
      }

      // Perception highlights (over birds)
      if (p.showPerception && birds.length > 0) {
        const t = birds[0];
        const sepR2 = p.separationRadius * p.separationRadius;
        const aliR2 = p.alignmentRadius * p.alignmentRadius;
        const cohR2 = p.cohesionRadius * p.cohesionRadius;

        for (let i = 1; i < birds.length; i++) {
          const b = birds[i];
          const dx = b.x - t.x;
          const dy = b.y - t.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= cohR2) continue;

          ctx.fillStyle = d2 < sepR2
            ? 'rgba(255, 107, 107, 1)'
            : d2 < aliR2
            ? 'rgba(255, 217, 61, 1)'
            : 'rgba(107, 203, 119, 1)';

          ctx.beginPath();
          ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glowing tracked bird
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  // Add/remove birds smoothly when count changes
  const handleNumBirds = (n) => {
    const birds = birdsRef.current;
    const canvas = canvasRef.current;
    if (n > birds.length) {
      const W = canvas.width, H = canvas.height;
      while (birds.length < n) birds.push(makeBird(W, H));
    } else {
      birds.splice(n);
    }
    updateParam('numBirds', n);
  };

  return (
    <div className="sim-root">
      <canvas ref={canvasRef} className="sim-canvas" />

      <aside className="sim-panel">
        <h1 className="panel-title">Murmuration</h1>
        <p className="panel-subtitle">Bird Flocking · Boids Algorithm (Reynolds 1987)</p>

        <div className="section">
          <Slider label="Birds" value={params.numBirds} min={10} max={500} step={5}
            fmt={v => v} onChange={handleNumBirds} />
          <Slider label="Max Speed" value={params.maxSpeed} min={0.5} max={9} step={0.1}
            fmt={v => v.toFixed(1)} onChange={v => updateParam('maxSpeed', v)} />
          <Slider label="Steering Force" value={params.maxForce} min={0.01} max={0.4} step={0.01}
            fmt={v => v.toFixed(2)} onChange={v => updateParam('maxForce', v)} />
        </div>

        <RuleHeader color="#ff6b6b" name="Separation" desc="Avoid crowding nearby birds" />
        <div className="section">
          <Slider label="Radius" value={params.separationRadius} min={5} max={120} step={1}
            fmt={v => v} onChange={v => updateParam('separationRadius', v)} />
          <Slider label="Weight" value={params.separationWeight} min={0} max={5} step={0.05}
            fmt={v => v.toFixed(2)} onChange={v => updateParam('separationWeight', v)} />
        </div>

        <RuleHeader color="#ffd93d" name="Alignment" desc="Match neighbour flight direction" />
        <div className="section">
          <Slider label="Radius" value={params.alignmentRadius} min={5} max={150} step={1}
            fmt={v => v} onChange={v => updateParam('alignmentRadius', v)} />
          <Slider label="Weight" value={params.alignmentWeight} min={0} max={5} step={0.05}
            fmt={v => v.toFixed(2)} onChange={v => updateParam('alignmentWeight', v)} />
        </div>

        <RuleHeader color="#6bcb77" name="Cohesion" desc="Steer toward centre of neighbours" />
        <div className="section">
          <Slider label="Radius" value={params.cohesionRadius} min={5} max={150} step={1}
            fmt={v => v} onChange={v => updateParam('cohesionRadius', v)} />
          <Slider label="Weight" value={params.cohesionWeight} min={0} max={5} step={0.05}
            fmt={v => v.toFixed(2)} onChange={v => updateParam('cohesionWeight', v)} />
        </div>

        <div className="toggles">
          <label className="toggle-row">
            <input type="checkbox" checked={params.trails}
              onChange={e => updateParam('trails', e.target.checked)} />
            <span>Motion trails</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={params.showPerception}
              onChange={e => updateParam('showPerception', e.target.checked)} />
            <span>Show perception zones</span>
          </label>
        </div>

        {params.showPerception && (
          <div className="perception-legend">
            <LegendDot color="#ff6b6b" label="Separation zone" />
            <LegendDot color="#ffd93d" label="Alignment zone" />
            <LegendDot color="#6bcb77" label="Cohesion zone" />
            <p className="legend-note">White bird is tracked. Coloured dots show which rule applies to each neighbour.</p>
          </div>
        )}

        <button className="reset-btn"
          onClick={() => {
            const c = canvasRef.current;
            birdsRef.current = createBirds(paramsRef.current.numBirds, c.width, c.height);
          }}>
          Reset Flock
        </button>
      </aside>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RuleHeader({ color, name, desc }) {
  return (
    <div className="rule-header">
      <span className="rule-dot" style={{ background: color }} />
      <span className="rule-name" style={{ color }}>{name}</span>
      <span className="rule-desc">{desc}</span>
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }) {
  return (
    <div className="slider-row">
      <div className="slider-meta">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
