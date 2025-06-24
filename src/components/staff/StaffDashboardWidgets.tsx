"use client";

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MedicationReminder {
  residentName: string;
  medication: string;
  time: string;
  status: 'overdue' | 'due' | 'upcoming';
}

interface UpcomingAppointment {
  residentName: string;
  type: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface HighPriorityNote {
  residentName: string;
  note: string;
  timestamp: string;
  priority: string;
}

export default function StaffDashboardWidgets() {
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [highPriorityNotes, setHighPriorityNotes] = useState<HighPriorityNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDashboardData();
    
    // Lắng nghe sự kiện cập nhật từ localStorage
    const handleStorageChange = () => {
      loadDashboardData();
    };
    
    // Lắng nghe sự kiện tùy chỉnh để refresh
    const handleDataUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    // Auto-refresh mỗi 30 giây
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [refreshKey]);

  const loadDashboardData = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (!savedResidents) return;

      const residents = JSON.parse(savedResidents);
      const today = new Date();
      
      // Calculate medication reminders
      const reminders: MedicationReminder[] = [];
      
      residents.forEach((resident: any) => {
        if (resident.medications_detail && Array.isArray(resident.medications_detail)) {
          resident.medications_detail.forEach((med: any) => {
            if (med.schedule && Array.isArray(med.schedule)) {
              med.schedule.forEach((time: string) => {
                const [hours, minutes] = time.split(':').map(Number);
                const medicationTime = new Date(today);
                medicationTime.setHours(hours, minutes, 0, 0);
                
                const timeDiff = medicationTime.getTime() - today.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                let status: 'overdue' | 'due' | 'upcoming' = 'upcoming';
                if (hoursDiff < -1) status = 'overdue';
                else if (hoursDiff <= 1) status = 'due';
                
                if (hoursDiff > -24 && hoursDiff < 8) { // Show reminders from 24 hours ago to 8 hours ahead
                  reminders.push({
                    residentName: resident.name,
                    medication: med.name,
                    time: time,
                    status
                  });
                }
              });
            }
          });
        }
      });

      // Sort by urgency
      reminders.sort((a, b) => {
        const priority = { overdue: 0, due: 1, upcoming: 2 };
        return priority[a.status] - priority[b.status];
      });

      setMedicationReminders(reminders.slice(0, 8));

      // Calculate upcoming appointments
      const appointments: UpcomingAppointment[] = [];
      
