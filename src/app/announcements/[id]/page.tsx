'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pin,
  Bookmark,
  Share2,
  FileText,
  Download,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { AcknowledgeButton } from '@/components/announcement/AcknowledgeButton';
import { ReactionBar } from '@/components/announcement/ReactionBar';
import { CommentSection } from '@/components/announcement/CommentSection';
import { TestNotificationModal } from '@/components/announcement/TestNotificationModal';
import { useToast } from '@/components/ui/Toast';

export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { announcements, toggleBookmark, currentUser } = useAnnouncementStore();
  const { showToast } = useToast();
  const [showTestModal, setShowTestModal] = React.useState(false);

  const announcement = announcements.find((a) => a.id === resolvedParams.id);

  if (!announcement) {
    return (
      <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Announcement Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          The requested announcement may have expired or been removed.
        </p>
        <Link href="/" className="btn btn-primary">
          Return to Feed
        </Link>
      </div>
    );
  }

  const isUrgent = announcement.priority === 'URGENT';
  const isImportant = announcement.priority === 'IMPORTANT';

  const handleShare = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Announcement link copied to clipboard!', 'success');
    }
  };

  const handleBookmark = () => {
    toggleBookmark(announcement.id);
    showToast(announcement.user_bookmarked ? 'Removed from Bookmarks' : 'Saved to Bookmarks', 'info');
  };

  // Basic markdown parser to render headings, bold, bullet points, quotes
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('## ')) {
        return (
          <h2
            key={idx}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#0f172a',
              marginTop: 24,
              marginBottom: 12,
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 6
            }}
          >
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3
            key={idx}
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: 20,
              marginBottom: 8
            }}
          >
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            style={{
              padding: '12px 16px',
              margin: '16px 0',
              borderLeft: '4px solid var(--brand-primary)',
              background: 'var(--bg-surface-elevated)',
              borderRadius: '0 8px 8px 0',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}
          >
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li
            key={idx}
            style={{
              marginLeft: 20,
              marginBottom: 6,
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}
          >
            {line.replace(/^[-*] /, '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: 12 }} />;
      }
      return (
        <p
          key={idx}
          style={{
            marginBottom: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: 15
          }}
        >
          {line}
        </p>
      );
    });
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={() => router.push('/')}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowTestModal(true)}
            className="btn btn-secondary btn-sm"
            style={{
              gap: 6,
              background: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--brand-primary)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontWeight: 600
            }}
            title="Test Mobile Alert & Customize"
          >
            <Bell size={14} />
            <span>Test Alert</span>
          </button>
          <button
            onClick={handleShare}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
            title="Share Announcement"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button
            onClick={handleBookmark}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6, color: announcement.user_bookmarked ? 'var(--brand-secondary)' : 'inherit' }}
            title="Bookmark"
          >
            <Bookmark size={14} fill={announcement.user_bookmarked ? 'currentColor' : 'none'} />
            <span>{announcement.user_bookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Post Container */}
      <article
        className="glass-panel"
        style={{
          padding: '32px 28px',
          borderLeft: isUrgent
            ? '5px solid var(--urgent-base)'
            : isImportant
            ? '5px solid var(--important-base)'
            : '1px solid var(--border-subtle)'
        }}
      >
        {/* Badges & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
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
                fontWeight: 700
              }}
            >
              <Pin size={12} /> Pinned
            </span>
          )}

          {isUrgent ? (
            <span className="badge badge-urgent"><span className="pulsating-dot" /> Urgent Notice</span>
          ) : isImportant ? (
            <span className="badge badge-important">Important</span>
          ) : (
            <span className="badge badge-general">General</span>
          )}

          <span className="badge badge-category">
            {announcement.category}
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

        {/* Title */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            marginBottom: 16
          }}
        >
          {announcement.title}
        </h1>

        {/* Author Card & Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {announcement.author && (
              <Image
                src={announcement.author.avatar_url}
                alt={announcement.author.full_name}
                width={38}
                height={38}
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {announcement.author?.full_name || 'Powerhouse Admin'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {announcement.author?.department} • {announcement.author?.location}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={14} />
              <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={14} />
              <span>3 min read</span>
            </div>
          </div>
        </div>

        {/* Mandatory Acknowledgment Sign-off (if required) */}
        {announcement.requires_acknowledgement && (
          <AcknowledgeButton
            announcementId={announcement.id}
            isAcknowledged={announcement.user_acknowledged}
            acknowledgedAt={announcement.acknowledged_at}
          />
        )}

        {/* Mobile Alert Test Bar on Ticket */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.18)',
            margin: '20px 0',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)'
              }}
            >
              <Bell size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Test Mobile Alert for this Ticket
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Preview lock screen notification, edit title/body & trigger phone alert chime
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTestModal(true)}
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, gap: 6, fontWeight: 600 }}
          >
            <Bell size={13} />
            <span>Customize & Test Alert</span>
          </button>
        </div>

        {/* Post Content */}
        <div style={{ margin: '24px 0', fontSize: 15, lineHeight: 1.7 }}>
          {renderMarkdown(announcement.content)}
        </div>

        {/* Attachments Section if any */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div
            style={{
              margin: '32px 0 20px',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Attached Documents & Resources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {announcement.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={18} color="var(--brand-secondary)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{att.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{att.size} • PDF Document</div>
                    </div>
                  </div>
                  <Download size={16} color="var(--text-muted)" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Emoji Reactions Bar */}
        <ReactionBar
          announcementId={announcement.id}
          reactionsSummary={announcement.reactions_summary}
          userReactions={announcement.user_reactions}
        />

        {/* Comment Section */}
        <CommentSection
          announcementId={announcement.id}
          allowComments={announcement.allow_comments}
        />
      </article>

      {/* Test Mobile Alert & Customization Modal */}
      <TestNotificationModal
        announcement={announcement}
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />
    </div>
  );
}
