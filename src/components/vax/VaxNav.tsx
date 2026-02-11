import { useState } from 'react';

interface VaxNavProps {
  tab: number;
  setTab: (tab: number) => void;
}

const tabs = ['Overview', 'Lab Records', 'Analysis', 'Simulation', 'Immune Tracking', 'Safety', 'Export', 'T-Cell Proxy', 'Validation'];

const VaxNav = ({ tab, setTab }: VaxNavProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Desktop tabs */}
        <div className="hidden sm:flex">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`vax-nav-tab ${tab === i ? 'active' : ''}`}
              aria-current={tab === i ? 'page' : undefined}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Mobile dropdown */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-full flex items-center justify-between py-3 text-[13px] font-medium"
          >
            <span className="text-primary">{tabs[tab]}</span>
            <span className="text-muted-foreground">{mobileOpen ? '▲' : '▼'}</span>
          </button>
          {mobileOpen && (
            <div className="pb-2 space-y-0.5">
              {tabs.map((t, i) => (
                <button
                  key={t}
                  onClick={() => { setTab(i); setMobileOpen(false); }}
                  className={`block w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    tab === i ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default VaxNav;
