'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeftIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { careNotesAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { userAPI } from '@/lib/api';

interface CareNoteData {
  residentId: string;
  residentName: string;
  noteContent: string;
  priority: string;
  category: string;
  staffName: string;
  date: string;
  time: string;
}

const priorityOptions = [
  { value: 'Thông tin', label: 'Thông tin' },
  { value: 'Quan trọng', label: 'Quan trọng' },
  { value: 'Khẩn cấp', label: 'Khẩn cấp' }
];

const categoryOptions = [
  { value: 'Sức khỏe', label: 'Sức khỏe', icon: '🏥' },
  { value: 'Ăn uống', label: 'Ăn uống', icon: '🍽️' },
  { value: 'Sinh hoạt', label: 'Sinh hoạt', icon: '🏃‍♂️' },
  { value: 'Tâm lý', label: 'Tâm lý', icon: '😊' },
  { value: 'Thuốc men', label: 'Thuốc men', icon: '💊' },
  { value: 'Gia đình', label: 'Gia đình', icon: '👨‍👩‍👧‍👦' },
  { value: 'Khác', label: 'Khác', icon: '📝' }
];

const quickNoteTemplates = [
  'Ăn uống bình thường, tinh thần tốt',
  'Tham gia hoạt động nhóm tích cực',
  'Ngủ đầy đủ, không có vấn đề gì',
  'Cần theo dõi thêm về tình trạng sức khỏe',
  'Gia đình đến thăm, người cao tuổi rất vui',
  'Uống thuốc đầy đủ theo đơn',
  'Có biểu hiện không thoải mái, cần chú ý'
];

export default function NewCareNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user } = useAuth();
  const [staffName, setStaffName] = useState<string>('');

  useEffect(() => {
    if (user && (user as any).full_name) {
      setStaffName((user as any).full_name);
    } else if (user?.id) {
      setStaffName('Đang tải...');
      userAPI.getById(user.id)
        .then(data => setStaffName(data.full_name || data.username || data.email || '---'))
        .catch(() => setStaffName('---'));
    }
  }, [user]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CareNoteData>({
    defaultValues: {
      residentId: searchParams?.get('residentId') || '',
      residentName: searchParams?.get('residentName') || '',
      priority: 'Thông tin',
      category: 'Sức khỏe',
      staffName: 'Nhân viên hiện tại',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      noteContent: ''
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: CareNoteData) => {
    setIsSubmitting(true);
    try {
      // Gộp date và time thành ISO string
      const dateTimeISO = new Date(`${data.date}T${data.time}:00`).toISOString();
      const payload = {
        assessment_type: data.category || 'Đánh giá tổng quát',
        notes: data.noteContent,
        recommendations: '',
        date: dateTimeISO,
        resident_id: String(data.residentId),
        conducted_by: String(user?.id),
      };
      await careNotesAPI.create(payload);
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/staff/assessments');
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      alert('Lưu ghi chú thất bại. Vui lòng thử lại!');
    }
  };

  const insertTemplate = (template: string) => {
    const currentNote = watchedValues.noteContent;
    const newNote = currentNote ? `${currentNote}\n${template}` : template;
    setValue('noteContent', newNote);
  };

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
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <HeartIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Thêm ghi chú mới
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontWeight: 500
              }}>
                {searchParams?.get('residentName') || 'Chọn người cao tuổi'}
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
                  Tên người cao tuổi *
                </label>
                <input
                  {...register('residentName', { required: 'Vui lòng nhập tên người cao tuổi' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#f9fafb'
                  }}
                  placeholder="Nhập tên người cao tuổi"
                />
                {errors.residentName && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.residentName.message}
                  </p>
                )}
              </div>

              {/* Thay thế input staffName bằng hiển thị thông tin nhân viên */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Nhân viên ghi chú
                </label>
                <div style={{
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#f9fafb',
                  color: '#2563eb',
                  fontWeight: 600
                }}>
                  {staffName}
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Mẫu ghi chú nhanh
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem'
              }}>
                {quickNoteTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertTemplate(template)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: '#475569',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Content */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nội dung ghi chú *
              </label>
              <textarea
                {...register('noteContent', { 
                  required: 'Vui lòng nhập nội dung ghi chú',
                  minLength: { value: 10, message: 'Ghi chú phải có ít nhất 10 ký tự' }
                })}
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
                placeholder="Nhập chi tiết về tình trạng, hoạt động, và quan sát của người cao tuổi..."
              />
              {errors.noteContent && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.noteContent.message}
                </p>
              )}
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.5rem' 
              }}>
                {watchedValues.noteContent?.length || 0} ký tự
              </p>
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
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                    Lưu ghi chú
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
                color: '#3b82f6',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Đã lưu ghi chú thành công!
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1rem'
              }}>
                Ghi chú đã được thêm vào hồ sơ chăm sóc.
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
