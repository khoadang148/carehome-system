'use client';

import React, { memo, Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import SessionTimeoutModal from '@/components/SessionTimeoutModal';
import TransitionLoading from '@/components/TransitionLoading';
import { NotificationProvider } from '@/lib/contexts/notification-context';
import { ResidentsProvider } from '@/lib/contexts/residents-context';
import { ToastProvider } from '@/components/ToastProvider';

// Dynamic imports for performance
const PerformanceMonitor = memo(() => {
  const DynamicComponent = React.lazy(() => import('@/components/PerformanceMonitor'));
  return (
    <Suspense fallback={null}>
      <DynamicComponent />
    </Suspense>
  );
});

const ChatFloatingButton = memo(() => {
  const DynamicComponent = React.lazy(() => import('@/components/ChatFloatingButton').then(module => ({ default: module.default || module })));
  return (
    <Suspense fallback={null}>
      <DynamicComponent />
    </Suspense>
  );
});

const PreloadData = memo(() => {
  const DynamicComponent = React.lazy(() => import('@/components/PreloadData').then(module => ({ default: module.default || module })));
  return (
    <Suspense fallback={null}>
      <DynamicComponent />
    </Suspense>
  );
});

const LoadingComponent = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Đang tải...</p>
    </div>
  </div>
));

function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isProtectedRoute = pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password';
  const isPaymentRoute = pathname.startsWith('/payment');
  const shouldShowLoading = loading || (isProtectedRoute && !user);

  useEffect(() => {
    if (!loading && !user && isProtectedRoute) {
      router.replace('/login');
    }
  }, [user, loading, isProtectedRoute, router]);

  if (shouldShowLoading) {
    return <LoadingComponent />;
  }

  if (!isProtectedRoute || isPaymentRoute) {
    return (
      <NotificationProvider>
        <ResidentsProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
            <main className="flex-1 relative z-10">
              {children}
            </main>
            <PerformanceMonitor />
            <ToastProvider />
            <ChatFloatingButton />
          </div>
        </ResidentsProvider>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <ResidentsProvider>
        <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex overflow-hidden relative">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 relative z-10">
            <Header />
            <main className="flex-1 overflow-auto relative">
              <TransitionLoading />
              {children}
            </main>
          </div>
          <SessionTimeoutModal 
            isOpen={false}
            onExtend={() => {}}
            onLogout={() => {}}
            remainingTime={0}
          />
          <PerformanceMonitor />
          <ToastProvider />
          <ChatFloatingButton />
          <PreloadData />
        </div>
      </ResidentsProvider>
    </NotificationProvider>
  );
}

export default memo(ClientLayout);
