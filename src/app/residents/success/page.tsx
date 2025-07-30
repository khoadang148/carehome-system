"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  UserIcon, 
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface AccountInfo {
  username: string;
  password: string;
  email: string;
  role: string;
  residentName: string;
  existingAccount?: boolean;
  familyName?: string;
  familyUsername?: string;
}

export default function ResidentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  useEffect(() => {
    // Lấy thông tin từ URL params hoặc localStorage
    const residentName = searchParams.get('residentName');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const existingAccount = searchParams.get('existingAccount');
    const familyName = searchParams.get('familyName');
    const familyUsername = searchParams.get('familyUsername');

    if (residentName) {
      if (existingAccount === 'true' && familyName && familyUsername) {
        // Trường hợp gán vào tài khoản hiện có
        setAccountInfo({
          residentName,
          username: familyUsername,
          password: '',
          email: '',
          role: 'family',
          existingAccount: true,
          familyName,
          familyUsername
        });
      } else if (username && password && email && role) {
        // Trường hợp tạo tài khoản mới
        setAccountInfo({
          residentName,
          username,
          password,
          email,
          role
        });
      } else {
        // Nếu không có params, thử lấy từ localStorage
        const storedInfo = localStorage.getItem('newResidentAccount');
        if (storedInfo) {
          setAccountInfo(JSON.parse(storedInfo));
          // Xóa thông tin khỏi localStorage sau khi lấy
          localStorage.removeItem('newResidentAccount');
        } else {
          // Nếu không có thông tin, chuyển về trang residents
          router.push('/residents');
        }
      }
    } else {
      // Nếu không có thông tin, chuyển về trang residents
      router.push('/residents');
    }
  }, [searchParams, router]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'family':
        return 'Gia đình';
      case 'staff':
        return 'Nhân viên';
      case 'admin':
        return 'Quản trị viên';
      default:
        return role;
    }
  };

  if (!accountInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <Link href="/residents" style={{
            marginRight: '1rem', 
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(34, 197, 94, 0.1)',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}>
            <ArrowLeftIcon style={{height: '1.25rem', width: '1.25rem'}} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
              }}>
                <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <h1 style={{
                fontSize: '1.875rem', 
                fontWeight: 700, 
                margin: 0,
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                Tạo thành công!
              </h1>
            </div>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Cư dân và tài khoản đã được tạo thành công
            </p>
          </div>
        </div>

        {/* Success Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          {/* Success Header */}
          <div style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            padding: '2rem',
            textAlign: 'center',
            color: 'white'
          }}>
            <CheckCircleIcon style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1rem auto',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
            }} />
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0'
            }}>
              Hoàn thành!
            </h2>
            <p style={{
              fontSize: '1rem',
              margin: 0,
              opacity: 0.9
            }}>
              Cư dân <strong>{accountInfo.residentName}</strong> đã được thêm vào hệ thống
              {accountInfo.existingAccount && (
                <span> và gán vào tài khoản gia đình hiện có</span>
              )}
            </p>
          </div>

          {/* Account Information */}
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: accountInfo.existingAccount 
                ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '0.75rem',
              border: accountInfo.existingAccount ? '1px solid #86efac' : '1px solid #bae6fd'
            }}>
              <UserIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                color: accountInfo.existingAccount ? '#16a34a' : '#0284c7' 
              }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: 0,
                color: accountInfo.existingAccount ? '#166534' : '#0c4a6e'
              }}>
                {accountInfo.existingAccount ? 'Thông tin tài khoản gia đình' : 'Thông tin tài khoản đã tạo'}
              </h3>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {accountInfo.existingAccount ? (
                // Hiển thị thông tin tài khoản hiện có
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Tên tài khoản gia đình
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#166534'
                      }}>
                        {accountInfo.familyName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Tên đăng nhập
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#166534',
                        fontFamily: 'monospace'
                      }}>
                        {accountInfo.familyUsername}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Vai trò
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#166534'
                      }}>
                        {getRoleDisplayName(accountInfo.role)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // Hiển thị thông tin tài khoản mới
                <>
                  {/* Username */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Tên đăng nhập
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        flex: 1,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827',
                        fontFamily: 'monospace'
                      }}>
                        {accountInfo.username}
                      </span>
                      <button
                        onClick={() => copyToClipboard(accountInfo.username, 'username')}
                        style={{
                          padding: '0.5rem',
                          background: copiedField === 'username' ? '#22c55e' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {copiedField === 'username' ? (
                          <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                        {copiedField === 'username' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Mật khẩu
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        flex: 1,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827',
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em'
                      }}>
                        {showPassword ? accountInfo.password : '•'.repeat(accountInfo.password.length)}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          padding: '0.5rem',
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {showPassword ? (
                          <EyeSlashIcon style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(accountInfo.password, 'password')}
                        style={{
                          padding: '0.5rem',
                          background: copiedField === 'password' ? '#22c55e' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {copiedField === 'password' ? (
                          <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                        {copiedField === 'password' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Email
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        flex: 1,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827'
                      }}>
                        {accountInfo.email}
                      </span>
                      <button
                        onClick={() => copyToClipboard(accountInfo.email, 'email')}
                        style={{
                          padding: '0.5rem',
                          background: copiedField === 'email' ? '#22c55e' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {copiedField === 'email' ? (
                          <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                        {copiedField === 'email' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Vai trò
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827'
                      }}>
                        {getRoleDisplayName(accountInfo.role)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Important Notice */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: accountInfo.existingAccount 
                ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: accountInfo.existingAccount ? '1px solid #16a34a' : '1px solid #f59e0b',
              borderRadius: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  background: accountInfo.existingAccount ? '#16a34a' : '#f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0.125rem'
                }}>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {accountInfo.existingAccount ? '✓' : '!'}
                  </span>
                </div>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: accountInfo.existingAccount ? '#166534' : '#92400e',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {accountInfo.existingAccount ? 'Thông tin quan trọng' : 'Lưu ý quan trọng'}
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    color: accountInfo.existingAccount ? '#166534' : '#92400e',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    {accountInfo.existingAccount ? (
                      <>
                        <li>Cư dân đã được gán thành công vào tài khoản gia đình hiện có</li>
                        <li>Tài khoản gia đình này có thể quản lý nhiều cư dân</li>
                        <li>Người dùng có thể đăng nhập bằng thông tin tài khoản hiện có</li>
                        <li>Liên hệ quản trị viên nếu cần hỗ trợ thêm</li>
                      </>
                    ) : (
                      <>
                        <li>Vui lòng lưu lại thông tin đăng nhập này một cách an toàn</li>
                        <li>Mật khẩu sẽ không thể xem lại sau khi rời khỏi trang này</li>
                        <li>Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                        <li>Nếu quên mật khẩu, liên hệ quản trị viên để được hỗ trợ</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/residents"
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <UserIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Xem danh sách cư dân
          </Link>
          
          <Link
            href="/admin/account-management"
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}
          >
            <KeyIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Quản lý tài khoản
          </Link>
          
          <Link
            href="/"
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
            }}
          >
            <HomeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Về trang chủ
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        a:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
} 