import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { addLocalUserMessage, sendMessage } from '../store';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const { messages, loading, error } = useSelector((state) => state.crm);
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    // 1. Add user message locally immediately
    dispatch(addLocalUserMessage(text));
    
    // 2. Dispatch thunk to send to API
    dispatch(sendMessage(text));

    // Clear input
    if (!textToSend) {
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Modern suggestions to help the user evaluate features
  const suggestions = [
    {
      label: "📝 Log Dr. Alice's Visit",
      text: "Log meeting: Dr. Alice Smith on July 10, 2026. Sentiment was positive. Discussed Cardiology and Beta Blockers. Shared Brochure V2."
    },
    {
      label: "🔄 Edit Sentiment",
      text: "Change the sentiment to Neutral."
    },
    {
      label: "📅 Schedule Follow-up",
      text: "Schedule follow-up for next week on July 22 to discuss patient enrollment metrics."
    },
    {
      label: "🔍 Retrieve History",
      text: "What is the history of Dr. Alice Smith?"
    },
    {
      label: "💾 Save to Database",
      text: "Save this interaction."
    }
  ];

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden shadow-2xl border-slate-800/80">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/25 border border-indigo-500/35 flex items-center justify-center text-indigo-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 leading-tight">AI Assistant</h2>
            <p className="text-[10px] text-slate-400">LangGraph Agent Controller</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800/60 text-slate-100 rounded-tl-none'
              }`}
            >
              {/* Message text with basic newline formatting */}
              <div className="whitespace-pre-line leading-relaxed font-normal">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {/* Loading / Typing Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800/60 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* Error Indicator */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Slider */}
      <div className="px-6 py-2 border-t border-slate-800 bg-slate-950/20">
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Suggestions</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none custom-scrollbar select-none">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug.text)}
              disabled={loading}
              className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sug.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/10">
        <div className="relative flex items-center rounded-xl bg-slate-950/80 border border-slate-800/80 focus-within:border-indigo-500/50 shadow-inner transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type a message or click a suggestion..."
            className="flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
