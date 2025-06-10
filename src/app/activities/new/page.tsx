"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useActivities } from '@/lib/activities-context';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  DocumentTextIcon,
  CubeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ActivityFormData {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  location: string;
  facilitator: string;
  maxCapacity: number;
  difficultyLevel: 'Dễ' | 'Trung bình' | 'Khó';
  ageGroupSuitability: string[];
  healthRequirements: string[];
  materials: string;
  benefits: string[];
  recurring: string;
  specialNotes: string;
  approvalRequired: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

// Professional categories with detailed info
const ACTIVITY_CATEGORIES = [
  { 
    id: 'physical', 
    name: 'Thể chất', 
    color: '#10b981',
    icon: HeartIcon,
    description: 'Các hoạt động vận động, tập thể dục'
  },
  { 
    id: 'creative', 
    name: 'Sáng tạo', 
    color: '#8b5cf6',
    icon: SparklesIcon,
    description: 'Nghệ thuật, thủ công, sáng tạo'
  },
  { 
    id: 'therapy', 
    name: 'Trị liệu', 
    color: '#ec4899',
    icon: HeartIcon,
    description: 'Âm nhạc trị liệu, vật lý trị liệu'
  },
  { 
    id: 'cognitive', 
    name: 'Nhận thức', 
    color: '#3b82f6',
    icon: DocumentTextIcon,
    description: 'Trò chơi trí nhớ, tư duy logic'
  },
  { 
    id: 'social', 
    name: 'Xã hội', 
    color: '#f59e0b',
    icon: UserGroupIcon,
    description: 'Giao lưu, tương tác xã hội'
  },
  { 
    id: 'educational', 
    name: 'Giáo dục', 
    color: '#06b6d4',
    icon: DocumentTextIcon,
    description: 'Học tập, chia sẻ kiến thức'
  }
];

const LOCATIONS = [
  'Phòng sinh hoạt chung',
  'Phòng hoạt động',
  'Khu vườn',
  'Phòng giải trí',
  'Phòng ăn',
  'Sân thể thao',
  'Phòng trị liệu',
  'Phòng nghệ thuật',
  'Ban công',
  'Sảnh chính'
];

const FACILITATORS = [
  'David Wilson',
  'Emily Parker', 
  'Sarah Thompson',
  'Robert Johnson',
  'Nguyễn Thị Lan',
  'Trần Văn Minh',
  'Lê Thị Hoa'
];

const AGE_GROUPS = [
  '60-70 tuổi',
  '70-80 tuổi', 
  '80+ tuổi',
  'Tất cả độ tuổi'
];

const HEALTH_REQUIREMENTS = [
  'Không có yêu cầu đặc biệt',
  'Có thể đi lại được',
  'Cần hỗ trợ di chuyển',
  'Không có vấn đề tim mạch',
  'Không có vấn đề thở',
  'Có thể ngồi lâu',
  'Tầm nhìn tốt',
  'Nghe tốt'
];

const RECURRING_OPTIONS = [
  { value: 'none', label: 'Không lặp lại' },
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'biweekly', label: 'Hai tuần một lần' },
  { value: 'monthly', label: 'Hàng tháng' }
];

