/**
 * @fileoverview ChatAssistant widget for on-ground volunteers to query crowd status.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { api } from '../services/api.js';

const QUICK_QUESTIONS = [
  "What's the status at Gate 3?",
  "Are there any active crowd alerts?",
  "Are we redirecting spectators right now?",
  "Which gates have low density?"
];

/**
 * ChatAssistant Component.
 */
export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'bot',
      text: "Hello! I am your AI Stadium Assistant. Ask me anything about live gate capacities, active alerts, or crowd redirect instructions (e.g., 'Is Gate 6 congested?')."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  /**
   * Submits a message to the backend.
   * @param {string} text The chat query.
   */
  const handleSend = async (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    setError('');
    const userMessageId = Math.random().toString(36).substring(7);
    const botMessageId = Math.random().toString(36).substring(7);

    // Add user message
    setMessages(prev => [...prev, { id: userMessageId, sender: 'user', text: query }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(query);
      if (res.success) {
        setMessages(prev => [...prev, { id: botMessageId, sender: 'bot', text: res.response }]);
      } else {
        throw new Error(res.message || 'Failed to retrieve response');
      }
    } catch (err) {
      console.error('Chat failed:', err.message);
      setError(err.message || 'Unable to connect to assistant. Rate limit exceeded or API key missing.');
      setMessages(prev => [
        ...prev,
        { 
          id: botMessageId, 
          sender: 'bot', 
          text: "⚠️ [Error] I'm sorry, I encountered an issue querying the GenAI API. This might be due to rate-limiting or a missing configuration. Please check the network log." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      className="bg-stadium-slate-900 border border-stadium-slate-800 rounded-xl shadow-xl flex flex-col h-[500px] text-white"
      aria-labelledby="chat-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stadium-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-stadium-orange-500 w-5.5 h-5.5" aria-hidden="true" />
          <h2 id="chat-title" className="text-lg font-semibold">
            On-Ground Staff AI Assistant
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stadium-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-stadium-orange-400 animate-pulse" />
          <span className="font-mono bg-stadium-slate-800 px-2 py-0.5 rounded border border-stadium-slate-700">
            gemini-2.5-flash
          </span>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-label="Staff chat logs"
      >
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-full border ${
                isBot 
                  ? 'bg-stadium-slate-800 border-stadium-slate-700 text-stadium-orange-400' 
                  : 'bg-stadium-orange-600 border-stadium-orange-500 text-white'
              }`}>
                {isBot ? <Bot className="w-4 h-4" aria-hidden="true" /> : <User className="w-4 h-4" aria-hidden="true" />}
              </div>
              <div>
                <div className={`p-3 rounded-lg border text-sm leading-relaxed ${
                  isBot 
                    ? 'bg-stadium-slate-850 border-stadium-slate-800 text-stadium-slate-100' 
                    : 'bg-stadium-slate-800 border-stadium-slate-700 text-white'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-stadium-slate-400 mt-1 block">
                  {isBot ? 'FIFA Crowd Assist' : 'Staff Volunteer'}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="p-2 rounded-full border bg-stadium-slate-800 border-stadium-slate-700 text-stadium-orange-400">
              <Bot className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="p-3 rounded-lg border bg-stadium-slate-850 border-stadium-slate-800 text-stadium-slate-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-stadium-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-stadium-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-stadium-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Pills */}
      <div className="px-4 py-2 border-t border-stadium-slate-800/50 bg-stadium-slate-900/50 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((question, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(question)}
            disabled={loading}
            aria-label={`Ask preset question: ${question}`}
            className="text-xs px-2.5 py-1 rounded-full bg-stadium-slate-850 border border-stadium-slate-750 text-stadium-slate-300 hover:bg-stadium-slate-800 hover:border-stadium-slate-700 cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 border-t border-stadium-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask stadium assistant about gates density..."
          disabled={loading}
          maxLength={500}
          aria-label="Stadium assistant question box"
          className="flex-1 bg-stadium-slate-850 border border-stadium-slate-750 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-stadium-orange-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send query"
          className="bg-stadium-orange-600 hover:bg-stadium-orange-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
