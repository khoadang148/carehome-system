"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  UserCircleIcon,
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClockIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface StaffProfile {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  position: string;
  department: string;
  hireDate: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  certification: string;
  workExperience: string;
  specializations: string;
  // Fields that only admin can edit
  salary?: number;
  benefits?: string[];
  performanceRating?: number;
  managerNotes?: string;
}

export default function StaffProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableFields, setEditableFields] = useState<Partial<StaffProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadStaffProfile();
  }, []);

  const loadStaffProfile = () => {
    // Mock data - trong thực tế sẽ load từ API dựa trên user ID
    const mockProfile: StaffProfile = {
      id: 1,
      name: 'Nguyễn Văn A',
      firstName: 'Văn A',
      lastName: 'Nguyễn',
      dateOfBirth: '1985-06-12',
      gender: 'male',
      idNumber: '001234567890',
      position: 'Y tá trưởng',
      department: 'Y tế',
      hireDate: '2022-03-15',
      email: 'nguyenvana@nursehome.com',
      phone: '0901234567',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      emergencyContact: 'Nguyễn Thị B (Vợ)',
      emergencyPhone: '0907654321',
      certification: 'RN, BSN, Chứng chỉ Điều dưỡng viên',
      workExperience: '8 năm kinh nghiệm trong lĩnh vực chăm sóc người cao tuổi',
      specializations: 'Chăm sóc bệnh nhân mãn tính, Quản lý thuốc, Sơ cấp cứu',
      // Admin-only fields
      salary: 15000000,
      benefits: ['Bảo hiểm y tế', 'Phụ cấp ca đêm', 'Thưởng hiệu suất'],
      performanceRating: 4.5,
      managerNotes: 'Nhân viên xuất sắc, có khả năng lãnh đạo tốt'
    };
    
    setProfile(mockProfile);
    setEditableFields(mockProfile);
    setLoading(false);
  };

  const handleEdit = () => {
    setEditMode(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditableFields(profile || {});
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update profile with only editable fields
      const updatedProfile = {
        ...profile!,
        phone: editableFields.phone || profile!.phone,
        address: editableFields.address || profile!.address,
        emergencyContact: editableFields.emergencyContact || profile!.emergencyContact,
        emergencyPhone: editableFields.emergencyPhone || profile!.emergencyPhone,
        specializations: editableFields.specializations || profile!.specializations
      };
      
      setProfile(updatedProfile);
      setEditMode(false);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof StaffProfile, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Define which fields staff can edit
  const editableFieldsList = ['phone', 'address', 'emergencyContact', 'emergencyPhone', 'specializations'];
  
  const canEdit = (field: string) => {
    if (field === 'specializations') {
      return user?.role === 'admin';
    }
    return editableFieldsList.includes(field);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#ef4444' }}>Không thể tải thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back Button */}
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
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>

        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <UserCircleIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Hồ Sơ Cá Nhân
                </h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Quản lý thông tin cá nhân và chứng nhận nghề nghiệp
              </p>
            </div>
            
            {!editMode ? (
              <button
                onClick={handleEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                Chỉnh sửa
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: saving 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message.type === 'success' ? (
                <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
              ) : (
                <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
              )}
              <p style={{
                margin: 0,
                color: message.type === 'success' ? '#059669' : '#dc2626',
                fontWeight: 500
              }}>
                {message.text}
              </p>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Basic Information */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <IdentificationIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
              Thông tin cơ bản
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Họ và tên {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {profile.name}
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
                  Ngày sinh {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}
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
                  CCCD/CMND {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {profile.idNumber}
                </div>
                
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
              Thông tin liên hệ
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {profile.email}
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
                  Số điện thoại {editMode && (
                    canEdit('phone')
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                {editMode && canEdit('phone') ? (
                  <input
                    type="tel"
                    value={editableFields.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: canEdit('phone') ? '#f0f9ff' : '#f9fafb',
                    border: `1px solid ${canEdit('phone') ? '#bfdbfe' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    color: '#374151'
                  }}>
                    {profile.phone}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Địa chỉ {editMode && (
                    canEdit('address')
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                {editMode && canEdit('address') ? (
                  <textarea
                    value={editableFields.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: canEdit('address') ? '#f0f9ff' : '#f9fafb',
                    border: `1px solid ${canEdit('address') ? '#bfdbfe' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    color: '#374151',
                    minHeight: '4rem'
                  }}>
                    {profile.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
              Liên hệ khẩn cấp
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Người liên hệ {editMode && (
                    canEdit('emergencyContact')
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                {editMode && canEdit('emergencyContact') ? (
                  <input
                    type="text"
                    value={editableFields.emergencyContact || ''}
                    onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: canEdit('emergencyContact') ? '#f0f9ff' : '#f9fafb',
                    border: `1px solid ${canEdit('emergencyContact') ? '#bfdbfe' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    color: '#374151'
                  }}>
                    {profile.emergencyContact}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Số điện thoại khẩn cấp {editMode && (
                    canEdit('emergencyPhone')
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                {editMode && canEdit('emergencyPhone') ? (
                  <input
                    type="tel"
                    value={editableFields.emergencyPhone || ''}
                    onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: canEdit('emergencyPhone') ? '#f0f9ff' : '#f9fafb',
                    border: `1px solid ${canEdit('emergencyPhone') ? '#bfdbfe' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    color: '#374151'
                  }}>
                    {profile.emergencyPhone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BriefcaseIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              Thông tin nghề nghiệp
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Chức vụ {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {profile.position}
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
                  Phòng ban {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {profile.department}
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
                  Ngày vào làm {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}>
                  {new Date(profile.hireDate).toLocaleDateString('vi-VN')}
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
                  Chứng chỉ {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  minHeight: '3rem'
                }}>
                  {profile.certification}
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
                  Kinh nghiệm làm việc {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  minHeight: '3rem'
                }}>
                  {profile.workExperience}
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
                  Chuyên môn {editMode && (
                    user?.role === 'admin'
                      ? <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                      : <span style={{ color: '#ef4444', marginLeft: 8 }}>✗ Chỉ QTV mới chỉnh sửa được</span>
                  )}
                </label>
                {editMode && canEdit('specializations') ? (
                  <textarea
                    value={editableFields.specializations || ''}
                    onChange={(e) => handleFieldChange('specializations', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: canEdit('specializations') ? '#f0f9ff' : '#f9fafb',
                    border: `1px solid ${canEdit('specializations') ? '#bfdbfe' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    color: '#374151',
                    minHeight: '4rem'
                  }}>
                    {profile.specializations}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin-only Information */}
          {user?.role === 'admin' && (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #fbbf24'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AcademicCapIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                Thông tin quản lý (Chỉ Admin)
              </h2>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mức lương {editMode && (
                      <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ QTV có thể chỉnh sửa</span>
                    )}
                  </label>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '0.5rem',
                    color: '#92400e'
                  }}>
                    {profile.salary?.toLocaleString('vi-VN')} VNĐ/tháng
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
                    Đánh giá hiệu suất {editMode && (
                      <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ admin có thể chỉnh sửa</span>
                    )}
                  </label>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '0.5rem',
                    color: '#92400e'
                  }}>
                    {profile.performanceRating}/5.0
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
                    Ghi chú của quản lý {editMode && (
                      <span style={{ color: '#10b981', marginLeft: 8 }}>✓ Chỉ admin có thể chỉnh sửa</span>
                    )}
                  </label>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '0.5rem',
                    color: '#92400e',
                    minHeight: '3rem'
                  }}>
                    {profile.managerNotes}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
