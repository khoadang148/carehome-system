"use client";

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CameraIcon,
  PhotoIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { useResidents } from '@/lib/contexts/residents-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { activitiesAPI, activityParticipationsAPI, staffAssignmentsAPI, bedAssignmentsAPI, residentAPI, photosAPI } from '@/lib/api';
import { Dialog } from '@headlessui/react';
import UploadSuccessModal from '@/components/UploadSuccessModal';

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { residents, loading: residentsLoading, error: residentsError } = useResidents();
  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participations, setParticipations] = useState<any[]>([]);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<{ [key: string]: { status: 'pending' | 'attended' | 'absent', reason?: string } }>({});
  const [saving, setSaving] = useState(false);
  const [addResidentModalOpen, setAddResidentModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [addingResident, setAddingResident] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [assignedResidentIds, setAssignedResidentIds] = useState<string[]>([]);
  const [assignedResidentsDetails, setAssignedResidentsDetails] = useState<any[]>([]);
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Photo upload states
  const [uploadPhotoModalOpen, setUploadPhotoModalOpen] = useState(false);
  const [selectedResidentForPhoto, setSelectedResidentForPhoto] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoActivityType, setPhotoActivityType] = useState('');
  const [photoStaffNotes, setPhotoStaffNotes] = useState('');
  const [residentPhotos, setResidentPhotos] = useState<{[residentId: string]: any[]}>({});
  const [uploadSuccessModal, setUploadSuccessModal] = useState<{
    open: boolean;
    fileName?: string;
    residentName?: string;
    fileCount?: number;
  }>({ open: false });

  const isActivityDatePassed = () => {
    if (!activity?.date) return false;
    const activityDate = new Date(activity.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activityDate < today;
  };

  const isActivityToday = () => {
    if (!activity?.date) return false;
    
    // Sử dụng thời gian hiện tại (không cần trừ 7 giờ vì đã xử lý trong mapActivityFromAPI)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return activity.date === today;
  };

  const isActivityTimeReached = () => {
    if (!activity?.date || !activity?.scheduledTime) return false;
    
    // Sử dụng thời gian hiện tại (không cần trừ 7 giờ vì đã xử lý trong mapActivityFromAPI)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    console.log('🔍 TIME CHECK - Activity date:', activity.date, 'Today:', today);
    console.log('🔍 TIME CHECK - Activity time:', activity.scheduledTime, 'Current time:', now.toLocaleTimeString('vi-VN', { hour12: false }));
    
    // Nếu không phải hôm nay, chưa đến giờ
    if (activity.date !== today) {
      console.log('🔍 TIME CHECK - Not today, cannot evaluate');
      return false;
    }
    
    // Nếu là hôm nay, kiểm tra thời gian
    const [hours, minutes] = activity.scheduledTime.split(':');
    const activityTime = new Date(now);
    activityTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const canEvaluate = now >= activityTime;
    console.log('🔍 TIME CHECK - Can evaluate:', canEvaluate, 'Activity time:', activityTime.toLocaleTimeString('vi-VN', { hour12: false }));
    
    return canEvaluate;
  };

  const canEditOrEvaluate = () => {
    return isActivityToday() && isActivityTimeReached();
  };

  const canAddParticipants = () => {
    return !isActivityDatePassed(); // Cho phép thêm người tham gia cho hoạt động trong tương lai và hiện tại
  };

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotificationModal({
      isOpen: true,
      title,
      message,
      type
    });
  };
  const closeNotification = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }));
  };

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
        const resolvedParams = await params;
        const activityId = resolvedParams.id;
        const apiActivity = await activitiesAPI.getById(activityId);
        if (apiActivity) {
          setActivity(mapActivityFromAPI(apiActivity));
        } else {
          setError('Không tìm thấy hoạt động');
        }
      } catch (error) {
        setError('Không thể tải thông tin hoạt động. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [params]);

  useEffect(() => {
    const fetchStaffAssignments = async () => {
      if (!user?.id) return;

      try {
        const assignmentsRes = await staffAssignmentsAPI.getMyAssignments();
        const assignments = Array.isArray(assignmentsRes) ? assignmentsRes : [];
        setStaffAssignments(assignments);

        const isAssignmentActive = (a: any) => {
          if (!a) return false;
          if (a.status && String(a.status).toLowerCase() === 'expired') return false;
          if (!a.end_date) return true;
          const end = new Date(a.end_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return end >= today;
        };

        const isRoomBased = assignments.some((a: any) => a && (a.room_id || a.residents));
        let ids: string[] = [];

        if (isRoomBased) {
          const active = assignments.filter((a: any) => isAssignmentActive(a));
          for (const a of active) {
            const room = a.room_id;
            const roomId = typeof room === 'object' ? (room?._id || room?.id) : room;
            let residents: any[] = Array.isArray(a.residents) ? a.residents : [];
            if ((!residents || residents.length === 0) && roomId) {
              try {
                const beds = await bedAssignmentsAPI.getAll();
                if (Array.isArray(beds)) {
                  residents = beds
                    .filter((ba: any) => !ba.unassigned_date && ba.bed_id && (ba.bed_id.room_id?._id || ba.bed_id.room_id) === roomId)
                    .map((ba: any) => ba.resident_id)
                    .filter(Boolean);
                }
              } catch {}
            }
            for (const r of residents) {
              if (r?._id) ids.push(String(r._id));
            }
          }
        } else {
          ids = assignments
            .filter((assignment: any) => isAssignmentActive(assignment) && assignment.resident_id)
            .map((assignment: any) =>
              typeof assignment.resident_id === 'object'
                ? String(assignment.resident_id._id)
                : String(assignment.resident_id)
            );
        }

        const uniqueIds = Array.from(new Set(ids));
        setAssignedResidentIds(uniqueIds);

        // Fetch resident details for display in add modal
        const details = await Promise.all(uniqueIds.map(async (rid) => {
          try { return await residentAPI.getById(rid); } catch { return null; }
        }));
        setAssignedResidentsDetails(details.filter(Boolean));
      } catch (error) {
        setStaffAssignments([]);
        setAssignedResidentIds([]);
        setAssignedResidentsDetails([]);
      }
    };

    fetchStaffAssignments();
  }, [user?.id]);

  const cleanupDuplicateParticipations = async (participationsData: any[]) => {
    const seen = new Set();
    const duplicates: any[] = [];
    const uniqueParticipations: any[] = [];

    participationsData.forEach((participation: any) => {
      const participationActivityId = participation.activity_id?._id || participation.activity_id;
      const participationResidentId = participation.resident_id?._id || participation.resident_id;
      const participationDate = participation.date ? new Date(participation.date).toISOString().split('T')[0] : null;

      const key = `${participationActivityId}-${participationResidentId}-${participationDate}`;

      if (seen.has(key)) {
        duplicates.push(participation);
      } else {
        seen.add(key);
        uniqueParticipations.push(participation);
      }
    });

    for (const duplicate of duplicates) {
      try {
        await activityParticipationsAPI.delete(duplicate._id);
      } catch (error) {
      }
    }

    return uniqueParticipations;
  };

  useEffect(() => {
    const fetchParticipations = async () => {
      if (!activity?.id) return;

      try {
        const participationsData = await activityParticipationsAPI.getByActivityId(
          activity.id,
          activity.date
        );

        const cleanedParticipations = await cleanupDuplicateParticipations(participationsData);
        setParticipations(cleanedParticipations);

        const initialEvaluations: { [key: string]: { status: 'pending' | 'attended' | 'absent', reason?: string } } = {};

        for (const participation of participationsData) {
          const residentId = participation.resident_id?._id || participation.resident_id;

          let status: 'pending' | 'attended' | 'absent' = 'pending';
          if (participation.attendance_status === 'attended') {
            status = 'attended';
          } else if (participation.attendance_status === 'absent') {
            status = 'absent';
          }

          let reason = participation.performance_notes || '';

          if (status === 'absent' && reason.includes('Tham gia tích cực')) {
            reason = 'Lý do sức khỏe';

            try {
              await activityParticipationsAPI.update(participation._id, {
                performance_notes: 'Lý do sức khỏe'
              });
            } catch (error) {
            }
          }

          if (residentId) {
            initialEvaluations[residentId] = {
              status,
              reason
            };
          }
        }
        setEvaluations(initialEvaluations);
        setIsRefreshing(false);
      } catch (error) {
        setIsRefreshing(false);
      }
    };

    fetchParticipations();
  }, [activity?.id, refreshTrigger]);

  useEffect(() => {
    if (!activity?.id) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      setRefreshTrigger(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [activity?.id]);

  useEffect(() => {
    if (!evaluationMode && activity?.id) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [evaluationMode, activity?.id]);

  useEffect(() => {
    if (!addResidentModalOpen && activity?.id) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [addResidentModalOpen, activity?.id]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [photoPreviewUrls]);

  // Load photos for attended residents when component mounts
  useEffect(() => {
    const loadAttendedResidentPhotos = async () => {
      if (assignedResidentIds.length > 0) {
        for (const residentId of assignedResidentIds) {
          // Only load photos for residents who have attended
          const evaluation = evaluations[residentId];
          if (evaluation && evaluation.status === 'attended') {
            await fetchResidentPhotos(residentId);
          }
        }
      }
    };
    
    loadAttendedResidentPhotos();
  }, [assignedResidentIds, evaluations]);



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
        // Trừ 7 giờ từ UTC time để hiển thị đúng giờ Việt Nam
        const vietnamTime = new Date(utcTime.getTime() - (7 * 60 * 60 * 1000));
        return vietnamTime.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      };

      return {
        id: apiActivity._id,
        name: apiActivity.activity_name,
        description: apiActivity.description,
        category: getCategoryLabel(apiActivity.activity_type),
        scheduledTime: convertToVietnamTime(scheduleTime),
        startTime: convertToVietnamTime(scheduleTime),
        endTime: convertToVietnamTime(endTime),
        duration: apiActivity.duration,
        date: scheduleTime.toLocaleDateString('en-CA'),
        location: apiActivity.location,
        capacity: apiActivity.capacity,
        participants: 0,
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
    router.push(`/staff/activities/${activity.id}/edit`);
  };

  const handleEvaluationChange = (residentId: string, status: 'pending' | 'attended' | 'absent') => {
    setEvaluations(prev => {
      const currentEvaluation = prev[residentId] || {};
      let newReason = currentEvaluation.reason || '';

      if (status === 'attended') {
        newReason = '';
        // Load photos when status changes to attended
        fetchResidentPhotos(residentId);
      } else if (status === 'absent') {
        if (!newReason || newReason.includes('Tham gia tích cực')) {
          newReason = 'Lý do sức khỏe';
        }
      }

      return {
        ...prev,
        [residentId]: {
          ...currentEvaluation,
          status,
          reason: newReason
        }
      };
    });
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

  const handleSelectAll = (status: 'pending' | 'attended' | 'absent') => {
    setEvaluations(prev => {
      const newEvaluations: { [key: string]: { status: 'pending' | 'attended' | 'absent', reason?: string } } = {};
      Object.keys(prev).forEach(residentId => {
        const currentEvaluation = prev[residentId] || {};
        let newReason = currentEvaluation.reason || '';

        if (status === 'attended') {
          newReason = '';
        } else if (status === 'absent') {
          if (!newReason || newReason.includes('Tham gia tích cực')) {
            newReason = 'Lý do sức khỏe';
          }
        }

        newEvaluations[residentId] = {
          status,
          reason: newReason
        };
      });
      return newEvaluations;
    });
  };

  const handleSaveEvaluations = async () => {
    if (!activity?.id) return;

    const invalidEvaluations = Object.entries(evaluations).filter(([_, evaluation]) => {
      return evaluation.status === 'absent' && (!evaluation.reason || evaluation.reason.trim() === '');
    });

    if (invalidEvaluations.length > 0) {
      showNotification(
        'Thiếu thông tin',
        `Vui lòng nhập lý do vắng mặt cho ${invalidEvaluations.length} người cao tuổi đã chọn "Không tham gia".`,
        'warning'
      );
      return;
    }

    setSaving(true);
    try {
      for (const [residentId, evaluation] of Object.entries(evaluations)) {
        const existingParticipation = participations.find(p => {
          const pResidentId = p.resident_id?._id || p.resident_id;
          const pDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
          return (
            pResidentId === residentId &&
            pDate === activity.date
          );
        });

        if (existingParticipation) {
          const updateData: any = {
            performance_notes: evaluation.status === 'attended' ?
              'Tham gia tích cực, tinh thần tốt' :
              (evaluation.reason || 'Lý do sức khỏe'),
            attendance_status: evaluation.status
          };

          const currentStaffId = existingParticipation.staff_id?._id || existingParticipation.staff_id;
          const newStaffId = user?.id || "664f1b2c2f8b2c0012a4e750";
          if (currentStaffId !== newStaffId) {
            updateData.staff_id = newStaffId;
          }

          await activityParticipationsAPI.update(existingParticipation._id, updateData);
        } else {
          const resident = residents.find((r: any) => (r._id || r.id) === residentId);
          if (resident) {
            const currentStaffId = participations.length > 0 ?
              (participations[0].staff_id?._id || participations[0].staff_id) :
              user?.id || "664f1b2c2f8b2c0012a4e750";

            await activityParticipationsAPI.create({
              staff_id: currentStaffId,
              activity_id: activity.id,
              resident_id: (resident as any)._id || (resident as any).id,
              date: activity.date + "T00:00:00Z",
              performance_notes: evaluation.status === 'attended' ?
                'Tham gia tích cực, tinh thần tốt' :
                (evaluation.reason || 'Lý do sức khỏe'),
              attendance_status: evaluation.status
            });
          }
        }
      }

      const participationsData = await activityParticipationsAPI.getByActivityId(
        activity.id,
        activity.date
      );

      const cleanedParticipations = await cleanupDuplicateParticipations(participationsData);
      setParticipations(cleanedParticipations);

      const updatedEvaluations: { [key: string]: { status: 'pending' | 'attended' | 'absent', reason?: string } } = {};

      for (const participation of cleanedParticipations) {
        const residentId = participation.resident_id?._id || participation.resident_id;

        let status: 'pending' | 'attended' | 'absent' = 'pending';
        if (participation.attendance_status === 'attended') {
          status = 'attended';
        } else if (participation.attendance_status === 'absent') {
          status = 'absent';
        }

        let reason = participation.performance_notes || '';

        if (status === 'absent' && reason.includes('Tham gia tích cực')) {
          reason = 'Lý do sức khỏe';

          try {
            await activityParticipationsAPI.update(participation._id, {
              performance_notes: 'Lý do sức khỏe'
            });
          } catch (error) {
          }
        }

        if (residentId) {
          updatedEvaluations[residentId] = {
            status,
            reason
          };
        }
      }
      setEvaluations(updatedEvaluations);

      setRefreshTrigger(prev => prev + 1);

      setEvaluationMode(false);

      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1000);

      showNotification(
        'Lưu đánh giá thành công',
        'Đánh giá tham gia hoạt động đã được lưu thành công!',
        'success'
      );
    } catch (error: any) {
      let errorMessage = 'Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.';

      if (error.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }

      showNotification('Lỗi lưu đánh giá', errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

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
  const allResidentsForDay: ActivityResident[] = participations
    .filter((p: any) => {
      const participationActivityId = p.activity_id?._id || p.activity_id;
      const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
      return participationActivityId === activity?.id && participationDate === activity.date;
    })
    .map((p: any) => {
      const residentId = p.resident_id?._id || p.resident_id;
      const residentInfo = residents.find((r: any) => (r._id || r.id) === residentId);
      return {
        id: residentId,
        name: p.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A',
        room: (residentInfo as any)?.room || '',
        age: (residentInfo as any)?.age || '',
        participationId: p._id,
        participated: p.attendance_status === 'attended',
        reason: p.performance_notes || '',
        evaluationDate: p.date
      };
    });
  const activityResidents: ActivityResident[] = Object.values(
    allResidentsForDay.reduce((acc, curr) => {
      const key = curr.id;
      if (!acc[key] || (!curr.participated)) {
        acc[key] = curr;
      }
      return acc;
    }, {} as { [residentId: string]: ActivityResident })
  );
  const residentsFromEvaluations: ActivityResident[] = Object.entries(evaluations)
    .filter(([residentId, evaluation]) => {
      const participation = participations.find((p: any) => {
        const pResidentId = p.resident_id?._id || p.resident_id;
        const participationActivityId = p.activity_id?._id || p.activity_id;
        const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
        const activityDate = activity?.date ? new Date(activity.date).toISOString().split('T')[0] : null;

        return pResidentId === residentId &&
          participationActivityId === activity?.id &&
          participationDate === activityDate;
      });

      const isAssigned = assignedResidentIds.includes(residentId);

      return participation !== undefined && isAssigned;
    })
    .map(([residentId, evaluation]) => {
      const participation = participations.find((p: any) => {
        const pResidentId = p.resident_id?._id || p.resident_id;
        return pResidentId === residentId;
      });

      const residentInfo = residents.find((r: any) => (r._id || r.id) === residentId);

      return {
        id: residentId,
        name: participation?.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A',
        room: (residentInfo as any)?.room || '',
        age: (residentInfo as any)?.age || '',
        participationId: participation?._id || '',
        participated: evaluation.status === 'attended',
        reason: evaluation.reason || '',
        evaluationDate: participation?.date || activity?.date || ''
      };
    });



  const joinedResidentIds = Array.from(new Set(
    participations
      .filter((p: any) => {
        const participationActivityId = p.activity_id?._id || p.activity_id;
        const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
        const isMatch = participationActivityId === activity?.id && participationDate === activity.date;
        return isMatch;
      })
      .map((p: any) => p.resident_id?._id || p.resident_id)
  ));

  const participationCount = activityResidents.length;

  const residentsNotJoined = assignedResidentsDetails
    .map((resident: any) => {
      const age = resident?.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '';
      return {
        id: resident?._id,
        name: resident?.full_name || '',
        age: age || '',
        careLevel: resident?.care_level || '',
        emergencyContact: resident?.emergency_contact?.name || '',
        contactPhone: resident?.emergency_contact?.phone || '',
        avatar: Array.isArray(resident?.avatar) ? resident.avatar[0] : resident?.avatar || null,
        gender: (resident?.gender || '').toLowerCase(),
      };
    })
    .filter((resident: any) => resident?.id && !joinedResidentIds.includes(resident.id as string));

  const handleAddResident = async () => {
    if (!selectedResidentId || !activity?.id || !activity.date) return;

    // Kiểm tra xem hoạt động đã qua ngày chưa
    if (isActivityDatePassed()) {
      showNotification(
        'Không thể thay đổi',
        'Hoạt động đã qua ngày, không thể thay đổi danh sách tham gia.',
        'warning'
      );
      return;
    }

    const currentParticipantCount = participations.filter((p: any) => {
      const participationActivityId = p.activity_id?._id || p.activity_id;
      const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
      return participationActivityId === activity.id && participationDate === activity.date;
    }).length;

    if (currentParticipantCount >= activity.capacity) {
      toast.error(`Hoạt động này đã đạt sức chứa tối đa (${activity.capacity} người). Không thể thêm thêm người cao tuổi.`);
      return;
    }

    const isAlreadyParticipating = participations.some((p: any) => {
      const participationActivityId = p.activity_id?._id || p.activity_id;
      const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
      const participationResidentId = p.resident_id?._id || p.resident_id;
      return participationActivityId === activity.id &&
        participationDate === activity.date &&
        participationResidentId === selectedResidentId;
    });

    if (isAlreadyParticipating) {
      showNotification(
        'Người cao tuổi đã tham gia',
        'Người cao tuổi này đã được thêm vào hoạt động này rồi.',
        'warning'
      );
      return;
    }

    setAddingResident(true);
    try {
      const currentStaffId = participations.length > 0 ?
        (participations[0].staff_id?._id || participations[0].staff_id) :
        user?.id || '';

      await activityParticipationsAPI.create({
        staff_id: currentStaffId,
        activity_id: activity.id,
        resident_id: selectedResidentId,
        date: activity.date + 'T00:00:00Z',
        attendance_status: 'pending',
        performance_notes: ''
      });
      setAddResidentModalOpen(false);
      setSelectedResidentId(null);

      showNotification(
        'Thêm người cao tuổi thành công',
        'Người cao tuổi đã được thêm vào hoạt động thành công!',
        'success'
      );

      setRefreshTrigger(prev => prev + 1);

      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      let errorMessage = 'Không thể thêm người cao tuổi vào hoạt động. Vui lòng thử lại.';

      if (err.response?.data?.message) {
        errorMessage = `Lỗi: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Lỗi: ${err.message}`;
      }

      showNotification('Lỗi thêm người cao tuổi', errorMessage, 'error');
    } finally {
      setAddingResident(false);
    }
  };

  // Photo upload functions
  const handleOpenPhotoUpload = (resident: any) => {
    setSelectedResidentForPhoto(resident);
    setUploadPhotoModalOpen(true);
    setSelectedFiles([]);
    setPhotoPreviewUrls([]);
    setPhotoCaption('');
    setPhotoActivityType(activity?.category || '');
    setPhotoStaffNotes('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        showNotification('Lỗi', `File ${file.name} không phải là ảnh hoặc video`, 'error');
        continue;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        showNotification('Lỗi', `File ${file.name} quá lớn. Kích thước tối đa là 100MB`, 'error');
        continue;
      }

      validFiles.push(file);
      previewUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPhotoPreviewUrls(prev => [...prev, ...previewUrls]);
    }

    // Reset input value to allow selecting the same files again
    event.target.value = '';
  };

  const handleUploadPhoto = async () => {
    if (selectedFiles.length === 0 || !selectedResidentForPhoto || !user?.id) {
      showNotification('Lỗi', 'Vui lòng chọn ít nhất một file và đảm bảo đã đăng nhập', 'error');
      return;
    }

    setUploadingPhoto(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('resident_id', selectedResidentForPhoto.id);
          formData.append('uploaded_by', user.id);
          formData.append('caption', photoCaption);
          formData.append('activity_type', photoActivityType);
          formData.append('staff_notes', photoStaffNotes);
          formData.append('related_activity_id', activity?.id || '');
          formData.append('taken_date', new Date().toISOString());

          await photosAPI.upload(formData);
          successCount++;
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        // Show success modal
        setUploadSuccessModal({
          open: true,
          fileName: selectedFiles.length === 1 ? selectedFiles[0].name : undefined,
          residentName: selectedResidentForPhoto.name,
          fileCount: successCount
        });

        // Refresh photos for this resident
        await fetchResidentPhotos(selectedResidentForPhoto.id);
      }

      if (errorCount > 0 && successCount === 0) {
        showNotification('Lỗi đăng', 'Không thể đăng bất kỳ file nào. Vui lòng thử lại.', 'error');
      }

      // Close modal and reset form
      setUploadPhotoModalOpen(false);
      setSelectedResidentForPhoto(null);
      setSelectedFiles([]);
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setPhotoPreviewUrls([]);
      setPhotoCaption('');
      setPhotoActivityType('');
      setPhotoStaffNotes('');
    } catch (error: any) {
      let errorMessage = 'Không thể đăng ảnh/video. Vui lòng thử lại.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification('Lỗi đăng', errorMessage, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Cleanup the removed preview URL
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPhotoPreviewUrls(newPreviewUrls);
  };

  const fetchResidentPhotos = async (residentId: string) => {
    try {
      const photos = await photosAPI.getByResidentId(residentId);
      setResidentPhotos(prev => ({
        ...prev,
        [residentId]: photos
      }));
    } catch (error) {
      console.error('Error fetching photos:', error);
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
            {loading ? 'Đang tải thông tin hoạt động...' : 'Đang tải danh sách người cao tuổi...'}
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
                href="/staff/activities"
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
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
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
                  <span>{new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
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
                    {participationCount}/{activity.capacity} người
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>

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
                      {new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}
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
                      Đã đăng ký: {participationCount} người
                      {participationCount >= activity.capacity ? (
                        <span style={{ color: '#ef4444', marginLeft: 8, fontWeight: 600 }}>
                          Đã đạt sức chứa tối đa!
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', marginLeft: 8 }}>
                          Còn {activity.capacity - participationCount} chỗ
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    {canAddParticipants() && !isActivityDatePassed() ? (
                        <Link
                          href={`/staff/activities/${activity.id}/add-residents`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontWeight: 600
                          }}
                        >
                          + Thêm người tham gia
                        </Link>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                        {isActivityDatePassed() ? 'Hoạt động đã qua - Không thể thay đổi danh sách' : 'Hoạt động đã qua - Không thể thêm người tham gia'}
                      </div>
                    )}
                  </div>

                </div>
              </div>


            </div>





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
                      {isRefreshing && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#f59e0b',
                          marginLeft: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <div style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            border: '2px solid transparent',
                            borderTopColor: '#f59e0b',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Đang cập nhật...
                        </span>
                      )}
                    </h3>
                    {activity.date && (
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        margin: '0.25rem 0 0 0'
                      }}>
                        Ngày {new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  {Object.keys(evaluations).length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <span>Đã tham gia: <strong style={{ color: '#10b981' }}>{Object.values(evaluations).filter(e => e.status === 'attended').length}</strong></span>
                      <span>Không tham gia: <strong style={{ color: '#dc2626' }}>{Object.values(evaluations).filter(e => e.status === 'absent').length}</strong></span>
                      <span>Chưa tham gia: <strong style={{ color: '#6b7280' }}>{Object.values(evaluations).filter(e => e.status === 'pending').length}</strong></span>
                      <span>Tổng: <strong>{Object.keys(evaluations).length}</strong></span>
                    </div>
                  )}
                </div>
                {!evaluationMode && canEditOrEvaluate() && (
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
                {!evaluationMode && !canEditOrEvaluate() && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                    {isActivityDatePassed() ? 'Hoạt động đã qua - Không thể chỉnh sửa' : 
                     isActivityToday() ? 'Chưa đến giờ hoạt động - Không thể đánh giá' : 
                     'Chưa tới giờ bắt đầu hoạt động - Chưa thể đánh giá'}
                  </div>
                )}
              </div>

              {evaluationMode ? (
                <div>
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
                        placeholder="Tìm kiếm người cao tuổi theo tên hoặc phòng..."
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
                    {canEditOrEvaluate() && (
                      <>
                        <button
                          onClick={() => handleSelectAll('attended')}
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
                          Chọn tất cả Đã tham gia
                        </button>
                        <button
                          onClick={() => handleSelectAll('absent')}
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
                          Chọn tất cả Không tham gia
                        </button>
                        <button
                          onClick={() => handleSelectAll('pending')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                          Chọn tất cả Chưa tham gia
                        </button>
                      </>
                    )}
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto' }} key={`participants-${refreshTrigger}`}>
                    {Object.entries(evaluations)
                      .filter(([residentId, evaluation]) => {
                        const participation = participations.find((p: any) => {
                          const pResidentId = p.resident_id?._id || p.resident_id;
                          return pResidentId === residentId;
                        });

                        const residentInfo = residents.find((r: any) => (r._id || r.id) === residentId);
                        const residentName = participation?.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A';
                        const residentRoom = (residentInfo as any)?.room || '';

                        if (searchTerm && !residentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          !residentRoom.toLowerCase().includes(searchTerm.toLowerCase())) {
                          return false;
                        }
                        return true;
                      })
                      .map(([residentId, evaluation]) => {
                        const participation = participations.find((p: any) => {
                          const pResidentId = p.resident_id?._id || p.resident_id;
                          return pResidentId === residentId;
                        });

                        const residentInfo = residents.find((r: any) => (r._id || r.id) === residentId);
                        const residentName = participation?.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A';
                        const residentRoom = (residentInfo as any)?.room || '';
                        return (
                          <div
                            key={`${residentId}-${refreshTrigger}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '1rem',
                              borderBottom: '1px solid #e5e7eb',
                              background: evaluation.status === 'attended' ? '#f0fdf4' : evaluation.status === 'absent' ? '#fef2f2' : '#f9fafb'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                                {residentName}
                              </div>

                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              {canEditOrEvaluate() ? (
                                <>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={`participation-${residentId}`}
                                      checked={evaluation.status === 'attended'}
                                      onChange={() => handleEvaluationChange(residentId, 'attended')}
                                      style={{ cursor: 'pointer' }}
                                      key={`attended-${residentId}-${refreshTrigger}`}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#10b981' }}>Đã tham gia</span>
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={`participation-${residentId}`}
                                      checked={evaluation.status === 'absent'}
                                      onChange={() => handleEvaluationChange(residentId, 'absent')}
                                      style={{ cursor: 'pointer' }}
                                      key={`absent-${residentId}-${refreshTrigger}`}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>Không tham gia</span>
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={`participation-${residentId}`}
                                      checked={evaluation.status === 'pending'}
                                      onChange={() => handleEvaluationChange(residentId, 'pending')}
                                      style={{ cursor: 'pointer' }}
                                      key={`pending-${residentId}-${refreshTrigger}`}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Chưa tham gia</span>
                                  </label>
                                </>
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  background: '#f3f4f6',
                                  color: '#6b7280',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 600
                                }}>
                                  <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                                  {!isActivityTimeReached() && isActivityToday() ? 'Chưa đến giờ đánh giá' :
                                   evaluation.status === 'attended' ? 'Đã tham gia' :
                                    evaluation.status === 'absent' ? 'Không tham gia' : 'Chưa tham gia'}
                                </div>
                              )}
                              
                              {/* Upload Photo Button - Only show for attended residents */}
                              {evaluation.status === 'attended' && (
                                <button
                                  onClick={() => handleOpenPhotoUpload({
                                    id: residentId,
                                    name: residentName
                                  })}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title="Đăng ảnh/video cho người cao tuổi này"
                                >
                                  <CameraIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                                  Ảnh/Video
                                  {residentPhotos[residentId] && residentPhotos[residentId].length > 0 && (
                                    <span style={{
                                      background: 'rgba(255, 255, 255, 0.2)',
                                      borderRadius: '50%',
                                      padding: '0.125rem 0.375rem',
                                      fontSize: '0.625rem',
                                      fontWeight: 700
                                    }}>
                                      {residentPhotos[residentId].length}
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                            {evaluation.status === 'absent' && canEditOrEvaluate() && isActivityTimeReached() && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <input
                                  type="text"
                                  placeholder="Lý do vắng mặt..."
                                  value={evaluation.reason || ''}
                                  onChange={(e) => handleReasonChange(residentId, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.875rem',
                                    background: '#fef2f2'
                                  }}
                                  key={`reason-${residentId}-${refreshTrigger}`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {Object.keys(evaluations).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        Chưa có đánh giá tham gia nào cho hoạt động này.
                      </div>
                    )}
                    {Object.keys(evaluations).length > 0 && searchTerm && (() => {
                      const filteredCount = Object.entries(evaluations).filter(([residentId, evaluation]) => {
                        const participation = participations.find((p: any) => {
                          const pResidentId = p.resident_id?._id || p.resident_id;
                          return pResidentId === residentId;
                        });
                        const residentInfo = residents.find((r: any) => (r._id || r.id) === residentId);
                        const residentName = participation?.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A';
                        const residentRoom = (residentInfo as any)?.room || '';
                        return residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          residentRoom.toLowerCase().includes(searchTerm.toLowerCase());
                      }).length;

                      if (filteredCount === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            Không tìm thấy người cao tuổi nào phù hợp với từ khóa tìm kiếm.
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

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
                    {canEditOrEvaluate() && isActivityTimeReached() && (
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
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Tên người cao tuổi</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Tham gia</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Lý do (nếu vắng)</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Ngày đánh giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(evaluations).map(([residentId, evaluation]) => {
                        const participation = participations.find((p: any) => {
                          const pResidentId = p.resident_id?._id || p.resident_id;
                          return pResidentId === residentId;
                        });

                        const residentInfo = residents.find((r: any) => r.id === residentId);
                        const status = evaluation.status;

                        const performanceNotes = evaluation.reason || '';
                        const isValidAbsenceReason = status === 'absent' && performanceNotes &&
                          !performanceNotes.includes('Tham gia tích cực') &&
                          !performanceNotes.includes('tinh thần tốt');

                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'attended': return '#10b981';
                            case 'absent': return '#dc2626';
                            case 'pending': return '#6b7280';
                            default: return '#6b7280';
                          }
                        };

                        const getStatusText = (status: string) => {
                          switch (status) {
                            case 'attended': return 'Đã tham gia';
                            case 'absent': return 'Không tham gia';
                            case 'pending': return 'Chưa tham gia';
                            default: return 'Chưa tham gia';
                          }
                        };

                        const getBackgroundColor = (status: string) => {
                          switch (status) {
                            case 'attended': return '#f0fdf4';
                            case 'absent': return '#fef2f2';
                            case 'pending': return '#f9fafb';
                            default: return '#f9fafb';
                          }
                        };

                        return (
                          <tr key={residentId} style={{ background: getBackgroundColor(status) }}>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>
                              {participation?.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A'}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: getStatusColor(status), fontWeight: 600 }}>
                              {getStatusText(status)}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151', textAlign: 'center' }}>
                              {status === 'attended' ? '-' : status === 'absent' ? (
                                isValidAbsenceReason ? performanceNotes :
                                  <span style={{ color: '#f59e0b' }}>Chưa nhập lý do hoặc lý do không hợp lệ</span>
                              ) : status === 'pending' ? '-' : '-'}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div>
                                  {participation?.date ? new Date(participation.date).toLocaleDateString('vi-VN') : 'N/A'}
                                </div>
                                {status === 'attended' && (
                                  <button
                                    onClick={() => handleOpenPhotoUpload({
                                      id: residentId,
                                      name: participation?.resident_id?.full_name || (residentInfo as any)?.full_name || (residentInfo as any)?.fullName || 'N/A'
                                    })}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.5rem',
                                      background: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title="Đăng ảnh/video cho người cao tuổi này"
                                  >
                                    <CameraIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                                    Ảnh/Video
                                    {residentPhotos[residentId] && residentPhotos[residentId].length > 0 && (
                                      <span style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '50%',
                                        padding: '0.125rem 0.25rem',
                                        fontSize: '0.625rem',
                                        fontWeight: 700
                                      }}>
                                        {residentPhotos[residentId].length}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {Object.keys(evaluations).length === 0 && (
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

      {user?.role === 'admin' && (
      <Dialog open={addResidentModalOpen} onClose={() => setAddResidentModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
          <div className="fixed inset-0 bg-black opacity-30" />
          <Dialog.Panel className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-15">
            <Dialog.Title className="text-lg font-bold mb-4">Chọn người cao tuổi để thêm vào hoạt động</Dialog.Title>
            {isActivityDatePassed() && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                ⚠️ Hoạt động đã qua ngày, không thể thay đổi danh sách tham gia.
              </div>
            )}
            <select
              value={selectedResidentId || ''}
              onChange={e => setSelectedResidentId(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              disabled={isActivityDatePassed()}
            >
              <option value="">-- Chọn người cao tuổi --</option>
              {residentsNotJoined.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name} ({r.age} tuổi, {r.gender === 'male' ? 'Nam' : r.gender === 'female' ? 'Nữ' : 'Khác'})</option>
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
                disabled={addingResident || !selectedResidentId || isActivityDatePassed()}
              >
                {addingResident ? 'Đang thêm...' : isActivityDatePassed() ? 'Hoạt động đã qua' : 'Thêm'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      )}

      <Dialog open={notificationModal.isOpen} onClose={closeNotification} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
          <div className="fixed inset-0 bg-black opacity-30" />
          <Dialog.Panel className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-15">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notificationModal.type === 'success' ? 'bg-green-100' :
                  notificationModal.type === 'error' ? 'bg-red-100' :
                    notificationModal.type === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                }`}>
                {notificationModal.type === 'success' && (
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                )}
                {notificationModal.type === 'error' && (
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                )}
                {notificationModal.type === 'warning' && (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                )}
                {notificationModal.type === 'info' && (
                  <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                )}
              </div>

              <div className="flex-1">
                <Dialog.Title className={`text-lg font-semibold mb-2 ${notificationModal.type === 'success' ? 'text-green-800' :
                    notificationModal.type === 'error' ? 'text-red-800' :
                      notificationModal.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                  }`}>
                  {notificationModal.title}
                </Dialog.Title>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {notificationModal.message}
                </p>
              </div>

              <button
                onClick={closeNotification}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeNotification}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${notificationModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    notificationModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                      notificationModal.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                        'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Đóng
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Upload Photo Modal */}
      <Dialog open={uploadPhotoModalOpen} onClose={() => setUploadPhotoModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto z-15 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-white">
                      Đăng ảnh/video
                    </Dialog.Title>
                    <p className="text-blue-100 text-sm">
                      Cho {selectedResidentForPhoto?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadPhotoModalOpen(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Chọn file ảnh hoặc video
                  </label>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('file-input')?.click()}>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PhotoIcon className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">Kéo thả file vào đây hoặc click để chọn</p>
                    <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG, GIF, MP4, MOV (Tối đa 100MB mỗi file)</p>
                    <p className="text-xs text-gray-400 mt-1">Có thể chọn nhiều file cùng lúc</p>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          Đã chọn {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                        </p>
                        <button
                          onClick={() => {
                            photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
                            setSelectedFiles([]);
                            setPhotoPreviewUrls([]);
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Xóa tất cả
                        </button>
                      </div>

                      {/* Files Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative bg-gray-50 rounded-lg p-3">
                            {/* File Info */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                {file.type.startsWith('image/') ? (
                                  <PhotoIcon className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                              >
                                <XMarkIcon className="w-3 h-3 text-red-600" />
                              </button>
                            </div>

                            {/* Preview */}
                            {photoPreviewUrls[index] && (
                              <div className="relative">
                                <div className="bg-gray-100 rounded-lg overflow-hidden">
                                  {file.type.startsWith('image/') ? (
                                    <img
                                      src={photoPreviewUrls[index]}
                                      alt="Preview"
                                      className="w-full h-24 object-cover"
                                    />
                                  ) : file.type.startsWith('video/') ? (
                                    <video
                                      src={photoPreviewUrls[index]}
                                      className="w-full h-24 object-cover"
                                      muted
                                    />
                                  ) : null}
                                </div>
                                <div className="absolute top-1 right-1 bg-black/50 text-white px-1 py-0.5 rounded text-xs font-medium">
                                  {file.type.startsWith('image/') ? 'Ảnh' : 'Video'}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <input
                    id="file-input"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Caption */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Mô tả
                    </label>
                    <input
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Nhập mô tả về ảnh/video..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Activity Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Loại hoạt động
                    </label>
                    <input
                      type="text"
                      value={photoActivityType}
                      onChange={(e) => setPhotoActivityType(e.target.value)}
                      placeholder="Loại hoạt động..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Staff Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Ghi chú của nhân viên
                  </label>
                  <textarea
                    value={photoStaffNotes}
                    onChange={(e) => setPhotoStaffNotes(e.target.value)}
                    placeholder="Nhập ghi chú chi tiết..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setUploadPhotoModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  disabled={uploadingPhoto}
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadPhoto}
                  disabled={selectedFiles.length === 0 || uploadingPhoto}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {uploadingPhoto && (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {uploadingPhoto ? 'Đang đăng...' : `Đăng`}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Upload Success Modal */}
      <UploadSuccessModal
        open={uploadSuccessModal.open}
        onClose={() => setUploadSuccessModal({ open: false })}
        fileName={uploadSuccessModal.fileName}
        residentName={uploadSuccessModal.residentName}
        fileCount={uploadSuccessModal.fileCount}
      />

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
