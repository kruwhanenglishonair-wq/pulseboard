'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Calendar,
  Clock,
  Pin,
  ShieldAlert,
  MessageSquare,
  Building,
  UploadCloud,
  FileText,
  Sparkles,
  Bot
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { Announcement, AnnouncementCategory, AnnouncementPriority, AnnouncementStatus, TargetAudienceType } from '@/lib/types';
import { sendAnnouncementWebhook } from '@/lib/webhook';
import { useToast } from '@/components/ui/Toast';
import {
  dispatchSystemNotification,
  scheduleServiceWorkerNotification,
  markAnnouncementAsNotified,
  requestNotificationPermission,
  getNotificationPermission
} from '@/lib/notifications';

interface PostEditorFormProps {
  initialData?: Partial<Announcement>;
  isEditing?: boolean;
}

export const PostEditorForm: React.FC<PostEditorFormProps> = ({ initialData, isEditing = false }) => {
  const router = useRouter();
  const { createAnnouncement, updateAnnouncement, currentUser, departments } = useAnnouncementStore();
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState<AnnouncementCategory>(initialData?.category || 'GENERAL');
  const [priority, setPriority] = useState<AnnouncementPriority>(initialData?.priority || 'GENERAL');
  const [targetType, setTargetType] = useState<TargetAudienceType>(initialData?.target_type || 'ALL');
  const [targetValue, setTargetValue] = useState(initialData?.target_value || (departments[0]?.name || 'Platform Engineering'));
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || false);
  const [requiresAck, setRequiresAck] = useState(initialData?.requires_acknowledgement || false);
  const [allowComments, setAllowComments] = useState(initialData?.allow_comments ?? true);
  const [scheduledAt, setScheduledAt] = useState(initialData?.scheduled_at ? initialData.scheduled_at.slice(0, 16) : '');
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at ? initialData.expires_at.slice(0, 16) : '');
  const [dispatchSlack, setDispatchSlack] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Markdown helper buttons
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    setContent((prev) => `${prev}${prefix}${suffix}`);
  };

  const handleSubmit = async (e: React.FormEvent, status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      showToast('Please fill out the title, summary, and content.', 'error');
      return;
    }

    setSubmitting(true);

    const isFuture = scheduledAt && new Date(scheduledAt).getTime() > Date.now();
    const effectiveStatus: AnnouncementStatus = status === 'DRAFT' ? 'DRAFT' : isFuture ? 'SCHEDULED' : 'PUBLISHED';

    const postPayload: Partial<Announcement> = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category,
      priority,
      status: effectiveStatus,
      is_pinned: isPinned,
      requires_acknowledgement: requiresAck,
      allow_comments: allowComments,
      target_type: targetType,
      target_value: targetType === 'ALL' ? null : targetValue || (targetType === 'DEPARTMENT' ? 'Engineering' : 'Bangkok HQ'),
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
    };

    try {
      let savedPost: Announcement;

      if (isEditing && initialData?.id) {
        updateAnnouncement(initialData.id, postPayload);
        savedPost = { ...initialData, ...postPayload } as Announcement;
        showToast('Announcement updated successfully!', 'success');
      } else {
        savedPost = createAnnouncement(postPayload);
        if (effectiveStatus === 'SCHEDULED') {
          showToast(`Announcement scheduled for ${new Date(scheduledAt).toLocaleString()}!`, 'success');
        } else {
          showToast('Announcement published to company feed!', 'success');
        }
      }

      // Check notification permission on device if not yet determined
      if (getNotificationPermission() === 'default') {
        requestNotificationPermission();
      }

      // Handle Mobile Alerts & Timer Scheduling
      if (effectiveStatus === 'SCHEDULED') {
        const delayMs = new Date(scheduledAt).getTime() - Date.now();
        if (delayMs > 0) {
          scheduleServiceWorkerNotification(savedPost, delayMs);
        }
      } else if (effectiveStatus === 'PUBLISHED') {
        // Instant mobile notification
        dispatchSystemNotification(
          savedPost.priority === 'URGENT' ? `🚨 URGENT: ${savedPost.title}` : `📢 ${savedPost.title}`,
          {
            body: `[${savedPost.category}] ${savedPost.summary}`,
            url: `/announcements/${savedPost.id}`,
            tag: `announcement-${savedPost.id}`,
            isUrgent: savedPost.priority === 'URGENT'
          }
        );
        markAnnouncementAsNotified(savedPost.id);
      }

      // Send Webhook alert if requested and already published
      if (dispatchSlack && effectiveStatus === 'PUBLISHED') {
        const webhookRes = await sendAnnouncementWebhook(savedPost, 'slack');
        if (webhookRes.success) {
          showToast('Alert broadcast to Slack #announcements channel!', 'info');
        }
      }

      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err) {
      showToast('Error saving announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, 'PUBLISHED')} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title & Summary */}
      <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Announcement Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 🚨 Mandatory Security 2FA Re-verification by Friday"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Short Summary (Appears in Feed Card & Notifications) *
          </label>
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="A concise 1-2 sentence overview of the policy update or announcement..."
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Rich Markdown Editor */}
      <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Full Announcement Content (Markdown Supported) *
          </label>

          {/* Markdown Quick Tools */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => insertMarkdown('\n## ')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('\n- ')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('\n> ')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('[Link Title](https://example.com)')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              Link
            </button>
          </div>
        </div>

        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="Write the full announcement here. Use markdown for headings, bullet lists, bold text, and hyperlinks..."
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            borderRadius: 'var(--radius-md)',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            outline: 'none',
            lineHeight: 1.6,
            resize: 'vertical'
          }}
        />
      </div>

      {/* Metadata & Targeting Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Category & Priority */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Category & Urgency
          </h3>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Category Hub
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a'
              }}
            >
              <option value="GENERAL">General Updates</option>
              <option value="HR">People & HR Policies</option>
              <option value="IT_SECURITY">IT & Security Operations</option>
              <option value="TOWN_HALL">All-Hands Town Hall</option>
              <option value="EVENTS">Events & Culture</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a'
              }}
            >
              <option value="GENERAL">🟢 General (News, perks, culture)</option>
              <option value="IMPORTANT">🟡 Important (Town Hall, benefits window)</option>
              <option value="URGENT">🔴 Urgent (Emergency, mandatory policy)</option>
            </select>
          </div>
        </div>

        {/* Audience Targeting */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Audience Targeting
          </h3>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Broadcast Scope
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as TargetAudienceType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a'
              }}
            >
              <option value="ALL">Company-Wide (All Employees)</option>
              <option value="DEPARTMENT">Target by Department</option>
              <option value="LOCATION">Target by Office Location</option>
            </select>
          </div>

          {targetType === 'DEPARTMENT' && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Select Department
              </label>
              <select
                value={targetValue || (departments[0]?.name || 'Platform Engineering')}
                onChange={(e) => setTargetValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a'
                }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
                {!departments.some((d) => d.name === targetValue) && targetValue && (
                  <option value={targetValue}>{targetValue}</option>
                )}
              </select>
            </div>
          )}

          {targetType === 'LOCATION' && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Select Office Branch
              </label>
              <select
                value={targetValue || 'Bangkok HQ'}
                onChange={(e) => setTargetValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a'
                }}
              >
                <option value="Bangkok HQ">Bangkok HQ</option>
                <option value="Singapore">Singapore Regional Hub</option>
                <option value="Tokyo">Tokyo Office</option>
                <option value="Remote">Fully Remote Staff</option>
              </select>
            </div>
          )}
        </div>

        {/* Scheduling & Expiry */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Publishing Schedule & Expiry
          </h3>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Scheduled Publish Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Auto-Archive Expiry Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a'
              }}
            />
          </div>
        </div>
      </div>

      {/* Engagement & Compliance Toggles */}
      <div
        className="glass-panel"
        style={{
          padding: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={(e) => setRequiresAck(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Mandatory Acknowledgment
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Requires employee sign-off with audit logging
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Pin to Top of Feed
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Keep highlighted in banner / pinned section
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Allow Discussion
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Employees can comment and ask questions
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={dispatchSlack}
            onChange={(e) => setDispatchSlack(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Slack / Teams Webhook
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Broadcast summary to #announcements
            </div>
          </div>
        </label>
      </div>

      {/* Form Submission Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="btn btn-secondary"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'DRAFT')}
          disabled={submitting}
          className="btn btn-secondary"
        >
          Save as Draft
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{ minWidth: 180 }}
        >
          {scheduledAt && new Date(scheduledAt).getTime() > Date.now() ? (
            <Clock size={16} />
          ) : (
            <Send size={16} />
          )}
          <span>
            {submitting
              ? 'Saving...'
              : isEditing
              ? 'Save Changes'
              : scheduledAt && new Date(scheduledAt).getTime() > Date.now()
              ? `Schedule for ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Publish Announcement'}
          </span>
        </button>
      </div>
    </form>
  );
};
