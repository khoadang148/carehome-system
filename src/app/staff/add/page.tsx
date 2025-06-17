"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon, UserPlusIcon, BriefcaseIcon, PhoneIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

type StaffFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  department: string;
  shiftType: string;
  hireDate: string;
  salary: string;
  certification: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  workExperience: string;
  specializations: string;
  notes: string;
};

const departments = [
  'Y tế',
  'Chăm sóc người cao tuổi',
  'Phục hồi chức năng',
  'Hoạt động',
  'Quản lý',
  'Tài chính',
  'Bảo vệ',
  'Dọn dẹp',
  'Bếp ăn'
];

const positions = [
  'Y tá',
  'Trợ lý y tá',
  'Người chăm sóc',
  'Chuyên viên vật lý trị liệu',
  'Điều phối viên hoạt động',
  'Quản lý khu vực',
  'Kế toán',
  'Nhân viên bảo vệ',
  'Nhân viên dọn dẹp',
  'Đầu bếp',
  'Phục vụ bếp ăn'
];

const shiftTypes = [
  'Sáng (6:00 - 14:00)',
  'Chiều (14:00 - 22:00)',
  'Đêm (22:00 - 6:00)',
  'Ngày (8:00 - 17:00)',
  'Toàn thời gian',
  'Bán thời gian'
];

