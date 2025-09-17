import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/ClientLayout";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { ResidentsProvider } from "@/lib/contexts/residents-context";
import { ActivitiesProvider } from "@/lib/contexts/activities-context";
import { ChatProvider } from "@/lib/contexts/chat-provider";
import { NotificationProvider } from "@/lib/contexts/notification-context";
import { SWRProvider } from "@/lib/contexts/swr-provider";
import PreloadData from "@/components/PreloadData";
// ReduxProvider removed after migrating to AuthContext-only

const inter = Inter({ subsets: ["latin"] });

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
        <SWRProvider>
          <AuthProvider>
              <NotificationProvider>
                <ResidentsProvider>
                  <ActivitiesProvider>
                    <ChatProvider>
                      <ClientLayout>
                        {children}
                        <PreloadData />
                      </ClientLayout>
                    </ChatProvider>
                  </ActivitiesProvider>
                </ResidentsProvider>
              </NotificationProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
