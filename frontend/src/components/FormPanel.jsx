import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearForm } from '../store';

export default function FormPanel() {
  const formState = useSelector((state) => state.crm.formState);
  const dispatch = useDispatch();

  const { hcp_name, date, sentiment, topics, materials, next_steps } = formState;

  // Format array fields to comma separated strings or list indicators
  const topicsText = topics && topics.length > 0 ? topics.join(', ') : '';
  const materialsText = materials && materials.length > 0 ? materials.join(', ') : '';

  const handleReset = () => {
    dispatch(clearForm());
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
          Interaction Details
        </h2>
        <button
          onClick={handleReset}
          className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition font-medium border border-slate-200"
        >
          Reset Form
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-slate-800">
        {/* HCP Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            HCP Name
          </label>
          <input
            type="text"
            value={hcp_name || ''}
            readOnly
            disabled
            placeholder="Dr. No selection"
            className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-400 focus:outline-none cursor-not-allowed text-sm"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Date of Meeting
          </label>
          <input
            type="text"
            value={date || ''}
            readOnly
            disabled
            placeholder="YYYY-MM-DD"
            className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-400 focus:outline-none cursor-not-allowed text-sm"
          />
        </div>

        {/* Sentiment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Observed/Inferred HCP Sentiment
          </label>
          <div className="flex items-center gap-6 py-1">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-not-allowed">
              <input
                type="radio"
                name="sentiment"
                checked={(sentiment || '').toLowerCase() === 'positive'}
                disabled
                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 accent-indigo-600 cursor-not-allowed"
              />
              Positive
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-not-allowed">
              <input
                type="radio"
                name="sentiment"
                checked={(sentiment || '').toLowerCase() === 'neutral' || !sentiment}
                disabled
                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 accent-indigo-600 cursor-not-allowed"
              />
              Neutral
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-not-allowed">
              <input
                type="radio"
                name="sentiment"
                checked={(sentiment || '').toLowerCase() === 'negative'}
                disabled
                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 accent-indigo-600 cursor-not-allowed"
              />
              Negative
            </label>
          </div>
        </div>

        {/* Topics Discussed */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Topics Discussed
          </label>
          <textarea
            value={topicsText}
            readOnly
            disabled
            placeholder="No topics discussed yet."
            rows={3}
            className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-400 focus:outline-none cursor-not-allowed text-sm resize-none"
          />
        </div>

        {/* Materials Shared */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Materials Shared
          </label>
          <input
            type="text"
            value={materialsText}
            readOnly
            disabled
            placeholder="No materials shared yet."
            className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-400 focus:outline-none cursor-not-allowed text-sm"
          />
        </div>

        {/* Next Steps */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Follow-up Actions
          </label>
          <textarea
            value={next_steps || ''}
            readOnly
            disabled
            placeholder="No follow-up actions scheduled."
            rows={3}
            className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-400 focus:outline-none cursor-not-allowed text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
