"use client";

import { useState, useEffect } from 'react';
import { 
  HeartIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface FamilyMember {
  name: string;
  room: string;
  status: string;
  lastUpdate: string;
}

interface FamilyActivity {
  memberName: string;
  activity: string;
  time: string;
  status: 'completed' | 'ongoing' | 'upcoming';
}

interface FamilyNote {
  memberName: string;
  note: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export default function FamilyDashboardWidgets() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [recentActivities, setRecentActivities] = useState<FamilyActivity[]>([]);
  const [importantNotes, setImportantNotes] = useState<FamilyNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadFamilyData();
    
    // Lắng nghe sự kiện cập nhật
    const handleDataUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    // Auto-refresh mỗi 30 giây
    const interval = setInterval(() => {
      loadFamilyData();
    }, 30000);
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [refreshKey]);

  const loadFamilyData = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      
      if (!savedResidents) return;

      const residents = JSON.parse(savedResidents);
      
      // Mô phỏng dữ liệu gia đình (có thể cần cấu hình riêng)
      const familyMemberIds = [1, 2]; // Giả sử user family có quyền xem resident ID 1, 2
      const userFamily = residents.filter((resident: any) => 
        familyMemberIds.includes(resident.id)
      );

      // Thông tin người thân
      const members: FamilyMember[] = userFamily.map((member: any) => {
        let status = 'Ổn định';
        let lastUpdate = 'Hôm nay';
        
        // Kiểm tra ghi chú gần nhất
        if (member.careNotes && member.careNotes.length > 0) {
          const latestNote = member.careNotes[0];
          if (latestNote.priority === 'high') {
            status = 'Cần chú ý';
          } else if (latestNote.note.toLowerCase().includes('cải thiện')) {
            status = 'Đang cải thiện';
          }
        }

        return {
          name: member.name,
          room: member.room,
          status,
          lastUpdate
        };
      });

      setFamilyMembers(members);

      // Hoạt động gần đây
      const activities: FamilyActivity[] = [];
      
      userFamily.forEach((member: any) => {
        // Từ appointments
        if (member.appointments) {
          member.appointments.slice(0, 3).forEach((apt: any) => {
            activities.push({
              memberName: member.name,
              activity: apt.type,
              time: apt.time,
              status: 'upcoming'
            });
          });
        }
      });

      setRecentActivities(activities.slice(0, 5));

      // Ghi chú quan trọng
      const notes: FamilyNote[] = [];
      
      userFamily.forEach((member: any) => {
        if (member.careNotes) {
          member.careNotes.slice(0, 2).forEach((note: any) => {
            notes.push({
              memberName: member.name,
              note: note.note.replace(/^\[.*?\]\s*/, ''), // Xóa tag danh mục
              date: note.date || note.timestamp,
              priority: note.priority || 'medium'
            });
          });
        }
      });

      setImportantNotes(notes.slice(0, 4));

    } catch (error) {
      console.error('Error loading family data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cần chú ý': return '#ef4444';
      case 'Đang cải thiện': return '#f59e0b';
      case 'Ổn định': return '#10b981';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{
      marginBottom: '2rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '1.5rem'
    }}>
      {/* Family Members Status Widget */}
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
            gap: '0.5rem'
          }}>
            <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ec4899' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: 0,
              color: '#1e293b'
            }}>
              Tình trạng người thân
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {familyMembers.length > 0 ? (
            familyMembers.map((member, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    {member.name} - Phòng {member.room}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    Cập nhật: {member.lastUpdate}
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: `${getStatusColor(member.status)}20`,
                  color: getStatusColor(member.status)
                }}>
                  {member.status}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.875rem',
              padding: '2rem'
            }}>
              Chưa có thông tin người thân
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities Widget */}
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
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <CalendarDaysIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
            color: '#1e293b'
          }}>
            Lịch khám sắp tới
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    {activity.memberName}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    {activity.activity} - {activity.time}
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#10b98120',
                  color: '#10b981'
                }}>
                  Đã đặt lịch
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.875rem',
              padding: '2rem'
            }}>
              Không có lịch khám nào
            </div>
          )}
        </div>
      </div>

      {/* Important Notes Widget */}
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
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <DocumentTextIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
            color: '#1e293b'
          }}>
            Ghi chú cần theo dõi
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {importantNotes.length > 0 ? (
            importantNotes.map((note, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {note.memberName}
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    backgroundColor: `${getStatusColor(note.priority)}20`,
                    color: getStatusColor(note.priority)
                  }}>
                    {note.priority === 'high' ? 'Quan trọng' : note.priority === 'medium' ? 'Bình thường' : 'Thông tin'}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#475569',
                  lineHeight: '1.4',
                  marginBottom: '0.5rem'
                }}>
                  {note.note.length > 100 ? `${note.note.substring(0, 100)}...` : note.note}
                </div>
                <div style={{
                  fontSize: '0.6875rem',
                  color: '#64748b'
                }}>
                  {new Date(note.date).toLocaleDateString('vi-VN')}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.875rem',
              padding: '2rem'
            }}>
              Không có ghi chú cần theo dõi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}