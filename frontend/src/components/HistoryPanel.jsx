import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Database, RefreshCw, Layers, Calendar, MessageSquare } from 'lucide-react';
import { fetchSavedInteractions } from '../store';

export default function HistoryPanel() {
  const { savedList, loading } = useSelector((state) => state.crm);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSavedInteractions());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSavedInteractions());
  };

  const getSentimentStyle = (sent) => {
    const formatted = (sent || 'Neutral').toLowerCase();
    switch (formatted) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800/80 shadow-2xl p-6 space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
            SQLite Database Explorer
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-indigo-400 transition"
          title="Refresh database records"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid or Empty logs */}
      {savedList && savedList.length > 0 ? (
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {savedList.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/15 transition-all shadow-inner relative overflow-hidden group"
            >
              {/* Record ID / Timestamp Banner */}
              <div className="flex items-center justify-between mb-3 text-[10px] text-slate-500 font-semibold uppercase">
                <span>Record #{record.id}</span>
                <span>Saved: {record.created_at}</span>
              </div>

              {/* HCP details */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-indigo-300">{record.hcp_name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Calendar size={11} />
                    <span>Meeting Date: {record.date}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getSentimentStyle(record.sentiment)}`}>
                  {record.sentiment}
                </span>
              </div>

              {/* Topics / Materials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-slate-900/60">
                {/* Topics */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Topics
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {record.topics && record.topics.length > 0 ? (
                      record.topics.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[9px] rounded bg-indigo-950/40 border border-indigo-900/40 text-indigo-300">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-700 italic">None</span>
                    )}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Materials
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {record.materials && record.materials.length > 0 ? (
                      record.materials.map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[9px] rounded bg-violet-950/40 border border-violet-900/40 text-violet-300">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-700 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              {record.next_steps && (
                <div className="mt-3.5 pt-3 border-t border-slate-900/60 bg-slate-950/30 p-2.5 rounded-lg border border-slate-900">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Next Steps
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    {record.next_steps}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-slate-950/35 rounded-xl border border-slate-900/60">
          <Layers size={24} className="mx-auto text-slate-700 mb-2" />
          <p className="text-xs text-slate-500">No interaction records saved to the database yet.</p>
        </div>
      )}
    </div>
  );
}
