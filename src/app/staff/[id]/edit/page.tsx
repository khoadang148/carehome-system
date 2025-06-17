"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Mock staff data (same as in the staff page)
const initialStaffMembers = [
  { 
    id: 1, 
    name: 'John Smith', 
    firstName: 'John',
    lastName: 'Smith',
    position: 'Y tá', 
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
    department: 'Chăm sóc người cao tuổi', 
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
    notes: 'Tốt nghiệp xuất sắc ngành điều dưỡng. Khả năng giao tiếp tốt với người cao tuổi.'
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
    department: 'Chăm sóc người cao tuổi', 
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
    notes: 'Có kinh nghiệm chăm sóc ban đêm. Đặc biệt giỏi trong việc giúp người cao tuổi có giấc ngủ ngon.'
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
    notes: 'Rất sáng tạo trong việc phát triển các hoạt động giải trí cho người cao tuổi. Đặc biệt giỏi về âm nhạc và nghệ thuật.'
  },
];

const departments = ['Y tế', 'Chăm sóc người cao tuổi', 'Phục hồi chức năng', 'Hoạt động', 'Quản lý'];
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
  
  // Lấy staff từ localStorage khi mount
  useEffect(() => {
    const savedStaff = localStorage.getItem('nurseryHomeStaff');
    if (savedStaff) {
      setStaffMembers(JSON.parse(savedStaff));
    }
  }, []); // chỉ chạy 1 lần khi mount
  
  // Resolve params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);
  
  // Fetch staff khi đã có resolvedParams
  useEffect(() => {
    if (!resolvedParams) return;

    // Simulate API call to fetch staff data
    const fetchStaff = async () => {
      try {
        const staffId = parseInt(resolvedParams.id);
        const foundStaff = staffMembers.find(s => s.id === staffId);

        if (foundStaff) {
          reset({
            firstName: foundStaff.firstName,
            lastName: foundStaff.lastName,
            dateOfBirth: foundStaff.dateOfBirth,
            gender: foundStaff.gender,
            position: foundStaff.position,
            department: foundStaff.department,
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
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams, reset]);
  
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
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-base text-gray-400">Đang tải thông tin...</p>
      </div>
    );
  }
  
  // If staff is not found
  if (notFound) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-base text-gray-400">Không tìm thấy thông tin nhân viên.</p>
      </div>
    );
  }
  
  const handleGoBack = () => {
    try {
      router.push('/staff');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/staff';
    }
  };

  return (
    <div>
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 px-4 py-3 mb-4 ml-24 mt-4 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Quay lại
      </button>
    
    <div className="max-w-5xl mx-auto mt-8 p-8 bg-white rounded-3xl shadow-lg">
      
      {/* Tiêu đề */}
      <div className="flex items-center mb-2">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <UserIcon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa thông tin nhân viên</h2>
          <p className="text-gray-500 text-sm">Cập nhật thông tin cá nhân, công việc và liên hệ của nhân viên</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-8">
        {/* Thông tin cá nhân */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
              <label htmlFor="firstName" className="block font-medium text-gray-700 mb-1">
                Tên <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('firstName', { required: 'Tên là bắt buộc' })}
                />
                {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              {/* Last Name */}
              <div>
              <label htmlFor="lastName" className="block font-medium text-gray-700 mb-1">
                Họ <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('lastName', { required: 'Họ là bắt buộc' })}
                />
                {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
              {/* Date of Birth */}
              <div>
              <label htmlFor="dateOfBirth" className="block font-medium text-gray-700 mb-1">
                Ngày sinh <span className="text-red-500">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('dateOfBirth', { required: 'Ngày sinh là bắt buộc' })}
                />
                {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>
              {/* Gender */}
              <div>
              <label htmlFor="gender" className="block font-medium text-gray-700 mb-1">
                Giới tính <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('gender', { required: 'Giới tính là bắt buộc' })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                )}
            </div>
          </div>
        </section>
        {/* Thông tin công việc */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Thông tin công việc</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Position */}
              <div>
              <label htmlFor="position" className="block font-medium text-gray-700 mb-1">
                Vị trí <span className="text-red-500">*</span>
                </label>
                <input
                  id="position"
                  type="text"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('position', { required: 'Vị trí là bắt buộc' })}
                />
                {errors.position && (
                <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
                )}
              </div>
              {/* Department */}
              <div>
              <label htmlFor="department" className="block font-medium text-gray-700 mb-1">
                Khoa <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('department', { required: 'Khoa là bắt buộc' })}
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                <p className="text-red-500 text-sm mt-1">{errors.department.message}</p>
                )}
              </div>
              {/* Hire Date */}
              <div>
              <label htmlFor="hireDate" className="block font-medium text-gray-700 mb-1">
                Ngày vào làm <span className="text-red-500">*</span>
                </label>
                <input
                  id="hireDate"
                  type="date"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('hireDate', { required: 'Ngày vào làm là bắt buộc' })}
                />
                {errors.hireDate && (
                <p className="text-red-500 text-sm mt-1">{errors.hireDate.message}</p>
                )}
              </div>
              {/* Certification */}
              <div>
              <label htmlFor="certification" className="block font-medium text-gray-700 mb-1">
                  Chứng chỉ
                </label>
                <input
                  id="certification"
                  type="text"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('certification')}
                />
            </div>
          </div>
        </section>
        {/* Thông tin liên hệ */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Thông tin liên hệ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
              <label htmlFor="email" className="block font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('email')}
                />
              </div>
              {/* Contact Phone */}
              <div>
              <label htmlFor="contactPhone" className="block font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('contactPhone', { required: 'Số điện thoại là bắt buộc' })}
                />
                {errors.contactPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.contactPhone.message}</p>
                )}
              </div>
              {/* Address */}
              <div>
              <label htmlFor="address" className="block font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  id="address"
                  type="text"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('address')}
                />
              </div>
              {/* Emergency Contact */}
              <div>
              <label htmlFor="emergencyContact" className="block font-medium text-gray-700 mb-1">
                  Liên hệ khẩn cấp
                </label>
                <input
                  id="emergencyContact"
                  type="text"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('emergencyContact')}
                />
              </div>
              {/* Emergency Phone */}
              <div>
              <label htmlFor="emergencyPhone" className="block font-medium text-gray-700 mb-1">
                  SĐT khẩn cấp
                </label>
                <input
                  id="emergencyPhone"
                  type="tel"
                className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
                  {...register('emergencyPhone')}
                />
            </div>
          </div>
        </section>
        {/* Ghi chú */}
          <div>
          <label htmlFor="notes" className="block font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              id="notes"
              rows={4}
            className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base"
              {...register('notes')}
            />
          </div>
        {/* Nút action */}
        <div className="flex justify-end gap-4 mt-8">
            <button 
              type="button"
              onClick={handleGoBack}
              className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-60"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {isSubmitting ? 'Đang lưu...' : 'Cập nhật thông tin'}
            </button>
          </div>
        </form>
    </div>
    </div>
  );
} 