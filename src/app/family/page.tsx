"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  CheckIcon,
  XCircleIcon,
  InformationCircleIcon,
  BellIcon,
  ArrowLeftIcon
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
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Mock family member data - multiple family members
const residents = [
  { 
    id: 1, 
    name: 'Nguyễn Văn Nam', 
    room: 'A01', 
    photo: 'https://randomuser.me/api/portraits/men/72.jpg',
    age: 78,
    relationship: 'Cha',
    status: 'Ổn định',
    activities: [
      { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: true },
      { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30', endTime: '11:30', participated: true },
      { id: 3, name: 'Liệu pháp âm nhạc', time: '14:00', endTime: '15:00', participated: false }
    ],
    vitals: {
      lastUpdated: '10/05/2024 09:30',
      bloodPressure: '130/85',
      heartRate: 72,
      temperature: 36.8,
      weight: '65'
    },
    careNotes: [
      { id: 1, date: '2024-05-10', note: 'Tham gia tập thể dục buổi sáng rất tích cực. Ăn hết 100% bữa sáng.', staff: 'Nguyễn Thị Lan, Y tá trưởng' },
      { id: 2, date: '2024-05-09', note: 'Báo cáo khó chịu nhẹ ở đầu gối phải. Đã áp dụng túi chườm nóng. Sẽ theo dõi.', staff: 'Lê Thị Hoa, Nhân viên chăm sóc' },
      { id: 3, date: '2024-05-08', note: 'Được gia đình thăm. Tâm trạng cải thiện rõ rệt sau chuyến thăm.', staff: 'Vũ Thị Mai, Quản lý ca' }
    ],
    medications: [
      { id: 1, name: 'Lisinopril', dosage: '10mg', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' },
      { id: 2, name: 'Simvastatin', dosage: '20mg', schedule: 'Mỗi ngày một lần trước giờ đi ngủ', lastAdministered: '09/05/2024 21:00' },
      { id: 3, name: 'Vitamin D', dosage: '1000 IU', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' }
    ],
    appointments: [
      { id: 1, type: 'Khám bác sĩ', date: '2024-05-15', time: '10:00', provider: 'BS. Trần Văn Nam' },
      { id: 2, type: 'Vật lý trị liệu', date: '2024-05-12', time: '14:30', provider: 'KTV. Phạm Văn Minh' }
    ]
  },
  { 
    id: 2, 
    name: 'Lê Thị Hoa', 
    room: 'A02', 
    photo: 'https://randomuser.me/api/portraits/women/65.jpg',
    age: 75,
    relationship: 'Mẹ',
    status: 'Khá',
    activities: [
      { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: true },
      { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
      { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true }
    ],
    vitals: {
      lastUpdated: '10/05/2024 10:15',
      bloodPressure: '125/80',
      heartRate: 68,
      temperature: 36.6,
      weight: '58'
    },
    careNotes: [
      { id: 1, date: '2024-05-10', note: 'Tham gia hoạt động vẽ tranh với tinh thần rất vui vẻ. Hoàn thành một bức tranh đẹp.', staff: 'Phạm Văn Minh, Chuyên viên hoạt động' },
      { id: 2, date: '2024-05-09', note: 'Ăn uống tốt, ngủ đầy đủ. Không có vấn đề gì bất thường.', staff: 'Lê Thị Hoa, Nhân viên chăm sóc' },
      { id: 3, date: '2024-05-08', note: 'Rất vui khi được gia đình đến thăm. Kể nhiều câu chuyện vui.', staff: 'Nguyễn Thị Lan, Y tá trưởng' }
    ],
    medications: [
      { id: 1, name: 'Amlodipine', dosage: '5mg', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' },
      { id: 2, name: 'Calcium', dosage: '500mg', schedule: 'Hai lần mỗi ngày', lastAdministered: '10/05/2024 08:00' },
      { id: 3, name: 'Omega-3', dosage: '1000mg', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' }
    ],
    appointments: [
      { id: 1, type: 'Khám định kỳ', date: '2024-05-18', time: '09:00', provider: 'BS. Nguyễn Thị Minh' },
      { id: 2, type: 'Khám mắt', date: '2024-05-20', time: '15:00', provider: 'BS. Lê Văn Đức' }
    ]
  }
];

export default function FamilyPortalPage() {
  const router = useRouter();
  
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  
  // Add notifications state
  interface Notification {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    actionType: string;
    timestamp: string;
    id?: string;
  } | null>(null);
  
  // Form states
  const [contactMessage, setContactMessage] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

  // Handler functions for button actions
  const handleContactStaff = () => {
    console.log('Opening contact modal');
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
      const requestId = `REQ-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create professional notification
      setNotifications((prev: Notification[]) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Yêu cầu liên hệ đã được gửi',
        message: `Yêu cầu liên hệ đã được gửi thành công.`,
        timestamp: timestamp
      }]);

      // Show success modal
      setSuccessModalData({
        title: 'Đã gửi tin nhắn thành công!!!',
        message: `Nhân viên sẽ phản hồi trong vòng 30 phút đến 2 tiếng.`,
        actionType: 'contact',
        timestamp: timestamp,
        id: requestId
      });
      setShowSuccessModal(true);

      setContactMessage('');
      setSelectedStaff('');
      setShowContactModal(false);
    }
  };

  const submitMessage = () => {
    if (messageContent.trim()) {
      const messageId = `MSG-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create professional notification
      setNotifications((prev: Notification[]) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Tin nhắn đã được gửi thành công',
        message: `Tin nhắn của bạn đã được gửi và đang được xử lý.`,
        timestamp: timestamp
      }]);

      // Show success modal for important actions
      setSuccessModalData({
        title: 'Đã gửi tin nhắn thành công',
        message: `Người nhận sẽ trả lời sau từ 30 phút đến 2 tiếng.`,
        actionType: 'message',
        timestamp: timestamp,
        id: messageId
      });
      setShowSuccessModal(true);

      setMessageContent('');
      setShowMessageModal(false);
    }
  };

  const submitVisitSchedule = () => {
    if (visitDate && visitTime && visitPurpose) {
      const scheduleId = `SCH-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create professional notification
      setNotifications((prev: Notification[]) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Đã đặt lịch thăm thành công',
        message: `Lịch thăm đã được đặt thành công.`,
        timestamp: timestamp
      }]);

      // Show success modal
      setSuccessModalData({
        title: 'Đã đặt lịch thăm thành công',
        message: `Chúng tôi sẽ xác nhận lịch hẹn với bạn trong vòng 3 đến 12 tiếng.`,
        actionType: 'schedule',
        timestamp: timestamp,
        id: scheduleId
      });
      setShowSuccessModal(true);

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

  const residentMembers = [
    'Nguyễn Văn Nam - Cha',
    ' Lê Thị Hoa - Mẹ'
  ];

  useEffect(() => {
    // Load uploaded photos from localStorage and combine with mock photos
    try {
      const uploadedPhotos = localStorage.getItem('uploadedPhotos');
      if (uploadedPhotos) {
        const parsedPhotos = JSON.parse(uploadedPhotos);
        // Filter photos for current resident and format them
        const residentPhotos = parsedPhotos
          .filter((photo: any) => photo.residentId.toString() === selectedResident.id.toString())
          .map((photo: any) => ({
            id: `uploaded_${photo.id}`,
            url: photo.url,
            caption: photo.caption,
            date: new Date(photo.uploadDate).toISOString().split('T')[0],
            uploadedBy: photo.uploadedBy,
            isUploaded: true
          }));
        
        // Combine with mock photos
        const combinedPhotos = [...mockPhotos, ...residentPhotos];
        // Sort by date (newest first)
        combinedPhotos.sort((a, b) => new Date(b.date).getTime() - new Date(a).getTime());
        setAllPhotos(combinedPhotos);
      } else {
        setAllPhotos(mockPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setAllPhotos(mockPhotos);
    }
  }, [selectedResident]);

  useEffect(() => {
    console.log('Modal states:', { showContactModal, showScheduleModal, showPhotosModal, showMessageModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showContactModal || showScheduleModal || showPhotosModal || showMessageModal;
    
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
  }, [showScheduleModal, showPhotosModal, showContactModal, showMessageModal]);

  // Ensure header is shown when component mounts
  useEffect(() => {
    // Make sure header is visible when page loads
    document.body.classList.remove('hide-header');
    document.body.style.overflow = 'unset';
  }, []);

  // Remove notification after 5 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000); // Remove after 5 seconds
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Professional Notification Banner */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: 10000,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideDown 0.4s ease-out'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: '0 0 0.25rem 0'
                }}>
                  {notifications[notifications.length - 1]?.title}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  opacity: 0.9
                }}>
                  {notifications[notifications.length - 1]?.message}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setNotifications(prev => prev.slice(0, -1))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for Important Actions */}
      {showSuccessModal && successModalData && (
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
          zIndex: 10001,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '5rem',
              height: '5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            </div>

            {/* Modal Content */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 1rem 0'
            }}>
              {successModalData.title}
            </h2>

            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              lineHeight: 1.6
            }}>
              {successModalData.message}
            </p>



            {/* Close Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: '1rem 3rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      
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
                  Thông tin người thân 
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
              <ChatBubbleLeftRightIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Liên hệ nhân viên
            </button>
          </div>
        </div>
        
        {/* Family Member Selector */}
        {residents.length > 1 && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <UsersIcon style={{width: '1.25rem', height: '1.25rem', color: '#8b5cf6'}} />
              Chọn người thân để xem thông tin
            </h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
              {residents.map((resident) => (
                <div
                  key={resident.id}
                  onClick={() => setSelectedResident(resident)}
                  style={{
                    background: selectedResident.id === resident.id ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                    border: selectedResident.id === resident.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    if (selectedResident.id !== resident.id) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedResident.id !== resident.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <img 
                      src={resident.photo} 
                      alt={resident.name} 
                      style={{
                        height: '3.5rem', 
                        width: '3.5rem', 
                        borderRadius: '1rem', 
                        objectFit: 'cover',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                        {resident.name}
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                        <span style={{fontWeight: 600}}>Quan hệ:</span> {resident.relationship} • <span style={{fontWeight: 600}}>Tuổi:</span> {resident.age}
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        <span style={{fontWeight: 600}}>Phòng:</span> {resident.room} • <span style={{fontWeight: 600}}>Trạng thái sức khỏe:</span> {resident.status}
                      </div>
                    </div>
                    {selectedResident.id === resident.id && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        color: '#3b82f6'
                      }}>
                        <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem'}} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 600, color: '#374151'}}>Tên: </span>{selectedResident.name}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 600, color: '#374151'}}>Mối quan hệ: </span>{selectedResident.relationship}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 600, color: '#374151'}}>Phòng: </span>{selectedResident.room}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 600, color: '#374151'}}>Tuổi: </span>{selectedResident.age}
                </div>
                <div style={{marginBottom: '1.5rem'}}>
                  <span style={{display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, background: selectedResident.status === 'Ổn định' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: selectedResident.status === 'Ổn định' ? '#166534' : '#92400e', border: selectedResident.status === 'Ổn định' ? '1px solid #86efac' : '1px solid #fbbf24'}}>
                    <div style={{width: '0.5rem', height: '0.5rem', background: selectedResident.status === 'Ổn định' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '9999px', marginRight: '0.5rem'}}></div>
                    Trạng thái sức khỏe: {selectedResident.status}
                  </span>
                </div>
                <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
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
                    Đặt Lịch Thăm
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
                    Xem Ảnh Người Thân
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
                  Chỉ số sức khỏe của {selectedResident.name}
                </h3>
                <p style={{
                  fontSize: '0.75rem', 
                  color: '#6b7280', 
                  margin: '0 0 1rem 0'
                }}>
                  Cập nhật lần cuối: {selectedResident.vitals.lastUpdated}
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem'}}>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Huyết áp</span>
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.bloodPressure} mmHg</span>
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
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.weight} kg</span>
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
                        <div style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                          <span style={{fontWeight: 600, color: '#374151'}}>Hoạt động: </span>{activity.name}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                          <span style={{fontWeight: 600}}>Thời gian: </span>{activity.time}{activity.endTime ? ` - ${activity.endTime}` : ''}
                        </div>
                      </div>
                      <span style={{fontSize: '0.75rem', fontWeight: 500, color: activity.participated ? '#166534' : '#6b7280'}}>
                        <span style={{fontWeight: 600}}>Trạng thái sức khỏe: </span>{activity.participated ? 'Đã tham gia' : 'Chưa tham gia'}
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
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                    <thead>
                      <tr>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Ngày</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Nội dung ghi chú</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Nhân viên chăm sóc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResident.careNotes.map((note) => {
                        let staffName = note.staff;
                        let staffRole = '';
                        if (note.staff.includes(',')) {
                          const parts = note.staff.split(',');
                          staffName = parts[0].trim();
                          staffRole = parts[1].trim();
                        }
                        return (
                          <tr key={note.id} style={{borderTop: '1px solid #e5e7eb'}}>
                            <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#6b7280', whiteSpace: 'nowrap'}}><span style={{fontWeight: 600}}></span>{new Date(note.date).toLocaleDateString('vi-VN')}</td>
                            <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#374151'}}><span style={{fontWeight: 600}}>Nội dung: </span>{note.note}</td>
                            <td style={{padding: '0.75rem', fontSize: '0.95em'}}><span style={{fontWeight: 600}}></span><span style={{fontWeight: 700, color: '#8b5cf6'}}>{staffName}</span>{staffRole && (<span style={{fontWeight: 500, color: '#6366f1', fontSize: '0.85em', marginLeft: 4}}>&nbsp;({staffRole})</span>)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
              borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
              position: 'relative',
              zIndex: 10
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
                <ChatBubbleLeftRightIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
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
                Chọn người thân
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
                <option value="">Chọn người thân của bạn...</option>
                {residentMembers.map((resident, index) => (
                  <option key={index} value={resident}>{resident}</option>
                ))}
              </select>
              <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                💡 Chọn người thân để trao đổi về vấn đề sức khỏe....
              </p>
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
              <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                💡 Chọn nhân viên phù hợp với nhu cầu của bạn (ví dụ: y tá cho vấn đề sức khỏe, nhân viên chăm sóc cho hoạt động hàng ngày)
              </p>
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
                💡 Nhân viên sẽ liên hệ lại trong vòng 30 phút đến 2 giờ. Vui lòng cung cấp thông tin chi tiết để nhân viên có thể hỗ trợ tốt nhất.
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
                <PaperAirplaneIcon style={{width: '1rem', height: '1rem'}} />
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
                  Gửi tin nhắn trực tiếp cho nhân viên chăm sóc
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
                💬 Tin nhắn sẽ được gửi ngay lập tức và nhân viên sẽ phản hồi sớm nhất có thể. Vui lòng cung cấp thông tin rõ ràng để nhân viên có thể hỗ trợ tốt nhất.
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
                  Đặt lịch hẹn để thăm người thân tại viện dưỡng lão
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
                <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                   Chọn ngày bạn muốn đến thăm. Vui lòng đặt lịch trước ít nhất 24 giờ.
                </p>
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
                <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                  Chọn khung giờ phù hợp với lịch của bạn. Mỗi lần thăm kéo dài 1 giờ.
                </p>
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
                <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0'}}>
                  Chọn mục đích thăm để nhân viên có thể chuẩn bị tốt nhất cho chuyến thăm của bạn.
                </p>
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
                Lưu ý: Thời gian thăm từ 9:00-11:00 và 14:00-17:00. Vui lòng đặt lịch trước ít nhất 24 giờ.
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
        <PhotoGalleryModal
          allPhotos={allPhotos}
          onClose={() => setShowPhotosModal(false)}
        />
      )}
    </div>
  );
} 

// Thêm component PhotoGalleryModal ở cuối file
function PhotoGalleryModal({ allPhotos, onClose }: { allPhotos: any[]; onClose: () => void }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]); // array of photo ids
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null); // index in filteredPhotos

  // Lấy danh sách tháng/năm có trong ảnh
  const months = useMemo(() => Array.from(new Set(allPhotos.map((p: any) => p.date.slice(5,7)))).sort(), [allPhotos]);
  const years = useMemo(() => Array.from(new Set(allPhotos.map((p: any) => p.date.slice(0,4)))).sort().reverse(), [allPhotos]);

  // Lọc ảnh theo search và filter
  const filteredPhotos = useMemo(() => allPhotos.filter((photo: any) => {
    const matchSearch =
      photo.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.uploadedBy && photo.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      photo.date.includes(searchTerm);
    const matchMonth = monthFilter ? photo.date.slice(5,7) === monthFilter : true;
    const matchYear = yearFilter ? photo.date.slice(0,4) === yearFilter : true;
    return matchSearch && matchMonth && matchYear;
  }), [allPhotos, searchTerm, monthFilter, yearFilter]);

  // Group by date
  const groupedPhotos = useMemo(() => filteredPhotos.reduce((groups: Record<string, any[]>, photo: any) => {
    const date = photo.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(photo);
    return groups;
  }, {} as Record<string, any[]>), [filteredPhotos]);
  const sortedDates = useMemo(() => Object.keys(groupedPhotos).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()), [groupedPhotos]);

  // Lightbox navigation
  const openLightbox = (photoId: any) => {
    const idx = filteredPhotos.findIndex((p: any) => p.id === photoId);
    setLightboxIndex(idx);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const nextLightbox = () => setLightboxIndex(i => (i !== null && i < filteredPhotos.length - 1 ? i + 1 : i));

  // Tải ảnh về
  const downloadPhoto = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const downloadSelected = () => {
    selectedPhotos.forEach((id: any) => {
      const p = filteredPhotos.find((ph: any) => ph.id === id);
      if (p) downloadPhoto(p.url, p.caption || 'photo.jpg');
    });
  };

  return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
      background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(255,255,255,0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
        background: 'linear-gradient(135deg, #fff 60%, #f3f4f6 100%)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        maxWidth: '60rem',
        width: '98%',
        maxHeight: '92vh',
            overflowY: 'auto',
        boxShadow: '0 20px 40px -10px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
        border: '1px solid #e5e7eb',
        marginLeft: '180px'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.2rem',
              marginBottom: '2.5rem',
              paddingBottom: '1.2rem',
              borderBottom: 'none',
              background: 'none',
              boxShadow: 'none',
            }}>

<button
  onClick={() => router.push('/')}
  style={{
    marginRight: '800px',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.5rem',
    background: 'rgba(102, 126, 234, 0.1)',
    transition: 'all 0.2s',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    outline: 'none'
  }}
  title="Quay lại trang chủ"
>
  <ArrowLeftIcon style={{height: '1.25rem', width: '1.25rem'}} />
</button>


              <div style={{
                width: '4.5rem',
                height: '4.5rem',
                background: 'linear-gradient(135deg, #ffb347 0%, #ff5858 100%)',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px 0 rgba(255,88,88,0.10)'
              }}>
                <PhotoIcon style={{width: '2.5rem', height: '2.5rem', color: 'white'}} />
              </div>
              <h3 style={{
                fontSize: '2.1rem',
                fontWeight: 900,
                margin: 0,
                background: 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
                textAlign: 'center',
                lineHeight: 1.15,
                textShadow: '0 2px 12px rgba(255,88,88,0.08)'
              }}>
                Nhật ký hình ảnh người thân của bạn
              </h3>
              <p style={{
                fontSize: '1.08rem',
                color: '#6b7280',
                margin: 0,
                textAlign: 'center',
                fontWeight: 500,
                maxWidth: 520,
                lineHeight: 1.6
              }}>
                Dõi theo từng khoảnh khắc đáng nhớ của người thân tại viện dưỡng lão
              </p>
            </div>
        {/* Thanh tìm kiếm và filter */}
        <div
          style={{
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            background: 'none',
            borderRadius: '2rem',
            padding: 0,
            boxShadow: 'none',
            border: 'none'
          }}
        >
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: 520,
            width: '100%',
            background: '#fff',
            borderRadius: '2.5rem',
            boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
            border: '1.5px solid #f1f5f9'
          }}>
            <span style={{
              position: 'absolute',
              left: 22,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#cbd5e1',
              fontSize: 22,
              pointerEvents: 'none',
              zIndex: 2
            }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm ảnh..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '1.1rem 1.1rem 1.1rem 3.2rem',
                borderRadius: '2.5rem',
                border: '1.5px solid #f1f5f9',
                fontSize: '1.08rem',
                background: '#fff',
                color: '#374151',
                boxShadow: '0 2px 12px rgba(30,41,59,0.06)',
                outline: 'none',
                transition: 'border 0.2s, box-shadow 0.2s',
                fontWeight: 500,
                letterSpacing: '0.01em',
                marginBottom: 0
              }}
              onFocus={e => {
                e.currentTarget.style.border = '1.5px solid #ff5858';
                e.currentTarget.style.boxShadow = '0 0 0 2px #ffe4e6';
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1.5px solid #f1f5f9';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,41,59,0.06)';
              }}
            />
          </div>
          {selectedPhotos.length > 0 && (
            <button
              onClick={downloadSelected}
              style={{
                borderRadius: '2rem',
                padding: '1.1rem 2.1rem',
                border: 'none',
                background: 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,88,88,0.08)',
                transition: 'background 0.2s',
                marginLeft: 12
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff5858 0%, #ff9147 100%)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)'; }}
            >Tải ảnh</button>
          )}
        </div>
        {/* Phân nhóm ảnh theo ngày */}
        {sortedDates.length === 0 ? (
          <div style={{textAlign: 'center', color: '#6b7280', fontSize: '1.2rem', margin: '2.5rem 0'}}>Không tìm thấy ảnh phù hợp.</div>
        ) : (
          sortedDates.map((date: string) => (
            <div key={date} style={{marginBottom: '2.5rem'}}>
              <div style={{
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#ef4444',
                margin: '0 0 1.2rem 0',
                letterSpacing: '0.01em',
                textShadow: '0 1px 4px rgba(239,68,68,0.08)'
              }}>
                {new Date(date).toLocaleDateString('vi-VN')}
              </div>
            <div style={{
              display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '18px'
            }}>
                {groupedPhotos[date].map((photo: any) => (
                  <div
                    key={photo.id}
                    style={{
                      position: 'relative',
                      borderRadius: '1rem',
                  overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: selectedPhotos.includes(photo.id) ? '2.5px solid #ef4444' : '1.5px solid #f3f4f6',
                      boxShadow: selectedPhotos.includes(photo.id) ? '0 4px 16px rgba(239,68,68,0.10)' : '0 2px 8px rgba(0,0,0,0.04)'
                }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.035)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.13)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = selectedPhotos.includes(photo.id) ? '0 4px 16px rgba(239,68,68,0.10)' : '0 2px 8px rgba(0,0,0,0.04)'; }}
                  >
                    {/* Ảnh */}
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    style={{
                      width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                        display: 'block',
                        background: '#f3f4f6',
                        borderRadius: '1rem 1rem 0 0'
                      }}
                      onClick={() => openLightbox(photo.id)}
                    />
                    {/* Overlay caption/ngày/người đăng + nút tải */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '14px 18px 10px 16px',
                        background: 'linear-gradient(0deg, rgba(255,255,255,0.85) 80%, rgba(255,255,255,0.0) 100%)',
                        color: '#334155',
                        fontSize: '1.05em',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '44px',
                        borderRadius: '0 0 1rem 1rem',
                        boxShadow: '0 -2px 8px rgba(239,68,68,0.08)'
                      }}
                    >
                      <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%'}}>
                        {photo.caption}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); downloadPhoto(photo.url, photo.caption || 'photo.jpg'); }}
                        style={{
                          marginLeft: 8,
                          background: 'transparent',
                          border: '1.5px solid #93c5fd',
                          borderRadius: 12,
                          color: '#60a5fa',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '1em',
                          fontWeight: 500,
                          transition: 'background 0.2s, color 0.2s, border 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#e0f2fe';
                          e.currentTarget.style.color = '#2563eb';
                          e.currentTarget.style.border = '1.5px solid #60a5fa';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#60a5fa';
                          e.currentTarget.style.border = '1.5px solid #93c5fd';
                        }}
                        title="Tải ảnh này"
                      >
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="4" y="18" width="16" height="2" rx="1" fill="#60a5fa"/>
                        </svg>
                      </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          ))
        )}
        {/* Lightbox xem ảnh lớn */}
        {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(30,41,59,0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s'
          }}
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} style={{position: 'absolute', top: 32, right: 48, background: 'rgba(255,255,255,0.18)', color: 'white', border: 'none', borderRadius: 16, fontSize: 36, cursor: 'pointer', zIndex: 10, padding: '0 18px', fontWeight: 700, boxShadow: '0 2px 8px rgba(239,68,68,0.10)'}}>×</button>
            <img
              src={filteredPhotos[lightboxIndex].url}
              alt={filteredPhotos[lightboxIndex].caption}
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                borderRadius: 24,
                boxShadow: '0 12px 48px rgba(0,0,0,0.30)',
                background: '#fff',
                objectFit: 'contain',
                margin: '0 2.5rem'
              }}
              onClick={e => e.stopPropagation()}
            />
            {/* Caption dưới ảnh lớn */}
            <div style={{
              position: 'absolute',
              bottom: 48,
              left: 0,
              right: 0,
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                background: 'rgba(30,41,59,0.65)',
                borderRadius: 16,
                padding: '18px 28px',
                display: 'inline-block',
                color: '#fff',
                minWidth: 220,
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(30,41,59,0.5)'
              }}>
                <div style={{fontSize: '1.25rem', fontWeight: 700, marginBottom: 8}}>{filteredPhotos[lightboxIndex].caption}</div>
                {filteredPhotos[lightboxIndex].uploadedBy && (
                  <div style={{fontSize: '1.05em', fontWeight: 500, opacity: 0.92, marginBottom: 4}}>Người gửi: {filteredPhotos[lightboxIndex].uploadedBy}</div>
                )}
                <div style={{fontSize: '1.05em', fontWeight: 500, opacity: 0.92}}>Ngày gửi: {filteredPhotos[lightboxIndex].date && new Date(filteredPhotos[lightboxIndex].date).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
