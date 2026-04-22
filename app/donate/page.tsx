'use client';

import { Heart, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function DonatePage() {
  return (
    <div className="page pb-24" style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
      
      {/* Decorative Icon */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(234, 179, 8, 0.12)', // Subtle gold background
        color: 'var(--color-brand)',
        marginBottom: 24
      }}>
        <Heart size={36} fill="currentColor" />
      </div>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>Support Scroll Reader</h1>
      
      <div className="card" style={{ padding: '40px 32px', marginTop: 32, textAlign: 'center' }}>
        
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 28px' }}>
          Your support helps cover ongoing costs like licensing fees, hosting, server maintenance, and tools needed to keep <strong>Scroll Reader</strong> running.
        </p>

        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          maxWidth: 540, margin: '0 auto 36px'
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            <strong>Please note:</strong> We are not a 501(c)(3) organization. Donations are not tax-deductible but go directly towards sustaining and growing this work.
          </p>
        </div>

        {/* PayPal Button */}
        <a 
          href="https://www.paypal.com/donate/?hosted_button_id=7G62ZD3PQDCCG" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          <button style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 32px', fontSize: '1.125rem', fontWeight: 700,
            backgroundColor: '#0070ba', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            boxShadow: 'var(--shadow-md)', transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#005ea6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0070ba';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          >
            <CreditCard size={20} />
            Donate via PayPal
          </button>
        </a>

        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 24 }}>
          Clicking the button will take you to a secure PayPal page to complete your donation.
        </p>
      </div>

    </div>
  );
}
