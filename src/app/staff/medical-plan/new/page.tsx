'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface AppointmentData {
  residentId: string;
  residentName: string;
  appointmentType: string;
  doctor: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  notes: string;
  priority: string;
  reminderTime: string;
}

const appointmentTypes = [
  { value: 'Khám định kỳ', label: 'Khám định kỳ', icon: '📋' },
  { value: 'Khám chuyên khoa', label: 'Khám chuyên khoa', icon: '🩺' },
  { value: 'Xét nghiệm', label: 'Xét nghiệm', icon: '🧪' },
  { value: 'Vật lý trị liệu', label: 'Vật lý trị liệu', icon: '🏃‍♂️' },
  { value: 'Khám mắt', label: 'Khám mắt', icon: '👁️' },
  { value: 'Khám răng', label: 'Khám răng', icon: '🦷' },
  { value: 'Tái khám', label: 'Tái khám', icon: '🔄' },
  { value: 'Cấp cứu', label: 'Cấp cứu', icon: '🚨' }
];

const doctors = [
  'BS. Nguyễn Văn An - Nội tổng quát',
  'BS. Trần Thị Bình - Tim mạch', 
  'BS. Lê Văn Cường - Thần kinh',
  'BS. Hoàng Thị Dung - Lão khoa',
  'BS. Phạm Văn Minh - Ngoại tổng quát',
  'BS. Võ Thị Lan - Mắt',
  'BS. Đỗ Văn Hùng - Răng hàm mặt',
  'KTV. Nguyễn Thị Mai - Vật lý trị liệu'
];

const priorityOptions = [
  { value: 'Thường', label: 'Thường', color: 'bg-blue-100 text-blue-800' },
  { value: 'Quan trọng', label: 'Quan trọng', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Khẩn cấp', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
];

const locations = [
  'Phòng khám tổng quát',
  'Phòng khám chuyên khoa',
  'Phòng xét nghiệm',
  'Phòng vật lý trị liệu',
  'Phòng khám mắt',
  'Phòng nha khoa',
  'Bệnh viện bên ngoài'
];

const durationOptions = [
  { value: '30', label: '30 phút' },
  { value: '45', label: '45 phút' },
  { value: '60', label: '1 giờ' },
  { value: '90', label: '1.5 giờ' },
  { value: '120', label: '2 giờ' }
];

const reminderOptions = [
  { value: '30', label: '30 phút trước' },
  { value: '60', label: '1 giờ trước' },
  { value: '120', label: '2 giờ trước' },
  { value: '1440', label: '1 ngày trước' },
  { value: '2880', label: '2 ngày trước' }
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AppointmentData>({
    defaultValues: {
      residentId: searchParams.get('residentId') || '',
      residentName: searchParams.get('residentName') || '',
      appointmentType: 'Khám định kỳ',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      time: '09:00',
      duration: '60',
      priority: 'Thường',
      reminderTime: '60',
      location: 'Phòng khám tổng quát',
      doctor: '',
      notes: ''
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: AppointmentData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save appointment to localStorage
    const appointments = JSON.parse(localStorage.getItem('nurseryHomeAppointments') || '[]');
    const newAppointment = {
      id: Date.now(),
      ...data,
      status: 'Đã lên lịch',
      createdAt: new Date().toISOString(),
      createdBy: 'Current Staff' // In real app, get from auth context
    };
    
    appointments.push(newAppointment);
    localStorage.setItem('nurseryHomeAppointments', JSON.stringify(appointments));
    
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      router.push('/staff/medical-plan');
    }, 2000);
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
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
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              <ClipboardDocumentCheckIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Lập lịch khám mới
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontWeight: 500
              }}>
                {searchParams.get('residentName') || 'Chọn cư dân'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '2rem'
          }}>
            {/* Basic Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tên cư dân *
                </label>
                <input
                  {...register('residentName', { required: 'Vui lòng nhập tên cư dân' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#f9fafb'
                  }}
                  placeholder="Nhập tên cư dân"
                />
                {errors.residentName && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.residentName.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Loại khám *
                </label>
                <select
                  {...register('appointmentType', { required: 'Vui lòng chọn loại khám' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  {appointmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                {errors.appointmentType && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.appointmentType.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Bác sĩ/Chuyên viên *
                </label>
                <select
                  {...register('doctor', { required: 'Vui lòng chọn bác sĩ' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Chọn bác sĩ/chuyên viên</option>
                  {doctors.map(doctor => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
                {errors.doctor && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.doctor.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Địa điểm *
                </label>
                <select
                  {...register('location', { required: 'Vui lòng chọn địa điểm' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngày khám *
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Vui lòng chọn ngày khám' })}
                  min={minDate}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                {errors.date && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Thời gian *
                </label>
                <input
                  type="time"
                  {...register('time', { required: 'Vui lòng chọn thời gian' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                {errors.time && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.time.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Thời gian dự kiến *
                </label>
                <select
                  {...register('duration', { required: 'Vui lòng chọn thời gian' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  {durationOptions.map(duration => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
                {errors.duration && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.duration.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mức độ ưu tiên *
                </label>
                <select
                  {...register('priority', { required: 'Vui lòng chọn mức độ ưu tiên' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  {priorityOptions.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.priority.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Nhắc nhở trước
                </label>
                <select
                  {...register('reminderTime')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  {reminderOptions.map(reminder => (
                    <option key={reminder.value} value={reminder.value}>
                      {reminder.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ghi chú thêm
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
                placeholder="Ghi chú về mục đích khám, triệu chứng cần theo dõi, chuẩn bị đặc biệt..."
              />
            </div>

            {/* Appointment Summary */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Tóm tắt lịch khám
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    Cư dân:
                  </span>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.25rem 0 0 0' }}>
                    {watchedValues.residentName || 'Chưa chọn'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    Loại khám:
                  </span>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.25rem 0 0 0' }}>
                    {watchedValues.appointmentType}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    Thời gian:
                  </span>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.25rem 0 0 0' }}>
                    {watchedValues.date && watchedValues.time 
                      ? `${new Date(watchedValues.date).toLocaleDateString('vi-VN')} lúc ${watchedValues.time}` 
                      : 'Chưa chọn'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    Bác sĩ:
                  </span>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.25rem 0 0 0' }}>
                    {watchedValues.doctor || 'Chưa chọn'}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: isSubmitting 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    Lưu lịch khám
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              textAlign: 'center'
            }}>
              <CheckCircleIcon style={{
                width: '4rem',
                height: '4rem',
                color: '#f59e0b',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Đã lập lịch khám thành công!
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1rem'
              }}>
                Lịch khám đã được tạo và sẽ có nhắc nhở trước khi đến giờ.
              </p>
            </div>
          </div>
        )}
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