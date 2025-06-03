"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
  notes: string;
};

export default function AddResidentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<ResidentFormData>();
  
  const onSubmit = async (data: ResidentFormData) => {
    setIsSubmitting(true);
    
    try {
      // Here you would normally send the data to your API
      // For now we'll just simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form data submitted:', data);
      
      // Reset the form
      reset();
      
      // Redirect to the residents list
      router.push('/residents');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div style={{marginBottom: '2rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
        <Link href="/residents" style={{marginRight: '1rem', color: '#6b7280', display: 'flex'}}>
          <ArrowLeftIcon style={{height: '1.25rem', width: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827'}}>Thêm cư dân mới</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
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
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
              {errors.gender && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.gender.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="room" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Số phòng*
              </label>
              <input
                id="room"
                type="text"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.room ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('room', { required: 'Số phòng là bắt buộc' })}
              />
              {errors.room && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.room.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="careLevel" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Gói dịch vụ*
              </label>
              <select
                id="careLevel"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.careLevel ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('careLevel', { required: 'Gói dịch vụ là bắt buộc' })}
              >
                <option value="">Chọn gói dịch vụ</option>
                <option value="Cơ bản">Cơ bản</option>
                <option value="Nâng cao">Nâng cao</option>
                <option value="Cao cấp">Cao cấp</option>
              </select>
              {errors.careLevel && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.careLevel.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="emergencyContact" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Người liên hệ khẩn cấp*
              </label>
              <input
                id="emergencyContact"
                type="text"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.emergencyContact ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('emergencyContact', { required: 'Người liên hệ khẩn cấp là bắt buộc' })}
              />
              {errors.emergencyContact && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.emergencyContact.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="contactPhone" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Số điện thoại khẩn cấp*
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
                {...register('contactPhone', { required: 'Số điện thoại liên hệ là bắt buộc' })}
              />
              {errors.contactPhone && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.contactPhone.message}</p>
              )}
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
            <div>
              <label htmlFor="medicalConditions" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Tình trạng sức khỏe
              </label>
              <textarea
                id="medicalConditions"
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
                placeholder="Nhập các tình trạng sức khỏe, phân cách bằng dấu phẩy"
                {...register('medicalConditions')}
              />
            </div>
            
            <div>
              <label htmlFor="medications" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Thuốc đang sử dụng
              </label>
              <textarea
                id="medications"
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
                placeholder="Nhập thuốc đang sử dụng, phân cách bằng dấu phẩy"
                {...register('medications')}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="allergies" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Dị ứng
            </label>
            <input
              id="allergies"
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
              placeholder="Nhập các dị ứng, phân cách bằng dấu phẩy"
              {...register('allergies')}
            />
          </div>
          
          <div>
            <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Ghi chú bổ sung
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
          
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
            <Link 
              href="/residents" 
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu cư dân'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 