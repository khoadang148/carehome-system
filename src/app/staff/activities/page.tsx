"use client";

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon, 
  CalendarIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  ListBulletIcon,
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { useResidents } from '@/lib/contexts/residents-context';
import { activitiesAPI, activityParticipationsAPI } from '@/lib/api';
import ResidentEvaluationModal from '@/components/ResidentEvaluationModal';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

const mapActivityFromAPI = (apiActivity: any) => {
  try {
    if (!apiActivity.schedule_time || typeof apiActivity.schedule_time !== 'string') {
      return null;
    }

    const scheduleTime = new Date(apiActivity.schedule_time);

    if (isNaN(scheduleTime.getTime())) {
      return null;
    }

    const durationInMinutes = typeof apiActivity.duration === 'number' ? apiActivity.duration : 0;
    const endTime = new Date(scheduleTime.getTime() + durationInMinutes * 60000);

    if (isNaN(endTime.getTime())) {
      return null;
    }

    return {
      id: apiActivity._id,
      name: apiActivity.activity_name,
      description: apiActivity.description,
      activity_type: apiActivity.activity_type,
      category: getCategoryLabel(apiActivity.activity_type),
      duration: apiActivity.duration,
      startTime: scheduleTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      date: scheduleTime.toLocaleDateString('en-CA'),
      location: apiActivity.location,
      capacity: apiActivity.capacity,
      participants: 0,
      status: 'Đã lên lịch',
      recurring: 'Không lặp lại'
    };
  } catch (error) {
    return null;
  }
};

const getCategoryLabel = (activityType: string) => {
  const categoryMap: { [key: string]: string } = {
    'Nhận thức': 'Nhận thức',
    'Thể thao': 'Thể chất',
    'Y tế': 'Y tế',
    'Tâm lý': 'Tâm lý',
    'Xã hội': 'Xã hội',
    'Học tập': 'Giáo dục',
    'Sáng tạo': 'Sáng tạo',
    'the_thao': 'Thể chất',
    'giai_tri': 'Giải trí'
  };
  return categoryMap[activityType] || activityType;
};

