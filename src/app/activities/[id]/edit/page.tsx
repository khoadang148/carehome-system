"use client";
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { activitiesAPI } from '@/lib/api';
import { format, parseISO } from 'date-fns';

const convertToDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

const convertToApiDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString;
};

type ActivityFormData = {
  name: string;
  description: string;
  category: string;
  location: string;
  scheduledTime: string;
  duration: number;
  capacity: number;
  date: string;
};

const categories = ['Thể chất', 'Thể dục', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội', 'Giáo dục', 'Y tế', 'Tâm lý', 'Giải trí', 'Khác'];
const baseLocations = ['Thư viện', 'Vườn hoa', 'Phòng y tế', 'Sân vườn', 'Phòng thiền', 'Phòng giải trí', 'Phòng sinh hoạt chung', 'Nhà bếp', 'Phòng nghệ thuật', 'Khác'];

function mapActivityType(type: string): string {
  const map: Record<string, string> = {
    'Thể thao': 'Thể chất',
    'Thể dục': 'Thể dục',
    'Học tập': 'Giáo dục',
    'the_thao': 'Thể chất',
    'giai_tri': 'Giải trí',
  };
  return map[type] || type;
}

export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activityId, setActivityId] = useState<string>('');
  const [originalData, setOriginalData] = useState<ActivityFormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const getActivityId = async () => {
      const resolvedParams = await params;
      setActivityId(resolvedParams.id);
    };
    getActivityId();
  }, [params]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ActivityFormData>();

  useEffect(() => {
    if (!activityId) return;

    const fetchActivity = async () => {
      try {
        setLoading(true);
        const apiActivity = await activitiesAPI.getById(activityId);
        if (apiActivity) {
          setActivity(apiActivity);
          const mappedCategory = mapActivityType(apiActivity.activity_type || '');
          
          const mappedLocation = apiActivity.location || '';
          
          const initialData = {
            name: apiActivity.activity_name || '',
            description: apiActivity.description || '',
            category: mappedCategory,
            location: mappedLocation,
            scheduledTime: apiActivity.schedule_time ? format(parseISO(apiActivity.schedule_time), 'HH:mm') : '',
            duration: apiActivity.duration || 0,
            capacity: apiActivity.capacity || 0,
            date: apiActivity.schedule_time ? convertToDisplayDate(format(parseISO(apiActivity.schedule_time), 'yyyy-MM-dd')) : '',
          };
          reset(initialData);
          setOriginalData(initialData);
          setHasChanges(false);
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
  }, [activityId, router, reset]);

  // Watch form changes
  const watchedValues = watch();
  
  useEffect(() => {
    if (!originalData) return;
    
    const hasFormChanges = Object.keys(watchedValues).some(key => {
      const currentValue = watchedValues[key as keyof ActivityFormData];
      const originalValue = originalData[key as keyof ActivityFormData];
      
      // Handle number comparison (convert string to number for comparison)
      if (key === 'duration' || key === 'capacity') {
        const currentNum = Number(currentValue);
        const originalNum = Number(originalValue);
        return currentNum !== originalNum;
      }
      
      // Handle string comparison
      if (typeof currentValue === 'string' && typeof originalValue === 'string') {
        return currentValue !== originalValue;
      }
      
      return false;
    });
    
    setHasChanges(hasFormChanges);
  }, [watchedValues, originalData]);





  const onSubmit = async (data: ActivityFormData) => {
    if (!activityId) return;

    // Kiểm tra staff_id trước khi submit
    if (!activity?.staff_id && !activity?.staff?._id) {
      toast.error('Không tìm thấy thông tin nhân viên phụ trách. Vui lòng cập nhật thông tin nhân viên phụ trách.');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiDate = convertToApiDate(data.date);
      const schedule_time = apiDate && data.scheduledTime
        ? `${apiDate}T${data.scheduledTime}:00`
        : '';
      const payload = {
        activity_name: data.name,
        description: data.description,
        activity_type: data.category,
        location: data.location,
        schedule_time,
        duration: Number(data.duration),
        capacity: Number(data.capacity),
        staff_id: activity?.staff_id || activity?.staff?._id || '' // Thêm staff_id từ activity hiện tại
      };
      
      // Log payload để debug
      console.log('Updating activity with payload:', payload);
      console.log('Activity ID:', activityId);
      
      await activitiesAPI.update(activityId, payload);

      setSuccessMessage(`Hoạt động "${data.name}" đã được cập nhật thành công!`);
      setShowSuccessModal(true);
      
      // Update original data after successful update
      setOriginalData(data);
      setHasChanges(false);

      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/activities');
      }, 3000);

    } catch (error: any) {
      console.error('Error updating activity:', error);
      
      // Hiển thị thông tin lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra khi cập nhật hoạt động. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server nội bộ. Vui lòng liên hệ admin hoặc thử lại sau.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy hoạt động. Vui lòng tải lại trang.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLocation = activity?.location || '';
  let locations = baseLocations;
  if (currentLocation && !baseLocations.includes(currentLocation)) {
    locations = [currentLocation, ...baseLocations];
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-base text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-base text-gray-500">Không tìm thấy thông tin hoạt động.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent bg-gradient-radial from-green-500/5 via-transparent to-transparent bg-gradient-radial from-yellow-500/3 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/activities"
                className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center no-underline cursor-pointer border border-slate-300/20 shadow-sm transition-all duration-200 hover:bg-gradient-to-br hover:from-slate-200 hover:to-slate-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 flex items-center justify-center shadow-lg">
                    <PencilSquareIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-extrabold text-emerald-800 m-0 tracking-tight">
                      Chỉnh sửa hoạt động
                    </h1>
                    <p className="text-base text-emerald-600 mt-1 font-medium">
                      Cập nhật thông tin chi tiết hoạt động
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-10 shadow-xl border border-white/20 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
            <section>
              <div className="flex items-center gap-3 mb-6 p-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl border border-emerald-500/20 shadow-lg">
                <div className="bg-white/20 rounded-lg p-2 flex items-center justify-center">
                  <InformationCircleIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white m-0 tracking-tight">
                  Thông tin hoạt động
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hoạt động <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`block w-full rounded-lg border ${errors.name ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('name', { required: 'Tên hoạt động là bắt buộc' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại hoạt động <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="category"
                    type="text"
                    placeholder="Nhập loại hoạt động..."
                    className={`block w-full rounded-lg border ${errors.category ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('category', { required: 'Loại hoạt động là bắt buộc' })}
                  />
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    placeholder="Nhập địa điểm..."
                    className={`block w-full rounded-lg border ${errors.location ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('location', { required: 'Địa điểm là bắt buộc' })}
                  />
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="15"
                    max="300"
                    className={`block w-full rounded-lg border ${errors.duration ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
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
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Sức chứa <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    className={`block w-full rounded-lg border ${errors.capacity ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
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
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    type="text"
                    placeholder="dd/mm/yyyy"
                    className={`block w-full rounded-lg border ${errors.date ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('date', {
                      required: 'Ngày là bắt buộc',
                      pattern: {
                        value: /^(\d{2})\/(\d{2})\/(\d{4})$/,
                        message: 'Ngày phải theo định dạng dd/mm/yyyy'
                      },
                      validate: (value) => {
                        if (!value) return true;
                        const [day, month, year] = value.split('/').map(Number);
                        const date = new Date(year, month - 1, day);
                        if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
                          return 'Ngày không hợp lệ';
                        }
                        return true;
                      }
                    })}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="scheduledTime"
                    type="time"
                    className={`block w-full rounded-lg border ${errors.scheduledTime ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('scheduledTime', { required: 'Thời gian là bắt buộc' })}
                  />
                  {errors.scheduledTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.scheduledTime.message}</p>
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
                  className={`block w-full rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300'} focus:ring-emerald-600 focus:border-emerald-600 shadow-sm py-2 px-3 text-sm`}
                  {...register('description', { required: 'Mô tả hoạt động là bắt buộc' })}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>
            </section>
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/activities"
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white no-underline shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md"
              >
                Hủy
              </Link>
              {hasChanges && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-all duration-200 ${isSubmitting
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed shadow-sm'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-xl'
                    }`}
                >
                  {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật hoạt động'}
                </button>
              )}
              {!hasChanges && (
                <div className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed">
                  Không có thay đổi
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-lg w-[90%] text-center shadow-2xl border border-white/20 animate-[modalSlideIn_0.3s_ease-out]">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-[successIconBounce_0.6s_ease-out]">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-emerald-800 mb-4 tracking-tight">
              Cập nhật thành công!
            </h2>

            <p className="text-base text-gray-600 mb-8 leading-relaxed">
              {successMessage}
            </p>

            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-[progressBar_3s_linear_forwards]" />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/activities');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 border-none cursor-pointer shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Xem danh sách
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-300 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
              >
                <XMarkIcon className="w-4 h-4" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes successIconBounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 