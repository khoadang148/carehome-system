"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type ActivityFormData = {
  name: string;
  description: string;
  category: string;
  location: string;
  scheduledTime: string;
  duration: number;
  capacity: number;
  facilitator: string;
  date: string;
  notes: string;
  materials: string;
  benefits: string;
  level: string;
  recurring: string;
  status: string;
};


const categories = ['Thể chất', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội', 'Giáo dục'];
const locations = ['Phòng sinh hoạt chung', 'Phòng hoạt động', 'Khu vườn', 'Phòng giải trí', 'Phòng ăn', 'Sân thượng'];
const facilitators = ['David Wilson', 'Emily Parker', 'Robert Johnson', 'Sarah Thompson', 'Michael Chen'];
const levels = ['Dễ', 'Trung bình', 'Khó'];
const recurringOptions = ['Một lần', 'Hàng ngày', 'Hàng tuần', 'Hàng tháng'];
const statusOptions = ['Đã lên lịch', 'Đang diễn ra', 'Đã hoàn thành', 'Đã hủy'];

// Mock activities data
const activitiesData = [
  { 
    id: 1, 
    name: 'Tập thể dục buổi sáng', 
    description: 'Các bài tập kéo giãn và vận động nhẹ nhàng để cải thiện khả năng vận động. Hoạt động này được thiết kế đặc biệt cho người cao tuổi nhằm duy trì sức khỏe thể chất và tinh thần.',
    category: 'Thể chất', 
    location: 'Phòng sinh hoạt chung',
    scheduledTime: '08:00', 
    duration: 45,
    capacity: 20,
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
      'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R'
    ],
    facilitator: 'David Wilson',
    facilitatorId: 5,
    date: '2024-01-15',
    notes: 'Cần chuẩn bị thảm tập yoga và nhạc nhẹ nhàng. Kiểm tra sức khỏe của các cư dân trước khi tham gia.',
    materials: ['Thảm tập yoga', 'Loa phát nhạc', 'Nước uống', 'Khăn nhỏ'],
    benefits: ['Cải thiện khả năng vận động', 'Tăng cường sức khỏe tim mạch', 'Giảm căng thẳng', 'Cải thiện tâm trạng'],
    level: 'Dễ',
    recurring: 'Hàng ngày',
    status: 'Đã lên lịch'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    description: 'Hoạt động vẽ tranh và làm đồ thủ công sáng tạo nhằm kích thích khả năng nghệ thuật và sáng tạo của cư dân.',
    category: 'Sáng tạo', 
    location: 'Phòng hoạt động',
    scheduledTime: '10:30', 
    duration: 60,
    capacity: 15,
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L'
    ],
    facilitator: 'Emily Parker',
    facilitatorId: 2,
    date: '2024-01-15',
    notes: 'Hoạt động phù hợp với tất cả mức độ. Khuyến khích sự sáng tạo và không có áp lực về kết quả.',
    materials: ['Giấy vẽ', 'Màu nước', 'Cọ vẽ', 'Kéo', 'Keo dán', 'Vải nỉ'],
    benefits: ['Kích thích sáng tạo', 'Cải thiện khéo léo tay', 'Thư giãn tinh thần', 'Tăng cường tự tin'],
    level: 'Trung bình',
    recurring: 'Hàng tuần',
    status: 'Đang diễn ra'
  }
];

