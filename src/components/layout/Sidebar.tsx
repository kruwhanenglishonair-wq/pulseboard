'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Layers,
  PlusCircle,
  Shield,
  UserCheck,
  Bookmark,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const Sidebar = () => {
  const pathname = usePathname();
  const { currentUser, announcements, getAuditLogs } = useAnnouncementStore();

  const isAdminOrContributor = ['super_admin', 'hr_admin', 'contributor'].includes(currentUser.role);
  const auditInfo = getAuditLogs('ann-001');

  const navItems = [
    { label: 'Feed & Updates', href: '/', icon: Home },
    { label: 'Company Calendar', href: '/calendar', icon: Calendar },
    { label: 'Department Hubs', href: '/categories', icon: Layers },
    ...(isAdminOrContributor
      ? [
          { label: 'Create Post', href: '/admin/create', icon: PlusCircle, highlight: true },
          { label: 'Admin & Compliance', href: '/admin', icon: Shield }
        ]
      : []),
    { label: 'My Profile & Saved', href: '/profile', icon: UserCheck }
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'none',
        flexDirection: 'column',
        zIndex: 40,
        padding: '24px 16px'
      }}
      className="desktop-sidebar"
    >
      {/* Brand Header */}
      <div style={{ padding: '0 8px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px var(--brand-glow)'
            }}
          >
            <Flame size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              PulseBoard
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Internal Enterprise OS
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '0 12px 6px' }}>
          Menu
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive
                  ? item.highlight
                    ? 'var(--brand-gradient)'
                    : 'var(--bg-surface-elevated)'
                  : 'transparent',
                border: isActive && !item.highlight ? '1px solid var(--border-active)' : '1px solid transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={18} color={isActive ? (item.highlight ? '#fff' : 'var(--brand-secondary)') : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Compliance Widget */}
        <div
          style={{
            marginTop: 'auto',
            marginBottom: 16,
            padding: 14,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--urgent-base)', letterSpacing: '0.04em' }}>
              SOC2 Sign-Off
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {auditInfo.rate}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 8
            }}
          >
            <div
              style={{
                width: `${auditInfo.rate}%`,
                height: '100%',
                background: 'var(--brand-gradient)',
                transition: 'width 400ms ease'
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {auditInfo.acknowledged} of {auditInfo.total} team members confirmed
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div
        style={{
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <Image
          src={currentUser.avatar_url}
          alt={currentUser.full_name}
          width={36}
          height={36}
          style={{
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser.full_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {currentUser.department}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
};
