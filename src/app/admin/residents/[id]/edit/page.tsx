"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  HeartIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { residentAPI, apiClient } from '@/lib/api';
import { formatDateDDMMYYYY, convertDDMMYYYYToISO } from '@/lib/utils/validation';
import { getErrorMessage } from '@/lib/utils/api-error-handler';
import { Fragment } from 'react';
import { userAPI } from "@/lib/api";

// Sửa lại type ResidentFormData cho đồng bộ API mới
type ResidentFormData = {
  full_name: string;
  date_of_birth: string;
  gender: string;
  care_level: string;
  status: string;
  admission_date: string;
  discharge_date: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  contact_phone: string;
  medical_history: string;
  current_medications: string;
  allergies: string;
  notes: string;
  avatar: string;
  family_member_id: string;
  relationship: string;
};

// Professional validation rules with high business logic
const validationRules = {
  full_name: {
    required: 'Tên là bắt buộc',
    minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
    maxLength: { value: 50, message: 'Tên không được quá 50 ký tự' },
    pattern: {
      value: /^[a-zA-ZÀ-ỹ\s]+$/,
      message: 'Tên chỉ được chứa chữ cái và khoảng trắng'
    }
  },
  date_of_birth: {
    required: 'Ngày sinh là bắt buộc',
    pattern: {
      value: /^(\d{2})\/(\d{2})\/(\d{4})$/,
      message: 'Ngày sinh phải theo định dạng dd/mm/yyyy'
    },
    validate: (value: string) => {
      if (!value) return true;
      const [day, month, year] = value.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return 'Ngày sinh không hợp lệ';
      }
      if (date > new Date()) {
        return 'Ngày sinh không thể trong tương lai';
      }
      return true;
    }
  },
  gender: {
    required: 'Giới tính là bắt buộc'
  },
  admission_date: {
    pattern: {
      value: /^(\d{2})\/(\d{2})\/(\d{4})$/,
      message: 'Ngày nhập viện phải theo định dạng dd/mm/yyyy'
    },
    validate: (value: string) => {
      if (!value) return true;
      const [day, month, year] = value.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return 'Ngày nhập viện không hợp lệ';
      }
      // Ngày nhập viện không thể trong tương lai
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      if (date > today) {
        return 'Ngày nhập viện không thể trong tương lai';
      }
      return true;
    }
  },
  discharge_date: {
    pattern: {
      value: /^(\d{2})\/(\d{2})\/(\d{4})$/,
      message: 'Ngày xuất viện phải theo định dạng dd/mm/yyyy'
    },
    validate: (value: string) => {
      if (!value) return true;
      const [day, month, year] = value.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return 'Ngày xuất viện không hợp lệ';
      }
      // Ngày xuất viện không thể trong quá khứ xa (trước 2020)
      const minDate = new Date(2020, 0, 1);
      if (date < minDate) {
        return 'Ngày xuất viện không hợp lệ (trước 2020)';
      }
      return true;
    }
  },

  medical_history: {},
  current_medications: {},
  allergies: {},
  notes: {},
  avatar: {},
  family_member_id: {},
  relationship: {}
};

// Care level options with modern styling
const careLevelOptions = [
  { value: 'Cơ bản', label: 'Gói Cơ bản', color: '#3b82f6', bg: '#dbeafe' },
  { value: 'Nâng cao', label: 'Gói Nâng cao', color: '#10b981', bg: '#dcfce7' },
  { value: 'Cao cấp', label: 'Gói Cao cấp', color: '#8b5cf6', bg: '#f3e8ff' },
  { value: 'Đặc biệt', label: 'Gói Đặc biệt', color: '#f59e0b', bg: '#fef3c7' }
];

const genderOptions = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
];

const mobilityOptions = [
  'Độc lập hoàn toàn',
  'Cần hỗ trợ nhẹ',
  'Sử dụng gậy đi bộ',
  'Sử dụng walker',
  'Xe lăn bán thời gian',
  'Xe lăn toàn thời gian',
  'Nằm liệt giường'
];

