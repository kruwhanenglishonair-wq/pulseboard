'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAnnouncementStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If not logged in and not already on /login, redirect to /login
    const persistent = localStorage.getItem('pulseboard_auth_user_v2') || sessionStorage.getItem('pulseboard_session_user_v2');
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
