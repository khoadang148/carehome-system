"use client";

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon, LockClosedIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Admin', role: 'admin' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập đăng nhập - trong thực tế sẽ gọi API
    if (username === 'admin' && password === 'admin') {
      setCurrentUser({ name: 'Admin User', role: 'admin' });
      setIsLoggedIn(true);
    } else if (username === 'staff' && password === 'staff') {
      setCurrentUser({ name: 'Staff User', role: 'staff' });
      setIsLoggedIn(true);
    } else if (username === 'family' && password === 'family') {
      setCurrentUser({ name: 'Family Member', role: 'family' });
      setIsLoggedIn(true);
    }
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser({ name: '', role: '' });
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {!isLoggedIn ? (
          <button 
            onClick={() => setShowLoginModal(true)}
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
            <LockClosedIcon style={{width: '1rem', height: '1rem'}} />
            Đăng nhập
          </button>
        ) : (
          <>
            {/* Role badge */}
            <div style={{
              backgroundColor: 
                currentUser.role === 'admin' ? '#e0f2fe' : 
                currentUser.role === 'staff' ? '#ccfbf1' :
                '#fdf4ff',
              color: 
                currentUser.role === 'admin' ? '#0369a1' : 
                currentUser.role === 'staff' ? '#0f766e' :
                '#a21caf',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}>
              {currentUser.role === 'admin' ? 'Quản trị viên' : 
               currentUser.role === 'staff' ? 'Nhân viên' : 'Thành viên gia đình'}
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
                  {currentUser.name.substring(0, 2)}
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
                  <div style={{padding: '0.25rem'}}>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          style={{
                            display: 'block',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            color: active ? '#0284c7' : '#374151',
                            backgroundColor: active ? '#f0f9ff' : 'transparent',
                            borderRadius: '0.375rem'
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
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            color: active ? '#0284c7' : '#374151',
                            backgroundColor: active ? '#f0f9ff' : 'transparent',
                            borderRadius: '0.375rem'
                          }}
                        >
                          Cài đặt
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.5rem 1rem',
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
      
      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '24rem',
            boxShadow: '0px 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem'}}>Đăng nhập</h2>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / staff / family"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  required
                />
                <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem'}}>
                  * Mật khẩu: giống với tên đăng nhập
                </p>
              </div>
              <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#0ea5e9',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
} 