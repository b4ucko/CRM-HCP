import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Trash2 } from 'lucide-react';
import { addLocalUserMessage, sendMessage, clearChat } from '../store';

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

    // 1. Add user message locally
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

  const suggestions = [
    {
      label: "📝 Log Dr. Alice",
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
      label: "🔍 History",
      text: "What is the history of Dr. Alice Smith?"
    },
    {
      label: "💾 Save",
      text: "Save this interaction."
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            AI Assistant
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">Log interaction via chat</p>
        </div>
        
        {/* Clear Chat Button */}
        <button
          onClick={() => dispatch(clearChat())}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition font-medium"
          title="Clear chat history"
        >
          <Trash2 size={12} />
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm border shadow-sm transition-all ${
                msg.sender === 'user'
                  ? 'bg-indigo-50 border-indigo-200/60 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed font-normal">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {/* Loading / Typing Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-slate-400 rounded-lg px-4 py-2.5 text-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* Error Indicator */}
        {error && (
          <div className="p-3 rounded border border-rose-200 bg-rose-50 text-xs text-rose-600">
            <span>{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Slider */}
      <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/30">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none custom-scrollbar select-none">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug.text)}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 text-[11px] rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition font-medium disabled:opacity-50"
            >
              {sug.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Describe interaction..."
            className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white font-semibold text-sm transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={12} className="rotate-45" />
            Log
          </button>
        </div>
      </div>
    </div>
  );
}
