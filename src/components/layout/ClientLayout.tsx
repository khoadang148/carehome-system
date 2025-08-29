"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ReactNode, useEffect, useState, useMemo, memo } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";

interface ClientLayoutProps {
  children: ReactNode;
}

const BackgroundPattern = memo(() => (
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
));

BackgroundPattern.displayName = 'BackgroundPattern';

const LoadingComponent = memo(({ isLoggingOut }: { isLoggingOut: boolean }) => (
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
));

LoadingComponent.displayName = 'LoadingComponent';

function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading, isLoggingOut } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const { showWarning, remainingTime, extendSession, handleLogout } = useSessionTimeout();
  
  const layoutConfig = useMemo(() => {
    const isLoginPage = pathname === "/login";
    const isPaymentSpecialPage = ["/payment/cancel", "/payment/success"].includes(pathname);
    const shouldShowHeader = pathname !== "/setup";
    const shouldShowSidebar = true;
    
    return {
      isLoginPage,
      isPaymentSpecialPage,
      shouldShowHeader,
      shouldShowSidebar
    };
  }, [pathname]);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || isLoggingOut) {
    return <LoadingComponent isLoggingOut={isLoggingOut} />;
  }
  
  if (layoutConfig.isLoginPage || (!user && !loading) || layoutConfig.isPaymentSpecialPage) {
    return (
      <div style={{
        minHeight: '100vh',
        background: layoutConfig.isPaymentSpecialPage
          ? undefined
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        {children}
      </div>
    );
  }
    
  return (
    <>
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {layoutConfig.shouldShowSidebar && <Sidebar />}
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'relative'
        }}>
          <BackgroundPattern />
          {layoutConfig.shouldShowHeader && <Header />}
          <main style={{
            flexGrow: 1,
            overflowY: pathname === "/family/contact-staff" ? 'hidden' : 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 10,
            minHeight: layoutConfig.shouldShowHeader ? 'calc(100vh - 4.5rem)' : '100vh'
          }}>
            {children}
          </main>
        </div>
      </div>
      
      <SessionTimeoutModal
        isOpen={showWarning}
        onExtend={extendSession}
        onLogout={handleLogout}
        remainingTime={remainingTime}
      />
    </>
  );
}

export default memo(ClientLayout); 
