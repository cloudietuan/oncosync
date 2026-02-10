const VaxHeader = () => (
  <header className="bg-card border-b border-border py-3.5 px-4 sm:px-6">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
          <span className="text-white font-bold text-sm sm:text-base tracking-tight">V</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[14px] sm:text-[15px] font-bold text-foreground tracking-tight truncate">Vax Research Platform</h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wide hidden sm:block">Qβ–ApoC1 VLP Vaccine Analysis</p>
        </div>
      </div>
      <span className="vax-badge-amber shrink-0 text-[10px] sm:text-[11px]">Research Use Only</span>
    </div>
  </header>
);

export default VaxHeader;
