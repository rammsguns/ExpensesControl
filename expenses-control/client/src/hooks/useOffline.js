import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'expenses_pending_actions';

/**
 * Hook to manage offline/online state and queue actions for later sync.
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const prevOnlineRef = useRef(navigator.onLine);

  // Persist queue to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Listen for online/offline events
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline && pendingActions.length > 0) {
      // small delay so connection is really ready
      const timer = setTimeout(() => {
        syncPending();
      }, 800);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  const queueAction = useCallback((action) => {
    setPendingActions((prev) => [
      ...prev,
      {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const clearPending = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const syncPending = useCallback(async () => {
    if (pendingActions.length === 0 || !navigator.onLine) return;
    setIsSyncing(true);
    const remaining = [];
    for (const action of pendingActions) {
      try {
        const { url, method, data } = action;
        const opts = {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        };
        if (data && method !== 'GET') {
          opts.body = JSON.stringify(data);
        }
        const res = await fetch(url, opts);
        if (!res.ok && res.status !== 409) {
          remaining.push(action);
        }
      } catch {
        remaining.push(action);
      }
    }
    setPendingActions(remaining);
    setIsSyncing(false);
    return remaining.length === 0;
  }, [pendingActions]);

  return {
    isOnline,
    isSyncing,
    pendingActions,
    queueAction,
    syncPending,
    clearPending,
  };
}
