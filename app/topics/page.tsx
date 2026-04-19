'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';

const TOPIC_GROUPS: Record<string, string[]> = {
  'Christian Life & Ethics': ['Greed', 'Killing Sin', 'Marriage', 'Military', 'Money and Stewardship', 'Parenting', 'Patriotism'],
  'Church & Ministry': ['Counseling', 'Preaching'],
  'Doctrine & Theology': ['Assurance', 'Faith and Provision', 'Providence', 'Revival', 'Sanctification', 'The Holy Spirit', 'The Word of God'],
  'History & Movements': ['Moravians'],
  'Missions & Evangelism': ['Church Planting', 'Medical Missions', 'Missions Training', 'Street Preaching', 'Women Evangelists', 'Loss on the Mission Field', 'Prison Ministry'],
  'Region': ['Africa', 'American Indians', 'Burmah (Myanmar)', 'China', 'Congo'],
  'Spiritual Disciplines': ['Healing', 'Humility', 'Prayer', 'Restoration'],
  'Other': ['Evangelism', 'Jews', 'Pastors', 'Repentance', 'Second Coming of Christ']
};

function TopicGroup({ title, topics, currentTopics }: { title: string, topics: string[], currentTopics: string[] }) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Only show topics that actually exist in the current database store, or just rely on the static list
  // The screenshot shows 0-count or existing count topics. Let's merge them.
  // Actually, we'll iterate through the static topics and look up their count.
  return (
    <div style={{ breakInside: 'avoid', marginBottom: 24, backgroundColor: 'var(--color-surface)', borderRadius: 6, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px', 
          backgroundColor: '#2e6aa7', // Deep blue brand
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          textAlign: 'left'
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.2em', lineHeight: 1 }}>{isOpen ? '-' : '+'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map(topic => {
            const books = useLibraryStore((s) => s.getByTopic(topic));
            return (
              <Link 
                key={topic} 
                href={`/topics/${encodeURIComponent(topic)}`}
                style={{ 
                  textDecoration: 'none', 
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6
                }}
              >
                <span className="hover-underline">{topic}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85em' }}>({books.length})</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}

export default function TopicsIndex() {
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const allCurrentTopics = useLibraryStore((s) => s.getAllTopics());
  
  if (!isLoaded) {
    return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  // Find any dynamically added topics in the database that are NOT inside our static map
  // and append them to the 'Other' category automatically so nothing is lost!
  const mappedTopics = new Set(Object.values(TOPIC_GROUPS).flat());
  const unmappedTopics = allCurrentTopics.filter(t => !mappedTopics.has(t));
  
  const finalGroups = { ...TOPIC_GROUPS };
  if (unmappedTopics.length > 0) {
    finalGroups['Other'] = [...(finalGroups['Other'] || []), ...unmappedTopics].sort();
  }

  return (
    <div className="page">
      <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 32, fontSize: '2.5rem', fontWeight: 800 }}>Browse by Topic</h1>
        
        {/* CSS Multi-column layout for masonry effect */}
        <div style={{
          columnCount: 3,
          columnGap: 24,
        }} className="topics-masonry">
          {Object.entries(finalGroups).map(([groupTitle, topics]) => (
            <TopicGroup 
              key={groupTitle} 
              title={groupTitle} 
              topics={topics} 
              currentTopics={allCurrentTopics} 
            />
          ))}
        </div>
      </div>
      
      {/* Media Query for responsive column count */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) { .topics-masonry { column-count: 2 !important; } }
        @media (max-width: 640px) { .topics-masonry { column-count: 1 !important; } }
        .hover-underline { position: relative; }
        .hover-underline:hover { color: var(--color-brand); text-decoration: underline; }
      `}} />
    </div>
  );
}
