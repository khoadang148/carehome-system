"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

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
    notes: 'Cần chuẩn bị thảm tập yoga và nhạc nhẹ nhàng. Kiểm tra sức khỏe của các người cao tuổi trước khi tham gia.',
    materials: ['Thảm tập yoga', 'Loa phát nhạc', 'Nước uống', 'Khăn nhỏ'],
    benefits: ['Cải thiện khả năng vận động', 'Tăng cường sức khỏe tim mạch', 'Giảm căng thẳng', 'Cải thiện tâm trạng'],
    level: 'Dễ',
    recurring: 'Hàng ngày',
    status: 'Đã lên lịch'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    description: 'Hoạt động vẽ tranh và làm đồ thủ công sáng tạo nhằm kích thích khả năng nghệ thuật và sáng tạo của người cao tuổi.',
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
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div style={{  
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '1.5rem',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)', 
  border: '1px solid rgba(255, 255, 255, 0.2)', 
  backdropFilter: 'blur(10px)', 
}}>
  <div className="flex items-center gap-3 mb-6 mt-2">
    <Link 
      href="/activities" 
      title="Quay lại"
      className="text-gray-500 hover:text-green-700 flex items-center transition-colors duration-200"
    >
      <ArrowLeftIcon className="w-5 h-5 mr-1" />
      
    </Link>
    <h1 
      style={{ 
        fontSize: '2rem', 
        fontWeight: 800, 
        color: '#16a34a',
        margin: 0 
      }}
    >
      Chỉnh sửa hoạt động
    </h1>
  </div>
</div>

        
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
            {/* Basic Information */}
            <section>
              <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-green-500" />
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tên hoạt động */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hoạt động <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`block w-full rounded-lg border ${errors.name ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('name', { required: 'Tên hoạt động là bắt buộc' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>
                {/* Loại hoạt động */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại hoạt động <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    className={`block w-full rounded-lg border ${errors.category ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('category', { required: 'Loại hoạt động là bắt buộc' })}
                  >
                    <option value="">Chọn loại hoạt động</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
                  )}
                </div>
                {/* Địa điểm */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="location"
                    className={`block w-full rounded-lg border ${errors.location ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('location', { required: 'Địa điểm là bắt buộc' })}
                  >
                    <option value="">Chọn địa điểm</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
                  )}
                </div>
                {/* Người hướng dẫn */}
                <div>
                  <label htmlFor="facilitator" className="block text-sm font-medium text-gray-700 mb-1">
                    Người hướng dẫn <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="facilitator"
                    className={`block w-full rounded-lg border ${errors.facilitator ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('facilitator', { required: 'Người hướng dẫn là bắt buộc' })}
                  >
                    <option value="">Chọn người hướng dẫn</option>
                    {facilitators.map(facilitator => (
                      <option key={facilitator} value={facilitator}>{facilitator}</option>
                    ))}
                  </select>
                  {errors.facilitator && (
                    <p className="mt-1 text-xs text-red-600">{errors.facilitator.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả hoạt động <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className={`block w-full rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                  {...register('description', { required: 'Mô tả hoạt động là bắt buộc' })}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>
            </section>
            {/* Schedule Information */}
            <section>
              <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-green-500" />
                Thông tin lịch trình
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Ngày */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    className={`block w-full rounded-lg border ${errors.date ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('date', { required: 'Ngày là bắt buộc' })}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
                  )}
                </div>
                {/* Thời gian */}
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="scheduledTime"
                    type="time"
                    className={`block w-full rounded-lg border ${errors.scheduledTime ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('scheduledTime', { required: 'Thời gian là bắt buộc' })}
                  />
                  {errors.scheduledTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.scheduledTime.message}</p>
                  )}
                </div>
                {/* Thời lượng */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="15"
                    max="300"
                    className={`block w-full rounded-lg border ${errors.duration ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('duration', {
                      required: 'Thời lượng là bắt buộc',
                      min: { value: 15, message: 'Thời lượng tối thiểu 15 phút' },
                      max: { value: 300, message: 'Thời lượng tối đa 300 phút' }
                    })}
                  />
                  {errors.duration && (
                    <p className="mt-1 text-xs text-red-600">{errors.duration.message}</p>
                  )}
                </div>
                {/* Sức chứa */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Sức chứa <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    className={`block w-full rounded-lg border ${errors.capacity ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('capacity', {
                      required: 'Sức chứa là bắt buộc',
                      min: { value: 1, message: 'Sức chứa tối thiểu 1 người' },
                      max: { value: 100, message: 'Sức chứa tối đa 100 người' }
                    })}
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-xs text-red-600">{errors.capacity.message}</p>
                  )}
                </div>
                {/* Mức độ */}
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ
                  </label>
                  <select
                    id="level"
                    className="block w-full rounded-lg border border-gray-300 focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm"
                    {...register('level')}
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                {/* Lặp lại */}
                <div>
                  <label htmlFor="recurring" className="block text-sm font-medium text-gray-700 mb-1">
                    Lặp lại
                  </label>
                  <select
                    id="recurring"
                    className="block w-full rounded-lg border border-gray-300 focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm"
                    {...register('recurring')}
                  >
                    {recurringOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {/* Trạng thái */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    className={`block w-full rounded-lg border ${errors.status ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('status', { required: 'Trạng thái là bắt buộc' })}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </section>
            {/* Participant Management */}
            <section>
              <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-green-500" />
                Quản lý người tham gia
              </h2>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">
                  Số lượng hiện tại: {participants.length}/{activity?.capacity || 0}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${participants.length >= (activity?.capacity || 0) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {participants.length >= (activity?.capacity || 0) ? 'Đã đầy' : 'Còn chỗ'}
                </span>
              </div>
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedResident}
                  onChange={e => setSelectedResident(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm bg-white"
                >
                  <option value="">
                    {availableResidents.length > 0 ? 'Chọn người cao tuổi...' : 'Không còn người cao tuổi nào'}
                  </option>
                  {availableResidents.map((resident, index) => (
                    <option key={index} value={resident}>{resident}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addParticipant}
                  disabled={!selectedResident || availableResidents.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-500 to-green-700 shadow-sm transition-all ${(!selectedResident || availableResidents.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-800'}`}
                >
                  Thêm
                </button>
              </div>
              {participants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh sách người tham gia:</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {participants.map((participant, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 px-2 mb-1 bg-white rounded-md border border-gray-200 shadow-sm"
                      >
                        <span className="text-sm text-gray-800 font-medium">{participant}</span>
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant)}
                          className="px-2 py-1 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 shadow-sm transition-all"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
            {/* Additional Information */}
            <section>
              <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-green-500" />
                Thông tin bổ sung
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="materials" className="block text-sm font-medium text-gray-700 mb-1">
                    Dụng cụ cần thiết
                  </label>
                  <input
                    id="materials"
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm"
                    placeholder="Phân cách bằng dấu phẩy (VD: Thảm yoga, Loa nhạc, Nước uống)"
                    {...register('materials')}
                  />
                </div>
                <div>
                  <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">
                    Lợi ích
                  </label>
                  <input
                    id="benefits"
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm"
                    placeholder="Phân cách bằng dấu phẩy (VD: Cải thiện sức khỏe, Giảm căng thẳng)"
                    {...register('benefits')}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm"
                    {...register('notes')}
                  />
                </div>
              </div>
            </section>
            {/* Form Buttons */}
            <div className="flex justify-end gap-3 mt-2">
              <Link
                href="/activities"
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-all"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-green-800 shadow-sm text-sm transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-700 hover:to-green-900'}`}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật hoạt động'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 