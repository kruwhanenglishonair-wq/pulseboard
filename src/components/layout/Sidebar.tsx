'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  Layers,
  PlusCircle,
  Shield,
  UserCheck,
  Crown,
  LogOut,
  Flame
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isDementor, logout, getAuditLogs } = useAnnouncementStore();

  const auditInfo = getAuditLogs('ann-001');

  const navItems = [
    { label: 'Feed & Updates', href: '/', icon: Home },
    { label: 'Company Calendar', href: '/calendar', icon: Calendar },
    { label: 'Department Hubs', href: '/categories', icon: Layers },
    ...(isDementor
      ? [
          { label: 'User Directory & Passwords', href: '/users', icon: Crown, isSpecial: true },
          { label: 'Create Post', href: '/admin/create', icon: PlusCircle },
          { label: 'Admin & Compliance', href: '/admin', icon: Shield }
        ]
      : [
          { label: 'Create Post', href: '/admin/create', icon: PlusCircle },
          { label: 'Admin & Compliance', href: '/admin', icon: Shield }
        ]),
    { label: 'My Profile & Saved', href: '/profile', icon: UserCheck }
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'none',
        flexDirection: 'column',
        zIndex: 40,
        padding: '20px 16px',
        boxShadow: '2px 0 10px rgba(15, 23, 42, 0.02)'
      }}
      className="desktop-sidebar"
    >
      {/* Brand Header */}
      <div style={{ padding: '0 8px 20px', borderBottom: '1px solid #e2e8f0' }}>
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
              boxShadow: '0 4px 12px var(--brand-glow)',
              color: '#fff'
            }}
          >
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Powerhouse
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Company Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', padding: '0 12px 6px' }}>
          Navigation
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
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1d4ed8' : item.isSpecial ? '#be123c' : '#334155',
                background: isActive
                  ? '#eff6ff'
                  : item.isSpecial
                  ? '#fff1f2'
                  : 'transparent',
                border: isActive
                  ? '1px solid #bfdbfe'
                  : item.isSpecial
                  ? '1px solid #fecdd3'
                  : '1px solid transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon
                size={18}
                color={
                  isActive
                    ? '#2563eb'
                    : item.isSpecial
                    ? '#e11d48'
                    : '#64748b'
                }
              />
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
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', letterSpacing: '0.04em' }}>
              SOC2 Sign-Off
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              {auditInfo.rate}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: '#e2e8f0',
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
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {auditInfo.acknowledged} of {auditInfo.total} confirmed
          </div>
        </div>
      </nav>

      {/* User Footer with Logout */}
      {currentUser && (
        <div
          style={{
            paddingTop: 16,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Image
              src={currentUser.avatar_url}
              alt={currentUser.nickname}
              width={34}
              height={34}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.nickname}
              </div>
              <div style={{ fontSize: 11, color: isDementor ? '#dc2626' : '#64748b', fontWeight: isDementor ? 700 : 500 }}>
                {isDementor ? 'Dementor' : currentUser.department}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{ padding: 6, color: '#94a3b8', borderRadius: 6 }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

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
