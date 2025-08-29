'use client';

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeftIcon,
  HeartIcon,
  CheckCircleIcon,
  UserIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { careNotesAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { userAPI } from '@/lib/api';

interface CareNoteData {
  residentId: string;
  residentName: string;
  noteContent: string;
  recommendations: string;
  priority: string;
  category: string;
  staffName: string;
  date: string;
  time: string;
}

const quickNoteTemplates = [
  { text: 'Ăn uống bình thường, tinh thần tốt', icon: '😊' },
  { text: 'Tham gia hoạt động nhóm tích cực', icon: '🎯' },
  { text: 'Ngủ đầy đủ, không có vấn đề gì', icon: '😴' },
  { text: 'Cần theo dõi thêm về tình trạng sức khỏe', icon: '👁️' },
  { text: 'Gia đình đến thăm, người cao tuổi rất vui', icon: '❤️' },
  { text: 'Uống thuốc đầy đủ theo đơn', icon: '💊' },
  { text: 'Có biểu hiện không thoải mái, cần chú ý', icon: '⚠️' }
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
      noteContent: '',
      recommendations: ''
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: CareNoteData) => {
    setIsSubmitting(true);
    try {
      const dateTimeISO = new Date(`${data.date}T${data.time}:00`).toISOString();
      const payload = {
        assessment_type: data.category || 'Đánh giá tổng quát',
        notes: data.noteContent,
        recommendations: data.recommendations,
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
      toast.error('Lưu ghi chú thất bại. Vui lòng thử lại!');
    }
  };

  const insertTemplate = (template: string) => {
    const currentNote = watchedValues.noteContent;
    const newNote = currentNote ? `${currentNote}\n${template}` : template;
    setValue('noteContent', newNote);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-white/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 text-white border-none rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 shadow-lg hover:from-slate-600 hover:to-slate-700"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <HeartIcon className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Thêm ghi chú mới
              </h1>
              <p className="text-slate-600 mt-1 text-sm">Ghi lại thông tin chăm sóc quan trọng</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/40 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-500" />
                  Tên người cao tuổi *
                </label>
                                 <input
                   {...register('residentName', { required: 'Vui lòng nhập tên người cao tuổi' })}
                   className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-sm outline-none bg-gray-100/80 cursor-not-allowed transition-all duration-300 shadow-sm"
                   placeholder="Nhập tên người cao tuổi"
                   readOnly
                 />
                {errors.residentName && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.residentName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-green-500" />
                  Nhân viên ghi chú
                </label>
                <div className="px-4 py-4 border-2 border-gray-200 rounded-2xl text-sm bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold shadow-sm">
                  {staffName}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <LightBulbIcon className="w-6 h-6 text-amber-500" />
                Mẫu ghi chú nhanh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickNoteTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertTemplate(template.text)}
                    className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl text-sm text-slate-700 cursor-pointer text-left transition-all duration-300 hover:from-slate-100 hover:to-slate-200 hover:border-slate-300 hover:shadow-lg hover:scale-105 active:scale-95 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        {template.icon}
                      </span>
                      <span className="leading-relaxed">{template.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-blue-500" />
                Nội dung ghi chú *
              </label>
              <textarea
                {...register('noteContent', { 
                  required: 'Vui lòng nhập nội dung ghi chú',
                  minLength: { value: 10, message: 'Ghi chú phải có ít nhất 10 ký tự' }
                })}
                rows={6}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-sm outline-none resize-y focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="Nhập chi tiết về tình trạng, hoạt động, và quan sát của người cao tuổi..."
              />
              {errors.noteContent && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.noteContent.message}
                </p>
              )}
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">
                  {watchedValues.noteContent?.length || 0} ký tự
                </p>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${Math.min((watchedValues.noteContent?.length || 0) / 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-amber-500" />
                Khuyến nghị
              </label>
              <textarea
                {...register('recommendations')}
                rows={4}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-sm outline-none resize-y focus:border-amber-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="Nhập các khuyến nghị, hướng dẫn hoặc kế hoạch chăm sóc tiếp theo..."
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">
                  {watchedValues.recommendations?.length || 0} ký tự
                </p>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${Math.min((watchedValues.recommendations?.length || 0) / 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white border-none rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:scale-105 hover:shadow-lg active:scale-95 shadow-md order-2 sm:order-1"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-3 px-8 py-4 text-white border-none rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg order-1 sm:order-2 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 cursor-pointer hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 hover:scale-105 hover:shadow-xl active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Lưu ghi chú
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        {showSuccess && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl animate-slideUp border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Đã lưu ghi chú thành công!
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Ghi chú đã được thêm vào hồ sơ chăm sóc và sẽ được chuyển hướng về trang danh sách.
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
} 