const categories = ['Tất cả', 'Thể chất', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội', 'Giáo dục', 'Y tế', 'Tâm lý', 'Giải trí'];
const locations = ['Tất cả', 'Thư viện', 'Vườn hoa', 'Phòng y tế', 'Sân vườn', 'Phòng thiền', 'Phòng giải trí', 'Phòng sinh hoạt chung', 'Nhà bếp', 'Phòng nghệ thuật'];

export default function StaffActivitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { residents } = useResidents();
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [evaluationResidents, setEvaluationResidents] = useState<any[]>([]);
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityParticipantCounts, setActivityParticipantCounts] = useState<{[id: string]: number}>({});
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || user.role !== 'staff') {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user?.id) {
          setError('Không tìm thấy thông tin người dùng');
          return;
        }
        
        const participations = await activityParticipationsAPI.getByStaffId(user.id);
        
        const activityIds = [...new Set(participations.map((p: any) => p.activity_id?._id || p.activity_id))].filter(Boolean);
        
        const activityPromises = activityIds.map(async (activityId: any) => {
          try {
            if (!activityId) {
              return null;
            }
            const activityData = await activitiesAPI.getById(activityId);
            return mapActivityFromAPI(activityData);
          } catch (error) {
            return null;
          }
        });
        
        const activityResults = await Promise.all(activityPromises);
        const validActivities = activityResults.filter(Boolean);
        
        validActivities.sort((a, b) => {
          if (!a || !b) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setActivities(validActivities);
      } catch (err: any) {
        setError('Không thể tải danh sách hoạt động. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchActivities();
    }
  }, [user?.id]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [filterLocation, setFilterLocation] = useState('Tất cả');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  const getWeekDates = (weekOffset: number = 0): Date[] => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(selectedWeek);
  
  const filteredActivities = activities.filter((activity) => {
    const name = activity.name || '';
    const description = activity.description || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'Tất cả' || activity.location === filterLocation;
    const matchesCategory = filterCategory === 'Tất cả' || activity.activity_type === filterCategory;
    let filterDate = '';
    if (selectedDate && isValid(selectedDate)) {
      filterDate = format(selectedDate, 'yyyy-MM-dd');
    }
    const activityDate = activity.date || '';
    const matchesSelectedDate = activityDate === filterDate;
    return matchesSearch && matchesLocation && matchesSelectedDate && matchesCategory;
  });

  const weekActivities = filteredActivities.filter(activity => {
    if (viewMode === 'list') return true;
    
    const activityDate = new Date(activity.date);
    return weekDates.some(date => 
      date.toDateString() === activityDate.toDateString()
    );
  });

  const getActivitiesForDate = (date: Date) => {
    return weekActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  const getDayLabel = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã hoàn thành':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'Đang diễn ra':
        return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Đã lên lịch':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'Đã hủy':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
    }
  };

  const getCategoryColor = (activityType: string) => {
    switch (activityType) {
      case 'Thể chất': return '#10b981';
      case 'Sáng tạo': return '#8b5cf6';
      case 'Trị liệu': return '#ec4899';
      case 'Nhận thức': return '#3b82f6';
      case 'Xã hội': return '#f59e0b';
      case 'Y tế': return '#ef4444';
      case 'Tâm lý': return '#8b5cf6';
      case 'Giải trí': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handleViewActivity = (activityId: string) => {
    router.push(`/staff/activities/${activityId}`);
  };

  const handleOpenEvaluation = async (activity: any) => {
    try {
      const participations = await activityParticipationsAPI.getAll({
        activity_id: activity.id,
        date: activity.date
      });
      
      const filteredParticipations = participations.filter((p: any) => {
        if (!p.date) return false;
        const participationDate = new Date(p.date).toLocaleDateString('en-CA');
        return participationDate === activity.date;
      });
      
      const uniqueParticipations = filteredParticipations.reduce((acc: any[], current: any) => {
        const residentId = current.resident_id?._id || current.resident_id;
        const existingIndex = acc.findIndex(item => 
          (item.resident_id?._id || item.resident_id) === residentId
        );
        
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          const existing = acc[existingIndex];
          const existingTime = new Date(existing.updated_at || existing.created_at || 0);
          const currentTime = new Date(current.updated_at || current.created_at || 0);
          
          if (currentTime > existingTime) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, []);
      
      const residentIds = uniqueParticipations.map((p: any) => p.resident_id?._id || p.resident_id);
      const filteredResidents = residents.filter((r: any) => residentIds.includes(r.id));
      
      setSelectedActivity(activity);
      setEvaluationResidents(filteredResidents);
      setEvaluationModalOpen(true);
    } catch (err) {
      toast.error('Không thể tải danh sách người cao tuổi tham gia hoạt động này.');
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: {[id: string]: number} = {};
      await Promise.all(activities.map(async (activity) => {
        if (!activity.id || !activity.date) return;
        try {
          const participations = await activityParticipationsAPI.getAll({
            activity_id: activity.id
          });
          
          const filtered = participations.filter((p: any) => {
            const participationActivityId = p.activity_id?._id || p.activity_id;
            const participationDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
            return participationActivityId === activity.id && participationDate === activity.date;
          });
          
          const joined = filtered.reduce((acc: any[], current: any) => {
            const residentId = current.resident_id?._id || current.resident_id;
            const existingIndex = acc.findIndex(item => 
              (item.resident_id?._id || item.resident_id) === residentId
            );
            
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              const existing = acc[existingIndex];
              const existingTime = new Date(existing.updated_at || existing.created_at || 0);
              const currentTime = new Date(current.updated_at || current.created_at || 0);
              
              if (currentTime > existingTime) {
                acc[existingIndex] = current;
              }
            }
            return acc;
          }, []);
          
          counts[activity.id] = joined.length;
        } catch (error) {
          counts[activity.id] = 0;
        }
      }));
      setActivityParticipantCounts(counts);
    };
    if (activities.length > 0) fetchCounts();
  }, [activities]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'white', fontWeight: 600 }}>Đang tải danh sách hoạt động...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-[1]">
      <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-[1]">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/20 backdrop-blur">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-[clamp(1.4rem,3vw,2rem)] font-bold m-0 bg-gradient-to-br from-amber-500 to-amber-700 bg-clip-text text-transparent tracking-tight">
                  Quản lý Chương trình sinh hoạt
                </h1>
                <p className="text-base text-slate-600 mt-1 font-medium">
                  Tổng số: {filteredActivities.length} chương trình
                </p>
                {viewMode === 'calendar' && (
                  <p className="text-sm text-slate-400 mt-2 font-medium">
                    Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-0 text-sm font-semibold transition ${viewMode === 'list' ? 'bg-violet-500 text-white' : 'bg-transparent text-slate-500'}`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                  Danh sách
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-0 text-sm font-semibold transition ${viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-transparent text-slate-500'}`}
                >
                  <CalendarDaysIcon className="w-4 h-4" />
            Lịch hoạt động
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-8 shadow-md border border-white/20">
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))] gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm chương trình
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                  placeholder="Tìm kiếm chương trình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm bg-white"
                />
              </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày
                </label>
                <DatePicker
  selected={selectedDate}
  onChange={date => setSelectedDate(date as Date)}
  dateFormat="dd/MM/yyyy"
  className="datepicker-input"
  placeholderText="dd/mm/yyyy"
  wrapperClassName="w-full"
  customInput={
    <input
      type="text"
      className="w-full p-3 rounded-lg border border-gray-300 text-sm"
    />
  }
