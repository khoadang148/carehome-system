"use client";

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <header style={{
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb', 
      height: '4rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Phần tìm kiếm thay cho logo trùng lặp */}
      <div style={{ maxWidth: '24rem', width: '100%' }}>
        <div style={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: '#f9fafb'
            }}
          />
          <MagnifyingGlassIcon style={{
            position: 'absolute',
            left: '0.75rem',
            width: '1.25rem',
            height: '1.25rem',
            color: '#9ca3af'
          }} />
        </div>
      </div>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
        {/* Hiển thị ngày hiện tại trên desktop */}
        <div style={{display: 'none'}} className="md:block">
          <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {!user ? (
          <button 
            onClick={handleLogin}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: '#0ea5e9', 
              color: 'white', 
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <UserCircleIcon style={{width: '1rem', height: '1rem'}} />
            Đăng nhập
          </button>
        ) : (
          <>
            {/* Role badge */}
            <div style={{
              backgroundColor: 
                user.role === 'admin' ? '#e0f2fe' : 
                user.role === 'staff' ? '#ccfbf1' :
                '#fdf4ff',
              color: 
                user.role === 'admin' ? '#0369a1' : 
                user.role === 'staff' ? '#0f766e' :
                '#a21caf',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}>
              {user.role === 'admin' ? 'Quản trị viên' : 
               user.role === 'staff' ? 'Nhân viên' : 'Thành viên gia đình'}
            </div>
            
            {/* Notification dropdown */}
            <Menu as="div" style={{position: 'relative'}}>
              <Menu.Button style={{
                padding: '0.375rem', 
                borderRadius: '9999px', 
                color: '#4b5563',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}>
                <span className="sr-only">View notifications</span>
                <BellIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <span style={{
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: '0.5rem', 
                  height: '0.5rem', 
                  backgroundColor: '#d946ef', 
                  borderRadius: '9999px', 
                  border: '2px solid white'
                }} />
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
                <Menu.Items style={{
                  position: 'absolute', 
                  right: 0, 
                  marginTop: '0.5rem', 
                  width: '20rem',
                  borderRadius: '0.75rem', 
                  backgroundColor: 'white',
                  boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)',
                  zIndex: 10
                }}>
                  <div style={{padding: '0.5rem'}}>
                    <div style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem', marginBottom: '0.5rem'}}>
                      <h3 style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827', padding: '0 0.5rem'}}>Thông báo</h3>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                      <Menu.Item>
                        {({ active }) => (
                          <a 
                            href="#" 
                            style={{
                              display: 'block', 
                              padding: '0.5rem', 
                              borderRadius: '0.5rem',
                              backgroundColor: active ? '#f0f9ff' : 'transparent'
                            }}
                          >
                            <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>Thuốc cần cho phòng 204</p>
                            <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem'}}>10 phút trước</p>
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a 
                            href="#" 
                            style={{
                              display: 'block', 
                              padding: '0.5rem', 
                              borderRadius: '0.5rem',
                              backgroundColor: active ? '#f0f9ff' : 'transparent'
                            }}
                          >
                            <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>Họp nhân viên lúc 3:00 PM</p>
                            <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem'}}>30 phút trước</p>
                          </a>
                        )}
                      </Menu.Item>
                    </div>
                    <div style={{borderTop: '1px solid #e5e7eb', padding: '0.5rem', marginTop: '0.5rem'}}>
                      <a href="#" style={{display: 'block', textAlign: 'center', fontSize: '0.875rem', color: '#0369a1', fontWeight: 500, padding: '0.25rem'}}>
                        Xem tất cả thông báo
                      </a>
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            
            {/* Profile dropdown */}
            <Menu as="div" style={{position: 'relative'}}>
              <Menu.Button style={{
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '0.875rem', 
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}>
                <span className="sr-only">Open user menu</span>
                <div style={{
                  height: '2rem', 
                  width: '2rem', 
                  borderRadius: '9999px', 
                  backgroundColor: '#0284c7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 500
                }}>
                  {user.name.substring(0, 2)}
                </div>
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
                <Menu.Items style={{
                  position: 'absolute', 
                  right: 0, 
                  marginTop: '0.5rem', 
                  width: '12rem',
                  borderRadius: '0.75rem', 
                  backgroundColor: 'white',
                  boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)',
                  zIndex: 10
                }}>
                  <div style={{padding: '0.5rem'}}>
                    <div style={{padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', marginBottom: '0.25rem'}}>
                      <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{user.name}</p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{user.email}</p>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.375rem',
                            backgroundColor: active ? '#f9fafb' : 'transparent',
                            color: '#111827'
                          }}
                        >
                          Hồ sơ cá nhân
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.375rem',
                            backgroundColor: active ? '#f9fafb' : 'transparent',
                            color: '#111827'
                          }}
                        >
                          Cài đặt tài khoản
                        </a>
                      )}
                    </Menu.Item>
                    <div style={{borderTop: '1px solid #e5e7eb', margin: '0.25rem 0'}}></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            backgroundColor: active ? '#fee2e2' : 'transparent',
                            color: active ? '#dc2626' : '#ef4444',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer'
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