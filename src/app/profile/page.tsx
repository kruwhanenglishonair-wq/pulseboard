'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  MapPin,
  Building,
  Shield,
  Bell,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Save,
  Smartphone,
  Send
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { useToast } from '@/components/ui/Toast';
import { Announcement } from '@/lib/types';
import { TestNotificationModal } from '@/components/announcement/TestNotificationModal';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  NotificationPermissionStatus
} from '@/lib/notifications';

export default function ProfilePage() {
  const { currentUser, announcements } = useAnnouncementStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'SAVED' | 'ACKS' | 'SETTINGS'>('SAVED');
  const [selectedTestPost, setSelectedTestPost] = useState<Announcement | null>(null);

  // Preferences State
  const [emailUrgent, setEmailUrgent] = useState(currentUser?.notification_preferences?.email_urgent ?? true);
  const [emailDigest, setEmailDigest] = useState(currentUser?.notification_preferences?.email_digest ?? true);
  const [slackAlerts, setSlackAlerts] = useState(currentUser?.notification_preferences?.slack_alerts ?? false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionStatus>('default');

  React.useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const bookmarkedPosts = announcements.filter((a) => a.user_bookmarked);
  const acknowledgedPosts = announcements.filter((a) => a.user_acknowledged);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Notification preferences updated successfully!', 'success');
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Image
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={currentUser?.nickname || 'Profile'}
            width={72}
            height={72}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--border-active)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{currentUser?.nickname || currentUser?.full_name || 'User Profile'}</h1>
              <span className="badge badge-general" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Employee'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Mail size={14} color="var(--brand-secondary)" />
                <span>{currentUser?.email || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Building size={14} color="var(--brand-secondary)" />
                <span>{currentUser?.department || 'General'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={14} color="var(--brand-secondary)" />
                <span>{currentUser?.location || 'HQ'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('SAVED')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: activeTab === 'SAVED' ? 700 : 500,
            background: activeTab === 'SAVED' ? '#ffffff' : 'transparent',
            color: activeTab === 'SAVED' ? 'var(--brand-primary)' : 'var(--text-muted)',
            border: activeTab === 'SAVED' ? '1px solid var(--border-active)' : '1px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Bookmark size={15} />
          <span>Saved Announcements ({bookmarkedPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ACKS')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: activeTab === 'ACKS' ? 700 : 500,
            background: activeTab === 'ACKS' ? '#ffffff' : 'transparent',
            color: activeTab === 'ACKS' ? 'var(--brand-primary)' : 'var(--text-muted)',
            border: activeTab === 'ACKS' ? '1px solid var(--border-active)' : '1px solid transparent',
            cursor: 'pointer'
          }}
        >
          <CheckCircle2 size={15} />
          <span>My Compliance Sign-Offs ({acknowledgedPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: activeTab === 'SETTINGS' ? 700 : 500,
            background: activeTab === 'SETTINGS' ? '#ffffff' : 'transparent',
            color: activeTab === 'SETTINGS' ? 'var(--brand-primary)' : 'var(--text-muted)',
            border: activeTab === 'SETTINGS' ? '1px solid var(--border-active)' : '1px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Bell size={15} />
          <span>Notification Preferences</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'SAVED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookmarkedPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              You haven&apos;t bookmarked any announcements yet. Click the bookmark icon on any post in the feed to save it here.
            </div>
          ) : (
            bookmarkedPosts.map((post) => (
              <div
                key={post.id}
                className="glass-panel-elevated"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-category">{post.category}</span>
                    {post.priority === 'URGENT' && <span className="badge badge-urgent">Urgent</span>}
                  </div>
                  <Link href={`/announcements/${post.id}`}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {post.title}
                    </h3>
                  </Link>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    By {post.author?.full_name} • {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedTestPost(post)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      gap: 5,
                      padding: '5px 10px',
                      fontSize: 12,
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--brand-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.25)'
                    }}
                    title="Test Mobile Alert"
                  >
                    <Bell size={13} />
                    <span>Test Alert</span>
                  </button>
                  <Link href={`/announcements/${post.id}`} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                    <span>Read</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ACKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {acknowledgedPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No mandatory policies signed off yet.
            </div>
          ) : (
            acknowledgedPosts.map((post) => (
              <div
                key={post.id}
                className="glass-panel-elevated"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  borderLeft: '4px solid #10b981'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#10b981',
                        background: 'var(--success-bg)',
                        padding: '2px 8px',
                        borderRadius: 12
                      }}
                    >
                      <CheckCircle2 size={12} /> Compliance Acknowledged
                    </span>
                    <span className="badge badge-category">{post.category}</span>
                  </div>
                  <Link href={`/announcements/${post.id}`}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {post.title}
                    </h3>
                  </Link>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Acknowledged by {currentUser?.nickname || currentUser?.full_name || 'You'} on {post.acknowledged_at ? new Date(post.acknowledged_at).toLocaleString() : 'Recently'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedTestPost(post)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      gap: 5,
                      padding: '5px 10px',
                      fontSize: 12,
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--brand-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.25)'
                    }}
                    title="Test Mobile Alert"
                  >
                    <Bell size={13} />
                    <span>Test Alert</span>
                  </button>
                  <Link href={`/announcements/${post.id}`} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                    <span>View Details</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSavePreferences} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Broadcast & Digest Delivery Channels
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Immediate Email for Urgent Alerts
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Receive high-priority emergency notifications and mandatory compliance warnings instantly.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailUrgent}
                onChange={(e) => setEmailUrgent(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--brand-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Weekly Friday Roundup Digest
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  A consolidated summary of general company announcements, social events, and spotlights.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={(e) => setEmailDigest(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--brand-primary)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Slack Direct Alerts (@powerhouse-bot)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Send direct bot alerts to your Slack account whenever an announcement is targeted to {currentUser?.department || 'your department'}.
                </div>
              </div>
              <input
                type="checkbox"
                checked={slackAlerts}
                onChange={(e) => setSlackAlerts(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--brand-primary)' }}
              />
            </label>
          </div>

          {/* Mobile Device Push Notifications Status & Test Card */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              marginTop: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: notifPermission === 'granted' ? '#dcfce7' : '#eff6ff',
                  color: notifPermission === 'granted' ? '#15803d' : 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Smartphone size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Mobile Device Push & Lock Screen Alerts
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Status: {notifPermission === 'granted' ? '✅ Active (Instant alerts on publish & schedule)' : notifPermission === 'denied' ? '❌ Blocked in browser settings' : '⚠️ Alerts not yet permitted on this device'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {notifPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await requestNotificationPermission();
                    setNotifPermission(res);
                    if (res === 'granted') {
                      showToast('Mobile notifications enabled successfully!', 'success');
                    } else {
                      showToast('Please enable notifications in device permissions', 'error');
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ gap: 6 }}
                >
                  <Bell size={14} />
                  <span>Enable Mobile Alerts</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sendTestNotification();
                    showToast('🔔 Test notification sent to this mobile device!', 'info');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6, borderColor: '#cbd5e1' }}
                >
                  <Send size={14} />
                  <span>Send Test Alert to Phone</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ gap: 8 }}>
              <Save size={16} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* Test Mobile Alert & Customization Modal */}
      {selectedTestPost && (
        <TestNotificationModal
          announcement={selectedTestPost}
          isOpen={!!selectedTestPost}
          onClose={() => setSelectedTestPost(null)}
        />
      )}
    </div>
  );
}
