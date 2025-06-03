"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type MedicalRecordFormData = {
  residentId: string;
  recordType: string;
  date: string;
  doctor: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  followUp: string;
  notes: string;
  priority: string;
  status: string;
};

const recordTypes = [
  'Ghi chú y tế',
  'Kê đơn thuốc',
  'Báo cáo xét nghiệm',
  'Kiểm tra sức khỏe',
  'Khám định kỳ',
  'Cấp cứu',
  'Tư vấn chuyên khoa'
];

const doctors = [
  'Dr. Robert Brown',
  'Dr. Sarah Williams',
  'Dr. Elizabeth Wilson',
  'Dr. Michael Chen',
  'Dr. Lisa Anderson'
];

const priorities = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
const statuses = ['Đang xử lý', 'Hoàn thành', 'Cần theo dõi', 'Đã hủy'];

// Mock residents data for dropdown
const residents = [
  { id: 1, name: 'Nguyễn Văn A' },
  { id: 2, name: 'Trần Thị B' },
  { id: 3, name: 'Lê Văn C' },
  { id: 4, name: 'Hoàng Văn D' },
  { id: 5, name: 'Phạm Thị E' }
];

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<MedicalRecordFormData>();
  
  const onSubmit = async (data: MedicalRecordFormData) => {
    setIsSubmitting(true);
    
    try {
      // Get existing medical records
      const existingRecords = localStorage.getItem('nurseryHomeMedicalRecords');
      const recordsList = existingRecords ? JSON.parse(existingRecords) : [];
      
      // Find resident name
      const resident = residents.find(r => r.id === parseInt(data.residentId));
      
      // Generate new ID
      const newId = recordsList.length > 0 ? Math.max(...recordsList.map((r: any) => r.id)) + 1 : 1;
      
      // Create new medical record
      const newRecord = {
        id: newId,
        residentId: parseInt(data.residentId),
        residentName: resident?.name || 'Unknown',
        recordType: data.recordType,
        date: data.date,
        doctor: data.doctor,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        medications: data.medications.split(',').map(m => m.trim()).filter(m => m),
        followUp: data.followUp,
        notes: data.notes,
        priority: data.priority,
        status: data.status,
        createdAt: new Date().toISOString()
      };
      
      // Add to records list
      recordsList.push(newRecord);
      
      // Save to localStorage
      localStorage.setItem('nurseryHomeMedicalRecords', JSON.stringify(recordsList));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      reset();
      
      // Redirect to medical records list
      router.push('/medical');
    } catch (error) {
      console.error('Error creating medical record:', error);
      alert('Có lỗi xảy ra khi tạo hồ sơ y tế. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
        <Link href="/medical" style={{color: '#6b7280', display: 'flex', marginRight: '0.75rem'}}>
          <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Tạo hồ sơ y tế mới</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          
          {/* Basic Information */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin cơ bản
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              <div>
                <label htmlFor="residentId" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Cư dân*
                </label>
                <select
                  id="residentId"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.residentId ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('residentId', { required: 'Chọn cư dân là bắt buộc' })}
                >
                  <option value="">Chọn cư dân</option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>{resident.name}</option>
                  ))}
                </select>
                {errors.residentId && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.residentId.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="recordType" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Loại hồ sơ*
                </label>
                <select
                  id="recordType"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.recordType ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('recordType', { required: 'Loại hồ sơ là bắt buộc' })}
                >
                  <option value="">Chọn loại hồ sơ</option>
                  {recordTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.recordType && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.recordType.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="date" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ngày khám*
                </label>
                <input
                  id="date"
                  type="date"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.date ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('date', { required: 'Ngày khám là bắt buộc' })}
                />
                {errors.date && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.date.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="doctor" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Bác sĩ*
                </label>
                <select
                  id="doctor"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.doctor ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('doctor', { required: 'Chọn bác sĩ là bắt buộc' })}
                >
                  <option value="">Chọn bác sĩ</option>
                  {doctors.map(doctor => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
                {errors.doctor && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.doctor.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="priority" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Mức độ ưu tiên*
                </label>
                <select
                  id="priority"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.priority ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('priority', { required: 'Mức độ ưu tiên là bắt buộc' })}
                >
                  <option value="">Chọn mức độ ưu tiên</option>
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                {errors.priority && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.priority.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="status" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Trạng thái*
                </label>
                <select
                  id="status"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.status ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('status', { required: 'Trạng thái là bắt buộc' })}
                >
                  <option value="">Chọn trạng thái</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Medical Details */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Chi tiết y tế
            </h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              <div>
                <label htmlFor="symptoms" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Triệu chứng
                </label>
                <textarea
                  id="symptoms"
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
                  placeholder="Mô tả các triệu chứng quan sát được..."
                  {...register('symptoms')}
                />
              </div>
              
              <div>
                <label htmlFor="diagnosis" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Chẩn đoán
                </label>
                <textarea
                  id="diagnosis"
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
                  placeholder="Chẩn đoán của bác sĩ..."
                  {...register('diagnosis')}
                />
              </div>
              
              <div>
                <label htmlFor="treatment" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Phương pháp điều trị
                </label>
                <textarea
                  id="treatment"
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
                  placeholder="Mô tả phương pháp điều trị..."
                  {...register('treatment')}
                />
              </div>
              
              <div>
                <label htmlFor="medications" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Thuốc men
                </label>
                <input
                  id="medications"
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
                  placeholder="Phân cách bằng dấu phẩy (VD: Aspirin 100mg, Lisinopril 10mg)"
                  {...register('medications')}
                />
              </div>
              
              <div>
                <label htmlFor="followUp" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Lịch tái khám
                </label>
                <input
                  id="followUp"
                  type="date"
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
                  {...register('followUp')}
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
                  placeholder="Các ghi chú khác..."
                  {...register('notes')}
                />
              </div>
            </div>
          </div>
          
          {/* Form Buttons */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem'}}>
            <Link 
              href="/medical" 
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
              {isSubmitting ? 'Đang lưu...' : 'Tạo hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 