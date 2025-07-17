"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import { residentAPI } from '@/lib/api';
import Select from 'react-select';
import { vitalSignsAPI } from '@/lib/api';
import { careNotesAPI } from '@/lib/api';
import { staffAPI } from '@/lib/api';
import { carePlansAPI, roomsAPI } from '@/lib/api';
import { userAPI } from '@/lib/api';

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

// Thêm hàm tính tuổi ở đầu file (sau import)
const getAge = (dob: string) => {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper function to format date of birth as dd-mm-yyyy
const formatDob = (dob: string) => {
  if (!dob) return 'Chưa cập nhật';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 'Chưa cập nhật';
  const day: string = String(d.getDate()).padStart(2, '0');
  const month: string = String(d.getMonth() + 1).padStart(2, '0');
  const year: number = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function FamilyPortalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // Thay state resident thành residents (mảng) và selectedResidentId
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  
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
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Thêm modal xem nhân viên phụ trách
  const [showStaffModal, setShowStaffModal] = useState(false);

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

  // Activity history states
  const [selectedActivityDate, setSelectedActivityDate] = useState('2024-05-10');
  const [showActivityHistory, setShowActivityHistory] = useState(false);

  // Thêm state cho vital signs
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [vitalLoading, setVitalLoading] = useState(false);
  const [vitalError, setVitalError] = useState('');

  // Thêm state cho lịch sử chỉ số sức khỏe
  const [vitalSignsHistory, setVitalSignsHistory] = useState<any[]>([]);
  const [vitalHistoryLoading, setVitalHistoryLoading] = useState(false);
  const [vitalHistoryError, setVitalHistoryError] = useState('');

  // Thêm state cho care notes
  const [careNotes, setCareNotes] = useState<any[]>([]);
  const [careNotesLoading, setCareNotesLoading] = useState(false);
  const [careNotesError, setCareNotesError] = useState('');

  const [staffList, setStaffList] = useState<any[]>([]);

  // Thêm state cho số phòng
  const [roomNumber, setRoomNumber] = useState<string>('Chưa cập nhật');
  const [roomLoading, setRoomLoading] = useState(false);

  // Thêm state để lưu staffName tạm thời khi fetch từ API
  const [fetchedStaffNames, setFetchedStaffNames] = useState<{[id: string]: string}>({});

  // Sửa useEffect fetch resident
  useEffect(() => {
    if (user?.id) {
      setDataLoading(true);
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr);
          setSelectedResidentId(arr.length > 0 ? arr[0]._id : "");
          setError('');
        })
        .catch((err) => {
          setError('Không tìm thấy thông tin người thân hoặc lỗi kết nối API.');
          setResidents([]);
        })
        .finally(() => setDataLoading(false));
    }
  }, [user]);

  useEffect(() => {
    staffAPI.getAll().then(data => {
      setStaffList(Array.isArray(data) ? data : []);
    }).catch(() => setStaffList([]));
  }, []);

  // Lấy resident đang chọn
  const selectedResident = residents.find(r => r._id === selectedResidentId);

  // Lấy danh sách nhân viên phụ trách (không trùng lặp)
  const staffInCharge = selectedResident && selectedResident.careNotes ? Array.from(new Set(
    selectedResident.careNotes.map((note: any) => {
      let staffName = note.staff;
      if (note.staff.includes(',')) {
        staffName = note.staff.split(',')[0].trim();
      }
      return staffName;
    })
  )) : [];

  // Handler functions for button actions
  const handleContactStaff = () => {
    router.push('/family/contact-staff');
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleVisitSchedule = () => {
    router.push('/family/schedule-visit');
  };

  const handleViewPhotos = () => {
    router.push('/family/photos');
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

  // Định nghĩa staffMembers chuẩn (object, giống contact-staff)
  const staffMembers = [
    { id: 1, name: 'Nguyễn Thị Lan', role: 'Y tá trưởng', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 2, name: 'Dr. Trần Văn Nam', role: 'Bác sĩ', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 3, name: 'Lê Thị Hoa', role: 'Nhân viên chăm sóc', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { id: 4, name: 'Phạm Văn Minh', role: 'Chuyên viên hoạt động', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: 5, name: 'Vũ Thị Mai', role: 'Quản lý ca', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' }
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
        let residentPhotos: any[] = [];
        if (selectedResident && selectedResident.id && parsedPhotos) {
          residentPhotos = parsedPhotos
            .filter((photo: any) => photo.residentId && photo.residentId.toString() === selectedResident.id.toString())
          .map((photo: any) => ({
            id: `uploaded_${photo.id}`,
            url: photo.url,
            caption: photo.caption,
            date: new Date(photo.uploadDate).toISOString().split('T')[0],
            uploadedBy: photo.uploadedBy,
            isUploaded: true
          }));
        }
        
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
    console.log('Modal states:', { showMessageModal, showStaffModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showMessageModal || showStaffModal;
    
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
  }, [showMessageModal, showStaffModal]);

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

  // Gọi API lấy vital signs khi đổi resident
  useEffect(() => {
    if (selectedResidentId) {
      setVitalLoading(true);
      setVitalError('');
      vitalSignsAPI.getByResidentId(selectedResidentId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const sorted = [...data].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            setVitalSigns(sorted[0]);
          } else {
            setVitalSigns(null);
          }
        })
        .catch(() => {
          setVitalError('Không lấy được dữ liệu chỉ số sức khỏe');
          setVitalSigns(null);
        })
        .finally(() => setVitalLoading(false));
    }
  }, [selectedResidentId]);

  // Gọi API lấy lịch sử chỉ số sức khỏe khi đổi resident
  useEffect(() => {
    if (selectedResidentId) {
      setVitalHistoryLoading(true);
      setVitalHistoryError('');
      vitalSignsAPI.getByResidentId(selectedResidentId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const sorted = [...data].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            setVitalSignsHistory(sorted);
          } else {
            setVitalSignsHistory([]);
          }
        })
        .catch(() => {
          setVitalHistoryError('Không lấy được dữ liệu chỉ số sức khỏe');
          setVitalSignsHistory([]);
        })
        .finally(() => setVitalHistoryLoading(false));
    }
  }, [selectedResidentId]);

  // Fetch care notes khi đổi resident
  useEffect(() => {
    if (selectedResidentId) {
      setCareNotesLoading(true);
      setCareNotesError('');
      careNotesAPI.getAll({ resident_id: selectedResidentId })
        .then((data) => {
          setCareNotes(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setCareNotesError('Không lấy được ghi chú chăm sóc');
          setCareNotes([]);
        })
        .finally(() => setCareNotesLoading(false));
    }
  }, [selectedResidentId]);

  // Lấy số phòng khi đổi resident
  useEffect(() => {
    if (!selectedResidentId) {
      setRoomNumber('Chưa cập nhật');
      return;
    }
    setRoomLoading(true);
    carePlansAPI.getByResidentId(selectedResidentId)
      .then((assignments: any[]) => {
        // Tìm assignment có assigned_room_id
        const assignment = Array.isArray(assignments) ? assignments.find(a => a.assigned_room_id) : null;
        const roomId = assignment?.assigned_room_id;
        if (roomId) {
          return roomsAPI.getById(roomId)
            .then((room: any) => {
              setRoomNumber(room?.room_number || 'Chưa cập nhật');
            })
            .catch(() => setRoomNumber('Chưa cập nhật'));
        } else {
          setRoomNumber('Chưa cập nhật');
        }
      })
      .catch(() => setRoomNumber('Chưa cập nhật'))
      .finally(() => setRoomLoading(false));
  }, [selectedResidentId]);

  // Bảo vệ route chỉ cho family
  useEffect(() => {
    if (!loading && user && user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
    }
  }, [user, loading, router]);
  if (loading || (user && user.role !== 'family')) return null;

  if (dataLoading) return <div>Đang tải thông tin người thân...</div>;
  if (error) return <div style={{color: 'red'}}>{error}</div>;
  if (!selectedResident) return <div>Không có dữ liệu người thân.</div>;

  const formatOptionLabel = (option: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <img
        src={option.avatar}
        alt={option.label}
        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
      />
      <div style={{ fontWeight: 700, fontSize: 20 }}>{option.label}</div>
    </div>
  );

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
          </div>
        </div>
        {/* Dropdown chọn resident có avatar bằng react-select */}
        {residents.length > 1 && (
          <div style={{ marginBottom: '2rem', maxWidth: 400 }}>
            <label style={{ 
              fontWeight: 600,
              marginRight: 8, 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: 12,
              color: '#374151',
              fontSize: '0.95rem'
            }}>
              <UsersIcon style={{width: '1.25rem', height: '1.25rem', color: '#8b5cf6'}} />
              Chọn người thân để xem thông tin
            </label>
            {/* react-select custom dropdown */}
            <Select
              options={residents.map((r: any) => ({
                value: r._id,
                label: r.full_name || r.fullName || 'Chưa rõ',
                avatar: r.avatar || '/default-avatar.svg',
                relationship: r.relationship || r.emergency_contact?.relationship || r.emergencyContact?.relationship || 'Chưa rõ'
              }))}
              value={(() => {
                const found = residents.find((r: any) => r._id === selectedResidentId);
                return found ? {
                  value: found._id,
                  label: found.full_name || found.fullName || 'Chưa rõ',
                  avatar: found.avatar || '/default-avatar.svg',
                  relationship: found.relationship || found.emergency_contact?.relationship || found.emergencyContact?.relationship || 'Chưa rõ'
                } : null;
              })()}
              onChange={opt => setSelectedResidentId(opt?.value)}
              formatOptionLabel={formatOptionLabel}
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: 12,
                  minHeight: 60,
                  fontSize: 20,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  borderColor: '#e5e7eb',
                  paddingLeft: 4
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isSelected ? '#f5f3ff' : state.isFocused ? '#f3f4f6' : '#fff',
                  color: '#111827',
                  cursor: 'pointer',
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 20,
                  fontWeight: 700
                })
              }}
              placeholder='Chọn người thân...'
            />
                      </div>
                    )}
        {/* Resident Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '0.75rem',
          boxShadow: '0 2px 8px -2px #000000',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '3.5rem', alignItems: 'center', width: '100%'}}>
              <div>
                <img 
                  src={selectedResident?.avatar || selectedResident?.avatarUrl || '/default-avatar.svg'}
                  alt={selectedResident?.fullName || 'avatar'} 
                  style={{
                    height: '10rem', 
                    width: '10rem', 
                    borderRadius: '1.5rem', 
                    objectFit: 'cover', 
                    border: '4px solid white', 
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    marginLeft: '2rem'
                  }}
                />
              </div>
              <div style={{flex: 1, marginTop: '1.5rem'}}>
                
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Họ và Tên: </span>{selectedResident?.full_name || selectedResident?.fullName || 'Chưa cập nhật'}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Ngày sinh: </span>
                  {selectedResident?.date_of_birth || selectedResident?.dateOfBirth
                    ? `${formatDob(selectedResident.date_of_birth || selectedResident.dateOfBirth)}${getAge(selectedResident.date_of_birth || selectedResident.dateOfBirth) ? ' (' + getAge(selectedResident.date_of_birth || selectedResident.dateOfBirth) + ' tuổi)' : ''}`
                    : 'Chưa cập nhật'}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Giới tính: </span>{selectedResident?.gender === 'male' ? 'Nam' : selectedResident?.gender === 'female' ? 'Nữ' : (selectedResident?.gender || 'Chưa cập nhật')}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Phòng: </span>{roomLoading ? 'Đang tải...' : roomNumber}
                </div>
                
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Mối quan hệ với người cao tuổi: </span>{selectedResident?.relationship || selectedResident?.emergency_contact?.relationship || selectedResident?.emergencyContact?.relationship || 'Chưa cập nhật'}
                </div>
                <div style={{marginBottom: '1.5rem'}}>
                  <span style={{display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, background: selectedResident?.status === 'Ổn định' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: selectedResident?.status === 'Ổn định' ? '#166534' : '#92400e', border: selectedResident?.status === 'Ổn định' ? '1px solid #86efac' : '1px solid #fbbf24'}}>
                    <div style={{width: '0.5rem', height: '0.5rem', background: selectedResident?.status === 'Ổn định' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '9999px', marginRight: '0.5rem'}}></div>
                    Trạng thái sức khỏe: {vitalLoading ? 'Đang tải...' : vitalSigns?.notes ?? 'Chưa cập nhật'}
                  </span>
                </div>
                <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
                  {/* Nút xem nhân viên phụ trách */}
                  <button
                    onClick={() => setShowStaffModal(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
                    }}
                  >
                    <UsersIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                    Nhân viên chăm sóc
                  </button>
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '1rem',
                padding: '0.125rem',
                flexShrink: 0,
                maxWidth: '300px',
                width: '100%',
                marginRight: '4rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{width: '0.875rem', height: '0.875rem', color: 'white'}} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                    <h3 style={{
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#1f2937', 
                      margin: 0
                    }}>
                      Chỉ số sức khỏe của {selectedResident?.full_name}
                    </h3>
                  </div>
                  
                  <p style={{
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    margin: '0 0 1rem 0'
                  }}>
                    <span style={{fontWeight: 600}}>Lần cập nhật gần nhất:</span> {vitalLoading ? 'Đang tải...' : vitalSigns?.date_time ? new Date(vitalSigns.date_time).toLocaleDateString('vi-VN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    }) : 'Không có dữ liệu'}
                  </p>
                  
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem'}}>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Huyết áp (mmHg)</div>
                      <div style={{fontWeight: 700, color: '#ef4444', fontSize: '0.8rem'}}>
                        {vitalLoading ? 'Đang tải...' : vitalSigns?.blood_pressure ?? 'Không có dữ liệu'}
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Nhịp tim (bpm)</div>
                      <div style={{fontWeight: 700, color: '#10b981', fontSize: '0.8rem'}}>
                        {vitalLoading ? 'Đang tải...' : vitalSigns?.heart_rate ?? 'Không có dữ liệu'}
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Nhiệt độ cơ thể</div>
                      <div style={{fontWeight: 700, color: '#f59e0b', fontSize: '0.8rem'}}>
                        {vitalLoading ? 'Đang tải...' : vitalSigns?.temperature ?? 'Không có dữ liệu'}°C
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Cân nặng hiện tại</div>
                      <div style={{fontWeight: 700, color: '#6366f1', fontSize: '0.8rem'}}>
                        {vitalLoading ? 'Đang tải...' : vitalSigns?.weight ?? 'Không có dữ liệu'} kg
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '0.375rem',
                      height: '0.375rem',
                      background: '#10b981',
                      borderRadius: '50%'
                    }} />
                    <span style={{fontSize: '0.7rem', color: '#059669', fontWeight: 600}}>
                      Tình trạng: Tất cả chỉ số đều bình thường
                    </span>
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
                Hoạt động sinh hoạt
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
                Chỉ số sức khỏe
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel style={{padding: '2rem'}}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    {showActivityHistory ? 'Lịch sử hoạt động' : 'Hoạt động hôm nay'}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {showActivityHistory && (
                      <DatePicker
                        selected={new Date(selectedActivityDate)}
                        onChange={date => {
                          if (!date) return;
                          // Chỉ cho phép chọn ngày có trong activityHistory
                          const iso = date.toISOString().slice(0, 10);
                          if (selectedResident?.activityHistory.some((day: { date: string }) => day.date === iso)) {
                            setSelectedActivityDate(iso);
                          }
                        }}
                        includeDates={(selectedResident?.activityHistory ?? []).map((day: { date: string }) => new Date(day.date))}
                        dateFormat="EEEE, d 'tháng' M, yyyy"
                        locale={vi}
                        popperPlacement="bottom"
                        showPopperArrow={false}
                        customInput={
                          <button
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '0.75rem',
                              border: '2px solid #3b82f6',
                              background: 'white',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#374151',
                              cursor: 'pointer',
                              minWidth: '220px',
                              textAlign: 'left',
                              boxShadow: '0 2px 8px rgba(59,130,246,0.07)'
                            }}
                          >
                            {new Date(selectedActivityDate).toLocaleDateString('vi-VN', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </button>
                        }
                      />
                    )}
                    <button
                      onClick={() => setShowActivityHistory(!showActivityHistory)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #8b5cf6',
                        background: showActivityHistory ? 'white' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: showActivityHistory ? '#8b5cf6' : 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        if (showActivityHistory) {
                          e.currentTarget.style.background = '#f3f4f6';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (showActivityHistory) {
                          e.currentTarget.style.background = 'white';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                        }
                      }}
                    >
                      <CalendarDaysIcon style={{width: '1rem', height: '1rem'}} />
                      {showActivityHistory ? 'Xem hôm nay' : 'Xem lịch sử hoạt động'}
                    </button>
                  </div>
                </div>

                {showActivityHistory ? (
                  <div>
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <InformationCircleIcon style={{width: '1.25rem', height: '1.25rem', color: '#0369a1'}} />
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#0369a1'
                        }}>
                          Lịch sử hoạt động - {new Date(selectedActivityDate).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#0c4a6e',
                        margin: 0
                      }}>
                        Xem lại các hoạt động đã tham gia trong ngày được chọn. 
                      </p>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                      {(selectedResident?.activityHistory ?? [])
                        .find((day: { date: string; activities: any[] }) => day.date === selectedActivityDate)?.activities
                        ?.map((activity: any) => (
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
                              <XCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#dc2626'}} />
                            )}
                          </div>
                          <div style={{flex: 1}}>
                            <div style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                              <span style={{fontWeight: 600, color: '#374151'}}>Hoạt động: </span>{activity.name}
                            </div>
                            <div style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                              <span style={{fontWeight: 600}}>Thời gian: </span>{activity.time}{activity.endTime ? ` - ${activity.endTime}` : ''}
                            </div>
                            <span style={{fontSize: '0.75rem', fontWeight: 500, color: activity.participated ? '#166534' : '#dc2626', display: 'block', marginBottom: !activity.participated && activity.reason ? '0.25rem' : 0}}>
                              <span style={{fontWeight: 600}}>Trạng thái: </span>{activity.participated ? 'Đã tham gia' : 'Không tham gia'}
                            </span>
                            {!activity.participated && activity.reason && (
                              <div style={{
                                fontSize: '0.75rem', 
                                color: '#dc2626', 
                                fontStyle: 'italic',
                                background: 'rgba(220, 38, 38, 0.07)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                border: '1px solid rgba(220, 38, 38, 0.15)',
                                marginTop: 0
                              }}>
                                <span style={{fontWeight: 600}}>Lý do: </span>{activity.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {Array.isArray(selectedResident?.activities) && selectedResident?.activities.length > 0 ? (
                      selectedResident.activities.map((activity: any) => (
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
                          <div style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                            <span style={{fontWeight: 600}}>Thời gian: </span>{activity.time}{activity.endTime ? ` - ${activity.endTime}` : ''}
                          </div>
                          <span style={{fontSize: '0.75rem', fontWeight: 500, color: activity.participated ? '#166534' : '#6b7280'}}>
                            <span style={{fontWeight: 600}}>Trạng thái: </span>{activity.participated ? 'Đã tham gia' : 'Chưa tham gia'}
                          </span>
                        </div>
                      </div>
                      ))
                    ) : (
                      <div>Không có dữ liệu hoạt động</div>
                    )}
                  </div>
                )}
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
                      {careNotesLoading ? (
                        <tr><td colSpan={3}>Đang tải ghi chú chăm sóc...</td></tr>
                      ) : careNotesError ? (
                        <tr><td colSpan={3} style={{color: 'red'}}>{careNotesError}</td></tr>
                      ) : Array.isArray(careNotes) && careNotes.length > 0 ? (
                        careNotes.map((note: any) => {
                          return (
                            <tr key={note._id} style={{borderTop: '1px solid #e5e7eb'}}>
                              <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#6b7280', whiteSpace: 'nowrap'}}>
                                {note.date ? new Date(note.date).toLocaleDateString('vi-VN') : ''}
                              </td>
                              <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#374151'}}>
                                <div style={{fontWeight: 700, marginBottom: 4}}>{note.assessment_type || 'Đánh giá'}</div>
                                <div style={{marginBottom: 2}}><span style={{fontWeight: 600}}>Ghi chú: </span>{note.notes || 'Không có ghi chú'}</div>
                                <div><span style={{fontWeight: 600}}>Khuyến nghị: </span>{note.recommendations || 'Không có khuyến nghị'}</div>
                              </td>
                              <td style={{padding: '0.75rem', fontSize: '0.95em'}}>
                                <span style={{fontWeight: 700, color: '#8b5cf6'}}>{
                                  (() => {
                                    const staff = staffList.find((s: any) => String(s._id) === String(note.conducted_by));
                                    if (staff) {
                                      return staff.fullName || staff.full_name || staff.name || staff.username || staff.email;
                                    }
                                    if (note.conducted_by && fetchedStaffNames[note.conducted_by]) {
                                      return fetchedStaffNames[note.conducted_by];
                                    }
                                    if (note.conducted_by && !fetchedStaffNames[note.conducted_by]) {
                                      // Dùng userAPI.getById để lấy tên staff
                                      userAPI.getById(note.conducted_by)
                                        .then(data => {
                                          setFetchedStaffNames(prev => ({
                                            ...prev,
                                            [note.conducted_by]: (data.full_name || data.fullName || data.name || data.username || data.email || note.conducted_by) + (data.position ? ` (${data.position})` : '')
                                          }));
                                        })
                                        .catch(() => {
                                          setFetchedStaffNames(prev => ({
                                            ...prev,
                                            [note.conducted_by]: note.conducted_by
                                          }));
                                        });
                                      return 'Đang tải...';
                                    }
                                    return '---';
                                  })()
                                }</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={3}>Không có ghi chú chăm sóc</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Lịch sử chỉ số sức khỏe
                </h3>
                <div style={{overflowX: 'auto'}}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    background: 'white',
                    borderRadius: 16,
                    boxShadow: '0 4px 24px rgba(139,92,246,0.07)',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{
                        background: 'linear-gradient(90deg, #ede9fe 0%, #f3f4f6 100%)'
                      }}>
                        {['Ngày', 'Thời gian đo', 'Huyết áp', 'Nhịp tim', 'Nhiệt độ', 'Cân nặng', 'Ghi chú'].map((h, i) => (
                          <th key={i} style={{
                            padding: '1rem',
                            textAlign: 'left',
                            color: '#7c3aed',
                            fontWeight: 800,
                            fontSize: 15,
                            letterSpacing: 1,
                            borderBottom: '2px solid #ede9fe',
                            textTransform: 'uppercase'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vitalHistoryLoading ? (
                        <tr><td colSpan={7} style={{padding: '1.5rem', textAlign: 'center', color: '#8b5cf6'}}>Đang tải dữ liệu...</td></tr>
                      ) : vitalSignsHistory.length > 0 ? (
                        vitalSignsHistory.map((vital: any, index: number) => (
                          <tr key={vital._id}
                            style={{
                              background: index % 2 === 0 ? '#fff' : '#f8fafc',
                              transition: 'background 0.2s'
                            }}>
                            <td style={{padding: '1rem', fontWeight: 600, color: '#374151'}}>
                              {vital.date_time ? new Date(vital.date_time).toLocaleDateString('vi-VN') : ''}
                            </td>
                            <td style={{padding: '1rem', color: '#6b7280'}}>
                              {vital.date_time ? new Date(vital.date_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </td>
                            <td style={{padding: '1rem', fontWeight: 700, color: '#ef4444', fontSize: 16}}>
                              {vital.blood_pressure ?? <span style={{color:'#9ca3af'}}>--</span>}
                            </td>
                            <td style={{padding: '1rem', fontWeight: 700, color: '#10b981', fontSize: 16}}>
                                {vital.heart_rate ?? <span style={{color:'#9ca3af'}}>--</span>}
                            </td>
                            <td style={{padding: '1rem', fontWeight: 700, color: '#f59e0b', fontSize: 16}}>
                              {vital.temperature ?? <span style={{color:'#9ca3af'}}>--</span>}
                            </td>
                            <td style={{padding: '1rem', fontWeight: 700, color: '#6366f1', fontSize: 16}}>
                              {vital.weight ?? <span style={{color:'#9ca3af'}}>--</span>}
                            </td>
                            <td style={{padding: '1rem', color: '#6b7280', fontStyle: 'italic', fontSize: 15}}>
                              {vital.notes ?? <span style={{color:'#9ca3af'}}>--</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{padding: '1.5rem', textAlign: 'center', color: '#9ca3af'}}>Không có dữ liệu chỉ số sức khỏe</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Modal hiển thị danh sách nhân viên phụ trách */}
      {showStaffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out',
          marginLeft: '140px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '0',
            width: '520px',
            maxWidth: '120vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header đơn giản */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '1rem 1rem 0 0',
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: '#6366f1',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UsersIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: '#1f2937',
                      margin: '0 0 0.25rem 0'
                    }}>
                      Đội ngũ chăm sóc
                    </h2>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Nhân viên đang chăm sóc người cao tuổi {selectedResident?.fullName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStaffModal(false)}
                  title="Đóng"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <XMarkIcon style={{width: '1.125rem', height: '1.125rem'}} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '1.5rem',
              background: 'white'
            }}>
              {/* Staff list đơn giản */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {staffMembers.map((staff) => (
                  <div key={staff.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: '#6366f1',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg style={{width: '1rem', height: '1rem', color: 'white'}} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {staff.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {staff.role}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStaffModal(false);
                        router.push(`/family/contact-staff?staffId=${staff.id}`);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#5b21b6';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#6366f1';
                      }}
                    >
                      <ChatBubbleLeftRightIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      Nhắn tin
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer message đơn giản */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef3c7',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
