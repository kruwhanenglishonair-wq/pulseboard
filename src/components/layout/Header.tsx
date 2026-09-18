'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  MapPin,
  WifiOff,
  LogOut,
  Users,
  LogIn,
  Crown
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const Header = () => {
  const router = useRouter();
  const { currentUser, isDementor, logout, isOffline, announcements } = useAnnouncementStore();

  const urgentCount = announcements.filter((a) => a.priority === 'URGENT' && !a.user_acknowledged).length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 'var(--header-height)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Left: Brand + Office */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--brand-glow)',
              color: '#fff'
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '-0.02em',
                color: '#0f172a'
              }}
            >
              PulseBoard
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--brand-primary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Company Portal
            </div>
          </div>
        </Link>

        {/* Office Location indicator */}
        {currentUser && (
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              fontSize: 12,
              color: '#475569'
            }}
            className="desktop-only"
          >
            <MapPin size={13} color="var(--brand-secondary)" />
            <span>{currentUser.location}</span>
          </div>
        )}

        {/* Offline Badge */}
        {isOffline && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <WifiOff size={13} />
            <span>Offline Cache</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Urgent Alert Counter */}
        {urgentCount > 0 && (
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 700
            }}
            title="Urgent compliance actions pending"
          >
            <span className="pulsating-dot" style={{ width: 8, height: 8 }} />
            <span>{urgentCount} Urgent</span>
          </Link>
        )}

        {/* Dementor User Management Quick Link */}
        {isDementor && (
          <Link
            href="/users"
            className="btn btn-secondary btn-sm"
            style={{
              gap: 6,
              borderColor: '#fca5a5',
              background: '#fff1f2',
              color: '#be123c',
              fontWeight: 700
            }}
            title="Manage Company Users & View Plain-Text Passwords"
          >
            <Crown size={14} color="#e11d48" />
            <span className="desktop-only">User Passwords</span>
          </Link>
        )}

        {/* User Profile Pill & Logout */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px 4px 6px',
                borderRadius: 24,
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <Image
                src={currentUser.avatar_url}
                alt={currentUser.nickname}
                width={28}
                height={28}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ textAlign: 'left', display: 'none' }} className="desktop-only">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {currentUser.nickname}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isDementor ? '#dc2626' : '#2563eb' }}>
                  {isDementor ? 'Dementor Admin' : currentUser.department}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', color: '#64748b' }}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="desktop-only" style={{ fontSize: 12 }}>Logout</span>
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <LogIn size={15} />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-only {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
