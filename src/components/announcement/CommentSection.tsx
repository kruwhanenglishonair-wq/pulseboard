'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { useToast } from '@/components/ui/Toast';

interface CommentSectionProps {
  announcementId: string;
  allowComments?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  announcementId,
  allowComments = true
}) => {
  const { comments, addComment, currentUser } = useAnnouncementStore();
  const { showToast } = useToast();
  const [content, setContent] = useState('');

  const postComments = comments[announcementId] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addComment(announcementId, content.trim());
    setContent('');
    showToast('Comment posted successfully!', 'success');
  };

  return (
    <section
      id="comments"
      style={{
        marginTop: 40,
        paddingTop: 32,
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <MessageSquare size={20} color="var(--brand-secondary)" />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          Discussion & Questions ({postComments.length})
        </h3>
      </div>

      {/* Input box if comments are allowed */}
      {allowComments ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 16
            }}
          >
            <Image
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.nickname || 'Avatar'}
              width={36}
              height={36}
              style={{
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Comment as ${currentUser?.nickname || currentUser?.full_name || 'Employee'}...`}
                rows={2}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ opacity: content.trim() ? 1 : 0.5 }}
                >
                  <Send size={14} />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-muted)',
            fontSize: 13,
            marginBottom: 24
          }}
        >
          <Lock size={16} />
          <span>Comments have been locked for this announcement by the author.</span>
        </div>
      )}

      {/* List of comments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {postComments.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No comments yet. Be the first to ask a question or share feedback!
          </div>
        ) : (
          postComments.map((cmt) => (
            <div
              key={cmt.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Image
                src={
                  cmt.user?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={cmt.user?.full_name || 'User'}
                width={32}
                height={32}
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cmt.user?.full_name || 'Team Member'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {cmt.user?.department} • {new Date(cmt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {cmt.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
