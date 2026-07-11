/**
 * @fileoverview Main React App coordinating multi-page tab portal navigation, settings, audio alarms, and live console layout.
 */
import React, { useState, useEffect, Suspense } from 'react';
import { Shield, Sparkles, RefreshCw, Layers, Home, Activity, MessageSquare, Sliders, Volume2, VolumeX, AlertOctagon, Terminal } from 'lucide-react';
import { api } from './services/api.js';
import SimulationControls from './components/SimulationControls.jsx';
import Dashboard from './components/Dashboard.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import StadiumMap from './components/StadiumMap.jsx';
import StaffAllocation from './components/StaffAllocation.jsx';

// Lazy-loaded staff assistant chat module
const ChatAssistant = React.lazy(() => import('./components/ChatAssistant.jsx'));

/**
 * Synthesizes a high-fidelity control room chime sound using Web Audio API.
 * Guarantees zero local asset loading issues.
 */
function playAlarmSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Primary Tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(660, audioCtx.currentTime); // E5 chirp
    osc1.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2); // slide down
    gain1.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.22);

    // Harmonic overlay (creates professional "beep")
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, audioCtx.currentTime); // High pitch ring
    osc2.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start();
    osc2.stop(audioCtx.currentTime + 0.12);
  } catch (err) {
    console.error('AudioContext alarm sound failed:', err);
  }
}

