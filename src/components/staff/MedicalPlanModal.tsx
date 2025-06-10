"use client";

import { useState } from 'react';
import { PlusIcon, TrashIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MedicalPlanModalProps {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}

interface AppointmentItem {
  id: string;
  type: string;
  provider: string;
  date: string;
  time: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

export default function MedicalPlanModal({ residentId, residentName, onClose, onComplete }: MedicalPlanModalProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([
    {
      id: Date.now().toString(),
      type: '',
      provider: '',
      date: '',
      time: '',
      notes: '',
      priority: 'medium'
    }
  ]);
  const [planTitle, setPlanTitle] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentTypes = [
    'Khám tổng quát',
    'Khám định kỳ',
    'Khám chuyên khoa tim mạch',
    'Khám chuyên khoa tiêu hóa',
    'Khám chuyên khoa thần kinh',
    'Khám chuyên khoa cơ xương khớp',
    'Khám mắt',
    'Khám răng hàm mặt',
    'Xét nghiệm máu tổng quát',
    'Xét nghiệm sinh hóa',
    'Xét nghiệm nước tiểu',
    'Siêu âm bụng tổng quát',
    'Siêu âm tim',
    'Chụp X-quang ngực',
    'Chụp X-quang cột sống',
    'CT Scan',
    'MRI',
    'Vật lý trị liệu',
    'Tư vấn dinh dưỡng',
    'Tư vấn tâm lý',
    'Kiểm tra huyết áp',
    'Kiểm tra đường huyết',
    'Theo dõi cân nặng'
  ];

  const addAppointment = () => {
    setAppointments([
      ...appointments,
      {
        id: Date.now().toString(),
        type: '',
        provider: '',
        date: '',
        time: '',
        notes: '',
        priority: 'medium'
      }
    ]);
  };

  const removeAppointment = (id: string) => {
    if (appointments.length > 1) {
      setAppointments(appointments.filter(apt => apt.id !== id));
    }
  };

  const updateAppointment = (id: string, field: keyof AppointmentItem, value: string) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, [field]: value } : apt
    ));
  };

  const validateForm = () => {
    if (!planTitle.trim()) return false;
    
    return appointments.every(apt => 
      apt.type.trim() && 
      apt.provider.trim() && 
      apt.date.trim() &&
      apt.time.trim()
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' };
      case 'medium': return { bg: '#fef3c7', border: '#fbbf24', text: '#d97706' };
      case 'low': return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
      default: return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user for staff info
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const staffName = currentUser.name || 'Nhân viên';
      
      // Get existing residents data
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      const residents = savedResidents ? JSON.parse(savedResidents) : [];
      
      // Find and update the resident
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      if (residentIndex !== -1) {
        // Initialize arrays if they don't exist
        if (!residents[residentIndex].appointments) {
          residents[residentIndex].appointments = [];
        }
        if (!residents[residentIndex].medicalPlans) {
          residents[residentIndex].medicalPlans = [];
        }
        if (!residents[residentIndex].careNotes) {
          residents[residentIndex].careNotes = [];
        }

        // Create medical plan record
        const medicalPlan = {
          id: Date.now(),
          title: planTitle,
          createdDate: new Date().toISOString(),
          notes: planNotes,
          createdBy: `${staffName}, Nhân viên chăm sóc`,
          status: 'active',
          appointments: appointments.map(apt => ({
            type: apt.type,
            provider: apt.provider,
            date: apt.date,
            time: apt.time,
            notes: apt.notes,
            priority: apt.priority
          }))
        };

        // Add to medical plans history
        residents[residentIndex].medicalPlans.push(medicalPlan);
        
        // Add appointments to current appointment list
        appointments.forEach(apt => {
          const newAppointment = {
            id: Date.now() + Math.random(),
            type: apt.type,
            provider: apt.provider,
            date: apt.date,
            time: apt.time,
            notes: apt.notes,
            priority: apt.priority,
            status: 'scheduled',
            createdDate: new Date().toISOString(),
            medicalPlanId: medicalPlan.id
          };
          
          residents[residentIndex].appointments.push(newAppointment);
        });

        // Add care note about medical plan
        const planNote = {
          id: Date.now() + 1,
          date: new Date().toISOString().split('T')[0],
          note: `Kế hoạch khám bệnh "${planTitle}" đã được lập với ${appointments.length} cuộc hẹn. ${planNotes}`,
          staff: `${staffName}, Nhân viên chăm sóc`,
          timestamp: new Date().toISOString(),
          type: 'medical_plan'
        };
        
        residents[residentIndex].careNotes.unshift(planNote);
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      }
      
      onComplete();
    } catch (error) {
      console.error('Error creating medical plan:', error);
      alert('Có lỗi xảy ra khi lập kế hoạch khám bệnh. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '800px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <CalendarDaysIcon style={{ width: '1.5rem', height: '1.5rem', color: '#d97706' }} />
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            margin: 0,
            color: '#111827'
          }}>
            Lập kế hoạch khám bệnh - {residentName}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Plan Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Tiêu đề kế hoạch *
            </label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="VD: Khám định kỳ quý I/2024, Khám toàn diện..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            />
          </div>

          {/* Appointments List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Danh sách cuộc hẹn *
              </label>
              <button
                type="button"
                onClick={addAppointment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Thêm cuộc hẹn
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {appointments.map((appointment, index) => {
                const priorityColors = getPriorityColor(appointment.priority);
                
                return (
                  <div
                    key={appointment.id}
                    style={{
                      border: `1px solid ${priorityColors.border}`,
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      backgroundColor: priorityColors.bg
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        margin: 0
                      }}>
                        Cuộc hẹn #{index + 1}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={appointment.priority}
                          onChange={(e) => updateAppointment(appointment.id, 'priority', e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: `1px solid ${priorityColors.border}`,
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="low">Thấp</option>
                          <option value="medium">Trung bình</option>
                          <option value="high">Cao</option>
                        </select>
                        {appointments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAppointment(appointment.id)}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer'
                            }}
                          >
                            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Loại khám *
                        </label>
                        <select
                          value={appointment.type}
                          onChange={(e) => updateAppointment(appointment.id, 'type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                          required
                        >
                          <option value="">Chọn loại khám</option>
                          {appointmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Bác sĩ/Cơ sở *
                        </label>
                        <input
                          type="text"
                          value={appointment.provider}
                          onChange={(e) => updateAppointment(appointment.id, 'provider', e.target.value)}
                          placeholder="VD: BS. Nguyễn Văn A"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Ngày *
                        </label>
                        <input
                          type="date"
                          value={appointment.date}
                          onChange={(e) => updateAppointment(appointment.id, 'date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Giờ *
                        </label>
                        <input
                          type="time"
                          value={appointment.time}
                          onChange={(e) => updateAppointment(appointment.id, 'time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        Ghi chú
                      </label>
                      <textarea
                        value={appointment.notes}
                        onChange={(e) => updateAppointment(appointment.id, 'notes', e.target.value)}
                        rows={2}
                        placeholder="Mục đích, chuẩn bị đặc biệt..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Ghi chú kế hoạch
            </label>
            <textarea
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              rows={3}
              placeholder="Mục tiêu của kế hoạch, những điều cần lưu ý..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '1rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !validateForm()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isSubmitting || !validateForm() ? '#9ca3af' : '#d97706',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isSubmitting || !validateForm() ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu kế hoạch...' : 'Lưu kế hoạch khám bệnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 