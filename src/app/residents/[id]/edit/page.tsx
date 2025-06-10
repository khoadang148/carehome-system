"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
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

// Mock resident data (same as in the residents page)
const initialResidents = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    firstName: 'Alice',
    lastName: 'Johnson',
    age: 78, 
    room: '101', 
    careLevel: 'Cơ bản', 

    dateOfBirth: '1945-04-15',
    gender: 'female',
    medicalConditions: ['Hypertension', 'Arthritis'],
    medications: ['Lisinopril', 'Ibuprofen'],
    allergies: ['Penicillin'],
    emergencyContact: 'Bob Johnson',
    contactPhone: '(555) 123-4567',
    personalNotes: 'Cần được định hướng lại thường xuyên. Thích liệu pháp âm nhạc.',
    dietaryRestrictions: 'Low sodium',
    mobilityStatus: 'Uses walker'
  },
  { 
    id: 2, 
    name: 'Robert Smith', 
    firstName: 'Robert',
    lastName: 'Smith',
    age: 82, 
    room: '102', 
    careLevel: 'Nâng cao', 
    admissionDate: '2023-01-10',
    dateOfBirth: '1941-08-23',
    gender: 'male',
    medicalConditions: ['Diabetes', 'Heart Disease'],
    medications: ['Metformin', 'Atorvastatin'],
    allergies: ['Sulfa drugs'],
    emergencyContact: 'Susan Smith',
    contactPhone: '(555) 234-5678',
    personalNotes: 'Giáo sư về hưu. Thích chơi cờ và nghe nhạc cổ điển.',
    dietaryRestrictions: 'Diabetic diet',
    mobilityStatus: 'Independent'
  },
  { 
    id: 3, 
    name: 'Mary Williams', 
    firstName: 'Mary',
    lastName: 'Williams',
    age: 85, 
    room: '103', 
    careLevel: 'Cao cấp', 
    admissionDate: '2022-11-23',
    dateOfBirth: '1937-11-05',
    gender: 'female',
    medicalConditions: ['Alzheimer\'s', 'Osteoporosis'],
    medications: ['Donepezil', 'Calcium supplements'],
    allergies: ['Latex'],
    emergencyContact: 'John Williams',
    contactPhone: '(555) 345-6789',
    personalNotes: 'Cần được định hướng lại thường xuyên. Thích liệu pháp âm nhạc.',
    dietaryRestrictions: 'Soft diet',
    mobilityStatus: 'Wheelchair bound'
  },
  { 
    id: 4, 
    name: 'James Brown', 
    firstName: 'James',
    lastName: 'Brown',
    age: 76, 
    room: '104', 
    careLevel: 'Nâng cao', 
    admissionDate: '2023-03-05',
    dateOfBirth: '1947-06-30',
    gender: 'male',
    medicalConditions: ['COPD', 'Arthritis'],
    medications: ['Albuterol', 'Acetaminophen'],
    allergies: ['Aspirin'],
    emergencyContact: 'Patricia Brown',
    contactPhone: '(555) 456-7890',
    personalNotes: 'Thợ mộc trước đây. Thích làm đồ gỗ khi có thể.',
    dietaryRestrictions: 'None',
    mobilityStatus: 'Uses cane'
  },
  { 
    id: 5, 
    name: 'Patricia Davis', 
    firstName: 'Patricia',
    lastName: 'Davis',
    age: 81, 
    room: '105', 
    careLevel: 'Cơ bản', 
    admissionDate: '2023-04-12',
    dateOfBirth: '1942-02-18',
    gender: 'female',
    medicalConditions: ['Hypertension', 'Depression'],
    medications: ['Amlodipine', 'Sertraline'],
    allergies: ['None known'],
    emergencyContact: 'Michael Davis',
    contactPhone: '(555) 567-8901',
    personalNotes: 'Giáo viên về hưu. Thích thủ công và giao tiếp xã hội.',
    dietaryRestrictions: 'Vegetarian',
    mobilityStatus: 'Independent'
  },
];

type ResidentFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  room: string;
  careLevel: string;
  emergencyContact: string;
  contactPhone: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
  mobilityStatus: string;
  notes: string;
};

