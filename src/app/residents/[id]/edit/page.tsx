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
import { residentAPI } from '@/lib/api';

type ResidentFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  room: string;
  careLevel: string;
  status: string;
  admissionDate: string;
  dischargeDate: string;
  familyMemberId: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
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
        return 'người cao tuổi phải ít nhất 50 tuổi để được nhận vào viện dưỡng lão';
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
  emergencyContactName: {
    required: 'Tên người liên hệ khẩn cấp là bắt buộc',
    minLength: { value: 2, message: 'Tên người liên hệ phải có ít nhất 2 ký tự' },
    pattern: {
      value: /^[a-zA-ZÀ-ỹ\s]+$/,
      message: 'Tên chỉ được chứa chữ cái và khoảng trắng'
    }
  },
  emergencyContactRelationship: {
    required: 'Quan hệ với người liên hệ là bắt buộc',
    minLength: { value: 2, message: 'Quan hệ phải có ít nhất 2 ký tự' },
    maxLength: { value: 50, message: 'Quan hệ không được quá 50 ký tự' },
    pattern: {
      value: /^[a-zA-ZÀ-ỹ\s]+$/,
      message: 'Quan hệ chỉ được chứa chữ cái và khoảng trắng'
    }
  },
  emergencyContactPhone: {
    required: 'Số điện thoại liên hệ khẩn cấp là bắt buộc',
    pattern: {
      value: /^(\+84|0)[3-9]\d{8}$/,
      message: 'Số điện thoại không đúng định dạng Việt Nam'
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

export default function EditResidentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formSection, setFormSection] = useState<string>('personal'); // personal, medical, contact, additional
  const [residentData, setResidentData] = useState<any>(null);
  
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
    // Fetch resident từ API thật
    const fetchResident = async () => {
      setLoading(true);
      try {
        const data = await residentAPI.getById(params.id);
        setResidentData(data); // Lưu lại dữ liệu gốc
        reset({
          firstName: data.fullName?.split(' ').slice(-1)[0] || '',
          lastName: data.fullName?.split(' ').slice(0, -1).join(' ') || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
          gender: data.gender || '',
          idNumber: data.idNumber || '',
          room: data.room || '',
          careLevel: data.careLevel === 'basic' ? 'Cơ bản' : data.careLevel === 'intermediate' ? 'Nâng cao' : data.careLevel === 'advanced' ? 'Cao cấp' : data.careLevel,
          status: data.status || 'active',
          admissionDate: data.admissionDate ? data.admissionDate.slice(0, 10) : '',
          dischargeDate: data.dischargeDate ? data.dischargeDate.slice(0, 10) : '',
          familyMemberId: data.familyMemberId || '',
          emergencyContactName: data.emergencyContact?.fullName || '',
          emergencyContactRelationship: data.emergencyContact?.relationship || '',
          emergencyContactPhone: data.emergencyContact?.phoneNumber || '',
          contactPhone: data.contactPhone || '',
          medicalConditions: typeof data.medicalHistory === 'string' ? data.medicalHistory : (Array.isArray(data.medicalHistory) ? data.medicalHistory.join(', ') : ''),
          medications: Array.isArray(data.currentMedications) ? data.currentMedications.join(', ') : (data.currentMedications || ''),
          allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : (data.allergies || ''),
          dietaryRestrictions: data.dietaryRestrictions || '',
          mobilityStatus: data.mobilityStatus || '',
          notes: data.notes || ''
        });
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchResident();
  }, [params.id, reset]);
  
  const onSubmit = async (data: ResidentFormData) => {
    setIsSubmitting(true);
    try {
      const isFormValid = await trigger();
      if (!isFormValid) {
        setIsSubmitting(false);
        return;
      }
      // Map dữ liệu form sang request body API chuẩn
      const body = {
        fullName: data.lastName + ' ' + data.firstName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        idNumber: data.idNumber,
        room: data.room,
        careLevel: data.careLevel === 'Cơ bản' ? 'basic' : data.careLevel === 'Nâng cao' ? 'intermediate' : data.careLevel === 'Cao cấp' ? 'advanced' : data.careLevel,
        status: data.status || residentData?.status || 'active',
        admissionDate: data.admissionDate || residentData?.admissionDate || new Date().toISOString().slice(0,10),
        dischargeDate: data.dischargeDate || (residentData?.dischargeDate ?? null),
        familyMemberId: data.familyMemberId || residentData?.familyMemberId || '',
        medicalHistory: data.medicalConditions,
        currentMedications: data.medications ? data.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContact: {
          fullName: data.emergencyContactName,
          relationship: data.emergencyContactRelationship,
          phoneNumber: data.emergencyContactPhone
        },
        contactPhone: data.contactPhone,
        dietaryRestrictions: data.dietaryRestrictions,
        mobilityStatus: data.mobilityStatus,
        notes: data.notes
      };
      await residentAPI.update(params.id, body);
      setSuccessMessage('Thông tin người cao tuổi đã được cập nhật thành công!');
      setTimeout(() => {
        router.push(`/residents/${params.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating resident:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
  if (loading || !params.id) {
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
              href={`/residents/${params?.id}`}
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
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Gói dịch vụ hiện tại
                    </label>
                    <input
                      type="text"
                      value={watchedFields.careLevel || ''}
                      readOnly
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#f3f4f6',
                        color: '#64748b',
                        cursor: 'not-allowed'
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: 4 }}>
                      Để thay đổi gói dịch vụ, vui lòng đăng ký gói mới tại trang <Link href="/services" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Gói dịch vụ</Link>.
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
                    label="Tên người liên hệ khẩn cấp*"
                    name="emergencyContactName"
                    placeholder="VD: Bob Johnson"
                    required
                  />
                  
                  <FormInput
                    label="Quan hệ với người liên hệ*"
                    name="emergencyContactRelationship"
                    placeholder="VD: Bố, vợ, con, người thân"
                    required
                  />
                  
                  <FormInput
                    label="Số điện thoại liên hệ khẩn cấp*"
                    name="emergencyContactPhone"
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
                    <li>Ghi rõ sở thích, thói quen của người cao tuổi</li>
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
                href={`/residents/${params?.id}`}
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