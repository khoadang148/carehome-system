"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  HomeIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'staff' | 'family' | 'admin'>('staff');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginEmail = email || `${role}@example.com`;
      const success = await login(loginEmail, password || role);
      
      if (!success) {
        setError('Thông tin đăng nhập không chính xác. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { 
      value: 'admin', 
      label: 'Quản trị hệ thống', 
      icon: UserIcon,
      description: 'Toàn quyền quản lý',
      color: '#1e40af',
      lightBg: '#eff6ff'
    },
    { 
      value: 'staff', 
      label: 'Nhân viên y tế', 
      icon: UserIcon,
      description: 'Điều dưỡng, bác sĩ',
      color: '#047857',
      lightBg: '#ecfdf5'
    },
    { 
      value: 'family', 
      label: 'Gia đình', 
      icon: HomeIcon,
      description: 'Theo dõi thông tin',
      color: '#b45309',
      lightBg: '#fffbeb'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh', // Đảm bảo chiếm toàn bộ chiều cao
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  position: 'relative'
      }}>
        {/* Subtle background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Professional Logo */}
          <div style={{
            width: '5rem',
            height: '5rem',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem auto',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <BuildingOffice2Icon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            margin: '0 0 1rem 0',
            letterSpacing: '-0.025em'
          }}>
            CareHome
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            margin: '0 0 2rem 0',
            opacity: 0.9,
            fontWeight: 500
          }}>
            Hệ thống quản lý viện dưỡng lão chuyên nghiệp
          </p>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1.5rem 0'
            }}>
              Tính năng hệ thống
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheckIcon style={{ width: '1.25rem', height: '1.25rem', opacity: 0.8 }} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Bảo mật thông tin cư dân
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ClockIcon style={{ width: '1.25rem', height: '1.25rem', opacity: 0.8 }} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Theo dõi sức khỏe 24/7
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserIcon style={{ width: '1.25rem', height: '1.25rem', opacity: 0.8 }} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Quản lý nhân viên y tế
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '28rem',
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{
            padding: '2rem 2rem 1rem 2rem',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 0.5rem 0',
              textAlign: 'center'
            }}>
              Đăng nhập hệ thống
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0,
              textAlign: 'center'
            }}>
              Vui lòng chọn loại tài khoản và đăng nhập để tiếp tục
            </p>
          </div>
          
          {/* Form */}
          <div style={{ padding: '2rem' }}>
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                border: '1px solid #fecaca',
                fontWeight: 500
              }}>
                <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                <p style={{margin: 0}}>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              {/* Role Selection */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Loại tài khoản
                </label>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {roleOptions.map((option) => (
                    <button 
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '2px solid',
                        borderColor: role === option.value ? option.color : '#e5e7eb',
                        background: role === option.value ? option.lightBg : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseOver={(e) => {
                        if (role !== option.value) {
                          e.currentTarget.style.borderColor = option.color + '40';
                          e.currentTarget.style.background = option.lightBg;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (role !== option.value) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: role === option.value ? option.color : '#f3f4f6',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <option.icon style={{
                          width: '1.25rem', 
                          height: '1.25rem', 
                          color: role === option.value ? 'white' : '#6b7280'
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: role === option.value ? option.color : '#374151',
                          marginBottom: '0.25rem'
                        }}>
                          {option.label}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {option.description}
                        </div>
                      </div>
                      {role === option.value && (
                        <div style={{
                          width: '1rem',
                          height: '1rem',
                          background: option.color,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '0.25rem',
                            height: '0.25rem',
                            background: 'white',
                            borderRadius: '50%'
                          }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  Địa chỉ email
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0.875rem',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    <EnvelopeIcon style={{ width: '1.125rem', height: '1.125rem', color: '#9ca3af' }} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={`${role}@example.com`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem 0.75rem 2.5rem',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#047857';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 120, 87, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0.875rem',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    <LockClosedIcon style={{ width: '1.125rem', height: '1.125rem', color: '#9ca3af' }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#047857';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 120, 87, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '0.875rem',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: 0
                    }}
                  >
                    {showPassword ? 
                      <EyeSlashIcon style={{ width: '1.125rem', height: '1.125rem' }} /> :
                      <EyeIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                    }
                  </button>
                </div>
              </div>
              
              {/* Security Notice */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheckIcon style={{ width: '1rem', height: '1rem', color: '#047857', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Dữ liệu được mã hóa và bảo mật theo tiêu chuẩn y tế
                </span>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: isLoading 
                    ? '#9ca3af'
                    : '#047857',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#065f46';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#047857';
                  }
                }}
              >
                {isLoading ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang xác thực...
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
            
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 
