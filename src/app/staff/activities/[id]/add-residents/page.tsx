"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, UserGroupIcon, ClockIcon, MapPinIcon, CalendarIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon, UserPlusIcon, HomeIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';
import { useAuth } from '@/lib/contexts/auth-context';
import { activitiesAPI, activityParticipationsAPI, residentAPI, roomsAPI, bedAssignmentsAPI, staffAPI } from '@/lib/api';
import NotificationModal from '@/components/NotificationModal';

export default function StaffAddResidentsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  // Fetch activity data
  const { data: activityData, error: activityError } = useSWR(
    user ? `activity:${id}` : null,
    () => activitiesAPI.getById(id),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  
  // Fetch admitted residents data
  const { data: residentsData, error: residentsError } = useSWR(
    user ? 'residents:admitted' : null,
    () => residentAPI.getAdmitted(),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  
  // Fetch participations data - sẽ được fetch sau khi có activity data
  const { data: participationsData, error: participationsError } = useSWR(
    user && activityData ? `participations:${id}:${activityData.schedule_time}` : null,
    () => {
      if (!activityData) return null;
      const scheduleTime = new Date(activityData.schedule_time);
      const activityDate = `${scheduleTime.getUTCFullYear()}-${(scheduleTime.getUTCMonth() + 1).toString().padStart(2, '0')}-${scheduleTime.getUTCDate().toString().padStart(2, '0')}`;
      return activityParticipationsAPI.getByActivityId(id, activityDate);
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  
  // Fetch staff activity stats (distinct activities per staff)
  const { data: staffStatsData } = useSWR(
    user ? 'activity-participations:stats:all-staff' : null,
    () => activityParticipationsAPI.getAllStaffStats(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Fetch staff data
  const { data: staffData, error: staffError } = useSWR(
    user ? 'staff:active' : null,
    () => staffAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  
  console.log('Staff data:', staffData);
  console.log('Staff error:', staffError);
  
  const mapActivityFromAPI = (apiActivity: any) => {
    try {
      if (!apiActivity.schedule_time || typeof apiActivity.schedule_time !== 'string') {
        return null;
      }

      const scheduleTimeStr = apiActivity.schedule_time.endsWith('Z')
        ? apiActivity.schedule_time
        : `${apiActivity.schedule_time}Z`;
      const scheduleTime = new Date(scheduleTimeStr);

      if (isNaN(scheduleTime.getTime())) {
        return null;
      }

      const durationInMinutes = typeof apiActivity.duration === 'number' ? apiActivity.duration : 0;
      const endTime = new Date(scheduleTime.getTime() + durationInMinutes * 60000);

      if (isNaN(endTime.getTime())) {
        return null;
      }

      const convertToVietnamTime = (utcTime: Date) => {
        // Lấy thời gian UTC trực tiếp từ database, không chuyển đổi múi giờ
        const utcHours = utcTime.getUTCHours();
        const utcMinutes = utcTime.getUTCMinutes();
        return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
      };

      return {
        id: apiActivity._id,
        name: apiActivity.activity_name,
        description: apiActivity.description,
        scheduledTime: convertToVietnamTime(scheduleTime),
        startTime: convertToVietnamTime(scheduleTime),
        endTime: convertToVietnamTime(endTime),
        duration: apiActivity.duration,
        date: `${scheduleTime.getUTCFullYear()}-${(scheduleTime.getUTCMonth() + 1).toString().padStart(2, '0')}-${scheduleTime.getUTCDate().toString().padStart(2, '0')}`, // Format YYYY-MM-DD từ UTC date
        location: apiActivity.location,
        capacity: apiActivity.capacity,
        status: 'Đã lên lịch'
      };
    } catch (error) {
      return null;
    }
  };

  // Process data
  const activity = React.useMemo(() => {
    if (!activityData) return null;
    return mapActivityFromAPI(activityData);
  }, [activityData]);
  
  const residents = React.useMemo(() => {
    if (!residentsData) return [];
    return Array.isArray(residentsData) ? residentsData : [];
  }, [residentsData]);
  
  const participations = React.useMemo(() => {
    if (!participationsData) return [];
    return Array.isArray(participationsData) ? participationsData : [];
  }, [participationsData]);
  
  // Merge staff with stats and sort ascending by distinct activity count
  const staff = React.useMemo(() => {
    if (!staffData) return [];
    const allStaff = Array.isArray(staffData) ? staffData : [];
    const activeStaff = allStaff.filter((staffMember: any) => 
      staffMember.status === 'active' || staffMember.status === 'Active'
    );
    const stats = Array.isArray(staffStatsData) ? staffStatsData : [];
    const staffWithCounts = activeStaff.map((s: any) => {
      const sid = s._id || s.id;
      const stat = stats.find((x: any) => x.staff_id === sid);
      return { ...s, distinct_activity_count: stat?.distinct_activity_count ?? 0 };
    });
    staffWithCounts.sort((a: any, b: any) => (a.distinct_activity_count || 0) - (b.distinct_activity_count || 0));
    return staffWithCounts;
  }, [staffData, staffStatsData]);
  
  // State
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [addingResidents, setAddingResidents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomNumbers, setRoomNumbers] = useState<{ [residentId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  
  // Auto-select current user as staff
  useEffect(() => {
    if (user?.id && !selectedStaffId) {
      setSelectedStaffId(user.id);
    }
  }, [user?.id, selectedStaffId]);
  
  const [notificationModal, setNotificationModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  // Load room numbers for residents
  useEffect(() => {
    if (!residents.length) return;

    const loadRoomNumbers = async () => {
      const roomNumbersMap: { [residentId: string]: string } = {};
      
      const promises = residents.map(async (resident: any) => {
        try {
          const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident._id || resident.id);
          const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id?.room_id) : null;

          if (bedAssignment?.bed_id?.room_id) {
            if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
              roomNumbersMap[resident._id || resident.id] = bedAssignment.bed_id.room_id.room_number;
            } else {
              const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
              if (roomId) {
                const room = await roomsAPI.getById(roomId);
                roomNumbersMap[resident._id || resident.id] = room?.room_number || 'Chưa xác định';
              } else {
                roomNumbersMap[resident._id || resident.id] = 'Chưa xác định';
              }
            }
          } else {
            roomNumbersMap[resident._id || resident.id] = 'Chưa xác định';
          }
        } catch (error) {
          roomNumbersMap[resident._id || resident.id] = 'Chưa xác định';
        }
      });

      await Promise.all(promises);
      setRoomNumbers(roomNumbersMap);
    };

    loadRoomNumbers();
  }, [residents]);

  // Set loading state
  useEffect(() => {
    if (activityData && residentsData && participationsData && staffData) {
      setLoading(false);
    }
  }, [activityData, residentsData, participationsData, staffData]);

  // Auth check
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

  const isActivityTimePassed = () => {
    if (!activity?.date || !activity?.scheduledTime) {
      return false;
    }
    
    const now = new Date();
    const adjustedNow = new Date(now.getTime() - (7 * 60 * 60 * 1000));
    const today = adjustedNow.toISOString().split('T')[0];
    
    if (activity.date !== today) {
      const activityDate = new Date(activity.date + 'T00:00:00');
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      return activityDate < todayDate;
    }
    
    const [hours, minutes] = activity.scheduledTime.split(':');
    const activityTime = new Date(adjustedNow);
    activityTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return adjustedNow > activityTime;
  };

  // Filter residents
  const availableResidents = React.useMemo(() => {
    return residents.filter((resident: any) => {
      const residentId = resident._id || resident.id;
      const isAlreadyParticipating = participations.some((p: any) => {
        const pResidentId = p.resident_id?._id || p.resident_id;
        const participationActivityId = p.activity_id?._id || p.activity_id;
        const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
        const activityDate = activity?.date;
        
        return pResidentId === residentId && participationActivityId === activity?.id && participationDate === activityDate;
      });
      
      return !isAlreadyParticipating;
    });
  }, [residents, participations, activity]);

  // Filter by search term
  const filteredResidents = React.useMemo(() => {
    if (!searchTerm) return availableResidents;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return availableResidents.filter((resident: any) => {
      const name = (resident.full_name || resident.fullName || '').toLowerCase();
      const room = (roomNumbers[resident._id || resident.id] || '').toLowerCase();
      
      return name.includes(lowerSearchTerm) || room.includes(lowerSearchTerm);
    });
  }, [availableResidents, searchTerm, roomNumbers]);

  // Group residents by age
  const ageGroups = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    filteredResidents.forEach((resident: any) => {
      let age = parseInt(resident.age) || 0;
      if (!age && resident.date_of_birth) {
        const birthDate = new Date(resident.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      let ageGroup = '';
      if (age >= 80) ageGroup = '80+ tuổi';
      else if (age >= 70) ageGroup = '70-79 tuổi';
      else if (age >= 60) ageGroup = '60-69 tuổi';
      else if (age >= 50) ageGroup = '50-59 tuổi';
      else ageGroup = 'Dưới 50 tuổi';
      
      if (!groups[ageGroup]) {
        groups[ageGroup] = [];
      }
      groups[ageGroup].push(resident);
    });
    
    return groups;
  }, [filteredResidents]);

  const participationCount = participations.filter((p: any) => {
    const participationActivityId = p.activity_id?._id || p.activity_id;
    return participationActivityId === activity?.id;
  }).length;

  const handleAddResidents = async () => {
    if (!activity?.id || selectedResidentIds.length === 0) return;

    if (user?.role !== 'admin') {
      setNotificationModal({
        open: true,
        title: 'Không có quyền',
        message: 'Bạn không có quyền thêm người cao tuổi vào hoạt động.',
        type: 'error'
      });
      return;
    }

    if (isActivityTimePassed()) {
      setNotificationModal({
        open: true,
        title: 'Không thể thay đổi',
        message: 'Hoạt động đã qua thời gian, không thể thêm người cao tuổi.',
        type: 'warning'
      });
      return;
    }

    // Staff is automatically selected, no need to check

    setAddingResidents(true);
    try {
      const currentActivityParticipations = participations.filter(p => {
        const participationActivityId = p.activity_id?._id || p.activity_id;
        return participationActivityId === activity.id;
      });

      const currentParticipantIds = currentActivityParticipations.map(p =>
        p.resident_id?._id || p.resident_id
      );

      const newResidentIds = selectedResidentIds.filter((residentId: string) =>
        !currentParticipantIds.includes(residentId)
      );

      const currentParticipantCount = currentParticipantIds.length;
      const totalAfterAdding = currentParticipantCount + newResidentIds.length;

      if (totalAfterAdding > activity.capacity) {
        const canAddCount = activity.capacity - currentParticipantCount;
        setNotificationModal({
          open: true,
          title: 'Cảnh báo',
          message: `Hoạt động chỉ còn ${canAddCount} chỗ trống, nhưng bạn đã chọn ${selectedResidentIds.length} người cao tuổi. Chỉ có thể thêm ${canAddCount} người cao tuổi đầu tiên.`,
          type: 'warning'
        });

        newResidentIds.splice(canAddCount);
      }

      let addedCount = 0;
      
      // Lấy staff đã được gán cho hoạt động (sử dụng biến đã có)
      let assignedStaffId = null;
      for (const participation of currentActivityParticipations) {
        if (participation.staff_id) {
          assignedStaffId = participation.staff_id?._id || participation.staff_id;
          break;
        }
      }
      
      // Sử dụng staff đã chọn
      const staffId = selectedStaffId;

      for (const residentId of newResidentIds) {
        try {
          if (!residentId || typeof residentId !== 'string' || !residentId.match(/^[0-9a-fA-F]{24}$/)) {
            continue;
          }
          
          const participationData = {
            staff_id: staffId,
            activity_id: activity.id,
            resident_id: residentId,
            date: activity.date + 'T00:00:00Z',
            attendance_status: 'pending',
            performance_notes: ''
          };
          
          await activityParticipationsAPI.create(participationData);
          addedCount++;
        } catch (error) {
          console.error('Error adding resident:', residentId, error);
        }
      }

      setNotificationModal({
        open: true,
        title: 'Thành công',
        message: `Đã thêm ${addedCount} người cao tuổi vào hoạt động thành công!`,
        type: 'success'
      });

      // Redirect back to activity detail page
      setTimeout(() => {
        router.push(`/staff/activities/${activity.id}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error in handleAddResidents:', error);
      let errorMessage = 'Không thể thêm người cao tuổi vào hoạt động. Vui lòng thử lại.';

      if (error.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }

      setNotificationModal({
        open: true,
        title: 'Lỗi',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setAddingResidents(false);
    }
  };

  if (loading) {
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
            borderTopColor: '#3b82f6',
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
            Đang tải dữ liệu...
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

  if (activityError || residentsError || participationsError || !activity) {
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
            <XMarkIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
          </div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            {activityError || residentsError || participationsError || 'Không tìm thấy hoạt động'}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            {activityError || residentsError || participationsError || 'Hoạt động này không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link href="/staff/activities" style={{
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
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Link
                href={`/staff/activities/${activity.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  color: '#64748b',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 20px -5px rgba(102, 126, 234, 0.3)'
                }}>
                  <UserPlusIcon style={{
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em'
                  }}>
                    Thêm người cao tuổi
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: '#667eea',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Chọn người cao tuổi tham gia hoạt động
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

         {/* Staff Info Card - Read Only */}
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
             alignItems: 'center',
             gap: '1rem',
             marginBottom: '1.5rem'
           }}>
             <div style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               width: '2.5rem',
               height: '2.5rem',
               borderRadius: '0.75rem',
               background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
               boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
             }}>
               <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
             </div>
             <div>
               <h3 style={{
                 fontSize: '1.25rem',
                 fontWeight: 600,
                 color: '#111827',
                 margin: 0
               }}>
                 Nhân viên phụ trách
               </h3>
               <p style={{
                 fontSize: '0.875rem',
                 color: '#6b7280',
                 margin: '0.25rem 0 0 0'
               }}>
                 Thông tin nhân viên sẽ phụ trách hoạt động này
               </p>
             </div>
           </div>
           <div
             style={{
               padding: '1.5rem',
               background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
               borderRadius: '1rem',
               border: '1px solid #e5e7eb',
               display: 'flex',
               alignItems: 'center',
               gap: '1rem',
             }}
           >
             <div
               style={{
                 width: '3rem',
                 height: '3rem',
                 borderRadius: '50%',
                 background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'white',
                 fontWeight: 600,
                 fontSize: '1.25rem',
                 boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
               }}
             >
               {(user?.name || 'U').charAt(0).toUpperCase()}
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '1rem', 
                 marginBottom: '0.75rem',
                 flexWrap: 'wrap'
               }}>
                 <label
                   style={{
                     fontSize: '0.875rem',
                     color: '#6b7280',
                     fontWeight: 500,
                     minWidth: '80px'
                   }}
                 >
                   Họ và tên:
                 </label>
                 <div
                   style={{
                     fontSize: '1.125rem',
                     fontWeight: 600,
                     color: '#111827',
                     flex: 1
                   }}
                 >
                   {user?.name || 'Nhân viên hiện tại'}
                 </div>
               </div>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '1rem', 
                 marginBottom: '0.75rem',
                 flexWrap: 'wrap'
               }}>
                 <label
                   style={{
                     fontSize: '0.875rem',
                     color: '#6b7280',
                     fontWeight: 500,
                     minWidth: '80px'
                   }}
                 >
                   Email:
                 </label>
                 <div
                   style={{
                     fontSize: '0.95rem',
                     color: '#6b7280',
                     flex: 1
                   }}
                 >
                   {user?.email || 'Email không có'}
                 </div>
               </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <label
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      minWidth: '80px'
                    }}
                  >
                    Trạng thái:
                  </label>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <CheckIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                    Đã tiếp nhận
                  </div>
                </div>
             </div>
           </div>
         </div>

         {/* Activity Info Card */}
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
            alignItems: 'flex-start',
            marginBottom: '1.5rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <CalendarIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: 0,
                    color: '#111827'
                  }}>
                    {activity.name}
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#3b82f6',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Thông tin hoạt động
                  </p>
                </div>
              </div>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                margin: '0 0 1rem 0',
                lineHeight: 1.5,
                background: 'rgba(59, 130, 246, 0.05)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                {activity.description}
              </p>
            </div>
          </div>

          {/* Activity Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}>
                <CalendarIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Ngày</div>
                <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                  {new Date(activity.date + 'T00:00:00Z').toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}>
                <ClockIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Thời gian</div>
                <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                  {activity.scheduledTime} - {activity.endTime}
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}>
                <MapPinIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Địa điểm</div>
                <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                  {activity.location}
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
              }}>
                <UserGroupIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>Sức chứa</div>
                <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                  {participationCount}/{activity.capacity} người
                </div>
              </div>
            </div>
          </div>

          {isActivityTimePassed() && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #f59e0b',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              <ClockIcon style={{ width: '1rem', height: '1rem' }} />
              Hoạt động đã qua thời gian - Không thể thêm người cao tuổi
            </div>
          )}
        </div>

        {/* Residents Selection */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>
                Chọn người cao tuổi
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0.25rem 0 0 0'
              }}>
                Tìm và chọn người cao tuổi tham gia hoạt động
              </p>
            </div>
          </div>

          {/* Search and Instructions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Tìm kiếm người cao tuổi
                </label>
              </div>
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
                  placeholder="Nhập tên hoặc số phòng để tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #e5e7eb',
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)'
            }}>
              <UserGroupIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
              <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                Đã chọn: {selectedResidentIds.length} người
              </span>
            </div>
          </div>

          {/* Residents List */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem',
            overflow: 'hidden',
            maxHeight: '600px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            {Object.keys(ageGroups).length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <UserGroupIcon style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0',
                  color: '#374151'
                }}>
                  {residents.length === 0 ? 'Chưa có người cao tuổi nào có trạng thái "admitted"' : 'Tất cả người cao tuổi đã được thêm vào hoạt động này'}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Tổng: {residents.length} người | Đã tham gia: {participationCount} người
                </p>
              </div>
            ) : (
              Object.entries(ageGroups).map(([ageGroup, residentsInGroup]) => (
                <div key={ageGroup} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {/* Age Group Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
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
                        <div style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          borderRadius: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }}>
                          {residentsInGroup.length}
                        </div>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem'
                          }}>
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              Nhóm tuổi
                            </span>
                          </div>
                          <h4 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#111827',
                            margin: 0
                          }}>
                            {ageGroup}
                          </h4>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                          HHiện có {residentsInGroup.length} người cao tuổi
                          </p>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}>
                        <div style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          background: '#3b82f6',
                          borderRadius: '50%'
                        }} />
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#3b82f6',
                          fontWeight: 600
                        }}>
                          Có thể chọn
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Residents in Group */}
                  <div>
                    {residentsInGroup.map((resident: any) => {
                      const residentId = resident._id || resident.id;
                      const isSelected = selectedResidentIds.includes(residentId);
                      
                      return (
                        <div
                          key={residentId}
                          style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: isSelected ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)' : 'transparent',
                            borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent'
                          }}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedResidentIds(prev => prev.filter(id => id !== residentId));
                            } else {
                              if (selectedResidentIds.length + participationCount >= activity.capacity) {
                                setNotificationModal({
                                  open: true,
                                  title: 'Cảnh báo',
                                  message: `Hoạt động chỉ còn ${activity.capacity - participationCount} chỗ trống.`,
                                  type: 'warning'
                                });
                                return;
                              }
                              setSelectedResidentIds(prev => [...prev, residentId]);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.02)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{
                                  width: '1.5rem',
                                  height: '1.5rem',
                                  accentColor: '#3b82f6',
                                  cursor: 'pointer',
                                  borderRadius: '0.375rem'
                                }}
                              />
                            </div>
                            
                            <div style={{
                              width: '3rem',
                              height: '3rem',
                              borderRadius: '50%',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '1rem',
                              boxShadow: isSelected 
                                ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s ease'
                            }}>
                              {(resident.full_name || resident.fullName || '').charAt(0).toUpperCase()}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.25rem'
                              }}>
                                <h4 style={{
                                  fontSize: '1.125rem',
                                  fontWeight: 600,
                                  color: '#111827',
                                  margin: 0
                                }}>
                                  {resident.full_name || resident.fullName}
                                </h4>
                                {isSelected && (
                                  <span style={{
                                    padding: '0.375rem 0.75rem',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                    color: '#3b82f6',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    boxShadow: '0 1px 2px rgba(59, 130, 246, 0.1)'
                                  }}>
                                    <CheckIcon style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                                  
                                  </span>
                                )}
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <HomeIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                                  <span>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Phòng:</span>{' '}
                                    <strong style={{ color: '#111827' }}>{roomNumbers[resident._id || resident.id] || 'Đang tải...'}</strong>
                                  </span>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Tuổi:</span>{' '}
                                    <strong style={{ color: '#3b82f6' }}>
                                      {(() => {
                                        let age;
                                        if (resident.age) {
                                          age = resident.age;
                                        } else if (resident.date_of_birth) {
                                          const birthDate = new Date(resident.date_of_birth);
                                          const today = new Date();
                                          age = today.getFullYear() - birthDate.getFullYear();
                                          const monthDiff = today.getMonth() - birthDate.getMonth();
                                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                            age--;
                                          }
                                        }
                                        if (age !== undefined) {
                                          return `${age} tuổi`;
                                        }
                                        return 'N/A';
                                      })()}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem 0',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link
            href={`/staff/activities/${activity.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.75rem',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              borderRadius: '0.875rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(107, 114, 128, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại
          </Link>
          
           <button
             onClick={handleAddResidents}
             disabled={addingResidents || selectedResidentIds.length === 0 || isActivityTimePassed()}
             style={{
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               padding: '0.875rem 2.25rem',
               background: (addingResidents || selectedResidentIds.length === 0 || isActivityTimePassed()) 
                 ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                 : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
               color: 'white',
               border: 'none',
               borderRadius: '0.875rem',
               fontSize: '0.875rem',
               fontWeight: 600,
               cursor: (addingResidents || selectedResidentIds.length === 0 || isActivityTimePassed()) 
                 ? 'not-allowed' 
                 : 'pointer',
               transition: 'all 0.2s ease',
               boxShadow: (addingResidents || selectedResidentIds.length === 0 || isActivityTimePassed()) 
                 ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                 : '0 6px 20px rgba(16, 185, 129, 0.3)'
             }}
             onMouseOver={(e) => {
               if (!addingResidents && selectedResidentIds.length > 0 && !isActivityTimePassed()) {
                 e.currentTarget.style.transform = 'translateY(-1px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
               }
             }}
             onMouseOut={(e) => {
               if (!addingResidents && selectedResidentIds.length > 0 && !isActivityTimePassed()) {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
               }
             }}
           >
            {addingResidents ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Đang thêm...
              </>
            ) : (
              <>
                <UserPlusIcon style={{ width: '1rem', height: '1rem' }} />
                Thêm {selectedResidentIds.length} người cao tuổi
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Notification Modal */}
      <NotificationModal
        open={notificationModal.open}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        onClose={() => setNotificationModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
