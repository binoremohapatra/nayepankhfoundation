import React from 'react';

interface DashboardLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ leftPanel, rightPanel }) => {
  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans flex flex-col">
      {/* ── TOP NAVBAR ── */}
      <nav className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/10"
           style={{ background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(16px)' }}>
        
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        boxShadow: '0 0 18px rgba(34,197,94,0.4)' }}>
            <span className="text-white font-black text-lg leading-none">N</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-white tracking-wide">NayePankh</span>
            <span className="text-[10px] text-green-400 font-medium tracking-widest uppercase">AI Volunteer Hub</span>
          </div>
        </div>

        {/* Centre pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
             style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-300">Live Volunteer Onboarding</span>
        </div>

        {/* Right badges */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] text-white/40">Powered by</span>
            <span className="text-[11px] font-semibold text-violet-400">Gemini AI</span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            🌟
          </div>
        </div>
      </nav>

      {/* ── MAIN GRID ── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left column */}
        <div className="flex flex-col overflow-hidden border-r border-white/[0.06]">
          {leftPanel}
        </div>
        {/* Right column */}
        <div className="flex flex-col overflow-hidden">
          {rightPanel}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
