'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { Search } from 'lucide-react';

// ─── Category metadata ────────────────────────────────────────────────────────
interface TopicGroupMeta {
  topics: string[];
  icon: string;
  color: string;
  description: string;
}

const TOPIC_GROUPS: Record<string, TopicGroupMeta> = {
  'Christian Life & Ethics': {
    icon: '✝️',
    color: '#2e6aa7',
    description: 'Practical guidance for living a faithful life',
    topics: ['Greed', 'Killing Sin', 'Marriage', 'Military', 'Money and Stewardship', 'Parenting', 'Patriotism'],
  },
  'Church & Ministry': {
    icon: '⛪',
    color: '#5a3e85',
    description: 'Leading, serving, and shepherding the church',
    topics: ['Counseling', 'Preaching'],
  },
  'Doctrine & Theology': {
    icon: '📖',
    color: '#1a7a5e',
    description: 'Core biblical truths and sound doctrine',
    topics: ['Assurance', 'Faith and Provision', 'Providence', 'Revival', 'Sanctification', 'The Holy Spirit', 'The Word of God'],
  },
  'History & Movements': {
    icon: '🏛️',
    color: '#7a4f1a',
    description: 'Church history and spiritual movements',
    topics: ['Moravians'],
  },
  'Missions & Evangelism': {
    icon: '🌍',
    color: '#0e7490',
    description: 'Spreading the gospel around the world',
    topics: ['Church Planting', 'Medical Missions', 'Missions Training', 'Street Preaching', 'Women Evangelists', 'Loss on the Mission Field', 'Prison Ministry'],
  },
  'Region': {
    icon: '🗺️',
    color: '#6b7280',
    description: 'Stories from specific places and peoples',
    topics: ['Africa', 'American Indians', 'Burmah (Myanmar)', 'China', 'Congo'],
  },
  'Spiritual Disciplines': {
    icon: '🙏',
    color: '#be185d',
    description: 'Practices that deepen your walk with God',
    topics: ['Healing', 'Humility', 'Prayer', 'Restoration'],
  },
  'Other': {
    icon: '📚',
    color: '#374151',
    description: 'Additional topics from across the library',
    topics: ['Evangelism', 'Jews', 'Pastors', 'Repentance', 'Second Coming of Christ'],
  },
};

