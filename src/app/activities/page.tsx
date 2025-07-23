"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  UserGroupIcon, 
  CalendarIcon,
  EyeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  ListBulletIcon,
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useResidents } from '@/lib/contexts/residents-context';
import { activitiesAPI } from '@/lib/api';
import { activityParticipationsAPI } from '@/lib/api';
import ResidentEvaluationModal from '@/components/ResidentEvaluationModal';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

// Map API data to match component expectations
const mapActivityFromAPI = (apiActivity: any) => {
  try {
    // Validate schedule_time
    if (!apiActivity.schedule_time || typeof apiActivity.schedule_time !== 'string') {
      console.warn('Invalid schedule_time for activity:', apiActivity._id);
      return null;
    }

    // Parse schedule_time as UTC and keep it as is, don't add timezone offset
    const scheduleTimeStr = apiActivity.schedule_time.endsWith('Z') 
      ? apiActivity.schedule_time 
      : `${apiActivity.schedule_time}Z`;
    const scheduleTime = new Date(scheduleTimeStr);

    // Check if date is valid
    if (isNaN(scheduleTime.getTime())) {
      console.error('Invalid date after parsing for activity:', apiActivity._id, apiActivity.schedule_time);
      return null;
    }

    // Calculate end time safely
    const durationInMinutes = typeof apiActivity.duration === 'number' ? apiActivity.duration : 0;
    const endTime = new Date(scheduleTime.getTime() + durationInMinutes * 60000);

    // Check if end time is valid
    if (isNaN(endTime.getTime())) {
      console.error('Invalid end time calculated for activity:', apiActivity._id);
      return null;
    }

    return {
      id: apiActivity._id,
      name: apiActivity.activity_name,
      description: apiActivity.description,
      activity_type: apiActivity.activity_type,
      category: getCategoryLabel(apiActivity.activity_type), // dùng cho hiển thị màu sắc
      duration: apiActivity.duration,
      startTime: scheduleTime.toISOString().slice(11, 16),
      endTime: endTime.toISOString().slice(11, 16),
      date: scheduleTime.toISOString().slice(0, 10),
      location: apiActivity.location,
      capacity: apiActivity.capacity,
      participants: 0,
      status: 'Đã lên lịch',
      recurring: 'Không lặp lại'
    };
  } catch (error) {
    console.error('Error mapping activity:', apiActivity._id, error);
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

export default function ActivitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { residents } = useResidents();
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [evaluationResidents, setEvaluationResidents] = useState<any[]>([]);
  
  // API state
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityParticipantCounts, setActivityParticipantCounts] = useState<{[id: string]: number}>({});
  
  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await activitiesAPI.getAll();
        const mappedActivities = data.map(mapActivityFromAPI).filter(Boolean); // Filter out null values
        setActivities(mappedActivities);
      } catch (err: any) {
        console.error('Error fetching activities:', err);
        setError('Không thể tải danh sách hoạt động. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  const [searchTerm, setSearchTerm] = useState('');
  // State for selected date filter (as Date object)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [filterLocation, setFilterLocation] = useState('Tất cả');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  // Get current week's dates
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(selectedWeek);
  
  // Filter activities based on search term and filters
  const filteredActivities = activities.filter((activity) => {
    const name = activity.name || '';
    const description = activity.description || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'Tất cả' || activity.location === filterLocation;
    // Filter theo activity_type (không phải category hiển thị)
    const matchesCategory = filterCategory === 'Tất cả' || activity.activity_type === filterCategory;
    // Convert selectedDate (Date) to yyyy-MM-dd for comparison
    let filterDate = '';
    if (selectedDate && isValid(selectedDate)) {
      filterDate = format(selectedDate, 'yyyy-MM-dd');
    }
    const activityDate = activity.date || '';
    const matchesSelectedDate = activityDate === filterDate;
    return matchesSearch && matchesLocation && matchesSelectedDate && matchesCategory;
  });

  // Filter activities for current week when in calendar view
  const weekActivities = filteredActivities.filter(activity => {
    if (viewMode === 'list') return true;
    
    const activityDate = new Date(activity.date);
    return weekDates.some(date => 
      date.toDateString() === activityDate.toDateString()
    );
  });

  // Get activities for a specific date
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

  // Đổi tên cho rõ nghĩa: lấy màu theo activity_type
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
  
  // Handler functions for button actions
  const handleViewActivity = (activityId: string) => {
    router.push(`/activities/${activityId}`);
  };

  const handleEditActivity = (activityId: string) => {
    router.push(`/activities/${activityId}/edit`);
  };

  const handleCreateActivity = () => {
    router.push('/activities/new');
  };

  // Handler for opening evaluation modal
  const handleOpenEvaluation = async (activity: any) => {
    try {
      const participations = await activityParticipationsAPI.getAll({
        activity_id: activity.id,
        date: activity.date
      });
      // Lọc đúng ngày (so sánh yyyy-MM-dd)
      const filteredParticipations = participations.filter((p: any) => {
        if (!p.date) return false;
        const participationDate = new Date(p.date).toISOString().slice(0, 10);
        return participationDate === activity.date;
      });
      // Nếu chỉ muốn người đã có đánh giá/tham gia:
      // const filteredParticipations = participations.filter((p: any) => {
      //   if (!p.date) return false;
      //   const participationDate = new Date(p.date).toISOString().slice(0, 10);
      //   return participationDate === activity.date && p.attendance_status === 'attended';
      // });
      const residentIds = filteredParticipations.map((p: any) => p.resident_id?._id || p.resident_id);
      const filteredResidents = residents.filter((r: any) => residentIds.includes(r.id));
      setSelectedActivity(activity);
      setEvaluationResidents(filteredResidents);
      setEvaluationModalOpen(true);
    } catch (err) {
      alert('Không thể tải danh sách cư dân tham gia hoạt động này.');
    }
  };

  // Fetch participant counts for each activity
  useEffect(() => {
    const fetchCounts = async () => {
      const counts: {[id: string]: number} = {};
      await Promise.all(activities.map(async (activity) => {
        if (!activity.id || !activity.date) return;
        try {
          const participations = await activityParticipationsAPI.getAll({
            activity_id: activity.id,
            date: activity.date
          });
          const joined = participations.filter((p: any) => {
            const d = p.date ? new Date(p.date).toISOString().slice(0, 10) : null;
            return d === activity.date;
          });
          counts[activity.id] = joined.length;
        } catch {
          counts[activity.id] = 0;
        }
      }));
      setActivityParticipantCounts(counts);
    };
    if (activities.length > 0) fetchCounts();
  }, [activities]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTopColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Đang tải danh sách hoạt động...
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <SparklesIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
          </div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Có lỗi xảy ra
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>

        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <SparklesIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý Chương trình sinh hoạt
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {filteredActivities.length} chương trình
                </p>
                {viewMode === 'calendar' && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    margin: '0.5rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Hôm nay: {new Date().toLocaleDateString('vi-VN', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: '0.75rem',
                padding: '0.25rem',
                border: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={() => setViewMode('list')}
            style={{
                    display: 'flex',
              alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: viewMode === 'list' ? '#8b5cf6' : 'transparent',
                    color: viewMode === 'list' ? 'white' : '#64748b',
                    fontSize: '0.875rem',
                  fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListBulletIcon style={{ width: '1rem', height: '1rem' }} />
                  Danh sách
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: viewMode === 'calendar' ? '#3b82f6' : 'transparent',
                    color: viewMode === 'calendar' ? 'white' : '#64748b',
                  fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CalendarDaysIcon style={{ width: '1rem', height: '1rem' }} />
            Lịch hoạt động
                </button>
              </div>

              <button
                onClick={handleCreateActivity}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                }}
              >
                <PlusCircleIcon style={{ width: '1.125rem', height: '1.125rem' }} />
            Thêm hoạt động
              </button>
            </div>
        </div>
      </div>
      
        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm chương trình
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
              <input
                type="text"
                  placeholder="Tìm kiếm chương trình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          
            <div>
                <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
                }}>
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
      style={{
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #d1d5db',
        fontSize: '0.875rem'
      }}
    />
  }
/>
              {/* Optionally, show a warning if the date is invalid */}
            </div>
              
            <div>
                <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
                }}>
                  Địa điểm
                </label>
                <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                  style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div>
                <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
                }}>
                  Loại hoạt động
                </label>
                <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar View Week Navigation */}
        {viewMode === 'calendar' && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => navigateWeek('prev')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeftIcon style={{ width: '1rem', height: '1rem' }} />
                Tuần trước
              </button>

              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 0.25rem 0'
                }}>
                  {selectedWeek === 0 && 'Tuần này'}
                  {selectedWeek === 1 && 'Tuần sau'}
                  {selectedWeek === -1 && 'Tuần trước'}
                  {Math.abs(selectedWeek) > 1 && `${selectedWeek > 0 ? '+' : ''}${selectedWeek} tuần`}
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                  fontWeight: 500
                }}>
                  {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
                </p>
              </div>

              <button
                onClick={() => navigateWeek('next')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                  }}
              >
                Tuần sau
                <ChevronRightIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* Week Calendar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1rem'
            }}>
              {weekDates.map((date) => {
                const dayActivities = getActivitiesForDate(date);
                const today = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    style={{
                      background: today ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#f8fafc',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      border: today ? 'none' : '1px solid #e2e8f0',
                      color: today ? 'white' : '#374151',
                      minHeight: '140px'
                    }}
                  >
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        opacity: today ? 1 : 0.7,
                        marginBottom: '0.25rem'
                      }}>
                        {getDayLabel(date)}
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700
                      }}>
                        {date.getDate()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {dayActivities.slice(0, 3).map((activity, index) => (
                        <div
                          key={activity.id || `activity-${index}-${date.toISOString()}`}
                          style={{
                            background: today ? 'rgba(255, 255, 255, 0.2)' : getCategoryColor(activity.activity_type),
                            color: today ? 'white' : 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            cursor: activity.id ? 'pointer' : 'not-allowed',
                            opacity: activity.id ? 1 : 0.5
                          }}
                          onClick={() => activity.id && handleViewActivity(activity.id)}
                        >
                          {activity.name}
                        </div>
                      ))}
                      {dayActivities.length > 3 && (
                        <div key={date.toISOString() + '-more'} style={{
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          opacity: 0.7,
                          marginTop: '0.25rem'
                        }}>
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
        
        {/* Activities List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'calendar' ? 
            'repeat(auto-fit, minmax(350px, 1fr))' : 
            'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
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
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827',
                        margin: '0 0 0.5rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          width: '0.75rem',
                          height: '0.75rem',
                          borderRadius: '50%',
                          background: categoryColor
                        }} />
                        {activity.name}
                        <span style={{
                          display: 'inline-block',
                          marginLeft: 8,
                          padding: '2px 12px',
                          borderRadius: 999,
                          background: categoryColor + '22',
                          color: categoryColor,
                          fontWeight: 700,
                          fontSize: '0.85em',
                          border: `1.5px solid ${categoryColor}55`,
                          lineHeight: 1.2,
                          letterSpacing: '0.01em',
                          boxShadow: '0 1px 4px 0 ' + categoryColor + '11',
                          verticalAlign: 'middle'
                        }}>
                          {activity.category}
                        </span>
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0,
                        lineHeight: 1.4
                      }}>
                        {activity.description}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.875rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {activity.status}
                      </span>
                    </div>
                  </div>

                  {/* Compact Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <ClockIcon style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Thời gian</div>
                        <div style={{ color: '#111827', fontWeight: 600 }}>{activity.startTime} - {activity.endTime} ({activity.duration} Phút)</div>
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Ngày</div>
                        <div style={{ color: '#111827', fontWeight: 600 }}>{activity.date ? new Date(activity.date).toLocaleDateString('vi-VN') : '-'}</div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <MapPinIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Địa điểm</div>
                        <div style={{ color: '#111827', fontWeight: 600 }}>{activity.location}</div>
                      </div>
                    </div>
                    
                    {/* Participants */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <UserGroupIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Số lượng</div>
                        <div style={{ color: '#111827', fontWeight: 600 }}>{(activityParticipantCounts[activity.id] || 0)}/{activity.capacity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => activity.id && handleViewActivity(activity.id)}
                      disabled={!activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        color: '#374151',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: activity.id ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        opacity: activity.id ? 1 : 0.5
                      }}
                    >
                      <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      Xem chi tiết
                    </button>
                    {['admin', 'staff'].includes(user?.role || '') && (
                      <button
                        onClick={() => handleEditActivity(activity.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                        Chỉnh sửa
                      </button>
                    )}
                    
                  </div>
                </div>
              );
            })}
        </div>
        
        {(viewMode === 'calendar' ? weekActivities : filteredActivities).length === 0 && (
            <div style={{
            background: 'white',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <SparklesIcon style={{
              width: '4rem',
              height: '4rem',
              color: '#d1d5db',
              margin: '0 auto 1rem'
            }} />
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
              color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
              {viewMode === 'calendar' 
                ? 'Không có hoạt động nào trong tuần này'
                : 'Không tìm thấy hoạt động nào'
              }
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              {viewMode === 'calendar' 
                ? 'Thử chuyển sang tuần khác hoặc tạo hoạt động mới'
                : 'Thử thay đổi bộ lọc hoặc tạo hoạt động mới'
              }
            </p>
            <button
              onClick={handleCreateActivity}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <PlusCircleIcon style={{ width: '1rem', height: '1rem' }} />
              {viewMode === 'calendar' 
                ? 'Tạo hoạt động cho tuần này'
                : 'Tạo hoạt động đầu tiên'
              }
            </button>
          </div>
        )}
      </div>
      {/* Resident Evaluation Modal */}
      {evaluationModalOpen && selectedActivity && (
        <ResidentEvaluationModal
          open={evaluationModalOpen}
          onClose={() => setEvaluationModalOpen(false)}
          activity={selectedActivity}
          residents={evaluationResidents}
          user={user}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
