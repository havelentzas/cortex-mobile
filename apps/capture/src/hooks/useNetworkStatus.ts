import { useEffect, useState } from 'react';

/**
 * Tracks connectivity via navigator.onLine plus the online/offline events.
 *
 * iOS Safari has no Background Sync API, so the Capture screen uses this to
 * disable submission while offline rather than silently queuing notes.
 */
export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
