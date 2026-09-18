'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { PostEditorForm } from '@/components/admin/PostEditorForm';

export default function CreatePostPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top back link */}
      <div>
        <Link href="/admin" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <ArrowLeft size={15} />
          <span>Back to Console</span>
        </Link>
      </div>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Create & Broadcast Announcement
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Compose company-wide updates, configure mandatory compliance sign-offs, and dispatch instant Slack notifications.
        </p>
      </div>

      <PostEditorForm />
    </div>
  );
}