// Professional validation rules with high business logic
const validationRules = {
  firstName: {
    required: 'Tên là bắt buộc',
    minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
    maxLength: { value: 50, message: 'Tên không được quá 50 ký tự' },
    pattern: {
      value: /^[a-zA-ZÀ-ỹ\s]+$/,
      message: 'Tên chỉ được chứa chữ cái và khoảng trắng'
    }
  },
  lastName: {
    required: 'Họ là bắt buộc',
    minLength: { value: 2, message: 'Họ phải có ít nhất 2 ký tự' },
    maxLength: { value: 50, message: 'Họ không được quá 50 ký tự' },
    pattern: {
      value: /^[a-zA-ZÀ-ỹ\s]+$/,
      message: 'Họ chỉ được chứa chữ cái và khoảng trắng'
    }
  },
  dateOfBirth: {
    required: 'Ngày sinh là bắt buộc',
    validate: (value: string) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        return 'Ngày sinh không thể ở tương lai';
      }
      if (age < 50) {
        return 'Cư dân phải ít nhất 50 tuổi để được nhận vào viện dưỡng lão';
      }
      if (age > 120) {
        return 'Tuổi không hợp lệ';
      }
      return true;
    }
  },
  room: {
    required: 'Số phòng là bắt buộc',
    pattern: {
      value: /^[A-Z]?\d{2,3}[A-Z]?$/,
      message: 'Số phòng không đúng định dạng (VD: 101, A201, 105B)'
    }
  },
  contactPhone: {
    required: 'Số điện thoại liên hệ là bắt buộc',
    pattern: {
      value: /^(\+84|0)[3-9]\d{8}$/,
      message: 'Số điện thoại không đúng định dạng Việt Nam'
    }
  },
  emergencyContact: {
    required: 'Người liên hệ khẩn cấp là bắt buộc',
    minLength: { value: 2, message: 'Tên người liên hệ phải có ít nhất 2 ký tự' },
    pattern: {
      value: /^[a-zA-ZÀ-ỹ\s]+$/,
      message: 'Tên chỉ được chứa chữ cái và khoảng trắng'
    }
  },
  gender: {
    required: 'Giới tính là bắt buộc'
  },
  careLevel: {
    required: 'Gói dịch vụ là bắt buộc'
  },
  medicalConditions: {},
  medications: {},
  allergies: {},
  dietaryRestrictions: {},
  mobilityStatus: {},
  notes: {}
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

