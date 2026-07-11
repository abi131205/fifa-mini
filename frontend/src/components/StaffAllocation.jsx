/**
 * @fileoverview StaffAllocation component to distribute 120 volunteers across gates, dampening simulation accumulation rates.
 */
import React, { useState, useEffect } from 'react';
import { Users, Info, Check } from 'lucide-react';
import { api } from '../services/api.js';

export default function StaffAllocation({ gates }) {
  const TOTAL_POOL = 120;
  
  // Local allocations state (initialized to 15 per gate)
  const [allocation, setAllocation] = useState(
    gates.reduce((acc, gate) => {
      acc[gate.id] = 15;
      return acc;
    }, {})
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize local allocations if gates change or when initially loaded
  useEffect(() => {
    if (gates.length > 0) {
      setAllocation(prev => {
        const next = { ...prev };
        gates.forEach(g => {
          if (next[g.id] === undefined) {
            next[g.id] = 15;
          }
        });
        return next;
      });
    }
  }, [gates]);

  // Calculate allocated sum and remaining unallocated pool
  const allocatedSum = Object.values(allocation).reduce((sum, val) => sum + val, 0);
  const remainingPool = TOTAL_POOL - allocatedSum;

  /**
   * Handles local slider changes, checking that we don't exceed the total pool limit.
   * @param {string} gateId Gate ID.
   * @param {number} value New volunteer count.
   */
  const handleSliderChange = (gateId, value) => {
    const prevVal = allocation[gateId] || 0;
    const diff = value - prevVal;
    
    if (remainingPool - diff < 0) {
      // Not enough volunteers remaining in pool, cap at maximum possible
      const maxPossible = prevVal + remainingPool;
      setAllocation(prev => ({
        ...prev,
        [gateId]: maxPossible
      }));
    } else {
      setAllocation(prev => ({
        ...prev,
        [gateId]: value
      }));
    }
    setSaved(false); // Reset saved status on edit
    setErrorMessage('');
  };

  /**
   * Submits the staff allocation to the backend API.
   */
  const handleSaveAllocation = async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      const res = await api.allocateStaff(allocation);
      if (res.success) {
        setSaved(true);
        // Fade out saved badge after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrorMessage(res.message || 'Failed to update staff allocation.');
      }
    } catch (err) {
      console.error('Failed to submit staff allocation:', err.message);
      setErrorMessage('Server connection error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section 
      className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl p-5 shadow-xl text-white"
      aria-labelledby="staff-allocation-title"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stadium-slate-800">
        <div className="flex items-center gap-2">
          <Users className="text-stadium-orange-500 w-5 h-5" aria-hidden="true" />
          <h3 id="staff-allocation-title" className="text-lg font-semibold">
            Volunteer Staff Dispatch Center
          </h3>
        </div>

        {/* Counter Ring/Badge */}
        <div className="flex items-center gap-2 bg-stadium-slate-850 px-3 py-1.5 rounded-lg border border-stadium-slate-800 text-xs">
          <span className="text-stadium-slate-400 font-medium">Unallocated Staff:</span>
          <span className={`font-mono font-bold text-sm ${remainingPool === 0 ? 'text-emerald-400' : 'text-stadium-orange-400 animate-pulse'}`}>
            {remainingPool} / {TOTAL_POOL}
          </span>
        </div>
      </div>

      {/* Info Alert Box */}
      <div className="bg-blue-950/40 border border-blue-900 rounded-lg p-3 text-xs text-blue-200 flex items-start gap-2.5 mb-5">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong>Dampening Operations Mechanics:</strong> Stationing more staff at a gate speeds up spectator screening, slowing down crowd density accumulation. Pulling staff away increases entry bottleneck rates.
        </p>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {gates.map((gate) => {
          const count = allocation[gate.id] || 15;
          return (
            <div 
              key={gate.id}
              className="p-3 bg-stadium-slate-850 rounded-lg border border-stadium-slate-800 flex flex-col justify-between gap-2 hover:border-stadium-slate-750 transition-colors"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold tracking-wide text-stadium-slate-200">{gate.name}</span>
                <span className="font-mono bg-stadium-slate-800 border border-stadium-slate-700 px-2 py-0.5 rounded text-[10px] text-stadium-orange-400 font-bold">
                  {count} volunteers
                </span>
              </div>

              {/* Custom Range Slider */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-stadium-slate-500 font-mono w-4">0</span>
                <input 
                  type="range"
                  min="0"
                  max="40"
                  value={count}
                  onChange={(e) => handleSliderChange(gate.id, parseInt(e.target.value, 10))}
                  className="flex-grow accent-stadium-orange-500 bg-stadium-slate-750 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-stadium-orange-500"
                  aria-label={`Volunteer count for ${gate.name}`}
                />
                <span className="text-[10px] text-stadium-slate-500 font-mono w-4">40</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-stadium-slate-800 pt-4">
        {errorMessage ? (
          <p className="text-xs text-stadium-orange-400 font-medium">{errorMessage}</p>
        ) : (
          <p className="text-xs text-stadium-slate-400 font-medium">
            Total Staff Stationed: <span className="font-mono text-white font-bold">{allocatedSum}</span>
          </p>
        )}

        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold animate-fade-in bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              <Check className="w-3.5 h-3.5" />
              <span>Dispatched</span>
            </div>
          )}

          <button
            onClick={handleSaveAllocation}
            disabled={saving || allocatedSum === 0}
            className="px-4 py-2 bg-stadium-orange-600 hover:bg-stadium-orange-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-stadium-orange-600/10 cursor-pointer disabled:opacity-50 transition-all"
          >
            {saving ? 'Dispatching...' : 'Dispatch Volunteers'}
          </button>
        </div>
      </div>
    </section>
  );
}
