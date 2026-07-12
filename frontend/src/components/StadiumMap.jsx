/**
 * @fileoverview Interactive 2D SVG Stadium Map Visualizer.
 * Displays gates around the stadium bowl with dynamic colorblind-safe glows based on density.
 */
import React from 'react';

/**
 * Maps gate density to glow and fill color classes (Blue-to-Orange HSL scale).
 * @param {number} density Gate density percentage.
 * @returns {{fill: string, stroke: string, glow: string, label: string}} CSS color classes.
 */
function getMapColorClasses(density) {
  if (density < 30) {
    return {
      fill: 'fill-slate-800',
      stroke: 'stroke-slate-600',
      glow: 'shadow-slate-500/20',
      text: 'text-slate-300',
      ring: 'stroke-slate-700/50'
    };
  }
  if (density < 60) {
    return {
      fill: 'fill-blue-900',
      stroke: 'stroke-blue-500',
      glow: 'shadow-blue-500/30',
      text: 'text-blue-200',
      ring: 'stroke-blue-800/80'
    };
  }
  if (density < 80) {
    return {
      fill: 'fill-amber-950',
      stroke: 'stroke-amber-500',
      glow: 'shadow-amber-500/40',
      text: 'text-amber-200',
      ring: 'stroke-amber-700'
    };
  }
  return {
    fill: 'fill-orange-950',
    stroke: 'stroke-stadium-orange-500',
    glow: 'shadow-stadium-orange-500/50 animate-pulse',
    text: 'text-orange-200',
    ring: 'stroke-stadium-orange-600 animate-ping-slow'
  };
}

// Coordinates for gate nodes on the 400x300 SVG coordinate system
const GATE_COORDINATES = {
  gate_1: { x: 330, y: 150, name: 'G1 (East)' },
  gate_2: { x: 290, y: 65, name: 'G2 (NE)' },
  gate_3: { x: 200, y: 40, name: 'G3 (North)' },
  gate_4: { x: 110, y: 65, name: 'G4 (NW)' },
  gate_5: { x: 200, y: 260, name: 'G5 (South)' },
  gate_6: { x: 110, y: 235, name: 'G6 (SW)' },
  gate_7: { x: 70, y: 150, name: 'G7 (West)' },
  gate_8: { x: 290, y: 235, name: 'G8 (SE)' } // mapped gate_8 here for symmetry
};

