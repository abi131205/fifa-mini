/**
 * @fileoverview SystemHealth component displaying diagnostics charts, server ping latency, and database status.
 */
import React, { useState, useEffect } from 'react';
import { Activity, Database, Cpu, Wifi } from 'lucide-react';

export default function SystemHealth({ theme }) {
  const [latency, setLatency] = useState(45);
  const [latencyHistory, setLatencyHistory] = useState([42, 45, 48, 43, 47, 45, 46, 44, 45, 47]);
  const [cpuUsage, setCpuUsage] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate real-time jitter in latency and low CPU load
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const next = Math.max(15, Math.min(120, prev + delta));
        setLatencyHistory(hist => [...hist.slice(1), next]);
        return next;
      });
      setCpuUsage(() => Math.floor(Math.random() * 15) + 8);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark';

  return (
    <section 
      className={`p-5 rounded-xl border transition-all duration-300 ${
        isDark 
          ? 'bg-stadium-slate-900 border-stadium-slate-800 text-white shadow-xl' 
          : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
      }`}
      aria-labelledby="system-health-title"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dashed border-slate-700/40">
        <Activity className="text-stadium-orange-500 w-5 h-5" aria-hidden="true" />
        <h3 id="system-health-title" className="text-sm font-bold uppercase tracking-wider">
          Venue Ops Diagnostics Console
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Latency card */}
        <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${isDark ? 'bg-stadium-slate-850 border-stadium-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Uplink Latency</span>
            <span className="font-mono text-base font-extrabold text-stadium-orange-400">{latency} ms</span>
          </div>
          <Wifi className="w-5 h-5 text-stadium-orange-400 flex-shrink-0" />
        </div>

        {/* DB Connection */}
        <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${isDark ? 'bg-stadium-slate-850 border-stadium-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Database Uplink</span>
            <span className="text-xs font-extrabold text-emerald-400 block">Mongoose Connected</span>
          </div>
          <Database className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        </div>

        {/* Thread usage */}
        <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${isDark ? 'bg-stadium-slate-850 border-stadium-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">CPU Diagnostics</span>
            <span className="font-mono text-base font-extrabold text-blue-400">{cpuUsage}% utilization</span>
          </div>
          <Cpu className="w-5 h-5 text-blue-400 flex-shrink-0" />
        </div>
      </div>

      {/* Latency History Graph widget */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline text-[10px] text-slate-400">
          <span className="font-bold">Uplink Telemetry History Feed</span>
          <span className="font-mono">Syncing...</span>
        </div>
        <div 
          className={`h-12 w-full rounded flex items-end gap-1.5 p-2 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}
          role="group" 
          aria-label="Uplink latency history chart"
        >
          {latencyHistory.map((val, idx) => {
            // Scale bar height to fit the 120ms max latency
            const heightPct = Math.min(100, Math.max(10, (val / 120) * 100));
            return (
              <div 
                key={idx}
                className="flex-grow bg-stadium-orange-500 rounded-t transition-all duration-300"
                style={{ height: `${heightPct}%` }}
                role="img"
                aria-label={`Latency reading ${idx + 1}: ${val} ms`}
                title={`${val} ms`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
