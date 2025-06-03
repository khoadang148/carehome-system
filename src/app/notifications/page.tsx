"use client";

import { useState, useMemo } from 'react';
import { 
  BellIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: 'Thuốc cần cho phòng 204',
    message: 'Cần cung cấp thuốc huyết áp cho bệnh nhân Nguyễn Văn A. Thuốc cần được uống vào lúc 2:00 PM hôm nay.',
    time: '2023-05-15T10:30:00',
    isRead: false,
    type: 'medication',
    priority: 'high',
    category: 'Chăm sóc y tế'
  },
  {
    id: 2,
    title: 'Họp nhân viên lúc 3:00 PM',
    message: 'Cuộc họp tuần về kế hoạch chăm sóc bệnh nhân. Địa điểm: Phòng họp tầng 2.',
    time: '2023-05-15T09:30:00',
    isRead: false,
    type: 'meeting',
    priority: 'medium',
    category: 'Cuộc họp'
  },
  {
    id: 3,
    title: 'Báo cáo hàng ngày đã sẵn sàng',
    message: 'Báo cáo hoạt động ngày 15/05/2023 đã được tạo và có thể xem trong mục báo cáo.',
    time: '2023-05-15T08:00:00',
    isRead: true,
    type: 'report',
    priority: 'low',
    category: 'Báo cáo'
  },
  {
    id: 4,
    title: 'Kiểm tra sức khỏe định kỳ',
    message: 'Lịch kiểm tra sức khỏe định kỳ cho bệnh nhân tại phòng 305 vào ngày mai.',
    time: '2023-05-14T16:45:00',
    isRead: true,
    type: 'health',
    priority: 'medium',
    category: 'Chăm sóc y tế'
  },
  {
    id: 5,
    title: 'Cập nhật hệ thống',
    message: 'Hệ thống sẽ được bảo trì từ 11:00 PM đến 1:00 AM ngày mai.',
    time: '2023-05-14T14:20:00',
    isRead: false,
    type: 'system',
    priority: 'high',
    category: 'Hệ thống'
  },
  {
    id: 6,
    title: 'Hoạt động giải trí buổi chiều',
    message: 'Hoạt động ca hát và đọc sách cho các cư dân vào lúc 4:00 PM tại phòng sinh hoạt.',
    time: '2023-05-14T13:15:00',
    isRead: true,
    type: 'activity',
    priority: 'low',
    category: 'Hoạt động'
  },
  {
    id: 7,
    title: 'Đơn thuốc mới',
    message: 'Bác sĩ đã kê đơn thuốc mới cho bệnh nhân Trần Thị B tại phòng 102.',
    time: '2023-05-14T11:30:00',
    isRead: false,
    type: 'medication',
    priority: 'high',
    category: 'Chăm sóc y tế'
  },
  {
    id: 8,
    title: 'Thanh toán hóa đơn',
    message: 'Hóa đơn tháng 5 cho các dịch vụ đã được gửi đến gia đình.',
    time: '2023-05-14T09:00:00',
    isRead: true,
    type: 'finance',
    priority: 'medium',
    category: 'Tài chính'
  }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showReadFilter, setShowReadFilter] = useState('all');

  // Filter notifications based on search and filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
      const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
      const matchesRead = showReadFilter === 'all' || 
                         (showReadFilter === 'unread' && !notification.isRead) ||
                         (showReadFilter === 'read' && notification.isRead);
      
      return matchesSearch && matchesCategory && matchesPriority && matchesRead;
    });
  }, [notifications, searchTerm, selectedCategory, selectedPriority, showReadFilter]);

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const handleMarkAsUnread = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: false }
          : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

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

  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category)))];
  const priorities = ['all', 'high', 'medium', 'low'];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <BellIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Thông báo
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  {unreadCount} thông báo chưa đọc từ tổng số {notifications.length}
                </p>
              </div>
            </div>
            
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
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <CheckIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
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
                {categories.map(category => (
                  <option key={category} value={category}>
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
        </div>

        {/* Notifications List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {filteredNotifications.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <BellIcon style={{
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
                Không có thông báo
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                Không tìm thấy thông báo nào phù hợp với bộ lọc của bạn.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const priorityColors = getPriorityColor(notification.priority);
              return (
                <div
                  key={notification.id}
                  style={{
                    background: notification.isRead 
                      ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: notification.isRead 
                      ? '0 2px 4px rgba(0, 0, 0, 0.05)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${notification.isRead ? '#e2e8f0' : 'rgba(255, 255, 255, 0.2)'}`,
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
                    
                    {/* Actions */}
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
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          title="Đánh dấu đã đọc"
                        >
                          <CheckIcon style={{width: '1rem', height: '1rem', color: '#3b82f6'}} />
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
                          title="Đánh dấu chưa đọc"
                        >
                          <XMarkIcon style={{width: '1rem', height: '1rem', color: '#f59e0b'}} />
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