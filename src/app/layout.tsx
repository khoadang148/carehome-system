import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "CareHome - Nursing Home Management System",
  description: "Comprehensive solution for nursing home operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, "Segoe UI", "Geist", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: '#f5f7fa',
          height: '100%'
        }}
      >
        <div style={{ 
          display: 'flex', 
          height: '100vh', 
          overflow: 'hidden'
        }}>
          <Sidebar />
          <div style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Header />
            <main style={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: '#f5f7fa'
            }}>
              {children}
            </main>
            <footer style={{
              backgroundColor: 'white',
              borderTop: '1px solid #e5e7eb',
              padding: '0.75rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <p style={{ margin: 0 }}>CareHome Management System © {new Date().getFullYear()}</p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
