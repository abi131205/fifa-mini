/**
 * @fileoverview AlertsPanel rendering Gemini predictions and rerouting recommendations.
 * Integrates an interactive mock mobile phone console to dispatch SMS instructions to gate staff.
 */
import React, { useState } from 'react';
import { AlertTriangle, MapPin, ShieldAlert, Sparkles, Navigation, Smartphone, Send, X } from 'lucide-react';

/**
 * Gets urgency color styling for alert cards.
 * @param {string} urgency Urgency level ('high', 'medium', 'low').
 * @returns {string} Tailwind CSS styles.
 */
function getUrgencyCardStyle(urgency) {
  switch (urgency) {
    case 'high':
      return 'border-stadium-orange-600 bg-stadium-orange-950/40 text-stadium-orange-50';
    case 'medium':
      return 'border-amber-600 bg-amber-950/40 text-amber-50';
    default:
      return 'border-stadium-slate-700 bg-stadium-slate-800 text-stadium-slate-100';
  }
}

/**
 * Synthesizes an SMS beep sound using Web Audio API (zero file dependencies).
 */
function playSmsBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    // Double pulse beep
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.24);
  } catch (err) {
    console.error('AudioContext SMS beep failed:', err);
  }
}

export default function AlertsPanel({ alerts, alarmEnabled }) {
  const predictions = alerts.filter(a => a.type === 'PREDICTION');
  const reroutes = alerts.filter(a => a.type === 'REROUTING');

  // SMS Dispatch Console states
  const [activeSms, setActiveSms] = useState(null);
  const [smsStatus, setSmsStatus] = useState('idle'); // 'idle' | 'sending' | 'delivered'
  const [timeDelivered, setTimeDelivered] = useState('');

  /**
   * Simulates dispatching the reroute instructions to volunteer phones.
   * @param {Object} alert Target rerouting directive alert object.
   */
  const handleSmsDispatch = (alert) => {
    setActiveSms(alert);
    setSmsStatus('sending');
    setSmsStatus('sending');
    
    // Simulate Cellular Transmission delay
    setTimeout(() => {
      setSmsStatus('delivered');
      setTimeDelivered(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      // Play delivery tone if warning sound is enabled
      if (alarmEnabled) {
        playSmsBeep();
      }
    }, 1500);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Predictive Congestion Alerts */}
        <section 
          className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white"
          aria-labelledby="pred-alerts-title"
        >
          <div className="flex items-center justify-between mb-4 border-b border-stadium-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-stadium-orange-400 w-5.5 h-5.5" aria-hidden="true" />
              <h3 id="pred-alerts-title" className="text-lg font-bold">
                GenAI Predictive Alerts
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] bg-stadium-orange-500/20 text-stadium-orange-300 px-2 py-0.5 rounded border border-stadium-orange-500/30 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Gemini Active</span>
            </div>
          </div>

          <div 
            aria-live="polite" 
            className="space-y-3 overflow-y-auto max-h-[300px] pr-1"
            role="log"
            aria-label="Predictive capacity logs"
          >
            {predictions.length === 0 ? (
              <div className="text-center py-10 text-stadium-slate-400 text-sm">
                No predictive alerts active. Gates operating within normal capacity.
              </div>
            ) : (
              predictions.map((alert) => {
                const cardStyle = getUrgencyCardStyle(alert.urgency);
                const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                return (
                  <div 
                    key={alert._id} 
                    className={`p-3.5 rounded-lg border-l-4 ${cardStyle} transition-all duration-300 flex gap-3`}
                  >
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      alert.urgency === 'high' ? 'text-stadium-orange-500' : 'text-amber-500'
                    }`} aria-hidden="true" />
                    <div className="flex-grow">
                      <div className="flex justify-between items-baseline gap-2 mb-1">
                        <span className="font-bold text-xs uppercase tracking-wider text-stadium-orange-400">
                          {alert.gateName || 'System'} Alert
                        </span>
                        <span className="text-[10px] text-stadium-slate-400 font-mono">{time}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-100">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          alert.urgency === 'high' ? 'bg-stadium-orange-600' : 'bg-amber-600'
                        }`}>
                          Urgency: {alert.urgency}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Real-time Rerouting Instructions */}
        <section 
          className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white"
          aria-labelledby="reroute-title"
        >
          <div className="flex items-center justify-between mb-4 border-b border-stadium-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="text-blue-400 w-5.5 h-5.5" aria-hidden="true" />
              <h3 id="reroute-title" className="text-lg font-bold">
                GenAI Rerouting Suggestions
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Gemini Active</span>
            </div>
          </div>

          <div 
            aria-live="polite" 
            className="space-y-3 overflow-y-auto max-h-[300px] pr-1"
            role="log"
            aria-label="AI crowd rerouting suggestions"
          >
            {reroutes.length === 0 ? (
              <div className="text-center py-10 text-stadium-slate-400 text-sm">
                No reroute redirects active. Outflow patterns balanced.
              </div>
            ) : (
              reroutes.map((alert) => {
                const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <div 
                    key={alert._id} 
                    className="p-4 rounded-lg border border-blue-900 bg-blue-950/40 text-blue-50 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-baseline gap-2 mb-2">
                        <div className="flex items-center gap-1 text-xs uppercase font-bold text-blue-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Traffic Divert Directive</span>
                        </div>
                        <span className="text-[10px] text-stadium-slate-400 font-mono">{time}</span>
                      </div>
                      
                      <p className="text-sm font-semibold mb-2 text-white">{alert.message}</p>
                      
                      {alert.suggestedAction && (
                        <div className="bg-blue-900/40 border border-blue-800 rounded p-2.5 mt-2">
                          <span className="block text-[10px] font-extrabold text-blue-300 mb-1">
                            ACTIONABLE INSTRUCTION:
                          </span>
                          <p className="text-xs leading-relaxed text-blue-100">{alert.suggestedAction}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSmsDispatch(alert)}
                      className="mt-3.5 w-full py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/50"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Approve & Dispatch Reroute</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Dynamic Slide-over SMS Mockup Panel */}
      {activeSms && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-stadium-slate-900 border border-stadium-slate-800 rounded-2xl w-full max-w-[320px] shadow-2xl p-4 overflow-hidden flex flex-col justify-between items-center text-white">
            
            {/* Phone Header Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black h-4 w-28 rounded-b-xl z-20"></div>

            {/* Exit/Close Cross */}
            <button 
              onClick={() => { setActiveSms(null); setSmsStatus('idle'); }}
              className="absolute top-2 right-2 text-stadium-slate-450 hover:text-white p-1 rounded-full bg-stadium-slate-800 border border-stadium-slate-700 cursor-pointer"
              aria-label="Close SMS dispatch preview"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Phone Screen Chassis Container */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl mt-3 p-3 flex flex-col justify-between aspect-[9/16] relative overflow-hidden">
              
              {/* Virtual OS Status Ticker */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold px-1 mb-2">
                <span>FIFA Net</span>
                <span>12:00 PM</span>
                <span>100% 🔋</span>
              </div>

              {/* Virtual Messages Header */}
              <div className="border-b border-slate-900 pb-2 mb-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-950 border border-blue-900 flex items-center justify-center font-bold text-[10px] text-blue-400">
                  FO
                </div>
                <div>
                  <h4 className="text-[10px] font-bold">FIFA Operations</h4>
                  <span className="text-[8px] text-emerald-400 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Broadcasting Gateway Live</span>
                  </span>
                </div>
              </div>

              {/* Message Thread Body */}
              <div className="flex-grow flex flex-col justify-end space-y-3 pb-3 overflow-y-auto">
                
                {/* Outgoing Message Bubble */}
                <div className="self-end max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-br-none p-2.5 text-[10px] leading-relaxed shadow-sm">
                  <span className="block font-bold text-[8px] opacity-75 mb-0.5">BROADCAST REROUTE DIRECTIVE</span>
                  <p className="font-semibold">{activeSms.message}</p>
                  <p className="mt-1 border-t border-blue-500/50 pt-1 text-[9px] text-blue-100 italic">
                    Instructions: {activeSms.suggestedAction}
                  </p>
                </div>

                {/* Status Ticker */}
                <div className="text-[9px] text-center text-slate-500 italic mt-2 animate-pulse">
                  {smsStatus === 'sending' ? (
                    <span>📡 Uplinking message packets to cellular grid...</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✓ Delivered to on-ground crews ({timeDelivered})</span>
                  )}
                </div>
              </div>

              {/* Phone Input Box Mock */}
              <div className="mt-2 pt-2 border-t border-slate-900 flex items-center gap-1">
                <div className="flex-grow bg-slate-900 text-slate-400 text-[9px] rounded-full px-2 py-1 flex items-center justify-between">
                  <span>Simulated dispatch</span>
                  <Send className="w-2.5 h-2.5 text-blue-500" />
                </div>
              </div>

            </div>

            {/* Simulated Delivery Notice Footer */}
            <div className="w-full mt-4 flex flex-col items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                smsStatus === 'sending' 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {smsStatus === 'sending' ? 'Transmitting...' : 'Alert Dispatched!'}
              </span>
              <p className="text-[10px] text-stadium-slate-400 text-center">
                SMS instruction logged in Mongo DB and sent to crew terminals.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
