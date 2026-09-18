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
        background: '#fef2f2',
        border: '1px solid #fecaca',
        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
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
          <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
            SOC2 Audit Deadline
          </span>
        </div>

        {urgentAnnouncements.length > 1 && (
          <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>
            +{urgentAnnouncements.length - 1} more alert
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>
            {topUrgent.title}
          </h3>
          <p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>
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
