const VaxHeader = () => (
  <header className="bg-card border-b border-border py-3.5 px-6">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-base tracking-tight">V</span>
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-foreground tracking-tight">Vax Research Platform</h1>
          <p className="text-[11px] text-muted-foreground font-medium tracking-wide">Qβ–ApoC1 VLP Vaccine Analysis</p>
        </div>
      </div>
      <span className="vax-badge-amber">Research Use Only</span>
    </div>
  </header>
);

export default VaxHeader;