export default function EditActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  
  // Get activityId from params directly
  const activityId = params.id;
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue
  } = useForm<ActivityFormData>();
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const id = parseInt(activityId);
        
        // Check localStorage for activities data
        let activities = activitiesData;
        const savedActivities = localStorage.getItem('nurseryHomeActivities');
        if (savedActivities) {
          activities = JSON.parse(savedActivities);
        }
        
        const foundActivity = activities.find(a => a.id === id);
        
        if (foundActivity) {
          setActivity(foundActivity);
          setParticipants(foundActivity.participants || []);
          
          // Set form values
          setValue('name', foundActivity.name);
          setValue('description', foundActivity.description);
          setValue('category', foundActivity.category);
          setValue('location', foundActivity.location);
          setValue('scheduledTime', foundActivity.scheduledTime);
          setValue('duration', foundActivity.duration);
          setValue('capacity', foundActivity.capacity);
          setValue('facilitator', foundActivity.facilitator);
          setValue('date', foundActivity.date);
          setValue('notes', foundActivity.notes || '');
          setValue('materials', foundActivity.materials?.join(', ') || '');
          setValue('benefits', foundActivity.benefits?.join(', ') || '');
          setValue('level', foundActivity.level || 'Dễ');
          setValue('recurring', foundActivity.recurring || 'Một lần');
          setValue('status', foundActivity.status || 'Đã lên lịch');
        } else {
          router.push('/activities');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [activityId, router, setValue]);
  
  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    
    try {
      // Get existing activities
      const existingActivities = localStorage.getItem('nurseryHomeActivities');
      let activitiesList = existingActivities ? JSON.parse(existingActivities) : activitiesData;
      
      // Find and update the activity
      const activityIndex = activitiesList.findIndex((a: any) => a.id === parseInt(activityId));
      
      if (activityIndex !== -1) {
        // Update the activity
        activitiesList[activityIndex] = {
          ...activitiesList[activityIndex],
          name: data.name,
          description: data.description,
          category: data.category,
          location: data.location,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
          capacity: data.capacity,
          facilitator: data.facilitator,
          date: data.date,
          notes: data.notes,
          materials: data.materials.split(',').map(m => m.trim()).filter(m => m),
          benefits: data.benefits.split(',').map(b => b.trim()).filter(b => b),
          level: data.level,
          recurring: data.recurring,
          status: data.status,
          participants: participants,
          updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('nurseryHomeActivities', JSON.stringify(activitiesList));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to activities list
        router.push('/activities');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Có lỗi xảy ra khi cập nhật hoạt động. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock residents data - in real app this would come from API
  const allResidents = [
    'Alice Johnson', 'Robert Smith', 'Mary Williams', 'James Brown', 'Patricia Davis',
    'Michael Johnson', 'Linda Wilson', 'David Anderson', 'Barbara Taylor', 'William Moore',
    'Elizabeth Jackson', 'Richard White', 'Susan Harris', 'Joseph Martin', 'Jessica Thompson',
    'Christopher Garcia', 'Sarah Martinez', 'Matthew Robinson', 'Ashley Clark', 'Anthony Rodriguez',
    'Amanda Lewis', 'Daniel Lee', 'Stephanie Walker', 'Mark Hall', 'Michelle Young',
    'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
    'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
    'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
    'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R', 'Nguyễn Thị S', 'Trần Văn T'
  ];

  // Get available residents (not already selected)
  const availableResidents = allResidents.filter(resident => !participants.includes(resident));

  // Participant management functions
  const addParticipant = () => {
    if (selectedResident && !participants.includes(selectedResident)) {
      setParticipants(prev => [...prev, selectedResident]);
      setSelectedResident('');
    }
  };

  const removeParticipant = (participantToRemove: string) => {
    setParticipants(prev => prev.filter(p => p !== participantToRemove));
  };
  
  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin hoạt động.</p>
      </div>
    );
  }
  
  return (
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
        <Link href="/activities" style={{color: '#6b7280', display: 'flex', marginRight: '0.75rem'}}>
          <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chỉnh sửa hoạt động</h1>
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
                <label htmlFor="name" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tên hoạt động*
                </label>
                <input
                  id="name"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.name ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('name', { required: 'Tên hoạt động là bắt buộc' })}
                />
                {errors.name && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="category" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Loại hoạt động*
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
                  {...register('category', { required: 'Loại hoạt động là bắt buộc' })}
                >
                  <option value="">Chọn loại hoạt động</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.category.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="location" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Địa điểm*
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
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.location.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="facilitator" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Người hướng dẫn*
                </label>
                <select
                  id="facilitator"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.facilitator ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('facilitator', { required: 'Người hướng dẫn là bắt buộc' })}
                >
                  <option value="">Chọn người hướng dẫn</option>
                  {facilitators.map(facilitator => (
                    <option key={facilitator} value={facilitator}>{facilitator}</option>
                  ))}
                </select>
                {errors.facilitator && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.facilitator.message}</p>
                )}
              </div>
            </div>
            
            <div style={{marginTop: '1rem'}}>
              <label htmlFor="description" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Mô tả hoạt động*
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
                {...register('description', { required: 'Mô tả hoạt động là bắt buộc' })}
              />
              {errors.description && (
                <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.description.message}</p>
              )}
            </div>
          </div>
          
          {/* Schedule Information */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin lịch trình
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              <div>
                <label htmlFor="date" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ngày*
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
                <label htmlFor="scheduledTime" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Thời gian*
                </label>
                <input
                  id="scheduledTime"
                  type="time"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.scheduledTime ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('scheduledTime', { required: 'Thời gian là bắt buộc' })}
                />
                {errors.scheduledTime && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.scheduledTime.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="duration" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Thời lượng (phút)*
                </label>
                <input
                  id="duration"
                  type="number"
                  min="15"
                  max="300"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.duration ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('duration', { 
                    required: 'Thời lượng là bắt buộc',
                    min: { value: 15, message: 'Thời lượng tối thiểu 15 phút' },
                    max: { value: 300, message: 'Thời lượng tối đa 300 phút' }
                  })}
                />
                {errors.duration && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.duration.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="capacity" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Sức chứa*
                </label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  max="100"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.capacity ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('capacity', { 
                    required: 'Sức chứa là bắt buộc',
                    min: { value: 1, message: 'Sức chứa tối thiểu 1 người' },
                    max: { value: 100, message: 'Sức chứa tối đa 100 người' }
                  })}
                />
                {errors.capacity && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.capacity.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="level" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Mức độ
                </label>
                <select
                  id="level"
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
                  {...register('level')}
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="recurring" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Lặp lại
                </label>
                <select
                  id="recurring"
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
                  {...register('recurring')}
                >
                  {recurringOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
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
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Participant Management */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Quản lý người tham gia
            </h2>
            <div style={{marginBottom: '1rem'}}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500
                }}>
                  Số lượng hiện tại: {participants.length}/{activity?.capacity || 0}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  background: participants.length >= (activity?.capacity || 0) ? 
                    'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: participants.length >= (activity?.capacity || 0) ? '#ef4444' : '#22c55e',
                  fontWeight: 600
                }}>
                  {participants.length >= (activity?.capacity || 0) ? 'Đã đầy' : 'Còn chỗ'}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <select
                  value={selectedResident}
                  onChange={(e) => setSelectedResident(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="">
                    {availableResidents.length > 0 ? 'Chọn cư dân...' : 'Không còn cư dân nào'}
                  </option>
                  {availableResidents.map((resident, index) => (
                    <option key={index} value={resident}>
                      {resident}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addParticipant}
                  disabled={!selectedResident || availableResidents.length === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: !selectedResident || availableResidents.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: !selectedResident || availableResidents.length === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Thêm
                </button>
              </div>
              
              {participants.length > 0 && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Danh sách người tham gia:
                  </label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '0.75rem'
                  }}>
                    {participants.map((participant, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          marginBottom: '0.25rem',
                          background: '#f9fafb',
                          borderRadius: '0.375rem',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: 500
                        }}>
                          {participant}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Information */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin bổ sung
            </h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              <div>
                <label htmlFor="materials" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Dụng cụ cần thiết
                </label>
                <input
                  id="materials"
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
                  placeholder="Phân cách bằng dấu phẩy (VD: Thảm yoga, Loa nhạc, Nước uống)"
                  {...register('materials')}
                />
              </div>
              
              <div>
                <label htmlFor="benefits" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Lợi ích
                </label>
                <input
                  id="benefits"
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
                  placeholder="Phân cách bằng dấu phẩy (VD: Cải thiện sức khỏe, Giảm căng thẳng)"
                  {...register('benefits')}
                />
              </div>
              
              <div>
                <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ghi chú
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
                  {...register('notes')}
                />
              </div>
            </div>
          </div>
          
          {/* Form Buttons */}
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
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem', 
                border: '1px solid transparent', 
                borderRadius: '0.375rem', 
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'white', 
                backgroundColor: '#16a34a',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật hoạt động'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 