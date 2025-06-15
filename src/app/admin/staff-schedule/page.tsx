"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon, UserIcon, ArrowLeftIcon ,PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface StaffSchedule {
  id: string;
  staffId: string;
  staffName: string;
  position: string;
  date: string;
  startTime: string;
  endTime: string;
  shift: 'morning' | 'afternoon' | 'night';
  location: string;
  department: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  totalHours: number;
  tasks: string[];
  notes?: string;
}

interface Staff {
  id: string;
  name: string;
  position: string;
  department: string;
  available: boolean;
  maxHoursPerWeek: number;
  currentWeekHours: number;
}

export default function AdminStaffSchedulePage() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    staffId: '',
    date: '',
    startTime: '',
    endTime: '',
    shift: 'morning' as const,
    location: '',
    tasks: [] as string[],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    detectConflicts();
  }, [schedules]);

  useEffect(() => {
    console.log('Modal states:', { showNewSchedule });
    // Only hide header for modals, not the main page
    const hasModalOpen = showNewSchedule;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showNewSchedule]);

  const loadData = () => {
    const mockStaff: Staff[] = [
      { id: 'S001', name: 'Nguyễn Văn An', position: 'Y tá trưởng', department: 'Y tế', available: true, maxHoursPerWeek: 40, currentWeekHours: 32 },
      { id: 'S002', name: 'Trần Thị Bình', position: 'Điều dưỡng viên', department: 'Y tế', available: true, maxHoursPerWeek: 40, currentWeekHours: 28 },
      { id: 'S003', name: 'Lê Văn Cường', position: 'Nhân viên xã hội', department: 'Hoạt động', available: true, maxHoursPerWeek: 35, currentWeekHours: 30 }
    ];

    const mockSchedules: StaffSchedule[] = [
      {
        id: 'SCH001',
        staffId: 'S001',
        staffName: 'Nguyễn Văn An',
        position: 'Y tá trưởng',
        date: '2024-01-22',
        startTime: '08:00',
        endTime: '16:00',
        shift: 'morning',
        location: 'Tầng 2 - Khu A',
        department: 'Y tế',
        status: 'confirmed',
        totalHours: 8,
        tasks: ['Đo chỉ số sinh hiệu', 'Phát thuốc', 'Giám sát điều dưỡng'],
        notes: 'Ưu tiên chăm sóc bệnh nhân sau phẫu thuật'
      }
    ];

    setStaff(mockStaff);
    setSchedules(mockSchedules);
  };

  const detectConflicts = () => {
    const detectedConflicts: string[] = [];
    
    schedules.forEach(schedule => {
      const staffMember = staff.find(s => s.id === schedule.staffId);
      if (!staffMember) return;

      // Check overtime
      if (staffMember.currentWeekHours + schedule.totalHours > staffMember.maxHoursPerWeek) {
        detectedConflicts.push(`${schedule.staffName}: Vượt quá giờ làm tối đa (${staffMember.maxHoursPerWeek}h/tuần)`);
      }

      // Check overlaps
      const overlapping = schedules.filter(s => 
        s.id !== schedule.id && 
        s.staffId === schedule.staffId && 
        s.date === schedule.date &&
        isTimeOverlap(s.startTime, s.endTime, schedule.startTime, schedule.endTime)
      );

      if (overlapping.length > 0) {
        detectedConflicts.push(`${schedule.staffName}: Trùng lịch ngày ${schedule.date}`);
      }
    });

    setConflicts(detectedConflicts);
  };

  const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const s1 = parseTime(start1), e1 = parseTime(end1);
    const s2 = parseTime(start2), e2 = parseTime(end2);
    return (s1 < e2 && s2 < e1);
  };

  const handleSubmit = () => {
    if (!formData.staffId || !formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const staffMember = staff.find(s => s.id === formData.staffId);
    if (!staffMember) return;

    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    
    if (start >= end) {
      alert('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const newSchedule: StaffSchedule = {
      id: `SCH${Date.now()}`,
      staffId: formData.staffId,
      staffName: staffMember.name,
      position: staffMember.position,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      shift: formData.shift,
      location: formData.location,
      department: staffMember.department,
      status: 'scheduled',
      totalHours,
      tasks: formData.tasks,
      notes: formData.notes
    };

    setSchedules([...schedules, newSchedule]);
    setShowNewSchedule(false);
    setFormData({
      staffId: '',
      date: '',
      startTime: '',
      endTime: '',
      shift: 'morning',
      location: '',
      tasks: [],
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'confirmed': return '#10b981';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return '#10b981';
      case 'afternoon': return '#f59e0b';
      case 'night': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
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
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 700,
                margin: '0 0 0.5rem 0',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Quản lý Lịch làm việc
              </h1>
              <p style={{ color: '#64748b', margin: 0 }}>
                Lập lịch và quản lý ca làm việc của nhân viên chuyên nghiệp
              </p>
            </div>
            <button
              onClick={() => setShowNewSchedule(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Thêm lịch mới
            </button>
          </div>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                <span style={{ fontWeight: 600, color: '#92400e' }}>
                  Phát hiện {conflicts.length} xung đột lịch làm việc
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                {conflicts.slice(0, 3).map((conflict, index) => (
                  <div key={index}>• {conflict}</div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{schedules.length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tổng lịch làm việc</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {schedules.filter(s => s.status === 'confirmed').length}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Đã xác nhận</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{conflicts.length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Xung đột</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{staff.filter(s => s.available).length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Nhân viên sẵn sàng</div>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
            Danh sách lịch làm việc
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {schedules.map((schedule) => (
              <div key={schedule.id} style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                background: '#f9fafb'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
                        {schedule.staffName}
                      </h3>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {schedule.position} - {schedule.department}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(schedule.status)}20`,
                        color: getStatusColor(schedule.status)
                      }}>
                        {schedule.status === 'scheduled' ? 'Đã lập lịch' : 
                         schedule.status === 'confirmed' ? 'Đã xác nhận' :
                         schedule.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ngày: </span>
                        <span style={{ fontWeight: 600 }}>{new Date(schedule.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Giờ: </span>
                        <span style={{ fontWeight: 600 }}>{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ca: </span>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getShiftColor(schedule.shift)}20`,
                          color: getShiftColor(schedule.shift)
                        }}>
                          {schedule.shift === 'morning' ? 'Sáng' : 
                           schedule.shift === 'afternoon' ? 'Chiều' : 'Đêm'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Địa điểm: </span>
                        <span style={{ fontWeight: 600 }}>{schedule.location}</span>
                      </div>
                    </div>
                    {schedule.tasks.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                          Nhiệm vụ:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {schedule.tasks.map((task, index) => (
                            <span key={index} style={{
                              padding: '0.25rem 0.5rem',
                              background: '#e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              color: '#374151'
                            }}>
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        const newStatus = schedule.status === 'scheduled' ? 'confirmed' : 'scheduled';
                        setSchedules(schedules.map(s => 
                          s.id === schedule.id ? { ...s, status: newStatus } : s
                        ));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: schedule.status === 'scheduled' ? '#10b981' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {schedule.status === 'scheduled' ? 'Xác nhận' : 'Đã xác nhận'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Schedule Modal */}
        {showNewSchedule && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>
                Thêm lịch làm việc mới
              </h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Nhân viên *
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Chọn nhân viên...</option>
                    {staff.filter(s => s.available).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.position} ({s.currentWeekHours}h/{s.maxHoursPerWeek}h)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Ngày *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Ca làm việc
                    </label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="morning">Ca sáng (6:00-14:00)</option>
                      <option value="afternoon">Ca chiều (14:00-22:00)</option>
                      <option value="night">Ca đêm (22:00-6:00)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Giờ bắt đầu *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Giờ kết thúc *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Địa điểm *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="VD: Tầng 2 - Khu A, Phòng khám, Khu sinh hoạt..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú đặc biệt về ca làm việc, yêu cầu chăm sóc..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowNewSchedule(false)}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Thêm lịch làm việc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 