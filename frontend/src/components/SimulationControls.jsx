/**
 * @fileoverview Interactive panel for switching match day scenarios, supporting themes, Operator Roles, and scenario presets.
 */
import React from 'react';
import { Sliders, HelpCircle, ShieldAlert } from 'lucide-react';

const SCENARIOS = [
  { id: 'PRE_MATCH_RUSH', label: '🏟️ Pre-Match Rush', desc: 'Gates 3 & 6 spiking' },
  { id: 'MID_MATCH_CALM', label: '⚽ During Match', desc: 'Gates clear, fans seated' },
  { id: 'HALFTIME_CONCOURSE', label: '🌭 Halftime Flow', desc: 'Concourse food areas spike' },
  { id: 'POST_MATCH_EXIT_SURGE', label: '🚶 Post-Match Exit', desc: 'Gates 4, 6 & 8 surges' },
  { id: 'NORMAL_OPERATIONS', label: '✅ Standard Flow', desc: 'Balanced, low-to-moderate' }
];

export default function SimulationControls({ currentPhase, onPhaseChange, theme, userRole }) {
  const isDark = theme === 'dark';
  const isRestricted = userRole !== 'director';

  // Preset Scenario quick selector handler
  const handlePresetSelect = (e) => {
    const presetId = e.target.value;
    if (presetId) {
      onPhaseChange(presetId);
    }
  };

  return (
    <section 
      className={`border rounded-xl p-5 shadow-xl transition-all duration-300 ${
        isDark 
          ? 'bg-stadium-slate-900 border-stadium-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
      }`}
      aria-labelledby="sim-title"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-dashed border-slate-700/30">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="text-stadium-orange-500 w-5.5 h-5.5" aria-hidden="true" />
            <h2 id="sim-title" className="text-lg font-bold uppercase tracking-wider">
              Venue Simulation Control Room
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate standard and emergency match-day events to evaluate GenAI predictive warnings and rerouting plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-450 uppercase text-[10px]">Load Scenario Presets:</span>
            <select
              onChange={handlePresetSelect}
              disabled={isRestricted}
              value={currentPhase}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stadium-orange-500 cursor-pointer disabled:opacity-50 ${
                isDark 
                  ? 'bg-slate-950 border-stadium-slate-800 text-white' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              aria-label="Load stadium scenario presets"
            >
              <option value="" disabled>-- Load Preset Scenario --</option>
              <option value="PRE_MATCH_RUSH">🏟️ World Cup Final Kickoff (Heavy Inflow)</option>
              <option value="POST_MATCH_EXIT_SURGE">⛈️ Sudden Weather Evacuation (Max Outflow)</option>
              <option value="HALFTIME_CONCOURSE">🌭 Concourse Lunch Rush (Halftime Spikes)</option>
              <option value="MID_MATCH_CALM">⚽ During Match (Balanced/Calm)</option>
              <option value="NORMAL_OPERATIONS">✅ Standard Day Match Operations</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-stadium-slate-800 border-stadium-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className="w-2 h-2 bg-stadium-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
            <span>Active: <strong>{currentPhase.replace(/_/g, ' ')}</strong></span>
          </div>
        </div>
      </div>

      {/* Scenarios Button Grid */}
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
              disabled={isRestricted}
              onClick={() => onPhaseChange(scenario.id)}
              aria-pressed={isSelected}
              aria-label={`Switch simulation to ${scenario.label}`}
              className={`flex flex-col items-start text-left p-3.5 rounded-lg transition-all border font-semibold cursor-pointer disabled:opacity-50 ${
                isSelected
                  ? 'bg-stadium-orange-600 border-stadium-orange-500 text-white shadow-lg shadow-stadium-orange-600/10'
                  : isDark
                  ? 'bg-stadium-slate-850 border-stadium-slate-800 text-slate-300 hover:bg-stadium-slate-800 hover:border-stadium-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-350 shadow-sm'
              }`}
            >
              <span className="text-sm mb-1">{scenario.label}</span>
              <span className={`text-[10px] ${isSelected ? 'text-stadium-orange-100' : 'text-slate-450'}`}>
                {scenario.desc}
              </span>
            </button>
          );
        })}
      </div>

      {isRestricted && (
        <div className={`mt-4 p-3 rounded-lg border flex items-start gap-2 text-xs ${
          isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Simulation Access Lock:</strong> The volunteer crew does not have clearance to override active stadium phases. Please contact the Stadium Director to adjust scenario settings.
          </p>
        </div>
      )}
    </section>
  );
}
