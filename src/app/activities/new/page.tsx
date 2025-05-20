"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, ClockIcon, UsersIcon, MapPinIcon } from '@heroicons/react/24/outline';

type ActivityFormData = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  category: string;
  staff: string[];
  requiresAssistance: boolean;
  materials: string;
  notes: string;
};

const CATEGORIES = [
  { id: 'entertainment', name: 'Giải trí' },
  { id: 'education', name: 'Giáo dục' },
  { id: 'exercise', name: 'Thể dục' },
  { id: 'social', name: 'Giao lưu xã hội' },
  { id: 'therapy', name: 'Trị liệu' },
  { id: 'outdoor', name: 'Hoạt động ngoài trời' },
  { id: 'arts', name: 'Nghệ thuật và thủ công' },
  { id: 'music', name: 'Âm nhạc' },
  { id: 'cooking', name: 'Nấu ăn' },
  { id: 'other', name: 'Khác' },
];

const STAFF_MEMBERS = [
  { id: '1', name: 'Nguyễn Văn A', position: 'Y tá' },
  { id: '2', name: 'Trần Thị B', position: 'Điều dưỡng' },
  { id: '3', name: 'Lê Văn C', position: 'Nhân viên hoạt động' },
  { id: '4', name: 'Phạm Thị D', position: 'Chuyên viên trị liệu' },
  { id: '5', name: 'Hoàng Văn E', position: 'Nhân viên hỗ trợ' },
];

const LOCATIONS = [
  'Phòng sinh hoạt chung',
  'Sảnh chính',
  'Khu vườn',
  'Phòng ăn',
  'Phòng nghệ thuật',
  'Phòng đa năng',
  'Sân thể thao',
  'Phòng trị liệu',
];

