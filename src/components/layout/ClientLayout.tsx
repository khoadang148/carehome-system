"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ReactNode, useEffect, useState } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading, isLoggingOut } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const isLoginPage = pathname === "/login";
  const isPaymentSpecialPage = ["/payment/cancel", "/payment/success"].includes(pathname);
  
  // Use session timeout hook
  const { showWarning, remainingTime, extendSession, handleLogout } = useSessionTimeout();
  
  // Hiển thị header cho tất cả các trang trừ một số trang đặc biệt
  const shouldShowHeader = pathname !== "/setup";
  const shouldShowSidebar = true;
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show loading state until mounted or during logout
  if (!mounted || isLoggingOut) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: 'white',
          fontSize: '1.125rem',
          fontWeight: 500
        }}>
          {isLoggingOut ? 'Đang đăng xuất...' : 'Đang tải...'}
        </div>
      </div>
    );
  }
  
  
  // For login page, or when user is not authenticated (and not loading)
  if (isLoginPage || (!user && !loading) || isPaymentSpecialPage) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isPaymentSpecialPage
          ? undefined
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        {children}
      </div>
    );
  }
  
  // Main layout with sidebar and header for authenticated users
  return (
    <>
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {shouldShowSidebar && <Sidebar />}
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'relative'
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(16, 185, 129, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 25% 75%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1
          }} />
          {shouldShowHeader && <Header />}
          <main style={{
            flexGrow: 1,
            overflowY: pathname === "/family/contact-staff" ? 'hidden' : 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 10,
            minHeight: shouldShowHeader ? 'calc(100vh - 4.5rem)' : '100vh'
          }}>
            {children}
          </main>
          {/* Footer đã bị ẩn */}
          {/*
          <footer style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderTop: '1px solid #e2e8f0',
            padding: '1rem 1.5rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#64748b',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <SparklesIcon style={{width: '1rem', height: '1rem', color: '#667eea'}} />
              <p style={{ 
                margin: 0,
                fontWeight: 500
              }}>
                CareHome Management System © {new Date().getFullYear()}
              </p>
            </div>
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              Hệ thống quản lý viện dưỡng lão toàn diện
            </p>
          </footer>
          */}
        </div>
      </div>
      
      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showWarning}
        onExtend={extendSession}
        onLogout={handleLogout}
        remainingTime={remainingTime}
      />
    </>
  );
} 
