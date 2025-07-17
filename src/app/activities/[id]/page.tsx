"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, SparklesIcon, ClipboardDocumentListIcon, UserGroupIcon, ClockIcon, MapPinIcon, UserIcon, CalendarIcon, EyeIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActivities } from '@/lib/contexts/activities-context';
import { useResidents } from '@/lib/contexts/residents-context';
import { activitiesAPI, activityParticipationsAPI } from '@/lib/api';

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getActivityById, updateActivity } = useActivities();
  const { residents } = useResidents();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participations, setParticipations] = useState<any[]>([]);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<{[key: string]: {participated: boolean, reason?: string}}>({});
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const activityId = params.id; // KHÔNG parseInt
        // Lấy từ context trước cho nhanh
        const contextActivity = getActivityById(activityId);
        if (contextActivity) {
          setActivity(mapActivity(contextActivity));
        }
        // Luôn gọi API để lấy dữ liệu mới nhất
        const apiActivity = await activitiesAPI.getById(activityId);
        if (apiActivity) {
          setActivity(mapActivity(apiActivity));
          // Nếu dữ liệu API khác context, có thể cập nhật lại context (nếu muốn)
          // updateActivity(activityId, apiActivity); // Nếu muốn đồng bộ context
        } else {
          router.push('/activities');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
        router.push('/activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [params, getActivityById, router]);

  // Fetch participations for this activity
  useEffect(() => {
    const fetchParticipations = async () => {
      if (!activity?.id) return;
      
      try {
        const participationsData = await activityParticipationsAPI.getAll({
          activityId: activity.id
        });
        console.log('Fetched participations:', participationsData);
        console.log('Available residents:', residents);
        setParticipations(participationsData);
        
        // Initialize evaluations from existing participations
        // Handle the nested residentId object structure from API
        const initialEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
        participationsData.forEach((participation: any) => {
          // Extract residentId from the nested object structure
          const residentId = participation.residentId?._id || participation.residentId;
          const participated = participation.attendanceStatus === 'attended';
          const reason = participation.performanceNotes || '';
          
          if (residentId) {
            console.log('Processing participation for residentId:', residentId);
            // Map API residentId to residents context ID
            // Now both use string IDs
            const matchingResident = residents.find(r => r.id === residentId);
            console.log('Matching resident found by ID:', matchingResident);
            
            // If no match by ID, try to match by name from API
            if (!matchingResident && participation.residentId?.fullName) {
              const matchingResidentByName = residents.find(r => 
                r.name.toLowerCase() === participation.residentId.fullName.toLowerCase()
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
              console.log('No matching resident found for ID:', residentId, 'or name:', participation.residentId?.fullName);
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

  // Map API/context data về đúng format cho component
  const mapActivity = (apiActivity: any) => ({
    id: apiActivity._id,
    name: apiActivity.activityName || apiActivity.name || '',
    description: apiActivity.description || '',
    category: getCategoryLabel(apiActivity.category || 'physical'), // Default to physical if not provided
    scheduledTime: apiActivity.scheduleTime ? new Date(apiActivity.scheduleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
    startTime: apiActivity.scheduleTime ? new Date(apiActivity.scheduleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
    endTime: apiActivity.scheduleTime && apiActivity.duration ? 
      new Date(new Date(apiActivity.scheduleTime).getTime() + apiActivity.duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
    duration: apiActivity.duration || 0,
    date: apiActivity.scheduleTime ? new Date(apiActivity.scheduleTime).toISOString().split('T')[0] : '',
    location: apiActivity.location || '',
    capacity: apiActivity.capacity || 0,
    participants: apiActivity.participants || 0,
    facilitator: apiActivity.facilitator || 'Chưa phân công',
    status: apiActivity.status || 'Đã lên lịch',
    level: apiActivity.level || 'Trung bình',
    recurring: getRecurringLabel(apiActivity.recurring || 'none'),
    materials: apiActivity.materials || '',
    specialNotes: apiActivity.specialNotes || '',
    ageGroupSuitability: apiActivity.ageGroupSuitability || ['Người cao tuổi'],
    healthRequirements: apiActivity.healthRequirements || ['Không có yêu cầu đặc biệt'],
    createdAt: apiActivity.created_at || apiActivity.createdAt || '',
    updatedAt: apiActivity.updated_at || apiActivity.updatedAt || '',
    residentEvaluations: apiActivity.residentEvaluations || [],
    // Additional fields for display
    benefits: ['Cải thiện sức khỏe', 'Tăng cường tinh thần', 'Giao lưu xã hội'],
    notes: apiActivity.specialNotes || 'Không có ghi chú đặc biệt.',
  });

  // Helper functions for data mapping
  const getCategoryLabel = (categoryId: string) => {
    const categoryMap: { [key: string]: string } = {
      'physical': 'Thể chất',
      'creative': 'Sáng tạo', 
      'therapy': 'Trị liệu',
      'cognitive': 'Nhận thức',
      'social': 'Xã hội',
      'educational': 'Giáo dục'
    };
    return categoryMap[categoryId] || categoryId;
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
    const newEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
    residents.forEach(resident => {
      newEvaluations[resident.id] = {
        participated,
        reason: participated ? '' : 'Không có lý do cụ thể'
      };
    });
    setEvaluations(newEvaluations);
  };

  const handleSaveEvaluations = async () => {
    if (!activity?.id) return;
    
    setSaving(true);
    try {
      // Update or create participations for each resident
      for (const [residentId, evaluation] of Object.entries(evaluations)) {
        // Find existing participation by matching residentId._id
        const existingParticipation = participations.find(p => 
          (p.residentId?._id || p.residentId) === residentId
        );
        
        if (existingParticipation) {
          // Update existing participation
          await activityParticipationsAPI.update(existingParticipation._id, {
            attendanceStatus: evaluation.participated ? 'attended' : 'absent',
            performanceNotes: evaluation.participated ? 
              'Tham gia tích cực' : 
              (evaluation.reason || 'Không có lý do cụ thể')
          });
        } else {
          // Create new participation
          // Find the resident to get their API ID
          const resident = residents.find(r => r.id === residentId);
          if (resident) {
            // Use the resident's actual ID
            await activityParticipationsAPI.create({
              activityId: activity.id,
              residentId: resident.id, // Use actual resident ID
              date: new Date().toISOString().split('T')[0], // Today's date
              attendanceStatus: evaluation.participated ? 'attended' : 'absent',
              performanceNotes: evaluation.participated ? 
                'Tham gia tích cực' : 
                (evaluation.reason || 'Không có lý do cụ thể'),
              approvalStatus: 'pending'
            });
          }
        }
      }
      
      // Refresh participations
      const participationsData = await activityParticipationsAPI.getAll({
        activityId: activity.id
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

  // Filter residents based on search term
  const filteredResidents = residents.filter(resident =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.room?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        Đang tải thông tin hoạt động...
        </div>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{fontSize: '1.5rem', marginBottom: '1rem', color: '#374151'}}>Không tìm thấy hoạt động</h2>
          <Link href="/activities" style={{
            color: '#6366f1',
            textDecoration: 'none',
            fontWeight: 600,
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: '#eef2ff',
            display: 'inline-block'
          }}>
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
                  <span>{activity.participants || 0}/{activity.capacity} người</span>
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
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Sức chứa:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.capacity} người
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
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Đã đăng ký:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                    {activity.participants || 0} người 
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        background: (activity.participants || 0) >= activity.capacity ? '#fef2f2' : '#f0fdf4',
                        color: (activity.participants || 0) >= activity.capacity ? '#dc2626' : '#16a34a'
                      }}>
                        {(activity.participants || 0) >= activity.capacity ? 'Đầy' : `Còn ${activity.capacity - (activity.participants || 0)} chỗ`}
                      </span>
                    </div>
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
              </h3>
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
                     const evaluation = evaluations[resident.id] || { participated: false, reason: '' };
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
                      </div>
                    );
                  })}
                  {filteredResidents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      Không tìm thấy cư dân nào.
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
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
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
                    </tr>
                  </thead>
                  <tbody>
                    {participations.map((participation) => {
                      // Extract residentId from the nested object structure
                      const residentId = participation.residentId?._id || participation.residentId;
                      const resident = residents.find(r => r.id === residentId);
                      const participated = participation.attendanceStatus === 'attended';
                      
                      return (
                        <tr key={participation._id} style={{ background: participated ? '#f0fdf4' : '#fef2f2' }}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>
                            {resident ? resident.name : (participation.residentId?.fullName || 'Cư dân #' + residentId)}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: participated ? '#10b981' : '#dc2626', fontWeight: 600 }}>
                            {participated ? 'Có' : 'Không'}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                            {!participated ? (participation.performanceNotes || <span style={{ color: '#f59e0b' }}>Chưa nhập lý do</span>) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {participations.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                          Chưa có đánh giá tham gia nào.
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
    </div>
  );
} 