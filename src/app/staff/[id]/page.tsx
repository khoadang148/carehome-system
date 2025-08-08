"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { staffAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    // Resolve params Promise
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);
  
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
        console.log('Fetching staff with ID:', staffId);
        
        // Try to fetch from API first
        const apiStaff = await staffAPI.getById(staffId);
        
        if (apiStaff) {
          // Transform API data to match UI expectations
          const transformedStaff = {
            id: apiStaff._id || apiStaff.id,
            name: apiStaff.full_name || apiStaff.name || `${apiStaff.firstName} ${apiStaff.lastName}`,
            firstName: apiStaff.firstName || apiStaff.full_name?.split(' ')[0] || '',
            lastName: apiStaff.lastName || apiStaff.full_name?.split(' ').slice(1).join(' ') || '',
            position: apiStaff.position || 'Chưa hoàn tất đăng kí',
            department: apiStaff.department || 'Chưa hoàn tất đăng kí',
            shiftType: apiStaff.shiftType || apiStaff.shift_type || 'Chưa hoàn tất đăng kí',
            hireDate: apiStaff.hireDate || apiStaff.hire_date || apiStaff.created_at || '',
            dateOfBirth: apiStaff.dateOfBirth || apiStaff.date_of_birth || '',
            gender: apiStaff.gender || '',
            email: apiStaff.email || '',
            certification: apiStaff.certification || '',
            contactPhone: apiStaff.contactPhone || apiStaff.phone_number || apiStaff.phone || '',
            address: apiStaff.address || '',
            emergencyContact: apiStaff.emergencyContact || apiStaff.emergency_contact?.name || '',
            emergencyPhone: apiStaff.emergencyPhone || apiStaff.emergency_contact?.phone || '',
            notes: apiStaff.notes || ''
          };
          
          setStaff(transformedStaff);
          setError('');
        } else {
          setError('Không tìm thấy thông tin nhân viên.');
        }
      } catch (error: any) {
        console.error('Error fetching staff:', error);
        
        if (error.response?.status === 404) {
          setError('Không tìm thấy thông tin nhân viên.');
        } else if (error.response?.status === 403) {
          setError('Bạn không có quyền xem thông tin này.');
        } else {
          setError('Có lỗi xảy ra khi tải thông tin nhân viên.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaff();
  }, [resolvedParams, router]);
  
  const handleEditClick = () => {
    if (!resolvedParams) return;
    router.push(`/staff/${resolvedParams.id}/edit`);
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
  if (error || !staff) {
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
            {error || 'Không tìm thấy thông tin nhân viên'}
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
  
  // Helper function to render shift type with appropriate color
  const renderShiftType = (shift: string) => {
    const bgColor = 
      shift === 'Sáng' ? '#dbeafe' : 
      shift === 'Chiều' ? '#f3e8ff' :
      shift === 'Đêm' ? '#e0e7ff' : '#dcfce7';
      
    const textColor = 
      shift === 'Sáng' ? '#1e40af' : 
      shift === 'Chiều' ? '#7c3aed' :
      shift === 'Đêm' ? '#3730a3' : '#166534';
    
    return (
      <span style={{
        background: bgColor,
        color: textColor,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: 500
      }}>
        {shift}
      </span>
    );
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa hoàn tất đăng kí';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // Calculate age function
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Chưa hoàn tất đăng kí';
    try {
      const birth = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} tuổi`;
    } catch {
      return 'Chưa hoàn tất đăng kí';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{maxWidth: 1200, margin: '0 auto'}}>
        
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(90deg, #f8fafc 0%,rgb(244, 247, 250) 100%)',
          borderRadius: '1.5rem',
          padding: '2rem 2rem 1.5rem 2rem',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          boxShadow: '0 2px 12px 0 rgba(100,116,139,0.06)'
        }}>
          <Link href="/staff" style={{color: '#64748b', display: 'flex', alignItems: 'center', marginRight: 18}}>
            <ArrowLeftIcon style={{width: 24, height: 24}} />
          </Link>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc 0%, #f0abfc 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.10)'
          }}>
            {staff.name?.[0] || '?'}
          </div>
          <div style={{flex: 1}}>
            <h1 style={{fontSize: '2.1rem', fontWeight: 800, color: '#334155', margin: 0, letterSpacing: '-0.01em'}}>{staff.name}</h1>
            <p style={{ fontSize: '1.05rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
              Chức vụ: {staff.position} 
            </p>
            <p style={{ fontSize: '1.05rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
              Khoa: {staff.department}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div style={{display: 'flex', gap: 12}}>
            <button
              onClick={handleEditClick}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.25rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
            >
              <PencilIcon style={{width: 16, height: 16}} />
              Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem'}}>
          
          {/* Left Column */}
          <div>
            {/* Personal Information */}
            <div style={{borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem', marginBottom: '2.5rem'}}>
              <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
                Thông tin cá nhân
              </h3>
              <div style={{display: 'grid', gap: '1.1rem'}}>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Họ và tên:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.name}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Ngày sinh:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{formatDate(staff.dateOfBirth)}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Tuổi:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{calculateAge(staff.dateOfBirth)}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Giới tính:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>
                    {staff.gender === 'male' ? 'Nam' : staff.gender === 'female' ? 'Nữ' : 'Chưa hoàn tất đăng kí'}
                  </span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Địa chỉ:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.address || 'Chưa hoàn tất đăng kí'}</span>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div style={{borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem'}}>
              <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
                Thông tin công việc
              </h3>
              <div style={{display: 'grid', gap: '1.1rem'}}>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Chức vụ:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.position}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Khoa/Phòng ban:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.department}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{fontWeight: 600, color: '#475569'}}>Ca làm việc:</span>
                  <span style={{marginLeft: 8}}>{renderShiftType(staff.shiftType)}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Ngày vào làm:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{formatDate(staff.hireDate)}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Chứng chỉ:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.certification || 'Chưa hoàn tất đăng kí'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Contact Information */}
            <div style={{borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem', marginBottom: '2.5rem'}}>
              <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
                Thông tin liên hệ
              </h3>
              <div style={{display: 'grid', gap: '1.1rem'}}>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Email:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.email || 'Chưa hoàn tất đăng kí'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Số điện thoại:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.contactPhone || 'Chưa hoàn tất đăng kí'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Liên hệ khẩn cấp:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.emergencyContact || 'Chưa hoàn tất đăng kí'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>SĐT khẩn cấp:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.emergencyPhone || 'Chưa hoàn tất đăng kí'}</span>
                </div>
              </div>
            </div>
            
            {/* Notes Section */}
            <div style={{borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem'}}>
              <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
                Ghi chú
              </h3>
              <p style={{fontSize: '1.05rem', color: '#64748b', margin: 0, lineHeight: 1.6}}>
                {staff.notes || 'Không có ghi chú.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 