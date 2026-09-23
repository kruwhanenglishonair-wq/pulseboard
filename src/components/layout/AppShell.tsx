'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { checkAndDispatchScheduledAnnouncements } from '@/lib/notifications';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, announcements, updateAnnouncement } = useAnnouncementStore();
  const [mounted, setMounted] = useState(false);

  // Background Announcement Scheduler & Mobile Notification Dispatcher
  useEffect(() => {
    if (!announcements || announcements.length === 0) return;

    // Check immediately on mount/load
    checkAndDispatchScheduledAnnouncements(announcements, updateAnnouncement);

    // Periodic check every 10 seconds for scheduled publish times
    const interval = setInterval(() => {
      checkAndDispatchScheduledAnnouncements(announcements, updateAnnouncement);
    }, 10000);

    // Check when user returns to app / unlocks mobile screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndDispatchScheduledAnnouncements(announcements, updateAnnouncement);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [announcements, updateAnnouncement]);

  useEffect(() => {
    setMounted(true);
    // If not logged in and not already on /login, redirect to /login
    const persistent =
      localStorage.getItem('powerhouse_auth_user_v1') ||
      localStorage.getItem('pulseboard_auth_user_v3') ||
      localStorage.getItem('pulseboard_auth_user_v2') ||
      sessionStorage.getItem('powerhouse_session_user_v1') ||
      sessionStorage.getItem('pulseboard_session_user_v3') ||
      sessionStorage.getItem('pulseboard_session_user_v2');
    if (!persistent && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, currentUser, router]);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#f8fafc' }}>{children}</div>;
  }

  // If on login page, render clean standalone view without app bars
  if (pathname === '/login') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-wrapper">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
};
