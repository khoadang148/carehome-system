"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { activityParticipationsAPI } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';
import { activitiesAPI } from '@/lib/api';

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

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return '/default-avatar.svg';
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) return avatarPath;
  
  // If it's a base64 data URL, return as is
  if (avatarPath.startsWith('data:')) return avatarPath;
  
  // Convert relative path to full URL
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
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

  // --- HOẠT ĐỘNG SINH HOẠT STATE ---
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [selectedActivityDate, setSelectedActivityDate] = useState('');
  const [activityHistoryDates, setActivityHistoryDates] = useState<string[]>([]);
  const [serverToday, setServerToday] = useState<string>('');
  // Thêm state để cache thời gian hoạt động
  const [activityTimes, setActivityTimes] = useState<{[activityId: string]: {start: string, end: string}}>( {} );

  // Fetch activity times for all activities when activities change
  useEffect(() => {
    const missingIds = activities
      .map((activity: any) => activity.activity_id?._id || activity.activity_id)
      .filter((id: any) => id && !activityTimes[id]);
    if (missingIds.length === 0) return;
    missingIds.forEach((id: any) => {
      if (!id) {
        console.warn('Skipping null/undefined activity ID');
        return;
      }
      activitiesAPI.getById(id)
        .then(data => {
          // Chuyển đổi thời gian từ UTC về múi giờ Việt Nam (+7)
          const convertToVietnamTime = (utcTime: string) => {
            if (!utcTime) return '';
            const utcDate = new Date(utcTime);
            const vietnamTime = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // +7 giờ
            return vietnamTime.toISOString();
          };
          
          setActivityTimes(prev => ({
            ...prev,
            [id]: {
              start: convertToVietnamTime(data.schedule_time),
              end: convertToVietnamTime(data.end_time) || (data.duration && data.schedule_time
                ? convertToVietnamTime(new Date(new Date(data.schedule_time).getTime() + data.duration * 60000).toISOString())
                : '')
            }
          }));
        })
        .catch(error => {
          console.error(`Error fetching activity ${id}:`, error);
        });
    });
  }, [activities, activityTimes]);

  // Lấy ngày hiện tại từ server
  useEffect(() => {
    const getServerDate = async () => {
      try {
        // Gọi API để lấy ngày hiện tại từ server
        const response = await fetch('/api/current-date', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Server date:', data.date); // Debug log
          console.log('Server timezone:', data.timezone); // Debug log
          console.log('Original time:', data.originalTime); // Debug log
          console.log('Vietnam time:', data.vietnamTime); // Debug log
          setServerToday(data.date);
        } else {
          // Fallback: sử dụng ngày client nếu API không có sẵn
          const clientDate = new Date().toISOString().slice(0, 10);
          console.log('Using client date:', clientDate); // Debug log
          setServerToday(clientDate);
        }
      } catch (error) {
        // Fallback: sử dụng ngày client nếu có lỗi
        const clientDate = new Date().toISOString().slice(0, 10);
        console.log('Error getting server date, using client date:', clientDate); // Debug log
        setServerToday(clientDate);
      }
    };
    getServerDate();
  }, []);

  // --- PHÂN TRANG GHI CHÚ CHĂM SÓC ---
  const [careNotesPage, setCareNotesPage] = useState(1);
  const notesPerPage = 5;
  const totalNotes = careNotes.length;
  const totalPages = Math.ceil(totalNotes / notesPerPage);
  const paginatedNotes = careNotes.slice((careNotesPage-1)*notesPerPage, careNotesPage*notesPerPage);
  useEffect(()=>{ setCareNotesPage(1); }, [careNotes.length]); // Reset về trang 1 khi đổi resident

  // --- PHÂN TRANG CHỈ SỐ SỨC KHỎE ---
  const [vitalPage, setVitalPage] = useState(1);
  const vitalPerPage = 5;
  const totalVital = vitalSignsHistory.length;
  const totalVitalPages = Math.ceil(totalVital / vitalPerPage);
  const paginatedVital = vitalSignsHistory.slice((vitalPage-1)*vitalPerPage, vitalPage*vitalPerPage);
  useEffect(()=>{ setVitalPage(1); }, [vitalSignsHistory.length]); // Reset về trang 1 khi đổi resident

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
  const staffInCharge: string[] = selectedResident && selectedResident.careNotes ? Array.from(new Set(
    selectedResident.careNotes.map((note: any) => {
      let staffName = note.staff;
      if (typeof staffName === 'object' && staffName !== null) {
        staffName = staffName.full_name || staffName.fullName || staffName.name || staffName.username || staffName.email || '';
      }
      if (typeof staffName === 'string' && staffName.includes(',')) {
        staffName = staffName.split(',')[0].trim();
      }
      return staffName;
    })
  )) : [];

  // Tạo danh sách staff cho modal
  const staffMembers = staffInCharge.map((staffName: string, index: number) => ({
    id: `staff-${index}`,
    name: staffName,
    role: 'Nhân viên chăm sóc'
  }));

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
      }
    } catch (error) {
      console.error('Error loading photos:', error);
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

  // Fetch activities when resident or mode changes
  useEffect(() => {
    if (!selectedResidentId) return;
    setActivitiesLoading(true);
    setActivitiesError('');
    activityParticipationsAPI.getByResidentId(selectedResidentId)
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        // Group by date (YYYY-MM-DD)
        const grouped: Record<string, any[]> = {};
        arr.forEach((item) => {
          const date = item.date?.slice(0, 10);
          if (!date) return;
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
        });
        // Get all available dates (desc) - chỉ để hiển thị trong lịch sử
        const allDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setActivityHistoryDates(allDates);
        
        // Lấy ngày hôm nay thực sự - sử dụng serverToday nếu có, không thì dùng client
        const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);
        console.log('Today from API:', todayFromAPI); // Debug log
        console.log('Available dates:', allDates); // Debug log
        console.log('Grouped activities:', grouped); // Debug log
        
        if (!showActivityHistory) {
          // Chỉ hiển thị hoạt động của ngày hôm nay
          if (grouped[todayFromAPI] && grouped[todayFromAPI].length > 0) {
            console.log('Found activities for today:', grouped[todayFromAPI]); // Debug log
            
            // Loại bỏ trùng lặp - chỉ lấy bản ghi mới nhất cho mỗi activity_id
            const uniqueActivities = grouped[todayFromAPI].reduce((acc: any[], current: any) => {
              const activityId = current.activity_id?._id || current.activity_id;
              const existingIndex = acc.findIndex(item => 
                (item.activity_id?._id || item.activity_id) === activityId
              );
              
              if (existingIndex === -1) {
                // Chưa có, thêm vào
                acc.push(current);
              } else {
                // Đã có, so sánh thời gian cập nhật và lấy bản mới nhất
                const existing = acc[existingIndex];
                const existingTime = new Date(existing.updated_at || existing.created_at || 0);
                const currentTime = new Date(current.updated_at || current.created_at || 0);
                
                if (currentTime > existingTime) {
                  acc[existingIndex] = current;
                }
              }
              return acc;
            }, []);
            
            console.log('Unique activities after deduplication:', uniqueActivities); // Debug log
            setSelectedActivityDate(todayFromAPI);
            setActivities(uniqueActivities);
          } else {
            // Không có hoạt động hôm nay
            console.log('No activities for today, showing empty state'); // Debug log
            setSelectedActivityDate(''); // Reset selected date
            setActivities([]);
          }
        } else {
          // If viewing history, keep selected date or pick most recent
          const date = selectedActivityDate && grouped[selectedActivityDate] ? selectedActivityDate : allDates[0] || '';
          
          // Loại bỏ trùng lặp cho history mode cũng vậy
          const dateActivities = grouped[date] || [];
          const uniqueActivities = dateActivities.reduce((acc: any[], current: any) => {
            const activityId = current.activity_id?._id || current.activity_id;
            const existingIndex = acc.findIndex(item => 
              (item.activity_id?._id || item.activity_id) === activityId
            );
            
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              const existing = acc[existingIndex];
              const existingTime = new Date(existing.updated_at || existing.created_at || 0);
              const currentTime = new Date(current.updated_at || current.created_at || 0);
              
              if (currentTime > existingTime) {
                acc[existingIndex] = current;
              }
            }
            return acc;
          }, []);
          
          setSelectedActivityDate(date);
          setActivities(uniqueActivities);
        }
      })
      .catch((err) => {
        setActivitiesError('Không lấy được dữ liệu hoạt động.');
        setActivities([]);
        setActivityHistoryDates([]);
      })
      .finally(() => setActivitiesLoading(false));
  // eslint-disable-next-line
}, [selectedResidentId, showActivityHistory, serverToday]);

