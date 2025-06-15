"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { useRouter } from 'next/navigation';

interface Schedule {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  shift: 'morning' | 'afternoon' | 'night';
  department: string;
  location: string;
  role: string;
  status: 'scheduled' | 'completed' | 'absent' | 'late';
  notes?: string;
  supervisor: string;
  totalHours: number;
  overtimeHours?: number;
  breakTime: number;
  tasks: string[];
}

interface MonthlyStats {
  totalHours: number;
  overtimeHours: number;
  scheduledDays: number;
  completedDays: number;
  absentDays: number;
  lateDays: number;
}

export default function StaffSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadSchedules();
  }, [currentDate]);

  const loadSchedules = () => {
    // Mock data - trong thực tế sẽ load từ API
    const mockSchedules: Schedule[] = [
      {
        id: 1,
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '16:00',
        shift: 'morning',
        department: 'Y tế',
        location: 'Tầng 2 - Khu A',
        role: 'Y tá trưởng',
        status: 'scheduled',
        supervisor: 'Trưởng khoa Y tế',
        totalHours: 8,
        breakTime: 1,
        tasks: ['Đo chỉ số sinh hiệu', 'Phát thuốc', 'Ghi chú chăm sóc']
      },
      {
        id: 2,
        date: '2024-01-16',
        startTime: '16:00',
        endTime: '00:00',
        shift: 'afternoon',
        department: 'Y tế',
        location: 'Tầng 2 - Khu A',
        role: 'Y tá trưởng',
        status: 'scheduled',
        supervisor: 'Trưởng ca chiều',
        totalHours: 8,
        breakTime: 1,
        tasks: ['Chăm sóc tối', 'Kiểm tra an toàn', 'Báo cáo ca']
      },
      {
        id: 3,
        date: '2024-01-14',
        startTime: '08:00',
        endTime: '17:00',
        shift: 'morning',
        department: 'Y tế',
        location: 'Tầng 2 - Khu A',
        role: 'Y tá trưởng',
        status: 'completed',
        supervisor: 'Trưởng khoa Y tế',
        totalHours: 8,
        overtimeHours: 1,
        breakTime: 1,
        tasks: ['Đo chỉ số sinh hiệu', 'Phát thuốc', 'Xử lý khẩn cấp'],
        notes: 'Làm thêm 1 giờ do xử lý tình huống khẩn cấp'
      },
      {
        id: 4,
        date: '2024-01-13',
        startTime: '08:00',
        endTime: '16:00',
        shift: 'morning',
        department: 'Y tế',
        location: 'Tầng 2 - Khu A',
        role: 'Y tá trưởng',
        status: 'late',
        supervisor: 'Trưởng khoa Y tế',
        totalHours: 7.5,
        breakTime: 1,
        tasks: ['Đo chỉ số sinh hiệu', 'Phát thuốc', 'Ghi chú chăm sóc'],
        notes: 'Đến muộn 30 phút do tắc đường'
      },
      {
        id: 5,
        date: '2024-01-17',
        startTime: '00:00',
        endTime: '08:00',
        shift: 'night',
        department: 'Y tế',
        location: 'Tầng 2 - Khu A',
        role: 'Y tá trưởng',
        status: 'scheduled',
        supervisor: 'Trưởng ca đêm',
        totalHours: 8,
        breakTime: 1,
        tasks: ['Chăm sóc đêm', 'Kiểm tra định kỳ', 'Báo cáo sáng']
      }
    ];

    const mockStats: MonthlyStats = {
      totalHours: 168,
      overtimeHours: 3,
      scheduledDays: 22,
      completedDays: 18,
      absentDays: 1,
      lateDays: 2
    };
    
    setSchedules(mockSchedules);
    setMonthlyStats(mockStats);
    setLoading(false);
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return '#10b981';
      case 'afternoon': return '#f59e0b';
      case 'night': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getShiftText = (shift: string) => {
    switch (shift) {
      case 'morning': return 'Ca sáng';
      case 'afternoon': return 'Ca chiều';
      case 'night': return 'Ca đêm';
      default: return shift;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'completed': return 'Hoàn thành';
      case 'absent': return 'Vắng mặt';
      case 'late': return 'Đi muộn';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <CalendarDaysIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Lịch Làm Việc
                </h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Xem lịch trình ca làm việc và nhiệm vụ được phân công
              </p>
      </div>
      
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                background: '#f3f4f6',
                borderRadius: '0.5rem',
                padding: '0.25rem'
              }}>
            <button 
                  onClick={() => setViewMode('week')}
              style={{
                    padding: '0.5rem 1rem',
                    background: viewMode === 'week' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: viewMode === 'week' ? '#1f2937' : '#6b7280',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'week' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Tuần
            </button>
            <button 
                  onClick={() => setViewMode('month')}
              style={{
                    padding: '0.5rem 1rem',
                    background: viewMode === 'month' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: viewMode === 'month' ? '#1f2937' : '#6b7280',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'month' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Tháng
            </button>
          </div>
          
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => navigateMonth('prev')}
                  style={{
                    padding: '0.5rem',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1f2937',
                  margin: 0,
                  minWidth: '150px',
                  textAlign: 'center'
                }}>
                  {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
              style={{
                padding: '0.5rem',
                    background: 'white',
                border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Monthly Statistics */}
        {monthlyStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #3b82f620'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Tổng giờ làm</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                    {monthlyStats.totalHours}h
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #f59e0b20'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Giờ làm thêm</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                    {monthlyStats.overtimeHours}h
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #10b98120'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Ngày hoàn thành</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                    {monthlyStats.completedDays}/{monthlyStats.scheduledDays}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #ef444420'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đi muộn/Vắng</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                    {monthlyStats.lateDays + monthlyStats.absentDays}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule View */}
        {viewMode === 'week' ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1rem'
            }}>
              {getWeekDates().map((date, index) => {
                const daySchedules = getScheduleForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={index} style={{
                    border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    background: isToday ? '#f0f9ff' : '#f9fafb',
                    minHeight: '200px'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                      </p>
                      <p style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: isToday ? '#3b82f6' : '#1f2937',
                        margin: 0
                      }}>
                        {date.getDate()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {daySchedules.map((schedule) => (
                        <div key={schedule.id} style={{
                          padding: '0.75rem',
                          background: 'white',
                          borderRadius: '0.5rem',
                          border: `2px solid ${getShiftColor(schedule.shift)}20`,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem'
                          }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                              background: `${getShiftColor(schedule.shift)}20`,
                              color: getShiftColor(schedule.shift)
                            }}>
                              {getShiftText(schedule.shift)}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                              background: `${getStatusColor(schedule.status)}20`,
                              color: getStatusColor(schedule.status)
                            }}>
                              {getStatusText(schedule.status)}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.875rem',
                            margin: '0 0 0.5rem 0',
                            color: '#1f2937',
                            fontWeight: 600
                          }}>
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            {schedule.location}
                          </p>
                        </div>
                      ))}
                      
                      {daySchedules.length === 0 && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#9ca3af',
                          textAlign: 'center',
                          fontStyle: 'italic',
                          margin: 0
                        }}>
                          Không có lịch
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {schedules.map((schedule) => (
                <div key={schedule.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2rem',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: `2px solid ${getStatusColor(schedule.status)}20`
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {formatDate(schedule.date)}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getShiftColor(schedule.shift)}20`,
                        color: getShiftColor(schedule.shift)
                      }}>
                        {getShiftText(schedule.shift)}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(schedule.status)}20`,
                        color: getStatusColor(schedule.status)
                      }}>
                        {getStatusText(schedule.status)}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Thời gian
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Địa điểm
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {schedule.location}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Giám sát viên
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {schedule.supervisor}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Tổng giờ
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {schedule.totalHours}h
                          {schedule.overtimeHours && (
                            <span style={{ color: '#f59e0b' }}>
                              {' '}(+{schedule.overtimeHours}h thêm)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {schedule.tasks && schedule.tasks.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.5rem 0'
                        }}>
                          Nhiệm vụ chính:
                        </p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {schedule.tasks.map((task, index) => (
                            <span key={index} style={{
                              padding: '0.25rem 0.5rem',
                              background: '#e0e7ff',
                              color: '#3730a3',
                            borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {schedule.notes && (
                      <div style={{
                        padding: '0.75rem',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '0.5rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#92400e',
                          margin: 0
                        }}>
                          <strong>Ghi chú:</strong> {schedule.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <ClockIcon style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        color: '#3b82f6',
                        margin: '0 auto 0.5rem'
                      }} />
                      <p style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {schedule.totalHours}h
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        Tổng thời gian
                      </p>
                    </div>

                    {schedule.status === 'completed' && (
                      <CheckCircleIcon style={{
                        width: '2rem',
                        height: '2rem',
                        color: '#10b981'
                      }} />
                    )}
                  </div>
                </div>
              ))}
      </div>
      
            {schedules.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem'
              }}>
                <CalendarDaysIcon style={{
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  color: '#d1d5db'
                }} />
                <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                  Không có lịch làm việc
                </p>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                  Lịch làm việc sẽ được cập nhật bởi quản lý
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
