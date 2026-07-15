import React, { useEffect, useState } from 'react';
import FormPanel from './components/FormPanel';
import ChatPanel from './components/ChatPanel';
import HistoryPanel from './components/HistoryPanel';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export default function App() {
  const [backendOnline, setBackendOnline] = useState(false);

  // Ping backend to check status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/');
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <HeartPulse size={20} />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
                AI-First CRM HCP
              </h1>
              <p className="text-xs text-slate-400">Interaction Portal</p>
            </div>
          </div>

          {/* Backend Health Check Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline-block">API Backend:</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border ${
              backendOnline 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`}>
              <Activity size={12} className={backendOnline ? 'animate-pulse' : ''} />
              <span>{backendOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-[580px]">
          {/* Left panel: Form State */}
          <div className="h-full">
            <FormPanel />
          </div>

          {/* Right panel: Chat Assistant */}
          <div className="h-full">
            <ChatPanel />
          </div>
        </div>

        {/* Database log panel */}
        <div>
          <HistoryPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-slate-900 bg-slate-950/70 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CRM HCP Inc. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-indigo-400" />
            <span>Secure Medical Sandbox Environment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