// When selectedActivityDate changes in history mode, update activities
useEffect(() => {
  if (!showActivityHistory || !selectedActivityDate || !selectedResidentId) return;
  setActivitiesLoading(true);
  setActivitiesError('');
  activityParticipationsAPI.getByResidentId(selectedResidentId)
    .then((data) => {
      const arr = Array.isArray(data) ? data : [];
      const grouped: Record<string, any[]> = {};
      arr.forEach((item) => {
        const date = item.date?.slice(0, 10);
        if (!date) return;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(item);
      });
      // Loại bỏ trùng lặp cho history mode
      const dateActivities = grouped[selectedActivityDate] || [];
      const uniqueActivities = dateActivities.reduce((acc: any[], current: any) => {
        const activityId = current.activity_id?._id || current.activity_id;
        const existingIndex = acc.findIndex(item => 
          (item.activity_id?._id || item.activity_id) === activityId
        );
        
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          const existing = acc[existingIndex];
          const existingTime = new Date(existing.updated_at || existing.created_at || 0);
          const currentTime = new Date(current.updated_at || current.created_at || 0);
          
          if (currentTime > existingTime) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, []);
      
      setActivities(uniqueActivities);
    })
    .catch(() => setActivities([]))
    .finally(() => setActivitiesLoading(false));
// eslint-disable-next-line
}, [selectedActivityDate]);

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
        
        {/* Enhanced Family Member Selector */}
        {residents.length > 1 && (
          <div style={{ 
            marginBottom: '2.5rem', 
            maxWidth: 5000,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <UsersIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Chọn người thân để xem thông tin
                </h3>
                
              </div>
            </div>
            
            {/* Enhanced react-select dropdown */}
            <Select
              options={residents.map((r: any) => ({
                value: r._id,
                label: r.full_name || r.fullName || 'Chưa rõ',
                avatar: getAvatarUrl(r.avatar || r.avatarUrl) || '/default-avatar.svg',
                relationship: r.relationship || r.emergency_contact?.relationship || r.emergencyContact?.relationship || 'Chưa rõ'
              }))}
              value={(() => {
                const found = residents.find((r: any) => r._id === selectedResidentId);
                return found ? {
                  value: found._id,
                  label: found.full_name || found.fullName || 'Chưa rõ',
                  avatar: getAvatarUrl(found.avatar || found.avatarUrl) || '/default-avatar.svg',
                  relationship: found.relationship || found.emergency_contact?.relationship || found.emergencyContact?.relationship || 'Chưa rõ'
                } : null;
              })()}
              onChange={opt => setSelectedResidentId(opt?.value)}
              formatOptionLabel={formatOptionLabel}
              isSearchable
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderRadius: '1rem',
                  minHeight: 70,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  boxShadow: state.isFocused 
                    ? '0 0 0 3px rgba(139, 92, 246, 0.1), 0 8px 25px -5px rgba(0, 0, 0, 0.1)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  borderColor: state.isFocused ? '#8b5cf6' : '#e5e7eb',
                  borderWidth: state.isFocused ? '2px' : '1px',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  transition: 'all 0.2s ease',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isSelected 
                    ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' 
                    : state.isFocused 
                    ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' 
                    : '#fff',
                  color: state.isSelected ? '#7c3aed' : '#111827',
                  cursor: 'pointer',
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
                  paddingLeft: '1.5rem',
                  paddingRight: '1.5rem',
                  fontSize: '1.125rem',
                  fontWeight: state.isSelected ? 700 : 600,
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)'
                  }
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '1rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden'
                }),
                menuList: (base) => ({
                  ...base,
                  padding: '0.5rem'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#7c3aed',
                  fontWeight: 700
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af',
                  fontWeight: 500
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: '#8b5cf6',
                  '&:hover': {
                    color: '#7c3aed'
                  }
                }),
                indicatorSeparator: (base) => ({
                  ...base,
                  backgroundColor: '#e5e7eb'
                })
              }}
              placeholder='Chọn người thân...'
            />
          </div>
        )}
        {/* Resident Overview */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1.5px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(30,41,59,0.08)',
          padding: '2.5rem 3rem',
          maxWidth: 1500,
          margin: '2rem auto',
        }}>
          {/* Avatar, tên, badge ở trên cùng, căn giữa */}
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32}}>
            <img src={getAvatarUrl(selectedResident?.avatar)} alt="avatar"
              style={{width: 120, height: 120, borderRadius: '50%', border: '4px solid #6366f1', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)', objectFit: 'cover', marginBottom: 12}} />
            <div style={{fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 2, letterSpacing: 0.2, textTransform: 'uppercase'}}>Người cao tuổi:</div>
            <h1 style={{fontWeight: 800, fontSize: 28, color: '#1e293b', margin: 0, lineHeight: 1.2, textAlign: 'center'}}>{selectedResident?.full_name}</h1>
            <div style={{
              fontSize: 14, fontWeight: 600, marginTop: 8,
              background: selectedResident?.status === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #64748b, #475569)',
              color: 'white', borderRadius: 20, padding: '6px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center'
            }}>{selectedResident?.status === 'active' ? 'Đang nằm viện' : 'Đã xuất viện'}</div>
            <div style={{fontSize: 13, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8}}>
              <CalendarDaysIcon style={{width: 16, height: 16}} />
              Ngày nhập viện: {selectedResident?.admission_date ? formatDob(selectedResident.admission_date) : 'Chưa cập nhật'}
            </div>
          </div>
          {/* Grid 2 cột: Thông tin cá nhân + Liên hệ khẩn cấp | Chỉ số sức khỏe */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start'}}>
            {/* Cột trái: Thông tin cá nhân + Liên hệ khẩn cấp */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
              {/* Card Thông tin cá nhân */}
              <div style={{background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
                <div style={{fontWeight: 700, color: '#1e293b', fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '2px solid #6366f1'}}>
                  <div style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <UsersIcon style={{width: 18, height: 18, color: 'white'}} />
                  </div>
                  Thông tin cá nhân
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 14, fontSize: 15}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                    <span style={{color: '#64748b', fontWeight: 600}}>Họ và tên người cao tuổi:</span>
                    <span style={{color: '#1e293b', fontWeight: 600, textAlign: 'center'}}>{selectedResident?.full_name}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                    <span style={{color: '#64748b', fontWeight: 600}}>Ngày sinh:</span>
                    <span style={{color: '#1e293b', fontWeight: 600}}>
                      {selectedResident?.date_of_birth || selectedResident?.dateOfBirth ? 
                        `${formatDob(selectedResident.date_of_birth || selectedResident.dateOfBirth)}${getAge(selectedResident.date_of_birth || selectedResident.dateOfBirth) ? ' (' + getAge(selectedResident.date_of_birth || selectedResident.dateOfBirth) + ' tuổi)' : ''}` : 
                        'Chưa cập nhật'
                      }
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                    <span style={{color: '#64748b', fontWeight: 600}}>Giới tính:</span>
                    <span style={{color: '#1e293b', fontWeight: 600}}>
                      {selectedResident?.gender === 'male' ? 'Nam' : selectedResident?.gender === 'female' ? 'Nữ' : (selectedResident?.gender || 'Chưa cập nhật')}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                    <span style={{color: '#64748b', fontWeight: 600}}>Phòng:</span>
                    <span style={{color: '#1e293b', fontWeight: 600}}>
                      {roomLoading ? 'Đang tải...' : roomNumber}
                    </span>
                  </div>
                </div>
              </div>
              {/* Card Liên hệ khẩn cấp */}
              <div style={{background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', border: '1px solid #fecaca', borderRadius: 16, padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
                <div style={{fontWeight: 700, color: '#1e293b', fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '2px solid #ef4444'}}>
                  <div style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <PhoneIcon style={{width: 18, height: 18, color: 'white'}} />
                  </div>
                  Liên hệ khẩn cấp
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 14, fontSize: 15}}>
                  {selectedResident?.emergency_contact?.name ? (
                    <>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                        <span style={{color: '#64748b', fontWeight: 600}}>Tên người liên hệ:</span>
                        <span style={{color: '#1e293b', fontWeight: 600}}>{selectedResident.emergency_contact.name}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                        <span style={{color: '#64748b', fontWeight: 600}}>Quan hệ với người cao tuổi:</span>
                        <span style={{color: '#1e293b', fontWeight: 600}}>{selectedResident.emergency_contact.relationship}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                        <span style={{color: '#64748b', fontWeight: 600}}>Số điện thoại liên hệ:</span>
                        <span style={{color: '#1e293b', fontWeight: 600}}>{selectedResident.emergency_contact.phone}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '16px 0'}}>
                      Chưa cập nhật thông tin liên hệ khẩn cấp
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Cột phải: Chỉ số sức khỏe */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 32, justifyContent: 'flex-start'}}>
              <div style={{background: '#fff', border: '1.5px solid #e0e7ef', borderRadius: 18, padding: '2.5rem 2rem 2rem 2rem', boxShadow: '0 2px 8px #e0e7ef'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16}}>
                  <svg width="22" height="22" fill="#ef3b7d" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{fontWeight: 700, fontSize: 19, color: '#1e293b', textAlign: 'center'}}>Chỉ số sức khỏe của {selectedResident?.full_name}</span>
                </div>
                <div style={{fontSize: 15, color: '#64748b', marginBottom: 22, textAlign: 'center'}}>
                  Lần cập nhật gần nhất: {vitalLoading ? 'Đang tải...' : vitalSigns?.date_time ? formatDateDDMMYYYY(vitalSigns.date_time) : 'Không có dữ liệu'}
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem', fontSize: 16, marginBottom: 22}}>
                  <div style={{background: '#fef2f2', borderRadius: 12, padding: '1.2rem', border: '1px solid #fecaca'}}>
                    <div style={{color: '#b91c1c', fontWeight: 600, fontSize: 14, marginBottom: 2}}>Huyết áp (mmHg)</div>
                    <div style={{fontWeight: 700, color: '#dc2626', fontSize: 19}}>{vitalLoading ? 'Đang tải...' : vitalSigns?.blood_pressure ?? '--'}</div>
                  </div>
                  <div style={{background: '#f0fdf4', borderRadius: 12, padding: '1.2rem', border: '1px solid #bbf7d0'}}>
                    <div style={{color: '#047857', fontWeight: 600, fontSize: 14, marginBottom: 2}}>Nhịp tim (bpm)</div>
                    <div style={{fontWeight: 700, color: '#10b981', fontSize: 19}}>{vitalLoading ? 'Đang tải...' : vitalSigns?.heart_rate ?? '--'}</div>
                  </div>
                  <div style={{background: '#fefce8', borderRadius: 12, padding: '1.2rem', border: '1px solid #fde68a'}}>
                    <div style={{color: '#b45309', fontWeight: 600, fontSize: 14, marginBottom: 2}}>Nhiệt độ cơ thể</div>
                    <div style={{fontWeight: 700, color: '#f59e42', fontSize: 19}}>{vitalLoading ? 'Đang tải...' : vitalSigns?.temperature ?? '--'}°C</div>
                  </div>
                  <div style={{background: '#f3f4f6', borderRadius: 12, padding: '1.2rem', border: '1px solid #e0e7ef'}}>
                    <div style={{color: '#6366f1', fontWeight: 600, fontSize: 14, marginBottom: 2}}>Cân nặng hiện tại</div>
                    <div style={{fontWeight: 700, color: '#6366f1', fontSize: 19}}>{vitalLoading ? 'Đang tải...' : vitalSigns?.weight ?? '--'} kg</div>
                  </div>
                </div>
                <div style={{marginTop: 8, padding: '0.9rem 1.1rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', color: '#059669', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center'}}>
                  <span style={{width: 13, height: 13, background: '#10b981', borderRadius: '50%', display: 'inline-block'}}></span>
                  Tình trạng: {vitalLoading ? 'Đang tải...' : vitalSigns?.notes ?? 'Chưa cập nhật'}
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
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
                  <h3 style={{fontSize:'1.125rem',fontWeight:600,color:'#111827',margin:0}}>
                    {showActivityHistory ? 'Lịch sử hoạt động' : 'Hoạt động hôm nay'}
                  </h3>
                  <div style={{display:'flex',gap:'1rem',alignItems:'center',flexWrap:'wrap'}}>
                    {showActivityHistory && (
                      <DatePicker
                        selected={selectedActivityDate ? new Date(selectedActivityDate) : null}
                        onChange={date => {
                          if (!date) return;
                          const iso = date.toISOString().slice(0,10);
                          if (activityHistoryDates.includes(iso)) setSelectedActivityDate(iso);
                        }}
                        includeDates={activityHistoryDates.map(d=>new Date(d))}
                        openToDate={selectedActivityDate ? new Date(selectedActivityDate) : undefined}
                        dateFormat="EEEE, d 'tháng' M, yyyy"
                        locale={vi}
                        popperPlacement="bottom"
                        showPopperArrow={false}
                        customInput={
                          <button style={{padding:'0.5rem 1rem',borderRadius:'0.75rem',border:'2px solid #3b82f6',background:'white',fontSize:'1rem',fontWeight:600,color:'#374151',cursor:'pointer',minWidth:'220px',textAlign:'left',boxShadow:'0 2px 8px rgba(59,130,246,0.07)'}}>
                            {formatDateDDMMYYYY(selectedActivityDate)}
                          </button>
                        }
                      />
                    )}
                    <button
                      onClick={() => {
                        setShowActivityHistory(v => !v);
                        // Khi chuyển về "hôm nay", reset selectedActivityDate về ngày hôm nay
                        if (showActivityHistory) {
                          const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);
                          setSelectedActivityDate(todayFromAPI);
                        }
                      }}
                      style={{padding:'0.5rem 1rem',borderRadius:'0.5rem',border:'1px solid #8b5cf6',background:showActivityHistory?'white':'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',color:showActivityHistory?'#8b5cf6':'white',fontSize:'0.875rem',fontWeight:600,cursor:'pointer',transition:'all 0.2s ease',display:'flex',alignItems:'center',gap:'0.5rem'}}
                      onMouseOver={e=>{e.currentTarget.style.background=showActivityHistory?'#f3f4f6':'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';}}
                      onMouseOut={e=>{e.currentTarget.style.background=showActivityHistory?'white':'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';}}
                    >
                      <CalendarDaysIcon style={{width:'1rem',height:'1rem'}}/>
                      {showActivityHistory?'Xem hôm nay':'Xem lịch sử hoạt động'}
                    </button>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {activitiesLoading ? (
                    <div>Đang tải dữ liệu hoạt động...</div>
                  ) : activitiesError ? (
                    <div style={{color:'red'}}>{activitiesError}</div>
                  ) : Array.isArray(activities) && activities.length > 0 ? (
                    activities.map((activity:any) => {
                      const attended = activity.attendance_status === 'attended';
                      const absent = activity.attendance_status === 'absent';
                      const activityId = activity.activity_id?._id || activity.activity_id;
                      // Format thời gian hiển thị
                      const formatTimeForDisplay = (isoTime: string) => {
                        if (!isoTime) return '';
                        const date = new Date(isoTime);
                        return date.toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                      };
                      
                      const time = activityTimes[activityId]?.start ? formatTimeForDisplay(activityTimes[activityId].start) : '';
                      const endTimeStr = activityTimes[activityId]?.end ? formatTimeForDisplay(activityTimes[activityId].end) : '';
                      return (
                        <div key={activity._id} style={{display:'flex',alignItems:'center',padding:'1rem',borderRadius:'0.75rem',background:attended?'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)':absent?'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)':'#fff',border:'1px solid',borderColor:attended?'#86efac':absent?'#d1d5db':'#e5e7eb'}}>
                          <div style={{marginRight:'1rem'}}>
                            {attended ? (
                              <CheckCircleIcon style={{width:'1.5rem',height:'1.5rem',color:'#16a34a'}}/>
                            ) : absent ? (
                              <XCircleIcon style={{width:'1.5rem',height:'1.5rem',color:'#ef4444'}}/>
                            ) : (
                              <ClockIcon style={{width:'1.5rem',height:'1.5rem',color:'#6b7280'}}/>
                            )}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.95rem',fontWeight:600,color:'#111827',marginBottom:'0.25rem'}}>
                              <span style={{fontWeight:600,color:'#374151'}}>Hoạt động: </span>{activity.activity_id?.activity_name || '---'}
                            </div>
                            <div style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:'0.25rem'}}>
                              <span style={{fontWeight:600}}>Thời gian: </span>{time}{endTimeStr?` - ${endTimeStr}`:''}
                            </div>
                            <span style={{fontSize:'0.8rem',fontWeight:500,color:attended?'#166534':absent?'#ef4444':'#6b7280'}}>
                              <span style={{fontWeight:600}}>Trạng thái: </span>
                              {attended ? 'Đã tham gia' : absent ? <>Không tham gia{activity.performance_notes && <> - Lý do: <span style={{color:'#ef4444'}}>{activity.performance_notes}</span></>}</> : 'Chưa tham gia'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3rem 2rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '1rem',
                      border: '2px dashed #cbd5e1',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '4rem',
                        height: '4rem',
                        background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <CalendarDaysIcon style={{ width: '2rem', height: '2rem', color: '#64748b' }} />
                      </div>
                      <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#374151',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Chưa có hoạt động hôm nay
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        margin: 0,
                        maxWidth: '300px',
                        lineHeight: 1.5
                      }}>
                        Hôm nay chưa có hoạt động nào được lên lịch cho người thân của bạn.
                      </p>
                    </div>
                  )}
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
                      {careNotesLoading ? (
                        <tr><td colSpan={3}>Đang tải ghi chú chăm sóc...</td></tr>
                      ) : careNotesError ? (
                        <tr><td colSpan={3} style={{color: 'red'}}>{careNotesError}</td></tr>
                      ) : Array.isArray(paginatedNotes) && paginatedNotes.length > 0 ? (
                        paginatedNotes.map((note: any) => {
                          return (
                            <tr key={note._id} style={{borderTop: '1px solid #e5e7eb'}}>
                              <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#6b7280', whiteSpace: 'nowrap'}}>
                                {note.date ? formatDateDDMMYYYY(note.date) : ''}
                              </td>
                              <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#374151'}}>
                                <div style={{fontWeight: 700, marginBottom: 4}}>{note.assessment_type || 'Đánh giá'}</div>
                                <div style={{marginBottom: 2}}><span style={{fontWeight: 600}}>Ghi chú: </span>{note.notes || 'Không có ghi chú'}</div>
                                <div><span style={{fontWeight: 600}}>Khuyến nghị: </span>{note.recommendations || 'Không có khuyến nghị'}</div>
                              </td>
                              <td style={{padding: '0.75rem', fontSize: '0.95em'}}>
                                <span style={{fontWeight: 700, color: '#8b5cf6'}}>{
                                  (() => {
                                    let conductedBy = note.conducted_by;
                                    if (typeof conductedBy === 'object' && conductedBy !== null) {
                                      const name = conductedBy.full_name || conductedBy.fullName || conductedBy.name || conductedBy.username || conductedBy.email || '';
                                      const pos = conductedBy.position;
                                      return pos ? `${pos}: ${name}` : name;
                                    }
                                    // Nếu conductedBy là tên (có dấu tiếng Việt), hiển thị trực tiếp
                                    if (conductedBy && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(conductedBy)) {
                                      return conductedBy;
                                    }
                                    const staff = staffList.find((s: any) => String(s._id) === String(conductedBy));
                                    if (staff) {
                                      const name = staff.fullName || staff.full_name || staff.name || staff.username || staff.email;
                                      const pos = staff.position;
                                      return pos ? `${pos}: ${name}` : name;
                                    }
                                    if (conductedBy && fetchedStaffNames[conductedBy]) {
                                      return fetchedStaffNames[conductedBy];
                                    }
                                    if (conductedBy && !fetchedStaffNames[conductedBy]) {
                                      // Dùng userAPI.getById để lấy tên staff
                                      userAPI.getById(conductedBy)
                                        .then(data => {
                                          setFetchedStaffNames(prev => ({
                                            ...prev,
                                            [conductedBy]: (data.position ? `${data.position}: ` : '') + (data.full_name || data.fullName || data.name || data.username || data.email || conductedBy)
                                          }));
                                        })
                                        .catch(() => {
                                          setFetchedStaffNames(prev => ({
                                            ...prev,
                                            [conductedBy]: conductedBy
                                          }));
                                        });
                                      return 'Đang tải...';
                                    }
                                    return conductedBy || '---';
                                  })()
                                }</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2rem',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                              borderRadius: '1rem',
                              border: '2px dashed #cbd5e1'
                            }}>
                              <div style={{
                                width: '3rem',
                                height: '3rem',
                                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1rem'
                              }}>
                                <DocumentTextIcon style={{ width: '1.5rem', height: '1.5rem', color: '#64748b' }} />
                              </div>
                              <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#374151',
                                margin: '0 0 0.5rem 0'
                              }}>
                                Chưa có ghi chú chăm sóc
                              </h4>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#64748b',
                                margin: 0,
                                maxWidth: '250px',
                                lineHeight: 1.5
                              }}>
                                Hiện tại chưa có ghi chú chăm sóc nào được ghi nhận.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {totalPages > 1 && (
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{textAlign:'center',padding:'1rem 0'}}>
                            <button onClick={()=>setCareNotesPage(p=>Math.max(1,p-1))} disabled={careNotesPage===1} style={{marginRight:8,padding:'0.4rem 1rem',borderRadius:6,border:'1px solid #8b5cf6',background:careNotesPage===1?'#ede9fe':'#fff',color:'#8b5cf6',fontWeight:600,cursor:careNotesPage===1?'not-allowed':'pointer'}}>← Trang trước</button>
                            <span style={{fontWeight:600,color:'#7c3aed'}}>Trang {careNotesPage}/{totalPages}</span>
                            <button onClick={()=>setCareNotesPage(p=>Math.min(totalPages,p+1))} disabled={careNotesPage===totalPages} style={{marginLeft:8,padding:'0.4rem 1rem',borderRadius:6,border:'1px solid #8b5cf6',background:careNotesPage===totalPages?'#ede9fe':'#fff',color:'#8b5cf6',fontWeight:600,cursor:careNotesPage===totalPages?'not-allowed':'pointer'}}>Trang sau →</button>
                          </td>
                        </tr>
                      </tfoot>
                    )}
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
                      ) : paginatedVital.length > 0 ? (
                        paginatedVital.map((vital: any, index: number) => (
                          <tr key={vital._id}
                            style={{
                              background: index % 2 === 0 ? '#fff' : '#f8fafc',
                              transition: 'background 0.2s'
                            }}>
                            <td style={{padding: '1rem', fontWeight: 600, color: '#374151'}}>
                              {vital.date_time ? formatDateDDMMYYYY(vital.date_time) : ''}
                            </td>
                            <td style={{padding: '1rem', color: '#6b7280'}}>
                              {vital.date_time ? (() => {
                                const date = new Date(vital.date_time);
                                const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
                                return vietnamTime.toLocaleTimeString('vi-VN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false 
                                });
                              })() : ''}
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
                          <td colSpan={7} style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2rem',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                              borderRadius: '1rem',
                              border: '2px dashed #cbd5e1'
                            }}>
                              <div style={{
                                width: '3rem',
                                height: '3rem',
                                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1rem'
                              }}>
                                <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#64748b' }} />
                              </div>
                              <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#374151',
                                margin: '0 0 0.5rem 0'
                              }}>
                                Chưa có dữ liệu chỉ số sức khỏe
                              </h4>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#64748b',
                                margin: 0,
                                maxWidth: '250px',
                                lineHeight: 1.5
                              }}>
                                Hiện tại chưa có chỉ số sức khỏe nào được ghi nhận.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalVitalPages > 1 && (
                  <tfoot>
                    <tr>
                      <td colSpan={7} style={{textAlign:'center',padding:'1rem 0'}}>
                        <button onClick={()=>setVitalPage(p=>Math.max(1,p-1))} disabled={vitalPage===1} style={{marginRight:8,padding:'0.4rem 1rem',borderRadius:6,border:'1px solid #8b5cf6',background:vitalPage===1?'#ede9fe':'#fff',color:'#8b5cf6',fontWeight:600,cursor:vitalPage===1?'not-allowed':'pointer'}}>← Trang trước</button>
                        <span style={{fontWeight:600,color:'#7c3aed'}}>Trang {vitalPage}/{totalVitalPages}</span>
                        <button onClick={()=>setVitalPage(p=>Math.min(totalVitalPages,p+1))} disabled={vitalPage===totalVitalPages} style={{marginLeft:8,padding:'0.4rem 1rem',borderRadius:6,border:'1px solid #8b5cf6',background:vitalPage===totalVitalPages?'#ede9fe':'#fff',color:'#8b5cf6',fontWeight:600,cursor:vitalPage===totalVitalPages?'not-allowed':'pointer'}}>Trang sau →</button>
                      </td>
                    </tr>
                  </tfoot>
                )}
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
