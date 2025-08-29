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