export default function NewActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addActivity } = useActivities();
  
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    category: '',
    location: '',
    facilitator: '',
    maxCapacity: 20,
    difficultyLevel: 'Dễ',
    ageGroupSuitability: [],
    healthRequirements: [],
    materials: '',
    benefits: [],
    recurring: 'none',
    specialNotes: '',
    approvalRequired: false
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  // Check permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Advanced validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tên hoạt động là bắt buộc';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tên hoạt động phải có ít nhất 3 ký tự';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả hoạt động là bắt buộc';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
    }

    if (!formData.date) {
      newErrors.date = 'Ngày tổ chức là bắt buộc';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Không thể chọn ngày trong quá khứ';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Thời gian bắt đầu là bắt buộc';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Thời gian kết thúc là bắt buộc';
    }

    // Time validation
    if (formData.startTime && formData.endTime) {
      const start = new Date(`1970-01-01T${formData.startTime}`);
      const end = new Date(`1970-01-01T${formData.endTime}`);
      
      if (start >= end) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
      
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration > 180) {
        newErrors.endTime = 'Hoạt động không nên quá 3 giờ';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Phân loại hoạt động là bắt buộc';
    }

    if (!formData.location) {
      newErrors.location = 'Địa điểm là bắt buộc';
    }

    if (!formData.facilitator) {
      newErrors.facilitator = 'Hướng dẫn viên là bắt buộc';
    }

    if (formData.maxCapacity < 1 || formData.maxCapacity > 50) {
      newErrors.maxCapacity = 'Sức chứa phải từ 1 đến 50 người';
    }

    if (formData.ageGroupSuitability.length === 0) {
      newErrors.ageGroupSuitability = 'Phải chọn ít nhất một nhóm tuổi phù hợp';
    }

    if (formData.healthRequirements.length === 0) {
      newErrors.healthRequirements = 'Phải chọn ít nhất một yêu cầu sức khỏe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ActivityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelectChange = (field: 'ageGroupSuitability' | 'healthRequirements' | 'benefits', value: string) => {
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    handleInputChange(field, newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Calculate duration
      const start = new Date(`1970-01-01T${formData.startTime}`);
      const end = new Date(`1970-01-01T${formData.endTime}`);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      // Create activity data for context
      const activityData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: duration,
        capacity: formData.maxCapacity,
        facilitator: formData.facilitator,
        date: formData.date,
        status: 'Đã lên lịch',
        level: formData.difficultyLevel,
        recurring: formData.recurring,
        materials: formData.materials,
        specialNotes: formData.specialNotes,
        ageGroupSuitability: formData.ageGroupSuitability,
        healthRequirements: formData.healthRequirements
      };

      // Save to context
      addActivity(activityData);
      
      // Success message could be shown here
      router.push('/activities');
    } catch (error) {
      console.error('Error creating activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedCategory = ACTIVITY_CATEGORIES.find(cat => cat.id === formData.category);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Link
              href="/activities"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: '#f1f5f9',
                color: '#64748b',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
        </Link>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                Thêm hoạt động mới
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontWeight: 500
              }}>
                Tạo chương trình sinh hoạt cho người cao tuổi
              </p>
            </div>
      </div>
      
          {/* Progress Steps */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {[1, 2, 3].map((step) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  background: currentStep >= step 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : '#e2e8f0',
                  color: currentStep >= step ? 'white' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}>
                  {step}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: currentStep >= step ? '#374151' : '#94a3b8'
                }}>
                  {step === 1 && 'Thông tin cơ bản'}
                  {step === 2 && 'Chi tiết hoạt động'}
                  {step === 3 && 'Xác nhận'}
                </span>
                {step < 3 && (
                  <div style={{
                    width: '2rem',
                    height: '2px',
                    background: currentStep > step ? '#f59e0b' : '#e2e8f0',
                    marginLeft: '0.5rem'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
          <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <InformationCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  Thông tin cơ bản
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* Activity Name */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Tên hoạt động *
            </label>
            <input
              type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập tên hoạt động"
              style={{
                width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
                fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                outline: 'none'
              }}
                      onFocus={(e) => {
                        if (!errors.name) e.target.style.borderColor = '#f59e0b';
                      }}
                      onBlur={(e) => {
                        if (!errors.name) e.target.style.borderColor = '#e2e8f0';
                      }}
                    />
                    {errors.name && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.name}
                      </p>
            )}
          </div>
          
                  {/* Category */}
            <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Phân loại hoạt động *
              </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {ACTIVITY_CATEGORIES.map((category) => {
                        const IconComponent = category.icon;
                        const isSelected = formData.category === category.id;
                        
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleInputChange('category', category.id)}
                style={{
                              padding: '0.75rem',
                              borderRadius: '0.75rem',
                              border: `2px solid ${isSelected ? category.color : '#e2e8f0'}`,
                              background: isSelected ? `${category.color}10` : 'white',
                              color: isSelected ? category.color : '#64748b',
                              textAlign: 'center',
                  fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <IconComponent style={{ width: '1.5rem', height: '1.5rem' }} />
                            <span>{category.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.category && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.category}
                      </p>
              )}
            </div>
            
                  {/* Date and Time */}
            <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      <CalendarIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Ngày tổ chức *
              </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.date ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                    />
                    {errors.date && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.date}
                      </p>
              )}
            </div>
            
                  {/* Start Time */}
            <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      <ClockIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Thời gian bắt đầu *
              </label>
              <input
                type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                style={{
                  width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.startTime ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              />
              {errors.startTime && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.startTime}
                      </p>
              )}
            </div>
            
                  {/* End Time */}
            <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      <ClockIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Thời gian kết thúc *
              </label>
              <input
                type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                style={{
                  width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.endTime ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              />
              {errors.endTime && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.endTime}
                      </p>
                    )}
          </div>
          
                  {/* Location */}
            <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      <MapPinIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Địa điểm *
              </label>
              <select
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                style={{
                  width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.location ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        background: 'white'
                }}
              >
                <option value="">Chọn địa điểm</option>
                      {LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              {errors.location && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.location}
                      </p>
              )}
            </div>
            
                  {/* Facilitator */}
            <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      <UsersIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Hướng dẫn viên *
              </label>
                    <select
                      value={formData.facilitator}
                      onChange={(e) => handleInputChange('facilitator', e.target.value)}
                style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.facilitator ? '#ef4444' : '#e2e8f0'}`,
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        background: 'white'
                      }}
                    >
                      <option value="">Chọn hướng dẫn viên</option>
                      {FACILITATORS.map((facilitator) => (
                        <option key={facilitator} value={facilitator}>
                          {facilitator}
                        </option>
                      ))}
                    </select>
                    {errors.facilitator && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.facilitator}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                  display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Mô tả hoạt động *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Mô tả chi tiết về hoạt động, mục tiêu và cách thức thực hiện"
                      rows={4}
                      style={{
                  width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '100px'
                      }}
                    />
                    {errors.description && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.description}
                      </p>
              )}
            </div>
          </div>
              </div>
            )}
          
            {/* Step 2: Activity Details */}
            {currentStep === 2 && (
          <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CubeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  Chi tiết hoạt động
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* Max Capacity */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      <UserGroupIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Sức chứa tối đa *
            </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maxCapacity}
                      onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${errors.maxCapacity ? '#ef4444' : '#e2e8f0'}`,
                fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                outline: 'none'
              }}
                    />
                    {errors.maxCapacity && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.maxCapacity}
                      </p>
            )}
          </div>
          
                  {/* Difficulty Level */}
          <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Mức độ khó
            </label>
            <div style={{
                      display: 'flex',
                      gap: '0.75rem'
                    }}>
                      {['Dễ', 'Trung bình', 'Khó'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleInputChange('difficultyLevel', level as any)}
                  style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${formData.difficultyLevel === level ? '#f59e0b' : '#e2e8f0'}`,
                            background: formData.difficultyLevel === level ? '#fef3c7' : 'white',
                            color: formData.difficultyLevel === level ? '#d97706' : '#64748b',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                    cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {level}
                        </button>
                      ))}
                  </div>
                </div>

                  {/* Age Group Suitability */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Nhóm tuổi phù hợp *
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {AGE_GROUPS.map((ageGroup) => {
                        const isSelected = formData.ageGroupSuitability.includes(ageGroup);
                        return (
                          <button
                            key={ageGroup}
                            type="button"
                            onClick={() => handleMultiSelectChange('ageGroupSuitability', ageGroup)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                              background: isSelected ? '#eff6ff' : 'white',
                              color: isSelected ? '#1d4ed8' : '#64748b',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                          >
                            {ageGroup}
                          </button>
                        );
                      })}
            </div>
                    {errors.ageGroupSuitability && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.ageGroupSuitability}
                      </p>
            )}
          </div>
          
                  {/* Health Requirements */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Yêu cầu sức khỏe *
              </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {HEALTH_REQUIREMENTS.map((requirement) => {
                        const isSelected = formData.healthRequirements.includes(requirement);
                        return (
                          <button
                            key={requirement}
                            type="button"
                            onClick={() => handleMultiSelectChange('healthRequirements', requirement)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                              background: isSelected ? '#ecfdf5' : 'white',
                              color: isSelected ? '#047857' : '#64748b',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                          >
                            {requirement}
                          </button>
                        );
                      })}
            </div>
                    {errors.healthRequirements && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                        {errors.healthRequirements}
                      </p>
                    )}
          </div>
          
                  {/* Recurring */}
          <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Tần suất lặp lại
            </label>
                    <select
                      value={formData.recurring}
                      onChange={(e) => handleInputChange('recurring', e.target.value)}
              style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '2px solid #e2e8f0',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        background: 'white'
                      }}
                    >
                      {RECURRING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Materials */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Vật dụng cần chuẩn bị
                    </label>
                    <textarea
                      value={formData.materials}
                      onChange={(e) => handleInputChange('materials', e.target.value)}
                      placeholder="Liệt kê các vật dụng, thiết bị cần chuẩn bị cho hoạt động..."
                      rows={3}
                      style={{
                width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '2px solid #e2e8f0',
                fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        resize: 'vertical'
              }}
            />
          </div>
          
                  {/* Special Notes */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Ghi chú đặc biệt
            </label>
            <textarea
                      value={formData.specialNotes}
                      onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                      placeholder="Các lưu ý đặc biệt, hạn chế hoặc yêu cầu bổ sung..."
              rows={3}
              style={{
                width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '2px solid #e2e8f0',
                fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        resize: 'vertical'
              }}
            />
          </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                  Xác nhận thông tin
                </h2>

                <div style={{
                  background: '#f8fafc',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {/* Activity Overview */}
                    <div style={{
                      background: 'white',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '1rem'
                      }}>
                        Thông tin hoạt động
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Tên: </span>
                          <span style={{ color: '#6b7280' }}>{formData.name || 'Chưa nhập'}</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Loại: </span>
                          <span style={{ color: '#6b7280' }}>
                            {ACTIVITY_CATEGORIES.find(cat => cat.id === formData.category)?.name || 'Chưa chọn'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Ngày: </span>
                          <span style={{ color: '#6b7280' }}>
                            {formData.date ? new Date(formData.date).toLocaleDateString('vi-VN') : 'Chưa chọn'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Thời gian: </span>
                          <span style={{ color: '#6b7280' }}>
                            {formData.startTime && formData.endTime 
                              ? `${formData.startTime} - ${formData.endTime}`
                              : 'Chưa chọn'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Địa điểm: </span>
                          <span style={{ color: '#6b7280' }}>{formData.location || 'Chưa chọn'}</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Hướng dẫn viên: </span>
                          <span style={{ color: '#6b7280' }}>{formData.facilitator || 'Chưa chọn'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div style={{
                      background: 'white',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '1rem'
                      }}>
                        Chi tiết
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Sức chứa: </span>
                          <span style={{ color: '#6b7280' }}>{formData.maxCapacity} người</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Mức độ: </span>
                          <span style={{ color: '#6b7280' }}>{formData.difficultyLevel}</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Nhóm tuổi: </span>
                          <span style={{ color: '#6b7280' }}>
                            {formData.ageGroupSuitability.length > 0 
                              ? formData.ageGroupSuitability.join(', ')
                              : 'Chưa chọn'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Tần suất: </span>
                          <span style={{ color: '#6b7280' }}>
                            {RECURRING_OPTIONS.find(opt => opt.value === formData.recurring)?.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {formData.description && (
                      <div style={{
                        gridColumn: '1 / -1',
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '1rem'
                        }}>
                          Mô tả hoạt động
                        </h3>
                        <p style={{
                          color: '#6b7280',
                          lineHeight: 1.6,
                          margin: 0
                        }}>
                          {formData.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
              style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                border: '1px solid #d1d5db', 
                      background: 'white',
                color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Quay lại
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                {currentStep < 3 ? (
            <button
                    type="button"
                    onClick={() => {
                      // Basic validation for current step before proceeding
                      if (currentStep === 1) {
                        const basicFields = ['name', 'description', 'date', 'startTime', 'endTime', 'category', 'location', 'facilitator'];
                        const hasBasicErrors = basicFields.some(field => {
                          if (field === 'name') return !formData.name.trim() || formData.name.length < 3;
                          if (field === 'description') return !formData.description.trim() || formData.description.length < 10;
                          if (field === 'date') {
                            if (!formData.date) return true;
                            const selectedDate = new Date(formData.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return selectedDate < today;
                          }
                          return !formData[field as keyof ActivityFormData];
                        });
                        
                        if (hasBasicErrors) {
                          validateForm();
                          return;
                        }
                      }
                      setCurrentStep(prev => prev + 1);
                    }}
              style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                fontSize: '0.875rem', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: isSubmitting 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white', 
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    {isSubmitting ? 'Đang tạo...' : 'Tạo hoạt động'}
            </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 
