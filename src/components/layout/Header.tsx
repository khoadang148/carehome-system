"use client";

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'medication' | 'meeting' | 'report';
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'Thuốc cần cho phòng 204',
    message: 'Cần cung cấp thuốc huyết áp cho bệnh nhân Nguyễn Văn A',
    time: '10 phút trước',
    isRead: false,
    type: 'medication'
  },
  {
    id: 2,
    title: 'Họp nhân viên lúc 3:00 PM',
    message: 'Cuộc họp tuần về kế hoạch chăm sóc bệnh nhân',
    time: '30 phút trước',
    isRead: false,
    type: 'meeting'
  },
  {
    id: 3,
    title: 'Báo cáo hàng ngày đã sẵn sàng',
    message: 'Báo cáo hoạt động ngày 15/05/2023 đã được tạo',
    time: '1 giờ trước',
    isRead: true,
    type: 'report'
  }
];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleNotificationClick = (notificationId: number) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      switch (notification.type) {
        case 'medication':
          router.push('/medical');
          break;
        case 'meeting':
          router.push('/activities');
          break;
        case 'report':
          router.push('/reports');
          break;
        default:
          break;
      }
    }
  };

  const handleViewAllNotifications = () => {
    router.push('/notifications');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)', 
      height: '4.5rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0
    }}>
      {/* Logo/Brand area */}
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <HomeIcon style={{width: '1.5rem', height: '1.5rem', color: '#667eea'}} />
        </div>
        <div>
          <h1 style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'white',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            Viện Dưỡng Lão
          </h1>
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            margin: 0,
            fontWeight: 500
          }}>
            Chăm sóc tận tâm
          </p>
        </div>
      </div>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '1.25rem'}}>


        {!user ? (
          <button 
            onClick={handleLogin}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: '#667eea', 
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease-in-out',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            <UserCircleIcon style={{width: '1.125rem', height: '1.125rem'}} />
            Đăng nhập
          </button>
        ) : (
          <>
            {/* Role badge */}


            {/* Notifications */}
            <Menu as="div" className="relative">
              <Menu.Button
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title="Xem thông báo"
              >
                <BellIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.25rem',
                    right: '-0.25rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.375rem',
                    borderRadius: '9999px',
                    border: '2px solid #667eea'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '20rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '0.5rem',
                    zIndex: 50
                  }}
                >
                  <div style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#1f2937'
                    }}>
                      Thông báo
                    </h3>
                  </div>

                  <div style={{
                    maxHeight: '20rem',
                    overflowY: 'auto'
                  }}>
                    {notifications.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleNotificationClick(notification.id)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.75rem',
                              background: active ? '#f3f4f6' : 'transparent',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.25rem'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start'
                            }}>
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#1f2937'
                              }}>
                                {notification.title}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                              }}>
                                {notification.time}
                              </span>
                            </div>
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#4b5563',
                              margin: 0
                            }}>
                              {notification.message}
                            </p>
                            {!notification.isRead && (
                              <div style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                background: '#3b82f6',
                                borderRadius: '9999px',
                                marginTop: '0.25rem'
                              }} />
                            )}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={handleViewAllNotifications}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#f3f4f6',
                        color: '#4b5563',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: 'none'
                      }}
                    >
                      Xem tất cả thông báo
                    </button>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: 0,
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Tài khoản cá nhân"
              >
                <UserCircleIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '12rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '0.5rem',
                    zIndex: 50
                  }}
                >
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleProfileClick}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem',
                          background: active ? '#f3f4f6' : 'transparent',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          border: 'none'
                        }}
                      >
                        Thông tin cá nhân
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSettingsClick}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem',
                          background: active ? '#f3f4f6' : 'transparent',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          border: 'none'
                        }}
                      >
                        Cài đặt
                      </button>
                    )}
                  </Menu.Item>

                  <div style={{
                    padding: '0.5rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.75rem',
                            background: active ? '#fee2e2' : '#fef2f2',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#dc2626',
                            border: 'none'
                          }}
                        >
                          Đăng xuất
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </>
        )}
      </div>
    </header>
  );
} 
