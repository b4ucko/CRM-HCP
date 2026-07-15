import React from 'react';
import FormPanel from './components/FormPanel';
import ChatPanel from './components/ChatPanel';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800 overflow-hidden">
      {/* Top Plain Title */}
      <header className="px-8 py-5 bg-slate-100 border-b border-slate-200 shrink-0">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Log HCP Interaction
        </h1>
      </header>

      {/* Main Workspace split panel (occupies remaining height cleanly) */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-7xl mx-auto">
          {/* Left panel: Form State */}
          <div className="lg:col-span-8 h-full overflow-hidden">
            <FormPanel />
          </div>

          {/* Right panel: Chat Assistant */}
          <div className="lg:col-span-4 h-full overflow-hidden">
            <ChatPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
