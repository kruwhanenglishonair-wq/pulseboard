'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PlusCircle, Layers, User, Crown } from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const BottomNav = () => {
  const pathname = usePathname();
  const { isDementor, unreadCount } = useAnnouncementStore();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        padding: '0 8px',
        boxShadow: '0 -2px 10px rgba(15, 23, 42, 0.04)'
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
          color: pathname === '/' ? '#2563eb' : '#64748b',
          fontSize: 11,
          fontWeight: pathname === '/' ? 700 : 500
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Home size={19} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -5,
                right: -9,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
                border: '1.5px solid #ffffff',
                lineHeight: 1
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span>Feed</span>
      </Link>

      <Link
        href="/calendar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: pathname === '/calendar' ? '#2563eb' : '#64748b',
          fontSize: 11,
          fontWeight: pathname === '/calendar' ? 700 : 500
        }}
      >
        <Calendar size={19} />
        <span>Calendar</span>
      </Link>

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
          boxShadow: '0 4px 14px var(--brand-glow)',
          border: '3px solid #ffffff'
        }}
        aria-label="Create new announcement"
      >
        <PlusCircle size={24} />
      </Link>

      {isDementor ? (
        <Link
          href="/users"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: pathname === '/users' ? '#e11d48' : '#be123c',
            fontSize: 11,
            fontWeight: pathname === '/users' ? 800 : 600
          }}
        >
          <Crown size={19} color={pathname === '/users' ? '#e11d48' : '#be123c'} />
          <span>Users</span>
        </Link>
      ) : (
        <Link
          href="/categories"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: pathname === '/categories' ? '#2563eb' : '#64748b',
            fontSize: 11,
            fontWeight: pathname === '/categories' ? 700 : 500
          }}
        >
          <Layers size={19} />
          <span>Hubs</span>
        </Link>
      )}

      <Link
        href="/profile"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: pathname === '/profile' ? '#2563eb' : '#64748b',
          fontSize: 11,
          fontWeight: pathname === '/profile' ? 700 : 500
        }}
      >
        <User size={19} />
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
