import { getUserFriendlyError } from '@/lib/utils/error-translations';
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  PencilIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Mock user data
const getUserById = (id: string) => {
  const users = [
    { 
      id: 1, 
      name: 'Admin Nguyễn', 
      email: 'admin@carehome.com',
      role: 'Quản trị viên',
      permissions: ['Đọc', 'Ghi', 'Chỉnh sửa', 'Xóa'],
      department: 'Quản lý',
      phone: '0123456789',
      status: 'Hoạt động',
      joinDate: '2023-01-15'
    },
    { 
      id: 2, 
      name: 'Y tá Trần', 
      email: 'nurse@carehome.com',
      role: 'Y tá',
      permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
      department: 'Y tế',
      phone: '0987654321',
      status: 'Hoạt động',
      joinDate: '2023-02-20'
    },
    { 
      id: 3, 
      name: 'Bác sĩ Lê', 
      email: 'doctor@carehome.com',
      role: 'Bác sĩ',
      permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
      department: 'Y tế',
      phone: '0345678901',
      status: 'Hoạt động',
      joinDate: '2023-01-10'
    }
  ];
  
  return users.find(u => u.id === parseInt(id));
};

interface UserForm {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  permissions: string[];
}

const roles = ['Quản trị viên', 'Bác sĩ', 'Y tá', 'Nhân viên', 'Kế toán'];
const departments = ['Quản lý', 'Y tế', 'Chăm sóc', 'Tài chính'];
const statuses = ['Hoạt động', 'Tạm khóa', 'Nghỉ việc'];
const allPermissions = ['Đọc', 'Ghi', 'Chỉnh sửa', 'Xóa'];

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [originalUser, setOriginalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<UserForm>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: '',
    permissions: []
  });

  const [errors, setErrors] = useState<Partial<UserForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
      
      setTimeout(() => {
        const foundUser = getUserById(resolved.id);
        if (foundUser) {
          setOriginalUser(foundUser);
          setFormData({
            name: foundUser.name,
            email: foundUser.email,
            phone: foundUser.phone || '',
            role: foundUser.role,
            department: foundUser.department,
            status: foundUser.status,
            permissions: foundUser.permissions || []
          });
        }
        setLoading(false);
      }, 500);
    };
    resolveParams();
  }, [params]);

  const handleInputChange = (field: keyof UserForm, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePermissionToggle = (permission: string) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    handleInputChange('permissions', newPermissions);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên người dùng';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    }

    if (!formData.role) {
      newErrors.role = 'Vui lòng chọn vai trò';
    }

    if (!formData.department) {
      newErrors.department = 'Vui lòng chọn phòng ban';
    }

    if (!formData.status) {
      newErrors.status = 'Vui lòng chọn trạng thái';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/permissions');
      }, 3000);
      
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !resolvedParams) {
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (!originalUser) {
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
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <ExclamationTriangleIcon style={{width: '3rem', height: '3rem', color: '#ef4444', margin: '0 auto 1rem'}} />
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
            Không tìm thấy người dùng
          </h2>
          <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>
            Người dùng với ID {resolvedParams.id} không tồn tại trong hệ thống.
          </p>
          <Link
            href="/permissions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeftIcon style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
            Quay về danh sách
          </Link>
        </div>
      </div>
    );
  }

  if (showSuccess) {
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
          borderRadius: '1.5rem',
          padding: '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            animation: 'pulse 2s infinite'
          }}>
            <CheckCircleIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Cập nhật thành công!
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            Thông tin người dùng đã được cập nhật thành công.
          </p>
          <div style={{
            width: '100%',
            height: '0.25rem',
            background: '#f3f4f6',
            borderRadius: '0.125rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '0.125rem',
              animation: 'progress 3s linear'
            }} />
          </div>
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
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex', 
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Link href="/permissions" style={{color: '#6b7280', display: 'flex'}}>
              <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
            </Link>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <PencilIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
            </div>
            <div>
              <h1 style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                margin: 0,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                Chỉnh sửa người dùng
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontWeight: 500
              }}>
                Cập nhật thông tin và quyền hạn của {originalUser.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ClipboardDocumentListIcon style={{width: '1.25rem', height: '1.25rem', color: '#3b82f6'}} />
              Thông tin cơ bản
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nhập họ và tên"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {errors.name && (
                  <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.name}
                  </p>
                )}
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
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`,
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {errors.email && (
                  <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Nhập số điện thoại"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${errors.phone ? '#ef4444' : '#e2e8f0'}`,
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {errors.phone && (
                  <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.phone}
                  </p>
                )}
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
                  Vai trò *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${errors.role ? '#ef4444' : '#e2e8f0'}`,
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && (
                  <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Phòng ban *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${errors.department ? '#ef4444' : '#e2e8f0'}`,
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Trạng thái *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${errors.status ? '#ef4444' : '#e2e8f0'}`,
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <option value="">Chọn trạng thái</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && (
                  <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {errors.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldCheckIcon style={{width: '1.25rem', height: '1.25rem', color: '#8b5cf6'}} />
              Quyền hạn
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {allPermissions.map((permission) => (
                <label
                  key={permission}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    background: formData.permissions.includes(permission) ? 'rgba(139, 92, 246, 0.1)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      accentColor: '#8b5cf6'
                    }}
                  />
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    {permission === 'Đọc' && <EyeIcon style={{width: '1rem', height: '1rem', color: '#8b5cf6'}} />}
                    {permission === 'Ghi' && <PencilIcon style={{width: '1rem', height: '1rem', color: '#8b5cf6'}} />}
                    {permission === 'Chỉnh sửa' && <PencilIcon style={{width: '1rem', height: '1rem', color: '#8b5cf6'}} />}
                    {permission === 'Xóa' && <TrashIcon style={{width: '1rem', height: '1rem', color: '#8b5cf6'}} />}
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: formData.permissions.includes(permission) ? '#7c3aed' : '#374151'
                    }}>
                      {permission}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <Link
              href="/permissions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#374151',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: isSubmitting 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <PencilIcon style={{width: '1rem', height: '1rem'}} />
                  Cập nhật người dùng
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
} 