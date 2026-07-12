import { useEffect, useState } from 'react';

/**
 * Ambient Japanese scenic backdrop — pure SVG silhouettes, fixed behind content.
 * Layered: Mount Fuji + rolling mountains → torii gate → temple silhouette.
 * Occasional lightning flash for drama. Pointer-events-none, never obstructs UI.
 */
export default function JapaneseBackdrop() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleFlash = () => {
      // Random gap between 12s and 30s
      const delay = 12000 + Math.random() * 18000;
      timeout = setTimeout(() => {
        setFlash(true);
        // flash lasts ~180ms, then a quick double-flicker
        setTimeout(() => setFlash(false), 160);
        setTimeout(() => setFlash(true), 260);
        setTimeout(() => setFlash(false), 380);
        scheduleFlash();
      }, delay);
    };
    scheduleFlash();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {/* Lightning flash overlay */}
      <div className={`lightning-overlay ${flash ? 'lightning-flash' : ''}`} aria-hidden />

      {/* Scenic silhouettes pinned to bottom */}
      <div className="jp-backdrop" aria-hidden>
        <svg
          viewBox="0 0 1440 600"
          preserveAspectRatio="xMidYMax slice"
          className="jp-backdrop-svg"
        >
          {/* ── Mount Fuji (far, faintest) ── */}
          <g className="jp-layer-fuji">
            <path
              d="M 380 600 L 660 230 Q 690 195 720 230 L 1000 600 Z"
              fill="url(#fujiGrad)"
            />
            {/* Snow cap */}
            <path
              d="M 620 300 L 660 230 Q 690 195 720 230 L 760 300 Q 745 290 730 295 Q 715 280 700 290 Q 685 275 670 290 Q 655 282 640 295 Q 630 288 620 300 Z"
              fill="url(#snowGrad)"
            />
          </g>

          {/* ── Rolling mountains (mid layer) ── */}
          <g className="jp-layer-mountains">
            <path
              d="M 0 600 L 0 450 Q 120 380 240 420 Q 360 360 480 410 Q 600 350 720 400 Q 840 340 960 405 Q 1080 360 1200 410 Q 1320 370 1440 430 L 1440 600 Z"
              fill="url(#mountainGrad)"
            />
          </g>

          {/* ── Torii gate (left) ── */}
          <g className="jp-layer-torii" transform="translate(140, 330)">
            {/* Top crossbeam (kasagi) - curved */}
            <path d="M -45 10 Q 0 -8 45 10 L 50 18 Q 0 6 -50 18 Z" fill="currentColor" />
            {/* Second crossbeam (nuki) */}
            <rect x="-40" y="28" width="80" height="9" rx="2" fill="currentColor" />
            {/* Two pillars */}
            <rect x="-32" y="18" width="9" height="180" fill="currentColor" />
            <rect x="23" y="18" width="9" height="180" fill="currentColor" />
            {/* Gakuzuka (center plaque) */}
            <rect x="-7" y="20" width="14" height="20" fill="currentColor" />
          </g>

          {/* ── Temple / Pagoda silhouette (right) ── */}
          <g className="jp-layer-temple" transform="translate(1120, 310)">
            {/* Base platform */}
            <rect x="-70" y="200" width="140" height="10" fill="currentColor" />
            {/* First (ground) roof - widest */}
            <path d="M -85 150 L -70 135 L 70 135 L 85 150 L 70 158 L -70 158 Z" fill="currentColor" />
            <rect x="-55" y="158" width="110" height="42" fill="currentColor" />
            {/* Second roof */}
            <path d="M -72 120 L -60 105 L 60 105 L 72 120 L 60 128 L -60 128 Z" fill="currentColor" />
            <rect x="-45" y="128" width="90" height="22" fill="currentColor" />
            {/* Third roof */}
            <path d="M -58 90 L -48 78 L 48 78 L 58 90 L 48 96 L -48 96 Z" fill="currentColor" />
            <rect x="-35" y="96" width="70" height="9" fill="currentColor" />
            {/* Spire (sōrin) */}
            <rect x="-3" y="60" width="6" height="18" fill="currentColor" />
            <circle cx="0" cy="58" r="4" fill="currentColor" />
          </g>

          {/* ── Foreground hills (darkest) ── */}
          <g className="jp-layer-ground">
            <path
              d="M 0 600 L 0 520 Q 200 490 400 515 Q 600 540 800 510 Q 1000 485 1200 520 Q 1320 535 1440 510 L 1440 600 Z"
              fill="url(#groundGrad)"
            />
          </g>

          <defs>
            <linearGradient id="fujiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f0a1f" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020202" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
}
