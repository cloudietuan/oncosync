const VaxHeader = () => (
  <header className="bg-card border-b border-border py-3.5 px-4 sm:px-6">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-md shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <span className="text-white font-bold text-sm sm:text-base tracking-tighter relative z-10" style={{ fontFamily: "'JetBrains Mono', monospace" }}>◎</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[14px] sm:text-[15px] font-bold text-foreground tracking-tight truncate">OncoSync</h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wide hidden sm:block">Pancreatic Cancer Vaccine Companion</p>
        </div>
      </div>
      <span className="vax-badge-amber shrink-0 text-[10px] sm:text-[11px]">Research Use Only</span>
    </div>
  </header>
);

export default VaxHeader;