// ─── Topic chip ───────────────────────────────────────────────────────────────
function TopicChip({ topic, count, color }: { topic: string; count: number; color: string }) {
  return (
    <Link
      href={`/topics/${encodeURIComponent(topic)}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.18s',
        background: `${color}12`,
        color: color,
        border: `1px solid ${color}30`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = color;
        (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = color;
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 12px ${color}40`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = `${color}12`;
        (e.currentTarget as HTMLAnchorElement).style.color = color;
        (e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}30`;
        (e.currentTarget as HTMLAnchorElement).style.transform = '';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
      }}
    >
      {topic}
      <span style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        background: `${color}20`,
        padding: '1px 5px',
        borderRadius: 99,
        lineHeight: 1.5,
      }}>
        {count}
      </span>
    </Link>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────
function CategoryCard({
  groupTitle,
  meta,
  topicCounts,
  searchQuery,
  animDelay,
}: {
  groupTitle: string;
  meta: TopicGroupMeta;
  topicCounts: Record<string, number>;
  searchQuery: string;
  animDelay: number;
}) {
  const visibleTopics = meta.topics.filter((t) => topicCounts[t] !== undefined);
  const filteredTopics = searchQuery
    ? visibleTopics.filter((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase()) ||
        groupTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleTopics;

  if (filteredTopics.length === 0) return null;

  const totalBooks = filteredTopics.reduce((acc, t) => acc + (topicCounts[t] ?? 0), 0);

  return (
    <div
      className="category-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        animation: `fadeInUp 0.45s ${animDelay}ms both`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: `linear-gradient(135deg, ${meta.color}08, ${meta.color}04)`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        <div style={{
          width: 46, height: 46,
          borderRadius: 'var(--radius-md)',
          background: `${meta.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
          border: `1px solid ${meta.color}25`,
        }}>
          {meta.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.25 }}>
            {groupTitle}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 3, lineHeight: 1.4 }}>
            {meta.description}
          </div>
          <div style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: 700,
            marginTop: 6,
            padding: '2px 8px',
            borderRadius: 99,
            background: `${meta.color}18`,
            color: meta.color,
          }}>
            {totalBooks} audiobook{totalBooks !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
        {filteredTopics.map((topic) => (
          <TopicChip
            key={topic}
            topic={topic}
            count={topicCounts[topic] ?? 0}
            color={meta.color}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TopicsIndex() {
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const getAllTopics = useLibraryStore((s) => s.getAllTopics);
  const getByTopic = useLibraryStore((s) => s.getByTopic);
  const [search, setSearch] = useState('');

  // Build topic → count map once
  const topicCounts = useMemo(() => {
    if (!isLoaded) return {};
    const counts: Record<string, number> = {};
    getAllTopics().forEach((t) => {
      counts[t] = getByTopic(t).length;
    });
    return counts;
  }, [isLoaded, getAllTopics, getByTopic]);

  // Merge database topics not in our static map into 'Other'
  const finalGroups = useMemo(() => {
    const mapped = new Set(Object.values(TOPIC_GROUPS).flatMap((g) => g.topics));
    const unmapped = Object.keys(topicCounts).filter((t) => !mapped.has(t)).sort();
    const groups = { ...TOPIC_GROUPS };
    if (unmapped.length > 0) {
      groups['Other'] = { ...groups['Other'], topics: [...groups['Other'].topics, ...unmapped] };
    }
    return groups;
  }, [topicCounts]);

  const totalBooks = useMemo(() =>
    Object.values(topicCounts).reduce((a, b) => a + b, 0),
    [topicCounts]
  );
  const totalTopics = Object.keys(topicCounts).length;

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-xl)', marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ─── Hero ─── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 36px 32px',
        marginBottom: 36,
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.4s both',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, right: 80,
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <h1 style={{
                color: '#fff',
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                fontWeight: 800,
                marginBottom: 8,
                letterSpacing: '-0.02em',
              }}>
                Browse by Topic
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', maxWidth: 480, lineHeight: 1.6 }}>
                Explore our library through {totalTopics} topics spanning theology, missions, church history, and more.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
              {[
                { label: 'Topics', value: totalTopics },
                { label: 'Audiobooks', value: totalBooks },
                { label: 'Categories', value: Object.keys(finalGroups).length },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>{value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ marginTop: 24, position: 'relative', maxWidth: 440 }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="topics-filter-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter topics…"
              aria-label="Filter topics"
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.14)',
                color: '#fff',
                fontSize: '0.9375rem',
                outline: 'none',
                backdropFilter: 'blur(4px)',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            />
          </div>
        </div>
      </div>

      {/* ─── Category grid ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }} className="topics-grid">
        {Object.entries(finalGroups).map(([groupTitle, meta], index) => (
          <CategoryCard
            key={groupTitle}
            groupTitle={groupTitle}
            meta={meta}
            topicCounts={topicCounts}
            searchQuery={search}
            animDelay={index * 50}
          />
        ))}
      </div>

      {/* No results */}
      {search && Object.entries(finalGroups).every(([, meta]) =>
        meta.topics.filter((t) =>
          topicCounts[t] !== undefined &&
          (t.toLowerCase().includes(search.toLowerCase()))
        ).length === 0
      ) && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔍</div>
          <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>No topics found for "{search}"</p>
          <p style={{ fontSize: '0.875rem' }}>Try a different keyword or browse all categories above.</p>
          <button
            onClick={() => setSearch('')}
            style={{
              marginTop: 16, padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-brand)', color: '#fff',
              border: 'none', fontWeight: 600, cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .topics-filter-input::placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .category-card {
          transition: box-shadow 0.22s, transform 0.22s;
        }
        .category-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-3px);
        }
        @media (max-width: 640px) {
          .topics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
