'use client';

import React from 'react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

interface ReactionBarProps {
  announcementId: string;
  reactionsSummary?: Record<string, number>;
  userReactions?: string[];
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  announcementId,
  reactionsSummary = {},
  userReactions = []
}) => {
  const { toggleReaction } = useAnnouncementStore();

  const options = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Heart' },
    { emoji: '👏', label: 'Applause' },
    { emoji: '🎉', label: 'Celebrate' },
    { emoji: '💡', label: 'Insight' }
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '16px 0'
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>
        Reactions:
      </span>

      {options.map(({ emoji, label }) => {
        const count = reactionsSummary[emoji] || 0;
        const active = userReactions.includes(emoji);

        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(announcementId, emoji)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: active ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface-elevated)',
              border: active ? '1px solid var(--brand-secondary)' : '1px solid var(--border-subtle)',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            title={`${label} (${count})`}
          >
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: active ? 'var(--brand-secondary)' : 'var(--text-secondary)'
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
