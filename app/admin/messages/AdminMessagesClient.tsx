'use client';

import { useState } from 'react';
import { Mail, MailOpen, Trash2, Reply, ChevronDown, ChevronUp, Search, Circle } from 'lucide-react';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function AdminMessagesClient({
  messages: initialMessages,
  unreadCount,
}: {
  messages: Message[];
  unreadCount: number;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = messages.filter(m => {
    if (filter === 'unread' && m.read) return false;
    if (filter === 'read' && !m.read) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unread = messages.filter(m => !m.read).length;

  async function markRead(id: number, read: boolean) {
    await fetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read } : m));
  }

  async function deleteMsg(id: number) {
    if (!confirm('Delete this message?')) return;
    await fetch('/api/contact', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (expanded === id) setExpanded(null);
  }

  function toggleExpand(id: number) {
    const isOpening = expanded !== id;
    setExpanded(isOpening ? id : null);
    // Auto-mark as read when opened
    const msg = messages.find(m => m.id === id);
    if (isOpening && msg && !msg.read) markRead(id, true);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Contact Messages</h1>
          {unread > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#718096' }}>
              <span style={{ fontWeight: 700, color: '#2e6aa7' }}>{unread} unread</span> of {messages.length} total
            </p>
          )}
        </div>
        <a
          href={`mailto:?subject=ScrollReader Messages`}
          style={{ fontSize: 13, color: '#2e6aa7', textDecoration: 'none', fontWeight: 500 }}
        >
          Open Email ↗
        </a>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#718096', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search messages…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 32px',
              border: '1px solid #E2E8F0', borderRadius: 8,
              fontSize: 13, outline: 'none', background: '#fff', color: '#1A202C',
            }}
          />
        </div>
        {(['all', 'unread', 'read'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: filter === f ? '#2e6aa7' : '#fff',
              color: filter === f ? '#fff' : '#4A5568',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f} {f === 'all' && `(${messages.length})`}
            {f === 'unread' && `(${messages.filter(m => !m.read).length})`}
            {f === 'read' && `(${messages.filter(m => m.read).length})`}
          </button>
        ))}
      </div>

      {/* Message List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
          <Mail size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ margin: 0 }}>
            {messages.length === 0
              ? 'No messages yet. When someone fills out the contact form, they\'ll appear here.'
              : 'No messages match your filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(msg => (
            <div
              key={msg.id}
              className="card"
              style={{
                padding: 0, overflow: 'hidden',
                borderLeft: !msg.read ? '3px solid #2e6aa7' : '3px solid transparent',
                transition: 'box-shadow 0.15s',
              }}
            >
              {/* Summary row */}
              <div
                onClick={() => toggleExpand(msg.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', cursor: 'pointer',
                }}
              >
                {/* Unread indicator */}
                <div style={{ flexShrink: 0, color: msg.read ? '#CBD5E0' : '#2e6aa7' }}>
                  {msg.read ? <MailOpen size={18} /> : <Mail size={18} />}
                </div>

                {/* Sender + Subject */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontWeight: msg.read ? 500 : 700, fontSize: 14, color: '#1A202C' }}>
                      {msg.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#718096' }}>{msg.email}</span>
                  </div>
                  <div style={{
                    fontSize: 13, color: msg.read ? '#718096' : '#4A5568', fontWeight: msg.read ? 400 : 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {msg.subject} — <span style={{ fontWeight: 400, color: '#718096' }}>{msg.message.slice(0, 80)}{msg.message.length > 80 ? '…' : ''}</span>
                  </div>
                </div>

                {/* Date + chevron */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>{formatDate(msg.created_at)}</div>
                  {expanded === msg.id ? <ChevronUp size={16} color="#718096" /> : <ChevronDown size={16} color="#718096" />}
                </div>
              </div>

              {/* Expanded view */}
              {expanded === msg.id && (
                <div style={{
                  borderTop: '1px solid #F0F4F8',
                  padding: '20px 18px',
                  background: '#FAFBFC',
                }}>
                  <div style={{
                    whiteSpace: 'pre-wrap', lineHeight: 1.7,
                    fontSize: 14, color: '#1A202C', marginBottom: 20,
                    background: '#fff', padding: 16, borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}>
                    {msg.message}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 8,
                        background: '#2e6aa7', color: '#fff',
                        fontWeight: 600, fontSize: 13, textDecoration: 'none',
                      }}
                    >
                      <Reply size={14} />
                      Reply via Email
                    </a>
                    <button
                      onClick={() => markRead(msg.id, !msg.read)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 8,
                        border: '1px solid #E2E8F0', background: '#fff',
                        color: '#4A5568', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {msg.read ? <><Mail size={14} /> Mark Unread</> : <><MailOpen size={14} /> Mark Read</>}
                    </button>
                    <button
                      onClick={() => deleteMsg(msg.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 14px', borderRadius: 8,
                        border: 'none', background: '#FEE2E2',
                        color: '#DC2626', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
