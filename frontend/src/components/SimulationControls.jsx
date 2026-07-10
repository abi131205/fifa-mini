/**
 * @fileoverview Interactive panel for switching match day scenarios to test different crowd dynamics.
 */
import React from 'react';

const SCENARIOS = [
  { id: 'PRE_MATCH_RUSH', label: '🏟️ Pre-Match Rush', desc: 'Gates 3 & 6 spiking' },
  { id: 'MID_MATCH_CALM', label: '⚽ During Match', desc: 'Gates clear, fans seated' },
  { id: 'HALFTIME_CONCOURSE', label: '🌭 Halftime Flow', desc: 'Concourse food areas spike' },
  { id: 'POST_MATCH_EXIT_SURGE', label: '🚶 Post-Match Exit', desc: 'Gates 4, 6 & 8 surges' },
  { id: 'NORMAL_OPERATIONS', label: '✅ Standard Flow', desc: 'Balanced, low-to-moderate' }
];

/**
 * SimulationControls Component.
 * @param {Object} props
 * @param {string} props.currentPhase The active simulation phase.
 * @param {function(string): void} props.onPhaseChange Callback triggered when a new scenario is clicked.
 */
export default function SimulationControls({ currentPhase, onPhaseChange }) {
  return (
    <section 
      className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white"
      aria-labelledby="sim-title"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="sim-title" className="text-xl font-bold text-stadium-orange-400">
            Venue Simulation Controls
          </h2>
          <p className="text-sm text-stadium-slate-400">
            Dolly/simulate World Cup 2026 scenarios to verify GenAI predictive alerts and crowd rerouting logic.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-stadium-slate-800 px-3 py-1.5 rounded-lg border border-stadium-slate-700 text-sm">
          <span className="w-2.5 h-2.5 bg-stadium-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
          <span>Active Phase: <strong>{currentPhase.replace(/_/g, ' ')}</strong></span>
        </div>
      </div>

      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        role="group"
        aria-label="Simulation Scenario selection"
      >
        {SCENARIOS.map((scenario) => {
          const isSelected = currentPhase === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onPhaseChange(scenario.id)}
              aria-pressed={isSelected}
              aria-label={`Switch simulation to ${scenario.label}`}
              className={`flex flex-col items-start text-left p-3.5 rounded-lg transition-all border font-medium cursor-pointer ${
                isSelected
                  ? 'bg-stadium-orange-600 border-stadium-orange-500 text-white shadow-lg'
                  : 'bg-stadium-slate-800 border-stadium-slate-700 text-stadium-slate-200 hover:bg-stadium-slate-700 hover:border-stadium-slate-600'
              }`}
            >
              <span className="text-base mb-1">{scenario.label}</span>
              <span className={`text-xs ${isSelected ? 'text-stadium-orange-100' : 'text-stadium-slate-400'}`}>
                {scenario.desc}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
