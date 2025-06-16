"use client";

import { useState, useMemo, useEffect } from 'react';
import { 
  BellIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  HeartIcon,
  CogIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: 'Thuốc cần cho phòng 204',
    message: 'Cần cung cấp thuốc huyết áp cho bệnh nhân Nguyễn Văn A. Thuốc cần được uống vào lúc 2:00 PM hôm nay.',
    time: '2023-05-15T10:30:00',
    isRead: false,
    type: 'medication',
    priority: 'cao',
    category: 'Chăm sóc y tế',
    roles: ['staff', 'admin']
  },
  {
    id: 2,
    title: 'Họp nhân viên lúc 3:00 PM',
    message: 'Cuộc họp tuần về kế hoạch chăm sóc bệnh nhân. Địa điểm: Phòng họp tầng 2.',
    time: '2023-05-15T09:30:00',
    isRead: false,
    type: 'meeting',
    priority: 'trung bình',
    category: 'Cuộc họp',
    roles: ['staff', 'admin']
  },
  {
    id: 3,
    title: 'Báo cáo hàng ngày đã sẵn sàng',
    message: 'Báo cáo hoạt động ngày 15/05/2023 đã được tạo và có thể xem trong mục báo cáo.',
    time: '2023-05-15T08:00:00',
    isRead: true,
    type: 'report',
    priority: 'low',
    category: 'Báo cáo',
    roles: ['admin']
  },
  {
    id: 4,
    title: 'Kiểm tra sức khỏe định kỳ',
    message: 'Lịch kiểm tra sức khỏe định kỳ cho bệnh nhân tại phòng 305 vào ngày mai.',
    time: '2023-05-14T16:45:00',
    isRead: true,
    type: 'health',
    priority: 'medium',
    category: 'Chăm sóc y tế',
    roles: ['staff', 'admin']
  },
  {
    id: 5,
    title: 'Cập nhật hệ thống',
    message: 'Hệ thống sẽ được bảo trì từ 11:00 PM đến 1:00 AM ngày mai.',
    time: '2023-05-14T14:20:00',
    isRead: false,
    type: 'system',
    priority: 'high',
    category: 'Hệ thống',
    roles: ['admin']
  },
  {
    id: 6,
    title: 'Hoạt động giải trí buổi chiều',
    message: 'Hoạt động ca hát và đọc sách cho các cư dân vào lúc 4:00 PM tại phòng sinh hoạt.',
    time: '2023-05-14T13:15:00',
    isRead: true,
    type: 'activity',
    priority: 'low',
    category: 'Hoạt động',
    roles: ['staff', 'family']
  },
  {
    id: 7,
    title: 'Đơn thuốc mới',
    message: 'Bác sĩ đã kê đơn thuốc mới cho bệnh nhân Trần Thị B tại phòng 102.',
    time: '2023-05-14T11:30:00',
    isRead: false,
    type: 'medication',
    priority: 'high',
    category: 'Chăm sóc y tế',
    roles: ['staff', 'admin']
  },
  {
    id: 8,
    title: 'Thanh toán hóa đơn',
    message: 'Hóa đơn tháng 5 cho các dịch vụ đã được gửi đến gia đình.',
    time: '2023-05-14T09:00:00',
    isRead: true,
    type: 'finance',
    priority: 'medium',
    category: 'Tài chính',
    roles: ['family', 'admin']
  }
];

