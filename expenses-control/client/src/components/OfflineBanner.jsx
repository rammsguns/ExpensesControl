import React from 'react';
import { useTranslation } from '../i18n';
import { useOffline } from '../hooks/useOffline';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, isSyncing, pendingActions } = useOffline();
  const { language } = useTranslation();

  if (isOnline && !isSyncing) return null;

  const isOffline = !isOnline;
  const msg = isSyncing
    ? (language === 'es' ? 'Sincronizando cambios...' : 'Syncing changes...')
    : (language === 'es'
      ? 'Sin conexión. Los cambios se sincronizarán al reconectarte.'
      : 'You are offline. Changes will sync when you reconnect.');

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[60] text-white text-sm text-center py-2 px-4 transition-colors ${
        isSyncing ? 'bg-emerald-600' : 'bg-rose-600'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isSyncing ? (
          <>
            <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
            <span>{msg}</span>
          </>
        ) : (
          <>
            <WifiOff size={16} aria-hidden="true" />
            <span>{msg}</span>
            {pendingActions.length > 0 && (
              <span className="ml-1 opacity-90">
                ({pendingActions.length} {language === 'es' ? 'pendientes' : 'pending'})
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
