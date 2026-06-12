import { Home as HomeIcon, MapPin, Phone, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* ASC EDGE Header — using actual logo if present, otherwise refined text mark */}
      <header className="bg-[#0a0e1a] border-b border-[#d4af37]/60 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ASC EDGE" className="h-9 w-auto" />
          <div>
            <div className="text-[#d4af37] font-bold tracking-[3px] text-3xl leading-none">ASC</div>
            <div className="text-[10px] text-white/70 tracking-[2.5px] -mt-0.5">EDGE FIELD</div>
          </div>
        </div>
      </header>

      {/* Main Content - tightened vertical rhythm, premium typography, no design notes */}
      <main className="flex-1 flex flex-col justify-center px-6 pt-8 pb-24">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 text-[#d4af37] text-xs tracking-widest px-5 py-2 rounded-full mb-6 border border-[#d4af37]/30">
              ON SITE
            </div>
            <h1 className="text-[32px] leading-none font-bold text-white mb-3">Property Lookup</h1>
            <p className="text-white/70 text-[15px]">Enter the property address below</p>
          </div>

          {/* Large centered address search — refined, no emoji */}
          <div className="relative">
            <input
              type="text"
              placeholder="Enter property address"
              className="w-full bg-[#111827] border border-white/30 focus:border-[#d4af37] text-white placeholder:text-white/50 rounded-3xl px-8 py-7 text-xl outline-none transition-all text-center"
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[#d4af37]">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Rep Mode Bar — thin Lucide icons in Sovereign Gold, no emoji */}
      <nav className="bg-[#0a0e1a] border-t border-[#d4af37]/30 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex justify-around items-center py-4">
          <button className="flex flex-col items-center gap-1 text-[#d4af37] active:opacity-70 transition-all">
            <HomeIcon className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">HOME</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#60a5fa] active:opacity-70 transition-all">
            <MapPin className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">LOG VISIT</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-white/90 active:opacity-70 transition-all">
            <Phone className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">CALL</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#4ade80] active:opacity-70 transition-all">
            <BarChart3 className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">DASHBOARD</div>
          </button>
        </div>
      </nav>
    </div>
  );
}
