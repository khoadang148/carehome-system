"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  HomeIcon,
  EyeIcon,
  EyeSlashIcon
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
      label: 'Quản trị viên', 
      icon: UserIcon,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      lightBg: 'rgba(102, 126, 234, 0.1)'
    },
    { 
      value: 'staff', 
      label: 'Nhân viên', 
      icon: UserIcon,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      lightBg: 'rgba(16, 185, 129, 0.1)'
    },
    { 
      value: 'family', 
      label: 'Gia đình', 
      icon: HomeIcon,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      lightBg: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        animation: 'rotate 30s linear infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '20rem',
        height: '20rem',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        width: '15rem',
        height: '15rem',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '32rem',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          padding: '2.5rem 2rem 1.5rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          position: 'relative'
        }}>
          {/* CareHome Logo */}
          <div style={{
            width: '4.5rem',
            height: '4.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            position: 'relative'
          }}>
            {/* Sparkles/Stars icon */}
            <div style={{
              position: 'relative',
              width: '2.5rem',
              height: '2.5rem'
            }}>
              {/* Main star */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '1.5rem',
                height: '1.5rem',
                background: 'white',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }} />
              
              {/* Small stars */}
              <div style={{
                position: 'absolute',
                top: '0.2rem',
                right: '0.2rem',
                width: '0.6rem',
                height: '0.6rem',
                background: 'white',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '0.2rem',
                left: '0.2rem',
                width: '0.5rem',
                height: '0.5rem',
                background: 'white',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }} />
            </div>
          </div>
          
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            color: '#667eea',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            CareHome
          </h1>
          <p style={{
            fontSize: '1.125rem',
            fontWeight: 500,
            color: '#64748b',
            margin: 0
          }}>
            Hệ thống quản lý viện dưỡng lão
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
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#dc2626',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              border: '1px solid #fca5a5',
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
                marginBottom: '0.75rem'
                }}>
                Chọn loại tài khoản
                </label>
                <div style={{ 
                  display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem'
                }}>
                {roleOptions.map((option) => (
                  <button 
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value as any)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 0.75rem',
                      borderRadius: '0.75rem',
                      border: '2px solid',
                      borderColor: role === option.value ? option.gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#667eea' : '#e2e8f0',
                      background: role === option.value ? option.lightBg : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      if (role !== option.value) {
                        e.currentTarget.style.borderColor = option.gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#667eea' + '40';
                        e.currentTarget.style.background = option.lightBg;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (role !== option.value) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: role === option.value ? option.gradient : '#e2e8f0',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      <option.icon style={{
                        width: '1rem', 
                        height: '1rem', 
                        color: role === option.value ? 'white' : '#64748b'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: role === option.value ? option.gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#667eea' : '#64748b',
                      textAlign: 'center'
                    }}>
                      {option.label}
                    </span>
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
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                  top: '50%',
                  left: '1rem',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1
                  }}>
                    <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
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
                    padding: '0.875rem 1rem 0.875rem 3rem',
                      fontSize: '0.875rem',
                    color: '#1e293b',
                    background: 'white',
                    borderRadius: '0.75rem',
                    border: '2px solid #e2e8f0',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
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
                  left: '1rem',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1
                  }}>
                    <LockClosedIcon style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
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
                    padding: '0.875rem 3rem 0.875rem 3rem',
                      fontSize: '0.875rem',
                    color: '#1e293b',
                    background: 'white',
                    borderRadius: '0.75rem',
                    border: '2px solid #e2e8f0',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                      style={{
                    position: 'absolute',
                    top: '50%',
                    right: '1rem',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: 0
                  }}
                >
                  {showPassword ? 
                    <EyeSlashIcon style={{ width: '1.25rem', height: '1.25rem' }} /> :
                    <EyeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  }
                </button>
              </div>
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
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '0.75rem',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isLoading 
                  ? 'none'
                  : '0 4px 6px -1px rgba(102, 126, 234, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(102, 126, 234, 0.25)';
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
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
              </button>
          </form>
          
          {/* Demo Info */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0'
          }}>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes rotate {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 
