'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import {
  Settings, GripVertical, Check, List, BookmarkPlus, Heart,
  Share2, Moon, BookOpen, ChevronRight, Gauge, Info,
  Home, Quote, Clock, User, Sun, Monitor, Bell, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

// All possible quick-action buttons
const ALL_ACTIONS = [
  { id: 'chapters',  label: 'Chapters',   description: 'Open chapter list',                          icon: List },
  { id: 'bookmark',  label: 'Bookmark',   description: 'Open bookmarks and add new',                 icon: BookmarkPlus },
  { id: 'favorite',  label: 'Favorite',   description: 'Mark/unmark as a favorite',                  icon: Heart },
  { id: 'share',     label: 'Share',      description: 'Share the audiobook with a link',             icon: Share2 },
  { id: 'timer',     label: 'Sleep Timer','description': 'Set a timer to stop playback automatically', icon: Moon },
  { id: 'readalong', label: 'Read Along', description: 'Follow along with the transcript',            icon: BookOpen },
];

// All possible nav buttons
const ALL_NAV_ACTIONS = [
  { id: 'home',      label: 'Home',      description: 'Go to the home page',                 icon: Home },
  { id: 'browse',    label: 'Browse',    description: 'Explore all audiobooks',              icon: BookOpen },
  { id: 'favorites', label: 'Favorites', description: 'Your favorite audiobooks',            icon: Heart },
  { id: 'bookmarks', label: 'Bookmarks', description: 'Your saved bookmarks',                icon: BookmarkPlus },
  { id: 'quotes',    label: 'Quotes',    description: 'Your saved quotes',                   icon: Quote },
  { id: 'history',   label: 'History',   description: 'Recently listened to audiobooks',     icon: Clock },
  { id: 'status',    label: 'My Status', description: 'Your listening profile and stats',    icon: User },
];

