'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Headphones, Users, Clock, Radio, BarChart2 } from 'lucide-react';

type AnalyticsData = {
  totalPlays: number;
  uniqueSessions: number;
  registeredSessions: number;
  totalListenHours: number;
  activeNow: number;
  playsPerDay: { day: string; plays: number }[];
  listenPerDay: { day: string; minutes: number }[];
  topBooks: {
    audiobookId: string;
    title: string;
    slug: string;
    coverImage: string;
    authorName: string;
    listenHours: number;
    totalPlays: number;
    uniqueListeners: number;
    avgCompletionPct: number;
  }[];
  platformSplit: { platform: string; count: number }[];
  registeredPlays: number;
  anonymousPlays: number;
};

type Period = 7 | 30 | 90 | 365;

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`, color, flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#718096' }}>{sub}</div>}
      </div>
    </div>
  );
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${period}`)
      .then(r => r.json())
      .then(d => { 
        if (d.error) {
          setData(null);
        } else {
          setData(d); 
        }
        setLoading(false); 
      })
      .catch(() => { setData(null); setLoading(false); });
  }, [period]);

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: '1 year', value: 365 },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Analytics</h1>
          <p style={{ color: '#718096', fontSize: 14, marginTop: 4 }}>
            Listening stats, play counts, and engagement metrics.
          </p>
        </div>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: period === p.value ? '#2e6aa7' : 'var(--color-surface)',
                color: period === p.value ? '#fff' : 'var(--color-text-secondary)',
                border: period === p.value ? 'none' : '1px solid var(--color-border)',
                transition: 'all 0.2s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
      ) : !data ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
          Failed to load analytics.
        </div>
      ) : (
        <>
          {/* Active Now pulse */}
          <div style={{
            marginBottom: 24, padding: '12px 20px', borderRadius: 12,
            background: data.activeNow > 0 ? 'rgba(16,185,129,0.1)' : 'var(--color-surface)',
            border: `1px solid ${data.activeNow > 0 ? '#10b981' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: data.activeNow > 0 ? '#10b981' : '#9CA3AF',
              boxShadow: data.activeNow > 0 ? '0 0 0 4px rgba(16,185,129,0.25)' : 'none',
            }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: data.activeNow > 0 ? '#059669' : '#9CA3AF' }}>
              {data.activeNow > 0 ? `${data.activeNow} listener${data.activeNow !== 1 ? 's' : ''} active right now` : 'No active listeners right now'}
            </span>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon={<TrendingUp size={22} />} label="Total Plays" value={data.totalPlays.toLocaleString()} sub={`In last ${period} days`} color="#2e6aa7" />
            <StatCard icon={<Clock size={22} />} label="Listen Hours" value={`${data.totalListenHours}h`} sub="Actual audio consumed" color="#7c3aed" />
            <StatCard icon={<Users size={22} />} label="Unique Sessions" value={data.uniqueSessions.toLocaleString()} sub={`${data.registeredSessions} signed in`} color="#059669" />
            <StatCard icon={<Headphones size={22} />} label="Platform Split" value={data.platformSplit[0]?.platform ?? '—'} sub={data.platformSplit.map(p => `${p.platform}: ${p.count}`).join(' · ')} color="#d97706" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* Plays per day */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={16} /> Plays Per Day
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.playsPerDay} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Plays']} labelFormatter={(d) => formatDay(String(d))} />
                  <Bar dataKey="plays" fill="#2e6aa7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Listen minutes per day */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={16} /> Listen Minutes Per Day
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.listenPerDay} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} min`, 'Listen time']} labelFormatter={(d) => formatDay(String(d))} />
                  <Line type="monotone" dataKey="minutes" stroke="#7c3aed" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Registered vs Anonymous */}
          <div className="card" style={{ padding: 20, marginBottom: 32, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', flexShrink: 0 }}>Listener Type</div>
            <div style={{ flex: 1 }}>
              {data.totalPlays > 0 && (
                <div style={{ height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--color-surface-2)', display: 'flex' }}>
                  <div style={{ width: `${(data.registeredPlays / data.totalPlays) * 100}%`, background: '#2e6aa7', transition: 'width 0.5s' }} />
                  <div style={{ flex: 1, background: '#9ca3af' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
              <span><span style={{ color: '#2e6aa7', fontWeight: 700 }}>{data.registeredPlays.toLocaleString()}</span> signed-in</span>
              <span><span style={{ color: '#9ca3af', fontWeight: 700 }}>{data.anonymousPlays.toLocaleString()}</span> anonymous</span>
            </div>
          </div>

          {/* Top Books Table */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16 }}>Top Books by Listen Time</h2>
            {data.topBooks.length === 0 ? (
              <p style={{ color: '#718096', fontSize: 14 }}>No listening data yet for this period.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', paddingBottom: 12, whiteSpace: 'nowrap' }}>#</th>
                      <th style={{ textAlign: 'left', paddingBottom: 12 }}>Book</th>
                      <th style={{ textAlign: 'right', paddingBottom: 12, whiteSpace: 'nowrap' }}>Listen Hrs</th>
                      <th style={{ textAlign: 'right', paddingBottom: 12, whiteSpace: 'nowrap' }}>Plays</th>
                      <th style={{ textAlign: 'right', paddingBottom: 12, whiteSpace: 'nowrap' }}>Listeners</th>
                      <th style={{ textAlign: 'right', paddingBottom: 12, whiteSpace: 'nowrap' }}>Avg Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topBooks.map((b, i) => (
                      <tr key={b.audiobookId} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 8px 10px 0', color: '#9CA3AF', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '10px 16px 10px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {b.coverImage && (
                              <img src={b.coverImage} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <div>
                              <Link href={`/audiobook/${b.slug}`} target="_blank" style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none', display: 'block' }}>
                                {b.title.length > 50 ? b.title.slice(0, 50) + '…' : b.title}
                              </Link>
                              <span style={{ color: '#718096', fontSize: 12 }}>{b.authorName}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 700, color: '#7c3aed' }}>{b.listenHours}h</td>
                        <td style={{ textAlign: 'right', padding: '10px 0', color: '#4a5568' }}>{b.totalPlays.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '10px 0', color: '#4a5568' }}>{b.uniqueListeners.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '10px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <div style={{ width: 48, height: 6, borderRadius: 99, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                              <div style={{ width: `${b.avgCompletionPct}%`, height: '100%', background: b.avgCompletionPct >= 80 ? '#22c55e' : b.avgCompletionPct >= 50 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>{b.avgCompletionPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
