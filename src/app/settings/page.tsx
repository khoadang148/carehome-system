"use client";

import { useState } from 'react';
import { 
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// Validation interfaces
interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

export default function SettingsPage() {
  const router = useRouter();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: '', color: '#d1d5db' });

  // Validation functions
  const validateCurrentPassword = (password: string): string => {
    if (!password) {
      return 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (password.length < 6) {
      return 'Mật khẩu hiện tại không hợp lệ';
    }
    return '';
  };

  const validateNewPassword = (password: string): string => {
    if (!password) {
      return 'Vui lòng nhập mật khẩu mới';
    }
    if (password.length < 8) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ cái thường';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ cái hoa';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)';
    }
    if (password === currentPassword) {
      return 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPwd: string): string => {
    if (!confirmPwd) {
      return 'Vui lòng xác nhận mật khẩu mới';
    }
    if (confirmPwd !== newPassword) {
      return 'Xác nhận mật khẩu không khớp';
    }
    return '';
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    let feedback = 'Rất yếu';
    let color = '#ef4444';

    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Rất yếu';
        color = '#ef4444';
        break;
      case 2:
        feedback = 'Yếu';
        color = '#f97316';
        break;
      case 3:
        feedback = 'Trung bình';
        color = '#eab308';
        break;
      case 4:
        feedback = 'Mạnh';
        color = '#22c55e';
        break;
      case 5:
        feedback = 'Rất mạnh';
        color = '#16a34a';
        break;
    }

    return { score, feedback, color };
  };

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    const error = validateCurrentPassword(value);
    setErrors(prev => ({ ...prev, currentPassword: error }));
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    const error = validateNewPassword(value);
    setErrors(prev => ({ ...prev, newPassword: error }));
    setPasswordStrength(calculatePasswordStrength(value));
    
    // Re-validate confirm password if it exists
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    const error = validateConfirmPassword(value);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const handleChangePassword = async () => {
    // Validate all fields
    const currentError = validateCurrentPassword(currentPassword);
    const newError = validateNewPassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword);

    const newErrors = {
      currentPassword: currentError,
      newPassword: newError,
      confirmPassword: confirmError
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (currentError || newError || confirmError) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Password changed successfully');
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setPasswordStrength({ score: 0, feedback: '', color: '#d1d5db' });
      
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 4000);
    } catch (error) {
      setErrors({ currentPassword: 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <>
      {/* Nút quay lại sticky trên cùng, sát mép trái */}
      <div
        style={{
          top: 0,
          left: 0,
          zIndex: 50,
          background: '#f8fafc',
          padding: '1.5rem 0 0 1.5rem'
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
      </div>
      {/* Nội dung chính */}
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          padding: '0 1rem 1.5rem 1rem'
        }}
      >
        <div style={{ maxWidth:'600px', margin:'0 auto' }}>
          {/* Header Section */}
          <div style={{ 
            background:'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius:'1.5rem',
            padding:'2rem',
            marginBottom:'2rem',
            boxShadow:'0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)', 
            border:'1px solid rgba(255, 255, 255, 0.2)', 
            backdropFilter:'blur(10px)', 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
              }}>
                <CogIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize:'1.8rem',
                  fontWeight:'800',
                  color:'#1e40af',
                  margin:'0',
                  letterSpacing:'-0.025em',
                  lineHeight:'1.2'
                }}>
                  Cài đặt hệ thống
                </h1>
                <p style={{ 
                  fontSize:'0.9rem',
                  color:'#64748b',
                  margin:'0.75rem 0 0 0',
                  fontWeight:'500',
                  letterSpacing:'0.01em'
                }}>
                  Quản lý và thay đổi mật khẩu truy cập
                </p>
              </div>
            </div>
          </div>



          {/* Password Change */}
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 1rem 0'
            }}>
              Đổi mật khẩu
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {/* Current Password */}
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
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingRight: '2.5rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${errors.currentPassword ? '#ef4444' : '#d1d5db'}`,
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
                    {showCurrentPassword ? 
                      <EyeSlashIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} /> :
                      <EyeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    }
                  </button>
                </div>
                {errors.currentPassword && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.currentPassword}
                  </div>
                )}
              </div>

              {/* New Password */}
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
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingRight: '2.5rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${errors.newPassword ? '#ef4444' : '#d1d5db'}`,
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
                    {showNewPassword ? 
                      <EyeSlashIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} /> :
                      <EyeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    }
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Độ mạnh mật khẩu:</span>
                      <span style={{ fontSize: '0.75rem', color: passwordStrength.color, fontWeight: 500 }}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '0.25rem',
                      background: '#e5e7eb',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        height: '100%',
                        background: passwordStrength.color,
                        transition: 'width 0.3s ease, background 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
                
                {errors.newPassword && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.newPassword}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingRight: '2.5rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
                    {showConfirmPassword ? 
                      <EyeSlashIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} /> :
                      <EyeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    }
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ 
                borderTop: '1px solid #f3f4f6', 
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                alignItems: 'center'
              }}>
                {passwordSuccess && (
                  <div style={{
                    color: '#16a34a',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CheckCircleIcon style={{width: '1rem', height: '1rem'}} />
                    Đổi mật khẩu thành công!
                  </div>
                )}
                
                <button
                  onClick={handleChangePassword}
                  disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                  style={{
                    background: isSubmitting || !currentPassword || !newPassword || !confirmPassword ? '#9ca3af' : '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isSubmitting || !currentPassword || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && currentPassword && newPassword && confirmPassword) {
                      e.currentTarget.style.background = '#047857';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && currentPassword && newPassword && confirmPassword) {
                      e.currentTarget.style.background = '#059669';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon style={{width: '1rem', height: '1rem'}} />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </>
  );
} 
