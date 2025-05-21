"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  
  // Show loading spinner during initial auth check
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f5f7fa'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#0ea5e9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
  
  // For login page, or when user is not authenticated
  if (isLoginPage || !user) {
    return <>{children}</>;
  }
  
  // Main layout with sidebar and header for authenticated users
  return (
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
  );
} 