      residents.forEach((resident: any) => {
        if (resident.appointments && Array.isArray(resident.appointments)) {
          resident.appointments.forEach((apt: any) => {
            const aptDate = new Date(apt.date + ' ' + apt.time);
            const timeDiff = aptDate.getTime() - today.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff > -24 && hoursDiff <= 168) { // Past 24 hours to next 7 days (168 hours)
              // Determine status based on time
              let status = 'upcoming';
              if (hoursDiff < 0) status = 'completed';
              else if (hoursDiff <= 2) status = 'due';
              
              appointments.push({
                residentName: resident.name,
                type: apt.type,
                time: `${apt.date ? new Date(apt.date).toLocaleDateString('vi-VN') : ''} ${apt.time}`,
                priority: apt.priority || 'medium'
              });
            }
          });
        }
      });

      appointments.sort((a, b) => {
        // First sort by time (upcoming appointments first)
        const timeA = new Date(a.time.includes('/') ? a.time : `${today.toDateString()} ${a.time}`);
        const timeB = new Date(b.time.includes('/') ? b.time : `${today.toDateString()} ${b.time}`);
        const timeDiff = timeA.getTime() - timeB.getTime();
        
        // If times are close (within 6 hours), sort by priority
        if (Math.abs(timeDiff) < 6 * 60 * 60 * 1000) {
          const priority = { high: 0, medium: 1, low: 2 };
          return priority[a.priority] - priority[b.priority];
        }
        
        return timeDiff;
      });

      setUpcomingAppointments(appointments.slice(0, 6));

      // Calculate high priority care notes
      const notes: HighPriorityNote[] = [];
      
      residents.forEach((resident: any) => {
        if (resident.careNotes && Array.isArray(resident.careNotes)) {
          resident.careNotes.forEach((note: any) => {
            // Show notes that have high priority OR contain important keywords OR are recent (within 24h)
            const noteDate = new Date(note.timestamp || note.date);
            const hoursOld = (today.getTime() - noteDate.getTime()) / (1000 * 60 * 60);
            
            const hasImportantKeywords = note.note && (
              note.note.toLowerCase().includes('khẩn cấp') ||
              note.note.toLowerCase().includes('theo dõi') ||
              note.note.toLowerCase().includes('chú ý') ||
              note.note.toLowerCase().includes('quan trọng') ||
              note.note.toLowerCase().includes('cần') ||
              note.note.toLowerCase().includes('sốt') ||
              note.note.toLowerCase().includes('đau') ||
              note.note.toLowerCase().includes('không ăn') ||
              note.note.toLowerCase().includes('mệt')
            );
            
            const isHighPriority = note.priority === 'Khẩn cấp' || note.priority === 'Cần chú ý';
            const isRecent = hoursOld <= 24; // Show notes from last 24 hours
            
            if (note.note && (hasImportantKeywords || isHighPriority || isRecent)) {
              notes.push({
                residentName: resident.name,
                note: note.note,
                timestamp: note.timestamp || note.date,
                priority: note.priority || (hasImportantKeywords ? 'high' : 'medium')
              });
            }
          });
        }
      });

      // Sort by newest first
      notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHighPriorityNotes(notes.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#ef4444';
      case 'due': return '#f59e0b';
      case 'upcoming': return '#10b981';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue': return 'Quá giờ';
      case 'due': return 'Đến giờ';
      case 'upcoming': return 'Sắp tới';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return status;
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{
      marginTop: '2rem',
      marginBottom: '3rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '2rem'
    }}>
      {/* Medication Reminders Widget */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: 0,
              color: '#1e293b'
            }}>
              Lịch uống thuốc hôm nay
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            style={{
              padding: '0.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '0.5rem',
              color: '#3b82f6',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {medicationReminders.length > 0 ? (
            medicationReminders.map((reminder, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: 'rgba(248, 250, 252, 0.8)',
                borderRadius: '0.5rem',
                border: `1px solid ${reminder.status === 'overdue' ? '#fca5a5' : reminder.status === 'due' ? '#fbbf24' : '#86efac'}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {reminder.residentName}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: getStatusColor(reminder.status),
                    color: 'white',
                    fontWeight: 500
                  }}>
                    {getStatusText(reminder.status)}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  {reminder.medication} • {reminder.time}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280',
              fontSize: '0.875rem'
                         }}>
               Không có lịch uống thuốc
             </div>
          )}
        </div>
      </div>

      {/* Medical Schedule Widget */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
            color: '#1e293b'
          }}>
            Lịch khám sắp tới
          </h3>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: 'rgba(248, 250, 252, 0.8)',
                borderRadius: '0.5rem',
                border: `1px solid ${getStatusColor(appointment.priority)}20`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {appointment.residentName}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: getStatusColor(appointment.priority)
                  }}>
                    {getStatusText(appointment.priority)}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  <strong>Loại:</strong> {appointment.type} • <strong>Thời gian:</strong> {appointment.time}
                </div>
              </div>
            ))
                     ) : (
             <div style={{
               textAlign: 'center',
               padding: '2rem',
               color: '#6b7280',
               fontSize: '0.875rem'
             }}>
               Không có lịch khám nào
             </div>
           )}
        </div>
      </div>

      {/* High Priority Notes Widget */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
            color: '#1e293b'
                      }}>
              Ghi chú cần theo dõi
            </h3>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {highPriorityNotes.length > 0 ? (
            highPriorityNotes.map((note, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: 'rgba(254, 243, 199, 0.5)',
                borderRadius: '0.5rem',
                border: '1px solid #fbbf24'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '0.25rem'
                }}>
                  {note.residentName}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#374151',
                  marginBottom: '0.25rem',
                  lineHeight: '1.4'
                }}>
                  {note.note.length > 100 ? note.note.substring(0, 100) + '...' : note.note}
                </div>
                <div style={{
                  fontSize: '0.625rem',
                  color: '#6b7280'
                }}>
                  <strong>Thời gian:</strong> {new Date(note.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280',
              fontSize: '0.875rem'
                         }}>
               Không có ghi chú cần theo dõi
             </div>
          )}
        </div>
      </div>


    </div>
  );
} 