export default function StadiumMap({ gates, selectedGateId, onGateSelect }) {
  return (
    <div className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <h3 className="text-md font-bold flex items-center gap-2">
          <span>🏟️ Stadium Layout Map</span>
          <span className="text-[10px] bg-stadium-slate-800 text-stadium-slate-350 px-2 py-0.5 rounded border border-stadium-slate-700">
            Interactive 2D View
          </span>
        </h3>
        <p className="text-[10px] text-stadium-slate-400">Click any gate node to inspect trends</p>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[420px] aspect-[4/3] bg-stadium-slate-950/40 rounded-lg p-2 border border-stadium-slate-850 flex items-center justify-center">
        <svg 
          viewBox="0 0 400 300" 
          className="w-full h-full select-none" 
          aria-label="Stadium interactive map visualizer"
          role="region"
        >
          {/* Outer Stadium Wall boundary */}
          <ellipse 
            cx="200" 
            cy="150" 
            rx="160" 
            ry="110" 
            className="fill-none stroke-stadium-slate-850" 
            strokeWidth="8"
          />
          <ellipse 
            cx="200" 
            cy="150" 
            rx="160" 
            ry="110" 
            className="fill-none stroke-stadium-slate-800" 
            strokeWidth="2"
          />

          {/* Seating Bowl Rings */}
          <ellipse 
            cx="200" 
            cy="150" 
            rx="120" 
            ry="80" 
            className="fill-stadium-slate-900/80 stroke-stadium-slate-850" 
            strokeWidth="3"
          />
          <ellipse 
            cx="200" 
            cy="150" 
            rx="95" 
            ry="60" 
            className="fill-stadium-slate-950/60 stroke-stadium-slate-850" 
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Central Pitch / Field */}
          <rect 
            x="140" 
            y="110" 
            width="120" 
            height="80" 
            rx="4" 
            className="fill-emerald-950/20 stroke-emerald-800/40" 
            strokeWidth="2"
          />
          {/* Field Lines */}
          <circle cx="200" cy="150" r="18" className="fill-none stroke-emerald-800/25" strokeWidth="1.5" />
          <line x1="200" y1="110" x2="200" y2="190" className="stroke-emerald-800/25" strokeWidth="1.5" />

          {/* Connectors / Access corridors */}
          <g opacity="0.15" className="stroke-slate-500" strokeWidth="4">
            <line x1="200" y1="40" x2="200" y2="110" />
            <line x1="200" y1="190" x2="200" y2="260" />
            <line x1="70" y1="150" x2="140" y2="150" />
            <line x1="330" y1="150" x2="260" y2="150" />
          </g>

          {/* Interactive Gate Nodes */}
          {gates.map((gate) => {
            const coord = GATE_COORDINATES[gate.id] || { x: 200, y: 150, name: gate.name };
            const theme = getMapColorClasses(gate.density);
            const isSelected = selectedGateId === gate.id;

            return (
              <g 
                key={gate.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer group focus:outline-none"
                onClick={() => onGateSelect(gate)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onGateSelect(gate);
                  }
                }}
                aria-label={`${gate.name}: ${gate.density}% capacity`}
                aria-pressed={isSelected}
              >
                {/* Ping warning rings for critical gates */}
                {gate.density >= 80 && (
                  <circle 
                    cx={coord.x} 
                    cy={coord.y} 
                    r="24" 
                    className={`fill-none stroke-2 ${theme.ring}`}
                  />
                )}

                {/* Outer Selection Highlight Ring */}
                <circle 
                  cx={coord.x} 
                  cy={coord.y} 
                  r="19" 
                  className={`fill-none transition-all duration-300 group-focus:stroke-stadium-orange-500 group-focus:stroke-2 ${
                    isSelected ? 'stroke-stadium-orange-500 stroke-2' : 'stroke-transparent group-hover:stroke-stadium-slate-700'
                  }`}
                />

                {/* Main Gate Circle Node */}
                <circle 
                  cx={coord.x} 
                  cy={coord.y} 
                  r="14" 
                  className={`transition-all duration-300 ${theme.fill} stroke-2 ${theme.stroke} filter drop-shadow-md`}
                />

                {/* Short Gate Label (e.g. G1, G2) */}
                <text 
                  x={coord.x} 
                  y={coord.y + 4} 
                  textAnchor="middle" 
                  className={`text-[9px] font-extrabold font-mono tracking-tight pointer-events-none fill-white`}
                >
                  {gate.id.replace('gate_', 'G')}
                </text>

                {/* Density Label Tag (placed slightly offset) */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {/* Tooltip Background */}
                  <rect 
                    x={coord.x - 35} 
                    y={coord.y - 38} 
                    width="70" 
                    height="20" 
                    rx="3" 
                    className="fill-stadium-slate-950/95 stroke-stadium-slate-800" 
                    strokeWidth="1"
                  />
                  {/* Tooltip Text */}
                  <text 
                    x={coord.x} 
                    y={coord.y - 25} 
                    textAnchor="middle" 
                    className="text-[9px] font-bold fill-white"
                  >
                    {gate.density}% density
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Colorblind-Safe Color Legend */}
      <div className="w-full grid grid-cols-4 gap-2 mt-4 text-[10px] text-center text-stadium-slate-400">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600"></span>
          <span>Normal (&lt;30%)</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-900 border border-blue-500"></span>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-950 border border-amber-500"></span>
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-950 border border-orange-500 animate-pulse"></span>
          <span>Critical (80%+)</span>
        </div>
      </div>
    </div>
  );
}
