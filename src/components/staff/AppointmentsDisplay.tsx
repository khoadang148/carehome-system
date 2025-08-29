"use client";

import { CalendarDaysIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface AppointmentsDisplayProps {
  appointments: any[];
  isStaff?: boolean;
}

export default function AppointmentsDisplay({ appointments, isStaff = false }: AppointmentsDisplayProps) {
  
  const formatDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    let dateText = '';
    if (appointmentDay.getTime() === today.getTime()) {
      dateText = 'Hôm nay';
    } else if (appointmentDay.getTime() === tomorrow.getTime()) {
      dateText = 'Ngày mai';
    } else {
      dateText = appointmentDate.toLocaleDateString('vi-VN');
    }
    
    return `${dateText} lúc ${time}`;
  };

  const getAppointmentStatus = (date: string, time: string) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (appointmentDateTime < now) return 'completed';
    
    const timeDiff = appointmentDateTime.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) return 'upcoming';
    if (daysDiff <= 7) return 'thisweek';
    return 'future';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return { bg: '#fef3c7', border: '#fbbf24', text: '#d97706' };
      case 'thisweek': return { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
      case 'completed': return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
      case 'future': return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
      default: return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'thisweek': return 'Tuần này';
      case 'completed': return 'Đã hoàn thành';
      case 'future': return 'Tương lai';
      default: return '';
    }
  };

  const getAppointmentTypeIcon = (type: string) => {
    if (type.includes('bác sĩ') || type.includes('khám')) return '🩺';
    if (type.includes('vật lý') || type.includes('trị liệu')) return '🏃‍♂️';
    if (type.includes('mắt')) return '👁️';
    if (type.includes('răng')) return '🦷';
    if (type.includes('xét nghiệm')) return '🧪';
    if (type.includes('X-quang') || type.includes('chụp')) return '📸';
    return '📅';
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <CalendarDaysIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có lịch hẹn nào.</p>
      </div>
    );
  }

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sortedAppointments.map((appointment) => {
        const status = getAppointmentStatus(appointment.date, appointment.time);
        const colors = getStatusColor(status);
        
        return (
          <div
            key={appointment.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '2rem',
                marginTop: '0.25rem'
              }}>
                {getAppointmentTypeIcon(appointment.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {appointment.type}
                    </h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>
                      <UserIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>{appointment.provider}</span>
                    </div>
                  </div>

                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: colors.text,
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {getStatusText(status)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: colors.text,
                  fontWeight: 500,
                  marginBottom: '0.75rem'
                }}>
                  <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                  <span>{formatDateTime(appointment.date, appointment.time)}</span>
                </div>

                {appointment.notes && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    <strong>Ghi chú:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            </div>
                  
            {status === 'upcoming' && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                width: '0.75rem',
                height: '0.75rem',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
} 
