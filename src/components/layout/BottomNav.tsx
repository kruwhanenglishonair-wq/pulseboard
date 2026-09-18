'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PlusCircle, Layers, User } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const BottomNav = () => {
  const pathname = usePathname();
  const { currentUser } = useAnnouncementStore();

  const isAdminOrContributor = ['super_admin', 'hr_admin', 'contributor'].includes(currentUser.role);

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        padding: '0 8px'
      }}
      className="mobile-bottom-nav"
    >
      <Link
        href="/"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: pathname === '/' ? 'var(--brand-secondary)' : 'var(--text-muted)',
          fontSize: 11,
          fontWeight: pathname === '/' ? 700 : 500
        }}
      >
        <Home size={20} />
        <span>Feed</span>
      </Link>

      <Link
        href="/calendar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: pathname === '/calendar' ? 'var(--brand-secondary)' : 'var(--text-muted)',
          fontSize: 11,
          fontWeight: pathname === '/calendar' ? 700 : 500
        }}
      >
        <Calendar size={20} />
        <span>Calendar</span>
      </Link>

      {isAdminOrContributor && (
        <Link
          href="/admin/create"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--brand-gradient)',
            color: '#fff',
            marginTop: -16,
            boxShadow: '0 4px 16px var(--brand-glow)',
            border: '2px solid var(--bg-surface)'
          }}
          aria-label="Create new announcement"
        >
          <PlusCircle size={24} />
        </Link>
      )}

      <Link
        href="/categories"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: pathname === '/categories' ? 'var(--brand-secondary)' : 'var(--text-muted)',
          fontSize: 11,
          fontWeight: pathname === '/categories' ? 700 : 500
        }}
      >
        <Layers size={20} />
        <span>Hubs</span>
      </Link>

      <Link
        href="/profile"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: pathname === '/profile' ? 'var(--brand-secondary)' : 'var(--text-muted)',
          fontSize: 11,
          fontWeight: pathname === '/profile' ? 700 : 500
        }}
      >
        <User size={20} />
        <span>Profile</span>
      </Link>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};
