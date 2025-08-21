"use client";

import { useState, useEffect, useRef, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { clientStorage } from '@/lib/utils/clientStorage';
import { usePageTransition } from '@/lib/utils/pageTransition';
import { redirectByRole } from '@/lib/utils/navigation';
import LoginSpinner from '@/components/shared/LoginSpinner';
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  HeartIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import type { User } from '@/lib/contexts/auth-context';
import React from 'react';
import SuccessModal from '@/components/SuccessModal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const hasRedirected = useRef(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { login, user, loading } = useAuth();
  const { startTransition: startPageTransition } = usePageTransition();

  // Preload pages for faster navigation
  useEffect(() => {
    router.prefetch('/family');
    router.prefetch('/admin');
    router.prefetch('/staff');
    if (returnUrl && returnUrl !== '/login') {
      router.prefetch(returnUrl);
    }
  }, [router, returnUrl]);

  // Immediate redirect if user is already logged in
  useEffect(() => {
    if (!user || loading) {
      hasRedirected.current = false;
      return;
    }
    
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      
      const redirectTo = (url: string) => {
        router.push(url);
      };

      if (user.role === 'family') {
        redirectTo('/family');
      } else if (user.role === 'admin') {
        redirectTo('/admin');
      } else if (user.role === 'staff') {
        redirectTo('/staff');
      } else if (returnUrl && returnUrl !== '/login') {
        redirectTo(returnUrl);
      } else {
        redirectTo('/');
      }
    }
  }, [user, loading, returnUrl]);

  // Preload when user starts typing
  useEffect(() => {
    if (email.length > 0 || password.length > 0) {
      router.prefetch('/family');
      router.prefetch('/admin');
      router.prefetch('/staff');
      if (returnUrl && returnUrl !== '/login') {
        router.prefetch(returnUrl);
      }
    }
  }, [email, password, router, returnUrl]);

  // Restore error and success messages
  useEffect(() => {
    const savedError = clientStorage.getItem('login_error');
    const savedSuccess = clientStorage.getItem('login_success');
    const savedAttempts = clientStorage.getItem('login_attempts');
    
    setShouldRedirect(false);
    hasRedirected.current = false;
    
    if (!user && !loading && !messageDisplayed) {
      if (savedError) {
        setError(savedError);
        setMessageDisplayed(true);
      }
      if (savedSuccess) {
        setSuccess(savedSuccess);
        setMessageDisplayed(true);
      }
      if (savedAttempts) {
        setLoginAttempts(parseInt(savedAttempts));
      }
    } else if (user) {
      clientStorage.removeItem('login_error');
      setError('');
      setLoginAttempts(0);
    }
  }, [user, loading]);

  const setErrorWithStorage = (errorMessage: string) => {
    setError(errorMessage);
    setMessageDisplayed(true);
    if (errorMessage) {
      clientStorage.setItem('login_error', errorMessage);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      clientStorage.setItem('login_attempts', newAttempts.toString());
    } else {
      clientStorage.removeItem('login_error');
      setLoginAttempts(0);
      clientStorage.removeItem('login_attempts');
    }
  };

  const setSuccessWithStorage = (successMessage: string) => {
    setSuccess(successMessage);
    setMessageDisplayed(true);
    if (successMessage) {
      clientStorage.setItem('login_success', successMessage);
    } else {
      clientStorage.removeItem('login_success');
    }
  };

  useEffect(() => {
    if (!loading && user && !hasRedirected.current && shouldRedirect) {
      hasRedirected.current = true;
      
      const redirectTo = (url: string) => {
        router.prefetch(url);
        startTransition(() => {
          router.push(url);
        });
      };

      if (user.role === 'family') {
        redirectTo('/family');
      } else if (user.role === 'admin') {
        redirectTo('/admin');
      } else if (user.role === 'staff') {
        redirectTo('/staff');
      } else if (returnUrl && returnUrl !== '/login') {
        redirectTo(returnUrl);
      } else {
        redirectTo('/');
      }
    }
  }, [user, loading, returnUrl, shouldRedirect]);

  // Clear messages when user logs out
  useEffect(() => {
    if (!user && !loading) {
      const hasLoggedOut = clientStorage.getItem('has_logged_out');
      if (hasLoggedOut) {
        clientStorage.removeItem('login_success');
        setSuccess('');
        setMessageDisplayed(false);
        clientStorage.removeItem('has_logged_out');
      }
    }
  }, [user, loading]);

  // Ensure messages don't disappear on re-render
  useEffect(() => {
    if (messageDisplayed && !error && !success) {
      const savedError = clientStorage.getItem('login_error');
      const savedSuccess = clientStorage.getItem('login_success');
      
      if (savedError) {
        setError(savedError);
      }
      if (savedSuccess) {
        setSuccess(savedSuccess);
      }
    }
  }, [messageDisplayed, error, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    clientStorage.removeItem('login_error');
    
    if (!email.trim() || !password.trim()) {
      setErrorWithStorage('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    
    setIsLoading(true);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Yêu cầu hết thời gian chờ. Vui lòng thử lại.')), 6000);
    });

    try {
      const user = await Promise.race([
        login(email, password),
        timeoutPromise
      ]);
      const typedUser = user as User | null;
      if (typedUser) {
        setError('');
        clientStorage.removeItem('login_error');
        setUserName(typedUser.name);
        
        clientStorage.setItem('login_success', `${typedUser.name || 'bạn'}!`);
        
        setIsLoading(true);
        
        const redirectTo = (url: string) => {
          const transitionId = startPageTransition(url, typedUser.role);
          sessionStorage.setItem('current_transition_id', transitionId);
          router.prefetch(url);
          startTransition(() => {
            router.push(url);
          });
        };

        if (returnUrl && returnUrl !== '/login') {
          redirectTo(returnUrl);
        } else {
          redirectByRole(router, typedUser.role);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setShouldRedirect(false);
      setSuccess('');
      clientStorage.removeItem('login_success');

      if (err.response?.status === 401) {
        setErrorWithStorage('Email hoặc mật khẩu không đúng');
      } else if (err.response?.status === 403) {
        setErrorWithStorage('Tài khoản không có quyền truy cập');
      } else if (err.response?.status === 423) {
        setErrorWithStorage('Tài khoản đã bị khóa');
      } else if (err.response?.status === 404) {
        setErrorWithStorage('Tài khoản không tồn tại');
      } else if (err.message?.includes('timeout')) {
        setErrorWithStorage('Kết nối chậm, vui lòng thử lại');
      } else {
        setErrorWithStorage('Email hoặc mật khẩu không đúng');
      }

      return;
    }

    setIsLoading(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={userName} />
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #f9e7c4 0%, #fbc2eb 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Left Panel - Branding */}
          <div style={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, #fffbe9 0%, #fbc2eb 100%)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '400px' }}>
              {/* Logo Section */}
              <div style={{
                width: '90px',
                height: '90px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem auto',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.25), 0 10px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <BuildingOffice2Icon style={{ 
                  width: '45px', 
                  height: '45px', 
                  color: 'white'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}>
                  <HeartIcon style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: 'white'
                  }} />
                </div>
              </div>
              
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #059669 0%, #0ea5e9 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 1rem 0',
                letterSpacing: '-0.025em'
              }}>
                CareHome
              </h1>
              
              <p style={{
                fontSize: '1.125rem',
                color: '#6b7280',
                margin: '0 0 2.5rem 0',
                fontWeight: 500,
                lineHeight: 1.6
              }}>
                Hệ thống quản lý viện dưỡng lão<br />
                <span style={{ color: '#059669', fontWeight: 600 }}>Chuyên nghiệp • An toàn • Tận tâm</span>
              </p>
              
              {/* Care Illustration */}
              <div style={{
                margin: '2rem 0',
                padding: '2.5rem',
                background: 'rgba(255,255,255,0.55)',
                borderRadius: '32px',
                border: '1.5px solid rgba(255,255,255,0.7)',
                boxShadow: '0 12px 48px 0 rgba(16, 185, 129, 0.10), 0 2px 8px 0 rgba(0,0,0,0.04)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '280px',
                  overflow: 'hidden',
                  borderRadius: '24px',
                  position: 'relative',
                  zIndex: 4,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)'
                }}>
                  <img
                    src="https://th.bing.com/th/id/OIP.nJ4wfcDXbII6LeT_CkbhOAHaHa?r=0&w=740&h=740&rs=1&pid=ImgDetMain"
                    alt="Elderly Care Services - Caregiver Support Illustration"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '18px',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.10)) brightness(1.08) contrast(1.08) saturate(1.15)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)',
                    borderRadius: '0 0 18px 18px',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>
              
              {/* Feature Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  {
                    icon: HeartIcon,
                    title: 'Chăm sóc tận tâm',
                    description: 'Theo dõi sức khỏe 24/7 với đội ngũ y bác sĩ chuyên nghiệp',
                    color: '#ef4444'
                  },
                  {
                    icon: UserGroupIcon,
                    title: 'Kết nối gia đình',
                    description: 'Cập nhật thông tin real-time cho người thân',
                    color: '#8b5cf6'
                  },
                  {
                    icon: ShieldCheckIcon,
                    title: 'Bảo mật cao',
                    description: 'Dữ liệu được bảo vệ theo tiêu chuẩn y tế quốc tế',
                    color: '#0ea5e9'
                  }
                ].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${feature.color}30`
                    }}>
                      <feature.icon style={{ width: '24px', height: '24px', color: feature.color }} />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        {feature.title}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        lineHeight: 1.4
                      }}>
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div style={{
            flex: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '1100px',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '2.5rem 2.5rem 1.5rem 2.5rem',
                background: 'linear-gradient(135deg,rgb(153, 228, 203) 0%,rgb(136, 209, 240) 100%)',
                borderBottom: '1px solid #f3f4f6',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #10b981 0%, #0ea5e9 50%, #f59e0b 100%)'
                }} />
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                    position: 'relative'
                  }}>
                    <LockClosedIcon style={{ width: '28px', height: '28px', color: 'white' }} />
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      background: '#f59e0b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)'
                    }}>
                      <HeartIcon style={{ width: '12px', height: '12px', color: 'white' }} />
                    </div>
                  </div>
                  
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Đăng nhập
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    
                  </p>
                </div>
              </div>
              
              {/* Form */}
              <div style={{ padding: '2.5rem' }}>
                {loginAttempts >= 3 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    border: '1px solid #fbbf24',
                    fontWeight: 500
                  }}>
                    <ExclamationTriangleIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>Quá nhiều lần đăng nhập sai. Vui lòng kiểm tra lại thông tin.</span>
                  </div>
                )}
                
                {success && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: '#f0fdf4',
                    color: '#166534',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid #bbf7d0',
                    fontWeight: 500
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                    <span style={{ fontWeight: 500 }}>{success}</span>
                  </div>
                )}
                
                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid #fecaca',
                    fontWeight: 500
                  }}>
                    <ExclamationTriangleIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{error}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}} noValidate>
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
                        left: '1rem',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}>
                        <EnvelopeIcon style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={"example@email.com"}
                        value={email}
                        onChange={handleEmailChange}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem 0.875rem 2.75rem',
                          fontSize: '0.875rem',
                          color: '#1e293b',
                          background: 'white',
                          borderRadius: '10px',
                          border: '2px solid #e5e7eb',
                          boxSizing: 'border-box'
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
                        <LockClosedIcon style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập mật khẩu của bạn"
                        value={password}
                        onChange={handlePasswordChange}
                        style={{
                          width: '100%',
                          padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                          fontSize: '0.875rem',
                          color: '#1e293b',
                          background: 'white',
                          borderRadius: '10px',
                          border: '2px solid #e5e7eb',
                          boxSizing: 'border-box'
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
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        {showPassword ? 
                          <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> :
                          <EyeIcon style={{ width: '18px', height: '18px' }} />
                        }
                      </button>
                    </div>
                  </div>
                  
                  {/* Security Notice */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ShieldCheckIcon style={{ width: '16px', height: '16px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Bảo mật thông tin
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', lineHeight: 1.4 }}>
                        Dữ liệu được mã hóa và bảo mật theo tiêu chuẩn y tế quốc tế
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'white',
                      background: isLoading 
                        ? '#6b7280'
                        : error 
                        ? '#ef4444'
                        : success
                        ? '#22c55e'
                        : '#10b981',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      marginTop: '0.5rem',
                      boxShadow: isLoading 
                        ? 'none' 
                        : '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {isLoading ? (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        Đang xác thực...
                      </div>
                    ) : (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                        <LockClosedIcon style={{ width: '18px', height: '18px' }} />
                        Đăng nhập
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Spinner */}
      <LoginSpinner isLoading={isLoading} />
    </>
  );
}
