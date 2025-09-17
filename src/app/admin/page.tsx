"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useResidents } from '@/lib/contexts/residents-context';
import { useRouter } from 'next/navigation';
import { RoleDashboard } from '@/components';
import SuccessModal from '@/components/SuccessModal';
import { clientStorage } from '@/lib/utils/clientStorage';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { residents, loading: residentsLoading, initialized, initializeResidents } = useResidents();
  const router = useRouter();
  const [pageReady, setPageReady] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }

      setPageReady(true);
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkLoginSuccess = () => {
      const msg = clientStorage.getItem('login_success');
      if (msg) {
        setSuccessMessage(msg);
        setShowSuccessModal(true);
        clientStorage.removeItem('login_success');
      }
    };

    // Kiểm tra ngay lập tức
    checkLoginSuccess();

    // Lắng nghe sự kiện storage change (khi đăng nhập từ tab khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'login_success' && e.newValue) {
        setSuccessMessage(e.newValue);
        setShowSuccessModal(true);
        clientStorage.removeItem('login_success');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Kiểm tra định kỳ (fallback cho trường hợp storage event không hoạt động)
    const interval = setInterval(checkLoginSuccess, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLoadResidents = () => {
    if (!initialized) {
      initializeResidents();
    }
  };

  if (loading || !pageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải trang quản trị...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={successMessage} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <RoleDashboard />
      </div>
    </>
  );
} 