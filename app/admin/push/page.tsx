'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, Users, Clock, CheckCircle, XCircle, Loader2, BarChart2 } from 'lucide-react';

interface PushLogEntry {
  id: string;
  title: string;
  body: string;
  link: string | null;
  trigger: string;
  sent_count: number;
  created_at: string;
}

export default function AdminPushPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('/');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null);
  const [log, setLog] = useState<PushLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  useEffect(() => {
    // Load push log
    fetch('/api/admin/push-send')
      .then(r => r.json())
      .then(data => { setLog(data); setLogLoading(false); })
      .catch(() => setLogLoading(false));

    // Load subscriber count
    fetch('/api/admin/push-subscribers')
      .then(r => r.json())
      .then(data => setSubscriberCount(data.count ?? 0))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/push-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), link: link || '/', trigger: 'manual' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setResult({ count: data.subscriberCount });
      setTitle('');
      setBody('');
      setLink('/');
      // Refresh log
      fetch('/api/admin/push-send').then(r => r.json()).then(setLog).catch(() => {});
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : 'Send failed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #5B4CF5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={22} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Push Notifications</h1>
          <p style={{ margin: 0, color: '#718096', fontSize: 13 }}>Send real-time alerts to all subscribed users</p>
        </div>
        {subscriberCount !== null && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: '#EDE9FE', borderRadius: 10, padding: '8px 16px' }}>
            <Users size={16} color="#5B4CF5" />
            <span style={{ fontWeight: 700, color: '#5B4CF5', fontSize: 14 }}>{subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Compose Panel */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={13} /> Compose Notification</h2>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 🎧 New Audiobook Available!"
              maxLength={65}
            />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{title.length}/65 characters</div>
          </div>

          <div className="form-group">
            <label>Body *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="e.g. By Charles Spurgeon — now streaming free on Scroll Reader"
              rows={3}
              maxLength={180}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{body.length}/180 characters</div>
          </div>

          <div className="form-group">
            <label>Deep Link (optional)</label>
            <input
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="/audiobook/some-slug"
            />
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Where users land when they tap the notification. Use / for the home page.</p>
          </div>

          {/* Preview */}
          <div style={{ background: '#F8F9FF', border: '1px solid #C4B5FD', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Preview</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #5B4CF5, #7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A202C' }}>{title || 'Notification title'}</div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>{body || 'Notification body text will appear here...'}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: 'linear-gradient(135deg, #5B4CF5, #7c3aed)' }}
          >
            {sending ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} />}
            {sending ? 'Sending…' : '🔔 Send to All Subscribers'}
          </button>

          {result && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
              background: result.error ? '#FEE2E2' : '#D1FAE5',
              color: result.error ? '#991B1B' : '#065F46',
              fontWeight: 600, fontSize: 13,
            }}>
              {result.error ? <XCircle size={16} /> : <CheckCircle size={16} />}
              {result.error ? `Error: ${result.error}` : `✅ Delivered to ${result.count} subscriber${result.count !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>

        {/* Send Log */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChart2 size={13} /> Send History</h2>
          {logLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#718096' }}><Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} /></div>
          ) : log.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>No notifications sent yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {log.map(entry => (
                <div key={entry.id} style={{ padding: '12px 14px', background: '#F8F9FA', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1A202C' }}>{entry.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#718096' }}>
                      <Users size={12} />
                      {entry.sent_count}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 6 }}>{entry.body}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#9CA3AF' }}>
                    <Clock size={11} />
                    {new Date(entry.created_at).toLocaleString()}
                    <span style={{ marginLeft: 'auto', background: entry.trigger === 'manual' ? '#EDE9FE' : '#D1FAE5', color: entry.trigger === 'manual' ? '#7C3AED' : '#065F46', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                      {entry.trigger}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