export default function AddStaffPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<StaffFormData>();
  
  const onSubmit = async (data: StaffFormData) => {
    setIsSubmitting(true);
    
    try {
      // Get existing staff data
      const existingStaff = localStorage.getItem('nurseryHomeStaff');
      const staffList = existingStaff ? JSON.parse(existingStaff) : [];
      
      // Generate new ID
      const newId = staffList.length > 0 ? Math.max(...staffList.map((s: any) => s.id)) + 1 : 1;
      
      // Create new staff member object
      const newStaff = {
        id: newId,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        age: new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear(),
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        position: data.position,
        department: data.department,
        hireDate: data.hireDate,
        certification: data.certification,
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone
        },
        workExperience: data.workExperience,
        specializations: data.specializations.split(',').map(s => s.trim()).filter(s => s),
        notes: data.notes,
        status: 'active'
      };
      
      // Add to staff list
      staffList.push(newStaff);
      
      // Save to localStorage
      localStorage.setItem('nurseryHomeStaff', JSON.stringify(staffList));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      reset();
      
      // Redirect to staff list
      router.push('/staff');
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Có lỗi xảy ra khi thêm nhân viên. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div style={{maxWidth: 1100, margin: '0 auto', marginTop: 32, marginBottom: 32}}>
      <button
          onClick={() => router.push('/staff')}
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
            marginLeft: '0.5rem',
            marginTop: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
      
      {/* Header lớn */}
      <div style={{
        background: 'linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%)',
        borderRadius: '1.5rem',
        padding: '2.5rem 2rem 2rem 2rem',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        boxShadow: '0 8px 32px 0 rgba(99,102,241,0.08)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(99,102,241,0.10)'
        }}>
          <UserPlusIcon style={{width: 36, height: 36, color: '#6366f1'}} />
        </div>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.01em'}}>Thêm nhân viên mới</h1>
          <p style={{fontSize: '1.1rem', color: 'rgba(255,255,255,0.95)', margin: '0.5rem 0 0 0', fontWeight: 500}}>Điền thông tin chi tiết để đăng ký nhân viên mới vào hệ thống</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '2.5rem'}}>
        {/* Section: Thông tin cá nhân */}
        <div style={{borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 2px 12px 0 rgba(99,102,241,0.06)', marginBottom: 24}}>
          <div style={{
            background: 'linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%)',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <UserPlusIcon style={{width: 24, height: 24, color: 'white'}} />
            <h2 style={{fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.01em'}}>Thông tin cá nhân</h2>
          </div>
          <div style={{padding: '2rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem'}}>
              <div>
                <label htmlFor="firstName" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Tên*</label>
                <input
                  id="firstName"
                  type="text"
                  className="input-field"
                  style={{border: errors.firstName ? '1.5px solid #fca5a5' : undefined, background: errors.firstName ? '#fef2f2' : undefined}}
                  {...register('firstName', { required: 'Tên là bắt buộc' })}
                />
                {errors.firstName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Họ*</label>
                <input
                  id="lastName"
                  type="text"
                  className="input-field"
                  style={{border: errors.lastName ? '1.5px solid #fca5a5' : undefined, background: errors.lastName ? '#fef2f2' : undefined}}
                  {...register('lastName', { required: 'Họ là bắt buộc' })}
                />
                {errors.lastName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.lastName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="dateOfBirth" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Ngày sinh*</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="input-field"
                  style={{border: errors.dateOfBirth ? '1.5px solid #fca5a5' : undefined, background: errors.dateOfBirth ? '#fef2f2' : undefined}}
                  {...register('dateOfBirth', { required: 'Ngày sinh là bắt buộc' })}
                />
                {errors.dateOfBirth && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.dateOfBirth.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="gender" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Giới tính*</label>
                <select
                  id="gender"
                  className="input-field"
                  style={{border: errors.gender ? '1.5px solid #fca5a5' : undefined, background: errors.gender ? '#fef2f2' : undefined}}
                  {...register('gender', { required: 'Giới tính là bắt buộc' })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.gender.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Số điện thoại*</label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  style={{border: errors.phone ? '1.5px solid #fca5a5' : undefined, background: errors.phone ? '#fef2f2' : undefined}}
                  {...register('phone', { required: 'Số điện thoại là bắt buộc' })}
                />
                {errors.phone && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Email*</label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  style={{border: errors.email ? '1.5px solid #fca5a5' : undefined, background: errors.email ? '#fef2f2' : undefined}}
                  {...register('email', { 
                    required: 'Email là bắt buộc',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ"
                    }
                  })}
                />
                {errors.email && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
            </div>
        {/* Section: Thông tin công việc */}
        <div style={{borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 2px 12px 0 rgba(16,185,129,0.06)', marginBottom: 24}}>
          <div style={{
            background: 'linear-gradient(90deg, #10b981 0%, #6ee7b7 100%)',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <BriefcaseIcon style={{width: 24, height: 24, color: 'white'}} />
            <h2 style={{fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.01em'}}>Thông tin công việc</h2>
          </div>
          <div style={{padding: '2rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem'}}>
              <div>
                <label htmlFor="position" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Chức vụ*</label>
                <select
                  id="position"
                  className="input-field"
                  style={{border: errors.position ? '1.5px solid #fca5a5' : undefined, background: errors.position ? '#fef2f2' : undefined}}
                  {...register('position', { required: 'Chức vụ là bắt buộc' })}
                >
                  <option value="">Chọn chức vụ</option>
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
                {errors.position && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.position.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="department" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Khoa*</label>
                <select
                  id="department"
                  className="input-field"
                  style={{border: errors.department ? '1.5px solid #fca5a5' : undefined, background: errors.department ? '#fef2f2' : undefined}}
                  {...register('department', { required: 'Khoa là bắt buộc' })}
                >
                  <option value="">Chọn khoakhoa</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.department.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="hireDate" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Ngày tuyển dụng*</label>
                <input
                  id="hireDate"
                  type="date"
                  className="input-field"
                  style={{border: errors.hireDate ? '1.5px solid #fca5a5' : undefined, background: errors.hireDate ? '#fef2f2' : undefined}}
                  {...register('hireDate', { required: 'Ngày tuyển dụng là bắt buộc' })}
                />
                {errors.hireDate && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.hireDate.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="certification" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Chứng chỉ</label>
                <input
                  id="certification"
                  type="text"
                  className="input-field"
                  style={{border: errors.certification ? '1.5px solid #fca5a5' : undefined, background: errors.certification ? '#fef2f2' : undefined}}
                  placeholder="VD: RN, BSN, CNA, DPT..."
                  {...register('certification')}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Section: Thông tin liên hệ khẩn cấp */}
        <div style={{borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 2px 12px 0 rgba(59,130,246,0.06)', marginBottom: 24}}>
          <div style={{
            background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <PhoneIcon style={{width: 24, height: 24, color: 'white'}} />
            <h2 style={{fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.01em'}}>Thông tin liên hệ khẩn cấp</h2>
          </div>
          <div style={{padding: '2rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem'}}>
              <div>
                <label htmlFor="emergencyContactName" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Tên người liên hệ*</label>
                <input
                  id="emergencyContactName"
                  type="text"
                  className="input-field"
                  style={{border: errors.emergencyContactName ? '1.5px solid #fca5a5' : undefined, background: errors.emergencyContactName ? '#fef2f2' : undefined}}
                  {...register('emergencyContactName', { required: 'Tên người liên hệ khẩn cấp là bắt buộc' })}
                />
                {errors.emergencyContactName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.emergencyContactName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="emergencyContactPhone" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Số điện thoại liên hệ*</label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  className="input-field"
                  style={{border: errors.emergencyContactPhone ? '1.5px solid #fca5a5' : undefined, background: errors.emergencyContactPhone ? '#fef2f2' : undefined}}
                  {...register('emergencyContactPhone', { required: 'Số điện thoại liên hệ khẩn cấp là bắt buộc' })}
                />
                {errors.emergencyContactPhone && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.95rem', color: '#dc2626'}}>{errors.emergencyContactPhone.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Section: Thông tin bổ sung */}
        <div style={{borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 2px 12px 0 rgba(139,92,246,0.06)', marginBottom: 24}}>
          <div style={{
            background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <InformationCircleIcon style={{width: 24, height: 24, color: 'white'}} />
            <h2 style={{fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.01em'}}>Thông tin bổ sung</h2>
          </div>
          <div style={{padding: '2rem'}}>
            <div style={{display: 'grid', gap: '1.25rem'}}>
              <div>
                <label htmlFor="workExperience" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Kinh nghiệm làm việc</label>
                <textarea
                  id="workExperience"
                  rows={3}
                  className="input-field"
                  style={{border: errors.workExperience ? '1.5px solid #fca5a5' : undefined, background: errors.workExperience ? '#fef2f2' : undefined}}
                  placeholder="Mô tả kinh nghiệm làm việc trước đây..."
                  {...register('workExperience')}
                />
              </div>
              <div>
                <label htmlFor="specializations" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Chuyên môn đặc biệt</label>
                <input
                  id="specializations"
                  type="text"
                  className="input-field"
                  style={{border: errors.specializations ? '1.5px solid #fca5a5' : undefined, background: errors.specializations ? '#fef2f2' : undefined}}
                  placeholder="Phân cách bằng dấu phẩy (VD: Chăm sóc Alzheimer, Vật lý trị liệu, Dinh dưỡng)"
                  {...register('specializations')}
                />
              </div>
              <div>
                <label htmlFor="notes" style={{display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem'}}>Ghi chú bổ sung</label>
                <textarea
                  id="notes"
                  rows={3}
                  className="input-field"
                  style={{border: errors.notes ? '1.5px solid #fca5a5' : undefined, background: errors.notes ? '#fef2f2' : undefined}}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Nút hành động */}
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24}}>
            <button
              type="submit"
            className="btn-gradient"
            style={{minWidth: 160, fontSize: '1.1rem', borderRadius: '0.75rem', padding: '0.85rem 2.5rem'}}
              disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
    </div>
  );
} 
