"use client";

import { useState } from 'react';
import { 
  UserCircleIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+84 123 456 789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    dateOfBirth: '1985-06-15',
    department: user?.role === 'staff' ? 'Chăm sóc bệnh nhân' : '',
    startDate: '2020-01-15',
    bio: 'Tôi là một nhân viên y tế với hơn 10 năm kinh nghiệm trong lĩnh vực chăm sóc người cao tuổi.'
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving profile data:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '+84 123 456 789',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      dateOfBirth: '1985-06-15',
      department: user?.role === 'staff' ? 'Chăm sóc bệnh nhân' : '',
      startDate: '2020-01-15',
      bio: 'Tôi là một nhân viên y tế với hơn 10 năm kinh nghiệm trong lĩnh vực chăm sóc người cao tuổi.'
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}>
                <UserCircleIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Hồ sơ cá nhân
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Quản lý thông tin tài khoản của bạn
                </p>
              </div>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                }}
              >
                <PencilIcon style={{width: '1.125rem', height: '1.125rem'}} />
                Chỉnh sửa
              </button>
            ) : (
              <div style={{display: 'flex', gap: '0.75rem'}}>
                <button 
                  onClick={handleSave}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CheckIcon style={{width: '1.125rem', height: '1.125rem'}} />
                  Lưu
                </button>
                <button 
                  onClick={handleCancel}
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
                >
                  <XMarkIcon style={{width: '1.125rem', height: '1.125rem'}} />
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Avatar and Basic Info */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{
                position: 'relative',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '8rem',
                  height: '8rem',
                  borderRadius: '2rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                  border: '4px solid white'
                }}>
                  {user?.name?.substring(0, 2).toUpperCase() || 'ND'}
                </div>
                <button style={{
                  position: 'absolute',
                  bottom: '0.25rem',
                  right: '0.25rem',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}>
                  <CameraIcon style={{width: '1rem', height: '1rem', color: 'white'}} />
                </button>
              </div>
              
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 0.5rem 0'
              }}>
                {formData.name}
              </h2>
              
              <div style={{
                display: 'inline-flex',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: user?.role === 'admin' 
                  ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
                  : user?.role === 'staff'
                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                  : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                color: user?.role === 'admin' ? '#1e40af' : user?.role === 'staff' ? '#166534' : '#92400e',
                border: '1px solid',
                borderColor: user?.role === 'admin' ? '#93c5fd' : user?.role === 'staff' ? '#86efac' : '#fbbf24'
              }}>
                {user?.role === 'admin' ? 'Quản trị viên' : 
                 user?.role === 'staff' ? 'Nhân viên' : 'Thành viên gia đình'}
              </div>
            </div>

            {/* Bio Section */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 1rem 0'
              }}>
                Giới thiệu
              </h3>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    background: 'white'
                  }}
                />
              ) : (
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {formData.bio}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <EnvelopeIcon style={{width: '1.25rem', height: '1.25rem', color: '#6366f1'}} />
              Thông tin liên hệ
            </h3>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <EnvelopeIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    <span style={{fontSize: '0.875rem', color: '#111827'}}>{formData.email}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <PhoneIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    <span style={{fontSize: '0.875rem', color: '#111827'}}>{formData.phone}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Địa chỉ
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <MapPinIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    <span style={{fontSize: '0.875rem', color: '#111827'}}>{formData.address}</span>
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngày sinh
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <CalendarIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    <span style={{fontSize: '0.875rem', color: '#111827'}}>
                      {new Date(formData.dateOfBirth).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Work Information for Staff */}
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Phòng ban
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.875rem'
                        }}
                      />
                    ) : (
                      <div style={{
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        <span style={{fontSize: '0.875rem', color: '#111827'}}>{formData.department}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Ngày bắt đầu làm việc
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <CalendarIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                      <span style={{fontSize: '0.875rem', color: '#111827'}}>
                        {new Date(formData.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 