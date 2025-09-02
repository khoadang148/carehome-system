"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { parseAIRecommendation, ParsedAIRecommendation } from '@/lib/ai-recommendations';
import { activitiesAPI } from '@/lib/api';
import NotificationModal from '@/components/NotificationModal';
import { residentAPI, carePlansAPI, roomsAPI, staffAssignmentsAPI, bedAssignmentsAPI } from '@/lib/api';
import { activityParticipationsAPI } from '@/lib/api';
import { filterOfficialResidents } from '@/lib/utils/resident-status';
import { validateActivitySchedule, checkScheduleConflict, ActivityParticipation } from '@/lib/utils/validation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { clientStorage } from '@/lib/utils/clientStorage';

// Simple concurrency limiter
const withConcurrency = async <T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length) as R[];
  let idx = 0;
  const workers: Promise<void>[] = [];
  const run = async () => {
    while (idx < items.length) {
      const current = idx++;
      try {
        results[current] = await worker(items[current], current);
      } catch (e) {
        // @ts-ignore
        results[current] = null;
      }
    }
  };
  for (let i = 0; i < Math.max(1, limit); i++) workers.push(run());
  await Promise.all(workers);
  return results;
};

export default function AIRecommendationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [recommendations, setRecommendations] = useState<ParsedAIRecommendation[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; type: 'success' | 'error' | 'warning'; message: string }>({ open: false, type: 'success', message: '' });
  const [searchText, setSearchText] = useState('');
  const [residents, setResidents] = useState<any[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [residentsError, setResidentsError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showResidentDropdown, setShowResidentDropdown] = useState(false);
  const [residentSearchTerm, setResidentSearchTerm] = useState('');
  const [loadingRoomInfo, setLoadingRoomInfo] = useState(false);

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
    fetchResidents();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.resident-dropdown')) {
        setShowResidentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchResidents = async () => {
    try {
      setResidentsLoading(true);
      // 1) Try cached list for instant display
      try {
        const cachedRaw = clientStorage.getItem('aiResidentsCache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached?.data) && cached.data.length > 0) {
            setResidents(cached.data);
            setResidentsError(null);
          }
        }
      } catch {}

      // 2) Fetch fresh basic list (residentAPI.getAll has its own short TTL cache)
      const apiData = await residentAPI.getAll();

      const basicResidents = apiData.map((r: any) => ({
        id: r._id,
        name: r.full_name || '',
        room: '',
        status: r.status || 'active'
      }));

      const officialResidents = await filterOfficialResidents(basicResidents);

      setResidents(officialResidents);
      setResidentsError(null);

      // 3) Background room info with concurrency limit and cache final
      if (officialResidents.length > 0) {
        setTimeout(async () => {
          try {
            setLoadingRoomInfo(true);
            const residentsWithRooms = await withConcurrency<typeof officialResidents[number], any>(officialResidents, 6, async (resident) => {
              let roomNumber = '';
              try {
                const residentId = resident.id;
                try {
                  const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
                  const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
                  if (bedAssignment?.bed_id?.room_id) {
                    if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                      roomNumber = bedAssignment.bed_id.room_id.room_number;
                    } else {
                      const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                      if (roomId && roomId !== '[object Object]' && roomId !== 'undefined' && roomId !== 'null') {
                        const roomData = await roomsAPI.getById(roomId);
                        roomNumber = roomData?.room_number || '';
                      }
                    }
                  } else {
                    throw new Error('No bed assignment found');
                  }
                } catch (bedError) {
                  const assignments = await carePlansAPI.getByResidentId(residentId);
                  const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
                  if (assignment?.bed_id?.room_id || assignment?.assigned_room_id) {
                    const roomId = assignment.bed_id?.room_id || assignment?.assigned_room_id;
                    const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                    if (roomIdString && roomIdString !== '[object Object]' && roomIdString !== 'undefined' && roomIdString !== 'null') {
                      const roomData = await roomsAPI.getById(roomIdString);
                      roomNumber = roomData?.room_number || '';
                    }
                  }
                }
              } catch (error) {
                roomNumber = '';
              }
              return { ...resident, room: roomNumber };
            });

            setResidents(residentsWithRooms);
            try {
              clientStorage.setItem('aiResidentsCache', JSON.stringify({ ts: Date.now(), data: residentsWithRooms }));
            } catch {}
          } catch (error) {
            console.log('Không thể tải thông tin phòng:', error);
          } finally {
            setLoadingRoomInfo(false);
          }
        }, 50);
      }
      
    } catch (error) {
      setResidentsError('Không thể tải danh sách người cao tuổi. Vui lòng thử lại.');
      setResidents([]);
    } finally {
      setResidentsLoading(false);
    }
  };

  const generateIndividualRecommendations = async () => {
    if (!selectedResident) return;

    setLoading(true);
    try {
      if (!selectedDate || !selectedTime) {
        setNotification({ open: true, type: 'error', message: 'Vui lòng chọn ngày và giờ cho hoạt động.' });
        setLoading(false);
        return;
      }

      let scheduleDateTime = '';
      if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        scheduleDateTime = `${year}-${month}-${day}T${selectedTime}`;
      }

      const scheduleValidation = validateActivitySchedule(selectedDate, selectedTime, 60);
      if (scheduleValidation) {
        setNotification({
          open: true,
          type: 'warning',
          message: scheduleValidation.message
        });
        setLoading(false);
        return;
      }

      const response: any = await activitiesAPI.getAIRecommendation(
        [selectedResident],
        scheduleDateTime
      );

      if (!response || !Array.isArray(response) || response.length === 0) {
        setNotification({ open: true, type: 'error', message: 'Phản hồi trợ lý thông minh không hợp lệ.' });
        setRecommendations([]);
        setLoading(false);
        return;
      }

      const firstRecommendation = response[0];
      if (!firstRecommendation || !firstRecommendation.feedback || typeof firstRecommendation.feedback !== 'string') {
        setNotification({ open: true, type: 'error', message: 'Phản hồi trợ lý thông minh không hợp lệ.' });
        setRecommendations([]);
        setLoading(false);
        return;
      }

      setAiResponse(firstRecommendation.feedback);
      const parsedRecs = parseAIRecommendation(firstRecommendation.feedback);

      setRecommendations(parsedRecs);
      setRetryCount(0);
    } catch (error: any) {
      let errorMessage = 'Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        if (newRetryCount >= 3) {
          errorMessage = 'Đã thử 3 lần nhưng vẫn bị timeout. Vui lòng thử lại sau 1-2 phút hoặc liên hệ admin.';
        } else {
          errorMessage = `Yêu cầu bị timeout (lần thử ${newRetryCount}/3). Hệ thống trợ lý thông minh đang xử lý, vui lòng thử lại sau vài giây.`;
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API không tìm thấy. Vui lòng kiểm tra lại cấu hình.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setNotification({ open: true, type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleTimeFromAPI = (schedule_time: string) => {
    if (schedule_time) {
      const [datePart, timePart] = schedule_time.split('T');
      const [year, month, day] = datePart.split('-');
      setSelectedDate(new Date(Number(year), Number(month) - 1, Number(day)));
      setSelectedTime(timePart);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'low': return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
    }
  };

  // Lọc người cao tuổi theo từ khóa tìm kiếm (memoized)
  const filteredResidents = useMemo(() => {
    if (!residentSearchTerm) return residents;
    const searchLower = residentSearchTerm.toLowerCase();
    return residents.filter(resident => 
      resident.name.toLowerCase().includes(searchLower) ||
      (resident.room && resident.room.toLowerCase().includes(searchLower))
    );
  }, [residents, residentSearchTerm]);

  const selectedResidentData = useMemo(() => 
    residents.find(r => r.id === selectedResident), 
    [residents, selectedResident]
  );

  const handleCreateActivity = async (recommendation: ParsedAIRecommendation) => {
    setCreateLoading(true);
    try {
      const durationMatch = recommendation.duration.match(/(\d+)/);
      const duration = durationMatch ? parseInt(durationMatch[1], 10) : 45;
      let description = '';

      const descriptionParts: string[] = [];

      let baseDescription = `Hoạt động ${recommendation.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi.`;

      if (recommendation.difficulty) {
        baseDescription += ` Độ khó: ${recommendation.difficulty}.`;
      }
      if (recommendation.duration) {
        baseDescription += ` Thời lượng: ${recommendation.duration}.`;
      }

      descriptionParts.push(baseDescription);

      if (recommendation.detailedDescription &&
        recommendation.detailedDescription.length > 20 &&
        !recommendation.detailedDescription.includes('**') &&
        !recommendation.detailedDescription.includes('*')) {

        let cleanDescription = recommendation.detailedDescription
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanDescription.length > 50) {
          descriptionParts.push(cleanDescription);
        }
      }

      if (recommendation.objectives && recommendation.objectives.length > 0) {
        const validObjectives = recommendation.objectives
          .filter(obj => obj && obj.length > 5 && !obj.includes('*'))
          .slice(0, 2);

        if (validObjectives.length > 0) {
          const objectivesText = validObjectives.join('. ');
          descriptionParts.push(`Mục tiêu: ${objectivesText}`);
        }
      }

      if (recommendation.benefits && recommendation.benefits.length > 0) {
        const validBenefits = recommendation.benefits
          .filter(benefit => benefit && benefit.length > 5 && !benefit.includes('*'))
          .slice(0, 2);

        if (validBenefits.length > 0) {
          const benefitsText = validBenefits.join('. ');
          descriptionParts.push(`Lợi ích: ${benefitsText}`);
        }
      }

      description = descriptionParts.join(' ');

      if (!description || description.length < 50) {
        description = `Hoạt động ${recommendation.activityName} được thiết kế phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần. Hoạt động này có độ khó ${recommendation.difficulty || 'trung bình'} và thời lượng ${recommendation.duration || '30-45 phút'}.`;
      }

      if (description.length > 500) {
        description = description.substring(0, 497) + '...';
      }
      const getActivityType = (activityName: string): string => {
        const name = activityName.toLowerCase();
        if (name.includes('đi bộ') || name.includes('tập thể dục') || name.includes('thể dục')) {
          return 'Thể dục';
        } else if (name.includes('vườn') || name.includes('cây cảnh') || name.includes('chăm sóc')) {
          return 'Làm vườn';
        } else if (name.includes('âm nhạc') || name.includes('hát') || name.includes('nhạc')) {
          return 'Âm nhạc';
        } else if (name.includes('yoga') || name.includes('dưỡng sinh') || name.includes('thiền')) {
          return 'Dưỡng sinh';
        } else if (name.includes('thư giãn') || name.includes('nghỉ ngơi')) {
          return 'Thư giãn';
        } else {
          return 'Hoạt động chung';
        }
      };

      const getLocation = (activityType: string, activityName: string): string => {
        const name = activityName.toLowerCase();
        if (activityType === 'Thể dục' || name.includes('đi bộ')) {
          return 'Sân vườn';
        } else if (activityType === 'Làm vườn') {
          return 'Vườn cây';
        } else if (activityType === 'Âm nhạc') {
          return 'Phòng sinh hoạt';
        } else if (activityType === 'Dưỡng sinh') {
          return 'Phòng tập';
        } else {
          return 'Khu vực chung';
        }
      };

      const activityType = getActivityType(recommendation.activityName);
      if (!selectedDate || !selectedTime) {
        throw new Error('Vui lòng chọn ngày và giờ cho hoạt động.');
      }

      let scheduleDateTime = '';
      if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        scheduleDateTime = `${year}-${month}-${day}T${selectedTime}`;
      }

      const scheduleValidation = validateActivitySchedule(selectedDate, selectedTime, duration);
      if (scheduleValidation) {
        throw new Error(scheduleValidation.message);
      }

      try {
        const conflictCheck = await activitiesAPI.checkScheduleConflict(
          selectedResident,
          scheduleDateTime,
          duration
        );

        if (conflictCheck.hasConflict) {
          setNotification({
            open: true,
            type: 'warning',
            message: conflictCheck.message
          });
          setCreateLoading(false);
          return;
        }
      } catch (error) {
      }

      const activityData = {
        activity_name: recommendation.activityName,
        description: description || recommendation.description || 'Hoạt động được đề xuất bởi trợ lý thông minh',
        duration: duration,
        schedule_time: scheduleDateTime,
        location: getLocation(activityType, recommendation.activityName),
        capacity: 20,
        activity_type: activityType,
        staff_id: user?.id || '', // Thêm staff_id của user hiện tại
      };
      if (!activityData.activity_name || !activityData.description || !activityData.activity_type) {
        throw new Error('Thiếu thông tin bắt buộc để tạo hoạt động. Vui lòng kiểm tra lại dữ liệu trợ lý thông minh recommendation.');
      }
      const response = await activitiesAPI.create(activityData);

      if (response && response._id && selectedResident) {
        try {
          const selectedResidentData = residents.find(r => r.id === selectedResident);
          if (selectedResidentData) {
            let assignedStaffId = user?.id || "664f1b2c2f8b2c0012a4e750";
            let hasStaffAssignment = false;
            let staffName = 'Nhân viên hiện tại';

            try {
              const staffAssignments = await staffAssignmentsAPI.getByResident(selectedResidentData.id);
              if (staffAssignments && staffAssignments.length > 0) {
                const assignment = staffAssignments[0];
                assignedStaffId = assignment.staff_id?._id || assignment.staff_id;
                hasStaffAssignment = true;
                staffName = assignment.staff_name || 'Nhân viên được phân công';
              }
            } catch (assignmentError) {
            }

            if (hasStaffAssignment) {
              try {
                await activityParticipationsAPI.create({
                  staff_id: assignedStaffId,
                  activity_id: response._id,
                  resident_id: selectedResidentData.id,
                  date: scheduleDateTime ? scheduleDateTime.split('T')[0] + "T00:00:00Z" : new Date().toISOString().split('T')[0] + "T00:00:00Z",
                  performance_notes: 'Tự động thêm từ gợi ý trợ lý thông minh',
                  attendance_status: 'pending'
                });

                setNotification({
                  open: true,
                  type: 'success',
                  message: `Hoạt động đã được tạo thành công và tự động thêm người cao tuổi vào hoạt động với ${staffName}! Bạn sẽ được chuyển đến trang danh sách hoạt động.`
                });
              } catch (participationError: any) {
                let errorMessage = 'Có lỗi khi thêm người cao tuổi vào hoạt động.';
                if (participationError?.response?.data?.message) {
                  errorMessage = participationError.response.data.message;
                } else if (participationError?.response?.data?.detail) {
                  errorMessage = participationError.response.data.detail;
                } else if (participationError?.message) {
                  errorMessage = participationError.message;
                }

                if (errorMessage.includes('không phải là nhân viên') || errorMessage.includes('not a staff member')) {
                  const residentName = residents.find(r => r.id === selectedResident)?.full_name || 'Người cao tuổi này';
                  setNotification({
                    open: true,
                    type: 'warning',
                    message: `Hoạt động đã được tạo thành công! ${residentName} chưa có nhân viên được phân công chăm sóc. Bạn có thể phân công nhân viên trong trang quản lý phân công hoặc thêm người cao tuổi vào hoạt động thủ công sau.`
                  });
                  return;
                }

                if (participationError?.response?.status === 400) {
                  setNotification({
                    open: true,
                    type: 'warning',
                    message: `Hoạt động đã được tạo thành công! Tuy nhiên: ${errorMessage}`
                  });
                  return;
                } else {
                  setNotification({
                    open: true,
                    type: 'warning',
                    message: 'Hoạt động đã được tạo thành công! Tuy nhiên có lỗi khi thêm người cao tuổi vào hoạt động. Bạn có thể thêm thủ công sau hoặc kiểm tra xem người cao tuổi đã có nhân viên được phân công chưa.'
                  });
                }
              }
            } else {
              const residentName = selectedResidentData?.full_name || 'Người cao tuổi này';
              setNotification({
                open: true,
                type: 'warning',
                message: `Hoạt động đã được tạo thành công! Lưu ý: ${residentName} chưa có nhân viên được phân công chăm sóc nên chưa thể thêm vào hoạt động. Bạn có thể phân công nhân viên trong trang quản lý phân công trước khi thêm người cao tuổi vào hoạt động.`
              });
            }
          } else {
            setNotification({
              open: true,
              type: 'success',
              message: 'Hoạt động đã được tạo thành công! Tuy nhiên không tìm thấy thông tin người cao tuổi để thêm vào hoạt động.'
            });
          }
        } catch (participationError: any) {
          let errorMessage = 'Có lỗi khi thêm người cao tuổi vào hoạt động.';
          if (participationError?.response?.data?.message) {
            errorMessage = participationError.response.data.message;
          } else if (participationError?.response?.data?.detail) {
            errorMessage = participationError.response.data.detail;
          } else if (participationError?.message) {
            errorMessage = participationError.message;
          }

          if (errorMessage.includes('không phải là nhân viên') || errorMessage.includes('not a staff member')) {
            const residentName = residents.find(r => r.id === selectedResident)?.full_name || 'Người cao tuổi này';
            setNotification({
              open: true,
              type: 'warning',
              message: `Hoạt động đã được tạo thành công! ${residentName} chưa có nhân viên được phân công chăm sóc. Bạn có thể phân công nhân viên trong trang quản lý phân công hoặc thêm người cao tuổi vào hoạt động thủ công sau.`
            });
            return;
          }

          if (participationError?.response?.status === 400) {
            setNotification({
              open: true,
              type: 'warning',
              message: `Hoạt động đã được tạo thành công! Tuy nhiên: ${errorMessage}`
            });
            return;
          } else {
            setNotification({
              open: true,
              type: 'warning',
              message: 'Hoạt động đã được tạo thành công! Tuy nhiên có lỗi khi thêm người cao tuổi vào hoạt động. Bạn có thể thêm thủ công sau hoặc kiểm tra xem người cao tuổi đã có nhân viên được phân công chưa.'
            });
          }
        }
      } else {
        setNotification({
          open: true,
          type: 'success',
          message: 'Hoạt động đã được tạo thành công từ gợi ý trợ lý thông minh! Bạn sẽ được chuyển đến trang danh sách hoạt động.'
        });
      }

      setTimeout(() => {
        setNotification({ open: false, type: 'success', message: '' });
        router.push('/activities');
      }, 1500);
    } catch (error: any) {
      let errorMessage = 'Đã xảy ra lỗi khi tạo hoạt động từ gợi ý trợ lý thông minh. Vui lòng thử lại sau.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      const isScheduleConflict = errorMessage.includes('người cao tuổi đã có hoạt động') ||
        errorMessage.includes('trong cùng ngày') ||
        error?.response?.status === 400;

      if (!isScheduleConflict) {
        setNotification({
          open: true,
          type: 'error',
          message: errorMessage
        });
      }
    } finally {
      setCreateLoading(false);
    }
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
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <SparklesIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Trợ lý thông minh
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Hệ thống sẽ phân tích sở thích và tình trạng sức khỏe để đưa ra gợi ý chương trình phù hợp
                </p>
              </div>
            </div>
          </div>
        </div>


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
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ position: 'relative' }} className="resident-dropdown">
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Chọn người cao tuổi
              </label>
              
              {/* Custom Dropdown với tìm kiếm */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowResidentDropdown(!showResidentDropdown)}
                disabled={residentsLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: residentsLoading ? '#f9fafb' : 'white',
                    cursor: residentsLoading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: selectedResident ? '#374151' : '#9ca3af' }}>
                    {selectedResidentData 
                      ? `${selectedResidentData.name}${selectedResidentData.room && selectedResidentData.room !== '' && selectedResidentData.room !== 'Chưa phân phòng' ? ` - Phòng ${selectedResidentData.room}` : ''}`
                      : residentsLoading ? 'Đang tải danh sách...' : 'Chọn người cao tuổi...'
                    }
                    {loadingRoomInfo && !residentsLoading && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                        (Đang tải thông tin phòng...)
                      </span>
                    )}
                  </span>
                  <svg 
                    style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      color: '#6b7280',
                      transform: showResidentDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showResidentDropdown && !residentsLoading && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflow: 'hidden'
                  }}>
                    {/* Search Input */}
                    <div style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#f9fafb'
                    }}>
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc phòng..."
                        value={residentSearchTerm}
                        onChange={(e) => setResidentSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          background: 'white'
                        }}
                        autoFocus
                      />
                    </div>

                    {/* Residents List */}
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {filteredResidents.length === 0 ? (
                        <div style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          {residentSearchTerm ? 'Không tìm thấy người cao tuổi nào' : 'Không có người cao tuổi nào'}
                        </div>
                      ) : (
                        filteredResidents.map(resident => (
                          <button
                            key={resident.id}
                            onClick={() => {
                              setSelectedResident(resident.id);
                              setShowResidentDropdown(false);
                              setResidentSearchTerm('');
                            }}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: 'none',
                              background: selectedResident === resident.id ? '#f3f4f6' : 'white',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedResident !== resident.id) {
                                e.currentTarget.style.background = '#f9fafb';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedResident !== resident.id) {
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 500, color: '#374151' }}>
                                {resident.name}
                              </div>
                              {resident.room && resident.room !== '' && resident.room !== 'Chưa phân phòng' && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  Phòng {resident.room}
                                </div>
                              )}
                            </div>
                            {selectedResident === resident.id && (
                              <svg style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {residentsError && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <ExclamationTriangleIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                  {residentsError}
                  <button
                    onClick={fetchResidents}
                    disabled={residentsLoading}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: residentsLoading ? 'not-allowed' : 'pointer',
                      opacity: residentsLoading ? 0.6 : 1
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ngày <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date as Date);
                }}
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
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  />
                }
              />

            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Giờ <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              />

            </div>
          </div>

          <button
            onClick={generateIndividualRecommendations}
            disabled={!selectedResident || !selectedDate || !selectedTime || loading}
            style={{
              padding: '0.875rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: selectedResident && selectedDate && selectedTime && !loading
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : '#9ca3af',
              color: 'white',
              fontWeight: 600,
              cursor: selectedResident && selectedDate && selectedTime && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Đang phân tích trợ lý thông minh (có thể mất 10-30 giây)...
              </>
            ) : (
              <>
                <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
                {!selectedDate || !selectedTime ? 'Tạo gợi ý hoạt động' : 'Tạo gợi ý trợ lý thông minh'}
              </>
            )}
          </button>
        </div>


        {recommendations.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <LightBulbIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0
              }}>
                Kết quả gợi ý trợ lý thông minh
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {recommendations.map((rec, index) => {
                const priorityColor = getPriorityColor(rec.priority);

                const safeRec: ParsedAIRecommendation = {
                  activityName: rec.activityName || 'Hoạt động được đề xuất',
                  duration: rec.duration || '30-45 phút',
                  difficulty: rec.difficulty || 'Trung bình',
                  confidenceLevel: rec.confidenceLevel || 70,
                  priority: rec.priority || 'medium',
                  description: rec.description || rec.detailedDescription || 'Mô tả chi tiết về hoạt động này.',
                  detailedDescription: rec.detailedDescription || 'Mô tả chi tiết về hoạt động này.',
                  objectives: rec.objectives || [],
                  benefits: rec.benefits || [],
                  precautions: rec.precautions || [],
                  timeOfDay: rec.timeOfDay || ''
                };

                return (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >

                    <div style={{
                      padding: '1.5rem 0',
                      borderBottom: '1px solid #f3f4f6',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          background: '#f8fafc',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
                          <SparklesIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#64748b',
                            marginBottom: '0.25rem'
                          }}>
                            Tên hoạt động
                          </div>
                          <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            margin: 0,
                            color: '#1e293b',
                            lineHeight: '1.3'
                          }}>
                            {safeRec.activityName}
                          </h3>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          background: priorityColor.bg,
                          color: priorityColor.text,
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          Mức ưu tiên: {safeRec.priority === 'high' ? 'Cao' :
                            safeRec.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          Độ khó: {safeRec.difficulty}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          Độ tin cậy: {safeRec.confidenceLevel}/100
                        </span>
                      </div>
                    </div>


                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          background: '#3b82f6',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <SparklesIcon style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} />
                        </div>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: 0
                        }}>
                          Tổng quan hoạt động
                        </h4>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#64748b',
                            marginBottom: '0.25rem'
                          }}>
                            Thời lượng
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#334155'
                          }}>
                            {safeRec.duration}
                          </div>
                        </div>
                        <div style={{
                          background: 'white',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#64748b',
                            marginBottom: '0.25rem'
                          }}>
                            Độ khó
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#334155'
                          }}>
                            {safeRec.difficulty}
                          </div>
                        </div>
                        {safeRec.timeOfDay && (
                          <div style={{
                            background: 'white',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: '#64748b',
                              marginBottom: '0.25rem'
                            }}>
                              Thời điểm thực hiện
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#334155'
                            }}>
                              {safeRec.timeOfDay}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>


                    {safeRec.objectives && safeRec.objectives.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#64748b',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <LightBulbIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                          Mục tiêu hoạt động
                        </h4>
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          <ul style={{
                            margin: 0,
                            paddingLeft: '1rem',
                            fontSize: '0.875rem',
                            color: '#334155'
                          }}>
                            {safeRec.objectives.map((objective, idx) => (
                              <li key={idx} style={{
                                marginBottom: '0.25rem',
                                lineHeight: '1.5'
                              }}>
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}


                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <EyeIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                        Mô tả hoạt động
                      </h4>
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#334155',
                          margin: 0,
                          lineHeight: '1.5'
                        }}>
                          {(() => {
                            if (safeRec.detailedDescription &&
                              safeRec.detailedDescription !== 'Mô tả chi tiết về hoạt động này.' &&
                              safeRec.detailedDescription.length >= 20) {

                              let cleanDescription = safeRec.detailedDescription;

                              cleanDescription = cleanDescription.replace(/\*\*Tên hoạt động:\*\*.*?(?=\*\*|$)/gi, '');
                              cleanDescription = cleanDescription.replace(/\*\*Thời gian:\*\*.*?(?=\*\*|$)/gi, '');
                              cleanDescription = cleanDescription.replace(/\*\*Thời lượng:\*\*.*?(?=\*\*|$)/gi, '');
                              cleanDescription = cleanDescription.replace(/\*\*Độ khó:\*\*.*?(?=\*\*|$)/gi, '');

                              cleanDescription = cleanDescription.replace(/Tuyệt vời,?/gi, '');
                              cleanDescription = cleanDescription.replace(/dựa trên thông tin bạn cung cấp/gi, '');
                              cleanDescription = cleanDescription.replace(/tôi sẽ (tạo|đề xuất)/gi, '');
                              cleanDescription = cleanDescription.replace(/như sau:/gi, '');

                              cleanDescription = cleanDescription.replace(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}.*?\d{1,2}\/\d{1,2}\/\d{4}.*?\(\d+ phút\)/gi, '');

                              cleanDescription = cleanDescription.replace(/\*\*/g, '').trim();
                              cleanDescription = cleanDescription.replace(/\s+/g, ' ');
                              cleanDescription = cleanDescription.replace(/^[,\s]+/, '');
                              cleanDescription = cleanDescription.replace(/[,\s]+$/, '');

                              if (!cleanDescription || cleanDescription.length < 20) {
                                return `Hoạt động ${safeRec.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần một cách an toàn và hiệu quả. Hoạt động này có độ khó ${safeRec.difficulty.toLowerCase()} và thời lượng ${safeRec.duration}.`;
                              }

                              if (cleanDescription.length > 200) {
                                cleanDescription = cleanDescription.substring(0, 197) + '...';
                              }

                              return cleanDescription;
                            }

                            return `Hoạt động ${safeRec.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần một cách an toàn và hiệu quả. Hoạt động này có độ khó ${safeRec.difficulty.toLowerCase()} và thời lượng ${safeRec.duration}.`;
                          })()}
                        </p>
                      </div>
                    </div>


                    {safeRec.benefits && safeRec.benefits.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#64748b',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <StarIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                          Lợi ích mang lại
                        </h4>
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            {safeRec.benefits.slice(0, 4).map((benefit, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  border: '1px solid #cbd5e1'
                                }}
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}


                    {safeRec.precautions && safeRec.precautions.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#64748b',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                          Lưu ý quan trọng
                        </h4>
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          <ul style={{
                            margin: 0,
                            paddingLeft: '1rem',
                            fontSize: '0.875rem',
                            color: '#334155'
                          }}>
                            {safeRec.precautions.map((precaution, idx) => (
                              <li key={idx} style={{
                                marginBottom: '0.25rem',
                                lineHeight: '1.5'
                              }}>
                                {precaution}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}


                    <div style={{
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <ChartBarIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                          Độ tin cậy của trợ lý thông minh
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#334155'
                        }}>
                          {safeRec.confidenceLevel}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${safeRec.confidenceLevel}%`,
                          height: '100%',
                          background: '#64748b',
                          transition: 'width 0.3s ease',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>


                    <div style={{
                      marginTop: '1.5rem',
                      paddingTop: '1.5rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      {user?.role === 'admin' || (user?.role === 'staff' && safeRec.confidenceLevel > 60) ? (
                        <button
                          onClick={() => handleCreateActivity(safeRec)}
                          disabled={createLoading || !selectedDate || !selectedTime}
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: createLoading || !selectedDate || !selectedTime ? '#9ca3af' : '#10b981',
                            color: 'white',
                            fontWeight: 600,
                            cursor: createLoading || !selectedDate || !selectedTime ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {createLoading ? (
                            <div style={{
                              width: '1rem',
                              height: '1rem',
                              border: '2px solid transparent',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          ) : (
                            <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                          )}
                          {!selectedDate || !selectedTime ? 'Chọn ngày và giờ trước' : 'Tạo hoạt động'}
                        </button>
                      ) : (
                        <div style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#f9fafb',
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          textAlign: 'center',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}>
                          <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />
                          {user?.role === 'staff' ? 'Cần độ tin cậy trợ lý thông minh ≥ 60 để tạo' : 'Không có quyền'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aiResponse && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginTop: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: 0
              }}>
                Phản hồi trợ lý thông minh
              </h3>
            </div>

            {selectedDate && selectedTime && (
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                  Thông tin thời gian đã chọn:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Ngày đã chọn:</span> {selectedDate.toLocaleDateString('vi-VN')}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Giờ đã chọn:</span> {selectedTime}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Thời gian hiện tại:</span> {new Date().toLocaleString('vi-VN')}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Trạng thái:</span>
                    <span style={{
                      color: (() => {
                        const selectedDateTime = new Date(selectedDate);
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        selectedDateTime.setHours(hours, minutes, 0, 0);
                        const now = new Date();
                        return selectedDateTime <= now ? '#dc2626' : '#059669';
                      })(),
                      fontWeight: 600
                    }}>
                      {(() => {
                        const selectedDateTime = new Date(selectedDate);
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        selectedDateTime.setHours(hours, minutes, 0, 0);
                        const now = new Date();
                        return selectedDateTime <= now ? 'Quá khứ (không hợp lệ)' : 'Tương lai (hợp lệ)';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              maxHeight: '500px',
              overflowY: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.7',
              color: '#374151'
            }}>
              {(() => {
                let formattedResponse = aiResponse;

                formattedResponse = formattedResponse
                  .replace(/\*\*(.*?):\*\*/g, '<strong style="color: #1e40af; font-size: 1rem; font-weight: 600; display: block; margin: 1rem 0 0.5rem 0; padding: 0.5rem 0; border-bottom: 2px solid #dbeafe;">$1:</strong>')

                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #374151; font-weight: 600; display: inline-block; margin: 0.5rem 0 0.25rem 0;">$1:</strong>')

                  .replace(/^[-•]\s*(.*)/g, '<li style="margin: 0.25rem 0; padding-left: 0.5rem; position: relative;"><span style="position: absolute; left: 0; color: #8b5cf6;">•</span><span style="margin-left: 1rem;">$1</span></li>')

                  .replace(/(<li.*?<\/li>)/g, '<ul style="margin: 0.5rem 0; padding-left: 0; list-style: none;">$1</ul>')

                  .replace(/(\d{2}:\d{2})(?=\s*,?\s*ngày|\s*-\s*|\s*$)/g, '<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.8rem;">$1</span>')
                  .replace(/(\d{2}\/\d{2}\/\d{4})/g, '<span style="background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.8rem;">$1</span>')

                  .replace(/(cụ|bà|ông)\s+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)/g, (match, prefix, name) => {
                    const selectedResidentName = selectedResident ? residents.find(r => r.id === selectedResident)?.full_name : '';
                    if (selectedResidentName && name.toLowerCase().includes(selectedResidentName.toLowerCase())) {
                      return `<span style="color: #dc2626; font-weight: 600; background: rgba(220, 38, 38, 0.1); padding: 0.125rem 0.25rem; border-radius: 0.25rem;">${prefix} ${name}</span>`;
                    }
                    return `<span style="color: #dc2626; font-weight: 600;">${prefix} ${name}</span>`;
                  })

                  .replace(new RegExp(`(${selectedResident ? residents.find(r => r.id === selectedResident)?.full_name?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '' : ''})`, 'gi'), (match) => {
                    if (match && selectedResident) {
                      return `<span style="color: #dc2626; font-weight: 600; background: rgba(220, 38, 38, 0.1); padding: 0.125rem 0.25rem; border-radius: 0.25rem;">${match}</span>`;
                    }
                    return match;
                  })

                  .replace(/([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)*)/g, (match) => {
                    const foundResident = residents.find(r =>
                      r.full_name && r.full_name.toLowerCase().includes(match.toLowerCase())
                    );
                    if (foundResident) {
                      return `<span style="color: #dc2626; font-weight: 600;">${match}</span>`;
                    }
                    return match;
                  })

                  .replace(/(bệnh lý|tiểu đường|bệnh thận|huyết áp|tim mạch)(?=\s*\)|\s*,|\s*\.|\s*$)/g, '<span style="background: #fee2e2; color: #dc2626; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8rem; font-weight: 500;">$1</span>')

                  .replace(/(Tăng cường|Cải thiện|Thúc đẩy|Duy trì)(?=\s+[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])/g, '<span style="color: #059669; font-weight: 600;">$1</span>')

                  .replace(/(phù hợp)(?=\s+với|\s+cho|\s*\)|\s*,|\s*\.|\s*$)/g, '<span style="color: #059669; font-weight: 600;">$1</span>')

                  .replace(/^(Tuyệt vời!)/g, '<span style="color: #059669; font-weight: 600;">$1</span>')

                  .replace(/\n\n/g, '</p><p style="margin: 0.75rem 0;">')
                  .replace(/\n/g, '<br>');

                if (!formattedResponse.startsWith('<')) {
                  formattedResponse = `<p style="margin: 0;">${formattedResponse}</p>`;
                }

                return (
                  <div
                    dangerouslySetInnerHTML={{ __html: formattedResponse }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                );
              })()}
            </div>
          </div>
        )}


        {!loading && recommendations.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <SparklesIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db' }} />
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  margin: 0,
                  marginBottom: '0.5rem'
                }}>
                  Chưa có gợi ý nào
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  margin: 0
                }}>
                  Chọn người cao tuổi và nhấn "Tạo gợi ý trợ lý thông minh" để nhận được các hoạt động phù hợp
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <NotificationModal
        open={notification.open}
        title={notification.type === 'success' ? 'Thành công' : notification.type === 'warning' ? 'Lưu ý' : 'Lỗi'}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, open: false })}
      />

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 
