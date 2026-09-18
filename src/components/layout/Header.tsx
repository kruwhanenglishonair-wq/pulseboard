'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bell,
  WifiOff,
  Sparkles,
  MapPin,
  ChevronDown,
  Sun,
  Moon,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';

export const Header = () => {
  const { currentUser, switchUser, allProfiles, isOffline, announcements } = useAnnouncementStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isLight, setIsLight] = useState(false);

  const urgentCount = announcements.filter((a) => a.priority === 'URGENT' && !a.user_acknowledged).length;

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.setAttribute('data-theme', next ? 'light' : 'dark');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'hr_admin': return 'HR Admin';
      case 'contributor': return 'Contributor';
      default: return 'Employee';
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 'var(--header-height)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        transition: 'background var(--transition-smooth)'
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
              boxShadow: '0 4px 12px var(--brand-glow)'
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 40%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PulseBoard
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Company Hub
            </div>
          </div>
        </Link>

        {/* Office Location indicator */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-secondary)'
          }}
          className="desktop-only"
        >
          <MapPin size={13} color="var(--brand-secondary)" />
          <span>{currentUser.location}</span>
        </div>

        {/* Offline Badge */}
        {isOffline && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <WifiOff size={13} />
            <span>Offline Shell</span>
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
              background: 'var(--urgent-bg)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: 12,
              fontWeight: 700
            }}
            title="Urgent compliance actions pending"
          >
            <span className="pulsating-dot" style={{ width: 8, height: 8 }} />
            <span>{urgentCount} Urgent</span>
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle theme"
        >
          {isLight ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Role Switcher & User Profile Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px 4px 6px',
              borderRadius: 24,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              transition: 'border-color var(--transition-fast)'
            }}
            title="Switch demo persona/role"
          >
            <Image
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              width={28}
              height={28}
              style={{
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
            <div style={{ textAlign: 'left', display: 'none' }} className="desktop-only">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {currentUser.full_name.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-secondary)' }}>
                {getRoleLabel(currentUser.role)}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* Role switcher dropdown */}
          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                width: 280,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-lg)',
                padding: '10px 8px',
                zIndex: 100,
                animation: 'fadeIn 150ms ease'
              }}
            >
              <div
                style={{
                  padding: '6px 12px 10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 6
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Demo Persona & Role Switcher
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Switch to preview permissions & audit sign-offs
                </div>
              </div>

              {allProfiles.map((p) => {
                const isActive = p.id === currentUser.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchUser(p.id);
                      setShowRoleMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                      border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                      textAlign: 'left',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    <Image
                      src={p.avatar_url}
                      alt={p.full_name}
                      width={32}
                      height={32}
                      style={{
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.full_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {getRoleLabel(p.role)} • {p.department}
                      </div>
                    </div>
                    {isActive && <ShieldCheck size={16} color="var(--brand-secondary)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