export default function NewActivityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset, 
    watch 
  } = useForm<ActivityFormData>();
  
  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    
    try {
      // Add selected staff to form data
      data.staff = selectedStaff;
      
      // Here you would normally send the data to your API
      // For now we'll just simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form data submitted:', data);
      
      // Reset the form
      reset();
      
      // Redirect to the activities list
      router.push('/activities');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleStaffSelection = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };
  
  return (
    <div style={{marginBottom: '2rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
        <Link href="/activities" style={{marginRight: '1rem', color: '#6b7280', display: 'flex'}}>
          <ArrowLeftIcon style={{height: '1rem', width: '1rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827'}}>Thêm hoạt động mới</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div>
            <label htmlFor="title" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Tên hoạt động*
            </label>
            <input
              id="title"
              type="text"
              style={{
                display: 'block',
                width: '100%',
                borderRadius: '0.375rem',
                border: `1px solid ${errors.title ? '#fca5a5' : '#d1d5db'}`,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              placeholder="Nhập tên hoạt động"
              {...register('title', { required: 'Tên hoạt động là bắt buộc' })}
            />
            {errors.title && (
              <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.title.message}</p>
            )}
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
            <div>
              <label htmlFor="date" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <CalendarIcon style={{height: '1rem', width: '1rem'}} />
                  <span>Ngày*</span>
                </div>
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
                {...register('date', { required: 'Ngày là bắt buộc' })}
              />
              {errors.date && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.date.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="category" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Phân loại*
              </label>
              <select
                id="category"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.category ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('category', { required: 'Phân loại là bắt buộc' })}
              >
                <option value="">Chọn phân loại</option>
                {CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="startTime" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <ClockIcon style={{height: '1rem', width: '1rem'}} />
                  <span>Thời gian bắt đầu*</span>
                </div>
              </label>
              <input
                id="startTime"
                type="time"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.startTime ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('startTime', { required: 'Thời gian bắt đầu là bắt buộc' })}
              />
              {errors.startTime && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.startTime.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endTime" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <ClockIcon style={{height: '1rem', width: '1rem'}} />
                  <span>Thời gian kết thúc*</span>
                </div>
              </label>
              <input
                id="endTime"
                type="time"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.endTime ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('endTime', { required: 'Thời gian kết thúc là bắt buộc' })}
              />
              {errors.endTime && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.endTime.message}</p>
              )}
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
            <div>
              <label htmlFor="location" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <MapPinIcon style={{height: '1rem', width: '1rem'}} />
                  <span>Địa điểm*</span>
                </div>
              </label>
              <select
                id="location"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.location ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('location', { required: 'Địa điểm là bắt buộc' })}
              >
                <option value="">Chọn địa điểm</option>
                {LOCATIONS.map((location, index) => (
                  <option key={index} value={location}>
                    {location}
                  </option>
                ))}
                <option value="other">Khác</option>
              </select>
              {errors.location && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.location.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="maxParticipants" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <UsersIcon style={{height: '1rem', width: '1rem'}} />
                  <span>Số lượng người tham gia tối đa*</span>
                </div>
              </label>
              <input
                id="maxParticipants"
                type="number"
                min="1"
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: `1px solid ${errors.maxParticipants ? '#fca5a5' : '#d1d5db'}`,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                {...register('maxParticipants', { 
                  required: 'Số lượng người tham gia là bắt buộc',
                  min: { value: 1, message: 'Số lượng phải lớn hơn 0' },
                  valueAsNumber: true
                })}
              />
              {errors.maxParticipants && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.maxParticipants.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="description" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Mô tả*
            </label>
            <textarea
              id="description"
              rows={3}
              style={{
                display: 'block',
                width: '100%',
                borderRadius: '0.375rem',
                border: `1px solid ${errors.description ? '#fca5a5' : '#d1d5db'}`,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              placeholder="Mô tả chi tiết về hoạt động"
              {...register('description', { required: 'Mô tả là bắt buộc' })}
            />
            {errors.description && (
              <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.description.message}</p>
            )}
          </div>
          
          <div>
            <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem'}}>
              Nhân viên phụ trách*
            </label>
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {STAFF_MEMBERS.map(staff => (
                <div 
                  key={staff.id} 
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.25rem',
                    backgroundColor: selectedStaff.includes(staff.id) ? '#e0f2fe' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => toggleStaffSelection(staff.id)}
                >
                  <div>
                    <div style={{fontWeight: 500}}>{staff.name}</div>
                    <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{staff.position}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(staff.id)}
                    onChange={() => {}}
                    style={{width: '1rem', height: '1rem'}}
                  />
                </div>
              ))}
            </div>
            {selectedStaff.length === 0 && (
              <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>Vui lòng chọn ít nhất một nhân viên phụ trách</p>
            )}
          </div>
          
          <div>
            <div style={{marginBottom: '0.5rem'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  style={{width: '1rem', height: '1rem'}}
                  {...register('requiresAssistance')}
                />
                <span>Yêu cầu hỗ trợ đặc biệt</span>
              </label>
            </div>
          </div>
          
          <div>
            <label htmlFor="materials" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Tài liệu và dụng cụ
            </label>
            <textarea
              id="materials"
              rows={2}
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
              placeholder="Liệt kê các tài liệu và dụng cụ cần chuẩn bị"
              {...register('materials')}
            />
          </div>
          
          <div>
            <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Ghi chú bổ sung
            </label>
            <textarea
              id="notes"
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
              placeholder="Nhập ghi chú hoặc thông tin bổ sung"
              {...register('notes')}
            />
          </div>
          
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem'}}>
            <Link 
              href="/activities" 
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
              disabled={isSubmitting || selectedStaff.length === 0}
              style={{
                padding: '0.5rem 1rem', 
                border: '1px solid transparent', 
                borderRadius: '0.375rem', 
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'white', 
                backgroundColor: '#0284c7',
                cursor: (isSubmitting || selectedStaff.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || selectedStaff.length === 0) ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Tạo hoạt động'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 