"use client";

import { ClipboardIcon, CalendarDaysIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MedicalPlansDisplayProps {
  medicalPlans: any[];
  isStaff?: boolean;
}

export default function MedicalPlansDisplay({ medicalPlans, isStaff = false }: MedicalPlansDisplayProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
      case 'completed': return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
      case 'cancelled': return { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' };
      default: return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang thực hiện';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không rõ';
    }
  };

  if (!medicalPlans || medicalPlans.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <ClipboardIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có kế hoạch khám bệnh nào.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {medicalPlans.map((plan) => {
        const colors = getStatusColor(plan.status);
        
        return (
          <div
            key={plan.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.25rem'
            }}
          >
            {/* Plan Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 0.25rem 0'
                }}>
                  {plan.title}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <UserIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>{plan.createdBy}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>{formatDate(plan.createdDate)}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: colors.text,
                color: 'white',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {getStatusText(plan.status)}
              </span>
            </div>

            {/* Plan Notes */}
            {plan.notes && (
              <div style={{
                fontSize: '0.875rem',
                color: '#374151',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '0.5rem'
              }}>
                <strong>Mục tiêu:</strong> {plan.notes}
              </div>
            )}

            {/* Appointments in Plan */}
            <div>
              <h5 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 0.75rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CalendarDaysIcon style={{ width: '1rem', height: '1rem' }} />
                Các cuộc hẹn ({plan.appointments?.length || 0})
              </h5>
              
              {plan.appointments && plan.appointments.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {plan.appointments.slice(0, 3).map((appointment: any, index: number) => {
                    const appointmentDate = new Date(appointment.date);
                    const now = new Date();
                    const isPast = appointmentDate < now;
                    const isToday = appointmentDate.toDateString() === now.toDateString();
                    
                    return (
                      <div
                        key={index}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '0.5rem',
                          border: `1px solid ${isPast ? '#fca5a5' : isToday ? '#fbbf24' : colors.border}`
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: '#111827'
                            }}>
                              {appointment.type}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              {appointment.provider}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: isPast ? '#dc2626' : isToday ? '#d97706' : '#6b7280',
                            fontWeight: 500,
                            textAlign: 'right'
                          }}>
                            <div>{formatDate(appointment.date)}</div>
                            <div>{appointment.time}</div>
                          </div>
                        </div>
                        
                        {appointment.priority && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            borderRadius: '0.375rem',
                            backgroundColor: appointment.priority === 'high' ? '#fee2e2' : 
                                           appointment.priority === 'medium' ? '#fef3c7' : '#dcfce7',
                            color: appointment.priority === 'high' ? '#dc2626' : 
                                   appointment.priority === 'medium' ? '#d97706' : '#166534'
                          }}>
                            {appointment.priority === 'high' ? 'Cao' : 
                             appointment.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.5rem',
                            fontStyle: 'italic'
                          }}>
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {plan.appointments.length > 3 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textAlign: 'center',
                      padding: '0.5rem'
                    }}>
                      +{plan.appointments.length - 3} cuộc hẹn khác...
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '1rem'
                }}>
                  Chưa có cuộc hẹn nào trong kế hoạch này.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 