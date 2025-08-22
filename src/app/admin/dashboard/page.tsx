"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import PaymentManagement from '@/components/admin/PaymentManagement';
import ResidentStaffList from '@/components/admin/ResidentStaffList';
import { 
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Back Button */}
        <div style={{
          position: 'absolute',
          top: '10rem',
          left: '5rem',
          zIndex: 10
        }}>
          <Link
            href="/admin"
            title="Quay lại"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <ArrowLeftIcon style={{ 
              width: '1.5rem', 
              height: '1.5rem', 
              color: '#64748b',
              transition: 'all 0.3s ease'
            }} />
          </Link>
        </div>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          marginTop: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)'
            }}>
              <ChartBarIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
          </div>
          
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2,
            wordWrap: 'break-word',
            textAlign: 'center'
          }}>
            Bảng điều khiển quản lý
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            margin: '0 0 1rem 0',
            fontWeight: 500
          }}>
            Quản lý viện dưỡng lão - Thanh toán & Nhân sự
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#475569'
            }}>
              <UsersIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Quản lý cư dân</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#475569'
            }}>
              <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Quản lý nhân viên</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#475569'
            }}>
              <CurrencyDollarIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Quản lý tài chính</span>
            </div>
          </div>
        </div>

        {/* Payment Management */}
        <div style={{ marginBottom: '2rem' }}>
         
          <PaymentManagement />
        </div>

        {/* Resident & Staff List */}
        <div style={{ marginBottom: '2rem' }}>
          
          <ResidentStaffList />
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.25rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 1.5rem 0',
            color: '#1e293b'
          }}>
            Thao tác nhanh
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => router.push('/admin/staff-assignments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '1rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <UserGroupIcon style={{ width: '2rem', height: '2rem' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                  Quản lý phân công
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Phân công nhân viên chăm sóc
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/room-management')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '1rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <CalendarDaysIcon style={{ width: '2rem', height: '2rem' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                  Quản lý phòng & giường
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Phân bổ phòng cho cư dân
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/vital-signs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '1rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <ClockIcon style={{ width: '2rem', height: '2rem' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                  Chỉ số sức khỏe
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Theo dõi sức khỏe cư dân
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
