'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { PostEditorForm } from '@/components/admin/PostEditorForm';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { announcements } = useAnnouncementStore();

  const announcement = announcements.find((a) => a.id === resolvedParams.id);

  if (!announcement) {
    return (
      <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Announcement Not Found</h2>
        <Link href="/admin" className="btn btn-primary">
          Back to Console
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Link href="/admin" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <ArrowLeft size={15} />
          <span>Back to Console</span>
        </Link>
      </div>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Edit Announcement
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Update publication details, audience targeting, or compliance settings.
        </p>
      </div>

      <PostEditorForm initialData={announcement} isEditing={true} />
    </div>
  );
}
