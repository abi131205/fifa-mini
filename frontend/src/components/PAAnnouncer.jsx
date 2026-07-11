/**
 * @fileoverview PAAnnouncer component for stadium security broadcasts.
 * Integrates Web Speech API text-to-speech engine with Web Audio chimes.
 */
import React, { useState } from 'react';
import { Volume2, Megaphone, HelpCircle } from 'lucide-react';

const PRESET_MESSAGES = [
  {
    label: "Congestion Redirect Notice",
    text: "Attention all spectators. Gate 3 is currently experiencing heavy crowd volumes. For your safety and faster entry, please proceed to Gate 2 or Gate 5, where security queues are clear."
  },
  {
    label: "Halftime Concourse Clearance",
    text: "Notice to fans in the stadium concourse. Please clear the exit walkways. Keep corridors free for emergency crews and stadium security."
  },
  {
    label: "Post-Match Outflow Guidance",
    text: "Thank you for attending today's match. As you exit the stadium bowl, follow the illuminated green exit lanes towards the central transit hub."
  }
];

export default function PAAnnouncer({ theme, userRole }) {
  const [customText, setCustomText] = useState('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(0.85); // slower speech rates fit stadium acoustics
  const [broadcasting, setBroadcasting] = useState(false);

  const isDark = theme === 'dark';
  const isRestricted = userRole !== 'director';

  /**
   * Synthesizes a PA Dispatch Chime before speaking.
   */
  const playPaChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime); // C#5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5 chime
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (err) {
      console.warn('PA pre-chime audio block failed:', err);
    }
  };

  /**
   * Dispatches text safety warning over speech synthesis.
   */
  const handleBroadcast = () => {
    const textToSpeak = customText || PRESET_MESSAGES[0].text;
    if (!textToSpeak) return;

    setBroadcasting(true);
    playPaChime();

    // Small delay to allow the chime to finish playing before speaking
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        // Cancel any current speaking
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.pitch = pitch;
        utterance.rate = rate;
        
        utterance.onend = () => {
          setBroadcasting(false);
        };
        
        utterance.onerror = () => {
          setBroadcasting(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser.');
        setBroadcasting(false);
      }
    }, 450);
  };

  return (
    <section 
      className={`p-5 rounded-xl border transition-all duration-300 ${
        isDark 
          ? 'bg-stadium-slate-900 border-stadium-slate-800 text-white shadow-xl' 
          : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
      }`}
      aria-labelledby="pa-title"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stadium-slate-800">
        <div className="flex items-center gap-2">
          <Megaphone className="text-stadium-orange-500 w-5 h-5" aria-hidden="true" />
          <h3 id="pa-title" className="text-sm font-bold uppercase tracking-wider">
            Stadium Public Address (PA) Broadcaster
          </h3>
        </div>
        
        {isRestricted && (
          <span className="text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
            Crew Restricted
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Preset Selectors */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
            Select safety template
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_MESSAGES.map((msg, idx) => (
              <button
                key={idx}
                disabled={isRestricted || broadcasting}
                onClick={() => setCustomText(msg.text)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                  isDark 
                    ? 'bg-stadium-slate-850 hover:bg-stadium-slate-800 text-slate-200 border border-stadium-slate-800' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {msg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input area */}
        <div>
          <label htmlFor="pa-text-area" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
            Broadcast announcement script
          </label>
          <textarea
            id="pa-text-area"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={isRestricted || broadcasting}
            placeholder={PRESET_MESSAGES[0].text}
            className={`w-full h-24 p-3 rounded-lg border text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-stadium-orange-500 transition-colors ${
              isDark 
                ? 'bg-slate-950 border-stadium-slate-800 text-white placeholder-slate-600' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Speed / Pitch Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Speech rate (speed)</span>
              <span>{rate}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              disabled={isRestricted || broadcasting}
              className="w-full accent-stadium-orange-500 bg-slate-700 h-1 rounded cursor-pointer"
              aria-label="Speech speed rate slider"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Voice Pitch tone</span>
              <span>{pitch}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              disabled={isRestricted || broadcasting}
              className="w-full accent-stadium-orange-500 bg-slate-700 h-1 rounded cursor-pointer"
              aria-label="Speech pitch tone slider"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleBroadcast}
          disabled={isRestricted || broadcasting}
          className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all ${
            broadcasting
              ? 'bg-amber-600 text-white animate-pulse'
              : isRestricted
              ? 'bg-slate-750 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-stadium-orange-600 hover:bg-stadium-orange-500 text-white'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{broadcasting ? 'Broadcasting Announcement...' : 'Broadcast over Stadium PA'}</span>
        </button>
        
        {isRestricted && (
          <p className="text-[10px] text-amber-500 text-center flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Switch operator role to Stadium Director to dispatch PA broadcasts.</span>
          </p>
        )}
      </div>
    </section>
  );
}
