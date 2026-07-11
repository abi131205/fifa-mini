/**
 * @fileoverview RadioChatter component displaying real-time simulated ground security updates.
 */
import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw } from 'lucide-react';

const CHATTER_TEMPLATES = [
  { sender: "Volunteer Leo (Gate 3)", message: "Queue is building up fast here. Directing general admission tickets to lanes 12-14." },
  { sender: "Officer Diaz (Sector S)", message: "Corridor S-South is clear. Spectators are moving calmly towards Gate 5." },
  { sender: "Supervisor Kim (Gate 8)", message: "VIP and Media arrival completed. Shifting 3 volunteers to Gate 7 general queue." },
  { sender: "Volunteer Sarah (Gate 6)", message: "Confirming crowd density is stable. Entrance gates ticket readers are fully operational." },
  { sender: "Field Crew Jack (Gate 1)", message: "East shuttle bus just arrived. High inbound flow expected in 2 minutes." },
  { sender: "Security Lead Marcus", message: "Closed barrier lane B-West to prevent bottlenecks. Guiding crowds towards Gate 2." }
];

export default function RadioChatter({ theme }) {
  const [logs, setLogs] = useState([
    { id: 1, time: "20:00:15", sender: "Security Lead Marcus", message: "Monitoring central concourse corridors. All lanes clear." },
    { id: 2, time: "20:01:05", sender: "Volunteer Leo (Gate 3)", message: "Lanes 1 to 4 running smoothly. Processing about 15 tickets per minute." }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Choose random template
      const template = CHATTER_TEMPLATES[Math.floor(Math.random() * CHATTER_TEMPLATES.length)];
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => [
        {
          id: Date.now(),
          time,
          sender: template.sender,
          message: template.message
        },
        ...prev.slice(0, 4) // cap list size
      ]);
    }, 8000); // add log every 8 seconds

    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark';

  return (
    <section 
      className={`p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[280px] ${
        isDark 
          ? 'bg-stadium-slate-900 border-stadium-slate-800 text-white shadow-xl' 
          : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
      }`}
      aria-labelledby="chatter-title"
    >
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-dashed border-slate-700/40 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="text-stadium-orange-500 w-5 h-5 animate-pulse" aria-hidden="true" />
            <h3 id="chatter-title" className="text-sm font-bold uppercase tracking-wider">
              On-Ground Radio Chatter Feed
            </h3>
          </div>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Radio Link Live</span>
          </span>
        </div>

        {/* Transmission List Container */}
        <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1" role="log" aria-label="Field Radio Transmissions">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className={`p-2.5 rounded border text-[10px] leading-relaxed transition-all duration-300 ${
                isDark 
                  ? 'bg-slate-950 border-stadium-slate-850' 
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-extrabold text-stadium-orange-400 uppercase tracking-wide">{log.sender}</span>
                <span className="text-slate-500 font-mono text-[9px]">{log.time}</span>
              </div>
              <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
