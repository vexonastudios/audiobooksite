'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import {
  Settings, GripVertical, Check, List, BookmarkPlus, Heart,
  Share2, Moon, BookOpen, ChevronRight, Gauge, Info,
} from 'lucide-react';
import Link from 'next/link';

// All possible quick-action buttons
const ALL_ACTIONS = [
  { id: 'speed',     label: 'Speed',      description: 'Cycle playback speed (0.75x → 2x)',        icon: Gauge },
  { id: 'chapters',  label: 'Chapters',   description: 'Open chapter list',                          icon: List },
  { id: 'bookmark',  label: 'Bookmark',   description: 'Open bookmarks and add new',                 icon: BookmarkPlus },
  { id: 'favorite',  label: 'Favorite',   description: 'Mark/unmark as a favorite',                  icon: Heart },
  { id: 'share',     label: 'Share',      description: 'Share the audiobook with a link',             icon: Share2 },
  { id: 'timer',     label: 'Sleep Timer','description': 'Set a timer to stop playback automatically', icon: Moon },
  { id: 'readalong', label: 'Read Along', description: 'Follow along with the transcript',            icon: BookOpen },
];

const MAX_ACTIONS = 5;

export default function SettingsPage() {
  const {
    skipInterval, setSkipInterval,
    playerQuickActions, setPlayerQuickActions,
    notificationsEnabled, toggleNotifications,
    quoteSettings, updateQuoteSettings,
  } = useUserStore();

  // Local copy for drag state
  const [actions, setActions] = useState<string[]>(playerQuickActions);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Toggle an action on/off ────────────────────────────────────────────────
  function toggleAction(id: string) {
    setActions(prev => {
      if (prev.includes(id)) return prev.filter(a => a !== id);
      if (prev.length >= MAX_ACTIONS) return prev;
      return [...prev, id];
    });
  }

  // ── Drag-and-drop reorder ──────────────────────────────────────────────────
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

  // ── Save ──────────────────────────────────────────────────────────────────
  function save() {
    setPlayerQuickActions(actions);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const activeSet = new Set(actions);

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

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section: Player Quick Actions                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          Mobile Player — Quick Actions
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Choose up to {MAX_ACTIONS} buttons to show in the quick-access row beneath the player controls. Drag to reorder them.
        </p>

        {/* Available toggles */}
        <div className="card" style={{ padding: 8, marginBottom: 16 }}>
          {ALL_ACTIONS.map(action => {
            const isActive = activeSet.has(action.id);
            const isDisabled = !isActive && actions.length >= MAX_ACTIONS;
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

        {/* Ordered list (drag to reorder) */}
        {actions.length > 0 && (
          <>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order ({actions.length}/{MAX_ACTIONS})
            </p>
            <div className="card" style={{ padding: 8, marginBottom: 16 }}>
              {actions.map((id, idx) => {
                const action = ALL_ACTIONS.find(a => a.id === id)!;
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

        {/* Save button */}
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

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section: Playback                                                     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Playback
        </h2>
        <div className="card" style={{ padding: '4px 8px' }}>
          <div style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px', cursor: 'pointer', gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>Announcement alerts</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Play audio notifications on the home screen</div>
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
    </div>
  );
}
