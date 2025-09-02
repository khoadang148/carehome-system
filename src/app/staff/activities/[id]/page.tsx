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
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useResidents } from '@/lib/contexts/residents-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { activitiesAPI, activityParticipationsAPI, staffAssignmentsAPI } from '@/lib/api';
import { Dialog } from '@headlessui/react';

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

  const isActivityDatePassed = () => {
    if (!activity?.date) return false;
    const activityDate = new Date(activity.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activityDate < today;
  };

  const isActivityToday = () => {
    if (!activity?.date) return false;
    const activityDate = new Date(activity.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  };

  const isActivityTimeReached = () => {
    if (!activity?.date || !activity?.scheduledTime) return false;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Nếu không phải hôm nay, chưa đến giờ
    if (activity.date !== today) {
      return false;
    }
    
    // Nếu là hôm nay, kiểm tra thời gian
    const [hours, minutes] = activity.scheduledTime.split(':');
    const activityTime = new Date();
    activityTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return now >= activityTime;
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
        const assignments = await staffAssignmentsAPI.getMyAssignments();

        setStaffAssignments(Array.isArray(assignments) ? assignments : []);

        const residentIds = Array.isArray(assignments)
          ? assignments
            .filter((assignment: any) => assignment.status === 'active' && assignment.resident_id)
            .map((assignment: any) =>
              typeof assignment.resident_id === 'object'
                ? assignment.resident_id._id
                : assignment.resident_id
            )
          : [];

        setAssignedResidentIds(residentIds);
      } catch (error) {
        setStaffAssignments([]);
        setAssignedResidentIds([]);
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
        const vietnamTime = new Date(utcTime.getTime() + (7 * 60 * 60 * 1000));
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
          const resident = residents.find(r => r.id === residentId);
          if (resident) {
            const currentStaffId = participations.length > 0 ?
              (participations[0].staff_id?._id || participations[0].staff_id) :
              user?.id || "664f1b2c2f8b2c0012a4e750";

            await activityParticipationsAPI.create({
              staff_id: currentStaffId,
              activity_id: activity.id,
              resident_id: resident.id,
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

      const residentInfo = residents.find((r: any) => r.id === residentId);

      return {
        id: residentId,
        name: participation?.resident_id?.full_name || residentInfo?.name || 'N/A',
        room: residentInfo?.room || '',
        age: residentInfo?.age || '',
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

  const residentsNotJoined = staffAssignments
    .filter((assignment: any) => assignment.status === 'active')
    .map((assignment: any) => {
      const resident = assignment.resident_id;
      const age = resident.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '';

      return {
        id: resident._id,
        name: resident.full_name || '',
        age: age || '',
        careLevel: resident.care_level || '',
        emergencyContact: resident.emergency_contact?.name || '',
        contactPhone: resident.emergency_contact?.phone || '',
        avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
        gender: (resident.gender || '').toLowerCase(),
        assignmentStatus: assignment.status || 'unknown',
        assignmentId: assignment._id,
        endDate: assignment.end_date,
        assignedDate: assignment.assigned_date,
      };
    })
    .filter((resident: any) => !joinedResidentIds.includes(resident.id));

  const handleAddResident = async () => {
    if (!selectedResidentId || !activity?.id || !activity.date) return;

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
                    {canAddParticipants() ? (
                      <button
                        onClick={() => {
                          if (participationCount >= activity.capacity) {
                            showNotification(
                              'Đã đạt sức chứa tối đa',
                              `Hoạt động này đã đạt sức chứa tối đa (${activity.capacity} người). Không thể thêm thêm người cao tuổi.`,
                              'warning'
                            );
                            return;
                          }
                          setAddResidentModalOpen(true);
                        }}
                        disabled={participationCount >= activity.capacity}
                        style={{
                          background: participationCount >= activity.capacity ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '0.5rem 1rem',
                          fontWeight: 600,
                          cursor: participationCount >= activity.capacity ? 'not-allowed' : 'pointer',
                          opacity: participationCount >= activity.capacity ? 0.6 : 1
                        }}
                      >
                        {participationCount >= activity.capacity ? 'Đã đạt sức chứa tối đa' : '+ Thêm người tham gia'}
                      </button>
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
                        Hoạt động đã qua - Không thể thêm người tham gia
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
                        - Ngày {new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}
                      </span>
                    )}
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
                     'Hoạt động trong tương lai - Không thể chỉnh sửa'}
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

                        const residentInfo = residents.find((r: any) => r.id === residentId);
                        const residentName = participation?.resident_id?.full_name || residentInfo?.name || 'N/A';
                        const residentRoom = residentInfo?.room || '';

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

                        const residentInfo = residents.find((r: any) => r.id === residentId);
                        const residentName = participation?.resident_id?.full_name || residentInfo?.name || 'N/A';
                        const residentRoom = residentInfo?.room || '';
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
                        const residentInfo = residents.find((r: any) => r.id === residentId);
                        const residentName = participation?.resident_id?.full_name || residentInfo?.name || 'N/A';
                        const residentRoom = residentInfo?.room || '';
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
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Tham gia</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Lý do (nếu vắng)</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Ngày đánh giá</th>
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
                              {participation?.resident_id?.full_name || residentInfo?.name || 'N/A'}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: getStatusColor(status), fontWeight: 600 }}>
                              {getStatusText(status)}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                              {status === 'attended' ? '-' : status === 'absent' ? (
                                isValidAbsenceReason ? performanceNotes :
                                  <span style={{ color: '#f59e0b' }}>Chưa nhập lý do hoặc lý do không hợp lệ</span>
                              ) : status === 'pending' ? '-' : '-'}
                            </td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '0.875rem' }}>
                              {participation?.date ? new Date(participation.date).toLocaleDateString('vi-VN') : 'N/A'}
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

      <Dialog open={addResidentModalOpen} onClose={() => setAddResidentModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
          <div className="fixed inset-0 bg-black opacity-30" />
          <Dialog.Panel className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-15">
            <Dialog.Title className="text-lg font-bold mb-4">Chọn người cao tuổi để thêm vào hoạt động</Dialog.Title>
            <select
              value={selectedResidentId || ''}
              onChange={e => setSelectedResidentId(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
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
                disabled={addingResident || !selectedResidentId}
              >
                {addingResident ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

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