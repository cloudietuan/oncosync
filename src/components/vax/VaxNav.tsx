import { useState } from 'react';
import { motion } from 'framer-motion';

interface VaxNavProps {
  tab: number;
  setTab: (tab: number) => void;
}

const tabs = ['Overview', 'Lab Records', 'Tissue Analysis', 'Analysis', 'Simulation', 'Immune Tracking', 'Safety', 'Export', 'T-Cell Proxy', 'Validation'];

const VaxNav = ({ tab, setTab }: VaxNavProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Desktop tabs */}
        <div className="hidden sm:flex relative -mb-px">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`relative py-2.5 px-4 text-[12.5px] font-medium cursor-pointer transition-colors duration-150 bg-transparent border-none ${
                tab === i ? 'text-primary' : 'text-muted-foreground/70 hover:text-foreground'
              }`}
              aria-current={tab === i ? 'page' : undefined}
            >
              {t}
              {tab === i && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
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
            <motion.span
              className="text-muted-foreground"
              animate={{ rotate: mobileOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </button>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pb-2 space-y-0.5 overflow-hidden"
            >
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
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default VaxNav;
