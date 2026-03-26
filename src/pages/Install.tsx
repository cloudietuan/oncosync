import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, ArrowLeft, Zap, WifiOff, Shield, Dna, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const perks = [
  { icon: Zap, title: 'Instant Launch', desc: 'Opens directly from your home screen — no browser needed' },
  { icon: WifiOff, title: 'Offline Ready', desc: 'Continue your research even without an internet connection' },
  { icon: Shield, title: 'Secure & Private', desc: 'All data stays on-device. Nothing is sent to external servers' },
];

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
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px]"
          style={{ background: 'hsl(var(--primary))', top: '-10%', right: '-5%' }}
          animate={{ scale: [1, 1.1, 1], x: [0, 15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[350px] h-[350px] rounded-full opacity-[0.05] blur-[80px]"
          style={{ background: 'hsl(258, 65%, 70%)', bottom: '5%', left: '-5%' }}
          animate={{ scale: [1, 1.08, 1], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* Nav */}
      <header
        className="sticky top-0 z-40 px-6 bg-background"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between h-14">
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={15} /> Back to app
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dna size={14} className="text-primary-foreground" />
            </div>
            <span className="text-[13px] font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>OncoSync</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-lg mx-auto px-6 pt-12 pb-20">
        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease }}
        >
          <motion.div
            className="w-20 h-20 rounded-[22px] mx-auto mb-6 flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(258, 65%, 60%), hsl(258, 80%, 48%))',
              boxShadow: '0 12px 40px -8px hsla(258, 65%, 50%, 0.4)',
            }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <Dna size={36} className="text-white relative z-10" />
          </motion.div>

          <motion.div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider mb-4"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', border: '1px solid var(--glass-border)', color: 'hsl(var(--primary))' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.25 }}
          >
            <Sparkles size={11} /> PROGRESSIVE WEB APP
          </motion.div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Install{' '}
            <span className="text-primary">OncoSync</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Get the full native app experience — instant access, offline support, and seamless research on any device.
          </p>
        </motion.div>

        {/* Install action card */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.3 }}
        >
          {isInstalled ? (
            <div
              className="rounded-2xl p-6 flex items-center gap-4 border"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'hsla(158, 64%, 40%, 0.3)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-[15px] tracking-tight">Already Installed</p>
                <p className="text-xs text-muted-foreground mt-0.5">OncoSync is ready on this device. Open it from your home screen.</p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <motion.button
              onClick={handleInstall}
              className="w-full py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5"
              style={{
                background: 'linear-gradient(135deg, hsl(258, 65%, 60%), hsl(258, 80%, 48%))',
                boxShadow: '0 8px 32px -4px hsla(258, 65%, 50%, 0.35)',
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 40px -4px hsla(258, 65%, 50%, 0.45)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Download size={20} />
              Install OncoSync
            </motion.button>
          ) : isIOS ? (
            <div
              className="rounded-2xl p-6 border space-y-4"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'var(--glass-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-[14px] tracking-tight">Install on iPhone / iPad</p>
                  <p className="text-[11px] text-muted-foreground">Follow these steps in Safari</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Tap the Share button', detail: '(square with arrow) in Safari\'s toolbar' },
                  { step: '2', text: 'Tap "Add to Home Screen"', detail: 'Scroll down in the share sheet' },
                  { step: '3', text: 'Tap "Add"', detail: 'Confirm to add OncoSync to your home screen' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-[12px] font-bold text-primary mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{s.text}</p>
                      <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 border space-y-4"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'var(--glass-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Monitor size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-[14px] tracking-tight">Install from Browser</p>
                  <p className="text-[11px] text-muted-foreground">Chrome, Edge, or other supported browsers</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Open browser menu', detail: 'Click ⋮ (three dots) in the top right' },
                  { step: '2', text: 'Find "Install app"', detail: 'Or "Add to Home Screen" on mobile' },
                  { step: '3', text: 'Confirm installation', detail: 'Follow the on-screen prompts' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-[12px] font-bold text-primary mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{s.text}</p>
                      <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Perks */}
        <motion.div
          className="space-y-3 mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.45 }}
        >
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              className="flex items-start gap-4 rounded-xl p-4 border"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'var(--glass-border)' }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.5 + i * 0.08 }}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <perk.icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-bold tracking-tight">{perk.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{perk.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-[10px] text-muted-foreground/40 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          OncoSync v1.0 · For research use only · Not for clinical decisions
        </motion.p>
      </main>
    </div>
  );
};

export default Install;
