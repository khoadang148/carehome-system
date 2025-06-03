"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
  'Chăm sóc cư dân',
  'Phục hồi chức năng',
  'Hoạt động',
  'Quản lý',
  'Tài chính',
  'Bảo vệ',
  'Dọn dẹp',
  'Bếp ăn'
];

const positions = [
  'Y tá đã đăng ký',
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
        shiftType: data.shiftType.split(' (')[0], // Remove time details for display
        hireDate: data.hireDate,
        salary: parseFloat(data.salary) || 0,
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
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
        <Link href="/staff" style={{color: '#6b7280', display: 'flex', marginRight: '0.75rem'}}>
          <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Thêm nhân viên mới</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          
          {/* Personal Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin cá nhân
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              <div>
                <label htmlFor="firstName" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tên*
                </label>
                <input
                  id="firstName"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.firstName ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('firstName', { required: 'Tên là bắt buộc' })}
                />
                {errors.firstName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Họ*
                </label>
                <input
                  id="lastName"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.lastName ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('lastName', { required: 'Họ là bắt buộc' })}
                />
                {errors.lastName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.lastName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="dateOfBirth" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ngày sinh*
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.dateOfBirth ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('dateOfBirth', { required: 'Ngày sinh là bắt buộc' })}
                />
                {errors.dateOfBirth && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.dateOfBirth.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="gender" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Giới tính*
                </label>
                <select
                  id="gender"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.gender ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('gender', { required: 'Giới tính là bắt buộc' })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.gender.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Số điện thoại*
                </label>
                <input
                  id="phone"
                  type="tel"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.phone ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('phone', { required: 'Số điện thoại là bắt buộc' })}
                />
                {errors.phone && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.phone.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.email ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('email', { 
                    required: 'Email là bắt buộc',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ"
                    }
                  })}
                />
                {errors.email && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.email.message}</p>
                )}
              </div>
            </div>
            
            <div style={{marginTop: '1rem'}}>
              <label htmlFor="address" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Địa chỉ
              </label>
              <textarea
                id="address"
                rows={2}
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('address')}
              />
            </div>
          </div>
          
          {/* Job Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin công việc
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              <div>
                <label htmlFor="position" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Chức vụ*
                </label>
                <select
                  id="position"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.position ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('position', { required: 'Chức vụ là bắt buộc' })}
                >
                  <option value="">Chọn chức vụ</option>
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
                {errors.position && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.position.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="department" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Phòng ban*
                </label>
                <select
                  id="department"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.department ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('department', { required: 'Phòng ban là bắt buộc' })}
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.department.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="shiftType" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ca làm việc*
                </label>
                <select
                  id="shiftType"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.shiftType ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('shiftType', { required: 'Ca làm việc là bắt buộc' })}
                >
                  <option value="">Chọn ca làm việc</option>
                  {shiftTypes.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
                {errors.shiftType && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.shiftType.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="hireDate" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ngày tuyển dụng*
                </label>
                <input
                  id="hireDate"
                  type="date"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.hireDate ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('hireDate', { required: 'Ngày tuyển dụng là bắt buộc' })}
                />
                {errors.hireDate && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.hireDate.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="salary" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Lương cơ bản (VNĐ)*
                </label>
                <input
                  id="salary"
                  type="number"
                  step="1000"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.salary ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('salary', { required: 'Lương cơ bản là bắt buộc' })}
                />
                {errors.salary && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.salary.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="certification" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Chứng chỉ
                </label>
                <input
                  id="certification"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="VD: RN, BSN, CNA, DPT..."
                  {...register('certification')}
                />
              </div>
            </div>
          </div>
          
          {/* Emergency Contact Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin liên hệ khẩn cấp
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              <div>
                <label htmlFor="emergencyContactName" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tên người liên hệ*
                </label>
                <input
                  id="emergencyContactName"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.emergencyContactName ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('emergencyContactName', { required: 'Tên người liên hệ khẩn cấp là bắt buộc' })}
                />
                {errors.emergencyContactName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.emergencyContactName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="emergencyContactPhone" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Số điện thoại liên hệ*
                </label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.emergencyContactPhone ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('emergencyContactPhone', { required: 'Số điện thoại liên hệ khẩn cấp là bắt buộc' })}
                />
                {errors.emergencyContactPhone && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.emergencyContactPhone.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Additional Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin bổ sung
            </h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              <div>
                <label htmlFor="workExperience" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Kinh nghiệm làm việc
                </label>
                <textarea
                  id="workExperience"
                  rows={3}
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Mô tả kinh nghiệm làm việc trước đây..."
                  {...register('workExperience')}
                />
              </div>
              
              <div>
                <label htmlFor="specializations" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Chuyên môn đặc biệt
                </label>
                <input
                  id="specializations"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Phân cách bằng dấu phẩy (VD: Chăm sóc Alzheimer, Vật lý trị liệu, Dinh dưỡng)"
                  {...register('specializations')}
                />
              </div>
              
              <div>
                <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ghi chú bổ sung
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>
          
          {/* Form Buttons */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem'}}>
            <Link 
              href="/staff" 
              style={{
                padding: '0.5rem 1rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#374151',
                textDecoration: 'none'
              }}
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem', 
                border: '1px solid transparent', 
                borderRadius: '0.375rem', 
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'white', 
                backgroundColor: '#0284c7',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 