/>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại hoạt động
                </label>
                <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa điểm
                </label>
                <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          
        </div>

        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Tuần trước
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedWeek === 0 && 'Tuần này'}
                  {selectedWeek === 1 && 'Tuần sau'}
                  {selectedWeek === -1 && 'Tuần trước'}
                  {Math.abs(selectedWeek) > 1 && `${selectedWeek > 0 ? '+' : ''}${selectedWeek} tuần`}
                </h2>
                <p className="text-sm text-gray-600 font-medium m-0">
                  {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
                </p>
              </div>

              <button
                onClick={() => navigateWeek('next')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Tuần sau
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid [grid-template-columns:repeat(7,1fr)] gap-4">
              {weekDates.map((date) => {
                const dayActivities = getActivitiesForDate(date);
                const today = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    className={`${today ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-none text-white' : 'bg-slate-50 text-slate-700 border border-slate-200'} rounded-xl p-4 min-h-[140px]`}
                  >
                    <div className="text-center mb-3">
                      <div className={`text-[0.75rem] font-semibold ${today ? 'opacity-100' : 'opacity-70'} mb-1`}>
                        {getDayLabel(date)}
                      </div>
                      <div className="text-xl font-bold">
                        {date.getDate()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {dayActivities.slice(0, 3).map((activity, index) => (
                        <div
                          key={activity.id || `activity-${index}-${date.toISOString()}`}
                          className={`${today ? 'bg-white/20 text-white' : 'text-white'} px-2 py-1 rounded text-[0.75rem] font-semibold text-center ${activity.id ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                          style={{ background: today ? undefined : getCategoryColor(activity.activity_type) }}
                          onClick={() => activity.id && handleViewActivity(activity.id)}
                        >
                          {activity.name}
                        </div>
                      ))}
                      {dayActivities.length > 3 && (
                        <div key={date.toISOString() + '-more'} className="text-[0.75rem] text-center opacity-70 mt-1">
                          +{dayActivities.length - 3} khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={`grid ${viewMode === 'calendar' ? '[grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]' : '[grid-template-columns:repeat(auto-fit,minmax(400px,1fr))]'} gap-6`}>
          {(viewMode === 'calendar' ? weekActivities : filteredActivities)
            .sort((a, b) => {
              if (viewMode === 'calendar') {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              }
              const aStart = a.startTime || '';
              const bStart = b.startTime || '';
              return aStart.localeCompare(bStart);
            })
            .map((activity, index) => {
              const statusColor = getStatusColor(activity.status);
              const categoryColor = getCategoryColor(activity.activity_type);
              
              return (
                <div
                  key={activity.id || `activity-${index}`}
                  className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-md border border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wide">
                          Tên hoạt động:
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 m-0 mb-2 leading-snug">
                        {activity.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wide">
                          Loại:
                        </span>
                        <span className="inline-block px-3 py-1 rounded-full text-[0.75rem] font-semibold border" style={{ color: categoryColor, background: categoryColor + '15', borderColor: categoryColor + '30' }}>
                          {activity.category}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wide">Trạng thái:</span>
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-[0.75rem] font-semibold whitespace-nowrap" style={{ background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activity.description && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wide">
                          Mô tả:
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 m-0 leading-6 italic">
                        {activity.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg border border-sky-100">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <ClockIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-[0.75rem] text-gray-500 font-medium mb-0.5">Thời gian:</div>
                        <div className="text-sm text-gray-900 font-semibold">
                          {activity.startTime} - {activity.endTime}
                        </div>
                        <div className="text-[0.75rem] text-gray-500">({activity.duration} phút)</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-amber-100 rounded-lg border border-amber-200">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-[0.75rem] text-gray-500 font-medium mb-0.5">Ngày:</div>
                        <div className="text-sm text-gray-900 font-semibold">
                          {activity.date ? new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN') : '-'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <MapPinIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-[0.75rem] text-gray-500 font-medium mb-0.5">Địa điểm:</div>
                        <div className="text-sm text-gray-900 font-semibold">
                          {activity.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-amber-100 rounded-lg border border-amber-200">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <UserGroupIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-[0.75rem] text-gray-500 font-medium mb-0.5">Số lượng người cao tuổi tham gia:</div>
                        <div className="text-sm text-gray-900 font-semibold">
                          {(activityParticipantCounts[activity.id] || 0)}/{activity.capacity}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => activity.id && handleViewActivity(activity.id)}
                      disabled={!activity.id}
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium transition ${activity.id ? 'hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
                    >
                      <EyeIcon className="w-4 h-4" />
                      Xem chi tiết
                    </button>
                  </div>
                  </div>
              );
            })}
        </div>

        {filteredActivities.length === 0 && !loading && (
          <div className="text-center p-16 bg-white rounded-xl shadow-md border border-gray-200">
            <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Không có hoạt động nào
            </h3>
            <p className="text-base text-gray-500 m-0">
              {searchTerm || filterCategory !== 'Tất cả' || filterLocation !== 'Tất cả' || selectedDate
                ? 'Không tìm thấy hoạt động nào phù hợp với bộ lọc hiện tại.'
                : 'Bạn chưa được phân công phụ trách hoạt động nào.'}
            </p>
          </div>
        )}
      </div>

      {evaluationModalOpen && selectedActivity && (
        <ResidentEvaluationModal
          open={evaluationModalOpen}
          onClose={() => {
            setEvaluationModalOpen(false);
            setSelectedActivity(null);
            setEvaluationResidents([]);
            const fetchCounts = async () => {
              const counts: {[id: string]: number} = {};
              await Promise.all(activities.map(async (activity) => {
                if (!activity.id || !activity.date) return;
                try {
                  const participations = await activityParticipationsAPI.getAll({
                    activity_id: activity.id
                  });
                  
                  const joined = participations.filter((p: any) => {
                    const participationActivityId = p.activity_id?._id || p.activity_id;
                    const participationDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
                    return participationActivityId === activity.id && participationDate === activity.date;
                  });
                  
                  counts[activity.id] = joined.length;
                } catch (error) {
                  counts[activity.id] = 0;
                }
              }));
              setActivityParticipantCounts(counts);
            };
            fetchCounts();
          }}
          activity={selectedActivity}
          residents={evaluationResidents}
          user={user}
        />
      )}
    </div>
  );
} 