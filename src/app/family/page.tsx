"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useResidents } from '@/lib/contexts/residents-context';
import { clientStorage } from '@/lib/utils/clientStorage';
import { ChatProvider, useChat } from '@/lib/contexts/chat-provider';
import ChatButton from '@/components/ChatButton';
import ChatWidget from '@/components/ChatWidget';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  UsersIcon,
  XMarkIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import Select from 'react-select';
import {
  residentAPI,
  vitalSignsAPI,
  careNotesAPI,
  staffAPI,
  carePlansAPI,
  roomsAPI,
  bedsAPI,
  userAPI,
  activityParticipationsAPI,
  activitiesAPI,
  staffAssignmentsAPI,
  bedAssignmentsAPI,
  billsAPI,
  carePlanAssignmentsAPI
} from '@/lib/api';
import { useVitalSigns as useVitalSignsSWR, useBedAssignments as useBedAssignmentsSWR, useRoom as useRoomSWR, useStaffAssignments as useStaffAssignmentsSWR } from '@/hooks/useSWRData';
import { formatDateDDMMYYYY, formatDateDDMMYYYYWithTimezone, formatTimeWithTimezone } from '@/lib/utils/validation';
import SuccessModal from '@/components/SuccessModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { completePageTransition } from '@/lib/utils/pageTransition';

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

// Chuyển chuỗi thành dạng viết hoa chữ cái đầu mỗi từ (Việt Nam)
const toTitleCase = (input: string) => {
  if (!input) return input;
  return input
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word =>
      (word[0] ? word[0].toLocaleUpperCase('vi-VN') : '') + (word.slice(1) || '')
    )
    .join(' ');
};

