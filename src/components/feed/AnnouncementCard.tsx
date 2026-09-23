'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Pin,
  Clock,
  MessageSquare,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Share2,
  Bell
} from 'lucide-react';
import { Announcement } from '@/lib/types';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { useToast } from '@/components/ui/Toast';
import { TestNotificationModal } from '@/components/announcement/TestNotificationModal';

interface AnnouncementCardProps {
  announcement: Announcement;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const { toggleReaction, toggleBookmark, currentUser } = useAnnouncementStore();
  const { showToast } = useToast();
  const [showTestModal, setShowTestModal] = useState(false);

  const isUrgent = announcement.priority === 'URGENT';
  const isImportant = announcement.priority === 'IMPORTANT';

  const getPriorityBadge = () => {
    if (isUrgent) return <span className="badge badge-urgent"><span className="pulsating-dot" /> Urgent</span>;
    if (isImportant) return <span className="badge badge-important">Important</span>;
    return <span className="badge badge-general">General</span>;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'IT_SECURITY': return 'IT & Security';
      case 'TOWN_HALL': return 'Town Hall';
      case 'EVENTS': return 'Events & Culture';
      case 'HR': return 'People & HR';
      default: return 'General News';
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleBookmark(announcement.id);
    showToast(announcement.user_bookmarked ? 'Removed from Bookmarks' : 'Saved to Bookmarks', 'info');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/announcements/${announcement.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('Announcement link copied to clipboard!', 'success');
    }
  };

  const emojis = ['👍', '❤️', '👏', '🎉', '💡'];

  return (
    <article
      className="glass-panel-elevated"
      style={{
        position: 'relative',
        padding: '24px',
        marginBottom: '18px',
        borderLeft: isUrgent
          ? '4px solid var(--urgent-base)'
          : isImportant
          ? '4px solid var(--important-base)'
          : '4px solid transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Top Header: Metadata Badges & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {announcement.is_pinned && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--brand-secondary)',
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <Pin size={12} /> Pinned
            </span>
          )}

          {getPriorityBadge()}

          <span className="badge badge-category">
            {getCategoryLabel(announcement.category)}
          </span>

          {announcement.target_type !== 'ALL' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-muted)',
                fontSize: 11,
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Building2 size={11} />
              {announcement.target_value}
            </span>
          )}
        </div>

        {/* Right Action Icons: Test Alert, Share & Bookmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTestModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--brand-primary)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            title="Test Mobile Alert & Customize"
            aria-label="Test mobile alert for this announcement"
          >
            <Bell size={13} />
            <span>Test Notify</span>
          </button>

          <button
            onClick={handleShare}
            style={{
              padding: 6,
              borderRadius: 8,
              color: 'var(--text-muted)',
              transition: 'color var(--transition-fast)'
            }}
            title="Share Announcement"
            aria-label="Share announcement"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleBookmark}
            style={{
              padding: 6,
              borderRadius: 8,
              color: announcement.user_bookmarked ? 'var(--brand-secondary)' : 'var(--text-muted)',
              transition: 'color var(--transition-fast)'
            }}
            title={announcement.user_bookmarked ? 'Remove Bookmark' : 'Bookmark Announcement'}
            aria-label="Bookmark announcement"
          >
            <Bookmark size={16} fill={announcement.user_bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Main Title & Summary */}
      <div>
        <Link href={`/announcements/${announcement.id}`}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginBottom: 8,
              transition: 'color var(--transition-fast)'
            }}
          >
            {announcement.title}
          </h2>
        </Link>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {announcement.summary}
        </p>
      </div>

      {/* Compliance / Acknowledgment Callout (if mandatory) */}
      {announcement.requires_acknowledgement && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: announcement.user_acknowledged ? 'var(--success-bg)' : 'var(--urgent-bg)',
            border: `1px solid ${announcement.user_acknowledged ? 'var(--success-border)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: 12,
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {announcement.user_acknowledged ? (
              <>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  You acknowledged this policy
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} color="#ef4444" />
                <span style={{ color: '#f87171', fontWeight: 600 }}>
                  Mandatory sign-off required
                </span>
              </>
            )}
          </div>

          <Link
            href={`/announcements/${announcement.id}`}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: announcement.user_acknowledged ? '#10b981' : '#f87171',
              textDecoration: 'underline'
            }}
          >
            {announcement.user_acknowledged ? 'View Receipt' : 'Sign Off Now →'}
          </Link>
        </div>
      )}

      {/* Attachments preview snippet if any */}
      {announcement.attachments && announcement.attachments.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--brand-secondary)' }}>
          <FileText size={14} />
          <span>{announcement.attachments[0].name} ({announcement.attachments[0].size})</span>
        </div>
      )}

      {/* Footer: Author Info + Reactions + Comments link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        {/* Author info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {announcement.author && (
            <Image
              src={announcement.author.avatar_url}
              alt={announcement.author.full_name}
              width={28}
              height={28}
              style={{
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {announcement.author?.full_name || 'Powerhouse Admin'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {announcement.author?.department} • 2h ago
            </div>
          </div>
        </div>

        {/* Reactions & Comments Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Reaction badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {emojis.slice(0, 3).map((emoji) => {
              const count = announcement.reactions_summary?.[emoji] || 0;
              const hasReacted = announcement.user_reactions?.includes(emoji);
              if (count === 0 && !hasReacted) return null;

              return (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(announcement.id, emoji)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    background: hasReacted ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface-elevated)',
                    border: hasReacted ? '1px solid var(--brand-secondary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                  title={`React ${emoji}`}
                >
                  <span>{emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Comments count */}
          <Link
            href={`/announcements/${announcement.id}#comments`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}
          >
            <MessageSquare size={15} />
            <span>{announcement.comments_count || 0}</span>
          </Link>
        </div>
      </div>

      {/* Test Mobile Alert & Customization Modal */}
      <TestNotificationModal
        announcement={announcement}
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />
    </article>
  );
};
