"use client";

import { useState } from 'react';
import { 
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationSound: true,
    
    // Privacy settings
    profileVisibility: 'private',
    activityStatus: true,
    
    // Security settings
    twoFactorAuth: false,
    loginAlerts: true,
    
    // Appearance settings
    theme: 'light',
    language: 'vi',
    fontSize: 'medium',
    
    // System settings
    autoLogout: '30',
    sessionTimeout: '60'
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    // TODO: Implement save functionality
  };

  const handleChangePassword = () => {
    setPasswordError('');
    
    if (passwords.new !== passwords.confirm) {
      setPasswordError('Mật khẩu mới không khớp!');
      return;
    }
    
    if (passwords.new.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    
    // Simulate API call
    console.log('Changing password...');
    setShowPasswordSuccess(true);
    setPasswords({ current: '', new: '', confirm: '' });
    
    setTimeout(() => {
      setShowPasswordSuccess(false);
    }, 3000);
  };

  const SettingCard = ({ title, description, children }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
          margin: '0 0 0.25rem 0'
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: 0
        }}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange, label }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 0'
    }}>
      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '3rem',
          height: '1.5rem',
          background: checked ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#d1d5db',
          borderRadius: '9999px',
          border: 'none',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '1.25rem',
          height: '1.25rem',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '0.125rem',
          left: checked ? '1.625rem' : '0.125rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }} />
      </button>
    </div>
  );

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
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <Cog6ToothIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Cài đặt tài khoản
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Quản lý cài đặt và tùy chọn của bạn
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleSaveSettings}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
            >
              <ShieldCheckIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Lưu cài đặt
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Notification Settings */}
          <SettingCard
            title="Thông báo"
            description="Quản lý cách bạn nhận thông báo từ hệ thống"
          >
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <Toggle
                checked={settings.emailNotifications}
                onChange={(checked) => handleSettingChange('emailNotifications', checked)}
                label="Thông báo qua email"
              />
              <Toggle
                checked={settings.pushNotifications}
                onChange={(checked) => handleSettingChange('pushNotifications', checked)}
                label="Thông báo đẩy"
              />
              <Toggle
                checked={settings.smsNotifications}
                onChange={(checked) => handleSettingChange('smsNotifications', checked)}
                label="Thông báo SMS"
              />
              <Toggle
                checked={settings.notificationSound}
                onChange={(checked) => handleSettingChange('notificationSound', checked)}
                label="Âm thanh thông báo"
              />
            </div>
          </SettingCard>

          {/* Privacy Settings */}
          <SettingCard
            title="Quyền riêng tư"
            description="Kiểm soát ai có thể xem thông tin của bạn"
          >
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Hiển thị hồ sơ
                </label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư</option>
                  <option value="team">Chỉ đội ngũ</option>
                </select>
              </div>
              <Toggle
                checked={settings.activityStatus}
                onChange={(checked) => handleSettingChange('activityStatus', checked)}
                label="Hiển thị trạng thái hoạt động"
              />
            </div>
          </SettingCard>

          {/* Security Settings */}
          <SettingCard
            title="Bảo mật"
            description="Cài đặt bảo mật và xác thực cho tài khoản"
          >
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <Toggle
                checked={settings.twoFactorAuth}
                onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                label="Xác thực hai yếu tố"
              />
              <Toggle
                checked={settings.loginAlerts}
                onChange={(checked) => handleSettingChange('loginAlerts', checked)}
                label="Thông báo đăng nhập"
              />
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tự động đăng xuất (phút)
                </label>
                <select
                  value={settings.autoLogout}
                  onChange={(e) => handleSettingChange('autoLogout', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="15">15 phút</option>
                  <option value="30">30 phút</option>
                  <option value="60">1 giờ</option>
                  <option value="120">2 giờ</option>
                  <option value="never">Không bao giờ</option>
                </select>
              </div>
            </div>
          </SettingCard>

          {/* Appearance Settings */}
          <SettingCard
            title="Giao diện"
            description="Tùy chỉnh giao diện và ngôn ngữ"
          >
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Chế độ hiển thị
                </label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button
                    onClick={() => handleSettingChange('theme', 'light')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      background: settings.theme === 'light' ? '#e0e7ff' : 'white',
                      color: settings.theme === 'light' ? '#3730a3' : '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <SunIcon style={{width: '1rem', height: '1rem'}} />
                    Sáng
                  </button>
                  <button
                    onClick={() => handleSettingChange('theme', 'dark')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      background: settings.theme === 'dark' ? '#1f2937' : 'white',
                      color: settings.theme === 'dark' ? 'white' : '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <MoonIcon style={{width: '1rem', height: '1rem'}} />
                    Tối
                  </button>
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngôn ngữ
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </SettingCard>

          {/* Password Change */}
          <div style={{
            gridColumn: '1 / -1'
          }}>
            <SettingCard
              title="Đổi mật khẩu"
              description="Cập nhật mật khẩu để bảo mật tài khoản"
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mật khẩu hiện tại
                  </label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => handlePasswordChange('current', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '2.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword.current ? 
                        <EyeSlashIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} /> :
                        <EyeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mật khẩu mới
                  </label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => handlePasswordChange('new', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '2.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword.new ? 
                        <EyeSlashIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} /> :
                        <EyeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Xác nhận mật khẩu mới
                  </label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '2.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword.confirm ? 
                        <EyeSlashIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} /> :
                        <EyeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                      }
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Error/Success Messages */}
              {passwordError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ExclamationTriangleIcon style={{width: '1rem', height: '1rem'}} />
                  {passwordError}
                </div>
              )}

              {showPasswordSuccess && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#16a34a',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircleIcon style={{width: '1rem', height: '1rem'}} />
                  Mật khẩu đã được thay đổi thành công!
                </div>
              )}

              <div style={{marginTop: '1.5rem'}}>
                <button 
                  onClick={handleChangePassword}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <KeyIcon style={{width: '1.125rem', height: '1.125rem'}} />
                  Đổi mật khẩu
                </button>
              </div>
            </SettingCard>
          </div>
        </div>
      </div>
    </div>
  );
} 