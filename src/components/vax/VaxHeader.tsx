const VaxHeader = () => (
  <header className="bg-card border-b border-border py-3 px-6">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">Vax Research Platform</h1>
          <p className="text-xs text-muted-foreground">Qβ–ApoC1 VLP Vaccine Analysis</p>
        </div>
      </div>
      <span className="vax-badge-amber">Research Use Only</span>
    </div>
  </header>
);

export default VaxHeader;
