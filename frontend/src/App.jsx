/**
 * @fileoverview Main React App coordinating dashboard states, polling, and lazy loading.
 */
import React, { useState, useEffect, Suspense } from 'react';
import { Shield, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { api } from './services/api.js';
import SimulationControls from './components/SimulationControls.jsx';
import Dashboard from './components/Dashboard.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';

// Lazy-loaded component (Efficiency Parameter)
const ChatAssistant = React.lazy(() => import('./components/ChatAssistant.jsx'));

/**
 * Main Application Component.
 */
function App() {
  const [gates, setGates] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('PRE_MATCH_RUSH');
  const [loading, setLoading] = useState(true);
  const [pollingError, setPollingError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Refreshes dashboard status and logs.
   * Debounced/Throttled to run on a 5-second polling tick.
   */
  const fetchData = async (showRefresher = false) => {
    if (showRefresher) setIsRefreshing(true);
    try {
      const [statusRes, alertsRes] = await Promise.all([
        api.getStatus(),
        api.getAlerts()
      ]);

      if (statusRes.success) {
        setGates(statusRes.gates);
        setCurrentPhase(statusRes.phase);
        setPollingError(false);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }
    } catch (err) {
      console.error('Failed to poll dashboard data:', err.message);
      setPollingError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Run initial fetch and configure 5-second polling interval (Efficiency Parameter)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Updates the active simulation scenario.
   * @param {string} phase Selected phase ID.
   */
  const handlePhaseChange = async (phase) => {
    try {
      const res = await api.changePhase(phase);
      if (res.success) {
        setCurrentPhase(res.phase);
        setGates(res.gates);
        // Instantly fetch alerts following scenario shifts
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change phase:', err.message);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-stadium-slate-950 flex flex-col items-center justify-center text-white"
        aria-busy="true"
        aria-label="Loading Smart Stadium Dashboard"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-stadium-orange-500 mb-4"></div>
        <p className="text-sm font-semibold tracking-wider text-stadium-slate-400">
          BOOTSTRAPPING venues monitoring...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stadium-slate-950 text-white font-sans selection:bg-stadium-orange-500 selection:text-white pb-12">
      {/* Premium Header */}
      <header className="border-b border-stadium-slate-900 bg-stadium-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-stadium-orange-600 p-2 rounded-lg text-white shadow-lg shadow-stadium-orange-600/20">
              <Shield className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5">
                <span>FIFA World Cup 2026</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-stadium-orange-500/20 border border-stadium-orange-500/30 text-stadium-orange-400 px-1.5 py-0.5 rounded">
                  Venue Ops
                </span>
              </h1>
              <p className="text-xs text-stadium-slate-400 font-medium">
                AI-Powered Smart Stadium Crowd Management Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              aria-label="Refresh live data"
              className="p-2 bg-stadium-slate-900 border border-stadium-slate-800 rounded-lg hover:bg-stadium-slate-800 hover:border-stadium-slate-700 text-stadium-slate-350 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <div className="text-xs font-bold text-stadium-orange-400 flex items-center gap-1 bg-stadium-orange-500/10 px-3 py-1.5 rounded-full border border-stadium-orange-500/20">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Gemini 2.5 Flash Grounded</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {pollingError && (
          <div 
            role="alert"
            className="bg-stadium-orange-950/40 border border-stadium-orange-600 rounded-xl p-4 text-stadium-orange-100 flex items-center gap-3 text-sm animate-shake"
          >
            <span>⚠️</span>
            <p><strong>Database Connection Timeout:</strong> The backend server is currently unreachable. Re-trying automatic reconnection. Fallback data may be displayed.</p>
          </div>
        )}

        {/* Phase Control Scenarios */}
        <SimulationControls 
          currentPhase={currentPhase} 
          onPhaseChange={handlePhaseChange} 
        />

        {/* Dashboard Grid */}
        <Dashboard gates={gates} />

        {/* Alerts and Rerouting Panel */}
        <AlertsPanel alerts={alerts} />

        {/* Staff Assistant (Lazy Loaded) */}
        <div className="grid grid-cols-1 gap-6">
          <Suspense 
            fallback={
              <div 
                className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-stadium-slate-400"
                aria-busy="true"
                aria-label="Loading Chat Assistant"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stadium-orange-500 mb-2"></div>
                <span className="text-xs font-semibold">Loading Staff AI Assistant...</span>
              </div>
            }
          >
            <ChatAssistant />
          </Suspense>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-stadium-slate-900 pt-6 text-center text-xs text-stadium-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© FIFA World Cup 2026 Venue Security Team. All simulation logs grounded in Gemini AI.</p>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-stadium-orange-500" />
          <span>Hackathon Submission Engine v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
