import { useState, useEffect } from 'react';
import { Sun, Moon, PanelLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import logo from '@/assets/logo-icon.png';

const VaxHeader = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('oncosync-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('oncosync-theme');
    if (saved === 'dark') {
      setDark(true);
    }
  }, []);

  return (
    <header className="h-14 px-4 flex items-center justify-between sticky top-0 z-40 bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
        <img src={logo} alt="OncoSync logo" className="w-7 h-7 rounded-lg shrink-0 object-contain" />
        <div className="min-w-0 flex flex-col justify-center">
          <h1 className="text-[14px] sm:text-[15px] font-bold text-foreground tracking-tight truncate leading-tight">
            OncoSync
          </h1>
          <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide hidden md:block leading-tight">
            Pancreatic Cancer Vaccine Companion
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark(!dark)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <span className="vax-badge-amber shrink-0 text-[10px]">Research Only</span>
      </div>
    </header>
  );
};

export default VaxHeader;
