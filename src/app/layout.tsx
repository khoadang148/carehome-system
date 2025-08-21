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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareHome - Hệ thống quản lý viện dưỡng lão",
  description: "Giải pháp toàn diện cho hoạt động viện dưỡng lão",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
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
              </ChatProvider>
            </ActivitiesProvider>
          </ResidentsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
