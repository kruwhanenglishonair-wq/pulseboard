'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  PlusCircle,
  Pin,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  BarChart3,
  Users,
  Send
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { AuditLogModal } from '@/components/admin/AuditLogModal';
import { sendAnnouncementWebhook } from '@/lib/webhook';
import { useToast } from '@/components/ui/Toast';
import { Announcement } from '@/lib/types';

export default function AdminDashboardPage() {
  const { announcements, deleteAnnouncement, togglePin, currentUser, switchUser, getAuditLogs } =
    useAnnouncementStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SCHEDULED' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  const [selectedAuditPost, setSelectedAuditPost] = useState<Announcement | null>(null);

  const isAdmin = currentUser
    ? ['super_admin', 'hr_admin', 'contributor', 'dementor'].includes(currentUser.role) ||
      currentUser.nickname.toLowerCase().includes('dementor')
    : false;

  const filteredPosts = announcements.filter((a) => {
    if (activeTab === 'ACTIVE') return a.status === 'PUBLISHED';
    if (activeTab === 'DRAFT') return a.status === 'DRAFT';
    if (activeTab === 'SCHEDULED') return a.status === 'SCHEDULED';
    if (activeTab === 'ARCHIVED') return a.status === 'ARCHIVED';
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteAnnouncement(id);
      showToast('Announcement removed.', 'info');
    }
  };

  const handleSlackBroadcast = async (post: Announcement) => {
    const res = await sendAnnouncementWebhook(post, 'slack');
    showToast(res.message, res.success ? 'success' : 'error');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Shield size={24} color="var(--brand-secondary)" />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Admin Console & Read Receipts
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Manage publication lifecycles, inspect compliance audit receipts, and trigger chat webhooks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/admin/create" className="btn btn-primary" style={{ gap: 8 }}>
            <PlusCircle size={16} />
            <span>New Announcement</span>
          </Link>
        </div>
      </div>

      {/* Persona Notice if currently in employee role */}
      {!isAdmin && (
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ fontSize: 13, color: '#b45309' }}>
            You are viewing this console as an <strong>Employee ({currentUser?.nickname || 'Guest'})</strong>.
            Switch to a Dementor persona to test full administration.
          </div>
          <button
            onClick={() => switchUser('user-dementor')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, borderColor: '#d97706', color: '#b45309' }}
          >
            Switch to Dementor Admin
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        {[
          { key: 'ACTIVE', label: 'Active Announcements', count: announcements.filter((a) => a.status === 'PUBLISHED').length },
          { key: 'SCHEDULED', label: 'Scheduled', count: announcements.filter((a) => a.status === 'SCHEDULED').length },
          { key: 'DRAFT', label: 'Drafts', count: announcements.filter((a) => a.status === 'DRAFT').length },
          { key: 'ARCHIVED', label: 'Archived', count: announcements.filter((a) => a.status === 'ARCHIVED').length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 500,
              background: activeTab === tab.key ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              border: activeTab === tab.key ? '1px solid var(--border-active)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Announcements Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', background: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '14px 16px' }}>Title & Category</th>
                <th style={{ padding: '14px 16px' }}>Priority</th>
                <th style={{ padding: '14px 16px' }}>Target Audience</th>
                <th style={{ padding: '14px 16px' }}>Compliance Sign-Off</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No announcements found in this status tab.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const audit = getAuditLogs(post.id);

                  return (
                    <tr
                      key={post.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {post.is_pinned && <Pin size={13} color="var(--brand-secondary)" />}
                          <Link
                            href={`/announcements/${post.id}`}
                            style={{ fontWeight: 700, color: 'var(--text-primary)' }}
                          >
                            {post.title}
                          </Link>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {post.category} • Created {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {post.priority === 'URGENT' ? (
                          <span className="badge badge-urgent" style={{ fontSize: 10 }}>Urgent</span>
                        ) : post.priority === 'IMPORTANT' ? (
                          <span className="badge badge-important" style={{ fontSize: 10 }}>Important</span>
                        ) : (
                          <span className="badge badge-general" style={{ fontSize: 10 }}>General</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {post.target_type === 'ALL' ? 'All Company' : `${post.target_type}: ${post.target_value}`}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {post.requires_acknowledgement ? (
                          <button
                            onClick={() => setSelectedAuditPost(post)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              gap: 6,
                              fontSize: 12,
                              color: audit.rate === 100 ? '#10b981' : 'var(--brand-secondary)',
                              borderColor: audit.rate === 100 ? '#10b981' : 'var(--border-subtle)'
                            }}
                            title="Open compliance read receipts audit log"
                          >
                            <BarChart3 size={13} />
                            <span>Audit Log ({audit.rate}%)</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not required</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleSlackBroadcast(post)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6 }}
                            title="Re-broadcast to Slack"
                          >
                            <Send size={14} color="#38bdf8" />
                          </button>

                          <button
                            onClick={() => togglePin(post.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6, color: post.is_pinned ? 'var(--brand-secondary)' : 'inherit' }}
                            title={post.is_pinned ? 'Unpin post' : 'Pin post to top'}
                          >
                            <Pin size={14} fill={post.is_pinned ? 'currentColor' : 'none'} />
                          </button>

                          <Link
                            href={`/announcements/${post.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6 }}
                            title="View post"
                          >
                            <Eye size={14} />
                          </Link>

                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6, color: '#ef4444' }}
                            title="Delete post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Read Receipts Audit Modal */}
      {selectedAuditPost && (
        <AuditLogModal
          announcement={selectedAuditPost}
          onClose={() => setSelectedAuditPost(null)}
        />
      )}
    </div>
  );
}
