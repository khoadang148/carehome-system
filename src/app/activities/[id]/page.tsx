"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, SparklesIcon, ClipboardDocumentListIcon, UserGroupIcon, ClockIcon, MapPinIcon, UserIcon, CalendarIcon, EyeIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useResidents } from '@/lib/contexts/residents-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { activitiesAPI, activityParticipationsAPI } from '@/lib/api';
import { Dialog } from '@headlessui/react';

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { residents, loading: residentsLoading, error: residentsError } = useResidents();
  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participations, setParticipations] = useState<any[]>([]);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<{[key: string]: {participated: boolean, reason?: string}}>({});
  const [saving, setSaving] = useState(false);
  const [addResidentModalOpen, setAddResidentModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [addingResident, setAddingResident] = useState(false);
  
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
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const activityId = params.id;
        const apiActivity = await activitiesAPI.getById(activityId);
        if (apiActivity) {
          setActivity(mapActivityFromAPI(apiActivity));
        } else {
          setError('Không tìm thấy hoạt động');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Không thể tải thông tin hoạt động. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [params.id]);

  // Fetch participations for this activity
  useEffect(() => {
    const fetchParticipations = async () => {
      if (!activity?.id) return;
      
      try {
        const participationsData = await activityParticipationsAPI.getAll({
          activity_id: activity.id
        });
        console.log('Fetched participations:', participationsData);
        console.log('Available residents:', residents);
        setParticipations(participationsData);
        
        // Initialize evaluations from existing participations
        // Handle the nested resident_id object structure from API
        const initialEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
        participationsData.forEach((participation: any) => {
          // Extract resident_id from the nested object structure
          const residentId = participation.resident_id?._id || participation.resident_id;
          const participated = participation.attendance_status === 'attended';
          const reason = participation.performance_notes || '';
          
          if (residentId) {
            console.log('Processing participation for residentId:', residentId);
            // Map API resident_id to residents context ID
            // Now both use string IDs
            const matchingResident = residents.find(r => r.id === residentId);
            console.log('Matching resident found by ID:', matchingResident);
            
            // If no match by ID, try to match by name from API
            if (!matchingResident && participation.resident_id?.full_name) {
              const matchingResidentByName = residents.find(r => 
                r.name.toLowerCase() === participation.resident_id.full_name.toLowerCase()
              );
              console.log('Matching resident found by name:', matchingResidentByName);
              
              if (matchingResidentByName) {
                initialEvaluations[matchingResidentByName.id] = {
                  participated,
                  reason
                };
              }
            } else if (matchingResident) {
              initialEvaluations[matchingResident.id] = {
                participated,
                reason
              };
            } else {
              console.log('No matching resident found for ID:', residentId, 'or name:', participation.resident_id?.full_name);
            }
          }
        });
        console.log('Initialized evaluations:', initialEvaluations);
        setEvaluations(initialEvaluations);
      } catch (error) {
        console.error('Error fetching participations:', error);
      }
    };
    
    fetchParticipations();
  }, [activity?.id]);

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
        category: getCategoryLabel(apiActivity.activity_type),
        scheduledTime: scheduleTime.toISOString().slice(11, 16), // Get HH:mm from UTC
        startTime: scheduleTime.toISOString().slice(11, 16), // Get HH:mm from UTC
        endTime: endTime.toISOString().slice(11, 16), // Calculate end time in UTC
        duration: apiActivity.duration,
        date: scheduleTime.toISOString().slice(0, 10), // Get yyyy-MM-dd from UTC
        location: apiActivity.location,
        capacity: apiActivity.capacity,
        participants: 0, // API không có field này, sẽ cần fetch riêng
        facilitator: 'Chưa phân công',
        status: 'Đã lên lịch',
        level: 'Trung bình',
        recurring: 'Không lặp lại',
        materials: '',
        specialNotes: '',
        ageGroupSuitability: ['Người cao tuổi'],
        healthRequirements: ['Không có yêu cầu đặc biệt'],
        createdAt: apiActivity.created_at || '',
        updatedAt: apiActivity.updated_at || '',
        residentEvaluations: [],
        benefits: ['Cải thiện sức khỏe', 'Tăng cường tinh thần', 'Giao lưu xã hội'],
        notes: 'Không có ghi chú đặc biệt.',
      };
    } catch (error) {
      console.error('Error mapping activity:', apiActivity._id, error);
      return null;
    }
  };

  // Helper functions for data mapping
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

  const formatTime = (time: string | undefined) => {
    if (!time || typeof time !== 'string' || !time.includes(':')) {
      return '';
    }
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getRecurringLabel = (recurring: string) => {
    const recurringMap: { [key: string]: string } = {
      'none': 'Không lặp lại',
      'daily': 'Hàng ngày',
      'weekly': 'Hàng tuần', 
      'biweekly': 'Hai tuần một lần',
      'monthly': 'Hàng tháng'
    };
    return recurringMap[recurring] || recurring;
  };
  
  const handleEditClick = () => {
    router.push(`/activities/${activity.id}/edit`);
  };

  // Evaluation functions
  const handleEvaluationChange = (residentId: string, participated: boolean) => {
    setEvaluations(prev => ({
      ...prev,
      [residentId]: {
        ...prev[residentId],
        participated,
        reason: participated ? '' : (prev[residentId]?.reason || '')
      }
    }));
  };

  const handleReasonChange = (residentId: string, reason: string) => {
    setEvaluations(prev => ({
      ...prev,
      [residentId]: {
        ...prev[residentId],
        reason
      }
    }));
  };

  const handleSelectAll = (participated: boolean) => {
    setEvaluations(prev => {
      const newEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
      filteredResidents.forEach(resident => {
        newEvaluations[resident.id] = {
          participated,
          reason: participated
            ? ''
            : (prev[resident.id]?.reason || '')
        };
      });
      return newEvaluations;
    });
  };

  const handleSaveEvaluations = async () => {
    if (!activity?.id) return;
    
    // Validate evaluations before saving
    const invalidEvaluations = Object.entries(evaluations).filter(([_, evaluation]) => {
      return !evaluation.participated && (!evaluation.reason || evaluation.reason.trim() === '');
    });
    
    if (invalidEvaluations.length > 0) {
      alert(`Vui lòng nhập lý do vắng mặt cho ${invalidEvaluations.length} cư dân đã chọn "Không tham gia".`);
      return;
    }
    
    setSaving(true);
    try {
      // Update or create participations for each resident
      for (const [residentId, evaluation] of Object.entries(evaluations)) {
        // Find existing participation by matching resident_id and date
        const existingParticipation = participations.find(p => {
          const pResidentId = p.resident_id?._id || p.resident_id;
          const pDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
          return (
            pResidentId === residentId &&
            pDate === activity.date
          );
        });
        
        if (existingParticipation) {
          // Update existing participation
          await activityParticipationsAPI.update(existingParticipation._id, {
            staff_id: user?.id || "664f1b2c2f8b2c0012a4e750",
            activity_id: activity.id,
            resident_id: residentId,
            date: activity.date + "T00:00:00Z",
            performance_notes: evaluation.participated ? 
              'Tham gia tích cực, tinh thần tốt' : 
              (evaluation.reason || 'Không có lý do cụ thể'),
            attendance_status: evaluation.participated ? 'attended' : 'absent'
          });
        } else {
          // Create new participation
          // Find the resident to get their API ID
          const resident = residents.find(r => r.id === residentId);
          if (resident) {
            // Use the resident's actual ID and follow API schema
            await activityParticipationsAPI.create({
              staff_id: user?.id || "664f1b2c2f8b2c0012a4e750", // Use current user's ID or fallback
              activity_id: activity.id,
              resident_id: resident.id, // Use actual resident ID
              date: activity.date + "T00:00:00Z", // Use activity date instead of current date
              performance_notes: evaluation.participated ? 
                'Tham gia tích cực, tinh thần tốt' : 
                (evaluation.reason || 'Không có lý do cụ thể'),
              attendance_status: evaluation.participated ? 'attended' : 'absent'
            });
          }
        }
      }
      
      // Refresh participations
      const participationsData = await activityParticipationsAPI.getAll({
        activity_id: activity.id
      });
      setParticipations(participationsData);
      
      setEvaluationMode(false);
      alert('Đánh giá đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving evaluations:', error);
      alert('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Debug: Log residents data
  console.log('Residents data:', residents);
  console.log('Residents loading:', residentsLoading);
  console.log('Residents error:', residentsError);
  console.log('Participations data:', participations);
  
  const activityDate = activity?.date ? new Date(activity.date).toISOString().split('T')[0] : null;
  type ActivityResident = {
    id: string;
    name: string;
    room: string;
    age: string | number;
    participationId: string;
    participated: boolean;
    reason: string;
    evaluationDate: string;
  };
  // Map participations to ActivityResident[]
  const allResidentsForDay: ActivityResident[] = participations
    .filter((p: any) => {
      // Lọc đúng ngày
      const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
      return activityDate && participationDate === activityDate;
    })
    .map((p: any) => {
      const residentId = p.resident_id?._id || p.resident_id;
      const residentInfo = residents.find((r: any) => r.id === residentId);
      return {
        id: residentId,
        name: p.resident_id?.full_name || residentInfo?.name || 'N/A',
        room: residentInfo?.room || '',
        age: residentInfo?.age || '',
        participationId: p._id,
        participated: p.attendance_status === 'attended',
        reason: p.performance_notes || '',
        evaluationDate: p.date
      };
    });
// Chỉ giữ lại 1 bản ghi cho mỗi cư dân/ngày, ưu tiên bản ghi 'Không tham gia'
const activityResidents: ActivityResident[] = Object.values(
  allResidentsForDay.reduce((acc, curr) => {
    // Key theo residentId
    const key = curr.id;
    // Nếu chưa có hoặc bản ghi hiện tại là 'Không tham gia', thì ghi đè
    if (!acc[key] || (!curr.participated)) {
      acc[key] = curr;
    }
    return acc;
  }, {} as { [residentId: string]: ActivityResident })
);
  // Filter activity residents based on search term
  const filteredResidents: ActivityResident[] = activityResidents.filter((resident: ActivityResident) =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resident.room?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  // Lấy danh sách cư dân chưa tham gia hoạt động này vào đúng ngày
  const joinedResidentIds = Array.from(new Set(
    participations
      .filter((p: any) => {
        const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
        return activityDate && participationDate === activityDate;
      })
      .map((p: any) => p.resident_id?._id || p.resident_id)
  ));
  const residentsNotJoined = residents.filter((r: any) => !joinedResidentIds.includes(r.id));

  // Thêm cư dân vào hoạt động
  const handleAddResident = async () => {
    if (!selectedResidentId || !activity?.id || !activity.date) return;
    setAddingResident(true);
    try {
      await activityParticipationsAPI.create({
        staff_id: user?.id || '',
        activity_id: activity.id,
        resident_id: selectedResidentId,
        date: activity.date + 'T00:00:00Z',
        attendance_status: 'attended',
        performance_notes: ''
      });
      setAddResidentModalOpen(false);
      setSelectedResidentId(null);
      // Reload participations
      const participationsData = await activityParticipationsAPI.getAll({
        activity_id: activity.id
      });
      setParticipations(participationsData);
    } catch (err) {
      alert('Không thể thêm cư dân vào hoạt động.');
    } finally {
      setAddingResident(false);
    }
  };
  
  if (loading || residentsLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
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
            {loading ? 'Đang tải thông tin hoạt động...' : 'Đang tải danh sách cư dân...'}
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

  if (error || residentsError || !activity) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
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
            {error || residentsError || 'Không tìm thấy hoạt động'}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            {error || residentsError || 'Hoạt động này không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link href="/activities" style={{
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
            textDecoration: 'none'
          }}>
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại danh sách hoạt động
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to render category with appropriate color
  const renderCategory = (category: string) => {
    const bgColor = 
      category === 'Thể chất' ? 'rgba(16, 185, 129, 0.1)' : 
      category === 'Sáng tạo' ? 'rgba(139, 92, 246, 0.1)' :
      category === 'Trị liệu' ? 'rgba(245, 158, 11, 0.1)' :
      category === 'Nhận thức' ? 'rgba(59, 130, 246, 0.1)' :
      category === 'Xã hội' ? 'rgba(236, 72, 153, 0.1)' : 
      category === 'Giáo dục' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(156, 163, 175, 0.1)';
      
    const textColor = 
      category === 'Thể chất' ? '#10b981' : 
      category === 'Sáng tạo' ? '#8b5cf6' :
      category === 'Trị liệu' ? '#f59e0b' :
      category === 'Nhận thức' ? '#3b82f6' :
      category === 'Xã hội' ? '#ec4899' : 
      category === 'Giáo dục' ? '#06b6d4' : '#9ca3af';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.375rem 0.875rem', 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${textColor}20`
      }}>
        {category}
      </span>
    );
  };

  // Helper function to render status with appropriate color
  const renderStatus = (status: string) => {
    const bgColor = 
      status === 'Đã lên lịch' ? 'rgba(99, 102, 241, 0.1)' : 
      status === 'Đang diễn ra' ? 'rgba(16, 185, 129, 0.1)' :
      status === 'Đã hoàn thành' ? 'rgba(156, 163, 175, 0.1)' :
      status === 'Đã hủy' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)';
      
    const textColor = 
      status === 'Đã lên lịch' ? '#6366f1' : 
      status === 'Đang diễn ra' ? '#10b981' :
      status === 'Đã hoàn thành' ? '#9ca3af' :
      status === 'Đã hủy' ? '#ef4444' : '#9ca3af';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.375rem 0.875rem', 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${textColor}20`
      }}>
        {status}
      </span>
    );
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
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
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Link
                href="/activities"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: '#f1f5f9',
                  color: '#64748b',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Link>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 8px 20px -5px rgba(245, 158, 11, 0.3)'
                }}>
                  <EyeIcon style={{ 
                    width: '2rem', 
                    height: '2rem',
                    color: 'white'
                  }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em'
                  }}>
                    Chi tiết hoạt động
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: '#92400e',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Thông tin đầy đủ về chương trình sinh hoạt
                  </p>
                </div>
              </div>
        </div>
        
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
                borderRadius: '0.75rem',
            border: 'none',
            fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.25)'
              }}
            >
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
          Chỉnh sửa
        </button>
          </div>
      </div>
      
        {/* Main Activity Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          {/* Activity Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '2rem'
          }}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    opacity: 0.8,
                    display: 'block',
                    marginBottom: '0.25rem'
                  }}>
                    Tên hoạt động:
                  </label>
                  <h2 style={{
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: 700, 
                    margin: 0,
                    lineHeight: 1.2,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {activity.name}
                  </h2>
                </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    opacity: 0.8,
                    display: 'block',
                    marginBottom: '0.25rem'
                  }}>
                    Mô tả:
                  </label>
                  <p style={{
                    fontSize: '1.125rem', 
                    margin: 0, 
                    opacity: 0.95,
                    lineHeight: 1.5,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}>
                    {activity.description}
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.5rem', 
                marginLeft: '1.5rem',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  alignItems: 'flex-end'
                }}>

                </div>
              </div>
            </div>
            
            {/* Quick Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <CalendarIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Ngày:</label>
                  <span>{new Date(activity.date).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <ClockIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Thời gian:</label>
                  <span>{activity.scheduledTime} - {activity.endTime}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <MapPinIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Địa điểm:</label>
                  <span>{activity.location}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <UserGroupIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Số người tham gia:</label>
                  <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                    {joinedResidentIds.length}/{activity.capacity} người
                  </span>
                </div>
            </div>
          </div>
        </div>
        
          {/* Content Section */}
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '1.5rem'
            }}>
            
            {/* Schedule Information */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem', 
                border: '1px solid #e5e7eb', 
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: '#111827', 
                  marginTop: 0, 
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}>
                  <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                Thông tin lịch trình
              </h3>
              
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Ngày:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                    {new Date(activity.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Thời gian bắt đầu:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.scheduledTime}
                    </span>
                </div>
                
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Thời gian kết thúc:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.endTime}
                    </span>
                </div>
                
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Thời lượng:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.duration} phút
                    </span>
                </div>
                
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Địa điểm:</span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#111827', 
                      fontWeight: 600,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem' 
                    }}>
                      <MapPinIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6366f1' }} />
                    {activity.location}
                    </span>
                </div>
                


              </div>
            </div>
            
            {/* Participation Information */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem', 
                border: '1px solid #e5e7eb', 
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: '#111827', 
                  marginTop: 0, 
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}>
                  <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                Thông tin tham gia
              </h3>
              
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>Sức chứa: {activity.capacity} người</div>
                    <div style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>
                      Đã đăng ký: {joinedResidentIds.length} người
                      <span style={{ color: '#10b981', marginLeft: 8 }}>
                        Còn {activity.capacity - joinedResidentIds.length} chỗ
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button
                      onClick={() => setAddResidentModalOpen(true)}
                      style={{
                        background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      + Thêm cư dân
                    </button>
                  </div>

              </div>
            </div>
            
            
          </div>
          
          
          


          {/* Bảng đánh giá tham gia */}
          <div style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                  Đánh giá tham gia hoạt động
                  {activity.date && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginLeft: '0.5rem'
                    }}>
                      - Ngày {new Date(activity.date).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </h3>
                {participations.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <span>Tham gia: <strong style={{ color: '#10b981' }}>{activityResidents.filter(r => r.participated).length}</strong></span>
                    <span>Vắng: <strong style={{ color: '#dc2626' }}>{activityResidents.filter(r => !r.participated).length}</strong></span>
                    <span>Tổng: <strong>{activityResidents.length}</strong></span>
                  </div>
                )}
              </div>
              {!evaluationMode && (
                <button
                  onClick={() => setEvaluationMode(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                  Đánh giá tham gia
                </button>
              )}
            </div>

            {evaluationMode ? (
              <div>
                {/* Search and bulk actions */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  alignItems: 'center'
                }}>
                  <div style={{ position: 'relative', flex: 1 }}>
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
                      placeholder="Tìm kiếm cư dân theo tên hoặc phòng..."
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
                  <button
                    onClick={() => handleSelectAll(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckIcon style={{ width: '1rem', height: '1rem' }} />
                    Chọn tất cả Có
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                    Chọn tất cả Không
                  </button>
                </div>

                {/* Participants list */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredResidents.map((resident) => {
                    const evaluation = evaluations[resident.id] || { participated: resident.participated, reason: resident.reason };
                    return (
                      <div
                        key={resident.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          borderBottom: '1px solid #e5e7eb',
                          background: evaluation.participated ? '#f0fdf4' : '#fef2f2'
                        }}
                      >
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          background: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          marginRight: '1rem'
                        }}>
                          {resident.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                            {resident.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Phòng: {resident.room || 'N/A'} | Tuổi: {resident.age || 'N/A'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`participation-${resident.id}`}
                              checked={evaluation.participated}
                              onChange={() => handleEvaluationChange(resident.id, true)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Có</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`participation-${resident.id}`}
                              checked={!evaluation.participated}
                              onChange={() => handleEvaluationChange(resident.id, false)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Không</span>
                          </label>
                        </div>
                        {!evaluation.participated && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="Lý do vắng mặt..."
                              value={evaluation.reason || ''}
                              onChange={(e) => handleReasonChange(resident.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                background: '#fef2f2'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredResidents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      {participations.length === 0 ? 'Chưa có đánh giá tham gia nào cho hoạt động này.' : 'Không tìm thấy cư dân nào phù hợp với từ khóa tìm kiếm.'}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setEvaluationMode(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEvaluations}
                    disabled={saving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: saving ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {saving && (
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid transparent',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Tên cư dân</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Tham gia</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Lý do (nếu vắng)</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Ngày đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityResidents.map((resident) => {
                      const participated = resident.participated;
                      
                      // Validate performance notes for absent residents
                      const performanceNotes = resident.reason;
                      const isValidAbsenceReason = !participated && performanceNotes && 
                        !performanceNotes.includes('Tham gia tích cực') && 
                        !performanceNotes.includes('tinh thần tốt');
                      
                      return (
                        <tr key={resident.participationId} style={{ background: participated ? '#f0fdf4' : '#fef2f2' }}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>
                            {resident.name}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: participated ? '#10b981' : '#dc2626', fontWeight: 600 }}>
                            {participated ? 'Có' : 'Không'}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                            {participated ? '-' : (
                              isValidAbsenceReason ? performanceNotes : 
                              <span style={{ color: '#f59e0b' }}>Chưa nhập lý do hoặc lý do không hợp lệ</span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '0.875rem' }}>
                            {resident.evaluationDate ? new Date(resident.evaluationDate).toLocaleDateString('vi-VN') : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                    {activityResidents.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                          Chưa có đánh giá tham gia nào cho ngày này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Modal chọn cư dân */}
      <Dialog open={addResidentModalOpen} onClose={() => setAddResidentModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-15">
            <Dialog.Title className="text-lg font-bold mb-4">Chọn cư dân để thêm vào hoạt động</Dialog.Title>
            <select
              value={selectedResidentId || ''}
              onChange={e => setSelectedResidentId(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">-- Chọn cư dân --</option>
              {residentsNotJoined.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name} (Phòng: {r.room || 'N/A'})</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddResidentModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold"
                disabled={addingResident}
              >
                Hủy
              </button>
              <button
                onClick={handleAddResident}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-semibold"
                disabled={addingResident || !selectedResidentId}
              >
                {addingResident ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

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