"use client";

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

// Mock notifications data
const mockNotifications = [
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
  const [notifications, setNotifications] = useState(mockNotifications);
  
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
    
    // Navigate based on notification type
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
      position: 'relative',
      zIndex: 1000
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
        {/* Hiển thị ngày hiện tại */}
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '0.5rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }} className="md:block hidden">
          <span style={{
            fontSize: '0.875rem', 
            color: 'white',
            fontWeight: 500
          }}>
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

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
            <div style={{
              background: 
                user.role === 'admin' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 
                user.role === 'staff' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {user.role === 'admin' ? 'Quản trị viên' : 
               user.role === 'staff' ? 'Nhân viên' : 'Thành viên gia đình'}
            </div>
            
            {/* Notification dropdown */}
            <Menu as="div" style={{position: 'relative', zIndex: 1001}}>
              <Menu.Button style={{
                padding: '0.5rem', 
                borderRadius: '0.5rem', 
                color: 'white',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}>
                <BellIcon style={{width: '1.25rem', height: '1.25rem'}} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', 
                    top: '0.25rem', 
                    right: '0.25rem', 
                    width: '0.5rem', 
                    height: '0.5rem', 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                    borderRadius: '9999px', 
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.5)'
                  }} />
                )}
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95 translate-y-2"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 translate-y-2"
              >
                <Menu.Items style={{
                  position: 'absolute', 
                  right: 0, 
                  marginTop: '0.75rem', 
                  width: '22rem',
                  borderRadius: '1rem', 
                  backgroundColor: 'white',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                  zIndex: 9999,
                  border: '2px solid rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  top: '100%'
                }}>
                  <div style={{padding: '0.75rem'}}>
                    <div style={{
                      borderBottom: '1px solid #e5e7eb', 
                      paddingBottom: '0.75rem', 
                      marginBottom: '0.75rem'
                    }}>
                      <h3 style={{
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: '#111827', 
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          <BellIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
                          Thông báo
                        </div>
                        {unreadCount > 0 && (
                          <span style={{
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            minWidth: '1.25rem',
                            textAlign: 'center'
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </h3>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '20rem', overflowY: 'auto'}}>
                      {notifications.slice(0, 5).map((notification) => (
                        <Menu.Item key={notification.id}>
                          {({ active }) => (
                            <button 
                              onClick={() => handleNotificationClick(notification.id)}
                              style={{
                                display: 'block', 
                                width: '100%',
                                padding: '0.75rem', 
                                borderRadius: '0.75rem',
                                backgroundColor: active ? '#f8fafc' : notification.isRead ? 'transparent' : '#fef3c7',
                                border: active ? '1px solid #e2e8f0' : '1px solid transparent',
                                transition: 'all 0.2s ease-in-out',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                <div style={{flex: 1}}>
                                  <p style={{
                                    fontSize: '0.875rem', 
                                    fontWeight: notification.isRead ? 500 : 600, 
                                    color: '#111827', 
                                    margin: 0
                                  }}>
                                    {notification.title}
                                  </p>
                                  <p style={{
                                    fontSize: '0.75rem', 
                                    color: '#6b7280', 
                                    marginTop: '0.25rem', 
                                    margin: 0
                                  }}>
                                    {notification.message}
                                  </p>
                                  <p style={{
                                    fontSize: '0.75rem', 
                                    color: '#9ca3af', 
                                    marginTop: '0.25rem', 
                                    margin: 0
                                  }}>
                                    {notification.time}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div style={{
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    background: '#3b82f6',
                                    borderRadius: '50%',
                                    marginLeft: '0.5rem',
                                    marginTop: '0.25rem'
                                  }} />
                                )}
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                    <div style={{
                      borderTop: '1px solid #e5e7eb', 
                      paddingTop: '0.75rem', 
                      marginTop: '0.75rem'
                    }}>
                      <button 
                        onClick={handleViewAllNotifications}
                        style={{
                          display: 'block', 
                          width: '100%',
                          textAlign: 'center', 
                          fontSize: '0.875rem', 
                          color: '#6366f1', 
                          fontWeight: 600, 
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          transition: 'all 0.2s ease-in-out',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Xem tất cả thông báo
                      </button>
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            
            {/* Profile dropdown */}
            <Menu as="div" style={{position: 'relative', zIndex: 1001}}>
              <Menu.Button style={{
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '0.875rem', 
                borderRadius: '0.75rem',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'all 0.2s ease-in-out',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                <div style={{
                  height: '2.25rem', 
                  width: '2.25rem', 
                  borderRadius: '0.5rem', 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#667eea', 
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95 translate-y-2"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 translate-y-2"
              >
                <Menu.Items style={{
                  position: 'absolute', 
                  right: 0, 
                  marginTop: '0.75rem', 
                  width: '14rem',
                  borderRadius: '1rem', 
                  backgroundColor: 'white',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                  zIndex: 9999,
                  border: '2px solid rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  top: '100%'
                }}>
                  <div style={{padding: '0.75rem'}}>
                    <div style={{
                      padding: '0.75rem', 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '0.75rem',
                      marginBottom: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <p style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0}}>
                        {user.name}
                      </p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280', margin: 0}}>
                        {user.email}
                      </p>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleProfileClick}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.625rem 0.75rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.5rem',
                            backgroundColor: active ? '#f1f5f9' : 'transparent',
                            color: '#111827',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          Hồ sơ cá nhân
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSettingsClick}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.625rem 0.75rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.5rem',
                            backgroundColor: active ? '#f1f5f9' : 'transparent',
                            color: '#111827',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          Cài đặt tài khoản
                        </button>
                      )}
                    </Menu.Item>
                    <div style={{borderTop: '1px solid #e5e7eb', margin: '0.5rem 0'}}></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.625rem 0.75rem',
                            fontSize: '0.875rem',
                            backgroundColor: active ? '#fee2e2' : 'transparent',
                            color: active ? '#dc2626' : '#ef4444',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'all 0.2s ease-in-out'
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