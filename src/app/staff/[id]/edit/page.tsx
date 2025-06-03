"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Mock staff data (same as in the staff page)
const initialStaffMembers = [
  { 
    id: 1, 
    name: 'John Smith', 
    firstName: 'John',
    lastName: 'Smith',
    position: 'Y tá đã đăng ký', 
    department: 'Y tế', 
    shiftType: 'Sáng', 
    hireDate: '2022-03-15',
    dateOfBirth: '1985-06-12',
    gender: 'male',
    email: 'john.smith@example.com',
    certification: 'RN, BSN',
    contactPhone: '555-123-4567',
    address: '123 Maple Street, Anytown',
    emergencyContact: 'Mary Smith',
    emergencyPhone: '555-987-6543',
    notes: 'Chuyên môn về chăm sóc người cao tuổi. Kinh nghiệm 10 năm trong lĩnh vực y tế.'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    firstName: 'Sarah',
    lastName: 'Johnson',
    position: 'Người chăm sóc', 
    department: 'Chăm sóc cư dân', 
    shiftType: 'Chiều', 
    hireDate: '2022-05-20',
    dateOfBirth: '1990-04-23',
    gender: 'female',
    email: 'sarah.j@example.com',
    certification: 'CNA',
    contactPhone: '555-234-5678',
    address: '456 Oak Avenue, Hometown',
    emergencyContact: 'Robert Johnson',
    emergencyPhone: '555-876-5432',
    notes: 'Tốt nghiệp xuất sắc ngành điều dưỡng. Khả năng giao tiếp tốt với cư dân.'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    firstName: 'Michael',
    lastName: 'Brown',
    position: 'Chuyên viên vật lý trị liệu', 
    department: 'Phục hồi chức năng', 
    shiftType: 'Ngày', 
    hireDate: '2021-11-10',
    dateOfBirth: '1988-10-05',
    gender: 'male',
    email: 'mb@example.com',
    certification: 'DPT',
    contactPhone: '555-345-6789',
    address: '789 Pine Road, Cityville',
    emergencyContact: 'Jessica Brown',
    emergencyPhone: '555-765-4321',
    notes: 'Chuyên về phục hồi chức năng cho bệnh nhân sau đột quỵ. Tham gia nhiều khóa đào tạo đặc biệt.'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    firstName: 'Emily',
    lastName: 'Davis',
    position: 'Trợ lý y tá', 
    department: 'Chăm sóc cư dân', 
    shiftType: 'Đêm', 
    hireDate: '2023-01-05',
    dateOfBirth: '1992-12-18',
    gender: 'female',
    email: 'emily.d@example.com',
    certification: 'CNA',
    contactPhone: '555-456-7890',
    address: '321 Cedar Lane, Townsville',
    emergencyContact: 'Mark Davis',
    emergencyPhone: '555-654-3210',
    notes: 'Có kinh nghiệm chăm sóc ban đêm. Đặc biệt giỏi trong việc giúp cư dân có giấc ngủ ngon.'
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    firstName: 'David',
    lastName: 'Wilson',
    position: 'Điều phối viên hoạt động', 
    department: 'Hoạt động', 
    shiftType: 'Ngày', 
    hireDate: '2022-08-22',
    dateOfBirth: '1987-03-30',
    gender: 'male',
    email: 'dwilson@example.com',
    certification: 'Liệu pháp giải trí',
    contactPhone: '555-567-8901',
    address: '654 Birch Street, Villagetown',
    emergencyContact: 'Linda Wilson',
    emergencyPhone: '555-543-2109',
    notes: 'Rất sáng tạo trong việc phát triển các hoạt động giải trí cho cư dân. Đặc biệt giỏi về âm nhạc và nghệ thuật.'
  },
];

const departments = ['Y tế', 'Chăm sóc cư dân', 'Phục hồi chức năng', 'Hoạt động', 'Quản lý'];
const shifts = ['Sáng', 'Chiều', 'Đêm', 'Ngày'];

type StaffFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  position: string;
  department: string;
  shiftType: string;
  hireDate: string;
  email: string;
  certification: string;
  contactPhone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
};

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [staffMembers, setStaffMembers] = useState(initialStaffMembers);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<StaffFormData>();
  
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
    
    // Check if there's saved staff data in localStorage
    const savedStaff = localStorage.getItem('nurseryHomeStaff');
    if (savedStaff) {
      setStaffMembers(JSON.parse(savedStaff));
    }
    
    // Simulate API call to fetch staff data
    const fetchStaff = async () => {
      try {
        // In a real application, you would fetch from an API endpoint
        const staffId = parseInt(resolvedParams.id);
        
        // Use the staff data from state (which might be from localStorage)
        const foundStaff = staffMembers.find(s => s.id === staffId);
        
        if (foundStaff) {
          // Format data for the form
          reset({
            firstName: foundStaff.firstName,
            lastName: foundStaff.lastName,
            dateOfBirth: foundStaff.dateOfBirth,
            gender: foundStaff.gender,
            position: foundStaff.position,
            department: foundStaff.department,
            shiftType: foundStaff.shiftType,
            hireDate: foundStaff.hireDate,
            email: foundStaff.email || '',
            certification: foundStaff.certification || '',
            contactPhone: foundStaff.contactPhone,
            address: foundStaff.address || '',
            emergencyContact: foundStaff.emergencyContact || '',
            emergencyPhone: foundStaff.emergencyPhone || '',
            notes: foundStaff.notes || ''
          });
        } else {
          // Staff not found
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaff();
  }, [resolvedParams, reset, staffMembers]);
  
  const onSubmit = async (data: StaffFormData) => {
    if (!resolvedParams) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real application, you would send the data to your backend API
      const staffId = parseInt(resolvedParams.id);
      
      // Update the staff member in the array
      const updatedStaffMembers = staffMembers.map(staff => {
        if (staff.id === staffId) {
          // Update with form data
          return {
            ...staff,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            position: data.position,
            department: data.department,
            shiftType: data.shiftType,
            hireDate: data.hireDate,
            email: data.email,
            certification: data.certification,
            contactPhone: data.contactPhone,
            address: data.address,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            notes: data.notes
          };
        }
        return staff;
      });
      
      // Save updated staff to localStorage
      localStorage.setItem('nurseryHomeStaff', JSON.stringify(updatedStaffMembers));
      
      // For demo purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to staff details page
      router.push(`/staff/${resolvedParams.id}`);
    } catch (error) {
      console.error('Error updating staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
  if (loading || !resolvedParams) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  // If staff is not found
  if (notFound) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin nhân viên.</p>
      </div>
    );
  }
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
        <Link href={`/staff/${resolvedParams.id}`} style={{color: '#6b7280', display: 'flex', marginRight: '0.75rem'}}>
          <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chỉnh sửa thông tin nhân viên</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {/* Personal Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin cá nhân
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {/* First Name */}
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
              
              {/* Last Name */}
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
              
              {/* Date of Birth */}
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
              
              {/* Gender */}
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
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.gender.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Employment Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin công việc
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {/* Position */}
              <div>
                <label htmlFor="position" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Vị trí*
                </label>
                <input
                  id="position"
                  type="text"
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
                  {...register('position', { required: 'Vị trí là bắt buộc' })}
                />
                {errors.position && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.position.message}</p>
                )}
              </div>
              
              {/* Department */}
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
              
              {/* Shift Type */}
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
                  {shifts.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
                {errors.shiftType && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.shiftType.message}</p>
                )}
              </div>
              
              {/* Hire Date */}
              <div>
                <label htmlFor="hireDate" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ngày vào làm*
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
                  {...register('hireDate', { required: 'Ngày vào làm là bắt buộc' })}
                />
                {errors.hireDate && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.hireDate.message}</p>
                )}
              </div>

              {/* Certification */}
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
                  {...register('certification')}
                />
              </div>
            </div>
          </div>
          
          {/* Contact Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin liên hệ
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {/* Email */}
              <div>
                <label htmlFor="email" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
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
                  {...register('email')}
                />
              </div>
              
              {/* Contact Phone */}
              <div>
                <label htmlFor="contactPhone" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Số điện thoại*
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.contactPhone ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('contactPhone', { required: 'Số điện thoại là bắt buộc' })}
                />
                {errors.contactPhone && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.contactPhone.message}</p>
                )}
              </div>
              
              {/* Address */}
              <div>
                <label htmlFor="address" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Địa chỉ
                </label>
                <input
                  id="address"
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
                  {...register('address')}
                />
              </div>
              
              {/* Emergency Contact */}
              <div>
                <label htmlFor="emergencyContact" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Liên hệ khẩn cấp
                </label>
                <input
                  id="emergencyContact"
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
                  {...register('emergencyContact')}
                />
              </div>
              
              {/* Emergency Phone */}
              <div>
                <label htmlFor="emergencyPhone" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  SĐT khẩn cấp
                </label>
                <input
                  id="emergencyPhone"
                  type="tel"
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
                  {...register('emergencyPhone')}
                />
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div>
            <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Ghi chú
            </label>
            <textarea
              id="notes"
              rows={4}
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
          
          {/* Form Buttons */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem'}}>
            <Link 
              href={`/staff/${resolvedParams.id}`} 
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
              Huỷ
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 