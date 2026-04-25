'use client';

import { Bell, X } from 'lucide-react';

interface Props {
  title?: string;
  body?: string;
  link?: string;
  onDismiss: () => void;
}

/**
 * PushToast
 *
 * A non-intrusive toast shown when a push notification arrives
 * while the user already has the app open in their browser tab.
 * (Background notifications are shown by the OS; this handles foreground.)
 */
export function PushToast({ title, body, link, onDismiss }: Props) {
  const handleClick = () => {
    if (link && link !== '/') window.location.href = link;
    onDismiss();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
        right: 20,
        zIndex: 10001,
        width: 'min(360px, calc(100vw - 32px))',
        animation: 'push-toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      <style>{`
        @keyframes push-toast-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        onClick={handleClick}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(91,76,245,0.15)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          cursor: link && link !== '/' ? 'pointer' : 'default',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-brand), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={18} color="white" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3, marginBottom: 2 }}>
              {title}
            </div>
          )}
          {body && (
            <div style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {body}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss notification"
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
