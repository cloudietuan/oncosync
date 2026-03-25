import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to app
        </button>

        <div className="flex justify-center">
          <img src="/pwa-icon-192.png" alt="OncoSync" className="w-20 h-20 rounded-2xl shadow-lg" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Install OncoSync
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Install OncoSync on your device for quick access, offline support, and a native app experience.
          </p>
        </div>

        {isInstalled ? (
          <div className="vax-card flex items-center gap-3 text-left">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
            <div>
              <p className="font-semibold text-sm">Already Installed</p>
              <p className="text-xs text-muted-foreground">OncoSync is installed on this device.</p>
            </div>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full vax-btn-primary py-3 text-sm gap-2"
          >
            <Download size={18} />
            Install App
          </button>
        ) : isIOS ? (
          <div className="vax-card text-left space-y-3">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Smartphone size={16} className="text-primary" />
              Install on iPhone / iPad
            </p>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Tap the <strong>Share</strong> button (square with arrow) in Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          </div>
        ) : (
          <div className="vax-card text-left space-y-3">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Monitor size={16} className="text-primary" />
              Install from Browser
            </p>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Open the browser menu (⋮ or ⋯)</li>
              <li>Look for <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
              <li>Follow the prompts to install</li>
            </ol>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: '⚡', label: 'Fast Launch' },
            { icon: '📱', label: 'Works Offline' },
            { icon: '🔒', label: 'Secure' },
          ].map(({ icon, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/50 pt-4">
          OncoSync v1.0 · For research use only · Not for clinical decisions
        </p>
      </div>
    </div>
  );
};

export default Install;
