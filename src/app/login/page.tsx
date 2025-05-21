"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LockClosedIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'staff' | 'family' | 'admin'>('staff');

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Fill in email based on selected role for demo purposes
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

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f5f7fa',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        margin: 'auto',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#0ea5e9',
            marginBottom: '0.5rem'
          }}>
            CareHome
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Đăng nhập vào hệ thống quản lý
          </p>
        </div>
        
        <div style={{ padding: '1.5rem 2rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Loại tài khoản
                </label>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  <button 
                    type="button"
                    onClick={() => setRole('staff')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid',
                      borderColor: role === 'staff' ? '#0ea5e9' : '#e5e7eb',
                      backgroundColor: role === 'staff' ? '#e0f2fe' : 'white',
                      color: role === 'staff' ? '#0369a1' : '#6b7280',
                      fontWeight: role === 'staff' ? 600 : 400,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Nhân viên
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('family')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid',
                      borderColor: role === 'family' ? '#0ea5e9' : '#e5e7eb',
                      backgroundColor: role === 'family' ? '#e0f2fe' : 'white',
                      color: role === 'family' ? '#0369a1' : '#6b7280',
                      fontWeight: role === 'family' ? 600 : 400,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Gia đình
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label 
                  htmlFor="email" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
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
                      padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      color: '#111827',
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="password" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <LockClosedIcon style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={role}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      color: '#111827',
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      style={{
                        borderRadius: '0.25rem',
                        marginRight: '0.5rem'
                      }}
                    />
                    <label 
                      htmlFor="remember-me" 
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <a 
                    href="#" 
                    style={{
                      fontSize: '0.875rem',
                      color: '#0369a1',
                      fontWeight: 500
                    }}
                  >
                    Quên mật khẩu?
                  </a>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
          
          {/* Thông tin demo */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: '#4b5563'
          }}>
            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Demo đăng nhập:</p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Nhân viên: staff@example.com / staff</li>
              <li>Gia đình: family@example.com / family</li>
              <li>Quản trị viên: admin@example.com / admin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 