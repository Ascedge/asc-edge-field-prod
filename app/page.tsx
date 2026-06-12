export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* ASC EDGE Header with eagle branding */}
      <header className="bg-[#0a0e1a] border-b border-[#d4af37]/60 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-4xl drop-shadow-[0_0_12px_#d4af37]">🦅</div>
          <div>
            <div className="text-[#d4af37] font-bold tracking-[4px] text-[28px] leading-none">ASC</div>
            <div className="text-[10px] text-white/70 tracking-[2px] -mt-0.5">EDGE FIELD</div>
          </div>
        </div>
        <div className="px-4 py-1 text-xs font-mono border border-[#d4af37]/40 rounded bg-black/40 text-[#d4af37]">COMMAND BLACK</div>
      </header>

      {/* Main Content - Mobile-first, centered search */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#d4af37] text-xs px-4 py-1.5 rounded-full mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
              </span>
              ON SITE MODE
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Property Lookup</h1>
            <p className="text-white/60 text-lg">Enter an address to begin inspection</p>
          </div>

          {/* Large centered address search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Enter property address"
              className="w-full bg-white/10 border border-white/20 focus:border-[#d4af37] text-white placeholder:text-white/40 rounded-2xl px-8 py-6 text-xl outline-none transition-all text-center"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#d4af37] text-3xl">⌕</div>
          </div>

          <p className="text-center text-white/40 text-sm mt-6">
            One-handed operation • Field ready<br />
            Sovereign Gold • Command Black
          </p>
        </div>
      </main>

      {/* Bottom Rep Mode Bar */}
      <nav className="bg-[#0a0e1a] border-t border-white/10 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex justify-around items-center py-3 px-4">
          <button className="flex flex-col items-center gap-1 text-[#d4af37] active:scale-95 transition">
            <div className="text-3xl">🏠</div>
            <div className="text-[10px] font-medium tracking-wider">HOME</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#3b82f6] active:scale-95 transition">
            <div className="text-3xl">📍</div>
            <div className="text-[10px] font-medium tracking-wider">LOG VISIT</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-white active:scale-95 transition">
            <div className="text-3xl">📞</div>
            <div className="text-[10px] font-medium tracking-wider">CALL</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#22c55e] active:scale-95 transition">
            <div className="text-3xl">📊</div>
            <div className="text-[10px] font-medium tracking-wider">DASHBOARD</div>
          </button>
        </div>
      </nav>

      {/* Safe area spacer for fixed bottom bar */}
      <div className="h-20"></div>
    </div>
  );
}
