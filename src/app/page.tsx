'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, PlusCircle, Filter } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { UrgentAlertBanner } from '@/components/feed/UrgentAlertBanner';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { AnnouncementCard } from '@/components/feed/AnnouncementCard';

export default function HomeFeedPage() {
  const { announcements, currentUser } = useAnnouncementStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  const isAdminOrContributor = currentUser
    ? ['super_admin', 'hr_admin', 'contributor', 'dementor'].includes(currentUser.role) ||
      currentUser.nickname.toLowerCase().includes('dementor')
    : false;

  // Filter urgent announcements requiring sign-off
  const urgentUnacknowledged = announcements.filter(
    (a) => a.priority === 'URGENT' && a.requires_acknowledgement && !a.user_acknowledged && a.status === 'PUBLISHED'
  );

  // Compute category counts
  const categoryCounts = announcements.reduce((acc, a) => {
    if (a.status === 'PUBLISHED') {
      acc[a.category] = (acc[a.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filter announcements for the stream
  const filteredAnnouncements = announcements
    .filter((a) => {
      // Show published posts (or all if admin)
      if (a.status !== 'PUBLISHED' && !isAdminOrContributor) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== 'ALL' && a.priority !== selectedPriority) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesSummary = a.summary.toLowerCase().includes(q);
        const matchesAuthor = a.author?.full_name.toLowerCase().includes(q);
        const matchesTarget = a.target_value?.toLowerCase().includes(q);
        return matchesTitle || matchesSummary || matchesAuthor || matchesTarget;
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned first, then by date descending
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Welcome & Feed Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 8
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Company Announcement Stream
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Official broadcasts, critical policy updates, and team highlights for {currentUser?.department || 'All Departments'}.
          </p>
        </div>

        {isAdminOrContributor && (
          <Link href="/admin/create" className="btn btn-primary" style={{ gap: 8 }}>
            <PlusCircle size={16} />
            <span>Create Announcement</span>
          </Link>
        )}
      </div>

      {/* Urgent Critical Alert Banner */}
      <UrgentAlertBanner urgentAnnouncements={urgentUnacknowledged} />

      {/* Filter and Search Bar */}
      <FeedFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        categoryCounts={categoryCounts}
      />

      {/* Announcement Cards Stream */}
      <div>
        {filteredAnnouncements.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: 48,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}
          >
            <Filter size={36} color="var(--text-muted)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              No announcements match your filter
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400 }}>
              Try adjusting your search terms, clearing category filters, or switching priority levels.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedPriority('ALL');
              }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <AnnouncementCard key={ann.id} announcement={ann} />
          ))
        )}
      </div>
    </div>
  );
}
