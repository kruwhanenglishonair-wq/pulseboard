'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Announcement } from '@/lib/types';

interface UrgentAlertBannerProps {
  urgentAnnouncements: Announcement[];
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({ urgentAnnouncements }) => {
  if (!urgentAnnouncements || urgentAnnouncements.length === 0) return null;

  const topUrgent = urgentAnnouncements[0];

  return (
    <div
      style={{
        marginBottom: 24,
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'fadeIn 300ms ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pulsating-dot" />
          <span className="badge badge-urgent" style={{ fontSize: 11 }}>
            Mandatory Action Required
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            SOC2 Audit Deadline
          </span>
        </div>

        {urgentAnnouncements.length > 1 && (
          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>
            +{urgentAnnouncements.length - 1} more alert
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {topUrgent.title}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {topUrgent.summary}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href={`/announcements/${topUrgent.id}`}
            className="btn btn-urgent"
            style={{ padding: '8px 16px', fontSize: 13, borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap' }}
          >
            <span>Review & Acknowledge</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};