const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath || avatarPath.trim() === '' || avatarPath === 'null' || avatarPath === 'undefined') {
    // Sử dụng đường dẫn tuyệt đối để tránh bị rewrite
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/default-avatar.svg`;
    }
    return '/default-avatar.svg';
  }

  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }

  // Use deployed backend URL for static files
  const staticBaseUrl = process.env.NEXT_PUBLIC_STATIC_BASE_URL || 'https://sep490-be-xniz.onrender.com';
  
  // Nếu avatarPath đã chứa đường dẫn đầy đủ, sử dụng trực tiếp
  if (avatarPath.includes('/uploads/')) {
    const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '');
    // Nếu đã có http thì không thêm nữa
    if (cleanPath.startsWith('http')) {
      return cleanPath;
    }
    // Sử dụng static base URL
    return `${staticBaseUrl}${cleanPath}`;
  }

  // Fallback: sử dụng userAPI.getAvatarUrl
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

function FamilyPortalPageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { residents, hasResidents, loading: residentsLoading } = useResidents();
  const { chatState, openChat, closeChat } = useChat();

  interface Notification {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [error, setError] = useState('');
  const [pageReady, setPageReady] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    actionType: string;
    timestamp: string;
    id?: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [vitalLoading, setVitalLoading] = useState(false);
  const [vitalError, setVitalError] = useState('');
  const [vitalSignsHistory, setVitalSignsHistory] = useState<any[]>([]);
  const [vitalHistoryLoading, setVitalHistoryLoading] = useState(false);
  const [vitalHistoryError, setVitalHistoryError] = useState('');
  const [careNotes, setCareNotes] = useState<any[]>([]);
  const [careNotesLoading, setCareNotesLoading] = useState(false);
  const [careNotesError, setCareNotesError] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [bedNumber, setBedNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedLoading, setBedLoading] = useState(false);
  const [fetchedStaffNames, setFetchedStaffNames] = useState<{ [id: string]: string }>({});
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]);
  const [assignedStaffLoading, setAssignedStaffLoading] = useState(false);
  const [assignedStaffError, setAssignedStaffError] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [selectedActivityDate, setSelectedActivityDate] = useState('');
  const [activityHistoryDates, setActivityHistoryDates] = useState<string[]>([]);
  const [serverToday, setServerToday] = useState<string>('');
  const [activityTimes, setActivityTimes] = useState<{ [activityId: string]: { start: string, end: string } }>({});
  const [activeTab, setActiveTab] = useState(0);
  const [tabsLoaded, setTabsLoaded] = useState<{ [key: number]: boolean }>({ 0: false });
  const [tabLoading, setTabLoading] = useState<{ [key: number]: boolean }>({});
  const activeResidentIdRef = useRef<string>('');
  const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);

  useEffect(() => {
    // Only sync vitals when the Vital Signs tab is active to avoid frequent
    // background updates that can cascade into render loops.
    if (typeof activeTab !== 'number' || activeTab !== 2) return;
    const checkLoginSuccess = () => {
    const msg = clientStorage.getItem('login_success');
    if (msg) {
      setSuccessMessage(msg);
      setShowSuccessModal(true);
      clientStorage.removeItem('login_success');
    }
    };

    // Kiểm tra ngay lập tức
    checkLoginSuccess();

    // Lắng nghe sự kiện storage change (khi đăng nhập từ tab khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'login_success' && e.newValue) {
        setSuccessMessage(e.newValue);
        setShowSuccessModal(true);
        clientStorage.removeItem('login_success');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Kiểm tra định kỳ (fallback cho trường hợp storage event không hoạt động)
    const interval = setInterval(checkLoginSuccess, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const preloadData = async () => {
      try {
        const serverDateResponse = await fetch('/api/current-date', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (serverDateResponse.ok) {
          const data = await serverDateResponse.json();
          setServerToday(data.date);
        } else {
          setServerToday(new Date().toISOString().slice(0, 10));
        }
        // Defer staff list fetching; we lazily resolve staff names per note when needed
        setStaffList([]);
      } catch (error) {
        setServerToday(new Date().toISOString().slice(0, 10));
        setStaffList([]);
      }
    };

    preloadData();
  }, []);

  useEffect(() => {
    if (residents.length > 0) {
      setSelectedResidentId(residents[0]._id);
      setError('');
    }
    setTimeout(() => setPageReady(true), 100);
  }, [residents]);

  // Keep a ref of current resident to prevent stale updates
  useEffect(() => {
    activeResidentIdRef.current = selectedResidentId || '';
  }, [selectedResidentId]);

  // Immediately reset UI state when switching resident to avoid stale flashes
  useEffect(() => {
    if (!selectedResidentId) return;
    // Reset per-resident sections synchronously
    setActivities([]);
    setActivityTimes({});
    setActivityHistoryDates([]);
    setSelectedActivityDate('');
    setCareNotes([]);
    setVitalSigns(null);
    setVitalSignsHistory([]);
    setTabsLoaded({ 0: false });
    setTabLoading(prev => ({ ...prev, 0: true }));
    setUnpaidBills([]);
  }, [selectedResidentId]);

  const selectedResident = residents.find(r => r._id === selectedResidentId);

  // Load unpaid bills for active residents
  useEffect(() => {
    if (!selectedResidentId || !selectedResident) return;
    
    // Only load bills for residents with 'active' status
    if (selectedResident.status !== 'active') {
      setUnpaidBills([]);
      return;
    }

    const loadUnpaidBills = async () => {
      setBillsLoading(true);
      try {
        const bills = await billsAPI.getByResidentId(selectedResidentId);
        const unpaidBillsList = Array.isArray(bills) ? bills.filter((bill: any) => bill.status === 'pending') : [];
        setUnpaidBills(unpaidBillsList);
      } catch (error) {
        console.error('Error loading bills:', error);
        setUnpaidBills([]);
      } finally {
        setBillsLoading(false);
      }
    };

    loadUnpaidBills();
  }, [selectedResidentId, selectedResident]);

  useEffect(() => {
    if (!selectedResidentId || !pageReady) return;

    const loadActivitiesData = async () => {
      const requestedResidentId = selectedResidentId;
      try {
        setTabLoading(prev => ({ ...prev, 0: true }));

        const activitiesPromise = await activityParticipationsAPI.getByResidentId(requestedResidentId);
        const arr = Array.isArray(activitiesPromise) ? activitiesPromise : [];

        // If resident changed while waiting for API, abort
        if (activeResidentIdRef.current !== requestedResidentId) return;

        const grouped: Record<string, any[]> = {};
        arr.forEach((item) => {
          const date = item.date?.slice(0, 10);
          if (!date) return;
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
        });

        const allDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        if (activeResidentIdRef.current !== requestedResidentId) return;
        setActivityHistoryDates(allDates);

        const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);

        if (!showActivityHistory) {
          if (grouped[todayFromAPI] && grouped[todayFromAPI].length > 0) {
            const uniqueActivities = grouped[todayFromAPI].reduce((acc: any[], current: any) => {
              const activityId = current.activity_id?._id || current.activity_id;
              const activityName = current.activity_id?.activity_name;
              
              // Bỏ qua hoạt động không có tên hoặc đã bị xóa
              if (!activityName || activityName === '---') {
                return acc;
              }
              
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

              // Sắp xếp hoạt động theo thời gian tăng dần
              const sortedActivities = uniqueActivities.sort((a: any, b: any) => {
                const timeA = activityTimes[a.activity_id?._id || a.activity_id]?.start || '';
                const timeB = activityTimes[b.activity_id?._id || b.activity_id]?.start || '';
                
                if (!timeA && !timeB) return 0;
                if (!timeA) return 1;
                if (!timeB) return -1;
                
                return timeA.localeCompare(timeB);
              });

            if (activeResidentIdRef.current !== requestedResidentId) return;
            setSelectedActivityDate(todayFromAPI);
              setActivities(sortedActivities);
          } else {
            if (activeResidentIdRef.current !== requestedResidentId) return;
            setSelectedActivityDate('');
            setActivities([]);
          }
        }

        // Ignore if resident changed while loading
        if (activeResidentIdRef.current !== requestedResidentId) return;
        setTabsLoaded(prev => ({ ...prev, 0: true }));
      } catch (error) {

        setActivitiesError('Không thể tải dữ liệu hoạt động.');
      } finally {
        if (activeResidentIdRef.current === requestedResidentId) {
        setTabLoading(prev => ({ ...prev, 0: false }));
        }
      }
    };

    loadActivitiesData();
  }, [selectedResidentId, pageReady, serverToday, showActivityHistory]);

  const loadCareNotesData = async () => {
    if (tabsLoaded[1] || tabLoading[1]) return;

    try {
      setTabLoading(prev => ({ ...prev, 1: true }));

      const careNotesData = await careNotesAPI.getAll({ resident_id: selectedResidentId });
      setCareNotes(Array.isArray(careNotesData) ? careNotesData : []);

      setTabsLoaded(prev => ({ ...prev, 1: true }));
    } catch (error) {

      setCareNotesError('Không thể tải ghi chú chăm sóc.');
    } finally {
      setTabLoading(prev => ({ ...prev, 1: false }));
    }
  };

  // SWR: Vital signs — use manual sync when the tab is opened
  const { vitalSigns: swrVital, vitalSignsHistory: swrVitalHistory, isLoading: swrVitalLoading } = useVitalSignsSWR(selectedResidentId);
  const loadVitalSignsData = async () => {
    if (tabsLoaded[2] || tabLoading[2]) return;
      setTabLoading(prev => ({ ...prev, 2: true }));
    setVitalLoading(prev => (prev !== swrVitalLoading ? swrVitalLoading : prev));
    const nextVital = swrVital || null;
    setVitalSigns(prev => (prev !== nextVital ? nextVital : prev));
    const nextHistory = Array.isArray(swrVitalHistory) ? swrVitalHistory : [];
    setVitalSignsHistory(prev => (prev.length !== nextHistory.length ? nextHistory : prev));
      setTabsLoaded(prev => ({ ...prev, 2: true }));
      setTabLoading(prev => ({ ...prev, 2: false }));
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);

    if (index === 1 && !tabsLoaded[1]) {
      loadCareNotesData();
    } else if (index === 2 && !tabsLoaded[2]) {
      loadVitalSignsData();
    }
  };

  useEffect(() => {
    const missingIds = activities
      .map((activity: any) => activity.activity_id?._id || activity.activity_id)
      .filter((id: any) => id && !activityTimes[id]);
    if (missingIds.length === 0) return;
    missingIds.forEach((id: any) => {
      if (!id) {

        return;
      }
      activitiesAPI.getById(id)
        .then(data => {
          const convertToVietnamTime = (utcTime: string) => {
            if (!utcTime) return '';
            const date = new Date(utcTime);
            // Trừ 7 giờ để hiển thị đúng thời gian (database lưu UTC+7, cần trừ để hiển thị đúng)
            const correctTime = new Date(date.getTime() - (7 * 60 * 60 * 1000));
            return correctTime.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
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

        });
    });
  }, [activities, activityTimes]);

  // server date can be wired with a small revalidation; keep effect minimal

  const [careNotesPage, setCareNotesPage] = useState(1);
  const [vitalPage, setVitalPage] = useState(1);
  const notesPerPage = 5;
  const vitalPerPage = 5;

  const totalNotes = careNotes.length;
  const totalPages = Math.ceil(totalNotes / notesPerPage);
  const paginatedNotes = careNotes.slice((careNotesPage - 1) * notesPerPage, careNotesPage * notesPerPage);

  const totalVital = vitalSignsHistory.length;
  const totalVitalPages = Math.ceil(totalVital / vitalPerPage);
  const paginatedVital = vitalSignsHistory.slice((vitalPage - 1) * vitalPerPage, vitalPage * vitalPerPage);

  useEffect(() => { setCareNotesPage(1); }, [careNotes.length]);
  useEffect(() => { setVitalPage(1); }, [vitalSignsHistory.length]);

  // SWR bed/room wiring (used for admitted residents)
  const { bedAssignment, roomId, isLoading: bedIsLoading } = useBedAssignmentsSWR(selectedResidentId);
  const { room, isLoading: roomIsLoading } = useRoomSWR(roomId || '');
  useEffect(() => {
    if (!selectedResident || selectedResident.status !== 'admitted') return;
    setRoomLoading(prev => (prev !== roomIsLoading ? roomIsLoading : prev));
    const nextRoomNumber = room?.room_number || 'Chưa hoàn tất đăng kí';
    setRoomNumber(prev => (prev !== nextRoomNumber ? nextRoomNumber : prev));
    setBedLoading(prev => (prev !== bedIsLoading ? bedIsLoading : prev));
    const nextBedNumber = bedAssignment?.bed_id?.bed_number || 'Chưa hoàn tất đăng kí';
    setBedNumber(prev => (prev !== nextBedNumber ? nextBedNumber : prev));
  }, [selectedResident, roomIsLoading, room?.room_number, bedIsLoading, bedAssignment?.bed_id?.bed_number]);

  // For active residents, derive room/bed from care plan assignment
  useEffect(() => {
    const loadFromCarePlanAssignment = async () => {
      if (!selectedResidentId || !selectedResident) return;
      if (selectedResident.status !== 'active') return;
      try {
        setRoomLoading(true);
        setBedLoading(true);

        const assignments = await carePlanAssignmentsAPI.getByResidentId(selectedResidentId);
        const list = Array.isArray(assignments) ? assignments : [];
        if (list.length === 0) {
          setRoomNumber('Chưa hoàn tất đăng kí');
          setBedNumber('Chưa hoàn tất đăng kí');
          return;
        }

        // Prefer active -> approved -> pending -> others, fallback to latest by created_at/start_date
        const byPriority = (a: any) => {
          const s = (a.status || '').toLowerCase();
          if (s === 'active') return 0;
          if (s === 'approved') return 1;
          if (s === 'pending') return 2;
          return 3;
        };
        const sorted = [...list]
          .sort((a: any, b: any) => byPriority(a) - byPriority(b))
          .sort((a: any, b: any) => {
            const ta = new Date(a.created_at || a.start_date || 0).getTime();
            const tb = new Date(b.created_at || b.start_date || 0).getTime();
            return tb - ta; // latest first
          });
        const assignment = sorted[0];

        // Resolve room number
        let roomNum = 'Chưa hoàn tất đăng kí';
        const ar = assignment?.assigned_room_id;
        if (ar && typeof ar === 'object' && ar.room_number) {
          roomNum = ar.room_number;
        } else if (ar) {
          try {
            const r = await roomsAPI.getById(ar);
            roomNum = r?.room_number || roomNum;
          } catch {}
        }

        // Resolve bed number
        let bedNum = 'Chưa hoàn tất đăng kí';
        const ab = assignment?.assigned_bed_id;
        if (ab && typeof ab === 'object' && ab.bed_number) {
          bedNum = ab.bed_number;
        } else if (ab) {
          try {
            const b = await bedsAPI.getById(ab);
            if (b?.bed_number) bedNum = b.bed_number;
          } catch {}
        }

        setRoomNumber(roomNum);
        setBedNumber(bedNum);
      } finally {
        setRoomLoading(false);
        setBedLoading(false);
      }
    };

    loadFromCarePlanAssignment();
  }, [selectedResidentId, selectedResident]);

  // SWR: Staff assignments — load in parallel and convert to UI shape
  const { assignedStaff: swrAssignedStaff, isLoading: swrAssignedLoading } = useStaffAssignmentsSWR(selectedResidentId);
  const assignedCount = Array.isArray(swrAssignedStaff) ? swrAssignedStaff.length : 0;
  useEffect(() => {
    // Only update when values actually change to avoid loops from new array identities
    setAssignedStaffLoading(prev => (prev !== swrAssignedLoading ? swrAssignedLoading : prev));
    setAssignedStaff(prev => {
      const next = Array.isArray(swrAssignedStaff) ? swrAssignedStaff : [];
      if (prev.length !== next.length) return next;
      return prev;
    });
  }, [swrAssignedLoading, assignedCount]);

  // Remove heavy manual resident data loader for room/vital/staff; handled by SWR hooks above

  useEffect(() => {
    if (!showActivityHistory || !selectedActivityDate || !selectedResidentId) return;
    const requestedResidentId = selectedResidentId;
    setActivitiesLoading(true);
    setActivitiesError('');
    activityParticipationsAPI.getByResidentId(requestedResidentId)
      .then((data) => {
        if (activeResidentIdRef.current !== requestedResidentId) return;
        const arr = Array.isArray(data) ? data : [];
        const grouped: Record<string, any[]> = {};
        arr.forEach((item) => {
          const date = item.date?.slice(0, 10);
          if (!date) return;
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
        });
        const dateActivities = grouped[selectedActivityDate] || [];
        const uniqueActivities = dateActivities.reduce((acc: any[], current: any) => {
          const activityId = current.activity_id?._id || current.activity_id;
          const activityName = current.activity_id?.activity_name;
          
          // Bỏ qua hoạt động không có tên hoặc đã bị xóa
          if (!activityName || activityName === '---') {
            return acc;
          }
          
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

        // Sắp xếp hoạt động theo thời gian tăng dần
        const sortedActivities = uniqueActivities.sort((a: any, b: any) => {
          const timeA = activityTimes[a.activity_id?._id || a.activity_id]?.start || '';
          const timeB = activityTimes[b.activity_id?._id || b.activity_id]?.start || '';
          
          if (!timeA && !timeB) return 0;
          if (!timeA) return 1;
          if (!timeB) return -1;
          
          return timeA.localeCompare(timeB);
        });

        setActivities(sortedActivities);
      })
      .catch(() => setActivities([]))
      .finally(() => {
        if (activeResidentIdRef.current === requestedResidentId) {
          setActivitiesLoading(false);
        }
      });
  }, [selectedActivityDate]);

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

  const staffMembers = assignedStaff.map((assignment: any, index: number) => {
    const staff = assignment.staff_id;
    const staffName = staff?.full_name || staff?.fullName || staff?.name || staff?.username || staff?.email || 'Chưa rõ';
    const staffPosition = staff?.position || 'Nhân viên chăm sóc';

    return {
      id: assignment._id || `staff-${index}`,
      name: staffName,
      role: staffPosition,
      assignment: assignment,
      staff_id: staff
    };
  });

  const handleContactStaff = () => {
    router.push('/family/contact-staff');
  };

  const handleVisitSchedule = () => {
    router.push('/family/schedule-visit');
  };

  const handleViewPhotos = () => {
    router.push('/family/photos');
  };

  // Clear UI immediately when switching resident to avoid showing stale data
  const handleResidentChange = (id: string) => {
    setActivities([]);
    setActivityTimes({});
    setActivityHistoryDates([]);
    setSelectedActivityDate('');
    setCareNotes([]);
    setVitalSigns(null);
    setVitalSignsHistory([]);
    setTabsLoaded({ 0: false });
    setTabLoading({ 0: true });
    setAssignedStaff([]);
    setAssignedStaffLoading(true);
    setRoomNumber('Chưa hoàn tất đăng kí');
    setSelectedResidentId(id);
  };

  useEffect(() => {
    document.body.classList.remove('hide-header');
    document.body.style.overflow = 'unset';
  }, []);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);

      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  useEffect(() => {
    if (!loading && user && user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || (user && user.role !== 'family')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Đang tải thông tin người thân..." />
        </div>
      </div>
    );
  }

  if (residentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Đang tải thông tin người thân..." />
        </div>
      </div>
    );
  }
  
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  
  // Nếu chưa có người thân nào được đăng ký hoặc tất cả đều ở trạng thái pending
  const hasActiveResidents = residents.some(r => r.status && r.status !== 'pending');
  if (residents.length === 0 || !hasActiveResidents) {
    return (
      <>
        <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={successMessage} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none" style={{ backgroundPosition: '80% 20%' }} />
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent pointer-events-none" style={{ backgroundPosition: '40% 40%' }} />

          <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
            <div className="w-full max-w-6xl mx-auto">
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

              {/* Giao diện khi chưa có người thân */}
              <div className="relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-purple-300/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-emerald-300/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl"></div>
                
                <div className="relative bg-gradient-to-br from-white via-slate-50/50 to-white rounded-3xl p-16 shadow-2xl border border-white/30 backdrop-blur-xl text-center">
                  <div className="max-w-3xl mx-auto">
                    {/* Main icon with enhanced styling */}
                    <div className="relative mb-12">
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6 transform hover:scale-105 transition-all duration-300">
                        <UsersIcon className="w-16 h-16 text-white drop-shadow-lg" />
                      </div>
                      {/* Floating decorative elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full animate-pulse"></div>
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full animate-pulse delay-1000"></div>
                    </div>
                    
                    {/* Enhanced heading */}
                    <div className="mb-8">
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4 leading-tight">
                        {residents.length === 0 
                          ? 'Chưa có người cao tuổi nào được đăng ký'
                          : 'Đang chờ phê duyệt đăng ký'
                        }
                      </h2>
                      <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full mx-auto mb-6"></div>
                      <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                        {residents.length === 0 
                          ? 'Để theo dõi thông tin sức khỏe và hoạt động của người thân, bạn cần đăng ký thông tin người thân trước.'
                          : 'Đơn đăng ký của bạn đang được xem xét. Chúng tôi sẽ thông báo kết quả trong thời gian sớm nhất.'
                        }
                      </p>
                    </div>
                    
                    {/* Enhanced features section */}
                    <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50 rounded-3xl p-8 border border-emerald-200/50 mb-10 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <CheckCircleIcon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-800">
                          Sau khi đăng ký, bạn sẽ có thể:
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-emerald-700">
                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all duration-200">
                          <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-sm"></div>
                          <span className="font-semibold">Theo dõi chỉ số sức khỏe hàng ngày</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all duration-200">
                          <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-sm"></div>
                          <span className="font-semibold">Xem lịch hoạt động và tham gia</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all duration-200">
                          <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-sm"></div>
                          <span className="font-semibold">Đọc ghi chú chăm sóc từ nhân viên</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all duration-200">
                          <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-sm"></div>
                          <span className="font-semibold">Liên hệ trực tiếp với nhân viên phụ trách</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced CTA button */}
                    <div className="mb-8">
                      {residents.length === 0 ? (
                        <button 
                          onClick={() => router.push('/family/residents/new')}
                          className="group relative inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                          {/* Button background animation */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Button content */}
                          <div className="relative flex items-center gap-4">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                              <UsersIcon className="w-5 h-5" />
                            </div>
                            <span>Đăng ký</span>
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-4 px-12 py-5 bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300 rounded-3xl shadow-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-yellow-800 font-bold text-xl">Đang chờ phê duyệt</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced footer text */}
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full"></div>
                      <p className="text-base font-medium">
                        {residents.length === 0 
                          ? 'Quá trình đăng ký sẽ được hướng dẫn chi tiết và hoàn toàn miễn phí'
                          : 'Vui lòng chờ đợi trong khi chúng tôi xem xét đơn đăng ký của bạn'
                        }
                      </p>
                      <div className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
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
        <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none" style={{ backgroundPosition: '80% 20%' }} />
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent pointer-events-none" style={{ backgroundPosition: '40% 40%' }} />

        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="w-full max-w-6xl mx-auto">

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
                  onChange={opt => handleResidentChange(opt?.value || "")}
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

            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-10 w-full my-8">

              <div className="flex flex-col items-center mb-8">
                <img
                  src={getAvatarUrl(selectedResident?.avatar)}
                  alt="avatar"
                  className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-lg object-cover mb-3"
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
                <div className={`text-sm font-semibold mt-2 text-white rounded-full px-4 py-1.5 shadow-lg uppercase tracking-wider text-center ${(() => {
                  switch (selectedResident?.status) {
                    case 'active':
                      return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
                    case 'admitted':
                      return 'bg-gradient-to-r from-sky-500 to-sky-600';
                    case 'discharged':
                      return 'bg-gradient-to-r from-blue-500 to-blue-600';
                    case 'deceased':
                      return 'bg-gradient-to-r from-gray-500 to-gray-600';
                    case 'accepted':
                      return 'bg-gradient-to-r from-green-500 to-green-600';
                    case 'rejected':
                      return 'bg-gradient-to-r from-red-500 to-red-600';
                    case 'cancelled':
                      return 'bg-gradient-to-r from-rose-500 to-rose-600';
                    case 'pending':
                      return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                    default:
                      return 'bg-gradient-to-r from-slate-500 to-slate-600';
                  }
                })()}`}>
                  {(() => {
                    switch (selectedResident?.status) {
                      case 'active':
                        return 'Hoàn tất thông tin đăng ký';
                      case 'admitted':
                        return 'Đang nằm viện';
                      case 'discharged':
                        return 'Đã xuất viện';
                      case 'deceased':
                        return 'Đã qua đời';
                      case 'accepted':
                        return 'Đã duyệt';
                      case 'rejected':
                        return 'Bị từ chối';
                      case 'cancelled':
                        return 'Đã hủy';
                      case 'pending':
                        return 'Chờ xử lý';
                      default:
                        return 'Chưa xác định';
                    }
                  })()}
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
                  <CalendarDaysIcon className="w-4 h-4" />
                  Ngày nhập viện: {selectedResident?.admission_date ? formatDob(selectedResident.admission_date) : 'Chưa hoàn tất đăng kí'}
                </div>
              </div>

              {/* Thông báo hóa đơn chưa thanh toán cho resident active */}
              {selectedResident?.status === 'active' && unpaidBills.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-800">
                          Có {unpaidBills.length} hóa đơn chưa thanh toán
                        </h3>
                        <p className="text-sm text-red-600">
                          Tổng số tiền: {(unpaidBills.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0) * 10000).toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/family/finance')}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Thanh toán
                    </button>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-red-200">
                    <p className="text-sm text-red-700 font-medium">
                      <span className="font-bold">Lý do:</span> Cần thanh toán để hoàn tất quá trình nhập viện và kích hoạt các dịch vụ chăm sóc.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-6 w-full">

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
                          {(() => {
                            const dob = selectedResident?.date_of_birth || selectedResident?.dateOfBirth;
                            if (!dob) return 'Chưa hoàn tất đăng kí';
                            const formattedDob = formatDob(dob);
                            const age = getAge(dob);
                            return age ? `${formattedDob} (${age} Tuổi)` : formattedDob;
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-col p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300">
                        <span className="text-slate-600 font-semibold text-sm mb-1.5 uppercase tracking-wider">
                          {selectedResident?.status === 'active' ? 'phòng & giường đã đăng ký' : 'Phòng & Giường'}
                        </span>
                        <div className="text-slate-800 font-extrabold text-lg">
                          {(roomLoading || bedLoading) ? 'Đang tải...' : (
                            <span>Phòng: {roomNumber} — Giường: {bedNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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
                        <span className="text-slate-800 font-bold text-sm text-center">{selectedResident.emergency_contact.name || 'Chưa rõ'}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl border border-red-200">
                        <span className="text-red-600 font-semibold text-xs mb-1">Quan hệ</span>
                        <span className="text-slate-800 font-bold text-sm text-center">{selectedResident.emergency_contact.relationship ? toTitleCase(selectedResident.emergency_contact.relationship) : 'Chưa rõ'}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl border border-red-200">
                        <span className="text-red-600 font-semibold text-xs mb-1">Số điện thoại</span>
                        <span className="text-slate-800 font-bold text-sm text-center">{selectedResident.emergency_contact.phone || 'Chưa rõ'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 italic p-5 bg-red-50 rounded-xl border border-dashed border-red-200">
                      Chưa hoàn tất đăng kí thông tin liên hệ khẩn cấp
                    </div>
                  )}
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-center gap-2.5 mb-4">
                    <span className="font-bold text-lg text-slate-800 text-center">
                      Chỉ số sức khỏe của {selectedResident?.full_name}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-5 text-center p-2 bg-slate-50 rounded-lg">
                    Lần cập nhật gần nhất: {swrVitalLoading ? 'Đang tải...' : (swrVital?.date_time || swrVital?.dateTime) ? formatDateDDMMYYYYWithTimezone(swrVital?.date_time || swrVital?.dateTime) : 'chưa hoàn tất đăng kí'}
                  </div>
                  <div className="grid grid-cols-6 gap-4 text-sm mb-5">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 text-center">
                      <div className="text-red-700 font-semibold text-xs mb-1.5">Huyết áp (mmHg)</div>
                      <div className="font-bold text-red-600 text-lg">{swrVitalLoading ? 'Đang tải...' : (swrVital?.blood_pressure ?? swrVital?.bloodPressure ?? '--')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 text-center">
                      <div className="text-emerald-700 font-semibold text-xs mb-1.5">Nhịp tim (bpm)</div>
                      <div className="font-bold text-emerald-600 text-lg">{swrVitalLoading ? 'Đang tải...' : (swrVital?.heart_rate ?? swrVital?.heartRate ?? '--')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 text-center">
                      <div className="text-amber-700 font-semibold text-xs mb-1.5">Nhiệt độ cơ thể</div>
                      <div className="font-bold text-amber-600 text-lg">{swrVitalLoading ? 'Đang tải...' : (swrVital?.temperature ?? '--')}°C</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 text-center">
                      <div className="text-blue-700 font-semibold text-xs mb-1.5">SpO2 (%)</div>
                      <div className="font-bold text-blue-600 text-lg">{swrVitalLoading ? 'Đang tải...' : (swrVital?.oxygen_level ?? swrVital?.oxygen_saturation ?? swrVital?.oxygenSaturation ?? '--')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 text-center">
                      <div className="text-purple-700 font-semibold text-xs mb-1.5">Nhịp thở (lần/phút)</div>
                      <div className="font-bold text-purple-600 text-lg">{swrVitalLoading ? 'Đang tải...' : (swrVital?.respiratory_rate ?? swrVital?.respiratoryRate ?? '--')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200 text-center">
                      <div className="text-indigo-700 font-semibold text-xs mb-1.5">Cân nặng hiện tại</div>
                      <div className="font-bold text-indigo-600 text-lg">{swrVitalLoading ? 'Đang tải...' : (swrVital?.weight ?? '--')} kg</div>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center gap-2.5 justify-center">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                    Tình trạng: {swrVitalLoading ? 'Đang tải...' : (swrVital?.notes ?? 'Chưa hoàn tất đăng kí')}
                  </div>
                </div>

                {assignedStaffLoading ? (
                  <div className="text-center p-5 text-slate-500">
                    <div className="text-base font-semibold">Đang tải thông tin nhân viên...</div>
                  </div>
                ) : assignedStaffError ? (
                  <div className="text-center p-5 text-red-500 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-base font-semibold">{assignedStaffError}</div>
                  </div>
                ) : assignedStaff.length > 0 ? (
                  <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 m-0">
                        Nhân viên phụ trách chăm sóc
                      </h3>
                    </div>

                    <div className="h-0.5 bg-blue-500 mb-4" />

                    <div className="grid grid-cols-4 gap-4 mb-3 px-3">
                      <div className="text-xs text-blue-600 font-semibold text-center">Tên nhân viên</div>
                      <div className="text-xs text-blue-600 font-semibold text-center">Chức vụ</div>
                      <div className="text-xs text-blue-600 font-semibold text-center">Số điện thoại</div>
                      <div className="text-xs text-blue-600 font-semibold text-center">Liên hệ</div>
                    </div>

                    <div className="space-y-2">
                      {assignedStaff.map((assignment: any, index: number) => {
                        const staff = assignment.staff_id;
                        const staffName = staff?.full_name || staff?.fullName || staff?.name || staff?.username || staff?.email || 'Chưa rõ';
                        const staffPosition = staff?.position || 'Nhân viên chăm sóc';

                        return (
                          <div key={assignment._id || index} className="grid grid-cols-4 gap-4 bg-blue-50 rounded-lg p-3">
                            <div className="text-sm text-slate-800 font-bold text-center">
                              {staffName}
                            </div>
                            <div className="text-sm text-slate-800 font-bold text-center">
                              {staffPosition}
                            </div>
                            <div className="text-sm text-slate-800 font-bold text-center">
                              {staff?.phone || 'Chưa hoàn tất đăng kí'}
                            </div>
                            <div className="flex justify-center">
                              <ChatButton
                                residentId={selectedResidentId}
                                residentName={selectedResident?.full_name || 'Resident'}
                                staffId={staff?._id || staff?.id}
                                staffName={staffName}
                                onChatOpen={openChat}
                                className="w-8 h-8"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-white/20 w-full">
              <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
                <Tab.List className="flex bg-gradient-to-r from-slate-50 to-slate-200 border-b border-white/20">
                  <Tab onMouseEnter={() => { if (!tabsLoaded[0]) setTabLoading(prev => ({ ...prev, 0: true })); }} className={({ selected }) =>
                    `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${selected
                      ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                    }`
                  }>
                    Hoạt động sinh hoạt
                    {tabLoading[0] && (
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </Tab>
                  <Tab onMouseEnter={() => { if (!tabsLoaded[1] && !tabLoading[1]) loadCareNotesData(); }} className={({ selected }) =>
                    `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${selected
                      ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                    }`
                  }>
                    Ghi chú chăm sóc
                    {tabLoading[1] && (
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </Tab>
                  <Tab onMouseEnter={() => { if (!tabsLoaded[2] && !tabLoading[2]) loadVitalSignsData(); }} className={({ selected }) =>
                    `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${selected
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
                          <div className="relative">
                            <DatePicker
                              selected={selectedActivityDate ? new Date(selectedActivityDate) : null}
                              onChange={date => {
                                if (!date) return;
                                const iso = date.toISOString().slice(0, 10);
                                if (activityHistoryDates.includes(iso)) setSelectedActivityDate(iso);
                              }}
                              includeDates={activityHistoryDates.map(d => new Date(d))}
                              openToDate={selectedActivityDate ? new Date(selectedActivityDate) : undefined}
                              dateFormat="dd/MM/yyyy"
                              locale={vi}
                              popperPlacement="bottom"
                              showPopperArrow={false}
                              placeholderText="Chọn ngày"
                              className="px-4 py-2 rounded-xl border-2 border-blue-500 bg-white text-base font-semibold text-gray-700 cursor-pointer min-w-56 text-left shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                              wrapperClassName="w-full"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setShowActivityHistory(v => !v);
                            if (showActivityHistory) {
                              const todayFromAPI = serverToday || new Date().toISOString().slice(0, 10);
                              setSelectedActivityDate(todayFromAPI);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg border border-purple-500 text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 ${showActivityHistory
                            ? 'bg-white text-purple-500 hover:bg-gray-100'
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                            }`}
                        >
                          <CalendarDaysIcon className="w-4 h-4" />
                          {showActivityHistory ? 'Xem hôm nay' : 'Xem lịch sử hoạt động'}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {tabLoading[0] ? (
                        <div className="flex flex-col items-center justify-center p-12">
                          <LoadingSpinner size="lg" text="Đang tải hoạt động..." />
                        </div>
                      ) : activitiesError ? (
                        <div className="text-red-500">{activitiesError}</div>
                      ) : Array.isArray(activities) && activities.length > 0 ? (
                        activities.map((activity: any) => {
                          const attended = activity.attendance_status === 'attended';
                          const absent = activity.attendance_status === 'absent';
                          const activityId = activity.activity_id?._id || activity.activity_id;
                          const activityName = activity.activity_id?.activity_name;

                          // Bỏ qua hoạt động không có tên hoặc đã bị xóa
                          if (!activityName || activityName === '---') {
                            return null;
                          }

                          const formatTimeForDisplay = (isoTime: string) => {
                            if (!isoTime) return '';
                            // isoTime đã được xử lý đúng trong convertToVietnamTime, chỉ cần format
                            return isoTime;
                          };

                          const time = activityTimes[activityId]?.start ? formatTimeForDisplay(activityTimes[activityId].start) : '';
                          const endTimeStr = activityTimes[activityId]?.end ? formatTimeForDisplay(activityTimes[activityId].end) : '';

                          const resolveStaffName = (): string => {
                            const staffFromActivity = activity?.staff_id as any;
                            if (staffFromActivity && typeof staffFromActivity === 'object') {
                              return staffFromActivity.full_name || staffFromActivity.fullName || staffFromActivity.name || staffFromActivity.username || '';
                            }
                            const staffId = (typeof activity?.staff_id === 'string') ? activity.staff_id : (staffFromActivity?._id || staffFromActivity?.id);
                            if (!staffId) return '';
                            const match = assignedStaff.find((assignment: any) => {
                              const id = assignment?.staff_id?._id || assignment?.staff_id?.id;
                              return String(id) === String(staffId);
                            });
                            return match?.staff_id?.full_name || match?.staff_id?.fullName || match?.staff_id?.name || '';
                          };
                          const staffName = resolveStaffName() || 'Chưa rõ';

                          return (
                            <div key={activity._id} className={`flex items-center p-4 rounded-xl border ${attended
                              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
                              : absent
                                ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                                : 'bg-white border-gray-200'
                              }`}>
                              <div className="mr-4">
                                {attended ? (
                                  <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                                ) : absent ? (
                                  <XCircleIcon className="w-6 h-6 text-red-500" />
                                ) : (
                                  <ClockIcon className="w-6 h-6 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 mb-1">
                                  <span className="font-semibold text-gray-700">Hoạt động: </span>{activityName}
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                  <span className="font-semibold">Thời gian: </span>{time}{endTimeStr ? ` - ${endTimeStr}` : ''}
                                </div>
                                <div className="text-xs text-blue-600 mb-1">
                                  <span className="font-semibold">Nhân viên phụ trách: </span>
                                  {staffName || 'Chưa phân công'}
                                </div>
                                <span className={`text-xs font-medium ${attended ? 'text-emerald-700' : absent ? 'text-red-600' : 'text-gray-500'
                                  }`}>
                                  <span className="font-semibold">Trạng thái: </span>
                                  {attended ? 'Đã tham gia' : absent ? <>Không tham gia{activity.performance_notes && <> - Lý do: <span className="text-red-500">{activity.performance_notes}</span></>}</> : 'Chưa tham gia'}
                                </span>
                              </div>
                            </div>
                          );
                        }).filter(Boolean)
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
                        <LoadingSpinner size="lg" text="Đang tải ghi chú chăm sóc..." />
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
                              onClick={() => setCareNotesPage(p => Math.max(1, p - 1))}
                              disabled={careNotesPage === 1}
                              className={`mr-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${careNotesPage === 1
                                ? 'bg-purple-100 text-purple-500 cursor-not-allowed'
                                : 'bg-white text-purple-500 cursor-pointer hover:bg-purple-50'
                                }`}
                            >
                              ← Trang trước
                            </button>
                            <span className="font-semibold text-purple-600">Trang {careNotesPage}/{totalPages}</span>
                            <button
                              onClick={() => setCareNotesPage(p => Math.min(totalPages, p + 1))}
                              disabled={careNotesPage === totalPages}
                              className={`ml-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${careNotesPage === totalPages
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
                        <LoadingSpinner size="lg" text="Đang tải chỉ số sức khỏe..." />
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
                                <tr key={vital._id} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}>
                                  <td className="p-4 font-semibold text-gray-700">
                                    {vital.date_time ? formatDateDDMMYYYYWithTimezone(vital.date_time) : ''}
                                  </td>
                                  <td className="p-4 text-gray-500">
                                    {vital.date_time ? formatTimeWithTimezone(vital.date_time) : ''}
                                  </td>
                                  <td className="p-4 font-bold text-red-500 text-base">
                                    {vital.blood_pressure ? `${vital.blood_pressure} mmHg` : <span className="text-gray-400">--</span>}
                                  </td>
                                  <td className="p-4 font-bold text-emerald-600 text-base">
                                    {vital.heart_rate ? `${vital.heart_rate} bpm` : <span className="text-gray-400">--</span>}
                                  </td>
                                  <td className="p-4 font-bold text-amber-600 text-base">
                                    {vital.temperature ? `${vital.temperature}°C` : <span className="text-gray-400">--</span>}
                                  </td>
                                  <td className="p-4 font-bold text-blue-600 text-base">
                                    {(vital.oxygen_level ?? vital.oxygen_saturation) ? `${vital.oxygen_level ?? vital.oxygen_saturation}%` : <span className="text-gray-400">--</span>}
                                  </td>
                                  <td className="p-4 font-bold text-purple-600 text-base">
                                    {vital.respiratory_rate ? `${vital.respiratory_rate} lần/phút` : <span className="text-gray-400">--</span>}
                                  </td>
                                  <td className="p-4 font-bold text-indigo-600 text-base">
                                    {vital.weight ? `${vital.weight} kg` : <span className="text-gray-400">--</span>}
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
                          onClick={() => setVitalPage(p => Math.max(1, p - 1))}
                          disabled={vitalPage === 1}
                          className={`mr-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${vitalPage === 1
                            ? 'bg-purple-100 text-purple-500 cursor-not-allowed'
                            : 'bg-white text-purple-500 cursor-pointer hover:bg-purple-50'
                            }`}
                        >
                          ← Trang trước
                        </button>
                        <span className="font-semibold text-purple-600">Trang {vitalPage}/{totalVitalPages}</span>
                        <button
                          onClick={() => setVitalPage(p => Math.min(totalVitalPages, p + 1))}
                          disabled={vitalPage === totalVitalPages}
                          className={`ml-2 px-4 py-1.5 rounded-lg border border-purple-500 font-semibold ${vitalPage === totalVitalPages
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
      <ChatWidget
        isOpen={chatState.isOpen}
        onClose={closeChat}
        residentId={chatState.currentResidentId || ''}
        staffId={chatState.currentStaffId || undefined}
        residentName={chatState.currentResidentName}
        staffName={chatState.currentStaffName}
      />
    </>
  );
}

export default function FamilyPortalPage() {
  return <FamilyPortalPageContent />;
} 