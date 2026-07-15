import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Calendar, Brain, Award, FolderOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { clearForm } from '../store';

export default function FormPanel() {
  const formState = useSelector((state) => state.crm.formState);
  const dispatch = useDispatch();

  const { hcp_name, date, sentiment, topics, materials, next_steps } = formState;

  // Sentiment styling helper
  const getSentimentBadge = (sent) => {
    const formatted = (sent || 'Neutral').toLowerCase();
    switch (formatted) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            ● Positive
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25">
            ● Negative
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/25">
            ● Neutral
          </span>
        );
    }
  };

  const handleReset = () => {
    dispatch(clearForm());
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden shadow-2xl border-slate-800/80">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
          <h2 className="font-bold text-lg text-slate-100 tracking-tight">Interaction Details</h2>
        </div>
        <button
          onClick={handleReset}
          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 hover:text-indigo-400 transition text-slate-400"
          title="Clear form data"
        >
          <RefreshCw size={12} />
          Reset Form
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Helper Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800/50 text-xs text-slate-400">
          <AlertCircle className="text-indigo-400 shrink-0 mt-0.5" size={14} />
          <span>
            This form is managed by the AI Assistant. Speak to the chat assistant on the right to populate, edit, or save the form.
          </span>
        </div>

        {/* HCP Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User size={13} className="text-indigo-400" />
            HCP Name
          </label>
          <input
            type="text"
            value={hcp_name || ''}
            readOnly
            placeholder="Dr. No selection"
            className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-slate-200 placeholder-slate-600 focus:outline-none cursor-not-allowed text-sm transition"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={13} className="text-indigo-400" />
            Date of Meeting
          </label>
          <input
            type="text"
            value={date || ''}
            readOnly
            placeholder="YYYY-MM-DD"
            className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-slate-200 placeholder-slate-600 focus:outline-none cursor-not-allowed text-sm transition"
          />
        </div>

        {/* Sentiment */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award size={13} className="text-indigo-400" />
            Meeting Sentiment
          </label>
          <div className="px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center min-h-[46px]">
            {getSentimentBadge(sentiment)}
          </div>
        </div>

        {/* Topics Discussed */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Brain size={13} className="text-indigo-400" />
            Topics Discussed
          </label>
          <div className="w-full min-h-[80px] p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-wrap gap-2 items-start content-start">
            {topics && topics.length > 0 ? (
              topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm"
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-600 italic">No topics listed yet</span>
            )}
          </div>
        </div>

        {/* Materials Shared */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen size={13} className="text-indigo-400" />
            Materials Shared
          </label>
          <div className="w-full min-h-[80px] p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-wrap gap-2 items-start content-start">
            {materials && materials.length > 0 ? (
              materials.map((mat, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-sm"
                >
                  {mat}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-600 italic">No materials shared yet</span>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={13} className="text-indigo-400" />
            Next Steps & Follow-up
          </label>
          <textarea
            value={next_steps || ''}
            readOnly
            placeholder="No follow-up scheduled yet."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-slate-200 placeholder-slate-600 focus:outline-none cursor-not-allowed text-sm transition resize-none"
          />
        </div>
      </div>
    </div>
  );
}
