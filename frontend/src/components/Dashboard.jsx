/**
 * @fileoverview Main crowd density dashboard displaying gates in a colorblind-safe grid with detail drawers.
 */
import React, { useState } from 'react';
import { Activity, Flame, ChevronRight, BarChart2 } from 'lucide-react';
import { api } from '../services/api.js';
import TrendChart from './TrendChart.jsx';

/**
 * Helper to determine accessibility CSS classes based on crowd density percentages.
 * Adheres to the Accessibility parameter (Blue-to-Orange colorblind-safe scale).
 * @param {number} density Gate density percentage.
 * @returns {{bg: string, label: string, badge: string}} CSS classes and status text.
 */
function getDensityTheme(density) {
  if (density < 30) {
    return {
      bg: 'bg-stadium-slate-800 border-stadium-slate-700 text-stadium-slate-100 hover:bg-stadium-slate-750',
      label: 'NORMAL',
      badge: 'bg-stadium-slate-700 text-stadium-slate-200 border-stadium-slate-600'
    };
  }
  if (density < 60) {
    return {
      bg: 'bg-blue-950 border-blue-900 text-blue-100 hover:bg-blue-900',
      label: 'MODERATE',
      badge: 'bg-blue-900 text-blue-200 border-blue-800'
    };
  }
  if (density < 80) {
    return {
      bg: 'bg-amber-950 border-amber-900 text-amber-100 hover:bg-amber-900',
      label: 'HIGH WARNING',
      badge: 'bg-amber-900 text-amber-200 border-amber-800'
    };
  }
  return {
    bg: 'bg-stadium-orange-950 border-stadium-orange-800 text-white hover:bg-stadium-orange-900 animate-pulse-slow',
    label: 'CRITICAL CONGESTION',
    badge: 'bg-stadium-orange-600 text-white border-stadium-orange-500'
  };
}

/**
 * Dashboard Component.
 * @param {Object} props
 * @param {Array<{id: string, name: string, density: number}>} props.gates Current gates state.
 */
export default function Dashboard({ gates }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /**
   * Fetches recent crowd history for a clicked gate to show a detailed drawer.
   * @param {{id: string, name: string, density: number}} gate
   */
  const handleGateSelect = async (gate) => {
    setSelectedGate(gate);
    setLoadingHistory(true);
    try {
      const res = await api.getHistory(gate.id, 8);
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load gate history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Grid of Gates */}
      <section 
        className="lg:col-span-2 bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white"
        aria-labelledby="dashboard-title"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="text-stadium-orange-500 w-6 h-6" aria-hidden="true" />
            <h2 id="dashboard-title" className="text-xl font-bold">
              Live Gate Heatmap
            </h2>
          </div>
          <p className="text-xs text-stadium-slate-400">
            Select a gate to inspect recent historical logs.
          </p>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="region"
          aria-label="Stadium Entrance Gates grid"
        >
          {gates.map((gate) => {
            const theme = getDensityTheme(gate.density);
            const isCritical = gate.density >= 80;
            return (
              <div
                key={gate.id}
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                aria-label={`${gate.name}: ${gate.density}% density, level: ${theme.label}`}
                onClick={() => handleGateSelect(gate)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGateSelect(gate);
                  }
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${theme.bg} ${
                  selectedGate?.id === gate.id ? 'ring-4 ring-stadium-orange-500 border-stadium-orange-400' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-sm tracking-wide line-clamp-1">
                    {gate.name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${theme.badge}`}>
                    {theme.label}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {gate.density}%
                    </span>
                    <span className="text-xs text-stadium-slate-300">capacity</span>
                  </div>
                  {isCritical && (
                    <Flame 
                      className="w-8 h-8 text-stadium-orange-500 animate-bounce" 
                      aria-hidden="true" 
                    />
                  )}
                </div>

                {/* Accessible progress bar */}
                <div className="w-full bg-stadium-slate-700 h-2 rounded-full overflow-hidden mt-3" aria-hidden="true">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical ? 'bg-stadium-orange-500' : gate.density >= 60 ? 'bg-amber-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${gate.density}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Side Detail Panel / Historical Logs Drawer */}
      <aside 
        className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white flex flex-col justify-between"
        aria-labelledby="aside-title"
      >
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-stadium-slate-800 pb-3">
            <BarChart2 className="text-stadium-orange-400 w-5 h-5" aria-hidden="true" />
            <h3 id="aside-title" className="text-lg font-semibold">
              Gate Trend Inspector
            </h3>
          </div>

          {!selectedGate ? (
            <div className="text-center py-12 text-stadium-slate-400 flex flex-col items-center justify-center h-full">
              <p className="mb-2">No entrance gate selected.</p>
              <p className="text-xs">Click any card on the heatmap grid to view real-time density history logging.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4 bg-stadium-slate-850 p-3 rounded-lg border border-stadium-slate-850">
                <div>
                  <h4 className="font-bold text-stadium-orange-400">{selectedGate.name}</h4>
                  <p className="text-xs text-stadium-slate-400 mt-0.5">Live Reading: {selectedGate.density}%</p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getDensityTheme(selectedGate.density).badge}`}>
                  {getDensityTheme(selectedGate.density).label}
                </span>
              </div>

              <div className="space-y-4">
                <TrendChart history={history} gateName={selectedGate.name} />

                <div>
                  <h4 className="text-xs font-bold text-stadium-slate-350 mb-2">Recent Logs Feed:</h4>
                  {loadingHistory ? (
                    <div className="flex justify-center items-center py-6" aria-busy="true">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stadium-orange-500"></div>
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-[10px] text-stadium-slate-500 text-center py-4">No historical records logged yet.</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1" aria-label={`Density logs history for ${selectedGate.name}`}>
                      {history.slice(0, 5).map((log, idx) => {
                        const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return (
                          <li 
                            key={log._id || idx}
                            className="flex items-center justify-between text-[10px] p-1.5 rounded bg-stadium-slate-800 border border-stadium-slate-750 hover:bg-stadium-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-stadium-orange-500" />
                              <span className="font-mono text-stadium-slate-400">{time}</span>
                            </div>
                            <span className="font-bold text-stadium-slate-200">{log.density}% capacity</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedGate && (
          <div className="border-t border-stadium-slate-800 pt-4 mt-4 text-[10px] text-stadium-slate-400">
            Capped historical DB querying enforces backend response efficiency constraints.
          </div>
        )}
      </aside>
    </div>
  );
}
