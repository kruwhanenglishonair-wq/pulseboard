import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AnnouncementStoreProvider } from '@/lib/store/announcementStore';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { PwaPrompt } from '@/components/ui/PwaPrompt';

export const metadata: Metadata = {
  title: 'PulseBoard | Company Announcements & Compliance Hub',
  description: 'Internal communications, mandatory policy sign-offs, and company event calendar.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
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
  themeColor: '#ffffff',
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
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <AnnouncementStoreProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <PwaPrompt />
          </ToastProvider>
        </AnnouncementStoreProvider>
      </body>
    </html>
  );
}
