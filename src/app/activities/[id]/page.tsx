"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, UserGroupIcon, ClockIcon, MapPinIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useActivities } from '@/lib/contexts/activities-context';

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { getActivityById } = useActivities();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const resolvedParams = await params;
        const activityId = parseInt(resolvedParams.id);
        
        // Get activity from context
        const contextActivity = getActivityById(activityId);
        
        if (contextActivity) {
          // Map context data to match component expectations
          const mappedActivity = {
            ...contextActivity,
            category: getCategoryLabel(contextActivity.category),
            scheduledTime: formatTime(contextActivity.startTime),
            endTime: formatTime(contextActivity.endTime),
            recurring: getRecurringLabel(contextActivity.recurring),
            // Add default values for fields that might not exist
            participants: contextActivity.participants || [],
            materials: contextActivity.materials ? contextActivity.materials.split(', ') : [],
            benefits: ['Cải thiện sức khỏe', 'Tăng cường tinh thần', 'Giao lưu xã hội'],
            notes: contextActivity.specialNotes || 'Không có ghi chú đặc biệt.'
          };
          setActivity(mappedActivity);
        } else {
          // If no activity found in context, redirect to activities list
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

  const formatTime = (time: string) => {
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
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Chi tiết hoạt động
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Thông tin đầy đủ về chương trình sinh hoạt
                </p>
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
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                  fontWeight: 700, 
                  margin: '0 0 0.75rem 0',
                  lineHeight: 1.2
                }}>
                  {activity.name}
                </h2>
                <p style={{
                  fontSize: '1.125rem', 
                  margin: 0, 
                  opacity: 0.95,
                  lineHeight: 1.5
                }}>
                {activity.description}
              </p>
              </div>
              <div style={{
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.5rem', 
                marginLeft: '1.5rem',
                alignItems: 'flex-end'
              }}>
                {renderCategory(activity.category)}
                {renderStatus(activity.status)}
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
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)'
              }}>
                <CalendarIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <span>{new Date(activity.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)'
              }}>
                <ClockIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <span>{activity.scheduledTime} - {activity.endTime}</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)'
              }}>
                <MapPinIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <span>{activity.location}</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)'
              }}>
                <UserGroupIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <span>{activity.participants?.length || 0}/{activity.capacity} người</span>
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
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Lặp lại:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.recurring}
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
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Mức độ:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.level}
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
                    {activity.participants?.length || 0} người 
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        background: (activity.participants?.length || 0) >= activity.capacity ? '#fef2f2' : '#f0fdf4',
                        color: (activity.participants?.length || 0) >= activity.capacity ? '#dc2626' : '#16a34a'
                      }}>
                        {(activity.participants?.length || 0) >= activity.capacity ? 'Đầy' : `Còn ${activity.capacity - (activity.participants?.length || 0)} chỗ`}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Người hướng dẫn:</span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#111827', 
                      fontWeight: 600,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem' 
                    }}>
                      <UserIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6366f1' }} />
                      {activity.facilitator}
                    </span>
                </div>
              </div>
            </div>
            
            {/* Benefits & Materials */}
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
                  marginBottom: '1.25rem'
                }}>
                Lợi ích & Dụng cụ
              </h3>
              
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#374151', 
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ✨ Lợi ích
                </h4>
                    <div style={{
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {activity.benefits?.map((benefit: string, index: number) => (
                          <li key={index} style={{
                            fontSize: '0.875rem', 
                            color: '#6b7280', 
                            marginBottom: '0.5rem',
                            lineHeight: 1.5
                          }}>
                            {benefit}
                          </li>
                        )) || <li style={{ fontSize: '0.875rem', color: '#6b7280' }}>Chưa có thông tin</li>}
                </ul>
                    </div>
              </div>
              
              <div>
                    <h4 style={{
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#374151', 
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🛠️ Dụng cụ cần thiết
                </h4>
                    <div style={{
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {activity.materials?.map((material: string, index: number) => (
                          <li key={index} style={{
                            fontSize: '0.875rem', 
                            color: '#6b7280', 
                            marginBottom: '0.5rem',
                            lineHeight: 1.5
                          }}>
                            {material}
                          </li>
                        )) || <li style={{ fontSize: '0.875rem', color: '#6b7280' }}>Chưa có thông tin</li>}
                </ul>
                    </div>
                  </div>
                </div>
            </div>
          </div>
          
          {/* Participants List */}
            {activity.participants && activity.participants.length > 0 && (
              <div style={{
                marginTop: '1.5rem',
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
                  marginBottom: '1.25rem'
                }}>
                  👥 Danh sách tham gia ({activity.participants.length}/{activity.capacity})
            </h3>
            
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                  gap: '0.75rem'
                }}>
                  {activity.participants.map((participant: string, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem',
                      background: '#f9fafb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb'
                    }}>
                      <UserIcon style={{ width: '1rem', height: '1rem', color: '#6366f1' }} />
                      {participant}
                    </div>
                  ))}
                </div>
                </div>
              )}
          
          {/* Notes Section */}
          {activity.notes && (
              <div style={{
                marginTop: '1.5rem',
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
                  marginBottom: '1rem'
                }}>
                  📝 Ghi chú
              </h3>
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: 0, 
                    lineHeight: 1.6
                  }}>
                    {activity.notes}
                  </p>
                </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
} 