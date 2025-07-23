"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { staffAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

interface StaffFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | '';
  position: string;
  department: string;
  hireDate: string;
  email: string;
  certification: string;
  contactPhone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<StaffFormData>();
  
  // Resolve params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);
  
  // Fetch staff data when params are resolved
  useEffect(() => {
    if (!resolvedParams) return;

    // Check if this is a valid staff ID (should be a valid ObjectId or number)
    const staffId = resolvedParams.id;
    
    // If the ID is not a valid format, redirect to staff list
    if (!staffId || staffId === 'visits' || staffId === 'add' || staffId.includes('/')) {
      router.replace('/staff');
      return;
    }

    const fetchStaff = async () => {
      try {
        console.log('Fetching staff for edit with ID:', staffId);
        
        const apiStaff = await staffAPI.getById(staffId);

        if (apiStaff) {
          // Transform API data and populate form
          reset({
            firstName: apiStaff.firstName || apiStaff.full_name?.split(' ')[0] || '',
            lastName: apiStaff.lastName || apiStaff.full_name?.split(' ').slice(1).join(' ') || '',
            dateOfBirth: apiStaff.dateOfBirth || apiStaff.date_of_birth || '',
            gender: apiStaff.gender || '',
            position: apiStaff.position || '',
            department: apiStaff.department || '',
            hireDate: apiStaff.hireDate || apiStaff.hire_date || apiStaff.created_at || '',
            email: apiStaff.email || '',
            certification: apiStaff.certification || '',
            contactPhone: apiStaff.contactPhone || apiStaff.phone_number || apiStaff.phone || '',
            address: apiStaff.address || '',
            emergencyContact: apiStaff.emergencyContact || apiStaff.emergency_contact?.name || '',
            emergencyPhone: apiStaff.emergencyPhone || apiStaff.emergency_contact?.phone || '',
            notes: apiStaff.notes || ''
          });
          setError('');
        } else {
          setError('Không tìm thấy thông tin nhân viên.');
        }
      } catch (error: any) {
        console.error('Error fetching staff for edit:', error);
        
        if (error.response?.status === 404) {
          setError('Không tìm thấy thông tin nhân viên.');
        } else if (error.response?.status === 403) {
          setError('Bạn không có quyền chỉnh sửa thông tin này.');
        } else {
          setError('Có lỗi xảy ra khi tải thông tin nhân viên.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [resolvedParams, reset, router]);
  
  const onSubmit = async (data: StaffFormData) => {
    if (!resolvedParams) return;
    
    setIsSubmitting(true);
    
    try {
      const staffId = resolvedParams.id;
      
      // Prepare update data
      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
        dateOfBirth: data.dateOfBirth,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        position: data.position,
        department: data.department,
        hireDate: data.hireDate,
        hire_date: data.hireDate,
        email: data.email,
        certification: data.certification,
        contactPhone: data.contactPhone,
        phone_number: data.contactPhone,
        phone: data.contactPhone,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        emergency_contact: {
          name: data.emergencyContact,
          phone: data.emergencyPhone
        },
        notes: data.notes
      };
      
      // Update staff via API
      await staffAPI.update(staffId, updateData);
      
      // Navigate back to staff details page
      router.push(`/staff/${staffId}`);
    } catch (error: any) {
      console.error('Error updating staff:', error);
      
      if (error.response?.status === 404) {
        setError('Không tìm thấy nhân viên để cập nhật.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền cập nhật thông tin này.');
      } else if (error.response?.status === 400) {
        setError('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else {
        setError('Có lỗi xảy ra khi cập nhật thông tin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
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
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p style={{fontSize: '1rem', color: '#6b7280', margin: 0}}>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }
  
  // If staff is not found or there's an error
  if (error) {
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
          <ExclamationTriangleIcon style={{
            width: '3rem',
            height: '3rem',
            color: '#f59e0b',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            {error}
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            Nhân viên này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/staff"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const handleGoBack = () => {
    try {
      if (resolvedParams) {
        router.push(`/staff/${resolvedParams.id}`);
      } else {
        router.push('/staff');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/staff';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{maxWidth: 800, margin: '0 auto'}}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={handleGoBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'white',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <ArrowLeftIcon style={{width: '1rem', height: '1rem'}} />
            Quay lại
          </button>
          
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0
            }}>
              Chỉnh sửa thông tin nhân viên
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>
              Cập nhật thông tin chi tiết của nhân viên
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              color: '#dc2626',
              fontSize: '0.875rem',
              margin: 0,
              fontWeight: 500
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            
            {/* Personal Information Section */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <UserIcon style={{width: '1.25rem', height: '1.25rem'}} />
                Thông tin cá nhân
              </h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Họ <span style={{color: '#dc2626'}}>*</span>
                  </label>
                  <input
                    {...register('firstName', { required: 'Vui lòng nhập họ' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.firstName ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập họ"
                  />
                  {errors.firstName && (
                    <p style={{color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Tên <span style={{color: '#dc2626'}}>*</span>
                  </label>
                  <input
                    {...register('lastName', { required: 'Vui lòng nhập tên' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.lastName ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập tên"
                  />
                  {errors.lastName && (
                    <p style={{color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Giới tính
                  </label>
                  <select
                    {...register('gender')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Work Information Section */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Thông tin công việc
              </h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Chức vụ <span style={{color: '#dc2626'}}>*</span>
                  </label>
                  <input
                    {...register('position', { required: 'Vui lòng nhập chức vụ' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.position ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập chức vụ"
                  />
                  {errors.position && (
                    <p style={{color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                      {errors.position.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Khoa/Phòng ban <span style={{color: '#dc2626'}}>*</span>
                  </label>
                  <input
                    {...register('department', { required: 'Vui lòng nhập khoa/phòng ban' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.department ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập khoa/phòng ban"
                  />
                  {errors.department && (
                    <p style={{color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                      {errors.department.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Ngày vào làm
                  </label>
                  <input
                    type="date"
                    {...register('hireDate')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Chứng chỉ
                  </label>
                  <input
                    {...register('certification')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập chứng chỉ"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Thông tin liên hệ
              </h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập email"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Số điện thoại
                  </label>
                  <input
                    {...register('contactPhone')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>
              
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                  Địa chỉ
                </label>
                <input
                  {...register('address')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    {...register('emergencyContact')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Tên người liên hệ khẩn cấp"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                    SĐT khẩn cấp
                  </label>
                  <input
                    {...register('emergencyPhone')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Số điện thoại khẩn cấp"
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Ghi chú
              </h3>
              
              <div>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
                  Ghi chú thêm
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                  placeholder="Nhập ghi chú về nhân viên..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
              <button
                type="button"
                onClick={handleGoBack}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon style={{width: '1rem', height: '1rem'}} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 