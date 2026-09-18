import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AnnouncementStoreProvider } from '@/lib/store/announcementStore';
import { ToastProvider } from '@/components/ui/Toast';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PwaPrompt } from '@/components/ui/PwaPrompt';

export const metadata: Metadata = {
  title: 'PulseBoard | Company Announcements & Compliance Hub',
  description: 'Streamlined internal communications, mandatory policy sign-offs, and company event calendar.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PulseBoard'
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-192.png' }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: '#080c14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <AnnouncementStoreProvider>
          <ToastProvider>
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Header />
                <main className="page-wrapper">{children}</main>
                <BottomNav />
              </div>
            </div>
            <PwaPrompt />
          </ToastProvider>
        </AnnouncementStoreProvider>
      </body>
    </html>
  );
}
