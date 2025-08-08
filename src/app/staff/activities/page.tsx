"use client";

import { useState, useEffect } from 'react';
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

// Map API data to match component expectations
const mapActivityFromAPI = (apiActivity: any) => {
  try {
    // Validate schedule_time
    if (!apiActivity.schedule_time || typeof apiActivity.schedule_time !== 'string') {
      console.warn('Invalid schedule_time for activity:', apiActivity._id);
      return null;
    }

    // Parse schedule_time as local time, do NOT add Z or treat as UTC
    const scheduleTime = new Date(apiActivity.schedule_time);

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
      startTime: scheduleTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      date: scheduleTime.toLocaleDateString('en-CA'), // Format YYYY-MM-DD cho local date
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

export default function StaffActivitiesPage() {
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
  
  // Check access permissions
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
  
  // Fetch activities from API - same logic as main activities page
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all activity participations where this staff is assigned
        if (!user?.id) {
          setError('Không tìm thấy thông tin người dùng');
          return;
        }
        
        const participations = await activityParticipationsAPI.getByStaffId(user.id);
        
        // Extract unique activity IDs from participations
        const activityIds = [...new Set(participations.map((p: any) => p.activity_id?._id || p.activity_id))].filter(Boolean);
        
        // Fetch activity details for each unique activity
        const activityPromises = activityIds.map(async (activityId: any) => {
          try {
            if (!activityId) {
              console.warn('Skipping null/undefined activity ID');
              return null;
            }
            const activityData = await activitiesAPI.getById(activityId);
            return mapActivityFromAPI(activityData);
          } catch (error) {
            console.error(`Error fetching activity ${activityId}:`, error);
            return null;
          }
        });
        
        const activityResults = await Promise.all(activityPromises);
        const validActivities = activityResults.filter(Boolean);
        
        // Sort activities by date (newest first)
        validActivities.sort((a, b) => {
          if (!a || !b) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setActivities(validActivities);
      } catch (err: any) {
        console.error('Error fetching activities:', err);
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
      
      // Loại bỏ trùng lặp - chỉ lấy bản ghi mới nhất cho mỗi resident
      const uniqueParticipations = filteredParticipations.reduce((acc: any[], current: any) => {
        const residentId = current.resident_id?._id || current.resident_id;
        const existingIndex = acc.findIndex(item => 
          (item.resident_id?._id || item.resident_id) === residentId
        );
        
        if (existingIndex === -1) {
          // Chưa có, thêm vào
          acc.push(current);
        } else {
          // Đã có, so sánh thời gian cập nhật và lấy bản mới nhất
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
            activity_id: activity.id
          });
          
          // Lọc participations cho hoạt động này và đúng ngày
          const filtered = participations.filter((p: any) => {
            const participationActivityId = p.activity_id?._id || p.activity_id;
            const participationDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
            return participationActivityId === activity.id && participationDate === activity.date;
          });
          
          // Loại bỏ trùng lặp - chỉ lấy bản ghi mới nhất cho mỗi resident
          const joined = filtered.reduce((acc: any[], current: any) => {
            const residentId = current.resident_id?._id || current.resident_id;
            const existingIndex = acc.findIndex(item => 
              (item.resident_id?._id || item.resident_id) === residentId
            );
            
            if (existingIndex === -1) {
              // Chưa có, thêm vào
              acc.push(current);
            } else {
              // Đã có, so sánh thời gian cập nhật và lấy bản mới nhất
              const existing = acc[existingIndex];
              const existingTime = new Date(existing.updated_at || existing.created_at || 0);
              const currentTime = new Date(current.updated_at || current.created_at || 0);
              
              if (currentTime > existingTime) {
                acc[existingIndex] = current;
              }
            }
            return acc;
          }, []);
          
          console.log(`Activity ${activity.name} (${activity.id}):`, {
            totalParticipations: participations.length,
            filteredParticipations: joined.length,
            activityDate: activity.date
          });
          
          counts[activity.id] = joined.length;
        } catch (error) {
          console.error(`Error fetching participations for activity ${activity.id}:`, error);
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

        {/* Activities Grid */}
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
                  {/* Header with Activity Name and Status */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Tên hoạt động:
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: '0 0 0.5rem 0',
                        lineHeight: 1.3
                      }}>
                        {activity.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Loại:
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          background: categoryColor + '15',
                          color: categoryColor,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          border: `1px solid ${categoryColor}30`
                        }}>
                          {activity.category}
                        </span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.25rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Trạng thái:
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.5rem 1rem',
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
                  </div>

                  {/* Description */}
                  {activity.description && (
                    <div style={{
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #f3f4f6'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Mô tả:
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#4b5563',
                        margin: 0,
                        lineHeight: 1.5,
                        fontStyle: 'italic'
                      }}>
                        {activity.description}
                      </p>
                    </div>
                  )}

                  {/* Key Information Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#f0f9ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ClockIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Thời gian:</div>
                        <div style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>
                          {activity.startTime} - {activity.endTime}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>({activity.duration} phút)</div>
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#fef3c7',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CalendarIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Ngày:</div>
                        <div style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>
                          {activity.date ? new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN') : '-'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#ecfdf5',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1fae5'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MapPinIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Địa điểm:</div>
                        <div style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>
                          {activity.location}
                        </div>
                      </div>
                    </div>
                    
                    {/* Participants */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#fef3c7',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UserGroupIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Số lượng cư dân tham gia:</div>
                        <div style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>
                          {(activityParticipantCounts[activity.id] || 0)}/{activity.capacity}
                        </div>
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
                  </div>
                  </div>
               
              );
            })}
        </div>

        {/* Empty State */}
        {filteredActivities.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <SparklesIcon style={{
              width: '4rem',
              height: '4rem',
              color: '#9ca3af',
              margin: '0 auto 1rem auto'
            }} />
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#374151',
              margin: '0 0 0.5rem 0'
            }}>
              Không có hoạt động nào
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: 0
            }}>
              {searchTerm || filterCategory !== 'Tất cả' || filterLocation !== 'Tất cả' || selectedDate
                ? 'Không tìm thấy hoạt động nào phù hợp với bộ lọc hiện tại.'
                : 'Bạn chưa được phân công phụ trách hoạt động nào.'}
            </p>
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {evaluationModalOpen && selectedActivity && (
        <ResidentEvaluationModal
          open={evaluationModalOpen}
          onClose={() => {
            setEvaluationModalOpen(false);
            setSelectedActivity(null);
            setEvaluationResidents([]);
            // Refresh participant counts after closing
            const fetchCounts = async () => {
              const counts: {[id: string]: number} = {};
              await Promise.all(activities.map(async (activity) => {
                if (!activity.id || !activity.date) return;
                try {
                  const participations = await activityParticipationsAPI.getAll({
                    activity_id: activity.id
                  });
                  
                  // Lọc participations cho hoạt động này và đúng ngày
                  const joined = participations.filter((p: any) => {
                    const participationActivityId = p.activity_id?._id || p.activity_id;
                    const participationDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
                    return participationActivityId === activity.id && participationDate === activity.date;
                  });
                  
                  counts[activity.id] = joined.length;
                } catch (error) {
                  console.error(`Error fetching participations for activity ${activity.id}:`, error);
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