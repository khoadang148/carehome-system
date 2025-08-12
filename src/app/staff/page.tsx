"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useResidents } from '@/lib/contexts/residents-context';
import { useRouter } from 'next/navigation';
import { RoleDashboard } from '@/components';
import SuccessModal from '@/components/SuccessModal';
import { clientStorage } from '@/lib/utils/clientStorage';

export default function StaffPage() {
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
      
      if (user.role !== 'staff') {
        router.push('/');
        return;
      }

      // Tối ưu: Không tự động initialize residents khi page mount
      // Chỉ load data khi user thực sự cần
      setPageReady(true);
    }
  }, [user, loading, router]);

  // Tối ưu: Load success message với delay nhỏ
  useEffect(() => {
    const msg = clientStorage.getItem('login_success');
    if (msg) {
      const timer = setTimeout(() => {
        setSuccessMessage(msg);
        setShowSuccessModal(true);
        clientStorage.removeItem('login_success');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Tối ưu: Lazy load residents chỉ khi cần thiết
  const handleLoadResidents = () => {
    if (!initialized) {
      initializeResidents();
    }
  };

  if (loading || !pageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải trang nhân viên...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={successMessage} />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <RoleDashboard />
      </div>
    </>
  );
} 
