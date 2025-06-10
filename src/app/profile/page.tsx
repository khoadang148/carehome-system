"use client";

import { useState } from 'react';
import { 
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

// Validation types
interface ValidationErrors {
  [key: string]: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  department: string;
  startDate: string;
  relationship: string;
}

// Family members data (matching family page)
const familyMembers = [
  { 
    id: 1, 
    name: 'Nguyễn Văn Nam', 
    room: 'A01', 
    age: 78,
    relationship: 'Cha',
    status: 'Ổn định'
  },
  { 
    id: 2, 
    name: 'Lê Thị Hoa', 
    room: 'A02', 
    age: 75,
    relationship: 'Mẹ',
    status: 'Khá'
  }
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(familyMembers[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+84 123 456 789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    dateOfBirth: '1985-06-15',
    department: user?.role === 'staff' ? 'Chăm sóc bệnh nhân' : '',
    startDate: '2020-01-15',
    relationship: user?.role === 'family' ? 'Con' : '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation functions
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Họ và tên là bắt buộc';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        if (value.trim().length > 50) return 'Họ và tên không được vượt quá 50 ký tự';
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value.trim())) return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
        return '';

      case 'email':
        if (!value.trim()) return 'Email là bắt buộc';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Định dạng email không hợp lệ';
        return '';

      case 'phone':
        if (!value.trim()) return 'Số điện thoại là bắt buộc';
        const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Số điện thoại không hợp lệ (VD: +84 987 654 321)';
        return '';

      case 'address':
        if (!value.trim()) return 'Địa chỉ là bắt buộc';
        if (value.trim().length < 5) return 'Địa chỉ phải có ít nhất 5 ký tự';
        if (value.trim().length > 200) return 'Địa chỉ không được vượt quá 200 ký tự';
        return '';

      case 'dateOfBirth':
        if (!value) return 'Ngày sinh là bắt buộc';
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) return 'Tuổi phải từ 18 trở lên';
        if (age > 100) return 'Ngày sinh không hợp lệ';
        return '';

      case 'department':
        if ((user?.role === 'staff' || user?.role === 'admin') && !value.trim()) {
          return 'Phòng ban là bắt buộc';
        }
        if (value && value.trim().length > 100) return 'Tên phòng ban không được vượt quá 100 ký tự';
        return '';

      case 'relationship':
        if (user?.role === 'family' && !value.trim()) {
          return 'Mối quan hệ là bắt buộc';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const fields = ['name', 'email', 'phone', 'address', 'dateOfBirth'];
    
    // Add role-specific fields
    if (user?.role === 'staff' || user?.role === 'admin') {
      fields.push('department');
    }
    if (user?.role === 'family') {
      fields.push('relationship');
    }

    fields.forEach(field => {
      const error = validateField(field, formData[field as keyof FormData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
      dateOfBirth: true,
      department: true,
      relationship: true
    });

    if (!validateForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving profile data:', formData);
    setIsEditing(false);
      setTouched({});
      // Show success message (could add toast notification here)
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle save error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '+84 123 456 789',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      dateOfBirth: '1985-06-15',
      department: user?.role === 'staff' ? 'Chăm sóc bệnh nhân' : '',
      startDate: '2020-01-15',
      relationship: user?.role === 'family' ? 'Con' : '',
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation for touched fields
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    const error = validateField(field, formData[field as keyof FormData]);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const getRoleBadge = () => {
    const roleConfig = {
      admin: { label: 'Quản trị viên', color: '#3b82f6', bg: '#dbeafe' },
      staff: { label: 'Nhân viên', color: '#059669', bg: '#dcfce7' },
      family: { label: 'Người thân', color: '#d97706', bg: '#fef3c7' }
    };
    const config = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.family;
    return (
      <span style={{
        display: 'inline-flex',
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}20`
      }}>
        {config.label}
      </span>
    );
  };

  // Error message component
  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        marginTop: '0.25rem',
        fontSize: '0.75rem',
        color: '#dc2626'
      }}>
        <ExclamationTriangleIcon style={{ width: '0.875rem', height: '0.875rem' }} />
        {error}
      </div>
    );
  };

  // Input field with validation
  const renderInput = (
    type: string,
    name: string,
    value: string,
    placeholder?: string,
    isTextarea?: boolean
  ) => {
    const hasError = touched[name] && errors[name];
    const baseStyle = {
      width: '100%',
      padding: '0.5rem',
      borderRadius: '0.375rem',
      border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
      fontSize: '0.875rem',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      outline: 'none'
    };

    const focusStyle = hasError ? {
      borderColor: '#dc2626',
      boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)'
    } : {
      borderColor: '#6366f1',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
    };

    if (isTextarea) {
      return (
        <textarea
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(e) => handleInputChange(name, e.target.value)}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => {
            handleFieldBlur(name);
            e.target.style.borderColor = hasError ? '#dc2626' : '#d1d5db';
            e.target.style.boxShadow = 'none';
          }}
          style={baseStyle}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleInputChange(name, e.target.value)}
        onFocus={(e) => Object.assign(e.target.style, focusStyle)}
        onBlur={(e) => {
          handleFieldBlur(name);
          e.target.style.borderColor = hasError ? '#dc2626' : '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
        style={baseStyle}
      />
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
              <div>
                <h1 style={{
              fontSize: '1.875rem',
                  fontWeight: 700, 
              color: '#111827',
              margin: '0 0 0.25rem 0'
                }}>
                  Hồ sơ cá nhân
                </h1>
                <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              Quản lý thông tin tài khoản
            </p>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#6366f1',
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
              onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
            >
              <PencilIcon style={{width: '1rem', height: '1rem'}} />
              Chỉnh sửa
            </button>
          ) : (
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: isSubmitting ? '#9ca3af' : '#10b981',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                <CheckIcon style={{width: '1rem', height: '1rem'}} />
                {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button 
                  onClick={handleCancel}
                  style={{
                  display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  background: '#ef4444',
                    color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                    border: 'none',
                  fontWeight: 500,
                    fontSize: '0.875rem',
                  cursor: 'pointer'
                  }}
                >
                <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                  Hủy
                </button>
              </div>
            )}
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Avatar & Basic Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: '5rem',
              height: '5rem',
              borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
              fontSize: '1.5rem',
                  fontWeight: 700,
              flexShrink: 0
                }}>
                  {user?.name?.substring(0, 2).toUpperCase() || 'ND'}
              </div>
              
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                margin: '0 0 0.5rem 0'
              }}>
                {formData.name}
              </h2>
              {getRoleBadge()}
            </div>
          </div>

          {/* Information Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Contact Info */}
            <div>
            <h3 style={{
                fontSize: '1rem',
              fontWeight: 600,
                color: '#374151',
                margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
                <EnvelopeIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
              Thông tin liên hệ
            </h3>

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Email
                </label>
                {isEditing ? (
                    <div>
                      {renderInput('email', 'email', formData.email, 'Nhập địa chỉ email')}
                      <ErrorMessage error={touched.email ? errors.email : undefined} />
                    </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <EnvelopeIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                      {formData.email}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Số điện thoại
                </label>
                {isEditing ? (
                    <div>
                      {renderInput('tel', 'phone', formData.phone, 'Nhập số điện thoại')}
                      <ErrorMessage error={touched.phone ? errors.phone : undefined} />
                    </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <PhoneIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                      {formData.phone}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Địa chỉ
                </label>
                {isEditing ? (
                    <div>
                      {renderInput('text', 'address', formData.address, 'Nhập địa chỉ', true)}
                      <ErrorMessage error={touched.address ? errors.address : undefined} />
                    </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <MapPinIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                      {formData.address}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Ngày sinh
                </label>
                {isEditing ? (
                    <div>
                      {renderInput('date', 'dateOfBirth', formData.dateOfBirth, '')}
                      <ErrorMessage error={touched.dateOfBirth ? errors.dateOfBirth : undefined} />
                    </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <CalendarIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                      {new Date(formData.dateOfBirth).toLocaleDateString('vi-VN')}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Role-specific Info */}
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {user?.role === 'family' ? (
                  <>
                    <UserCircleIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
                    Thông tin người thân
                  </>
                ) : (
                  <>
                    <BriefcaseIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
                    Thông tin công việc
                  </>
                )}
              </h3>

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {user?.role === 'family' ? (
                <>
                  <div>
                                          <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Người thân được chăm sóc
                      </label>
                      
                      {familyMembers.length > 1 ? (
                        <div>
                          <select
                            value={selectedFamilyMember.id}
                            onChange={(e) => {
                              const member = familyMembers.find(m => m.id === parseInt(e.target.value));
                              if (member) setSelectedFamilyMember(member);
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              background: 'white',
                              marginBottom: '0.5rem'
                            }}
                          >
                            {familyMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.relationship})
                              </option>
                            ))}
                          </select>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            Phòng {selectedFamilyMember.room} • {selectedFamilyMember.age} tuổi • {selectedFamilyMember.status}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: 500
                          }}>
                            {selectedFamilyMember?.name || 'Chưa được phân công'}
                          </div>
                          {selectedFamilyMember && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginTop: '0.25rem'
                            }}>
                              Phòng {selectedFamilyMember.room} • {selectedFamilyMember.age} tuổi • {selectedFamilyMember.status}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                      fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Mối quan hệ
                    </label>
                    {isEditing ? (
                        <div>
                          <select
                            name="relationship"
                            value={formData.relationship}
                            onChange={(e) => handleInputChange('relationship', e.target.value)}
                        style={{
                          width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: `1px solid ${touched.relationship && errors.relationship ? '#dc2626' : '#d1d5db'}`,
                              fontSize: '0.875rem',
                              background: 'white',
                              transition: 'border-color 0.2s, box-shadow 0.2s',
                              outline: 'none'
                            }}
                            onFocus={(e) => {
                              const hasError = touched.relationship && errors.relationship;
                              e.target.style.borderColor = hasError ? '#dc2626' : '#6366f1';
                              e.target.style.boxShadow = hasError ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(99, 102, 241, 0.1)';
                            }}
                            onBlur={(e) => {
                              handleFieldBlur('relationship');
                              const hasError = touched.relationship && errors.relationship;
                              e.target.style.borderColor = hasError ? '#dc2626' : '#d1d5db';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <option value="">Chọn mối quan hệ</option>
                            <option value="Con">Con</option>
                            <option value="Cháu">Cháu</option>
                            <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                            <option value="Vợ/Chồng">Vợ/Chồng</option>
                            <option value="Người thân khác">Người thân khác</option>
                          </select>
                          <ErrorMessage error={touched.relationship ? errors.relationship : undefined} />
                        </div>
                    ) : (
                      <div style={{
                          fontSize: '0.875rem',
                          color: '#111827'
                        }}>
                          {formData.relationship}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Phòng ban
                      </label>
                      {isEditing ? (
                        <div>
                          {renderInput('text', 'department', formData.department, 'Nhập tên phòng ban')}
                          <ErrorMessage error={touched.department ? errors.department : undefined} />
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#111827'
                        }}>
                          <BriefcaseIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                          {formData.department}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{
                        fontSize: '0.75rem',
                      fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Ngày bắt đầu
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>
                        <CalendarIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                        {new Date(formData.startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