// Helper function chuyển đổi từ yyyy-mm-dd sang dd/mm/yyyy
const convertToDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

// Helper function chuyển đổi từ dd/mm/yyyy hoặc yyyy-mm-dd sang ISO yyyy-mm-dd
const convertToApiDate = (dateString: string): string => {
  if (!dateString) return '';
  const trimmed = dateString.trim();
  // Support yyyy-mm-dd directly
  const isoLike = /^\d{4}-\d{2}-\d{2}$/;
  if (isoLike.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }
  // Support dd/mm/yyyy via existing util
  const converted = convertDDMMYYYYToISO(trimmed);
  if (!converted) return '';
  return `${converted}T00:00:00.000Z`;
};

export default function EditResidentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formSection, setFormSection] = useState<string>('personal'); // personal, medical, contact, additional
  const [residentData, setResidentData] = useState<any>(null);
  const residentId = React.use(params).id;
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid, touchedFields }, 
    reset,
    getValues,
    trigger
  } = useForm<ResidentFormData>({ mode: 'onBlur' });

  // Xóa watchedFields để tránh re-render liên tục
  // const watchedFields = watch();
  
  // State cho danh sách thuốc và dị ứng
  const [medications, setMedications] = useState<{ medication_name: string; dosage: string; frequency: string }[]>([]);
  const [allergyList, setAllergyList] = useState<string[]>([]);

  // Thêm state cho upload ảnh
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Fetch resident từ API thật
    const fetchResident = async () => {
      setLoading(true);
      try {
        const data = await residentAPI.getById(residentId);
        setResidentData(data); // chỉ set state, không gọi reset ở đây
      } catch (error) {
        console.error('Error fetching resident:', error);
        // Redirect về danh sách thay vì hiển thị trang "Không tìm thấy"
        router.push('/admin/residents');
      } finally {
        setLoading(false);
      }
    };
    fetchResident();
  }, [residentId, router]);

  // Đảm bảo chỉ có 1 useEffect gọi reset khi residentData thay đổi
  useEffect(() => {
    if (residentData) {
      reset({
        full_name: residentData.full_name || '',
        date_of_birth: residentData.date_of_birth ? convertToDisplayDate(residentData.date_of_birth.slice(0, 10)) : '',
        gender: residentData.gender || '',
        care_level: residentData.care_level || '',
        status: residentData.status || 'active',
        admission_date: residentData.admission_date ? convertToDisplayDate(residentData.admission_date.slice(0, 10)) : '',
        discharge_date: residentData.discharge_date ? convertToDisplayDate(residentData.discharge_date.slice(0, 10)) : '',
        emergency_contact_name: residentData.emergency_contact?.name || '',
        emergency_contact_relationship: residentData.emergency_contact?.relationship || '',
        emergency_contact_phone: residentData.emergency_contact?.phone || '',
        contact_phone: residentData.contact_phone || '',
        medical_history: typeof residentData.medical_history === 'string' ? residentData.medical_history : (Array.isArray(residentData.medical_history) ? residentData.medical_history.join(', ') : ''),
        current_medications: Array.isArray(residentData.current_medications) ? residentData.current_medications.map((m: any) => `${m.medication_name}|${m.dosage}|${m.frequency}`).join(';') : (residentData.current_medications || ''),
        allergies: Array.isArray(residentData.allergies) ? residentData.allergies.join(', ') : (residentData.allergies || ''),
        notes: residentData.notes || '',
        avatar: residentData.avatar || '',
        family_member_id: typeof residentData.family_member_id === 'object' && (residentData.family_member_id as any)?._id ? (residentData.family_member_id as any)._id : (residentData.family_member_id || ''),
        relationship: residentData.relationship || '',
      });
      setMedications(Array.isArray(residentData.current_medications) ? residentData.current_medications : []);
      setAllergyList(Array.isArray(residentData.allergies) ? residentData.allergies : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residentData]);
  
  const onSubmit = async (data: ResidentFormData) => {
    setIsSubmitting(true);
    try {
      const isFormValid = await trigger();
      if (!isFormValid) {
        setIsSubmitting(false);
        return;
      }
      // Debug: Kiểm tra định dạng ngày tháng
      console.log('Debug - data.date_of_birth:', data.date_of_birth);
      console.log('Debug - data.date_of_birth type:', typeof data.date_of_birth);
      
      const convertedDateOfBirth = convertToApiDate(data.date_of_birth);
      console.log('Debug - convertToApiDate result:', convertedDateOfBirth);
      
      // Validate date_of_birth
      if (!convertedDateOfBirth) {
        setModalMessage('Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
        setModalType('error');
        setShowModal(true);
        setIsSubmitting(false);
        return;
      }
      
      // Map dữ liệu form sang request body API chuẩn
      const body: any = {
        full_name: data.full_name,
        date_of_birth: convertedDateOfBirth,
        gender: data.gender,
        medical_history: data.medical_history,
        current_medications: medications,
        allergies: allergyList,
        emergency_contact: {
          name: data.emergency_contact_name,
          phone: data.emergency_contact_phone,
          relationship: data.emergency_contact_relationship
        },
        care_level: data.care_level,
        status: data.status,
        avatar: data.avatar,
        family_member_id: typeof data.family_member_id === 'object' && (data.family_member_id as any)?._id ? (data.family_member_id as any)._id : data.family_member_id,
        relationship: data.relationship,
      };

      // Chỉ gửi admission_date nếu có giá trị hợp lệ
      const convertedAdmissionDate = data.admission_date ? convertToApiDate(data.admission_date) : '';
      if (convertedAdmissionDate) {
        body.admission_date = convertedAdmissionDate;
      }
      
      // Xử lý discharge_date - cho phép user xóa ngày xuất viện
      if (data.discharge_date && data.discharge_date.trim() !== '') {
        const convertedDischargeDate = convertToApiDate(data.discharge_date);
        if (convertedDischargeDate) {
          body.discharge_date = convertedDischargeDate;
          // Fallback for backends expecting camelCase
          (body as any).dischargeDate = convertedDischargeDate;
        }
      } else {
        // Nếu user xóa ngày xuất viện, gửi null để backend cập nhật
        body.discharge_date = null;
        (body as any).dischargeDate = null;
      }
      
      // Validate discharge_date vs admission_date
      if (body.discharge_date && convertedAdmissionDate) {
        const admissionDate = new Date(convertedAdmissionDate);
        const dischargeDate = new Date(body.discharge_date);
        
        if (dischargeDate < admissionDate) {
          setModalMessage('Ngày xuất viện không thể trước ngày nhập viện');
          setModalType('error');
          setShowModal(true);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Debug: Log request body
      console.log('🚀 Sending update request with body:', JSON.stringify(body, null, 2));
      console.log('📅 discharge_date value:', body.discharge_date);
      console.log('📅 discharge_date type:', typeof body.discharge_date);
      console.log('🔍 Request body keys:', Object.keys(body));
      console.log('🔍 discharge_date in body keys:', 'discharge_date' in body);
      
      const updateResponse = await residentAPI.update(residentId, body);
      console.log('✅ Update response:', updateResponse);
      console.log('🔍 discharge_date in response:', updateResponse.discharge_date);
      console.log('🔍 All response fields:', Object.keys(updateResponse));
      
      // Refresh dữ liệu sau khi update thành công
      try {
        const updatedData = await residentAPI.getById(residentId);
        setResidentData(updatedData);
      } catch (error) {
        console.error('Error refreshing resident data:', error);
      }
      
      setSuccessMessage('Thông tin người cao tuổi đã được cập nhật thành công!');
      setTimeout(() => {
        router.push(`/admin/residents/${residentId}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating resident:', error);
      
      // Xử lý lỗi chi tiết hơn
      const errorMessage = getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
      
      setModalMessage(errorMessage);
      setModalType('error');
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
  if (loading || !residentId) {
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
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Đang tải thông tin người cao tuổi...
          </p>
        </div>
      </div>
    );
  }
  
  // If resident is not found
  if (notFound) {
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
            Không tìm thấy người cao tuổi
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            người cao tuổi này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/admin/residents"
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
  
  // Success message
  if (successMessage) {
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
          <CheckCircleIcon style={{
            width: '3rem',
            height: '3rem',
            color: '#10b981',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            Cập nhật thành công!
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            {successMessage}
          </p>
      </div>
      </div>
    );
  }

  // Form sections navigation
  const formSections = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: UserIcon, color: '#3b82f6' },
    { id: 'medical', label: 'Thông tin y tế', icon: HeartIcon, color: '#ef4444' },
    { id: 'contact', label: 'Thông tin liên hệ', icon: PhoneIcon, color: '#10b981' }
  ];

  // Professional Input component với validation styling
  const FormInput = ({ 
    label, 
    name, 
    type = 'text', 
    placeholder, 
    required = false,
    options = null,
    isTextarea = false 
  }: {
    label: string;
    name: keyof ResidentFormData;
    type?: string;
    placeholder?: string;
    required?: boolean;
    options?: Array<{value: string, label: string, color?: string, bg?: string}> | null;
    isTextarea?: boolean;
  }) => {
    const hasError = errors[name];
    const isTouched = touchedFields[name];
    const hasValue = getValues(name); // Thay watchedFields bằng getValues
    // Sửa lỗi validationRules: chỉ truyền nếu có, nếu không thì truyền {}
    const validation = Object.prototype.hasOwnProperty.call(validationRules, String(name)) ? validationRules[name as keyof typeof validationRules] : {};
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: hasError ? '#ef4444' : '#374151',
          marginBottom: '0.5rem'
        }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
        {options ? (
          <select
            {...register(name, validation)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${hasError ? '#fca5a5' : isTouched && hasValue ? '#86efac' : '#d1d5db'}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: hasError ? '#fef2f2' : isTouched && hasValue ? '#f0fdf4' : 'white'
            }}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : isTextarea ? (
          <textarea
            {...register(name, validation)}
            placeholder={placeholder}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${hasError ? '#fca5a5' : isTouched && hasValue ? '#86efac' : '#d1d5db'}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: hasError ? '#fef2f2' : isTouched && hasValue ? '#f0fdf4' : 'white',
              resize: 'vertical',
              minHeight: '100px'
            }}
          />
        ) :
          <input
            type={type}
            {...register(name, validation)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${hasError ? '#fca5a5' : isTouched && hasValue ? '#86efac' : '#d1d5db'}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: hasError ? '#fef2f2' : isTouched && hasValue ? '#f0fdf4' : 'white'
            }}
          />
        }
        {hasError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.5rem',
            color: '#ef4444',
            fontSize: '0.75rem'
          }}>
            <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
            {hasError.message}
          </div>
        )}
        {!hasError && isTouched && hasValue && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.5rem',
            color: '#10b981',
            fontSize: '0.75rem'
          }}>
            <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
            Hợp lệ
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
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
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Link
              href={`/admin/residents/${residentId}`}
                  style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.75rem',
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </Link>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <UserIcon style={{
                  width: '2rem',
                  height: '2rem',
                  color: '#667eea'
                }} />
                Chỉnh sửa thông tin người cao tuổi
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0'
              }}>
                Cập nhật thông tin chi tiết và tình trạng chăm sóc
              </p>
            </div>
              </div>
              
          {/* Form sections navigation */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {formSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setFormSection(section.id)}
                type="button"
                  style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: formSection === section.id ? 
                    `linear-gradient(135deg, ${section.color} 0%, ${section.color}dd 100%)` :
                    'rgba(248, 250, 252, 0.8)',
                  color: formSection === section.id ? 'white' : section.color,
                  border: `1px solid ${formSection === section.id ? section.color : '#e2e8f0'}`,
                  borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <section.icon style={{ width: '1rem', height: '1rem' }} />
                {section.label}
              </button>
            ))}
          </div>
              </div>
              
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Personal Information Section */}
            {formSection === 'personal' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: 0,
                      color: '#1e293b'
                    }}>
                      Thông tin cá nhân
                    </h2>
                    <p style={{
                    fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0
                    }}>
                      Thông tin cơ bản và nhân khẩu học của người cao tuổi
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <FormInput
                    label="Tên*"
                    name="full_name"
                    placeholder="VD: Alice Johnson"
                    required
                  />
                  <FormInput
                    label="Ngày sinh*"
                    name="date_of_birth"
                    type="text"
                    placeholder="dd/mm/yyyy"
                    required
                  />
                  <FormInput
                    label="Giới tính*"
                    name="gender"
                    options={genderOptions}
                    required
                  />
                  <FormInput
                    label="Ngày nhập viện"
                    name="admission_date"
                    type="text"
                    placeholder="dd/mm/yyyy"
                  />
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Ảnh đại diện
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={residentData?.avatar ? userAPI.getAvatarUrl(residentData.avatar) : '/default-avatar.svg'}
                          alt="avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.svg';
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // Kiểm tra kích thước file (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
                              return;
                            }
                            
                            setAvatarUploading(true);
                            const formData = new FormData();
                            formData.append('avatar', file);
                            
                            try {
                              // Sử dụng endpoint avatar của resident
                              const response = await apiClient.patch(`/residents/${residentId}/avatar`, formData, {
                                headers: {
                                  'Content-Type': 'multipart/form-data',
                                },
                              });
                              console.log('Upload response:', response);
                              
                              // Sau khi upload thành công, cập nhật form với tên file
                              reset({ ...getValues(), avatar: file.name });
                              setModalMessage('Upload ảnh thành công!');
                              setModalType('success');
                              setShowModal(true);
                              
                              // Refresh lại dữ liệu resident để cập nhật avatar
                              const updatedData = await residentAPI.getById(residentId);
                              setResidentData(updatedData);
                              
                            } catch (error: any) {
                              console.error('Upload error:', error);
                              if (error.response?.status === 400) {
                                setModalMessage('File không hợp lệ. Vui lòng chọn file ảnh khác.');
                                setModalType('error');
                              } else {
                                setModalMessage('Upload ảnh thất bại! Vui lòng thử lại.');
                                setModalType('error');
                              }
                              setShowModal(true);
                            } finally {
                              setAvatarUploading(false);
                            }
                          }}
                          style={{ 
                            display: 'block', 
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                        {avatarUploading && (
                          <span style={{ color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            Đang tải ảnh lên...
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            {/* Medical Information Section */}
            {formSection === 'medical' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HeartIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: 0,
                      color: '#1e293b'
                    }}>
                      Thông tin y tế
                    </h2>
                    <p style={{
                    fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0
                    }}>
                      Tình trạng sức khỏe, thuốc men và dị ứng
                    </p>
              </div>
            </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '1.5rem'
                }}>
                  <FormInput
                    label="Tình trạng sức khỏe"
                    name="medical_history"
                    placeholder="VD: Hypertension, Arthritis, Diabetes (cách nhau bằng dấu phẩy)"
                    isTextarea
                  />
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Thuốc đang sử dụng
                    </label>
                    {medications.map((med, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: 8 }}>
                        <input
                          type="text"
                          placeholder="Tên thuốc"
                          value={med.medication_name}
                          onChange={e => {
                            const newMeds = [...medications];
                            newMeds[idx].medication_name = e.target.value;
                            setMedications(newMeds);
                          }}
                          style={{ flex: 2, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
                        />
                        <input
                          type="text"
                          placeholder="Liều lượng"
                          value={med.dosage}
                          onChange={e => {
                            const newMeds = [...medications];
                            newMeds[idx].dosage = e.target.value;
                            setMedications(newMeds);
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
                        />
                        <input
                          type="text"
                          placeholder="Tần suất"
                          value={med.frequency}
                          onChange={e => {
                            const newMeds = [...medications];
                            newMeds[idx].frequency = e.target.value;
                            setMedications(newMeds);
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
                        />
                        <button type="button" onClick={() => setMedications(meds => meds.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setMedications(meds => [...meds, { medication_name: '', dosage: '', frequency: '' }])} style={{ color: '#3b82f6', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>+ Thêm thuốc</button>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Dị ứng
                    </label>
                    {allergyList.map((alg, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: 8 }}>
                        <input
                          type="text"
                          placeholder="Tên dị ứng"
                          value={alg}
                          onChange={e => {
                            const newAlgs = [...allergyList];
                            newAlgs[idx] = e.target.value;
                            setAllergyList(newAlgs);
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
                        />
                        <button type="button" onClick={() => setAllergyList(algs => algs.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setAllergyList(algs => [...algs, ''])} style={{ color: '#3b82f6', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>+ Thêm dị ứng</button>
                  </div>
                  
          </div>
              </div>
            )}
          
          {/* Contact Information Section */}
            {formSection === 'contact' && (
          <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: 0,
                      color: '#1e293b'
                    }}>
              Thông tin liên hệ khẩn cấp
            </h2>
                    <p style={{
                    fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0
                    }}>
                      Người liên hệ trong trường hợp khẩn cấp
                    </p>
                  </div>
              </div>
              
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <FormInput
                    label="Tên người liên hệ khẩn cấp*"
                    name="emergency_contact_name"
                    placeholder="VD: Bob Johnson"
                    required
                  />
                  
                  <FormInput
                    label="Quan hệ với người liên hệ*"
                    name="emergency_contact_relationship"
                    placeholder="VD: Bố, vợ, con, người thân"
                    required
                  />
                  
                  <FormInput
                    label="Số điện thoại liên hệ khẩn cấp*"
                    name="emergency_contact_phone"
                    type="tel"
                    placeholder="VD: 0123456789 hoặc +84123456789"
                    required
                  />
              </div>

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <ShieldCheckIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#3b82f6'
                    }}>
                      Lưu ý về thông tin liên hệ
                    </span>
            </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.875rem',
                    color: '#475569',
                    lineHeight: '1.5'
                  }}>
                    <li>Số điện thoại phải đúng định dạng Việt Nam (10-11 số)</li>
                    <li>Người liên hệ sẽ được thông báo trong trường hợp khẩn cấp</li>
                    <li>Thông tin này sẽ được bảo mật theo quy định</li>
                  </ul>
          </div>
              </div>
            )}
            
            {/* Form Actions */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
            <Link 
                href={`/admin/residents/${residentId}`}
              style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  textDecoration: 'none',
                fontSize: '0.875rem', 
                fontWeight: 500, 
                  transition: 'all 0.2s ease'
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
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: isSubmitting ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                fontSize: '0.875rem', 
                fontWeight: 500, 
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      borderRadius: '50%',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    Cập nhật thông tin
                  </>
                )}
            </button>
            </div>
          </div>
        </form>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: modalType === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              {modalType === 'success' ? (
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              ) : (
                <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              )}
            </div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
              color: '#1f2937'
            }}>
              {modalType === 'success' ? 'Thành công' : 'Lỗi'}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              {modalMessage}
            </p>
              <button
                onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                  }}
                >
              OK
                </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 