"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  BellIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface WorkShift {
  id: number;
  date: string;
  shiftType: 'morning' | 'afternoon' | 'night';
  startTime: string;
  endTime: string;
  location: string;
  assignedResidents: string[];
  tasks: string[];
  notes?: string;
  status: 'upcoming' | 'current' | 'completed';
  colleague?: string;
}

const MOCK_SCHEDULE: WorkShift[] = [
  {
    id: 1,
    date: '2024-01-15',
    shiftType: 'morning',
    startTime: '06:00',
    endTime: '14:00',
    location: 'Tầng 2 - Khu A',
    assignedResidents: ['Trần Văn Nam', 'Lê Thị Hoa', 'Nguyễn Văn Bình'],
    tasks: ['Kiểm tra sức khỏe buổi sáng', 'Hỗ trợ ăn sáng', 'Tập vật lý trị liệu'],
    notes: 'Chú ý theo dõi huyết áp của cô Hoa',
    status: 'upcoming'
  },
  {
    id: 2,
    date: '2024-01-15',
    shiftType: 'afternoon',
    startTime: '14:00',
    endTime: '22:00',
    location: 'Tầng 1 - Khu B',
    assignedResidents: ['Phạm Thị Mai', 'Đỗ Văn Tùng'],
    tasks: ['Hỗ trợ ăn trưa', 'Sinh hoạt giải trí', 'Kiểm tra thuốc chiều'],
    colleague: 'Nguyễn Thị Lan',
    status: 'current'
  },
  {
    id: 3,
    date: '2024-01-14',
    shiftType: 'morning',
    startTime: '06:00',
    endTime: '14:00',
    location: 'Tầng 2 - Khu A',
    assignedResidents: ['Trần Văn Nam', 'Lê Thị Hoa'],
    tasks: ['Kiểm tra sức khỏe buổi sáng', 'Hỗ trợ ăn sáng', 'Đưa đi khám'],
    status: 'completed'
  },
  {
    id: 4,
    date: '2024-01-16',
    shiftType: 'night',
    startTime: '22:00',
    endTime: '06:00',
    location: 'Tầng 1-2',
    assignedResidents: ['Toàn bộ khu vực'],
    tasks: ['Kiểm tra an toàn đêm', 'Hỗ trợ khẩn cấp nếu có'],
    status: 'upcoming'
  }
];

export default function WorkSchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<WorkShift[]>(MOCK_SCHEDULE);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, -1 = last week

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case 'morning': return 'Ca sáng';
      case 'afternoon': return 'Ca chiều';
      case 'night': return 'Ca đêm';
      default: return shiftType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'current':
        return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' };
      case 'upcoming':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
    }
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'morning': return '#f59e0b';
      case 'afternoon': return '#3b82f6';
      case 'night': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Get current week's dates
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(selectedWeek);

  // Filter schedule for current week
  const weekSchedule = schedule.filter(shift => {
    const shiftDate = new Date(shift.date);
    return weekDates.some(date => 
      date.toDateString() === shiftDate.toDateString()
    );
  });

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    return weekSchedule.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const getDayLabel = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => direction === 'next' ? prev + 1 : prev - 1);
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
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <CalendarDaysIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Lịch làm việc
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Xem lịch trình cá nhân của {user?.name || 'bạn'}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: '0.5rem 0 0 0',
                  fontWeight: 500
                }}>
                  Hôm nay: {new Date().toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => navigateWeek('prev')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Tuần trước
            </button>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                margin: '0 0 0.25rem 0'
              }}>
                {selectedWeek === 0 && 'Tuần này'}
                {selectedWeek === 1 && 'Tuần sau'}
                {selectedWeek === -1 && 'Tuần trước'}
                {Math.abs(selectedWeek) > 1 && `${selectedWeek > 0 ? '+' : ''}${selectedWeek} tuần`}
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0,
                fontWeight: 500
              }}>
                {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
              </p>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Tuần sau
              <ChevronRightIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>

          {/* Week Calendar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1rem'
          }}>
            {weekDates.map((date, index) => {
              const shifts = getShiftsForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={index}
                  style={{
                    background: today ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f8fafc',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: today ? 'none' : '1px solid #e2e8f0',
                    color: today ? 'white' : '#374151',
                    minHeight: '120px'
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      opacity: today ? 1 : 0.7,
                      marginBottom: '0.25rem'
                    }}>
                      {getDayLabel(date)}
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 700
                    }}>
                      {date.getDate()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {shifts.map((shift, shiftIndex) => (
                      <div
                        key={shiftIndex}
                        style={{
                          background: today ? 'rgba(255, 255, 255, 0.2)' : getShiftColor(shift.shiftType),
                          color: today ? 'white' : 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        {getShiftTypeLabel(shift.shiftType)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {weekSchedule
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((shift) => {
              const statusColor = getStatusColor(shift.status);
              const shiftColor = getShiftColor(shift.shiftType);

              return (
                <div
                  key={shift.id}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827',
                        margin: '0 0 0.25rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '0.75rem',
                          height: '0.75rem',
                          borderRadius: '50%',
                          background: shiftColor
                        }} />
                        {getShiftTypeLabel(shift.shiftType)}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <CalendarDaysIcon style={{ width: '1rem', height: '1rem' }} />
                        {new Date(shift.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: statusColor.bg,
                      color: statusColor.text,
                      border: `1px solid ${statusColor.border}`
                    }}>
                      {shift.status === 'completed' && 'Đã hoàn thành'}
                      {shift.status === 'current' && 'Đang diễn ra'}
                      {shift.status === 'upcoming' && 'Sắp tới'}
                    </div>
                  </div>

                  {/* Time & Location */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>{shift.location}</span>
                    </div>
                  </div>

                  {/* Colleague */}
                  {shift.colleague && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <UserIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>Cùng ca: {shift.colleague}</span>
                    </div>
                  )}

                  {/* Assigned Residents */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 0.5rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <UserGroupIcon style={{ width: '1rem', height: '1rem' }} />
                      Người cao tuổi được phân công ({shift.assignedResidents.length})
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.25rem'
                    }}>
                      {shift.assignedResidents.map((resident, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          {resident}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 0.5rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                      Nhiệm vụ chính
                    </h4>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: 1.6
                    }}>
                      {shift.tasks.map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Notes */}
                  {shift.notes && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      borderLeft: '3px solid #f59e0b'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#d97706',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <InformationCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        Ghi chú đặc biệt
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#374151',
                        margin: 0,
                        lineHeight: 1.5
                      }}>
                        {shift.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {weekSchedule.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <CalendarDaysIcon style={{
              width: '4rem',
              height: '4rem',
              color: '#d1d5db',
              margin: '0 auto 1rem'
            }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Không có ca làm việc nào
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Tuần này bạn không có ca làm việc nào được phân công
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