function App() {
  // Navigation State: 'home' | 'console' | 'chat' | 'settings'
  const [activeTab, setActiveTab] = useState('home');

  // Core Simulation States
  const [gates, setGates] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('PRE_MATCH_RUSH');
  const [loading, setLoading] = useState(true);
  const [pollingError, setPollingError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Settings Configuration states
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [purgingLogs, setPurgingLogs] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState(false);

  // Keep track of the previous count of critical gates to prevent alarm spamming
  const [prevCriticalCount, setPrevCriticalCount] = useState(0);

  /**
   * Refreshes status and alerts data from API.
   * Runs on a 5-second polling interval.
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

        // --- Sound Alert System (Audio Trigger) ---
        const criticalGates = statusRes.gates.filter(g => g.density >= warningThreshold);
        const criticalCount = criticalGates.length;

        // Sound chime only if alarms are enabled AND number of critical gates increased
        if (alarmEnabled && criticalCount > prevCriticalCount) {
          playAlarmSound();
        }
        setPrevCriticalCount(criticalCount);
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

  // Configure 5-second polling interval (Efficiency Parameter)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [alarmEnabled, warningThreshold, prevCriticalCount]);

  /**
   * Changes the active crowd simulation phase.
   */
  const handlePhaseChange = async (phase) => {
    try {
      const res = await api.changePhase(phase);
      if (res.success) {
        setCurrentPhase(res.phase);
        setGates(res.gates);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change phase:', err.message);
    }
  };

  /**
   * Simulates purging historical database logs.
   */
  const handlePurgeLogs = () => {
    setPurgingLogs(true);
    setPurgedMessage(false);
    setTimeout(() => {
      setPurgingLogs(false);
      setPurgedMessage(true);
      setTimeout(() => setPurgedMessage(false), 3000);
    }, 1500);
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
          BOOTSTRAPPING venue operations portal...
        </p>
      </div>
    );
  }

  // Count gates currently in CRITICAL state (density >= warningThreshold)
  const criticalGatesCount = gates.filter(g => g.density >= warningThreshold).length;

  return (
    <div className="min-h-screen bg-stadium-slate-950 text-white font-sans selection:bg-stadium-orange-500 selection:text-white pb-12">
      
      {/* Dynamic Header & Navigation Bar */}
      <header className="border-b border-stadium-slate-900 bg-stadium-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Operational Status Ticker */}
          <div className="flex items-center gap-3">
            <div className="bg-stadium-orange-600 p-2 rounded-lg text-white shadow-lg shadow-stadium-orange-600/20">
              <Shield className="w-5.5 h-5.5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
                <span>FIFA World Cup 2026</span>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-stadium-orange-500/20 border border-stadium-orange-500/30 text-stadium-orange-400 px-1.5 py-0.5 rounded">
                  Venue Portal
                </span>
              </h1>
              {/* Ticker of active warnings */}
              <div className="text-[10px] text-stadium-slate-400 flex items-center gap-1 mt-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Active Phase: {currentPhase.replace(/_/g, ' ')}</span>
                {criticalGatesCount > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-stadium-slate-650"></span>
                    <span className="text-stadium-orange-400 animate-pulse">⚠️ {criticalGatesCount} critical gates detected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tab Links */}
          <nav className="flex items-center bg-stadium-slate-900/60 p-1 rounded-lg border border-stadium-slate-800 text-xs gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home' ? 'bg-stadium-orange-600 text-white shadow' : 'text-stadium-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'console' ? 'bg-stadium-orange-600 text-white shadow' : 'text-stadium-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Operations Console</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'chat' ? 'bg-stadium-orange-600 text-white shadow' : 'text-stadium-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Copilot Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings' ? 'bg-stadium-orange-600 text-white shadow' : 'text-stadium-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </nav>

          {/* Right Status Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              aria-label="Refresh live data"
              className="p-2 bg-stadium-slate-900 border border-stadium-slate-800 rounded-lg hover:bg-stadium-slate-800 hover:border-stadium-slate-700 text-stadium-slate-350 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-[10px] font-bold transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
            
            {/* Tone Toggle indicator */}
            <button
              onClick={() => setAlarmEnabled(!alarmEnabled)}
              className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
                alarmEnabled 
                  ? 'bg-stadium-orange-500/10 border-stadium-orange-500/20 text-stadium-orange-400' 
                  : 'bg-stadium-slate-900 border-stadium-slate-800 text-stadium-slate-500'
              }`}
              title={alarmEnabled ? 'Mute warnings' : 'Enable sound warnings'}
            >
              {alarmEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {pollingError && (
          <div 
            role="alert"
            className="mb-6 bg-stadium-orange-950/40 border border-stadium-orange-600 rounded-xl p-4 text-stadium-orange-100 flex items-center gap-3 text-sm animate-shake"
          >
            <span>⚠️</span>
            <p><strong>Uplink Dropped:</strong> Backend server offline. Displaying local memory fallback telemetry.</p>
          </div>
        )}

        {/* Tab View 1: Home Landing Page */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Hub Banner */}
            <section className="bg-gradient-to-br from-stadium-slate-900 to-stadium-slate-950 border border-stadium-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-stadium-orange-500/5 rounded-full blur-3xl"></div>
              <div className="space-y-4 max-w-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-stadium-orange-500/10 text-stadium-orange-400 px-2.5 py-1 rounded-full border border-stadium-orange-500/25">
                  OPERATIONAL COMMAND HUB
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                  FIFA World Cup 2026 <br />
                  <span className="text-stadium-orange-400">Crowd Analytics System</span>
                </h2>
                <p className="text-sm leading-relaxed text-stadium-slate-400">
                  Welcome to the stadium gate operations center. This system manages venue congestion, calculates capacity safety limits via GenAI, and transmits live volunteer dispatch instructions.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('console')}
                    className="px-5 py-2.5 bg-stadium-orange-600 hover:bg-stadium-orange-500 text-xs font-bold rounded-lg shadow-lg shadow-stadium-orange-600/10 cursor-pointer transition-all"
                  >
                    Open Live Console
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="px-5 py-2.5 bg-stadium-slate-850 hover:bg-stadium-slate-800 border border-stadium-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Launch AI Assistant
                  </button>
                </div>
              </div>

              {/* Graphic Icon */}
              <div className="relative w-40 h-40 bg-stadium-slate-850/60 rounded-full border border-stadium-slate-800 flex items-center justify-center shadow-inner flex-shrink-0">
                <div className="absolute inset-2 border border-stadium-orange-500/20 rounded-full border-dashed animate-spin-slow"></div>
                <Activity className="w-16 h-16 text-stadium-orange-500 animate-pulse" />
              </div>
            </section>

            {/* Quick KPI Stats Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl">
                <span className="text-[10px] text-stadium-slate-450 uppercase font-bold tracking-wider block">Active Gates</span>
                <span className="text-2xl font-extrabold block mt-1">8 / 8 Entrance</span>
              </div>
              <div className="p-4 bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl">
                <span className="text-[10px] text-stadium-slate-450 uppercase font-bold tracking-wider block">Threat Level</span>
                <span className={`text-2xl font-extrabold block mt-1 ${criticalGatesCount > 0 ? 'text-stadium-orange-400' : 'text-emerald-400'}`}>
                  {criticalGatesCount > 0 ? `${criticalGatesCount} Warn` : 'Safe'}
                </span>
              </div>
              <div className="p-4 bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl">
                <span className="text-[10px] text-stadium-slate-450 uppercase font-bold tracking-wider block">Volunteers Dispatched</span>
                <span className="text-2xl font-extrabold block mt-1">120 Staff</span>
              </div>
              <div className="p-4 bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl">
                <span className="text-[10px] text-stadium-slate-450 uppercase font-bold tracking-wider block">AI Response rate</span>
                <span className="text-2xl font-extrabold text-blue-400 block mt-1">Grounded</span>
              </div>
            </div>

            {/* Card Launch Grid Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => setActiveTab('console')}
                className="p-5 bg-stadium-slate-900 hover:bg-stadium-slate-850 border border-stadium-slate-800 rounded-xl cursor-pointer hover:-translate-y-1 transition-all group"
              >
                <div className="p-3 bg-stadium-orange-600/10 rounded-lg text-stadium-orange-500 w-fit group-hover:bg-stadium-orange-600/20 transition-colors">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-md mt-4 mb-2">Venue Control Room</h3>
                <p className="text-xs text-stadium-slate-400 leading-relaxed">
                  Analyze real-time entrance crowd densities on an interactive stadium heat map and dispatch security rerouting suggestions.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('chat')}
                className="p-5 bg-stadium-slate-900 hover:bg-stadium-slate-850 border border-stadium-slate-800 rounded-xl cursor-pointer hover:-translate-y-1 transition-all group"
              >
                <div className="p-3 bg-blue-600/10 rounded-lg text-blue-450 w-fit group-hover:bg-blue-600/20 transition-colors">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-md mt-4 mb-2">AI Copilot Terminal</h3>
                <p className="text-xs text-stadium-slate-400 leading-relaxed">
                  Interact in natural language with "FIFA Crowd Assist," answering ground crew status queries grounded in live gate telemetry.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('settings')}
                className="p-5 bg-stadium-slate-900 hover:bg-stadium-slate-850 border border-stadium-slate-800 rounded-xl cursor-pointer hover:-translate-y-1 transition-all group"
              >
                <div className="p-3 bg-stadium-slate-800 rounded-lg text-stadium-slate-300 w-fit group-hover:bg-stadium-slate-750 transition-colors">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-md mt-4 mb-2">Gate Configuration</h3>
                <p className="text-xs text-stadium-slate-400 leading-relaxed">
                  Customize predictive warning parameters, set safety threshold sliders, and toggle sound warn chimes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab View 2: Live Operations Console */}
        {activeTab === 'console' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Simulation Phase Controls */}
            <SimulationControls 
              currentPhase={currentPhase} 
              onPhaseChange={handlePhaseChange} 
            />

            {/* Split layout: Visualizer Layout Map & Sliders Left, Heatmap & Alerts Right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column: Visual map and allocation */}
              <div className="lg:col-span-2 space-y-6">
                <StadiumMap 
                  gates={gates} 
                  selectedGateId={null} 
                  onGateSelect={() => {}} // Dynamic selection handles inside Dashboard
                />
                
                <StaffAllocation gates={gates} />
              </div>

              {/* Right Column: Dashboard grid and Alerts panel */}
              <div className="lg:col-span-3 space-y-6">
                <Dashboard gates={gates} />
                <AlertsPanel alerts={alerts} alarmEnabled={alarmEnabled} />
              </div>

            </div>
          </div>
        )}

        {/* Tab View 3: AI Copilot Chat */}
        {activeTab === 'chat' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-stadium-slate-900 to-stadium-slate-950 border border-stadium-slate-800 rounded-xl p-5 shadow-xl">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Sparkles className="text-stadium-orange-500 w-5 h-5 animate-pulse" />
                <span>On-Ground AI Copilot Terminal</span>
              </h3>
              <p className="text-xs text-stadium-slate-400 mb-4 border-b border-stadium-slate-800 pb-3">
                Ask questions regarding specific gate statuses, predictions, or safety redirects (e.g. "What is the status of Gate 3?").
              </p>

              <Suspense 
                fallback={
                  <div 
                    className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-stadium-slate-400"
                    aria-busy="true"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stadium-orange-500 mb-2"></div>
                    <span className="text-xs font-semibold">Loading Staff AI Assistant...</span>
                  </div>
                }
              >
                <ChatAssistant />
              </Suspense>
            </div>
          </div>
        )}

        {/* Tab View 4: System Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            <section className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-6 shadow-xl text-white space-y-6">
              
              <div className="border-b border-stadium-slate-800 pb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sliders className="text-stadium-orange-400 w-5 h-5" />
                  <span>Command System Settings</span>
                </h3>
                <p className="text-xs text-stadium-slate-450 mt-1">Configure warning thresholds, alarms, and simulated database utilities.</p>
              </div>

              {/* Threshold Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-stadium-slate-200">AI Warning Threshold boundary</span>
                  <span className="font-mono text-stadium-orange-400 font-bold bg-stadium-slate-800 border border-stadium-slate-700 px-2 py-0.5 rounded text-xs">
                    {warningThreshold}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="60"
                  max="90"
                  value={warningThreshold}
                  onChange={(e) => {
                    setWarningThreshold(parseInt(e.target.value, 10));
                    setPrevCriticalCount(0); // reset trigger memory on threshold edit
                  }}
                  className="w-full accent-stadium-orange-500 bg-stadium-slate-750 h-2 rounded-lg cursor-pointer"
                  aria-label="Warning threshold slider"
                />
                <p className="text-[10px] text-stadium-slate-450">
                  Defines the density boundary at which gates cross into warning levels and trigger automated Gemini API congestion alerts.
                </p>
              </div>

              {/* Toggle Warning Chimes */}
              <div className="flex items-center justify-between p-4 bg-stadium-slate-850 rounded-lg border border-stadium-slate-800">
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-stadium-slate-200">Sound Alert Chimes</span>
                  <span className="text-[10px] text-stadium-slate-450 block">Synthesize critical audio tones when gates cross the warning threshold.</span>
                </div>
                <button
                  onClick={() => setAlarmEnabled(!alarmEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    alarmEnabled ? 'bg-stadium-orange-600' : 'bg-stadium-slate-700'
                  }`}
                  aria-label="Toggle Warning Chimes"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    alarmEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Test Audio Chime Button */}
              <div className="flex items-center justify-between p-4 bg-stadium-slate-850 rounded-lg border border-stadium-slate-800">
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-stadium-slate-200">Chime Audio Diagnostics</span>
                  <span className="text-[10px] text-stadium-slate-450 block">Trigger a diagnostic play of the synthesized warning chime.</span>
                </div>
                <button
                  onClick={playAlarmSound}
                  className="px-3.5 py-1.5 bg-stadium-slate-800 hover:bg-stadium-slate-700 text-stadium-slate-200 rounded border border-stadium-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Test Chime Tone
                </button>
              </div>

              {/* Purge / Reset DB Logs Utility */}
              <div className="flex items-center justify-between p-4 bg-stadium-slate-850 rounded-lg border border-stadium-slate-800">
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-stadium-slate-200">Purge Telemetry Logs</span>
                  <span className="text-[10px] text-stadium-slate-450 block">Purge local database files and simulated crowd logs to start fresh.</span>
                </div>
                <div className="flex items-center gap-2">
                  {purgedMessage && (
                    <span className="text-emerald-400 text-xs font-bold animate-fade-in bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                      ✓ Logs Purged
                    </span>
                  )}
                  <button
                    onClick={handlePurgeLogs}
                    disabled={purgingLogs}
                    className="px-3.5 py-1.5 bg-stadium-orange-600/10 hover:bg-stadium-orange-600/20 border border-stadium-orange-500/30 text-stadium-orange-400 rounded text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {purgingLogs ? 'Purging...' : 'Purge DB'}
                  </button>
                </div>
              </div>

              {/* System Info Code blocks */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-900 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-stadium-orange-400 font-mono font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>Operations Console Diagnostics</span>
                </div>
                <div className="text-[10px] font-mono text-stadium-slate-400 leading-relaxed space-y-1">
                  <p>&gt; System Status: ACTIVE</p>
                  <p>&gt; Polling Interval: 5 SECONDS (DEBOUNCED)</p>
                  <p>&gt; Gemini Model: GEMINI-2.5-FLASH</p>
                  <p>&gt; Mock Database Mode: ACTIVE</p>
                </div>
              </div>

            </section>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-stadium-slate-900 pt-6 text-center text-xs text-stadium-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© FIFA World Cup 2026 Venue Security Team. All simulation logs grounded in Gemini AI.</p>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-stadium-orange-500" />
          <span>Hackathon Submission Engine v2.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
