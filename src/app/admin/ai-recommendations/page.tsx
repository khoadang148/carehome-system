"use client";

import { useState, useEffect } from 'react';
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
import { parseAIRecommendation, ParsedAIRecommendation, AIRecommendationResponse } from '@/lib/ai-recommendations';
import { activitiesAPI } from '@/lib/api';
import NotificationModal from '@/components/NotificationModal';
import { residentAPI, carePlansAPI, roomsAPI, staffAssignmentsAPI, bedAssignmentsAPI } from '@/lib/api';
import { activityParticipationsAPI } from '@/lib/api';
import { filterOfficialResidents } from '@/lib/utils/resident-status';
import { validateActivitySchedule, checkScheduleConflict, ActivityParticipation } from '@/lib/utils/validation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


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
    fetchResidents();
  }, []);

    const fetchResidents = async () => {
      try {
        setResidentsLoading(true);
        const apiData = await residentAPI.getAll();
        
        // Map lại dữ liệu giống trang residents
        const mapped = await Promise.all(apiData.map(async (r: any) => {
          let roomNumber = '';
          try {
            // Đảm bảo r._id là string
            const residentId = typeof r._id === 'object' && (r._id as any)?._id 
              ? (r._id as any)._id 
              : r._id;
            
            // Ưu tiên sử dụng bedAssignmentsAPI
            try {
              const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
              const bedAssignment = Array.isArray(bedAssignments) ? 
                bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
              
              if (bedAssignment?.bed_id?.room_id) {
                // Nếu room_id đã có thông tin room_number, sử dụng trực tiếp
                if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                  roomNumber = bedAssignment.bed_id.room_id.room_number;
                  console.log(`Resident ${r.full_name}: Room ${roomNumber} (from bed assignments)`);
                } else {
                  // Nếu chỉ có _id, fetch thêm thông tin
                  const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                  if (roomId && roomId !== '[object Object]' && roomId !== 'undefined' && roomId !== 'null') {
                    const roomData = await roomsAPI.getById(roomId);
                    roomNumber = roomData?.room_number || '';
                    console.log(`Resident ${r.full_name}: Room ${roomNumber} (from bed assignments with fetch)`);
                  } else {
                    console.warn(`Invalid room ID from bed assignment for resident ${r.full_name}: ${roomId}`);
                  }
                }
              } else {
                throw new Error('No bed assignment found');
              }
            } catch (bedError) {
              console.warn(`Failed to get bed assignment for resident ${r.full_name}:`, bedError);
              // Fallback về carePlansAPI
              const assignments = await carePlansAPI.getByResidentId(residentId);
              const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
              
              if (assignment?.bed_id?.room_id || assignment?.assigned_room_id) {
                const roomId = assignment.bed_id?.room_id || assignment.assigned_room_id;
                // Đảm bảo roomId là string, không phải object
                const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                
                if (roomIdString && roomIdString !== '[object Object]' && roomIdString !== 'undefined' && roomIdString !== 'null') {
                  const roomData = await roomsAPI.getById(roomIdString);
                  roomNumber = roomData?.room_number || '';
                  console.log(`Resident ${r.full_name}: Room ${roomNumber} (fallback from care plans)`);
                } else {
                  console.warn(`Invalid room ID from care plan for resident ${r.full_name}: ${roomIdString}`);
                }
              } else {
                console.log(`No room assignment found for resident ${r.full_name}`);
              }
            }
          } catch (error) {
            console.error(`Error fetching room for resident ${r.full_name}:`, error);
            roomNumber = '';
          }
          
          return {
            id: r._id,
            name: r.full_name || '',
            room: roomNumber,
          };
        }));
        
        // Chỉ lấy cư dân chính thức (có phòng và giường)
        const officialResidents = await filterOfficialResidents(mapped);
        console.log('Official residents for AI recommendations:', officialResidents);
        
        setResidents(officialResidents);
        setResidentsError(null);
      } catch (error) {
        console.error('Error fetching residents:', error);
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
      // Validate thời gian trước khi tạo gợi ý
      if (!selectedDate || !selectedTime) {
        setNotification({ open: true, type: 'error', message: 'Vui lòng chọn ngày và giờ cho hoạt động.' });
        setLoading(false);
        return;
      }

      // Tạo datetime string từ ngày và giờ được chọn (không dùng toISOString)
      let scheduleDateTime = '';
      if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        scheduleDateTime = `${year}-${month}-${day}T${selectedTime}`;
      }

      // Validate thời gian sử dụng utility function
      const scheduleValidation = validateActivitySchedule(selectedDate, selectedTime, 60); // Default duration 60 minutes
      if (scheduleValidation) {
        setNotification({ 
          open: true, 
          type: 'warning', 
          message: scheduleValidation.message 
        });
        setLoading(false);
        return;
      }
      
      // Gọi API mới với residentIds và schedule_time
      const response: AIRecommendationResponse = await activitiesAPI.getAIRecommendation(
        [selectedResident],
        scheduleDateTime
      );
      
      // Xử lý response theo cấu trúc thực tế từ API
      if (!response || !Array.isArray(response) || response.length === 0) {
        setNotification({ open: true, type: 'error', message: 'Phản hồi trợ lý thông minh không hợp lệ.' });
        setRecommendations([]);
        setLoading(false);
        return;
      }
      
      // Lấy feedback từ phần tử đầu tiên trong mảng
      const firstRecommendation = response[0];
      if (!firstRecommendation || !firstRecommendation.feedback || typeof firstRecommendation.feedback !== 'string') {
        setNotification({ open: true, type: 'error', message: 'Phản hồi trợ lý thông minh không hợp lệ.' });
        setRecommendations([]);
        setLoading(false);
        return;
      }
      
      setAiResponse(firstRecommendation.feedback);
      const parsedRecs = parseAIRecommendation(firstRecommendation.feedback);
      
      // Validate parsed recommendations
      console.log('Raw trợ lý thông minh feedback:', firstRecommendation.feedback);
      console.log('Parsed recommendations:', parsedRecs);
      if (parsedRecs.length > 0) {
        const rec = parsedRecs[0];
        console.log('First recommendation validation:', {
          activityName: rec.activityName,
          duration: rec.duration,
          difficulty: rec.difficulty,
          confidenceLevel: rec.confidenceLevel,
          hasDescription: !!rec.detailedDescription,
          detailedDescriptionLength: rec.detailedDescription?.length || 0,
          detailedDescriptionPreview: rec.detailedDescription?.substring(0, 100) || 'N/A',
          objectivesCount: rec.objectives?.length || 0,
          benefitsCount: rec.benefits?.length || 0
        });
      
        // Validate critical fields
        if (!rec.activityName || rec.activityName === 'Hoạt Động Thư Giãn Được Đề Xuất') {
          console.warn('Warning: Activity name might not be parsed correctly');
        }
        if (!rec.duration || rec.duration === '30-45 phút') {
          console.warn('Warning: Duration might not be parsed correctly');
        }
        if (!rec.difficulty || rec.difficulty === 'Trung bình') {
          console.warn('Warning: Difficulty might not be parsed correctly');
        }
      }
      
      setRecommendations(parsedRecs);
      setRetryCount(0); // Reset retry count khi thành công
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.';
      
      // Xử lý các loại lỗi cụ thể
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

  // Khi nhận về schedule_time từ BE, parse lại đúng local
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

  const handleCreateActivity = async (recommendation: ParsedAIRecommendation) => {
    setCreateLoading(true);
    try {
      // Parse duration from string to number
      const durationMatch = recommendation.duration.match(/(\d+)/);
      const duration = durationMatch ? parseInt(durationMatch[1], 10) : 45;
      // Create a comprehensive description from trợ lý thông minh recommendation data
      let description = '';
      
      // Tạo mô tả chuyên nghiệp và dễ đọc
      const descriptionParts: string[] = [];
      
      // Tạo mô tả cơ bản
      let baseDescription = `Hoạt động ${recommendation.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi.`;
      
      // Thêm thông tin về độ khó và thời lượng
      if (recommendation.difficulty) {
        baseDescription += ` Độ khó: ${recommendation.difficulty}.`;
      }
      if (recommendation.duration) {
        baseDescription += ` Thời lượng: ${recommendation.duration}.`;
      }
      
      descriptionParts.push(baseDescription);
      
      // Thêm mô tả chi tiết nếu có và hợp lệ
      if (recommendation.detailedDescription && 
          recommendation.detailedDescription.length > 20 &&
          !recommendation.detailedDescription.includes('**') &&
          !recommendation.detailedDescription.includes('*')) {
        
        // Làm sạch mô tả chi tiết
        let cleanDescription = recommendation.detailedDescription
          .replace(/\*\*/g, '') // Loại bỏ dấu **
          .replace(/\*/g, '') // Loại bỏ dấu *
          .replace(/\n/g, ' ') // Thay thế xuống dòng bằng khoảng trắng
          .replace(/\s+/g, ' ') // Loại bỏ khoảng trắng thừa
          .trim();
        
        if (cleanDescription.length > 50) {
          descriptionParts.push(cleanDescription);
        }
      }
      
      // Thêm mục tiêu nếu có
      if (recommendation.objectives && recommendation.objectives.length > 0) {
        const validObjectives = recommendation.objectives
          .filter(obj => obj && obj.length > 5 && !obj.includes('*'))
          .slice(0, 2);
        
        if (validObjectives.length > 0) {
          const objectivesText = validObjectives.join('. ');
          descriptionParts.push(`Mục tiêu: ${objectivesText}`);
        }
      }
      
      // Thêm lợi ích nếu có
      if (recommendation.benefits && recommendation.benefits.length > 0) {
        const validBenefits = recommendation.benefits
          .filter(benefit => benefit && benefit.length > 5 && !benefit.includes('*'))
          .slice(0, 2);
        
        if (validBenefits.length > 0) {
          const benefitsText = validBenefits.join('. ');
          descriptionParts.push(`Lợi ích: ${benefitsText}`);
        }
      }
      
      // Ghép các phần lại thành mô tả hoàn chỉnh
      description = descriptionParts.join(' ');
      
      // Nếu không có mô tả đủ dài, tạo mô tả mặc định
      if (!description || description.length < 50) {
        description = `Hoạt động ${recommendation.activityName} được thiết kế phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần. Hoạt động này có độ khó ${recommendation.difficulty || 'trung bình'} và thời lượng ${recommendation.duration || '30-45 phút'}.`;
      }
      
      // Giới hạn độ dài mô tả để tránh quá dài
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
      // Validate thời gian - Bắt buộc phải chọn ngày và giờ
      if (!selectedDate || !selectedTime) {
        throw new Error('Vui lòng chọn ngày và giờ cho hoạt động.');
      }

      // Tạo scheduleDateTime với timezone local
      let scheduleDateTime = '';
      if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        scheduleDateTime = `${year}-${month}-${day}T${selectedTime}`;
      }

      // Validate thời gian sử dụng utility function
      const scheduleValidation = validateActivitySchedule(selectedDate, selectedTime, duration);
      if (scheduleValidation) {
        throw new Error(scheduleValidation.message);
      }

      // KIỂM TRA TRÙNG LỊCH TRƯỚC KHI TẠO HOẠT ĐỘNG
      console.log('Checking schedule conflicts for resident:', selectedResident);
      
      try {
        const conflictCheck = await activitiesAPI.checkScheduleConflict(
          selectedResident,
          scheduleDateTime,
          duration
        );
        
        if (conflictCheck.hasConflict) {
          console.log('Schedule conflict detected:', conflictCheck.message);
          
          // Hiển thị thông báo lỗi và dừng việc tạo hoạt động
          setNotification({
            open: true,
            type: 'warning',
            message: conflictCheck.message
          });
          setCreateLoading(false);
          return; // Dừng ngay tại đây, không tạo hoạt động
        }
        
        console.log('No schedule conflicts found');
      } catch (error) {
        console.error('Error checking schedule conflict:', error);
        // Nếu có lỗi khi kiểm tra, vẫn cho phép tạo hoạt động
      }

      const activityData = {
        activity_name: recommendation.activityName,
        description: description || recommendation.description || 'Hoạt động được đề xuất bởi trợ lý thông minh',
        duration: duration,
        schedule_time: scheduleDateTime,
        location: getLocation(activityType, recommendation.activityName),
        capacity: 20,
        activity_type: activityType,
      };
      // Validate required fields
      if (!activityData.activity_name || !activityData.description || !activityData.activity_type) {
        throw new Error('Thiếu thông tin bắt buộc để tạo hoạt động. Vui lòng kiểm tra lại dữ liệu trợ lý thông minh recommendation.');
      }
      const response = await activitiesAPI.create(activityData);
      
      // Tự động thêm resident đã chọn vào hoạt động vừa tạo
      if (response && response._id && selectedResident) {
        try {
          // Tìm resident để lấy thông tin đầy đủ
          const selectedResidentData = residents.find(r => r.id === selectedResident);
          if (selectedResidentData) {
            // Tìm staff được phân công quản lý resident này
            let assignedStaffId = user?.id || "664f1b2c2f8b2c0012a4e750"; // Mặc định là user hiện tại
            
            try {
              const staffAssignments = await staffAssignmentsAPI.getByResident(selectedResidentData.id);
              if (staffAssignments && staffAssignments.length > 0) {
                // Lấy staff đầu tiên được phân công cho resident này
                const assignment = staffAssignments[0];
                assignedStaffId = assignment.staff_id._id || assignment.staff_id;
                console.log('Found assigned staff for resident:', assignedStaffId);
              } else {
                console.log('No staff assignment found for resident, using current user');
              }
            } catch (assignmentError) {
              console.error('Error fetching staff assignment:', assignmentError);
              // Nếu không tìm thấy assignment, vẫn sử dụng user hiện tại
            }
            
            await activityParticipationsAPI.create({
              staff_id: assignedStaffId,
              activity_id: response._id,
              resident_id: selectedResidentData.id, // Sử dụng ID thực tế của resident
              date: scheduleDateTime ? scheduleDateTime.split('T')[0] + "T00:00:00Z" : new Date().toISOString().split('T')[0] + "T00:00:00Z",
              performance_notes: 'Tự động thêm từ gợi ý trợ lý thông minh',
              attendance_status: 'attended'
            });
            
            setNotification({ 
              open: true, 
              type: 'success', 
              message: 'Hoạt động đã được tạo thành công và tự động thêm người cao tuổi vào hoạt động với staff được phân công! Bạn sẽ được chuyển đến trang danh sách hoạt động.' 
            });
          } else {
            setNotification({ 
              open: true, 
              type: 'success', 
              message: 'Hoạt động đã được tạo thành công! Tuy nhiên không tìm thấy thông tin người cao tuổi để thêm vào hoạt động.' 
            });
          }
        } catch (participationError: any) {
          console.error('Error adding resident to activity:', participationError);
          
          // Kiểm tra xem có phải lỗi trùng lịch không
          let errorMessage = 'Có lỗi khi thêm người cao tuổi vào hoạt động.';
          if (participationError?.response?.data?.message) {
            errorMessage = participationError.response.data.message;
          } else if (participationError?.response?.data?.detail) {
            errorMessage = participationError.response.data.detail;
          } else if (participationError?.message) {
            errorMessage = participationError.message;
          }
          
          // Nếu là lỗi trùng lịch (400), hiển thị thông báo lỗi và không chuyển trang
          if (participationError?.response?.status === 400) {
            setNotification({ 
              open: true, 
              type: 'warning', 
              message: `Hoạt động đã được tạo thành công! Tuy nhiên: ${errorMessage}` 
            });
            // Không chuyển trang nếu có lỗi trùng lịch
            return;
          } else {
            setNotification({ 
              open: true, 
              type: 'success', 
              message: 'Hoạt động đã được tạo thành công! Tuy nhiên có lỗi khi thêm người cao tuổi vào hoạt động. Bạn có thể thêm thủ công sau.' 
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
      if (error?.response?.data) {
        console.error('Backend error details:', error.response.data);
      }
      
      // Kiểm tra xem có phải lỗi trùng lịch không
      const isScheduleConflict = errorMessage.includes('Cư dân đã có hoạt động') || 
                                errorMessage.includes('trong cùng ngày') ||
                                error?.response?.status === 400;
      
      // Chỉ hiển thị thông báo lỗi nếu không phải lỗi trùng lịch (vì đã xử lý ở trên)
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
      {/* Background decorations */}
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

        {/* Input Section */}
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Chọn người cao tuổi
                  </label>
                  <select
                    value={selectedResident || ''}
                    onChange={(e) => setSelectedResident(e.target.value)}
                    disabled={residentsLoading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      background: residentsLoading ? '#f9fafb' : 'white',
                      cursor: residentsLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">
                      {residentsLoading ? 'Đang tải danh sách...' : 'Chọn người cao tuổi...'}
                    </option>
                    {!residentsLoading && residents.length === 0 && (
                      <option value="" disabled>Không có người cao tuổi nào</option>
                    )}
                    {!residentsLoading && residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name}{resident.room && resident.room !== '' && resident.room !== 'Chưa phân phòng' ? ` - Phòng ${resident.room}` : ''}
                      </option>
                    ))}
                  </select>
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
                {!selectedDate || !selectedTime ? 'Chọn ngày và giờ trước' : 'Tạo gợi ý trợ lý thông minh'}
                  </>
                )}
              </button>
        </div>

        {/* Recommendations Results */}
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
                
                // Validate and sanitize data before rendering to ensure correct field mapping
                // This prevents display issues where wrong information shows in wrong fields
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
                    {/* Activity Name Section */}
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

                    {/* Activity Overview */}
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



                    {/* Objectives */}
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

                    {/* Activity Description */}
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
                            // Ưu tiên sử dụng detailedDescription nếu có và hợp lệ
                            if (safeRec.detailedDescription && 
                                safeRec.detailedDescription !== 'Mô tả chi tiết về hoạt động này.' && 
                                safeRec.detailedDescription.length >= 20) {
                              
                              let cleanDescription = safeRec.detailedDescription;
                              
                              // Loại bỏ các phần thông tin đã có ở các trường khác
                              cleanDescription = cleanDescription.replace(/\*\*Tên hoạt động:\*\*.*?(?=\*\*|$)/gi, '');
                              cleanDescription = cleanDescription.replace(/\*\*Thời gian:\*\*.*?(?=\*\*|$)/gi, '');
                              cleanDescription = cleanDescription.replace(/\*\*Thời lượng:\*\*.*?(?=\*\*|$)/gi, '');
                              cleanDescription = cleanDescription.replace(/\*\*Độ khó:\*\*.*?(?=\*\*|$)/gi, '');
                              
                              // Loại bỏ các từ khóa không cần thiết
                              cleanDescription = cleanDescription.replace(/Tuyệt vời,?/gi, '');
                              cleanDescription = cleanDescription.replace(/dựa trên thông tin bạn cung cấp/gi, '');
                              cleanDescription = cleanDescription.replace(/tôi sẽ (tạo|đề xuất)/gi, '');
                              cleanDescription = cleanDescription.replace(/như sau:/gi, '');
                              
                              // Loại bỏ thông tin lặp lại về thời gian
                              cleanDescription = cleanDescription.replace(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}.*?\d{1,2}\/\d{1,2}\/\d{4}.*?\(\d+ phút\)/gi, '');
                              
                              // Làm sạch và format lại
                              cleanDescription = cleanDescription.replace(/\*\*/g, '').trim();
                              cleanDescription = cleanDescription.replace(/\s+/g, ' ');
                              cleanDescription = cleanDescription.replace(/^[,\s]+/, '');
                              cleanDescription = cleanDescription.replace(/[,\s]+$/, '');
                              
                              // Nếu mô tả quá ngắn sau khi làm sạch, sử dụng mô tả mặc định
                              if (!cleanDescription || cleanDescription.length < 20) {
                                return `Hoạt động ${safeRec.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần một cách an toàn và hiệu quả. Hoạt động này có độ khó ${safeRec.difficulty.toLowerCase()} và thời lượng ${safeRec.duration}.`;
                              }
                              
                              // Giới hạn độ dài
                              if (cleanDescription.length > 200) {
                                cleanDescription = cleanDescription.substring(0, 197) + '...';
                              }
                              
                              return cleanDescription;
                            }
                            
                            // Mô tả mặc định khi không có detailedDescription hoặc không hợp lệ
                            return `Hoạt động ${safeRec.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần một cách an toàn và hiệu quả. Hoạt động này có độ khó ${safeRec.difficulty.toLowerCase()} và thời lượng ${safeRec.duration}.`;
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Benefits */}
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

                    {/* Precautions */}
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



                    {/* Confidence Level */}
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

                    {/* Actions */}
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

        {/* Raw AI Response for debugging */}
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

            {/* Debug Info */}
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
                // Format trợ lý thông minh response để hiển thị đẹp hơn
                let formattedResponse = aiResponse;
                
                // Thay thế các từ khóa bằng styling - thứ tự quan trọng để tránh conflict
                formattedResponse = formattedResponse
                  // Format tiêu đề chính trước
                  .replace(/\*\*(.*?):\*\*/g, '<strong style="color: #1e40af; font-size: 1rem; font-weight: 600; display: block; margin: 1rem 0 0.5rem 0; padding: 0.5rem 0; border-bottom: 2px solid #dbeafe;">$1:</strong>')
                  
                  // Format các tiêu đề phụ
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #374151; font-weight: 600; display: inline-block; margin: 0.5rem 0 0.25rem 0;">$1:</strong>')
                  
                  // Format danh sách bullet points
                  .replace(/^[-•]\s*(.*)/g, '<li style="margin: 0.25rem 0; padding-left: 0.5rem; position: relative;"><span style="position: absolute; left: 0; color: #8b5cf6;">•</span><span style="margin-left: 1rem;">$1</span></li>')
                  
                  // Wrap danh sách trong ul
                  .replace(/(<li.*?<\/li>)/g, '<ul style="margin: 0.5rem 0; padding-left: 0; list-style: none;">$1</ul>')
                  
                  // Format thời gian và ngày - chỉ trong context phù hợp
                  .replace(/(\d{2}:\d{2})(?=\s*,?\s*ngày|\s*-\s*|\s*$)/g, '<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.8rem;">$1</span>')
                  .replace(/(\d{2}\/\d{2}\/\d{4})/g, '<span style="background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.8rem;">$1</span>')
                  
                  // Format tên người - chỉ khi đứng sau "cụ", "bà", "ông"
                  .replace(/(cụ|bà|ông)\s+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)/g, '<span style="color: #dc2626; font-weight: 600;">$1 $2</span>')
                  
                  // Format các bệnh lý - chỉ trong context y tế
                  .replace(/(bệnh lý|tiểu đường|bệnh thận|huyết áp|tim mạch)(?=\s*\)|\s*,|\s*\.|\s*$)/g, '<span style="background: #fee2e2; color: #dc2626; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8rem; font-weight: 500;">$1</span>')
                  
                  // Format các lợi ích - chỉ trong context tích cực
                  .replace(/(Tăng cường|Cải thiện|Thúc đẩy|Duy trì)(?=\s+[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])/g, '<span style="color: #059669; font-weight: 600;">$1</span>')
                  
                  // Format từ "phù hợp" - chỉ khi nói về tính phù hợp
                  .replace(/(phù hợp)(?=\s+với|\s+cho|\s*\)|\s*,|\s*\.|\s*$)/g, '<span style="color: #059669; font-weight: 600;">$1</span>')
                  
                  // Format "Tuyệt vời!" - chỉ khi đứng đầu câu
                  .replace(/^(Tuyệt vời!)/g, '<span style="color: #059669; font-weight: 600;">$1</span>')
                  
                  // Thêm spacing cho các đoạn
                  .replace(/\n\n/g, '</p><p style="margin: 0.75rem 0;">')
                  .replace(/\n/g, '<br>');
                
                // Wrap trong paragraph nếu chưa có
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

        {/* Empty State */}
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
