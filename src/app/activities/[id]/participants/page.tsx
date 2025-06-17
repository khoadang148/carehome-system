"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Mock residents data
const residentsData = [
  { id: 1, name: 'Nguyễn Văn A', age: 75, room: 'A101', healthStatus: 'Tốt', phone: '0123456789' },
  { id: 2, name: 'Trần Thị B', age: 82, room: 'A102', healthStatus: 'Khá', phone: '0123456790' },
  { id: 3, name: 'Lê Văn C', age: 68, room: 'B203', healthStatus: 'Tốt', phone: '0123456791' },
  { id: 4, name: 'Hoàng Văn D', age: 79, room: 'B204', healthStatus: 'Yếu', phone: '0123456792' },
  { id: 5, name: 'Phạm Thị E', age: 85, room: 'C305', healthStatus: 'Khá', phone: '0123456793' },
  { id: 6, name: 'Vũ Văn F', age: 73, room: 'C306', healthStatus: 'Tốt', phone: '0123456794' },
  { id: 7, name: 'Đặng Thị G', age: 76, room: 'D407', healthStatus: 'Khá', phone: '0123456795' },
  { id: 8, name: 'Bùi Văn H', age: 81, room: 'D408', healthStatus: 'Tốt', phone: '0123456796' },
  { id: 9, name: 'Lý Thị I', age: 74, room: 'E509', healthStatus: 'Yếu', phone: '0123456797' },
  { id: 10, name: 'Ngô Văn J', age: 77, room: 'E510', healthStatus: 'Khá', phone: '0123456798' }
];

// Mock activities data
const activitiesData = [
  { 
    id: 1, 
    name: 'Tập thể dục buổi sáng', 
    description: 'Các bài tập kéo giãn và vận động nhẹ nhàng để cải thiện khả năng vận động.',
    category: 'Thể chất', 
    location: 'Phòng sinh hoạt chung',
    scheduledTime: '08:00', 
    duration: 45,
    capacity: 20,
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
      'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R'
    ],
    facilitator: 'David Wilson',
    date: '2024-01-15',
    status: 'Đã lên lịch'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    description: 'Hoạt động vẽ tranh và làm đồ thủ công sáng tạo.',
    category: 'Sáng tạo', 
    location: 'Phòng hoạt động',
    scheduledTime: '10:30', 
    duration: 60,
    capacity: 15,
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L'
    ],
    facilitator: 'Emily Parker',
    date: '2024-01-15',
    status: 'Đang diễn ra'
  }
];

