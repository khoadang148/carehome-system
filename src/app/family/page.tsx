"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { clientStorage } from '@/lib/utils/clientStorage';
import { 
  CalendarDaysIcon, 
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  UsersIcon,
  XMarkIcon,
  XCircleIcon
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
import { formatDateDDMMYYYY, formatDateDDMMYYYYWithTimezone, formatTimeWithTimezone } from '@/lib/utils/validation';
import { activitiesAPI } from '@/lib/api';
import { staffAssignmentsAPI } from '@/lib/api';
import { bedAssignmentsAPI } from '@/lib/api';
import SuccessModal from '@/components/SuccessModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { completePageTransition } from '@/lib/utils/pageTransition';

// Helper functions
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

const formatDob = (dob: string) => {
  if (!dob) return 'Chưa hoàn tất đăng kí';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 'Chưa hoàn tất đăng kí';
  const day: string = String(d.getDate()).padStart(2, '0');
  const month: string = String(d.getMonth() + 1).padStart(2, '0');
  const year: number = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getAvatarUrl = (avatarPath: string | null | undefined) => {
  // Nếu không có avatar hoặc avatar rỗng, trả về avatar mặc định
  if (!avatarPath || avatarPath.trim() === '' || avatarPath === 'null' || avatarPath === 'undefined') {
    return '/default-avatar.svg';
  }
  
  // Nếu là URL hoặc data URL, trả về nguyên bản
  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  
  // Nếu là đường dẫn local, làm sạch và trả về
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

export default function FamilyPortalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Main state
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageReady, setPageReady] = useState(false);
  
  // Notifications
  interface Notification {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Success modal
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    actionType: string;
    timestamp: string;
    id?: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Vital signs
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [vitalLoading, setVitalLoading] = useState(false);
  const [vitalError, setVitalError] = useState('');
  const [vitalSignsHistory, setVitalSignsHistory] = useState<any[]>([]);
  const [vitalHistoryLoading, setVitalHistoryLoading] = useState(false);
  const [vitalHistoryError, setVitalHistoryError] = useState('');

  // Care notes
  const [careNotes, setCareNotes] = useState<any[]>([]);
  const [careNotesLoading, setCareNotesLoading] = useState(false);
  const [careNotesError, setCareNotesError] = useState('');

  // Staff and room
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [fetchedStaffNames, setFetchedStaffNames] = useState<{[id: string]: string}>({});
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]);
  const [assignedStaffLoading, setAssignedStaffLoading] = useState(false);
  const [assignedStaffError, setAssignedStaffError] = useState('');

  // Activities
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [selectedActivityDate, setSelectedActivityDate] = useState('');
  const [activityHistoryDates, setActivityHistoryDates] = useState<string[]>([]);
  const [serverToday, setServerToday] = useState<string>('');
  const [activityTimes, setActivityTimes] = useState<{[activityId: string]: {start: string, end: string}}>({});

  // Tab loading states for lazy loading
  const [activeTab, setActiveTab] = useState(0);
  const [tabsLoaded, setTabsLoaded] = useState<{[key: number]: boolean}>({0: false});
  const [tabLoading, setTabLoading] = useState<{[key: number]: boolean}>({});

  // Tối ưu: Load success message ngay lập tức
  useEffect(() => {
    const msg = clientStorage.getItem('login_success');
    if (msg) {
      setSuccessMessage(msg);
      setShowSuccessModal(true);
      clientStorage.removeItem('login_success');
    }
  }, []);

  // Tối ưu: Preload server date và staff list song song
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Load server date và staff list song song
        const [serverDateResponse, staffData] = await Promise.allSettled([
          fetch('/api/current-date', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }),
          staffAPI.getAll()
        ]);

        // Handle server date
        if (serverDateResponse.status === 'fulfilled' && serverDateResponse.value.ok) {
          const data = await serverDateResponse.value.json();
          setServerToday(data.date);
        } else {
          setServerToday(new Date().toISOString().slice(0, 10));
        }

        // Handle staff data
        if (staffData.status === 'fulfilled') {
          setStaffList(Array.isArray(staffData.value) ? staffData.value : []);
        } else {
          setStaffList([]);
        }
      } catch (error) {
        console.error('Error preloading data:', error);
        setServerToday(new Date().toISOString().slice(0, 10));
        setStaffList([]);
      }
    };

    preloadData();
  }, []);

  // Tối ưu: Fetch resident data với timeout
  useEffect(() => {
    if (user?.id) {
      setDataLoading(true);
      setError('');
      
      // Add timeout for resident data fetch
      const timeoutId = setTimeout(() => {
        setError('Không thể tải dữ liệu trong thời gian chờ. Vui lòng thử lại.');
        setDataLoading(false);
      }, 10000); // 10 second timeout

      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          clearTimeout(timeoutId);
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr);
          setSelectedResidentId(arr.length > 0 ? arr[0]._id : "");
          setError('');
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          setError('Không tìm thấy thông tin người thân hoặc lỗi kết nối API.');
          setResidents([]);
        })
        .finally(() => {
          setDataLoading(false);
          // Mark page as ready after initial data load
          setTimeout(() => setPageReady(true), 100);
        });
    }
  }, [user]);

  // Tối ưu: Load only activities data initially (tab 0)
  useEffect(() => {
    if (!selectedResidentId || !pageReady) return;

    // Only load activities data initially
    const loadActivitiesData = async () => {
      try {
        setTabLoading(prev => ({ ...prev, 0: true }));
        
        const activitiesPromise = await activityParticipationsAPI.getByResidentId(selectedResidentId);
        const arr = Array.isArray(activitiesPromise) ? activitiesPromise : [];
        
        const grouped: Record<string, any[]> = {};
        arr.forEach((item) => {
          const date = item.date?.slice(0, 10);
          if (!date) return;
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
        });
        
        const allDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setActivityHistoryDates(allDates);
        
        const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);
        
        if (!showActivityHistory) {
          if (grouped[todayFromAPI] && grouped[todayFromAPI].length > 0) {
            const uniqueActivities = grouped[todayFromAPI].reduce((acc: any[], current: any) => {
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
            
            setSelectedActivityDate(todayFromAPI);
            setActivities(uniqueActivities);
          } else {
            setSelectedActivityDate('');
            setActivities([]);
          }
        }
        
        setTabsLoaded(prev => ({ ...prev, 0: true }));
      } catch (error) {
        console.error('Error loading activities data:', error);
        setActivitiesError('Không thể tải dữ liệu hoạt động.');
      } finally {
        setTabLoading(prev => ({ ...prev, 0: false }));
      }
    };

    loadActivitiesData();
  }, [selectedResidentId, pageReady, serverToday, showActivityHistory]);

  // Lazy load care notes data (tab 1)
  const loadCareNotesData = async () => {
    if (tabsLoaded[1] || tabLoading[1]) return;
    
    try {
      setTabLoading(prev => ({ ...prev, 1: true }));
      
      const careNotesData = await careNotesAPI.getAll({ resident_id: selectedResidentId });
      setCareNotes(Array.isArray(careNotesData) ? careNotesData : []);
      
      setTabsLoaded(prev => ({ ...prev, 1: true }));
    } catch (error) {
      console.error('Error loading care notes:', error);
      setCareNotesError('Không thể tải ghi chú chăm sóc.');
    } finally {
      setTabLoading(prev => ({ ...prev, 1: false }));
    }
  };

  // Lazy load vital signs data (tab 2)
  const loadVitalSignsData = async () => {
    if (tabsLoaded[2] || tabLoading[2]) return;
    
    try {
      setTabLoading(prev => ({ ...prev, 2: true }));
      
      const vitalSignsData = await vitalSignsAPI.getByResidentId(selectedResidentId);
      if (Array.isArray(vitalSignsData) && vitalSignsData.length > 0) {
        const sorted = [...vitalSignsData].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        setVitalSigns(sorted[0]);
        setVitalSignsHistory(sorted);
      } else {
        setVitalSigns(null);
        setVitalSignsHistory([]);
      }
      
      setTabsLoaded(prev => ({ ...prev, 2: true }));
    } catch (error) {
      console.error('Error loading vital signs:', error);
      setVitalError('Không thể tải chỉ số sức khỏe.');
    } finally {
      setTabLoading(prev => ({ ...prev, 2: false }));
    }
  };

  // Handle tab change with lazy loading
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    
    // Load data for the selected tab if not already loaded
    if (index === 1 && !tabsLoaded[1]) {
      loadCareNotesData();
    } else if (index === 2 && !tabsLoaded[2]) {
      loadVitalSignsData();
    }
  };

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

  // Pagination
  const [careNotesPage, setCareNotesPage] = useState(1);
  const [vitalPage, setVitalPage] = useState(1);
  const notesPerPage = 5;
  const vitalPerPage = 5;
  
  const totalNotes = careNotes.length;
  const totalPages = Math.ceil(totalNotes / notesPerPage);
  const paginatedNotes = careNotes.slice((careNotesPage-1)*notesPerPage, careNotesPage*notesPerPage);

  const totalVital = vitalSignsHistory.length;
  const totalVitalPages = Math.ceil(totalVital / vitalPerPage);
  const paginatedVital = vitalSignsHistory.slice((vitalPage-1)*vitalPerPage, vitalPage*vitalPerPage);
  
  useEffect(() => { setCareNotesPage(1); }, [careNotes.length]);
  useEffect(() => { setVitalPage(1); }, [vitalSignsHistory.length]);

  // Tối ưu: Load all resident data song song khi có selectedResidentId
  useEffect(() => {
    if (!selectedResidentId || !pageReady) return;

    // Load all data in parallel with individual loading states
    const loadResidentData = async () => {
      try {
        // Start all API calls in parallel
        const [
          vitalSignsPromise,
          vitalHistoryPromise,
          careNotesPromise,
          roomPromise,
          assignedStaffPromise,
          activitiesPromise
        ] = await Promise.allSettled([
          vitalSignsAPI.getByResidentId(selectedResidentId),
          vitalSignsAPI.getByResidentId(selectedResidentId), // Same API for history
          careNotesAPI.getAll({ resident_id: selectedResidentId }),
          bedAssignmentsAPI.getByResidentId(selectedResidentId).then(assignments => {
            const assignment = Array.isArray(assignments) ? assignments.find(a => a.bed_id?.room_id) : null;
            if (assignment?.bed_id?.room_id) {
              // Nếu room_id đã có thông tin room_number, sử dụng trực tiếp
              if (typeof assignment.bed_id.room_id === 'object' && assignment.bed_id.room_id.room_number) {
                return { room_number: assignment.bed_id.room_id.room_number };
              }
              // Nếu chỉ có _id, fetch thêm thông tin
              const roomId = assignment.bed_id.room_id._id || assignment.bed_id.room_id;
              if (roomId) {
                return roomsAPI.getById(roomId);
              }
            }
            return null;
          }),
          staffAssignmentsAPI.getByResident(selectedResidentId),
          activityParticipationsAPI.getByResidentId(selectedResidentId)
        ]);

        // Handle vital signs
        if (vitalSignsPromise.status === 'fulfilled') {
          const data = vitalSignsPromise.value;
          if (Array.isArray(data) && data.length > 0) {
            const sorted = [...data].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            setVitalSigns(sorted[0]);
            setVitalSignsHistory(sorted);
          } else {
            setVitalSigns(null);
            setVitalSignsHistory([]);
          }
        }

        // Handle care notes
        if (careNotesPromise.status === 'fulfilled') {
          setCareNotes(Array.isArray(careNotesPromise.value) ? careNotesPromise.value : []);
        }

        // Handle room number
        if (roomPromise.status === 'fulfilled' && roomPromise.value) {
          setRoomNumber(roomPromise.value?.room_number || 'Chưa hoàn tất đăng kí');
        } else {
          setRoomNumber('Chưa hoàn tất đăng kí');
        }

        // Handle assigned staff
        if (assignedStaffPromise.status === 'fulfilled') {
          const assignments = Array.isArray(assignedStaffPromise.value) ? assignedStaffPromise.value : [];
        const activeAssignments = assignments.filter((assignment: any) => 
          assignment.status === 'active' || !assignment.status
        );
        
          // Load staff details in parallel
          const staffWithDetails = await Promise.allSettled(
          activeAssignments.map(async (assignment: any) => {
            try {
              if (assignment.staff_id?._id) {
                const staffDetails = await userAPI.getById(assignment.staff_id._id);
                return {
                  ...assignment,
                  staff_id: {
                    ...assignment.staff_id,
                      ...staffDetails
                  }
                };
              }
              return assignment;
            } catch (error) {
              console.error('Error fetching staff details:', error);
              return assignment;
            }
          })
        );
        
          setAssignedStaff(staffWithDetails.map(result => 
            result.status === 'fulfilled' ? result.value : null
          ).filter(Boolean));
        }

        // Handle activities
        if (activitiesPromise.status === 'fulfilled') {
          const arr = Array.isArray(activitiesPromise.value) ? activitiesPromise.value : [];
        const grouped: Record<string, any[]> = {};
        arr.forEach((item) => {
          const date = item.date?.slice(0, 10);
          if (!date) return;
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
        });
          
        const allDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setActivityHistoryDates(allDates);
        
        const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);
        
        if (!showActivityHistory) {
          if (grouped[todayFromAPI] && grouped[todayFromAPI].length > 0) {
            const uniqueActivities = grouped[todayFromAPI].reduce((acc: any[], current: any) => {
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
            
            setSelectedActivityDate(todayFromAPI);
            setActivities(uniqueActivities);
          } else {
              setSelectedActivityDate('');
            setActivities([]);
          }
          }
        }

        // Complete page transition monitoring
        const transitionId = sessionStorage.getItem('current_transition_id');
        if (transitionId) {
          completePageTransition(transitionId);
          sessionStorage.removeItem('current_transition_id');
        }

      } catch (error) {
        console.error('Error loading resident data:', error);
      }
    };

    loadResidentData();
  }, [selectedResidentId, pageReady, serverToday, showActivityHistory]);

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

  // Tạo danh sách staff cho modal - sử dụng dữ liệu thực từ assignedStaff
  const staffMembers = assignedStaff.map((assignment: any, index: number) => {
    const staff = assignment.staff_id;
    const staffName = staff?.full_name || staff?.fullName || staff?.name || staff?.username || staff?.email || 'Chưa rõ';
    const staffPosition = staff?.position || 'Nhân viên chăm sóc';
    
    return {
      id: assignment._id || `staff-${index}`,
      name: staffName,
      role: staffPosition,
      assignment: assignment,
      staff_id: staff // Thêm staff_id để truy cập thông tin chi tiết
    };
  });

  // Navigation handlers
  const handleContactStaff = () => {
    router.push('/family/contact-staff');
  };

  const handleVisitSchedule = () => {
    router.push('/family/schedule-visit');
  };

  const handleViewPhotos = () => {
    router.push('/family/photos');
  };

  // Ensure header is shown when component mounts
  useEffect(() => {
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

  // Bảo vệ route chỉ cho family
  useEffect(() => {
    if (!loading && user && user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
    }
  }, [user, loading, router]);

  // Show loading spinner while initial data is loading
  if (loading || (user && user.role !== 'family')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" text="Đang tải thông tin người thân..." />
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" text="Đang tải thông tin người thân..." />
        </div>
      </div>
    );
  }

  if (error) return <div style={{color: 'red'}}>{error}</div>;
  if (!selectedResident) return <div>Không có dữ liệu người thân.</div>;

  const formatOptionLabel = (option: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <img
        src={getAvatarUrl(option.avatar)}
        alt={option.label}
        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
        onError={(e) => {
          e.currentTarget.src = '/default-avatar.svg';
        }}
      />
      <div style={{ fontWeight: 700, fontSize: 20 }}>{option.label}</div>
    </div>
  );

 

  return (
    <>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={successMessage} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
        {/* Notification Banner */}
        {notifications.length > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 shadow-lg border-b border-white/20 animate-slideDown">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold mb-1">
                    {notifications[notifications.length - 1]?.title}
                  </h4>
                  <p className="text-sm opacity-90">
                    {notifications[notifications.length - 1]?.message}
                  </p>
                </div>
              </div>
                <button
                  onClick={() => setNotifications(prev => prev.slice(0, -1))}
                className="p-2 rounded text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
        )}



        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none" style={{ backgroundPosition: '80% 20%' }} />
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent pointer-events-none" style={{ backgroundPosition: '40% 40%' }} />
        
        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-xl w-full">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    Thông tin người thân 
                  </h1>
                  <p className="text-base text-slate-500 mt-1 font-medium">
                    Theo dõi và kết nối với người thân của bạn
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Family Member Selector */}
          {residents.length > 1 && (
            <div className="mb-10 w-full bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border border-white/20 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    Chọn người thân để xem thông tin
                  </h3>
                </div>
              </div>
              
              {/* React-select dropdown */}
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
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-10 w-full my-8">
            {/* Avatar and basic info */}
            <div className="flex flex-col items-center mb-8">
              <img 
                src={getAvatarUrl(selectedResident?.avatar)} 
                alt="avatar"
                className="w-30 h-30 rounded-full border-4 border-indigo-500 shadow-lg object-cover mb-3" 
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.svg';
                }}
              />
              <div className="text-xs text-slate-500 font-semibold mb-1 tracking-wider uppercase">
                Người cao tuổi:
              </div>
              <h1 className="font-extrabold text-3xl text-slate-800 m-0 leading-tight text-center">
                {selectedResident?.full_name}
              </h1>
              <div className={`text-sm font-semibold mt-2 text-white rounded-full px-4 py-1.5 shadow-lg uppercase tracking-wider text-center ${
                selectedResident?.status === 'active' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-slate-500 to-slate-600'
              }`}>
                {selectedResident?.status === 'active' ? 'Đang nằm viện' : 'Đã xuất viện'}
              </div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
                <CalendarDaysIcon className="w-4 h-4" />
                Ngày nhập viện: {selectedResident?.admission_date ? formatDob(selectedResident.admission_date) : 'Chưa hoàn tất đăng kí'}
              </div>
            </div>
            {/* Information Cards */}
            <div className="flex flex-col gap-6 w-full">
              {/* Personal Information Card */}
              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-7 shadow-lg">
                <div className="font-bold text-slate-800 text-xl mb-5 flex items-center gap-3.5 pb-3.5 border-b-3 border-indigo-500">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full p-2.5 flex items-center justify-center shadow-lg">
                    <UsersIcon className="w-5 h-5 text-white" />
                  </div>
                  Thông tin cá nhân
                </div>
                <div className="grid grid-cols-2 gap-6 text-base">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300">
                      <span className="text-slate-600 font-semibold text-sm mb-1.5 uppercase tracking-wider">Họ và tên</span>
                      <span className="text-slate-800 font-extrabold text-lg">{selectedResident?.full_name}</span>
                    </div>
                    <div className="flex flex-col p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300">
                      <span className="text-slate-600 font-semibold text-sm mb-1.5 uppercase tracking-wider">Giới tính</span>
                      <span className="text-slate-800 font-extrabold text-lg">
                        {selectedResident?.gender === 'male' ? 'Nam' : selectedResident?.gender === 'female' ? 'Nữ' : (selectedResident?.gender || 'Chưa hoàn tất đăng kí')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300">
                      <span className="text-slate-600 font-semibold text-sm mb-1.5 uppercase tracking-wider">Ngày sinh</span>
                      <span className="text-slate-800 font-extrabold text-lg">
                        {selectedResident?.date_of_birth || selectedResident?.dateOfBirth ? 
                          `${formatDob(selectedResident.date_of_birth || selectedResident.dateOfBirth)}${getAge(selectedResident.date_of_birth || selectedResident.dateOfBirth) ? ' (' + getAge(selectedResident.date_of_birth || selectedResident.dateOfBirth) + ' tuổi)' : ''}` : 
                          'Chưa hoàn tất đăng kí'
                        }
                      </span>
                    </div>
                    <div className="flex flex-col p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300">
                      <span className="text-slate-600 font-semibold text-sm mb-1.5 uppercase tracking-wider">Phòng</span>
                      <span className="text-slate-800 font-extrabold text-lg">
                        {roomLoading ? 'Đang tải...' : roomNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact Card */}
              <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-2xl p-6 shadow-lg">
                <div className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-3 pb-3 border-b-2 border-red-500">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-2 flex items-center justify-center">
                    <PhoneIcon className="w-4.5 h-4.5 text-white" />
                  </div>
                  Liên hệ khẩn cấp
                </div>
                {selectedResident?.emergency_contact?.name ? (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-red-600 font-semibold text-xs mb-1">Tên người liên hệ</span>
                      <span className="text-slate-800 font-bold text-sm text-center">{selectedResident.emergency_contact.name}</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-red-600 font-semibold text-xs mb-1">Quan hệ</span>
                      <span className="text-slate-800 font-bold text-sm text-center">{selectedResident.emergency_contact.relationship}</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-red-600 font-semibold text-xs mb-1">Số điện thoại</span>
                      <span className="text-slate-800 font-bold text-sm text-center">{selectedResident.emergency_contact.phone}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 italic p-5 bg-red-50 rounded-xl border border-dashed border-red-200">
                    Chưa hoàn tất đăng kí thông tin liên hệ khẩn cấp
                  </div>
                )}
              </div>
              
              {/* Vital Signs Card */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center gap-2.5 mb-4">
                  <span className="font-bold text-lg text-slate-800 text-center">
                    Chỉ số sức khỏe của {selectedResident?.full_name}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mb-5 text-center p-2 bg-slate-50 rounded-lg">
                  Lần cập nhật gần nhất: {vitalLoading ? 'Đang tải...' : vitalSigns?.date_time ? formatDateDDMMYYYYWithTimezone(vitalSigns.date_time) : 'Không có dữ liệu'}
                </div>
                <div className="grid grid-cols-6 gap-4 text-sm mb-5">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 text-center">
                    <div className="text-red-700 font-semibold text-xs mb-1.5">Huyết áp (mmHg)</div>
                    <div className="font-bold text-red-600 text-lg">{vitalLoading ? 'Đang tải...' : vitalSigns?.blood_pressure ?? '--'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 text-center">
                    <div className="text-emerald-700 font-semibold text-xs mb-1.5">Nhịp tim (bpm)</div>
                    <div className="font-bold text-emerald-600 text-lg">{vitalLoading ? 'Đang tải...' : vitalSigns?.heart_rate ?? '--'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 text-center">
                    <div className="text-amber-700 font-semibold text-xs mb-1.5">Nhiệt độ cơ thể</div>
                    <div className="font-bold text-amber-600 text-lg">{vitalLoading ? 'Đang tải...' : vitalSigns?.temperature ?? '--'}°C</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 text-center">
                    <div className="text-blue-700 font-semibold text-xs mb-1.5">SpO2 (%)</div>
                    <div className="font-bold text-blue-600 text-lg">{vitalLoading ? 'Đang tải...' : vitalSigns?.oxygen_level ?? vitalSigns?.oxygen_saturation ?? '--'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 text-center">
                    <div className="text-purple-700 font-semibold text-xs mb-1.5">Nhịp thở (lần/phút)</div>
                    <div className="font-bold text-purple-600 text-lg">{vitalLoading ? 'Đang tải...' : vitalSigns?.respiratory_rate ?? '--'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200 text-center">
                    <div className="text-indigo-700 font-semibold text-xs mb-1.5">Cân nặng hiện tại</div>
                    <div className="font-bold text-indigo-600 text-lg">{vitalLoading ? 'Đang tải...' : vitalSigns?.weight ?? '--'} kg</div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center gap-2.5 justify-center">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  Tình trạng: {vitalLoading ? 'Đang tải...' : vitalSigns?.notes ?? 'Chưa hoàn tất đăng kí'}
                </div>
              </div>

              {/* Assigned Staff Card */}
                {assignedStaffLoading ? (
                <div className="text-center p-5 text-slate-500">
                  <div className="text-base font-semibold">Đang tải thông tin nhân viên...</div>
                  </div>
                ) : assignedStaffError ? (
                <div className="text-center p-5 text-red-500 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-base font-semibold">{assignedStaffError}</div>
                  </div>
                                  ) : assignedStaff.length > 0 ? (
                <div className="flex flex-col gap-4">
                      {assignedStaff.map((assignment: any, index: number) => {
                        const staff = assignment.staff_id;
                        const staffName = staff?.full_name || staff?.fullName || staff?.name || staff?.username || staff?.email || 'Chưa rõ';
                        const staffPosition = staff?.position || 'Nhân viên chăm sóc';
                        
                        return (
                      <div key={assignment._id || index} className="bg-white rounded-xl p-5 border border-blue-200 shadow-lg">
                        {/* Header with icon and title */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-white" />
                              </div>
                          <h3 className="text-lg font-bold text-slate-800 m-0">
                                Nhân viên phụ trách chăm sóc
                              </h3>
                            </div>
                            
                            {/* Separator line */}
                        <div className="h-0.5 bg-blue-500 mb-4" />
                        
                        {/* Content - 3 columns */}
                        <div className="grid grid-cols-3 gap-4">
                          {/* Column 1: Staff name */}
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 font-semibold mb-1">
                                  Tên nhân viên
                                </div>
                            <div className="text-sm text-slate-800 font-bold">
                                  {staffName}
                                </div>
                              </div>
                              
                          {/* Column 2: Position */}
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 font-semibold mb-1">
                                  Chức vụ
                                </div>
                            <div className="text-sm text-slate-800 font-bold">
                                  {staffPosition}
                                </div>
                              </div>
                              
                          {/* Column 3: Phone */}
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 font-semibold mb-1">
                                  Số điện thoại
                                </div>
                            <div className="text-sm text-slate-800 font-bold">
                                  {staff?.phone || 'Chưa hoàn tất đăng kí'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-dashed border-blue-400 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                    <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                  <h4 className="text-base font-semibold text-slate-800 mb-2">
                      Chưa có nhân viên phụ trách
                    </h4>
                  <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                      Hiện tại chưa có nhân viên nào được phân công chăm sóc người thân của bạn.
                    </p>
                  </div>
                )}
              
            </div>
          </div>

          {/* Tabbed Information */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-white/20 overflow-hidden w-full">
            <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
              <Tab.List className="flex bg-gradient-to-r from-slate-50 to-slate-200 border-b border-white/20">
                <Tab className={({ selected }) => 
                  `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                    selected 
                      ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                  }`
                }>
                  Hoạt động sinh hoạt
                  {tabLoading[0] && (
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </Tab>
                <Tab className={({ selected }) => 
                  `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                    selected 
                      ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                  }`
                }>
                  Ghi chú chăm sóc
                  {tabLoading[1] && (
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </Tab>
                <Tab className={({ selected }) => 
                  `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                    selected 
                      ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                  }`
                }>
                  Chỉ số sức khỏe
                  {tabLoading[2] && (
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </Tab>
              </Tab.List>

              <Tab.Panels>
                <Tab.Panel className="p-8">
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 m-0">
                      {showActivityHistory ? 'Lịch sử hoạt động' : 'Hoạt động hôm nay'}
                    </h3>
                    <div className="flex gap-4 items-center flex-wrap">
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
                            <button className="px-4 py-2 rounded-xl border-2 border-blue-500 bg-white text-base font-semibold text-gray-700 cursor-pointer min-w-56 text-left shadow-lg">
                              {formatDateDDMMYYYY(selectedActivityDate)}
                            </button>
                          }
                        />
                      )}
                      <button
                        onClick={() => {
                          setShowActivityHistory(v => !v);
                          if (showActivityHistory) {
                            const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);
                            setSelectedActivityDate(todayFromAPI);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg border border-purple-500 text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                          showActivityHistory 
                            ? 'bg-white text-purple-500 hover:bg-gray-100' 
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                        }`}
                      >
                        <CalendarDaysIcon className="w-4 h-4"/>
                        {showActivityHistory?'Xem hôm nay':'Xem lịch sử hoạt động'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {tabLoading[0] ? (
                      <div className="flex flex-col items-center justify-center p-12">
                        <LoadingSpinner size="large" text="Đang tải hoạt động..." />
                      </div>
                    ) : activitiesError ? (
                      <div className="text-red-500">{activitiesError}</div>
                    ) : Array.isArray(activities) && activities.length > 0 ? (
                      activities.map((activity:any) => {
                        const attended = activity.attendance_status === 'attended';
                        const absent = activity.attendance_status === 'absent';
                        const activityId = activity.activity_id?._id || activity.activity_id;
                        
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
                          <div key={activity._id} className={`flex items-center p-4 rounded-xl border ${
                            attended 
                              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' 
                              : absent 
                              ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200' 
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="mr-4">
                              {attended ? (
                                <CheckCircleIcon className="w-6 h-6 text-emerald-600"/>
                              ) : absent ? (
                                <XCircleIcon className="w-6 h-6 text-red-500"/>
                              ) : (
                                <ClockIcon className="w-6 h-6 text-gray-500"/>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900 mb-1">
                                <span className="font-semibold text-gray-700">Hoạt động: </span>{activity.activity_id?.activity_name || '---'}
                              </div>
                              <div className="text-xs text-gray-500 mb-1">
                                <span className="font-semibold">Thời gian: </span>{time}{endTimeStr?` - ${endTimeStr}`:''}
                              </div>
                              <span className={`text-xs font-medium ${
                                attended ? 'text-emerald-700' : absent ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                <span className="font-semibold">Trạng thái: </span>
                                {attended ? 'Đã tham gia' : absent ? <>Không tham gia{activity.performance_notes && <> - Lý do: <span className="text-red-500">{activity.performance_notes}</span></>}</> : 'Chưa tham gia'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mb-4">
                          <CalendarDaysIcon className="w-8 h-8 text-slate-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">
                          Chưa có hoạt động hôm nay
                        </h4>
                        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                          Hôm nay chưa có hoạt động nào được lên lịch cho người thân của bạn.
                        </p>
                      </div>
                    )}
                  </div>
                </Tab.Panel>
                
                <Tab.Panel className="p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Ghi chú chăm sóc gần đây
                  </h3>
                  {tabLoading[1] ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <LoadingSpinner size="large" text="Đang tải ghi chú chăm sóc..." />
                    </div>
                  ) : careNotesError ? (
                    <div className="text-red-500 text-center p-8">{careNotesError}</div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl shadow-lg">
                      <thead>
                        <tr>
                          <th className="p-3 text-left text-gray-500 font-bold text-sm">Ngày</th>
                          <th className="p-3 text-left text-gray-500 font-bold text-sm">Nội dung ghi chú</th>
                          <th className="p-3 text-left text-gray-500 font-bold text-sm">Nhân viên chăm sóc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {careNotesLoading ? (
                          <tr><td colSpan={3}>Đang tải ghi chú chăm sóc...</td></tr>
                        ) : careNotesError ? (
                          <tr><td colSpan={3} className="text-red-500">{careNotesError}</td></tr>
                        ) : Array.isArray(paginatedNotes) && paginatedNotes.length > 0 ? (
                          paginatedNotes.map((note: any) => {
                            return (
                              <tr key={note._id} className="border-t border-gray-200">
                                <td className="p-3 text-sm text-gray-500 whitespace-nowrap">
                                  {note.date ? formatDateDDMMYYYY(note.date) : ''}
                                </td>
                                <td className="p-3 text-sm text-gray-700">
                                  <div className="font-bold mb-1">{note.assessment_type || 'Đánh giá'}</div>
                                  <div className="mb-0.5"><span className="font-semibold">Ghi chú: </span>{note.notes || 'Không có ghi chú'}</div>
                                  <div><span className="font-semibold">Khuyến nghị: </span>{note.recommendations || 'Không có khuyến nghị'}</div>
                                </td>
                                <td className="p-3 text-sm">
                                  <span className="font-bold text-purple-600">{
                                    (() => {
                                      let conductedBy = note.conducted_by;
                                      if (typeof conductedBy === 'object' && conductedBy !== null) {
                                        const name = conductedBy.full_name || conductedBy.fullName || conductedBy.name || conductedBy.username || conductedBy.email || '';
                                        const pos = conductedBy.position;
                                        return pos ? `${pos}: ${name}` : name;
                                      }
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
                            <td colSpan={3} className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mb-4">
                                  <DocumentTextIcon className="w-6 h-6 text-slate-500" />
                                </div>
                                <h4 className="text-base font-semibold text-gray-700 mb-2">
                                  Chưa có ghi chú chăm sóc
                                </h4>
                                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                                  Hiện tại chưa có ghi chú chăm sóc nào được ghi nhận.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {totalPages > 1 && (
                      <div className="text-center py-4">
                        <button 
                          onClick={()=>setCareNotesPage(p=>Math.max(1,p-1))} 
                          disabled={careNotesPage===1} 
                          className={`mr-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${
                            careNotesPage===1 
                              ? 'bg-purple-100 text-purple-500 cursor-not-allowed' 
                              : 'bg-white text-purple-500 cursor-pointer hover:bg-purple-50'
                          }`}
                        >
                          ← Trang trước
                        </button>
                        <span className="font-semibold text-purple-600">Trang {careNotesPage}/{totalPages}</span>
                        <button 
                          onClick={()=>setCareNotesPage(p=>Math.min(totalPages,p+1))} 
                          disabled={careNotesPage===totalPages} 
                          className={`ml-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${
                            careNotesPage===totalPages 
                              ? 'bg-purple-100 text-purple-500 cursor-not-allowed' 
                              : 'bg-white text-purple-500 cursor-pointer hover:bg-purple-50'
                          }`}
                        >
                          Trang sau →
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </Tab.Panel>
                
                <Tab.Panel className="p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Lịch sử chỉ số sức khỏe
                  </h3>
                  {tabLoading[2] ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <LoadingSpinner size="large" text="Đang tải chỉ số sức khỏe..." />
                    </div>
                  ) : vitalError ? (
                    <div className="text-red-500 text-center p-8">{vitalError}</div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0 bg-white rounded-2xl shadow-xl overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-100 to-gray-100">
                          {['Ngày', 'Thời gian đo', 'Huyết áp', 'Nhịp tim', 'Nhiệt độ', 'SpO2', 'Nhịp thở', 'Cân nặng', 'Ghi chú'].map((h, i) => (
                            <th key={i} className="p-4 text-left text-purple-700 font-extrabold text-sm tracking-wider uppercase border-b-2 border-purple-200">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vitalHistoryLoading ? (
                          <tr><td colSpan={9} className="p-6 text-center text-purple-600">Đang tải dữ liệu...</td></tr>
                        ) : paginatedVital.length > 0 ? (
                          paginatedVital.map((vital: any, index: number) => (
                            <tr key={vital._id} className={`transition-colors duration-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}>
                              <td className="p-4 font-semibold text-gray-700">
                                {vital.date_time ? formatDateDDMMYYYYWithTimezone(vital.date_time) : ''}
                              </td>
                              <td className="p-4 text-gray-500">
                                {vital.date_time ? formatTimeWithTimezone(vital.date_time) : ''}
                              </td>
                              <td className="p-4 font-bold text-red-500 text-base">
                                {vital.blood_pressure ?? <span className="text-gray-400">--</span>}
                              </td>
                              <td className="p-4 font-bold text-emerald-600 text-base">
                                {vital.heart_rate ?? <span className="text-gray-400">--</span>}
                              </td>
                              <td className="p-4 font-bold text-amber-600 text-base">
                                {vital.temperature ?? <span className="text-gray-400">--</span>}
                              </td>
                              <td className="p-4 font-bold text-blue-600 text-base">
                                {vital.oxygen_level ?? vital.oxygen_saturation ?? <span className="text-gray-400">--</span>}
                              </td>
                              <td className="p-4 font-bold text-purple-600 text-base">
                                {vital.respiratory_rate ?? <span className="text-gray-400">--</span>}
                              </td>
                              <td className="p-4 font-bold text-indigo-600 text-base">
                                {vital.weight ?? <span className="text-gray-400">--</span>}
                              </td>
                              <td className="p-4 text-gray-500 italic text-sm">
                                {vital.notes ?? <span className="text-gray-400">--</span>}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mb-4">
                                  <HeartIcon className="w-6 h-6 text-slate-500" />
                                </div>
                                <h4 className="text-base font-semibold text-gray-700 mb-2">
                                  Chưa có dữ liệu chỉ số sức khỏe
                                </h4>
                                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                                  Hiện tại chưa có chỉ số sức khỏe nào được ghi nhận.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                  {totalVitalPages > 1 && (
                    <div className="text-center py-4">
                      <button 
                        onClick={()=>setVitalPage(p=>Math.max(1,p-1))} 
                        disabled={vitalPage===1} 
                        className={`mr-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${
                          vitalPage===1 
                            ? 'bg-purple-100 text-purple-500 cursor-not-allowed' 
                            : 'bg-white text-purple-500 cursor-pointer hover:bg-purple-50'
                        }`}
                      >
                        ← Trang trước
                      </button>
                      <span className="font-semibold text-purple-600">Trang {vitalPage}/{totalVitalPages}</span>
                      <button 
                        onClick={()=>setVitalPage(p=>Math.min(totalVitalPages,p+1))} 
                        disabled={vitalPage===totalVitalPages} 
                        className={`ml-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${
                          vitalPage===totalVitalPages 
                            ? 'bg-purple-100 text-purple-500 cursor-not-allowed' 
                            : 'bg-white text-purple-500 cursor-pointer hover:bg-purple-50'
                        }`}
                      >
                        Trang sau →
                      </button>
                    </div>
                  )}
                  
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
        </div>
      </div>
    </>
  );
} 
