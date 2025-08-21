"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientStorage } from '@/lib/utils/clientStorage';
import AccountSuccessModal from '@/components/AccountSuccessModal';

interface AccountInfo {
  username: string;
  password: string;
  email: string;
  role: string;
  residentName: string;
  existingAccount?: boolean;
  familyName?: string;
  familyUsername?: string;
}

export default function ResidentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Lấy thông tin từ URL params
    const residentName = searchParams.get('residentName');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const existingAccount = searchParams.get('existingAccount');
    const familyName = searchParams.get('familyName');
    const familyUsername = searchParams.get('familyUsername');

    if (residentName) {
      if (existingAccount === 'true' && familyName && familyUsername) {
        // Trường hợp gán vào tài khoản hiện có
        setAccountInfo({
          residentName,
          username: familyUsername,
          password: '',
          email: '',
          role: 'family',
          existingAccount: true,
          familyName,
          familyUsername,
        });
        setShowModal(true);
      } else if (username && password && email && role) {
        // Trường hợp tạo tài khoản mới
        setAccountInfo({ residentName, username, password, email, role });
        setShowModal(true);
      } else {
        // Nếu không có param
        const storedInfo = clientStorage.getItem('newResidentAccount');
        if (storedInfo) {
          setAccountInfo(JSON.parse(storedInfo));
          setShowModal(true);
          clientStorage.removeItem('newResidentAccount');
        } else {
          // Nếu không có thông tin, chuyển về trang residents
          router.push('/staff/residents/view');
        }
      }
    } else {
      // Nếu không có thông tin, chuyển về trang residents
      router.push('/staff/residents/view');
    }
  }, [searchParams, router]);

  if (!accountInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p>Đang tải thông tin...</p>
        </div>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <AccountSuccessModal
        open={showModal && !!accountInfo}
        onClose={() => router.push('/staff/residents/view')}
        accountInfo={accountInfo as AccountInfo}
        offsetX={80}
        offsetY={50}
      />
    </div>
  );
} 