export default function ActivityParticipantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Get activityId from params directly
  const activityId = params.id;
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const id = parseInt(activityId);
        
        // Check localStorage for activities data
        let activities = activitiesData;
        const savedActivities = localStorage.getItem('nurseryHomeActivities');
        if (savedActivities) {
          activities = JSON.parse(savedActivities);
        }
        
        const foundActivity = activities.find(a => a.id === id);
        
        if (foundActivity) {
          setActivity(foundActivity);
        } else {
          router.push('/activities');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [activityId, router]);
  
  const handleRemoveParticipant = (participantName: string) => {
    if (!activity) return;
    
    const updatedParticipants = activity.participants.filter((p: string) => p !== participantName);
    const updatedActivity = { ...activity, participants: updatedParticipants };
    setActivity(updatedActivity);
    
    // Update localStorage
    const savedActivities = localStorage.getItem('nurseryHomeActivities');
    let activities = savedActivities ? JSON.parse(savedActivities) : activitiesData;
    const activityIndex = activities.findIndex((a: any) => a.id === parseInt(activityId));
    if (activityIndex !== -1) {
      activities[activityIndex] = updatedActivity;
      localStorage.setItem('nurseryHomeActivities', JSON.stringify(activities));
    }
  };
  
  const handleAddParticipant = (residentName: string) => {
    if (!activity) return;
    
    if (!activity.participants.includes(residentName)) {
      const updatedParticipants = [...activity.participants, residentName];
      const updatedActivity = { ...activity, participants: updatedParticipants };
      setActivity(updatedActivity);
      
      // Update localStorage
      const savedActivities = localStorage.getItem('nurseryHomeActivities');
      let activities = savedActivities ? JSON.parse(savedActivities) : activitiesData;
      const activityIndex = activities.findIndex((a: any) => a.id === parseInt(activityId));
      if (activityIndex !== -1) {
        activities[activityIndex] = updatedActivity;
        localStorage.setItem('nurseryHomeActivities', JSON.stringify(activities));
      }
    }
    setShowAddModal(false);
  };
  
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Tốt': return '#16a34a';
      case 'Khá': return '#2563eb';
      case 'Yếu': return '#dc2626';
      default: return '#6b7280';
    }
  };
  
  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'Tốt': return <HeartIcon style={{width: '1rem', height: '1rem'}} />;
      case 'Khá': return <HeartIcon style={{width: '1rem', height: '1rem'}} />;
      case 'Yếu': return <ExclamationTriangleIcon style={{width: '1rem', height: '1rem'}} />;
      default: return <HeartIcon style={{width: '1rem', height: '1rem'}} />;
    }
  };
  
  // Get available residents (those not already participating)
  const availableResidents = residentsData.filter(resident => 
    !activity?.participants.includes(resident.name) &&
    resident.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin hoạt động.</p>
      </div>
    );
  }
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href={`/activities/${activityId}`} style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Quản lý người tham gia</h1>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#0284c7',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <PlusIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
          Thêm người tham gia
        </button>
      </div>
      
      {/* Activity Info */}
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem', marginBottom: '1.5rem'}}>
        <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '0.5rem'}}>
          {activity.name}
        </h2>
        <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem'}}>{activity.description}</p>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          <div>
            <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase'}}>Thời gian</span>
            <p style={{fontSize: '0.875rem', color: '#111827', margin: 0}}>{activity.scheduledTime} - {activity.duration} phút</p>
          </div>
          <div>
            <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase'}}>Địa điểm</span>
            <p style={{fontSize: '0.875rem', color: '#111827', margin: 0}}>{activity.location}</p>
          </div>
          <div>
            <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase'}}>Sức chứa</span>
            <p style={{fontSize: '0.875rem', color: '#111827', margin: 0}}>
              {activity.participants.length}/{activity.capacity} người
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.75rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: activity.participants.length >= activity.capacity ? '#fecaca' : '#dcfce7',
                color: activity.participants.length >= activity.capacity ? '#dc2626' : '#166534'
              }}>
                {activity.participants.length >= activity.capacity ? 'Đầy' : `Còn ${activity.capacity - activity.participants.length} chỗ`}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Participants List */}
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
          Danh sách người tham gia ({activity.participants.length})
        </h3>
        
        {activity.participants.length > 0 ? (
          <div style={{display: 'grid', gap: '0.75rem'}}>
            {activity.participants.map((participantName: string, index: number) => {
              const resident = residentsData.find(r => r.name === participantName);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <UserIcon style={{width: '1.25rem', height: '1.25rem', color: '#6b7280'}} />
                    </div>
                    
                    <div>
                      <h4 style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0}}>
                        {participantName}
                      </h4>
                      {resident && (
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem'}}>
                          <span style={{fontSize: '0.75rem', color: '#6b7280'}}>
                            Tuổi: {resident.age} | Phòng: {resident.room}
                          </span>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                            <span style={{color: getHealthStatusColor(resident.healthStatus)}}>
                              {getHealthStatusIcon(resident.healthStatus)}
                            </span>
                            <span style={{fontSize: '0.75rem', color: getHealthStatusColor(resident.healthStatus)}}>
                              {resident.healthStatus}
                            </span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                            <PhoneIcon style={{width: '0.75rem', height: '0.75rem', color: '#6b7280'}} />
                            <span style={{fontSize: '0.75rem', color: '#6b7280'}}>{resident.phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveParticipant(participantName)}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #dc2626',
                      backgroundColor: 'white',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Chưa có người tham gia hoạt động này</p>
          </div>
        )}
      </div>
      
      {/* Add Participant Modal */}
      {showAddModal && (
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
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Thêm người tham gia
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <XMarkIcon style={{width: '1.25rem', height: '1.25rem', color: '#6b7280'}} />
              </button>
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              <input
                type="text"
                placeholder="Tìm kiếm người cao tuổi..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{display: 'grid', gap: '0.5rem', maxHeight: '400px', overflow: 'auto'}}>
              {availableResidents.length > 0 ? (
                availableResidents.map(resident => (
                  <div
                    key={resident.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UserIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                      </div>
                      
                      <div>
                        <h4 style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0}}>
                          {resident.name}
                        </h4>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem'}}>
                          <span style={{fontSize: '0.75rem', color: '#6b7280'}}>
                            Tuổi: {resident.age} | Phòng: {resident.room}
                          </span>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                            <span style={{color: getHealthStatusColor(resident.healthStatus)}}>
                              {getHealthStatusIcon(resident.healthStatus)}
                            </span>
                            <span style={{fontSize: '0.75rem', color: getHealthStatusColor(resident.healthStatus)}}>
                              {resident.healthStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddParticipant(resident.name)}
                      disabled={activity.participants.length >= activity.capacity}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: activity.participants.length >= activity.capacity ? '#e5e7eb' : '#0284c7',
                        color: activity.participants.length >= activity.capacity ? '#9ca3af' : 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: activity.participants.length >= activity.capacity ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Thêm
                    </button>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', padding: '2rem 0'}}>
                  <p style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {searchTerm ? 'Không tìm thấy người cao tuổi phù hợp' : 'Tất cả người cao tuổi đã tham gia hoạt động này'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}