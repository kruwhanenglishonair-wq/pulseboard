'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  HeartHandshake,
  Video,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Wifi,
  FileCode,
  Coffee
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export default function CategoryHubsPage() {
  const { announcements } = useAnnouncementStore();

  const hubs = [
    {
      id: 'HR',
      title: 'People & HR Hub',
      description: 'Official employment policies, benefits enrollment, holiday calendars, and onboarding guides.',
      icon: HeartHandshake,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      resources: [
        { title: 'Global Employee Handbook 2026', link: '#' },
        { title: 'Health Insurance & Wellness Benefits', link: '#' },
        { title: 'Parental & Sabbatical Leave Policy', link: '#' }
      ]
    },
    {
      id: 'IT_SECURITY',
      title: 'IT & Security Operations',
      description: 'SOC2 protocols, identity verification, 2FA hardware guides, and device provisioning.',
      icon: ShieldCheck,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      resources: [
        { title: '2FA & 1Password Setup Guide', link: '#' },
        { title: 'Global Wireguard VPN Credentials', link: '#' },
        { title: 'Report Security Incident / Phishing', link: '#' }
      ]
    },
    {
      id: 'TOWN_HALL',
      title: 'Town Hall & Leadership',
      description: 'Quarterly executive addresses, company milestones, financial earnings, and open AMAs.',
      icon: Video,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      resources: [
        { title: 'Q3 2026 Executive Presentation Deck', link: '#' },
        { title: 'Slido AMA Anonymous Submission Portal', link: '#' },
        { title: 'Town Hall Recording Archive', link: '#' }
      ]
    },
    {
      id: 'EVENTS',
      title: 'Events & Culture Hub',
      description: 'Tech talks, hackathons, lunch & learns, office social gatherings, and sports clubs.',
      icon: Sparkles,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      resources: [
        { title: 'Friday Pizza & Tech Talk Schedule', link: '#' },
        { title: 'Bangkok HQ Badminton Club Sign-up', link: '#' },
        { title: 'Annual Hackathon Registration', link: '#' }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Department & Category Hubs
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Direct access to specialized department guidelines, verified documentation, and category feeds.
        </p>
      </div>

      {/* Hubs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {hubs.map((hub) => {
          const Icon = hub.icon;
          const postCount = announcements.filter((a) => a.category === hub.id && a.status === 'PUBLISHED').length;

          return (
            <div
              key={hub.id}
              className="glass-panel-elevated"
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: hub.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={24} color={hub.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 12,
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {postCount} {postCount === 1 ? 'Notice' : 'Notices'}
                  </span>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {hub.title}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                  {hub.description}
                </p>

                {/* Useful links & resources */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    Quick Resources
                  </div>
                  {hub.resources.map((res, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <BookOpen size={12} color="var(--brand-secondary)" />
                      <span>{res.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed Link CTA */}
              <Link
                href={`/?category=${hub.id}`}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', fontSize: 13 }}
              >
                <span>View All {hub.title.split(' ')[0]} Updates</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
