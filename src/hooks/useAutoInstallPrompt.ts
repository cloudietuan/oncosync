import { useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'oncosync-install-dismissed';

export function useAutoInstallPrompt() {
  useEffect(() => {
    // Don't prompt if user already dismissed or app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;

      // Small delay so it doesn't feel jarring on page load
      setTimeout(async () => {
        try {
          await promptEvent.prompt();
          const { outcome } = await promptEvent.userChoice;
          if (outcome === 'dismissed') {
            sessionStorage.setItem(DISMISSED_KEY, 'true');
          }
        } catch {
          // prompt can only be called once
        }
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
}
