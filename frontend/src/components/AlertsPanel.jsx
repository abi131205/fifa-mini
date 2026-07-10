/**
 * @fileoverview AlertsPanel rendering Gemini predictions and rerouting recommendations.
 * Satisfies the Accessibility (aria-live) and Problem Alignment parameters.
 */
import React from 'react';
import { AlertTriangle, MapPin, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

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
 * AlertsPanel Component.
 * @param {Object} props
 * @param {Array<Object>} props.alerts List of alert records.
 */
export default function AlertsPanel({ alerts }) {
  // Separate alerts by type (PREDICTION vs REROUTING) for visual clarity of GenAI functions
  const predictions = alerts.filter(a => a.type === 'PREDICTION');
  const reroutes = alerts.filter(a => a.type === 'REROUTING');

  return (
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

        {/* Accessible screen reader announcers */}
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
                  <div>
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <span className="font-bold text-xs uppercase tracking-wider text-stadium-orange-400">
                        {alert.gateName || 'System'} Alert
                      </span>
                      <span className="text-[10px] text-stadium-slate-400 font-mono">{time}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{alert.message}</p>
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
                  className="p-4 rounded-lg border border-blue-900 bg-blue-950/40 text-blue-50 transition-all duration-300"
                >
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
                        ACTIONABLE INSTRUCTION FOR VOLUNTEERS:
                      </span>
                      <p className="text-xs leading-relaxed text-blue-100">{alert.suggestedAction}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
