"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import StaffDashboardWidgets from '@/components/staff/StaffDashboardWidgets';
import FamilyDashboardWidgets from '@/components/family/FamilyDashboardWidgets';
import { useRouter } from 'next/navigation';
import { 
  UsersIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  CubeIcon,
  ShieldCheckIcon,
  HomeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  UserPlusIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

interface DashboardCard {
  title: string;
  description: string;
  icon: any;
  href: string;
  gradient: string;
  stats?: string;
}

const ROLE_DASHBOARDS = {
  admin: {
    title: 'Trung tâm Điều hành',
    description: 'Hệ thống quản lý toàn diện viện dưỡng lão',
    cards: [
     
      {
        title: 'Phê duyệt hoạt động',
        description: 'Phê duyệt yêu cầu thăm và đăng kí dịch vụ',
        icon: ClipboardDocumentCheckIcon,
        href: '/admin/activity-approvals',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        stats: '5 yêu cầu chờ'
      },
      {
        title: 'Quản lý phòng/giường',
        description: 'Quản lý phòng/giường',
        icon: BuildingOfficeIcon,
        href: '/admin/room-management',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        stats: '24 phòng'
      },
      {
        title: 'Quản lý kho',
        description: 'Quản lý thiết bị y tế, thuốc, dụng cụ',
        icon: ArchiveBoxIcon,
        href: '/inventory',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        stats: '150 sản phẩm'
      }
    ]
  },
  staff: {
    title: 'Hệ thống Quản lý Chăm sóc',
    description: ' Công cụ điều hành cho đội ngũ y tế!',
    cards: [
      {
        title: 'Nhiệm vụ',
        description: 'Thực hiện và báo cáo nhiệm vụ',
        icon: ClipboardDocumentListIcon,
        href: '/staff/tasks',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        stats: '5 nhiệm vụ hôm nay'
      },
      {
        title: 'Chỉ số sức khỏe',
        description: 'Theo dõi và ghi nhận chỉ số sức khỏe',
        icon: HeartIcon,
        href: '/staff/vital-signs',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        stats: '8 ghi nhận hôm nay'
      },
      {
        title: 'Hỗ trợ',
        description: 'Kiểm kê kho',
        icon: CubeIcon,
        href: '/staff/administrative',
        gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        stats: '2 báo cáo chờ'
      }
    ]
  },
  family: {
    title: 'Cổng thông tin Gia đình',
    description: 'Theo dõi và kết nối với người thân',
    cards: [
      {
        title: 'Thông tin người thân',
        description: 'Xem tình trạng sức khỏe và sinh hoạt',
        icon: HeartIcon,
        href: '/family',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        stats: 'Cập nhật hôm nay'
      },
      {
        title: 'Dấu hiệu sinh tồn',
        description: 'Theo dõi chỉ số sức khỏe người thân',
        icon: HeartIcon,
        href: '/family/vital-signs',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        stats: 'Ghi nhận mới nhất'
      },
      {
        title: 'Thông tin thuốc',
        description: 'Lịch uống thuốc và tình trạng sử dụng',
        icon: CubeIcon,
        href: '/family/medication',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        stats: '3 loại thuốc'
      },
      {
        title: 'Chương trình sinh hoạt',
        description: 'Các hoạt động người thân tham gia',
        icon: ClipboardDocumentListIcon,
        href: '/family/activities',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        stats: '3 chương trình tuần này'
      },
      {
        title: 'Dịch vụ chăm sóc',
        description: 'Các dịch vụ đang sử dụng',
        icon: UsersIcon,
        href: '/services',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        stats: '5 dịch vụ'
      },
      {
        title: 'Hóa đơn và thanh toán',
        description: 'Xem chi phí và thanh toán',
        icon: CurrencyDollarIcon,
        href: '/finance',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        stats: 'Tháng 1/2024'
      },
      {
        title: 'Liên hệ đội ngũ',
        description: 'Trao đổi với đội ngũ chăm sóc',
        icon: UserGroupIcon,
        href: '/family/contact',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        stats: '2 tin nhắn mới'
      },
      {
        title: 'Đặt lịch thăm',
        description: 'Đăng ký lịch thăm người thân',
        icon: HomeIcon,
        href: '/family/visits',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        stats: 'Lịch tuần sau'
      }
    ]
  }
};

export default function RoleDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const dashboard = ROLE_DASHBOARDS[user.role as keyof typeof ROLE_DASHBOARDS];

  if (!dashboard) {
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
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
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
            {dashboard.title}
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            margin: 0,
            fontWeight: 500
          }}>
            {dashboard.description}
          </p>
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            borderRadius: '0.75rem',
            display: 'inline-block'
          }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>
              Xin chào, {user.name}
            </span>
            {getRoleLabel(user.role || '') && (
              <span style={{ 
                marginLeft: '0.75rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: getRoleColor(user.role || ''),
                color: 'white',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {getRoleLabel(user.role || '')}
              </span>
            )}
          </div>
        </div>

        {/* Staff Widgets - Moved to top */}
        {/* {user.role === 'staff' && (
          <StaffDashboardWidgets />
        )} */}

        {/* Family Widgets */}
        {user.role === 'family' && (
          <FamilyDashboardWidgets />
        )}

        {/* Dashboard Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {dashboard.cards.map((card, index) => (
            <div
              key={index}
              onClick={() => router.push(card.href)}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.25rem',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '4rem',
                height: '4rem',
                background: card.gradient,
                borderRadius: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)'
              }}>
                <card.icon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>

              {/* Content */}
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: '0 0 0.5rem 0',
                color: '#1e293b'
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0 0 1rem 0',
                lineHeight: '1.5'
              }}>
                {card.description}
              </p>

              {/* Stats */}
              {card.stats && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '0.75rem',
                  display: 'inline-block'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#475569'
                  }}>
                    {card.stats}
                  </span>
                </div>
              )}

              {/* Decorative gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: card.gradient,
                opacity: 0.1,
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
            </div>
          ))}
        </div>

       


      </div>
    </div>
  );
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return '#ef4444';
    case 'staff':
      return '#3b82f6';
    case 'family':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return '';
    case 'staff':
      return '';
    case 'family':
      return 'Gia đình';
    default:
      return 'Người dùng';
  }
}