// Lấy notifications từ localStorage nếu có, nếu không thì dùng mockNotifications
const getInitialNotifications = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('notifications');
    if (saved) return JSON.parse(saved);
  }
  return mockNotifications;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(getInitialNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showReadFilter, setShowReadFilter] = useState('all');

  // Lưu notifications vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Theme configurations for different roles
  const getThemeConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          primary: '#3b82f6',
          primaryDark: '#1d4ed8',
          secondary: '#1e40af',
          accent: '#6366f1',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          cardBg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          shadow: 'rgba(59, 130, 246, 0.3)',
          icon: CogIcon,
          title: 'Bảng điều khiển thông báo',
          subtitle: 'Quản lý và theo dõi tất cả thông báo hệ thống'
        };
      case 'staff':
        return {
          primary: '#10b981',
          primaryDark: '#059669',
          secondary: '#065f46',
          accent: '#34d399',
          background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
          cardBg: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
          shadow: 'rgba(16, 185, 129, 0.3)',
          icon: UserGroupIcon,
          title: 'Thông báo công việc',
          subtitle: 'Cập nhật về chăm sóc bệnh nhân và lịch làm việc'
        };
      case 'family':
        return {
          primary: '#8b5cf6',
          primaryDark: '#7c3aed',
          secondary: '#6d28d9',
          accent: '#a78bfa',
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
          cardBg: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
          shadow: 'rgba(139, 92, 246, 0.3)',
          icon: HeartIcon,
          title: 'Tin tức về người thân',
          subtitle: 'Cập nhật tình hình sức khỏe và hoạt động của người thân'
        };
      default:
        return {
          primary: '#6b7280',
          primaryDark: '#4b5563',
          secondary: '#374151',
          accent: '#9ca3af',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          cardBg: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          shadow: 'rgba(107, 114, 128, 0.3)',
          icon: BellIcon,
          title: 'Thông báo',
          subtitle: 'Xem các thông báo mới nhất'
        };
    }
  };

  const theme = getThemeConfig(user?.role || 'guest');
  const IconComponent = theme.icon;

  // Filter notifications based on search and filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification: typeof notifications[0]) => {
      // Lọc theo role
      const matchesRole = !notification.roles || notification.roles.includes(user?.role || '');
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
      const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
      const matchesRead = showReadFilter === 'all' || 
                         (showReadFilter === 'unread' && !notification.isRead) ||
                         (showReadFilter === 'read' && notification.isRead);
      return matchesRole && matchesSearch && matchesCategory && matchesPriority && matchesRead;
    });
  }, [notifications, searchTerm, selectedCategory, selectedPriority, showReadFilter, user?.role]);

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications((prev: typeof notifications) => 
      prev.map((notif: typeof notifications[0]) => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const handleMarkAsUnread = (notificationId: number) => {
    setNotifications((prev: typeof notifications) => 
      prev.map((notif: typeof notifications[0]) => 
        notif.id === notificationId 
          ? { ...notif, isRead: false }
          : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev: typeof notifications) => 
      prev.map((notif: typeof notifications[0]) => ({ ...notif, isRead: true }))
    );
  };

  const handleDeleteNotification = (notificationId: number) => {
    setNotifications((prev: typeof notifications) => 
      prev.filter((notif: typeof notifications[0]) => notif.id !== notificationId)
    );
  };

  // Role-specific components
  const AdminControls = () => (
    <div style={{
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
          color: 'white',
          padding: '0.875rem 1.5rem',
          borderRadius: '0.75rem',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: `0 4px 12px ${theme.shadow}`,
          transition: 'all 0.3s ease'
        }}
      >
        <PlusIcon style={{width: '1.125rem', height: '1.125rem'}} />
        Tạo thông báo mới
      </button>
      
      <button 
        onClick={handleMarkAllAsRead}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '0.875rem 1.5rem',
          borderRadius: '0.75rem',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        <CheckIcon style={{width: '1.125rem', height: '1.125rem'}} />
        Đánh dấu tất cả đã đọc
      </button>
    </div>
  );

  const StaffControls = () => (
    <button 
      onClick={handleMarkAllAsRead}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        color: 'white',
        padding: '0.875rem 1.5rem',
        borderRadius: '0.75rem',
        border: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
        boxShadow: `0 4px 12px ${theme.shadow}`,
        transition: 'all 0.3s ease'
      }}
    >
      <CheckIcon style={{width: '1.125rem', height: '1.125rem'}} />
      Đánh dấu tất cả đã đọc
    </button>
  );

  const FamilyControls = () => (
    <button 
      onClick={handleMarkAllAsRead}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        color: 'white',
        padding: '0.875rem 1.5rem',
        borderRadius: '0.75rem',
        border: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
        boxShadow: `0 4px 12px ${theme.shadow}`,
        transition: 'all 0.3s ease'
      }}
    >
      <CheckIcon style={{width: '1.125rem', height: '1.125rem'}} />
      Đánh dấu tất cả đã đọc
    </button>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706', border: '#fbbf24' };
      case 'low': return { bg: '#d1fae5', text: '#059669', border: '#86efac' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication':
      case 'health':
        return <ExclamationTriangleIcon style={{width: '1.25rem', height: '1.25rem'}} />;
      case 'meeting':
      case 'activity':
        return <ClockIcon style={{width: '1.25rem', height: '1.25rem'}} />;
      default:
        return <InformationCircleIcon style={{width: '1.25rem', height: '1.25rem'}} />;
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  const categories = ['all', ...Array.from(new Set(notifications.map((n: typeof notifications[0]) => n.category)))];
  const priorities = ['all', 'high', 'medium', 'low'];
  const unreadCount = notifications.filter((n: typeof notifications[0]) => !n.isRead).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background,
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
      
      <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>


        {/* Header Section */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${theme.shadow}`
              }}>
                <IconComponent style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  color: theme.primary,
                  letterSpacing: '-0.025em'
                }}>
                  {theme.title}
                </h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  {theme.subtitle}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: theme.primary,
                  margin: '0.25rem 0 0 0',
                  fontWeight: 600
                }}>
                  {unreadCount} thông báo chưa đọc từ tổng số {filteredNotifications.length}
                </p>
              </div>
            </div>
            
            {user?.role === 'admin' && <AdminControls />}
            {user?.role === 'staff' && <StaffControls />}
            {user?.role === 'family' && <FamilyControls />}
          </div>
        </div>

        {/* Filters Section - Different for each role */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Filters based on role */}
          {user?.role === 'admin' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'end'
            }}>
              {/* Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tìm kiếm
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tiêu đề hoặc nội dung..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                  <MagnifyingGlassIcon style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#6b7280'
                  }} />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}
                >
                  {(categories as string[]).map((category: string) => (
                    <option key={String(category)} value={String(category)}>
                      {category === 'all' ? 'Tất cả danh mục' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mức độ ưu tiên
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority === 'all' ? 'Tất cả mức độ' : 
                       priority === 'high' ? 'Cao' :
                       priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read Status Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Trạng thái
                </label>
                <select
                  value={showReadFilter}
                  onChange={(e) => setShowReadFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="unread">Chưa đọc</option>
                  <option value="read">Đã đọc</option>
                </select>
              </div>
            </div>
          ) : user?.role === 'staff' ? (
            // Simplified filters for staff
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              alignItems: 'end'
            }}>
              {/* Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tìm kiếm thông báo
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm thông báo công việc..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                  <MagnifyingGlassIcon style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#6b7280'
                  }} />
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mức độ ưu tiên
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">Tất cả mức độ</option>
                  <option value="high">Khẩn cấp</option>
                  <option value="medium">Bình thường</option>
                </select>
              </div>

              {/* Read Status Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Trạng thái
                </label>
                <select
                  value={showReadFilter}
                  onChange={(e) => setShowReadFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="unread">Chưa đọc</option>
                  <option value="read">Đã đọc</option>
                </select>
              </div>
            </div>
          ) : (
            // Simple filters for family
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
              alignItems: 'end'
            }}>
              {/* Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tìm kiếm tin tức
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm tin tức về người thân..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                  <MagnifyingGlassIcon style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#6b7280'
                  }} />
                </div>
              </div>

              {/* Simple Status Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Hiển thị
                </label>
                <select
                  value={showReadFilter}
                  onChange={(e) => setShowReadFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">Tất cả tin tức</option>
                  <option value="unread">Tin tức mới</option>
                  <option value="read">Đã xem</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {filteredNotifications.length === 0 ? (
            <div style={{
              background: theme.cardBg,
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <IconComponent style={{
                width: '3rem',
                height: '3rem',
                color: '#9ca3af',
                margin: '0 auto 1rem auto'
              }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                {user?.role === 'family' ? 'Không có tin tức mới' : 'Không có thông báo'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                {user?.role === 'family' 
                  ? 'Hiện tại chưa có tin tức mới về người thân của bạn.'
                  : user?.role === 'staff'
                  ? 'Không có thông báo công việc nào phù hợp với bộ lọc.'
                  : 'Không tìm thấy thông báo nào phù hợp với bộ lọc của bạn.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification: typeof notifications[0]) => {
              const priorityColors = getPriorityColor(notification.priority);
              return (
                <div
                  key={notification.id}
                  style={{
                    background: notification.isRead 
                      ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      : theme.cardBg,
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: notification.isRead 
                      ? '0 2px 4px rgba(0, 0, 0, 0.05)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${notification.isRead ? '#e2e8f0' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderLeft: `4px solid ${theme.primary}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      flex: 1
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        background: `linear-gradient(135deg, ${priorityColors.bg} 0%, ${priorityColors.bg} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: priorityColors.text,
                        flexShrink: 0,
                        border: `1px solid ${priorityColors.border}`
                      }}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: notification.isRead ? 500 : 700,
                            color: '#111827',
                            margin: 0
                          }}>
                            {notification.title}
                          </h3>
                          
                          {/* Priority Badge */}
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: priorityColors.bg,
                            color: priorityColors.text,
                            border: `1px solid ${priorityColors.border}`
                          }}>
                            {notification.priority === 'high' ? 'Cao' :
                             notification.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                          </span>
                          
                          {/* Category Badge */}
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: '#e0e7ff',
                            color: '#3730a3',
                            border: '1px solid #c7d2fe'
                          }}>
                            {notification.category}
                          </span>
                          
                          {!notification.isRead && (
                            <div style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              background: '#3b82f6',
                              borderRadius: '50%'
                            }} />
                          )}
                        </div>
                        
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.75rem 0',
                          lineHeight: '1.5'
                        }}>
                          {notification.message}
                        </p>
                        
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                          {formatTime(notification.time)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions - Different for each role */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexShrink: 0
                    }}>
                      {!notification.isRead ? (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f0f9ff';
                            e.currentTarget.style.borderColor = theme.primary;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          title={user?.role === 'family' ? 'Đánh dấu đã xem' : 'Đánh dấu đã đọc'}
                        >
                          <CheckIcon style={{width: '1rem', height: '1rem', color: theme.primary}} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsUnread(notification.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#fef3c7';
                            e.currentTarget.style.borderColor = '#f59e0b';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          title={user?.role === 'family' ? 'Đánh dấu chưa xem' : 'Đánh dấu chưa đọc'}
                        >
                          <XMarkIcon style={{width: '1rem', height: '1rem', color: '#f59e0b'}} />
                        </button>
                      )}
                      
                      {/* Admin can delete notifications */}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.borderColor = '#ef4444';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          title="Xóa thông báo"
                        >
                          <TrashIcon style={{width: '1rem', height: '1rem', color: '#ef4444'}} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 
