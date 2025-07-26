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
import { residentAPI, carePlansAPI, roomsAPI } from '@/lib/api';
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
  const [notification, setNotification] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({ open: false, type: 'success', message: '' });
  const [searchText, setSearchText] = useState('');
  const [residents, setResidents] = useState<any[]>([]);

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
      const response = await residentAPI.getAll();
      setResidents(response);
    } catch (error) {
      console.error('Error fetching residents:', error);
      setNotification({ open: true, type: 'error', message: 'Không thể tải danh sách người cao tuổi.' });
      }
    };

  const generateIndividualRecommendations = async () => {
    if (!selectedResident) return;
    
    setLoading(true);
    try {
      // Tạo datetime string từ ngày và giờ được chọn (không dùng toISOString)
      let scheduleDateTime = '';
      if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        scheduleDateTime = `${year}-${month}-${day}T${selectedTime}`;
      }
      
      // Gọi API mới với residentIds và schedule_time
      const response: AIRecommendationResponse = await activitiesAPI.getAIRecommendation(
        [selectedResident],
        scheduleDateTime
      );
      
      // Xử lý response theo cấu trúc thực tế từ API
      if (!response || !Array.isArray(response) || response.length === 0) {
        setNotification({ open: true, type: 'error', message: 'Phản hồi AI không hợp lệ.' });
        setRecommendations([]);
        setLoading(false);
        return;
      }
      
      // Lấy feedback từ phần tử đầu tiên trong mảng
      const firstRecommendation = response[0];
      if (!firstRecommendation || !firstRecommendation.feedback || typeof firstRecommendation.feedback !== 'string') {
        setNotification({ open: true, type: 'error', message: 'Phản hồi AI không hợp lệ.' });
        setRecommendations([]);
        setLoading(false);
        return;
      }
      
      setAiResponse(firstRecommendation.feedback);
      const parsedRecs = parseAIRecommendation(firstRecommendation.feedback);
      
      // Validate parsed recommendations
      console.log('Raw AI feedback:', firstRecommendation.feedback);
      console.log('Parsed recommendations:', parsedRecs);
      if (parsedRecs.length > 0) {
        const rec = parsedRecs[0];
        console.log('First recommendation validation:', {
          activityName: rec.activityName,
          duration: rec.duration,
          difficulty: rec.difficulty,
          confidenceLevel: rec.confidenceLevel,
          hasDescription: !!rec.detailedDescription,
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
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setNotification({ open: true, type: 'error', message: 'Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.' });
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
      // Create a comprehensive description from AI recommendation data
      let description = '';
      
      // Tạo mô tả ngắn gọn và chuyên nghiệp
      const descriptionParts = [];
      
      // Thêm mô tả chi tiết nếu có
      if (recommendation.detailedDescription && recommendation.detailedDescription.length > 20) {
        descriptionParts.push(recommendation.detailedDescription);
      }
      
      // Thêm mục tiêu nếu có
      if (recommendation.objectives && recommendation.objectives.length > 0) {
        const objectives = recommendation.objectives.slice(0, 2).join(', '); // Chỉ lấy 2 mục tiêu đầu
        descriptionParts.push(`Mục tiêu: ${objectives}`);
      }
      
      // Thêm lợi ích nếu có
      if (recommendation.benefits && recommendation.benefits.length > 0) {
        const benefits = recommendation.benefits.slice(0, 2).join(', '); // Chỉ lấy 2 lợi ích đầu
        descriptionParts.push(`Lợi ích: ${benefits}`);
      }
      
      // Thêm lưu ý quan trọng nếu có
      if (recommendation.precautions && recommendation.precautions.length > 0) {
        const precautions = recommendation.precautions.slice(0, 1).join(', '); // Chỉ lấy 1 lưu ý đầu
        descriptionParts.push(`Lưu ý: ${precautions}`);
      }
      
      // Ghép các phần lại thành mô tả hoàn chỉnh
      description = descriptionParts.join('. ');
      
      // Nếu không có mô tả chi tiết, tạo mô tả mặc định ngắn gọn
      if (!description || description.length < 30) {
        description = `Hoạt động ${recommendation.activityName} được thiết kế phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần.`;
      }
      
      // Giới hạn độ dài mô tả để tránh quá dài
      if (description.length > 300) {
        description = description.substring(0, 297) + '...';
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
      // Gửi schedule_time đúng local, không dùng toISOString
      let scheduleDateTime = '';
      if (selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        scheduleDateTime = `${year}-${month}-${day}T${selectedTime}`;
      }

      // Validate thời gian
      if (scheduleDateTime) {
        const selectedDateTime = new Date(scheduleDateTime);
        const now = new Date();
        
        // Kiểm tra không được tạo trong quá khứ
        if (selectedDateTime <= now) {
          throw new Error('Thời gian bắt đầu không thể là thời gian trong quá khứ. Vui lòng chọn thời gian trong tương lai.');
        }
        
        // Kiểm tra phải tạo trước ít nhất 2 tiếng
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        if (selectedDateTime < twoHoursFromNow) {
          throw new Error('Hoạt động phải được tạo trước ít nhất 2 tiếng so với thời gian bắt đầu để đảm bảo chuẩn bị đầy đủ.');
        }
        
        // Kiểm tra không được tạo trước quá 1 tuần
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (selectedDateTime > oneWeekFromNow) {
          throw new Error('Hoạt động chỉ có thể được tạo trước tối đa 1 tuần so với thời gian bắt đầu.');
        }
      }

      const activityData = {
        activity_name: recommendation.activityName,
        description: description || recommendation.description || 'Hoạt động được đề xuất bởi AI',
        duration: duration,
        schedule_time: scheduleDateTime,
        location: getLocation(activityType, recommendation.activityName),
        capacity: 20,
        activity_type: activityType,
      };
      // Validate required fields
      if (!activityData.activity_name || !activityData.description || !activityData.activity_type) {
        throw new Error('Thiếu thông tin bắt buộc để tạo hoạt động. Vui lòng kiểm tra lại dữ liệu AI recommendation.');
      }
      const response = await activitiesAPI.create(activityData);
      setNotification({ open: true, type: 'success', message: 'Hoạt động đã được tạo thành công từ gợi ý AI! Bạn sẽ được chuyển đến trang danh sách hoạt động.' });
      setTimeout(() => {
        setNotification({ open: false, type: 'success', message: '' });
        router.push('/activities');
      }, 1500);
    } catch (error: any) {
      let errorMessage = 'Đã xảy ra lỗi khi tạo hoạt động từ gợi ý AI. Vui lòng thử lại sau.';
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
      setNotification({ open: true, type: 'error', message: errorMessage });
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
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Chọn người cao tuổi...</option>
                    {residents.map(resident => (
                      <option key={resident._id || resident.id} value={resident.id}>
                        {resident.name}{resident.room ? ` - Phòng ${resident.room}` : ''}
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
                Ngày (tùy chọn)
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
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                Nếu chọn, sẽ ưu tiên ngày này thay vì ngày hiện tại
                  </p>
              </div>

            <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                Giờ (tùy chọn)
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
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                Nếu chọn, sẽ ưu tiên giờ này thay vì giờ AI đề xuất
                </p>
            </div>
              </div>

              <button
            onClick={generateIndividualRecommendations}
            disabled={!selectedResident || loading}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
              background: selectedResident && !loading 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : '#9ca3af',
                  color: 'white',
                  fontWeight: 600,
              cursor: selectedResident && !loading ? 'pointer' : 'not-allowed',
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
                Đang phân tích...
                  </>
                ) : (
                  <>
                    <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
                Tạo gợi ý AI
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
                Kết quả gợi ý AI
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
                          {safeRec.priority === 'high' ? 'Ưu tiên cao' : 
                           safeRec.priority === 'medium' ? 'Ưu tiên trung bình' : 'Ưu tiên thấp'}
                          </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {safeRec.difficulty}
                        </span>
                        <span style={{ 
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {safeRec.confidenceLevel}/100
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
                              Thời điểm
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

                    {/* Time of Day */}
                    {safeRec.timeOfDay && (
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
                          <ClockIcon style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                          Thời điểm thực hiện
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
                            {safeRec.timeOfDay}
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            margin: '0.25rem 0 0 0',
                            fontStyle: 'italic'
                          }}>
                           Trợ lý thông minh đã phân tích và đề xuất thời gian phù hợp
                          </p>
                        </div>
                      </div>
                    )}

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

                    {/* Detailed Description */}
                    {safeRec.detailedDescription && (
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
                              // Tạo mô tả ngắn gọn và chuyên nghiệp từ detailedDescription
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
                              
                              // Nếu mô tả quá ngắn hoặc không có ý nghĩa, tạo mô tả mặc định
                              if (!cleanDescription || cleanDescription.length < 20) {
                                return `Hoạt động ${safeRec.activityName} được thiết kế đặc biệt phù hợp với người cao tuổi, giúp cải thiện sức khỏe thể chất và tinh thần một cách an toàn và hiệu quả.`;
                              }
                              
                              // Giới hạn độ dài
                              if (cleanDescription.length > 200) {
                                cleanDescription = cleanDescription.substring(0, 197) + '...';
                              }
                              
                              return cleanDescription;
                            })()}
                          </p>
                        </div>
                      </div>
                    )}

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
                          Độ tin cậy vào trợ lý thông minh
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
                          disabled={createLoading}
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: createLoading ? '#9ca3af' : '#10b981',
                            color: 'white',
                            fontWeight: 600,
                            cursor: createLoading ? 'not-allowed' : 'pointer',
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
                          Tạo hoạt động
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
                          {user?.role === 'staff' ? 'Cần độ tin cậy AI ≥ 60 để tạo' : 'Không có quyền'}
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
              marginBottom: '1rem'
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
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              maxHeight: '400px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              color: '#374151'
            }}>
              {aiResponse}
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
                  Chọn người cao tuổi và nhấn "Tạo gợi ý AI" để nhận được các hoạt động phù hợp
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <NotificationModal
        open={notification.open}
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
