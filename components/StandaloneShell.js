'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageStudio, VideoStudio, LipSyncStudio, CinemaStudio, getUserBalance } from 'studio';
import ApiKeyModal from './ApiKeyModal';


const PROJECTS = [
  { id: 'my-generations', name: 'My Generations', count: '102 assets', active: true, icon: '🎞️' },
  { id: 'alleyway-fight', name: 'Alleyway Fight...', count: '12 assets', icon: '🎬' },
  { id: 'zeus-portrait', name: 'Zeus-1 Portrait', count: '3 assets', icon: '👨' },
  { id: 'live-rap', name: 'Live Rap Perfor...', count: '78 assets', icon: '🎤' },
  { id: 'mob-boss', name: 'Mob Boss Tazz', count: '11 assets', icon: '🕴️' },
  { id: 'new-project-1', name: 'New project', count: '4 assets', icon: '📁' },
  { id: 'naruto-live', name: 'Naruto Live Cast', count: '45 assets', icon: '🥷' },
  { id: 'naruto-ship', name: 'Naruto Shippu...', count: '22 assets', icon: '🍃' },
  { id: 'mob-podcast', name: 'MOB Podcast', count: '1 asset', icon: '🎙️' },
];

const STORAGE_KEY = 'muapi_key';

export default function StandaloneShell() {
  const [apiKey, setApiKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('cinema');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchBalance = useCallback(async (key) => {
    try {
      const data = await getUserBalance(key);
      setBalance(data.balance);
    } catch (err) {
      console.error('Balance fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      fetchBalance(stored);
    }
  }, [fetchBalance]);

  const handleKeySave = useCallback((key) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    fetchBalance(key);
  }, [fetchBalance]);

  const renderStudio = () => {
    switch (activeTab) {
      case 'image': return <ImageStudio apiKey={apiKey} />;
      case 'video': return <VideoStudio apiKey={apiKey} />;
      case 'audio': return <LipSyncStudio apiKey={apiKey} />;
      case 'cinema': return <CinemaStudio apiKey={apiKey} />;
      default: return <CinemaStudio apiKey={apiKey} />;
    }
  };

  if (!hasMounted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-[#93e8d3]/20 border-t-[#93e8d3] rounded-full animate-spin"></div>
        <div className="absolute inset-0 blur-xl bg-[#93e8d3]/20 animate-pulse"></div>
      </div>
    </div>
  );

  if (!apiKey) {
    return <ApiKeyModal onSave={handleKeySave} />;
  }

  return (
    <div className="h-screen bg-[#050505] flex overflow-hidden text-white font-sans selection:bg-purple-500/30">
      
      {/* ── LEFT ICON SIDEBAR ── */}
      <div className="w-[68px] flex-shrink-0 bg-[#080808] border-r border-white/5 flex flex-col items-center py-6 gap-8 z-50">
        <div className="w-10 h-10 bg-gradient-to-br from-[#93e8d3] to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(147,232,211,0.3)] mb-4 cursor-pointer hover:scale-105 transition-transform">
           <span className="font-black text-black text-xl">M</span>
        </div>
        
        <div className="flex flex-col gap-6">
          {['🏠', '🔍', '➕', '⚙️'].map((icon, i) => (
            <button key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${i === 2 ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-lg">{icon}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-6 pb-2">
           <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 cursor-pointer hover:text-white transition-colors">
              ?
           </div>
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition-all">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Tazz" alt="User" />
           </div>
        </div>
      </div>

      {/* ── PROJECT / ASSETS SIDEBAR ── */}
      {isSidebarOpen && (
        <div className="w-[260px] flex-shrink-0 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-40 animate-slide-in-left">
          <div className="h-[72px] px-6 flex items-center justify-between border-b border-white/5">
            <h2 className="font-bold tracking-tight text-white/90">Projects</h2>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
            {PROJECTS.map((project) => (
              <button 
                key={project.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${project.active ? 'bg-white/5 text-white' : 'text-white/40 hover:bg-white/[0.02] hover:text-white/70'}`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{project.icon}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{project.name}</span>
                  <span className="text-[10px] text-white/20 font-medium">{project.count}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Storage</span>
                 <span className="text-[10px] font-bold text-[#93e8d3]">82%</span>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-[#93e8d3] to-purple-500" style={{ width: '82%' }}></div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
        <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-8 bg-[#080808]/50 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <nav className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 shadow-inner">
              {[
                { id: 'image', name: 'Image', icon: '🖼️', color: 'from-blue-500/20 to-cyan-500/20' },
                { id: 'video', name: 'Video', icon: '🎥', color: 'from-orange-500/20 to-red-500/20' },
                { id: 'audio', name: 'Audio', icon: '🔊', color: 'from-pink-500/20 to-purple-500/20' },
                { id: 'cinema', name: 'Cinema', icon: '🎬', color: 'from-[#93e8d3]/20 to-emerald-500/20' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 overflow-hidden group ${activeTab === tab.id ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                  {activeTab === tab.id && (
                    <div className={`absolute inset-0 bg-gradient-to-tr ${tab.color} opacity-100 animate-pulse-slow`}></div>
                  )}
                  <span className={`text-sm transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
                  <span className="relative z-10 uppercase tracking-widest">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#93e8d3] rounded-full shadow-[0_0_10px_#93e8d3]"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Balance</span>
                <span className="text-sm font-bold text-[#93e8d3]">{balance || 0} Credits</span>
             </div>
             <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
             </button>
          </div>
        </header>


        {/* ACTIVE STUDIO AREA */}
        <main className="flex-1 relative overflow-hidden flex bg-black">
          {renderStudio()}
          
          {/* Global Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#93e8d3]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        </main>

      </div>
    </div>
  );
}
