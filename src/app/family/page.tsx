"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  PhotoIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  UsersIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

// Add CSS animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
`;

// Mock family member data
const residents = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    room: '101', 
    photo: 'https://randomuser.me/api/portraits/women/72.jpg',
    age: 78,
    status: 'Ổn định',
    activities: [
      { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00 AM', participated: true },
      { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30 AM', participated: true },
      { id: 3, name: 'Liệu pháp âm nhạc', time: '02:00 PM', participated: false }
    ],
    vitals: {
      lastUpdated: '2023-05-10 09:30 AM',
      bloodPressure: '130/85',
      heartRate: 72,
      temperature: 36.8,
      weight: '65 kg'
    },
    careNotes: [
      { id: 1, date: '2023-05-10', note: 'Tham gia tập thể dục buổi sáng rất tích cực. Ăn hết 100% bữa sáng.', staff: 'John Smith, RN' },
      { id: 2, date: '2023-05-09', note: 'Báo cáo khó chịu nhẹ ở đầu gối phải. Đã áp dụng túi chườm nóng. Sẽ theo dõi.', staff: 'Sarah Johnson, CNA' },
      { id: 3, date: '2023-05-08', note: 'Được con gái Emily thăm. Tâm trạng cải thiện rõ rệt sau chuyến thăm.', staff: 'David Wilson' }
    ],
    medications: [
      { id: 1, name: 'Lisinopril', dosage: '10mg', schedule: 'Mỗi ngày một lần', lastAdministered: '2023-05-10 08:00 AM' },
      { id: 2, name: 'Simvastatin', dosage: '20mg', schedule: 'Mỗi ngày một lần trước giờ đi ngủ', lastAdministered: '2023-05-09 09:00 PM' },
      { id: 3, name: 'Vitamin D', dosage: '1000 IU', schedule: 'Mỗi ngày một lần', lastAdministered: '2023-05-10 08:00 AM' }
    ],
    appointments: [
      { id: 1, type: 'Khám bác sĩ', date: '2023-05-15', time: '10:00 AM', provider: 'Dr. Robert Brown' },
      { id: 2, type: 'Vật lý trị liệu', date: '2023-05-12', time: '02:30 PM', provider: 'Michael Stevens, PT' }
    ]
  }
];

export default function FamilyPortalPage() {
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  
  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  
  // Form states
  const [contactMessage, setContactMessage] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');

  // Handler functions for button actions
  const handleContactStaff = () => {
    setShowContactModal(true);
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleVisitSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleViewPhotos = () => {
    setShowPhotosModal(true);
  };
  
  // Submit handlers
  const submitContactRequest = () => {
    if (contactMessage.trim() && selectedStaff) {
      // Create success notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Yêu cầu liên hệ đã được gửi!',
        message: `Đã gửi yêu cầu liên hệ đến ${selectedStaff}. Chúng tôi sẽ phản hồi trong vòng 24 giờ.`,
        timestamp: new Date().toISOString()
      }]);
      setContactMessage('');
      setSelectedStaff('');
      setShowContactModal(false);
    }
  };

  const submitMessage = () => {
    if (messageContent.trim()) {
      // Create success notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Tin nhắn đã được gửi!',
        message: `Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.`,
        timestamp: new Date().toISOString()
      }]);
      setMessageContent('');
      setShowMessageModal(false);
    }
  };

  const submitVisitSchedule = () => {
    if (visitDate && visitTime && visitPurpose) {
      // Create success notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Đặt lịch thăm thành công!',
        message: `Đã đặt lịch thăm ngày ${visitDate} lúc ${visitTime}. Chúng tôi sẽ xác nhận với bạn trước 1 ngày.`,
        timestamp: new Date().toISOString()
      }]);
      setVisitDate('');
      setVisitTime('');
      setVisitPurpose('');
      setShowScheduleModal(false);
    }
  };

  // Mock data
  const mockPhotos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=200&fit=crop', caption: 'Hoạt động tập thể dục buổi sáng', date: '2024-01-15' },
    { id: 2, url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop', caption: 'Bữa ăn tối cùng bạn bè', date: '2024-01-14' },
    { id: 3, url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop', caption: 'Chăm sóc vườn hoa', date: '2024-01-13' },
    { id: 4, url: 'https://images.unsplash.com/photo-1573764446-fbca3cefb9c9?w=300&h=200&fit=crop', caption: 'Sinh nhật tháng 1', date: '2024-01-12' },
    { id: 5, url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=300&h=200&fit=crop', caption: 'Thư giãn đọc sách', date: '2024-01-11' },
    { id: 6, url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&h=200&fit=crop', caption: 'Hoạt động vẽ tranh', date: '2024-01-10' }
  ];

  const staffMembers = [
    'Y tá trưởng - Nguyễn Thị Lan',
    'Bác sĩ - Dr. Trần Văn Nam', 
    'Nhân viên chăm sóc - Lê Thị Hoa',
    'Chuyên viên hoạt động - Phạm Văn Minh',
    'Quản lý ca - Vũ Thị Mai'
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
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
        {/* Header Section */}
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
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <UsersIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Cổng thông tin gia đình
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi và kết nối với người thân của bạn
                </p>
              </div>
            </div>
            
            <button style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white', 
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onClick={handleContactStaff}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}>
              <PhoneIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Liên hệ nhân viên
            </button>
          </div>
        </div>
        
        {/* Resident Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', width: '100%'}}>
              <div>
                <img 
                  src={selectedResident.photo} 
                  alt={selectedResident.name} 
                  style={{
                    height: '6rem', 
                    width: '6rem', 
                    borderRadius: '1.5rem', 
                    objectFit: 'cover', 
                    border: '4px solid white', 
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </div>
              <div style={{flex: 1}}>
                <h2 style={{
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#111827', 
                  margin: '0 0 0.5rem 0'
                }}>
                  {selectedResident.name}
                </h2>
                <p style={{
                  fontSize: '1rem', 
                  color: '#6b7280', 
                  margin: '0 0 1rem 0',
                  fontWeight: 500
                }}>
                  Phòng {selectedResident.room} • {selectedResident.age} tuổi
                </p>
                <div style={{marginBottom: '1.5rem'}}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    color: '#166534',
                    border: '1px solid #86efac'
                  }}>
                    <div style={{
                      width: '0.5rem', 
                      height: '0.5rem', 
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      borderRadius: '9999px', 
                      marginRight: '0.5rem'
                    }}></div>
                    Trạng thái: {selectedResident.status}
                  </span>
                </div>
                <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={handleSendMessage}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                  }}>
                    <ChatBubbleLeftRightIcon style={{width: '1rem', height: '1rem'}} />
                    Gửi tin nhắn
                  </button>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={handleVisitSchedule}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                  }}>
                    <CalendarDaysIcon style={{width: '1rem', height: '1rem'}} />
                    Lịch thăm
                  </button>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={handleViewPhotos}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                  }}>
                    <PhotoIcon style={{width: '1rem', height: '1rem'}} />
                    Xem ảnh
                  </button>
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                flexShrink: 0,
                maxWidth: '320px',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  margin: '0 0 0.5rem 0'
                }}>
                  Chỉ số sức khỏe
                </h3>
                <p style={{
                  fontSize: '0.75rem', 
                  color: '#6b7280', 
                  margin: '0 0 1rem 0'
                }}>
                  Cập nhật lần cuối: {selectedResident.vitals.lastUpdated}
                </p>
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '1rem', 
                  fontSize: '0.875rem'
                }}>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Huyết áp</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.bloodPressure}</span>
                  </div>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Nhịp tim</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.heartRate} nhịp/phút</span>
                  </div>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Nhiệt độ</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.temperature}°C</span>
                  </div>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Cân nặng</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.weight}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabbed Information */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <Tab.Group>
            <Tab.List style={{
              display: 'flex',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Hoạt động hôm nay
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Ghi chú chăm sóc
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Thuốc & Điều trị
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Lịch hẹn
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Hoạt động trong ngày
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {selectedResident.activities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: activity.participated 
                          ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                          : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        border: '1px solid',
                        borderColor: activity.participated ? '#86efac' : '#d1d5db'
                      }}
                    >
                      <div style={{marginRight: '1rem'}}>
                        {activity.participated ? (
                          <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                        ) : (
                          <ClockIcon style={{width: '1.5rem', height: '1.5rem', color: '#6b7280'}} />
                        )}
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {activity.name}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                          {activity.time}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: activity.participated ? '#166534' : '#6b7280'
                      }}>
                        {activity.participated ? 'Đã tham gia' : 'Chưa tham gia'}
                      </span>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Ghi chú chăm sóc gần đây
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {selectedResident.careNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontWeight: 500
                        }}>
                          {new Date(note.date).toLocaleDateString('vi-VN')}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#8b5cf6',
                          fontWeight: 500
                        }}>
                          {note.staff}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#374151',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {note.note}
                      </p>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Thuốc hiện tại
                </h3>
                <div style={{display: 'grid', gap: '1rem'}}>
                  {selectedResident.medications.map((medication) => (
                    <div
                      key={medication.id}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #fbbf24',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr',
                        gap: '1rem',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {medication.name}
                          </div>
                          <div style={{fontSize: '0.75rem', color: '#92400e'}}>
                            {medication.dosage} - {medication.schedule}
                          </div>
                        </div>
                        <div>
                          <span style={{fontSize: '0.75rem', color: '#6b7280', display: 'block'}}>
                            Uống lần cuối
                          </span>
                          <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#92400e'}}>
                            {medication.lastAdministered}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Lịch hẹn sắp tới
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {selectedResident.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        border: '1px solid #93c5fd'
                      }}
                    >
                      <div style={{marginRight: '1.5rem'}}>
                        <CalendarDaysIcon style={{width: '2rem', height: '2rem', color: '#1d4ed8'}} />
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {appointment.type}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem'}}>
                          {appointment.provider}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                          {new Date(appointment.date).toLocaleDateString('vi-VN')} lúc {appointment.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Contact Staff Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '28rem',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(239, 68, 68, 0.1)'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <PhoneIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </div>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827'}}>
                  Liên hệ nhân viên
                </h3>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                  Gửi yêu cầu liên hệ trực tiếp với nhân viên chăm sóc
                </p>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'rgba(107, 114, 128, 0.1)',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <XMarkIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </button>
            </div>
            
            {/* Form Content */}
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'flex', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#374151', 
                marginBottom: '0.75rem',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <UsersIcon style={{width: '1rem', height: '1rem', color: '#ef4444'}} />
                Chọn nhân viên
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <option value="">Chọn nhân viên cần liên hệ...</option>
                {staffMembers.map((staff, index) => (
                  <option key={index} value={staff}>{staff}</option>
                ))}
              </select>
            </div>
            
            <div style={{marginBottom: '2rem'}}>
              <label style={{
                display: 'flex', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#374151', 
                marginBottom: '0.75rem',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <DocumentTextIcon style={{width: '1rem', height: '1rem', color: '#ef4444'}} />
                Nội dung yêu cầu
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Nhập nội dung yêu cầu liên hệ. Ví dụ: Tôi muốn hỏi về tình hình sức khỏe của bà Alice, hoặc cần trao đổi về chế độ dinh dưỡng..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              />
              <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                💡 Nhân viên sẽ liên hệ lại trong vòng 30 phút đến 2 giờ
              </p>
            </div>
            
            {/* Action Buttons */}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitContactRequest}
                disabled={!contactMessage.trim() || !selectedStaff}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: (!contactMessage.trim() || !selectedStaff) 
                    ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' 
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  cursor: (!contactMessage.trim() || !selectedStaff) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: (!contactMessage.trim() || !selectedStaff) 
                    ? 'none' 
                    : '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!(!contactMessage.trim() || !selectedStaff)) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!contactMessage.trim() || !selectedStaff)) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }
                }}
              >
                <PhoneIcon style={{width: '1rem', height: '1rem'}} />
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '30rem',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <ChatBubbleLeftRightIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </div>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827'}}>
                  Gửi tin nhắn
                </h3>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                  Tin nhắn sẽ được gửi đến nhóm chăm sóc của cư dân
                </p>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'rgba(107, 114, 128, 0.1)',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = '#3b82f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <XMarkIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </button>
            </div>
            
            {/* Form Content */}
            <div style={{marginBottom: '2rem'}}>
              <label style={{
                display: 'flex', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#374151', 
                marginBottom: '0.75rem',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <DocumentTextIcon style={{width: '1rem', height: '1rem', color: '#3b82f6'}} />
                Nội dung tin nhắn
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Nhập nội dung tin nhắn cho nhân viên chăm sóc. Ví dụ: Xin chào, tôi muốn hỏi về tình hình ăn uống của bà Alice hôm nay..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '150px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              />
              <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                💬 Tin nhắn sẽ được gửi ngay lập tức và nhân viên sẽ phản hồi sớm nhất có thể
              </p>
            </div>
            
            {/* Action Buttons */}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitMessage}
                disabled={!messageContent.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: !messageContent.trim() 
                    ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  cursor: !messageContent.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: !messageContent.trim() 
                    ? 'none' 
                    : '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (messageContent.trim()) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (messageContent.trim()) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                <PaperAirplaneIcon style={{width: '1rem', height: '1rem'}} />
                Gửi tin nhắn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visit Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '30rem',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <CalendarDaysIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </div>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827'}}>
                  Đặt lịch thăm
                </h3>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                  Đặt lịch hẹn để thăm cư dân tại viện dưỡng lão
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'rgba(107, 114, 128, 0.1)',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  e.currentTarget.style.color = '#10b981';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <XMarkIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </button>
            </div>
            
            <div style={{display: 'grid', gap: '1.5rem', marginBottom: '1.5rem'}}>
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '0.75rem'
                }}>
                  <CalendarDaysIcon style={{width: '1rem', height: '1rem', color: '#10b981'}} />
                  Ngày thăm
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '0.75rem'
                }}>
                  <ClockIcon style={{width: '1rem', height: '1rem', color: '#10b981'}} />
                  Giờ thăm
                </label>
                <select
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <option value="">Chọn giờ thăm...</option>
                  <option value="09:00">09:00 - 10:00</option>
                  <option value="10:00">10:00 - 11:00</option>
                  <option value="14:00">14:00 - 15:00</option>
                  <option value="15:00">15:00 - 16:00</option>
                  <option value="16:00">16:00 - 17:00</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '0.75rem'
                }}>
                  <HeartIcon style={{width: '1rem', height: '1rem', color: '#10b981'}} />
                  Mục đích thăm
                </label>
                <select
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <option value="">Chọn mục đích...</option>
                  <option value="Thăm hỏi sức khỏe">Thăm hỏi sức khỏe</option>
                  <option value="Sinh nhật">Chúc mừng sinh nhật</option>
                  <option value="Mang quà">Mang quà và thức ăn</option>
                  <option value="Tham gia hoạt động">Tham gia hoạt động</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <p style={{fontSize: '0.875rem', color: '#059669', margin: 0, fontWeight: 500}}>
                📌 Lưu ý: Thời gian thăm từ 9:00-11:00 và 14:00-17:00. Vui lòng đặt lịch trước ít nhất 24 giờ.
              </p>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitVisitSchedule}
                disabled={!visitDate || !visitTime || !visitPurpose}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: (!visitDate || !visitTime || !visitPurpose) 
                    ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  cursor: (!visitDate || !visitTime || !visitPurpose) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: (!visitDate || !visitTime || !visitPurpose) 
                    ? 'none' 
                    : '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!(!visitDate || !visitTime || !visitPurpose)) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!visitDate || !visitTime || !visitPurpose)) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                <CheckIcon style={{width: '1rem', height: '1rem'}} />
                Đặt lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Photos Modal */}
      {showPhotosModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '50rem',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <PhotoIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </div>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827'}}>
                  Thư viện ảnh của cư dân
                </h3>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                  Xem những khoảnh khắc đẹp của cư dân tại viện
                </p>
              </div>
              <button
                onClick={() => setShowPhotosModal(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'rgba(107, 114, 128, 0.1)',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                  e.currentTarget.style.color = '#f59e0b';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <XMarkIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {mockPhotos.map((photo) => (
                <div key={photo.id} style={{
                  background: 'white',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px -3px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{padding: '1.25rem'}}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: '0 0 0.5rem 0',
                      lineHeight: 1.4
                    }}>
                      {photo.caption}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CalendarDaysIcon style={{width: '0.875rem', height: '0.875rem', color: '#f59e0b'}} />
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0,
                        fontWeight: 500
                      }}>
                        {new Date(photo.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowPhotosModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 