'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

/**
 * PWAUpdater
 *
 * Watches the Service Worker registration for a new waiting worker.
 * When one is found (i.e. a deployment has happened), it shows a
 * non-intrusive toast at the bottom of the screen.
 *
 * When the user clicks "Update Now":
 *  1. We message the waiting SW with SKIP_WAITING.
 *  2. We listen for the controllerchange event (fires when the new SW takes over).
 *  3. We reload the page to load the fresh Next.js chunks.
 */
export function PWAUpdater() {
  const [showToast, setShowToast] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Don't manage SW updates when running inside a Capacitor native wrapper —
    // native apps receive updates through the app store, not the SW.
    if ((window as any).Capacitor?.isNativePlatform?.()) return;

    let registration: ServiceWorkerRegistration | null = null;

    // Register the SW (idempotent — safe to call on every mount)
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });


    const onUpdateFound = () => {
      if (!registration) return;
      const newWorker = registration.installing;
      if (!newWorker) return;

      // Wait for the new worker to finish installing (state: 'installed')
      // At that point it's sitting in the waiting slot — ready to take over.
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // A new version is ready, and we're not on a fresh install
          setWaitingWorker(newWorker);
          setShowToast(true);
        }
      });
    };

    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;

      // If there's already a waiting worker when we load (e.g. tab was in background)
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setShowToast(true);
      }

      reg.addEventListener('updatefound', onUpdateFound);
    });

    // Reload when the active controller changes (new SW takes over)
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Poll for updates every 60s (browsers only auto-check on navigation normally)
    const intervalId = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {});
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (registration) {
        registration.removeEventListener('updatefound', onUpdateFound);
      }
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;
    setIsUpdating(true);
    // Tell the waiting SW to activate now. The controllerchange listener above
    // will then fire and reload the page.
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  const handleDismiss = () => {
    setShowToast(false);
  };

  if (!showToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', // above mobile tab bar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        width: 'min(420px, calc(100vw - 32px))',
        animation: 'pwa-toast-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      <style>{`
        @keyframes pwa-toast-slide-in {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(91,76,245,0.12)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-brand), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={18} color="white" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3 }}>
            Update available
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', marginTop: 1 }}>
            A new version of Scroll Reader is ready.
          </div>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--color-brand)', color: 'white',
            border: 'none', borderRadius: 8, cursor: isUpdating ? 'wait' : 'pointer',
            padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600,
            flexShrink: 0, whiteSpace: 'nowrap',
            opacity: isUpdating ? 0.7 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: isUpdating ? 'spin 0.8s linear infinite' : 'none' }}
          />
          {isUpdating ? 'Updating…' : 'Update Now'}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss update notification"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-tertiary)', padding: 4, flexShrink: 0,
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
