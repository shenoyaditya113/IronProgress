
import React from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'log' | 'stats' | 'history';
  setActiveTab: (tab: 'home' | 'log' | 'stats' | 'history') => void;
  headerRight?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, headerRight }) => {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-950 shadow-2xl overflow-hidden relative">
      <header className="p-6 border-b border-white/10 glass-panel sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            IRON PROGRESS
          </h1>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 hide-scrollbar">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-lg glass-panel border-t border-white/10 p-2 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400'}`}
        >
          <ICONS.Dumbbell />
          <span className="text-[10px] mt-1 font-medium">Daily</span>
        </button>
        <button 
          onClick={() => setActiveTab('log')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'log' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400'}`}
        >
          <ICONS.Add />
          <span className="text-[10px] mt-1 font-medium">Add</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'stats' ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400'}`}
        >
          <ICONS.Chart />
          <span className="text-[10px] mt-1 font-medium">Stats</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'history' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'}`}
        >
          <ICONS.History />
          <span className="text-[10px] mt-1 font-medium">History</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
