import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { ResidentsProvider } from "@/lib/contexts/residents-context";
import { ActivitiesProvider } from "@/lib/contexts/activities-context";
import { ChatProvider } from "@/lib/contexts/chat-provider";
import { ToastProvider } from "@/components/ToastProvider";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import { Suspense, lazy } from 'react';

const inter = Inter({ subsets: ["latin"] });

  
const PerformanceMonitor = lazy(() => import('@/components/PerformanceMonitor'));

export const metadata: Metadata = {
  title: "CareHome - Hệ thống quản lý viện dưỡng lão",
  description: "Giải pháp toàn diện cho hoạt động viện dưỡng lão",
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.svg',
    apple: '/apple-touch-icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={inter.className}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ResidentsProvider>
            <ActivitiesProvider>
              <ChatProvider>
                <ClientLayout>{children}</ClientLayout>
                <ToastProvider />
                <ChatFloatingButton />
                <Suspense fallback={null}>
                  <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
                </Suspense>
              </ChatProvider>
            </ActivitiesProvider>
          </ResidentsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
