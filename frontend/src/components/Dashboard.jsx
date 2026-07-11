/**
 * @fileoverview Main crowd density dashboard displaying gates in a colorblind-safe grid with detail drawers.
 * Integrates theme modes, instant keyword search, and CSV log exporters.
 */
import React, { useState } from 'react';
import { Activity, Flame, ChevronRight, BarChart2, Download, Search, X } from 'lucide-react';
import { api } from '../services/api.js';
import TrendChart from './TrendChart.jsx';

/**
 * Helper to determine accessibility CSS classes based on crowd density percentages and themes.
 * @param {number} density Gate density percentage.
 * @param {string} theme Current active theme ('dark' | 'light').
 * @returns {{bg: string, label: string, badge: string}} CSS classes and status text.
 */
function getDensityTheme(density, theme) {
  const isDark = theme === 'dark';
  
  if (density < 30) {
    return {
      bg: isDark
        ? 'bg-stadium-slate-800 border-stadium-slate-700 text-stadium-slate-100 hover:bg-stadium-slate-750'
        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
      label: 'NORMAL',
      badge: 'bg-stadium-slate-700 text-stadium-slate-200 border-stadium-slate-600'
    };
  }
  if (density < 60) {
    return {
      bg: isDark
        ? 'bg-blue-950 border-blue-900 text-blue-100 hover:bg-blue-900'
        : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
      label: 'MODERATE',
      badge: 'bg-blue-900 text-blue-200 border-blue-850'
    };
  }
  if (density < 80) {
    return {
      bg: isDark
        ? 'bg-amber-950 border-amber-900 text-amber-100 hover:bg-amber-900'
        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
      label: 'HIGH WARNING',
      badge: 'bg-amber-900 text-amber-200 border-amber-800'
    };
  }
  return {
    bg: isDark
      ? 'bg-stadium-orange-950 border-stadium-orange-800 text-white hover:bg-stadium-orange-900 animate-pulse-slow'
      : 'bg-orange-50 border-orange-250 text-orange-950 hover:bg-orange-100 animate-pulse-slow',
    label: 'CRITICAL CONGESTION',
    badge: 'bg-stadium-orange-600 text-white border-stadium-orange-500'
  };
}

export default function Dashboard({ gates, theme }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark';

  /**
   * Fetches recent crowd history for a clicked gate to show a detailed drawer.
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

  /**
   * Compiles historical gate readings and triggers download of a .csv file.
   */
  const handleExportCsv = () => {
    if (!history || history.length === 0 || !selectedGate) return;
    
    const headers = ['Timestamp', 'Gate ID', 'Gate Name', 'Density (%)', 'Status'];
    const rows = history.map(log => [
      new Date(log.timestamp).toISOString(),
      selectedGate.id,
      selectedGate.name,
      log.density,
      log.density >= 90 ? 'CRITICAL' : log.density >= 80 ? 'WARNING' : 'NORMAL'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telemetry_${selectedGate.id}_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live filter computation
  const filteredGates = gates.filter(gate => {
    const query = searchQuery.toLowerCase();
    const matchesName = gate.name.toLowerCase().includes(query);
    const themeInfo = getDensityTheme(gate.density, theme);
    const matchesStatus = themeInfo.label.toLowerCase().includes(query);
    return matchesName || matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      
      {/* Gates Grid section */}
      <section 
        className={`xl:col-span-2 p-5 rounded-xl border transition-all duration-300 ${
          isDark 
            ? 'bg-stadium-slate-900 border-stadium-slate-800 text-white shadow-xl' 
            : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
        }`}
        aria-labelledby="grid-title"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-dashed border-slate-700/40">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-stadium-orange-500 w-5 h-5" aria-hidden="true" />
            <h3 id="grid-title" className="text-sm font-bold uppercase tracking-wider">
              Entrance Telemetry Heatmap
            </h3>
          </div>

          {/* Quick Search bar */}
          <div className="relative w-full sm:w-60">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text"
              placeholder="Search gates or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-stadium-orange-500 transition-colors ${
                isDark 
                  ? 'bg-slate-950 border-stadium-slate-850 text-white' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
              aria-label="Filter gates input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {filteredGates.length === 0 ? (
          <div className="text-center py-12 text-slate-450 text-xs">
            No gates matching "{searchQuery}" found.
          </div>
        ) : (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            role="region"
            aria-label="Stadium Entrance Gates grid"
          >
            {filteredGates.map((gate) => {
              const themeInfo = getDensityTheme(gate.density, theme);
              const isSelected = selectedGate?.id === gate.id;

              return (
                <button
                  key={gate.id}
                  onClick={() => handleGateSelect(gate)}
                  aria-expanded={isSelected}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-28 relative ${themeInfo.bg} ${
                    isSelected 
                      ? 'border-stadium-orange-500 shadow-lg' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xs font-bold uppercase tracking-wider">{gate.name}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${themeInfo.badge}`}>
                      {themeInfo.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between w-full mt-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Current Capacity</span>
                    <span className="text-2xl font-extrabold tracking-tight">
                      {gate.density}%
                    </span>
                  </div>

                  {/* Visual gauge bar */}
                  <div className="w-full bg-slate-700/35 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        gate.density >= 80 ? 'bg-stadium-orange-500' : gate.density >= 60 ? 'bg-amber-500' : 'bg-blue-400'
                      }`}
                      style={{ width: `${gate.density}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Gate Drawer inspector panel */}
      <aside 
        className={`p-5 rounded-xl border transition-all duration-300 ${
          isDark 
            ? 'bg-stadium-slate-900 border-stadium-slate-800 text-white' 
            : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
        }`}
        aria-label="Gate details inspector panel"
      >
        <div className="border-b border-stadium-slate-850 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-stadium-orange-500 w-5 h-5" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Gate Inspector</h3>
          </div>

          {selectedGate && history.length > 0 && (
            <button
              onClick={handleExportCsv}
              className={`p-1.5 rounded hover:bg-slate-700/20 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold`}
              title="Download historical logs as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {!selectedGate ? (
          <div className="text-center py-14 text-xs text-slate-500 leading-relaxed font-bold">
            Select a gate tile in the telemetry grid to inspect trend charts and export logs.
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-950/20 p-2.5 rounded-lg border border-slate-700/20">
              <div>
                <h4 className="text-xs font-bold tracking-wide uppercase">{selectedGate.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Live Telemetry Capacity: {selectedGate.density}%</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded border font-extrabold ${getDensityTheme(selectedGate.density, theme).badge}`}>
                {getDensityTheme(selectedGate.density, theme).label}
              </span>
            </div>

            <div className="space-y-4">
              <TrendChart history={history} gateName={selectedGate.name} />

              <div>
                <h4 className="text-[10px] font-bold text-slate-450 uppercase mb-2">Recent Readings feed:</h4>
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-6" aria-busy="true">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stadium-orange-500"></div>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4">No historical records logged yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1" aria-label={`Density logs history for ${selectedGate.name}`}>
                    {history.slice(0, 5).map((log, idx) => {
                      const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      return (
                        <li 
                          key={log._id || idx}
                          className={`flex items-center justify-between text-[10px] p-2 rounded border transition-colors ${
                            isDark 
                              ? 'bg-slate-950 border-stadium-slate-850 hover:bg-slate-900 text-slate-200' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 text-stadium-orange-500" />
                            <span className="font-mono text-slate-500">{time}</span>
                          </div>
                          <span className="font-bold">{log.density}% capacity</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
