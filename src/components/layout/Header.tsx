'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles,
  MapPin,
  WifiOff,
  LogOut,
  LogIn,
  Crown,
  Menu,
  X,
  Home,
  Calendar,
  Layers,
  PlusCircle,
  Shield,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isDementor, logout, isOffline, announcements } = useAnnouncementStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const urgentCount = announcements.filter((a) => a.priority === 'URGENT' && !a.user_acknowledged).length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Feed & Updates', href: '/', icon: Home },
    { label: 'Company Calendar', href: '/calendar', icon: Calendar },
    { label: 'Department Hubs', href: '/categories', icon: Layers },
    { label: 'Create Post', href: '/admin/create', icon: PlusCircle },
    { label: 'Admin & Compliance', href: '/admin', icon: Shield },
    { label: 'My Profile & Saved', href: '/profile', icon: UserCheck },
    ...(isDementor
      ? [{ label: 'User Directory & Passwords', href: '/users', icon: Crown, isSpecial: true }]
      : [])
  ];

  return (
    <>
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
          padding: '0 16px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Left: Brand + Office */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                color: '#fff',
                flexShrink: 0
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  lineHeight: 1.2
                }}
              >
                Powerhouse
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
              <span>Offline</span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Urgent Alert Counter */}
          {urgentCount > 0 && (
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 20,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 700
              }}
              title="Urgent compliance actions pending"
            >
              <span className="pulsating-dot" style={{ width: 7, height: 7 }} />
              <span>{urgentCount} Urgent</span>
            </Link>
          )}

          {/* Desktop Dementor Quick Link */}
          {isDementor && (
            <Link
              href="/users"
              className="btn btn-secondary btn-sm desktop-only"
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
              <span>User Passwords</span>
            </Link>
          )}

          {/* Desktop User Profile Pill & Logout */}
          {currentUser ? (
            <div className="desktop-only" style={{ alignItems: 'center', gap: 10 }}>
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
                <div style={{ textAlign: 'left' }}>
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
                <span style={{ fontSize: 12 }}>Logout</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm desktop-only" style={{ gap: 6 }}>
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile: Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="mobile-hamburger-btn"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 120ms ease'
            }}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: 'fadeIn 200ms ease forwards'
            }}
          />

          {/* Slide-out Sheet */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '85%',
              maxWidth: 340,
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.18)',
              zIndex: 100000,
              overflowY: 'auto'
            }}
          >
            {/* Drawer Top Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'var(--brand-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 3px 8px var(--brand-glow)'
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Powerhouse</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                    Navigation Menu
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User Profile Card in Drawer */}
            {currentUser ? (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Image
                    src={currentUser.avatar_url}
                    alt={currentUser.nickname}
                    width={46}
                    height={46}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.nickname}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={12} color="var(--brand-primary)" />
                      <span>{currentUser.location}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {isDementor ? (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 10 }}>
                          👑 Dementor Super Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 10 }}>
                          {currentUser.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <Link
                  href="/login"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn size={16} />
                  <span>Sign In to Account</span>
                </Link>
              </div>
            )}

            {/* Urgent Notice Banner if active */}
            {urgentCount > 0 && (
              <div style={{ padding: '12px 16px 0' }}>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                    <span className="pulsating-dot" style={{ width: 8, height: 8 }} />
                    <span>{urgentCount} Urgent Notice(s) Pending</span>
                  </div>
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Navigation Menu Links */}
            <div style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', padding: '0 8px 4px' }}>
                Navigation
              </div>

              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: 12,
                      fontSize: 14,
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
                      transition: 'all 120ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Icon
                        size={19}
                        color={
                          isActive
                            ? '#2563eb'
                            : item.isSpecial
                            ? '#e11d48'
                            : '#64748b'
                        }
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={15} color={isActive ? '#2563eb' : '#94a3b8'} />
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer with Logout & Version */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: 8,
                    borderColor: '#fca5a5',
                    color: '#dc2626',
                    background: '#ffffff'
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              )}

              <div style={{ fontSize: 11, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                Powerhouse Portal • Mobile Edition
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-hamburger-btn {
          display: flex !important;
        }
        .desktop-only {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .mobile-hamburger-btn {
            display: none !important;
          }
          .desktop-only {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};