export default function EditResidentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [residents, setResidents] = useState(initialResidents);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formSection, setFormSection] = useState('personal'); // personal, medical, contact, additional
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid, touchedFields }, 
    reset,
    watch,
    trigger
  } = useForm<ResidentFormData>({ mode: 'onBlur' });

  const watchedFields = watch();
  
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
    
    // Check if there's saved residents data in localStorage
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      setResidents(JSON.parse(savedResidents));
    }
    
    // Simulate API call to fetch resident data
    const fetchResident = async () => {
      try {
        // In a real application, you would fetch from an API endpoint
        const residentId = parseInt(resolvedParams.id);
        // Use the residents from state or localStorage
        const foundResident = residents.find(r => r.id === residentId);
        
        if (foundResident) {
          // Format data for the form
          reset({
            firstName: foundResident.firstName,
            lastName: foundResident.lastName,
            dateOfBirth: foundResident.dateOfBirth,
            gender: foundResident.gender,
            room: foundResident.room,
            careLevel: foundResident.careLevel,
            emergencyContact: foundResident.emergencyContact,
            contactPhone: foundResident.contactPhone,
            medicalConditions: foundResident.medicalConditions.join(', '),
            medications: foundResident.medications.join(', '),
            allergies: foundResident.allergies.join(', '),
            dietaryRestrictions: foundResident.dietaryRestrictions,
            mobilityStatus: foundResident.mobilityStatus,
            notes: foundResident.personalNotes
          });
        } else {
          // Resident not found
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching resident:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResident();
  }, [resolvedParams, reset]);
  
  const onSubmit = async (data: ResidentFormData) => {
    if (!resolvedParams) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate all fields before submitting
      const isFormValid = await trigger();
      if (!isFormValid) {
        setIsSubmitting(false);
        return;
      }

      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (!savedResidents) {
        throw new Error('Không tìm thấy dữ liệu cư dân');
      }

      const residents = JSON.parse(savedResidents);
      const residentId = parseInt(resolvedParams.id);
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      
      if (residentIndex === -1) {
        throw new Error('Không tìm thấy cư dân');
      }

      // Calculate age from date of birth
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

      // Update resident data
      residents[residentIndex] = {
        ...residents[residentIndex],
        name: `${data.firstName} ${data.lastName}`,
            firstName: data.firstName,
            lastName: data.lastName,
        age,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            room: data.room,
            careLevel: data.careLevel,
            emergencyContact: data.emergencyContact,
            contactPhone: data.contactPhone,
        medicalConditions: data.medicalConditions.split(',').map(s => s.trim()).filter(Boolean),
        medications: data.medications.split(',').map(s => s.trim()).filter(Boolean),
        allergies: data.allergies.split(',').map(s => s.trim()).filter(Boolean),
            dietaryRestrictions: data.dietaryRestrictions,
            mobilityStatus: data.mobilityStatus,
        personalNotes: data.notes,
        lastUpdated: new Date().toISOString()
          };
      
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      
      // Trigger data update event
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      
      setSuccessMessage('Thông tin cư dân đã được cập nhật thành công!');
      
      // Redirect back to detail page after short delay
      setTimeout(() => {
      router.push(`/residents/${resolvedParams.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating resident:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
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
            Đang tải thông tin cư dân...
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
            Không tìm thấy cư dân
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            Cư dân này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/residents"
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
    { id: 'contact', label: 'Thông tin liên hệ', icon: PhoneIcon, color: '#10b981' },
    { id: 'additional', label: 'Thông tin bổ sung', icon: ClipboardDocumentListIcon, color: '#f59e0b' }
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
    const hasValue = watchedFields[name];
    
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
            {...register(name, validationRules[name] || {})}
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
            {...register(name, validationRules[name] || {})}
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
        ) : (
                <input
            type={type}
            {...register(name, validationRules[name] || {})}
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
        )}
        
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
              href={`/residents/${resolvedParams?.id}`}
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
                color: '#1e293b'
              }}>
                Chỉnh sửa thông tin cư dân
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
                      Thông tin cơ bản và nhân khẩu học của cư dân
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
                    name="firstName"
                    placeholder="VD: Alice"
                    required
                  />
                  
                  <FormInput
                    label="Họ*"
                    name="lastName"
                    placeholder="VD: Johnson"
                    required
                  />
                  
                  <FormInput
                    label="Ngày sinh*"
                    name="dateOfBirth"
                    type="date"
                    required
                  />
                  
                  <FormInput
                    label="Giới tính*"
                    name="gender"
                    options={genderOptions}
                    required
                  />
                  
                  <FormInput
                    label="Phòng*"
                    name="room"
                    placeholder="VD: 101, A201, 105B"
                    required
                  />
                  
                  <FormInput
                    label="Gói dịch vụ*"
                    name="careLevel"
                    options={careLevelOptions}
                    required
                />
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
                    name="medicalConditions"
                    placeholder="VD: Hypertension, Arthritis, Diabetes (cách nhau bằng dấu phẩy)"
                    isTextarea
                  />
                  
                  <FormInput
                    label="Thuốc đang sử dụng"
                    name="medications"
                    placeholder="VD: Lisinopril, Ibuprofen, Metformin (cách nhau bằng dấu phẩy)"
                    isTextarea
                  />
                  
                  <FormInput
                    label="Dị ứng"
                    name="allergies"
                    placeholder="VD: Penicillin, Sulfa drugs, Latex (cách nhau bằng dấu phẩy)"
                  />
                  
                  <FormInput
                    label="Chế độ ăn đặc biệt"
                    name="dietaryRestrictions"
                    placeholder="VD: Low sodium, Diabetic diet, Vegetarian"
                  />
                  
                  <FormInput
                    label="Tình trạng di chuyển"
                    name="mobilityStatus"
                    options={mobilityOptions.map(option => ({ value: option, label: option }))}
                  />
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
                    label="Người liên hệ khẩn cấp*"
                    name="emergencyContact"
                    placeholder="VD: Bob Johnson"
                    required
                  />
                  
                  <FormInput
                    label="Số điện thoại liên hệ*"
                    name="contactPhone"
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
          
            {/* Additional Information Section */}
            {formSection === 'additional' && (
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
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ClipboardDocumentListIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
              <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: 0,
                      color: '#1e293b'
                    }}>
                      Thông tin bổ sung
                    </h2>
                    <p style={{
                    fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0
                    }}>
                      Ghi chú và thông tin đặc biệt khác
                    </p>
                  </div>
              </div>
              
                <FormInput
                  label="Ghi chú cá nhân"
                  name="notes"
                  placeholder="VD: Thích nghe nhạc cổ điển, cần được nhắc nhở về thuốc..."
                  isTextarea
                />

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <SparklesIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                    <span style={{
                    fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#10b981'
                    }}>
                      Mẹo viết ghi chú hiệu quả
                    </span>
              </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.875rem',
                    color: '#475569',
                    lineHeight: '1.5'
                  }}>
                    <li>Ghi rõ sở thích, thói quen của cư dân</li>
                    <li>Lưu ý các vấn đề cần quan tâm đặc biệt</li>
                    <li>Thông tin về gia đình, bạn bè thân thiết</li>
                    <li>Các hoạt động yêu thích hoặc không thích</li>
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
                href={`/residents/${resolvedParams?.id}`}
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 