function ActionPickerSection({
  title, description, allActions, maxActions, savedActions, onSave
}: {
  title: string; description: string; allActions: { id: string; label: string; description: string; icon: any }[]; maxActions: number; savedActions: string[]; onSave: (a: string[]) => void;
}) {
  const [actions, setActions] = useState<string[]>(savedActions);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleAction(id: string) {
    setActions(prev => {
      if (prev.includes(id)) return prev.filter(a => a !== id);
      if (prev.length >= maxActions) return prev;
      return [...prev, id];
    });
  }

  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }
  function onDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { reset(); return; }
    const next = [...actions];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setActions(next);
    reset();
  }
  function reset() { setDragIdx(null); setDragOverIdx(null); }

  function save() {
    onSave(actions);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const activeSet = new Set(actions);

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        {title}
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        {description}
      </p>

      <div className="card" style={{ padding: 8, marginBottom: 16 }}>
        {allActions.map(action => {
          const isActive = activeSet.has(action.id);
          const isDisabled = !isActive && actions.length >= maxActions;
          return (
            <button
              key={action.id}
              onClick={() => toggleAction(action.id)}
              disabled={isDisabled}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(46,106,167,0.06)' : 'transparent',
                border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.4 : 1,
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isActive ? 'var(--color-brand)' : 'var(--color-surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}>
                <action.icon size={16} color={isActive ? 'white' : 'var(--color-text-secondary)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {action.description}
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isActive ? 'var(--color-brand)' : 'var(--color-border)'}`,
                background: isActive ? 'var(--color-brand)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isActive && <Check size={12} color="white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {actions.length > 0 && (
        <>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Order ({actions.length}/{maxActions})
          </p>
          <div className="card" style={{ padding: 8, marginBottom: 16 }}>
            {actions.map((id, idx) => {
              const action = allActions.find(a => a.id === id)!;
              if (!action) return null;
              const isDragOver = dragOverIdx === idx && dragIdx !== idx;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={() => onDrop(idx)}
                  onDragEnd={reset}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 'var(--radius-md)',
                    background: isDragOver ? 'rgba(46,106,167,0.08)' : dragIdx === idx ? 'var(--color-surface-2)' : 'transparent',
                    border: isDragOver ? '1.5px dashed var(--color-brand)' : '1.5px solid transparent',
                    cursor: 'grab', transition: 'background 0.1s, border 0.1s',
                    opacity: dragIdx === idx ? 0.5 : 1,
                  }}
                >
                  <GripVertical size={18} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <action.icon size={15} color="white" />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, color: 'var(--color-text-primary)' }}>
                    {action.label}
                  </span>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={save}
        style={{
          width: '100%', padding: '13px 20px',
          background: saved ? '#22c55e' : 'var(--color-brand)',
          color: 'white', border: 'none', borderRadius: 'var(--radius-lg)',
          fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.3s',
        }}
      >
        {saved ? <><Check size={18} strokeWidth={3} /> Saved!</> : 'Save Quick Actions'}
      </button>
    </section>
  );
}

export default function SettingsPage() {
  const { pushEnabled, togglePush, isLoading: pushLoading, permissionState, isBlocked } = usePushNotifications();
  const {
    skipInterval, setSkipInterval,
    playerQuickActions, setPlayerQuickActions,
    mobileNavActions, setMobileNavActions,
    notificationsEnabled, toggleNotifications,
    scrollRadioEnabled, toggleScrollRadio,
    quoteSettings, updateQuoteSettings,
    readAlongFontSize, setReadAlongFontSize,
    colorScheme, setColorScheme,
    newBookAlertsEnabled, setNewBookAlertsEnabled,
  } = useUserStore();

  const [newBookLoading, setNewBookLoading] = useState(false);

  async function toggleNewBookAlerts() {
    if (!pushEnabled) return; // must have push enabled first
    const next = !newBookAlertsEnabled;
    setNewBookLoading(true);
    setNewBookAlertsEnabled(next);
    try {
      await fetch('/api/user/push-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'new-audiobooks', action: next ? 'subscribe' : 'unsubscribe' }),
      });
    } catch {
      // Best effort — store already updated
    } finally {
      setNewBookLoading(false);
    }
  }

  return (
    <div className="page pb-24" style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(46,106,167,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Settings size={24} color="var(--color-brand)" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Preferences</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Saved to your device — no account needed.
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Section: Notifications                                              */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          Notifications
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Manage your alerts and in-app announcements.
        </p>
        <div className="card" style={{ padding: '4px 8px' }}>
          {/* Push Notifications Toggle */}
          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px', cursor: isBlocked ? 'not-allowed' : 'pointer', gap: 12,
              borderBottom: '1px solid var(--color-border)',
              opacity: isBlocked ? 0.6 : 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>
                <Bell size={14} color={pushEnabled ? 'var(--color-brand)' : 'var(--color-text-secondary)'} />
                Push Notifications
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {isBlocked
                  ? 'Blocked by browser — tap the lock icon in your address bar to re-enable'
                  : 'Get alerts for new audiobooks even when the app is closed'}
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.preventDefault();
                if (isBlocked) return;
                await togglePush();
              }}
              disabled={pushLoading || isBlocked}
              style={{
                width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                border: 'none',
                background: pushEnabled ? 'var(--color-brand)' : 'var(--color-surface-2)',
                position: 'relative', cursor: isBlocked ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {pushLoading ? (
                <Loader2 size={14} className="spin" color={pushEnabled ? 'white' : 'var(--color-text-secondary)'} />
              ) : (
                <div style={{
                  position: 'absolute',
                  top: 3, left: pushEnabled ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              )}
            </button>
          </label>

          {/* New Audiobook Alerts */}
          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px', cursor: pushEnabled ? 'pointer' : 'not-allowed', gap: 12,
              borderBottom: '1px solid var(--color-border)',
              opacity: pushEnabled ? 1 : 0.45,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>
                <BookOpen size={14} color={newBookAlertsEnabled && pushEnabled ? 'var(--color-brand)' : 'var(--color-text-secondary)'} />
                New Audiobook Alerts
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {pushEnabled
                  ? 'Get notified the moment a new audiobook is published'
                  : 'Enable Push Notifications above to use this setting'}
              </div>
            </div>
            <button
              onClick={async (e) => { e.preventDefault(); await toggleNewBookAlerts(); }}
              disabled={!pushEnabled || newBookLoading}
              style={{
                width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                border: 'none',
                background: newBookAlertsEnabled && pushEnabled ? 'var(--color-brand)' : 'var(--color-surface-2)',
                position: 'relative', cursor: pushEnabled ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {newBookLoading ? (
                <Loader2 size={14} className="spin" color="var(--color-text-secondary)" />
              ) : (
                <div style={{
                  position: 'absolute',
                  top: 3, left: newBookAlertsEnabled && pushEnabled ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              )}
            </button>
          </label>

          {/* Announcement Alerts (In-app audio) */}
          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px', cursor: 'pointer', gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>Announcement alerts</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Play audio announcements on the home screen</div>
            </div>
            <div
              onClick={toggleNotifications}
              style={{
                width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                background: notificationsEnabled ? 'var(--color-brand)' : 'var(--color-surface-2)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: notificationsEnabled ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </div>
          </label>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Section: Appearance                                                 */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          Appearance
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Choose between light and dark mode, or let your device decide.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {([
            { id: 'light',  label: 'Light',  Icon: Sun },
            { id: 'dark',   label: 'Dark',   Icon: Moon },
            { id: 'system', label: 'System', Icon: Monitor },
          ] as { id: 'light' | 'dark' | 'system'; label: string; Icon: any }[]).map(({ id, label, Icon }) => {
            const isActive = colorScheme === id;
            return (
              <button
                key={id}
                onClick={() => setColorScheme(id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '18px 8px', borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${isActive ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  background: isActive ? 'rgba(46,106,167,0.08)' : 'var(--color-surface)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <Icon
                  size={22}
                  color={isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)'}
                />
                <span style={{
                  fontSize: '0.8125rem', fontWeight: 700,
                  color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                }}>
                  {label}
                </span>
                {isActive && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-brand)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <ActionPickerSection
        title="Mobile Navigation"
        description="Choose up to 5 buttons to show in the mobile app bottom tab bar. Drag to reorder them."
        allActions={ALL_NAV_ACTIONS}
        maxActions={5}
        savedActions={mobileNavActions}
        onSave={(a) => setMobileNavActions(a)}
      />

      <ActionPickerSection
        title="Mobile Player — Quick Actions"
        description={`Choose up to 5 buttons to show in the quick-access row beneath the player controls. Drag to reorder them.`}
        allActions={ALL_ACTIONS}
        maxActions={5}
        savedActions={playerQuickActions}
        onSave={(a) => setPlayerQuickActions(a)}
      />

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section: Playback                                                     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Playback
        </h2>
        <div className="card" style={{ padding: '4px 8px' }}>
          <div style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>Skip Interval</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                How many seconds the skip buttons jump
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {[5, 10, 15, 30, 60].map(s => (
                <button
                  key={s}
                  onClick={() => setSkipInterval(s)}
                  style={{
                    padding: '7px 12px', borderRadius: 20,
                    border: `1.5px solid ${skipInterval === s ? 'var(--color-brand)' : 'var(--color-border)'}`,
                    background: skipInterval === s ? 'var(--color-brand)' : 'var(--color-surface)',
                    color: skipInterval === s ? 'white' : 'var(--color-text-primary)',
                    fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px', cursor: 'pointer', gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>Scroll Radio button</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Show "Now Playing" in the top menu during broadcasts</div>
            </div>
            <div
              onClick={toggleScrollRadio}
              style={{
                width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                background: scrollRadioEnabled ? 'var(--color-brand)' : 'var(--color-surface-2)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: scrollRadioEnabled ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </div>
          </label>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section: Read Along                                                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          Read Along
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Controls the text size in the Read Along panel. Takes effect immediately.
        </p>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Font Size</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-brand)', fontWeight: 700 }}>
              {readAlongFontSize}rem
            </div>
          </div>

          {/* Size picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {([
              { label: 'S',   value: 0.9,  desc: 'Small'    },
              { label: 'M',   value: 1.05, desc: 'Medium'   },
              { label: 'L',   value: 1.2,  desc: 'Large'    },
              { label: 'XL',  value: 1.4,  desc: 'X-Large'  },
              { label: 'XXL', value: 1.65, desc: '2X-Large' },
            ] as { label: string; value: number; desc: string }[]).map(opt => {
              const isActive = Math.abs(readAlongFontSize - opt.value) < 0.01;
              return (
                <button
                  key={opt.label}
                  onClick={() => setReadAlongFontSize(opt.value)}
                  style={{
                    flex: 1, padding: '10px 4px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isActive ? 'var(--color-brand)' : 'var(--color-border)'}`,
                    background: isActive ? 'var(--color-brand)' : 'var(--color-surface)',
                    color: isActive ? 'white' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <span style={{ fontSize: `${opt.value * 0.85}rem`, fontWeight: 700, lineHeight: 1.1 }}>{opt.label}</span>
                  <span style={{ fontSize: '0.64rem', opacity: 0.75, fontWeight: 500 }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Live preview */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Preview
            </div>
            <p style={{ fontSize: `${readAlongFontSize}rem`, lineHeight: 1.9, color: 'var(--color-text-primary)', margin: 0 }}>
              "The soul must become quiet and wait before the Lord. He allows himself to be approached in this way."
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section: Quote Sharing                                                */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Quote Sharing
        </h2>
        <div className="card" style={{ padding: '4px 8px' }}>
          {[
            { key: 'includeLink' as const, label: 'Include link in shared quotes', desc: 'Append a link back to the audiobook' },
            { key: 'includeBook' as const, label: 'Include book title', desc: 'Show the book name in the quote image' },
            { key: 'useQuotes' as const, label: 'Wrap text in quotation marks', desc: 'Add " " around the selected text' },
          ].map(item => (
            <label
              key={item.key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px', cursor: 'pointer', gap: 12,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.desc}</div>
              </div>
              <div
                onClick={() => updateQuoteSettings({ [item.key]: !quoteSettings[item.key] })}
                style={{
                  width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                  background: quoteSettings[item.key] ? 'var(--color-brand)' : 'var(--color-surface-2)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3, left: quoteSettings[item.key] ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              </div>
            </label>
          ))}
          
          <div style={{ padding: '14px 16px', background: 'var(--color-surface-2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example output</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6, fontFamily: 'monospace' }}>
              {quoteSettings.useQuotes ? '"For God so loved the world..."' : 'For God so loved the world...'}
              {quoteSettings.includeBook ? ' — Apostle John, The Bible' : ' — Apostle John'}
              {quoteSettings.includeLink && ' Listen at: https://scrollreader.com'}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section: My Data                                                      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          My Data
        </h2>
        <div className="card" style={{ padding: '4px 8px' }}>
          {[
            { href: '/favorites', label: 'Favorites', icon: Heart },
            { href: '/bookmarks', label: 'Bookmarks', icon: BookmarkPlus },
            { href: '/quotes', label: 'Saved Quotes', icon: BookOpen },
            { href: '/stats', label: 'My Stats', icon: Gauge },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px', textDecoration: 'none', color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <item.icon size={18} color="var(--color-brand)" />
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9375rem' }}>{item.label}</span>
              <ChevronRight size={16} color="var(--color-text-muted)" />
            </Link>
          ))}
        </div>
      </section>

      {/* Info note */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: 'rgba(46,106,167,0.06)', border: '1px solid rgba(46,106,167,0.15)',
      }}>
        <Info size={16} color="var(--color-brand)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          All preferences are stored locally on your device. They will persist between sessions but won't sync across devices.
        </p>
      </div>

      {/* Version footer */}
      <div style={{
        marginTop: 24, textAlign: 'center',
        fontSize: '0.775rem', color: 'var(--color-text-muted)',
        letterSpacing: '0.03em',
      }}>
        Scroll Reader · Version 0.1.0
      </div>
    </div>
  );
}
