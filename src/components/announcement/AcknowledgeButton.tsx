'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, Sparkles, FileCheck2 } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { useToast } from '@/components/ui/Toast';

interface AcknowledgeButtonProps {
  announcementId: string;
  isAcknowledged?: boolean;
  acknowledgedAt?: string | null;
}

export const AcknowledgeButton: React.FC<AcknowledgeButtonProps> = ({
  announcementId,
  isAcknowledged,
  acknowledgedAt
}) => {
  const { acknowledgeAnnouncement, currentUser } = useAnnouncementStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = () => {
    setLoading(true);
    setTimeout(() => {
      acknowledgeAnnouncement(announcementId);
      setLoading(false);
      showToast('Compliance acknowledgment recorded with timestamp!', 'success');
    }, 400);
  };

  if (isAcknowledged) {
    const formattedDate = acknowledgedAt
      ? new Date(acknowledgedAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : 'Recently';

    return (
      <div
        style={{
          margin: '28px 0',
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
              Acknowledged by You
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Verified compliance receipt for {currentUser.full_name} on {formattedDate}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            fontSize: 12,
            fontWeight: 700
          }}
        >
          <FileCheck2 size={14} />
          <span>Audit Logged</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '28px 0',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--bg-surface) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <ShieldAlert size={24} color="#ef4444" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Mandatory Policy Sign-off Required
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            This announcement requires formal confirmation under company SOC2 / HR compliance guidelines.
            By clicking below, you confirm that you have read, understood, and adhered to these instructions.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={handleAcknowledge}
          disabled={loading}
          className="btn btn-ack"
          style={{ padding: '12px 24px', fontSize: 14, borderRadius: 'var(--radius-md)' }}
        >
          <Sparkles size={16} />
          <span>{loading ? 'Recording Sign-off...' : 'I have read and understood'}</span>
        </button>
      </div>
    </div>
  );
};
