import React from 'react';
import { useTranslation } from '../i18n';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'expenses_install_dismissed';
const DISMISS_DAYS = 7;

export default function InstallPrompt() {
  const { language } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Only on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if dismissed recently
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const dismissedAt = parseInt(raw, 10);
        if (!isNaN(dismissedAt) && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
          return;
        }
      }
    } catch {}

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 z-50 bg-indigo-600 text-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium leading-snug">
          {language === 'es'
            ? 'Instala ExpensesControl para una mejor experiencia'
            : 'Install ExpensesControl for a better experience'}
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition active:scale-95"
      >
        <Download size={16} className="inline mr-1" />
        {language === 'es' ? 'Instalar' : 'Install'}
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white transition rounded-lg"
        aria-label={language === 'es' ? 'Descartar' : 'Dismiss'}
      >
        <X size={20} />
      </button>
    </div>
  );
}
