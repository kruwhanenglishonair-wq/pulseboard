'use client';

import React from 'react';
import Image from 'next/image';
import { X, Download, CheckCircle2, Clock, ShieldCheck, Search } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { Announcement } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface AuditLogModalProps {
  announcement: Announcement;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ announcement, onClose }) => {
  const { getAuditLogs } = useAnnouncementStore();
  const { showToast } = useToast();
  const [filter, setFilter] = React.useState<'all' | 'acknowledged' | 'pending'>('all');
  const [search, setSearch] = React.useState('');

  const { records, rate, total, acknowledged } = getAuditLogs(announcement.id);

  const filteredRecords = records.filter((r) => {
    if (filter === 'acknowledged' && r.status !== 'acknowledged') return false;
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['Employee ID', 'Full Name', 'Email', 'Department', 'Location', 'Role', 'Status', 'Timestamp'];
    const rows = records.map((r) => [
      r.employee_id,
      r.full_name,
      r.email,
      r.department,
      r.location,
      r.role,
      r.status,
      r.acknowledged_at || 'N/A'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `compliance-audit-${announcement.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Compliance audit CSV exported successfully!', 'success');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-secondary)'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Compliance Read Receipts & Audit Log
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Post: {announcement.title}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: 4 }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Compliance Progress Bar & Metrics */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Overall Team Sign-Off Rate
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: rate === 100 ? '#10b981' : 'var(--brand-secondary)' }}>
              {rate}% ({acknowledged} of {total} employees)
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${rate}%`,
                height: '100%',
                background: rate === 100 ? '#10b981' : 'var(--brand-gradient)',
                transition: 'width 400ms ease'
              }}
            />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              All ({total})
            </button>
            <button
              onClick={() => setFilter('acknowledged')}
              className={`btn btn-sm ${filter === 'acknowledged' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Signed ({acknowledged})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Pending ({total - acknowledged})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 200 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                style={{
                  width: '100%',
                  padding: '4px 8px 4px 30px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={exportCsv}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12, gap: 6, padding: '5px 10px' }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table of Employees */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 8px' }}>Employee</th>
                <th style={{ padding: '12px 8px' }}>Department</th>
                <th style={{ padding: '12px 8px' }}>Location</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr
                  key={rec.employee_id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Image
                      src={rec.avatar_url}
                      alt={rec.full_name}
                      width={28}
                      height={28}
                      style={{
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                    {rec.department}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                    {rec.location}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {rec.status === 'acknowledged' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: 'var(--success-bg)',
                          color: '#10b981',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      >
                        <CheckCircle2 size={12} /> Acknowledged
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: '#fbbf24',
                          fontWeight: 600,
                          fontSize: 11
                        }}
                      >
                        <Clock size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-muted)' }}>
                    {rec.acknowledged_at ? new Date(rec.acknowledged_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
