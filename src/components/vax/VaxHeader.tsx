import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
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
    <header className="bg-card border-b border-border py-3.5 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="OncoSync logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0 object-contain" />
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-[14px] sm:text-[15px] font-bold text-foreground tracking-tight truncate leading-tight">OncoSync</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wide hidden sm:block leading-tight">Pancreatic Cancer Vaccine Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative overflow-hidden"
            aria-label="Toggle dark mode"
          >
            <span
              key={dark ? 'sun' : 'moon'}
              className="animate-fade-in"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </span>
          </button>
          <span className="vax-badge-amber shrink-0 text-[10px] sm:text-[11px]">Research Use Only</span>
        </div>
      </div>
    </header>
  );
};

export default VaxHeader;
