"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  
  // Hiển thị header cho tất cả các trang trừ một số trang đặc biệt
  const shouldShowHeader = pathname !== "/setup";
  const shouldShowSidebar = true;
  
  // Enhanced loading spinner with beautiful design
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'rotate 20s linear infinite'
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            border: '2px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <SparklesIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
          </div>
          
          {/* App name */}
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            CareHome
          </h1>
          
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.8)',
            margin: '0 0 2rem 0',
            fontWeight: 500
          }}>
            Đang tải hệ thống...
          </p>
          
          {/* Spinner */}
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
        
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes rotate {
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
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        {children}
      </div>
    );
  }
  
  // Main layout with sidebar and header for authenticated users
  return (
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
            Phiên bản 1.0.0 - Chăm sóc tận tâm, quản lý thông minh
          </p>
        </footer>
        */}
      </div>
    </div>
  );
} 
