"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlansAPI, residentAPI, roomsAPI, bedsAPI, roomTypesAPI, carePlanAssignmentsAPI, userAPI, apiClient, bedAssignmentsAPI } from '@/lib/api';
import { clientStorage } from '@/lib/utils/clientStorage';
import { useResidentsAssignmentStatus } from '@/hooks/useOptimizedData';
import { ArrowLeftIcon, CheckCircleIcon, UserIcon, MagnifyingGlassIcon, FunnelIcon, CalendarIcon, PhoneIcon, MapPinIcon, GiftIcon, PlusIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

export default function SelectPackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [mainPackageId, setMainPackageId] = useState<string>('');
  const [supplementaryIds, setSupplementaryIds] = useState<string[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [packageSortBy, setPackageSortBy] = useState('name');
  const [packageCurrentPage, setPackageCurrentPage] = useState(1);
  const [packageItemsPerPage] = useState(4);

  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationPeriod, setRegistrationPeriod] = useState('1');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [familyPreferences, setFamilyPreferences] = useState({
    preferred_room_gender: '',
    preferred_floor: '',
    special_requests: ''
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupplementaryDetails, setShowSupplementaryDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);

  const residentId = searchParams.get('residentId') || '';

  const [residentsWithAssignmentStatus, setResidentsWithAssignmentStatus] = useState<{ [key: string]: { hasAssignment: boolean; isExpired: boolean; endDate?: string } }>({});
  const [loadingAssignmentStatus, setLoadingAssignmentStatus] = useState(false);
  const [displayedResidentIds, setDisplayedResidentIds] = useState<string[]>([]);
  const [residentServiceStatus, setResidentServiceStatus] = useState<{[key: string]: any}>({});
  const [loadingServiceStatus, setLoadingServiceStatus] = useState(false);

  // New state for re-registration
  const [keepExistingRoomBed, setKeepExistingRoomBed] = useState(false);
  const [existingRoomInfo, setExistingRoomInfo] = useState<any>(null);
  const [existingBedInfo, setExistingBedInfo] = useState<any>(null);
  const [loadingExistingInfo, setLoadingExistingInfo] = useState(false);

  // Resident gender for filtering rooms consistently on step 4
  const [residentGenderForFilter, setResidentGenderForFilter] = useState<string>('');

  // Pending new resident payload from previous step
  const [pendingResident, setPendingResident] = useState<any | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pending_resident_payload');
      if (raw) {
        const parsed = JSON.parse(raw);
        setPendingResident(parsed);
        setStep(2); // Skip resident selection
      }
    } catch {}
  }, []);

  // If we have residentId in URL, prefer that flow and clear any leftover cached pending payload
  useEffect(() => {
    if (residentId) {
      try { sessionStorage.removeItem('pending_resident_payload'); } catch {}
      setPendingResident(null);
    }
  }, [residentId]);

  const isNewResidentFlow = useMemo(() => Boolean(pendingResident), [pendingResident]);

  // Helper: dataURL -> Blob
  const dataURLToBlob = (dataUrl: string | null): Blob | null => {
    if (!dataUrl) return null;
    try {
      const arr = dataUrl.split(',');
      const header = arr[0] || '';
      const match = header.match(/:(.*?);/);
      const mime = match && match[1] ? match[1] : 'application/octet-stream';
      const bstr = atob(arr[1] || '');
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch {
      return null;
    }
  };

  // Helper: create resident from cached payload after we have care_plan_assignment_id
  const createResidentFromPending = async (carePlanAssignmentId: string) => {
    if (!pendingResident) return null;
    const formData = new FormData();
    try {
      if (pendingResident.files?.avatar) {
        const blob = dataURLToBlob(pendingResident.files.avatar);
        if (blob) formData.append('avatar', blob, 'avatar.jpg');
      }
      if (pendingResident.files?.cccd_front) {
        const blob = dataURLToBlob(pendingResident.files.cccd_front);
        if (blob) formData.append('cccd_front', blob, 'cccd_front.jpg');
      }
      if (pendingResident.files?.cccd_back) {
        const blob = dataURLToBlob(pendingResident.files.cccd_back);
        if (blob) formData.append('cccd_back', blob, 'cccd_back.jpg');
      }
      if (pendingResident.files?.user_cccd_front) {
        const blob = dataURLToBlob(pendingResident.files.user_cccd_front);
        if (blob) formData.append('user_cccd_front', blob, 'user_cccd_front.jpg');
      }
      if (pendingResident.files?.user_cccd_back) {
        const blob = dataURLToBlob(pendingResident.files.user_cccd_back);
        if (blob) formData.append('user_cccd_back', blob, 'user_cccd_back.jpg');
      }

      formData.append('full_name', pendingResident.full_name);
      formData.append('gender', pendingResident.gender);
      formData.append('date_of_birth', pendingResident.date_of_birth);
      formData.append('cccd_id', pendingResident.cccd_id);
      formData.append('user_cccd_id', pendingResident.user_cccd_id);
      formData.append('family_member_id', pendingResident.family_member_id);
      formData.append('relationship', pendingResident.relationship);
      formData.append('medical_history', pendingResident.medical_history || 'Không có');
      formData.append('current_medications', JSON.stringify(pendingResident.current_medications || []));
      formData.append('allergies', JSON.stringify(pendingResident.allergies || []));
      formData.append('emergency_contact', JSON.stringify(pendingResident.emergency_contact || {}));
      if (pendingResident.admission_date) formData.append('admission_date', pendingResident.admission_date);
      if (carePlanAssignmentId) formData.append('care_plan_assignment_id', carePlanAssignmentId);

      const res = await residentAPI.create(formData);
      try { sessionStorage.removeItem('pending_resident_payload'); } catch {}
      return res;
    } catch (e) {
      return null;
    }
  };

  const isInitialLoading = useMemo(() => {
    return !residents.length || !carePlans.length;
  }, [residents, carePlans]);

  useEffect(() => {
    if (startDate && registrationPeriod && registrationPeriod !== 'custom') {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + parseInt(registrationPeriod));
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, registrationPeriod]);

  // Ensure start date is set when entering step 6
  useEffect(() => {
    if (step !== 6) return;
    if (startDate) return;
    // Prefer pending resident
    if (pendingResident?.admission_date) {
      try {
        const iso = new Date(pendingResident.admission_date).toISOString().split('T')[0];
        setStartDate(iso);
        return;
      } catch {}
    }
    // Fetch by id if needed
    const rid = residentId || selectedResidentId;
    if (!rid) return;
    const local = residents.find(x => (x._id || x.id) === rid);
    if (local?.admission_date) {
      try {
        const iso = new Date(local.admission_date).toISOString().split('T')[0];
        setStartDate(iso);
      } catch {}
      return;
    }
    (async () => {
      try {
        const r = await residentAPI.getById?.(rid);
        if (r?.admission_date) {
          const iso = new Date(r.admission_date).toISOString().split('T')[0];
          setStartDate(iso);
        }
      } catch {}
    })();
  }, [step, startDate, pendingResident?.admission_date, residentId, selectedResidentId, residents]);

  const { data: assignmentMap, refetch: fetchAssignmentMap } = useResidentsAssignmentStatus(residents);

  // Mark status as loading whenever residents list changes
  useEffect(() => {
    if (residents && residents.length > 0) {
      setLoadingAssignmentStatus(true);
    }
  }, [residents]);

  // Load cached assignment status immediately for instant display
  useEffect(() => {
    try {
      const raw = clientStorage.getItem('assignmentStatusCache');
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && typeof cached === 'object') {
          setResidentsWithAssignmentStatus(cached);
          setLoadingAssignmentStatus(false);
        }
      }
    } catch {}
  }, []);

  const residentsRef = useRef<string>('');
  const currentResidentsKey = residents.map(r => r._id || r.id).join('_');

  // Function to fetch existing room and bed information
  const fetchExistingRoomBedInfo = async (residentId: string) => {
    setLoadingExistingInfo(true);
    try {
      // Get bed assignments to find current room and bed
      const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
      const bedAssignment = Array.isArray(bedAssignments) ? 
        bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
      
      if (bedAssignment?.bed_id?.room_id) {
        let roomInfo: any = null;
        let bedInfo: any = null;
        
        // Get room info
        if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
          roomInfo = bedAssignment.bed_id.room_id;
        } else {
          const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
          if (roomId) {
            const room = await roomsAPI.getById(roomId);
            roomInfo = room;
          }
        }
        
        // Get bed info
        if (typeof bedAssignment.bed_id === 'object' && bedAssignment.bed_id.bed_number) {
          bedInfo = bedAssignment.bed_id;
        } else {
          const bedId = typeof bedAssignment.bed_id === 'object' && bedAssignment.bed_id?._id ? 
            bedAssignment.bed_id._id : bedAssignment.bed_id;
          if (bedId) {
            const bed = await bedsAPI.getById(bedId);
            bedInfo = bed;
          }
        }
        
        setExistingRoomInfo(roomInfo);
        setExistingBedInfo(bedInfo);
        
        // Auto-fill room and bed selection if keeping existing
        if (keepExistingRoomBed && roomInfo && bedInfo) {
          setRoomType(roomInfo.room_type || '');
          setSelectedRoomId(roomInfo._id || '');
          setSelectedBedId(bedInfo._id || '');
        }
      }
    } catch (error) {
      console.error('Error fetching existing room/bed info:', error);
    } finally {
      setLoadingExistingInfo(false);
    }
  };

  // Effect to fetch existing room/bed info when resident changes
  useEffect(() => {
    const finalResidentId = residentId || selectedResidentId;
    if (finalResidentId) {
      const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
      const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;
      
      if (isReRegistering) {
        fetchExistingRoomBedInfo(finalResidentId);
      }
    }
  }, [residentId, selectedResidentId, residentsWithAssignmentStatus]);

  // Effect to auto-fill room and bed when keeping existing ones
  useEffect(() => {
    if (keepExistingRoomBed && existingRoomInfo && existingBedInfo) {
      setRoomType(existingRoomInfo.room_type || '');
      setSelectedRoomId(existingRoomInfo._id || '');
      setSelectedBedId(existingBedInfo._id || '');
    }
  }, [keepExistingRoomBed, existingRoomInfo, existingBedInfo]);

  // Effect to immediately update display when assignment status changes
  useEffect(() => {
    if (assignmentMap && Object.keys(assignmentMap).length > 0) {
      // Immediately update the residents list to hide those with active assignments
      setResidentsWithAssignmentStatus(assignmentMap);
      try {
        clientStorage.setItem('assignmentStatusCache', JSON.stringify(assignmentMap));
      } catch {}
      setLoadingAssignmentStatus(false);
    }
  }, [assignmentMap]);

  // Compute active+search ids and freeze UI until we know their status
  const activeAndSearchedIds = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase();
    return residents
      .filter(r => r.status === 'active')
      .filter(r => ((r.full_name || r.name || '').toLowerCase().includes(searchLower)))
      .filter(r => {
        // Chỉ hiển thị resident chưa đăng ký dịch vụ hoặc có dịch vụ hết hạn
        const serviceStatus = residentServiceStatus[r._id || r.id];
        if (!serviceStatus) return false; // Chờ load trạng thái
        
        // Chỉ hiển thị resident đã được duyệt (không phải pending)
        if (serviceStatus.residentStatus && serviceStatus.residentStatus === 'pending') {
          return false;
        }
        
        // Hiển thị nếu chưa có dịch vụ active và không đang chờ duyệt
        return !serviceStatus.hasActiveService && !serviceStatus.hasPendingService;
      })
      .map(r => r._id || r.id)
      .filter(Boolean);
  }, [residents, searchTerm, residentServiceStatus]);

  const hasCompleteStatusForView = useMemo(() => {
    if (!activeAndSearchedIds.length) return true;
    return activeAndSearchedIds.every(id => Boolean(residentServiceStatus[id]));
  }, [activeAndSearchedIds, residentServiceStatus]);

  useEffect(() => {
    if (!hasCompleteStatusForView) return;
    const searchLower = (searchTerm || '').toLowerCase();
    const filtered = residents
      .filter(r => r.status === 'active')
      .filter(r => ((r.full_name || r.name || '').toLowerCase().includes(searchLower)))
      .filter(r => {
        const id = r._id || r.id;
        const serviceStatus = residentServiceStatus[id];
        if (!serviceStatus) return false;
        
        // Chỉ hiển thị resident đã được duyệt (không phải pending)
        if (serviceStatus.residentStatus && serviceStatus.residentStatus === 'pending') {
          return false;
        }
        
        // Hiển thị nếu chưa có dịch vụ active và không đang chờ duyệt
        return !serviceStatus.hasActiveService && !serviceStatus.hasPendingService;
      })
      .map(r => r._id || r.id);
    setDisplayedResidentIds(filtered);
    setLoadingServiceStatus(false);
  }, [hasCompleteStatusForView, residents, residentServiceStatus, searchTerm]);

  const filteredAndSortedResidents = useMemo(() => {
    if (!displayedResidentIds.length) return [];
    const idSet = new Set(displayedResidentIds);
    const arr = residents.filter(r => idSet.has(r._id || r.id));
    arr.sort((a, b) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || ''));
    return arr;
  }, [displayedResidentIds, residents]);

  const totalPages = Math.ceil(filteredAndSortedResidents.length / itemsPerPage);
  const paginatedResidents = filteredAndSortedResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const steps = [
    'Chọn người thụ hưởng',
    'Chọn gói dịch vụ',
    'Chọn loại phòng',
    'Chọn phòng',
    'Chọn giường',
    'Thông tin bổ sung',
    'Xem lại & xác nhận',
    'Hoàn tất'
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.role || !['admin', 'staff', 'family'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Derive resident gender for room filtering (handles: new flow, selected, or by query param)
  useEffect(() => {
    // 1) From new resident flow cached data
    if (pendingResident?.gender) {
      setResidentGenderForFilter(pendingResident.gender);
      return;
    }
    // 2) From selected resident in list
    const rid = residentId || selectedResidentId;
    if (rid && Array.isArray(residents) && residents.length > 0) {
      const r = residents.find((x) => (x._id || x.id) === rid);
      if (r?.gender) {
        setResidentGenderForFilter(r.gender);
        return;
      }
    }
  }, [pendingResident?.gender, residentId, selectedResidentId, residents]);

  // Fallback: If gender still unknown but have residentId, fetch that resident once
  useEffect(() => {
    const rid = residentId || selectedResidentId;
    if (!residentGenderForFilter && rid) {
      (async () => {
        try {
          const r = await residentAPI.getById?.(rid);
          if (r?.gender) setResidentGenderForFilter(r.gender);
        } catch {}
      })();
    }
  }, [residentGenderForFilter, residentId, selectedResidentId]);

  // Care plans via SWR
  const { data: swrCarePlans, isLoading: isCarePlansLoading, error: carePlansError } = useSWR(
    'care-plans',
    () => carePlansAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  useEffect(() => {
    setLoading(isCarePlansLoading);
    if (Array.isArray(swrCarePlans)) setCarePlans(swrCarePlans);
    if (carePlansError) setError('Không thể tải danh sách gói dịch vụ');
  }, [swrCarePlans, isCarePlansLoading, carePlansError]);

  // Residents via SWR (by role)
  const { data: swrResidents } = useSWR(
    user ? ['residents-by-role', user.role, user.id] : null,
    async () => {
      if (user?.role === 'family' && user?.id) {
        const res = await residentAPI.getByFamilyMemberId(user.id);
        return Array.isArray(res) ? res : (res ? [res] : []);
      }
      if (user?.role === 'admin' || user?.role === 'staff') {
        const res = await residentAPI.getAll?.({});
        return Array.isArray(res) ? res : [];
      }
      return [];
    },
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  useEffect(() => {
    if (!user) return;
    if (residentId) {
      setSelectedResidentId(residentId);
      setStep(2);
      // Do not return here; still allow residents list to load below
    }
    if (isNewResidentFlow && !residentId) {
      // Skip loading residents only for brand-new flow without residentId
      return;
    }
    if (Array.isArray(swrResidents)) {
      setResidents(swrResidents);
      
      // Kiểm tra trạng thái dịch vụ cho từng resident
      if (swrResidents.length > 0) {
        setLoadingServiceStatus(true);
        const statusPromises = swrResidents.map(async (resident: any) => {
          try {
            const assignments = await carePlanAssignmentsAPI.getByResidentId(resident._id);
            return {
              residentId: resident._id,
              assignments: Array.isArray(assignments) ? assignments : [],
              hasActiveService: assignments.some((a: any) => a.status === 'active' || a.status === 'approved'),
              hasPendingService: assignments.some((a: any) => a.status === 'pending'),
              hasRejectedService: assignments.some((a: any) => a.status === 'rejected'),
              residentStatus: resident.status
            };
          } catch (error) {
            return {
              residentId: resident._id,
              assignments: [],
              hasActiveService: false,
              hasPendingService: false,
              hasRejectedService: false,
              residentStatus: resident.status
            };
          }
        });
        
        Promise.all(statusPromises).then((statuses) => {
          const statusMap: {[key: string]: any} = {};
          statuses.forEach(status => {
            statusMap[status.residentId] = status;
          });
          setResidentServiceStatus(statusMap);
          setLoadingServiceStatus(false);
        });
      }
    }
  }, [user, residentId, swrResidents, isNewResidentFlow]);

  // Room types via SWR
  const { data: swrRoomTypes, isLoading: isRoomTypesLoading } = useSWR(
    'room-types',
    () => roomTypesAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  useEffect(() => {
    setLoadingRoomTypes(isRoomTypesLoading);
    if (Array.isArray(swrRoomTypes)) setRoomTypes(swrRoomTypes);
  }, [swrRoomTypes, isRoomTypesLoading]);

  // Rooms via SWR
  const { data: swrRooms, isLoading: isRoomsLoading } = useSWR(
    'rooms',
    () => roomsAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Load rooms from cache immediately if available
  useEffect(() => {
    try {
      const raw = clientStorage.getItem('roomsCache');
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0 && rooms.length === 0) {
          setRooms(cached);
          setLoadingRooms(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    setLoadingRooms(isRoomsLoading);
    if (Array.isArray(swrRooms)) {
      setRooms(swrRooms);
      try { clientStorage.setItem('roomsCache', JSON.stringify(swrRooms)); } catch {}
    }
  }, [swrRooms, isRoomsLoading]);

  // Beds via SWR: only fetch for selected room
  const shouldFetchBeds = Boolean(selectedRoomId) && !keepExistingRoomBed;
  const { data: swrBeds, isLoading: isBedsLoading } = useSWR(
    shouldFetchBeds ? ['beds-by-room', selectedRoomId] : null,
    () => bedsAPI.getByRoom(selectedRoomId, 'available'),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  useEffect(() => {
    if (!shouldFetchBeds) {
      setBeds([]);
          setLoadingBeds(false);
      return;
    }
    setLoadingBeds(isBedsLoading);
    setBeds(Array.isArray(swrBeds) ? swrBeds : []);
  }, [shouldFetchBeds, isBedsLoading, swrBeds]);

  // Pre-index beds by room for O(1) lookup
  const bedsByRoomId = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of beds) {
      if (!b) continue;
      const key = b.room_id || b.roomId || '';
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [beds]);

  const bedsByRoomNumber = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of beds) {
      const rn = b.room_number || b.roomNumber;
      if (!rn) continue;
      if (!map[rn]) map[rn] = [];
      map[rn].push(b);
    }
    return map;
  }, [beds]);

  const mainPlans = useMemo(() => carePlans.filter((p) => p?.category === 'main' && p?.is_active !== false), [carePlans]);
  const supplementaryPlans = useMemo(() => carePlans.filter((p) => p?.category !== 'main' && p?.is_active !== false), [carePlans]);

  const filteredAndSortedMainPlans = useMemo(() => {
    let filtered = mainPlans.filter(plan =>
      plan.plan_name?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );

    switch (packageSortBy) {
      case 'name':
        filtered.sort((a, b) => (a.plan_name || '').localeCompare(b.plan_name || ''));
        break;
      case 'price':
        filtered.sort((a, b) => (a.monthly_price || 0) - (b.monthly_price || 0));
        break;
      case 'type':
        filtered.sort((a, b) => (a.plan_type || '').localeCompare(b.plan_type || ''));
        break;
    }

    return filtered;
  }, [mainPlans, packageSearchTerm, packageSortBy]);

  const filteredAndSortedSupplementaryPlans = useMemo(() => {
    let filtered = supplementaryPlans.filter(plan =>
      plan.plan_name?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );

    switch (packageSortBy) {
      case 'name':
        filtered.sort((a, b) => (a.plan_name || '').localeCompare(b.plan_name || ''));
        break;
      case 'price':
        filtered.sort((a, b) => (a.monthly_price || 0) - (b.monthly_price || 0));
        break;
      case 'type':
        filtered.sort((a, b) => (a.plan_type || '').localeCompare(b.plan_type || ''));
        break;
    }

    return filtered;
  }, [supplementaryPlans, packageSearchTerm, packageSortBy]);

  const paginatedMainPlans = useMemo(() => {
    const startIndex = (packageCurrentPage - 1) * packageItemsPerPage;
    return filteredAndSortedMainPlans.slice(startIndex, startIndex + packageItemsPerPage);
  }, [filteredAndSortedMainPlans, packageCurrentPage, packageItemsPerPage]);

  const paginatedSupplementaryPlans = useMemo(() => {
    const startIndex = (packageCurrentPage - 1) * packageItemsPerPage;
    return filteredAndSortedSupplementaryPlans.slice(startIndex, startIndex + packageItemsPerPage);
  }, [filteredAndSortedSupplementaryPlans, packageCurrentPage, packageItemsPerPage]);

  const totalMainPages = Math.ceil(filteredAndSortedMainPlans.length / packageItemsPerPage);
  const totalSupplementaryPages = Math.ceil(filteredAndSortedSupplementaryPlans.length / packageItemsPerPage);

  const isValidAvatarUrl = (avatar: string) => {
    if (!avatar || avatar === '' || avatar === 'null') return false;
    if (avatar.includes('default') || avatar.includes('placeholder') || avatar.includes('generic')) return false;
    if (avatar.startsWith('data:')) return true;

    try {
      const url = new URL(avatar);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return avatar.startsWith('/') || avatar.startsWith('./');
    }
  };
  const getBedsForRoom = (roomId: string, residentGender?: string) => {
    const selectedRoom = rooms.find(r => r._id === roomId);

    // Fast path: direct map lookup
    let apiBeds = bedsByRoomId[roomId] ? [...bedsByRoomId[roomId]] : [];

    if (apiBeds.length === 0 && selectedRoom?.room_number) {
      apiBeds = bedsByRoomNumber[selectedRoom.room_number] ? [...bedsByRoomNumber[selectedRoom.room_number]] : [];
    }

    if (apiBeds.length === 0 && selectedRoom?.bed_info) {
      const totalBeds = selectedRoom.bed_info.total_beds || selectedRoom.bed_count || 0;
      const availableBeds = selectedRoom.bed_info.available_beds || totalBeds;

      const generatedBeds: any[] = [];
      for (let i = 1; i <= totalBeds; i++) {
        generatedBeds.push({
          _id: `${roomId}_bed_${i}`,
          bed_number: i,
          room_id: roomId,
          room_number: selectedRoom.room_number,
          status: i <= availableBeds ? 'available' : 'occupied'
        });
      }

      return generatedBeds.filter((b: any) => b.status === 'available');
    }

    let filteredBeds = apiBeds.filter(b => b.status === 'available');

    if (residentGender && selectedRoom?.gender) {
      if (residentGender.toLowerCase() !== selectedRoom.gender.toLowerCase()) {
        return [];
      }
    }

    return filteredBeds;
  };

  const formatBedName = (bed: any, roomNumber?: string) => {
    if (bed.bed_number && typeof bed.bed_number === 'string' && bed.bed_number.includes('-')) {
      return bed.bed_number;
    }

    if (bed.bed_name) {
      return bed.bed_name;
    }

    if (roomNumber && bed.bed_number) {
      const roomNum = roomNumber.replace(/\D/g, '');
      const bedLetter = String.fromCharCode(64 + parseInt(bed.bed_number));
      return `${roomNum}-${bedLetter}`;
    }

    return bed.bed_number || `Giường ${bed._id}`;
  };

  const toggleSupplementary = (id: string) => {
    setSupplementaryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!mainPackageId) return;

    setIsSubmitting(true);
    try {
      const finalResidentId = residentId || selectedResidentId;

      const residentAssignmentStatus = finalResidentId ? residentsWithAssignmentStatus[finalResidentId] : undefined;
      const isReRegistering = Boolean(finalResidentId && residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired);

      let assignedBedId: string | null = null;

      if (selectedBedId && !selectedBedId.includes('_bed_')) {
        assignedBedId = selectedBedId;
      } else if (selectedBedId && selectedBedId.includes('_bed_')) {
        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
        const residentGender = (pendingResident?.gender) || residents.find(r => r._id === finalResidentId)?.gender;
        const availableBeds = getBedsForRoom(selectedRoomId, residentGender);
        const bedNumber = selectedBedId.split('_bed_')[1];
        const actualBed = availableBeds.find(b => b.bed_number == bedNumber && !b._id.includes('_bed_'));
        if (actualBed && actualBed._id) {
          assignedBedId = actualBed._id;
        }
      }

      const selectedRoom = rooms.find(r => r._id === selectedRoomId);
      const selectedRoomType = selectedRoom?.room_type || '';

      // Normalize dates to ISO strings for BE (bsonType: date)
      const startISO = startDate ? new Date(startDate).toISOString() : '';
      const endISO = endDate ? new Date(endDate).toISOString() : '';

      // Calculate costs
      const mainPlan = mainPlans.find(p => p._id === mainPackageId);
      const supplementaryPlansList = supplementaryPlans.filter(p => supplementaryIds.includes(p._id));
      
      const mainPlanPrice = mainPlan?.monthly_price || 0;
      const supplementaryPlansPrice = supplementaryPlansList.reduce((total, plan) => total + (plan.monthly_price || 0), 0);
      const carePlansMonthlyCost = mainPlanPrice + supplementaryPlansPrice;

      // Calculate room price
      let roomPrice = 0;
      if (keepExistingRoomBed && existingRoomInfo) {
        const existingRoomTypeObj = roomTypes.find(rt => rt.room_type === existingRoomInfo.room_type);
        roomPrice = existingRoomTypeObj?.monthly_price || 0;
      } else {
        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
        const roomTypeObj = roomTypes.find(rt => rt.room_type === selectedRoom?.room_type);
        roomPrice = roomTypeObj?.monthly_price || 0;
      }

      const totalMonthlyCost = carePlansMonthlyCost + roomPrice;

      // Build care plan assignment payload
      const basePayload: any = {
        care_plan_ids: [mainPackageId, ...supplementaryIds],
        start_date: startISO,
        end_date: endISO,
        registration_date: startISO,
        consultation_notes: medicalNotes || "",
        family_preferences: {
          preferred_room_gender: (pendingResident?.gender || residents.find(r => r._id === finalResidentId)?.gender || "any"),
          preferred_floor: Number(familyPreferences.preferred_floor) || 0,
          special_requests: familyPreferences.special_requests || ""
        },
        assigned_room_id: selectedRoomId,
        selected_room_type: selectedRoomType,
        ...(assignedBedId ? { assigned_bed_id: assignedBedId } : {}),
        staff_id: user?.id || "",
        status: "pending",
        // Add cost fields
        total_monthly_cost: totalMonthlyCost,
        room_monthly_cost: roomPrice,
        care_plans_monthly_cost: carePlansMonthlyCost
      };

      if (!isNewResidentFlow) {
        basePayload.resident_id = finalResidentId;
      }

      console.log('Care plan assignment payload:', basePayload);

      const assignmentRes = await carePlanAssignmentsAPI.create(basePayload);
      const assignmentId = assignmentRes?._id || assignmentRes?.id || assignmentRes?.data?._id || assignmentRes?.data?.id || '';

      let actualResidentId = finalResidentId;
      
      if (isNewResidentFlow && assignmentId) {
        const createdResident = await createResidentFromPending(assignmentId);
        if (createdResident && (createdResident._id || createdResident.id)) {
          actualResidentId = createdResident._id || createdResident.id;
        }
      }

      // Create bed assignment if room and bed are selected
      if (selectedRoomId && assignedBedId && actualResidentId) {
        try {
          const bedAssignmentData = {
            resident_id: actualResidentId,
            bed_id: assignedBedId,
            assigned_by: user?.id || '',
            status: 'pending' // Default status for new bed assignments
          };
          
          console.log('Creating bed assignment:', bedAssignmentData);
          await bedAssignmentsAPI.create(bedAssignmentData);
          console.log('Bed assignment created successfully');
        } catch (bedAssignmentError) {
          console.error('Error creating bed assignment:', bedAssignmentError);
          // Don't fail the entire process if bed assignment fails
          // The care plan assignment is more critical
        }
      }

      setStep(8);
    } catch (error: any) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-center max-w-5xl mx-auto">
            {steps.map((label, idx) => (
              <div key={label} className="text-center flex-1 relative">
                <div className={`
                  w-14 h-14 rounded-full inline-flex items-center justify-center font-bold text-lg mb-4 transition-all duration-300 shadow-md
                  ${idx + 1 === step
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : idx + 1 < step
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }
                `}>
                  {idx + 1 < step ? '✓' : idx + 1}
                </div>

                <div className={`
                  text-sm font-semibold leading-tight min-h-[2.5rem] flex items-center justify-center px-1
                  ${idx + 1 === step
                    ? 'text-indigo-600'
                    : idx + 1 < step
                      ? 'text-emerald-600'
                      : 'text-gray-500'
                  }
                `}>
                  {label}
                </div>

                {idx < steps.length - 1 && (
                  <div className={`
                    absolute top-7 left-full w-full h-0.5 transform -translate-y-1/2 z-0
                    ${idx + 1 < step ? 'bg-emerald-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/services')}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn người thụ hưởng
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Chọn người thân cần đăng ký dịch vụ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
                {error}
              </div>
            )}

            {isInitialLoading ? (
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-12 mb-8 shadow-lg border border-white/20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-700">
                    Đang tải dữ liệu...
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Vui lòng chờ trong giây lát để hệ thống tải xong tất cả dữ liệu cần thiết.
                  </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${residents.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Danh sách người thụ hưởng</span>
                        </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${carePlans.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Gói dịch vụ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${!loadingServiceStatus ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Trạng thái dịch vụ</span>
                      </div>
                    </div>
                </div>
              </div>
            ) : (
              <>
                {!residentId && (
                  <>
                    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-md border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tìm kiếm
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm theo tên..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 text-sm bg-white"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sắp xếp
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm bg-white"
                      >
                        <option value="name">Sắp xếp theo tên</option>
                        <option value="age">Sắp xếp theo tuổi</option>
                        <option value="gender">Sắp xếp theo giới tính</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-600 m-0 font-semibold">
                      Hiển thị: {paginatedResidents.length} trong tổng số {filteredAndSortedResidents.length} người thụ hưởng
                          {(() => {
                            if (loadingServiceStatus) {
                              return ' (Đang kiểm tra trạng thái dịch vụ...)';
                            }
                            
                        const unregisteredCount = filteredAndSortedResidents.filter(r => {
                          const serviceStatus = residentServiceStatus[r._id || r.id];
                          return serviceStatus && !serviceStatus.hasActiveService && !serviceStatus.hasPendingService;
                        }).length;

                        if (unregisteredCount > 0) {
                          return ` (${unregisteredCount} chưa đăng ký gói dịch vụ)`;
                        }
                        return '';
                      })()}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20">
                  <div className="p-6">
                        {loadingServiceStatus ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">
                          Đang kiểm tra trạng thái dịch vụ...
                        </h3>
                        <p className="m-0 text-sm text-gray-500">
                          Vui lòng chờ trong giây lát.
                        </p>
                      </div>
                    ) : residents.length === 0 ? (
                      <div className="text-center py-12">
                        <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">
                          Không có người thụ hưởng
                        </h3>
                        <p className="m-0 text-sm text-gray-500">
                          Vui lòng liên hệ quản trị viên để thêm người thụ hưởng.
                        </p>
                      </div>
                    ) : filteredAndSortedResidents.length === 0 ? (
                      <div className="text-center py-12">
                        {searchTerm ? (
                          <>
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">
                              Không tìm thấy kết quả
                            </h3>
                            <p className="m-0 text-sm text-gray-500">
                              Thử thay đổi từ khóa tìm kiếm.
                            </p>
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">
                              Tất cả người thụ hưởng đã có dịch vụ
                            </h3>
                            <p className="m-0 text-sm text-gray-500">
                              Không có người thụ hưởng nào chưa đăng ký dịch vụ hoặc đang chờ duyệt.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {paginatedResidents.map((r) => (
                            <label
                              key={r._id || r.id}
                              className={`
                                group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md block w-full
                                ${selectedResidentId === (r._id || r.id)
                                  ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                  : 'border-gray-200 bg-white hover:border-indigo-300'
                                }
                              `}
                              style={{ minHeight: '60px' }}
                            >
                              <input
                                type="radio"
                                name="resident"
                                checked={selectedResidentId === (r._id || r.id)}
                                onChange={() => setSelectedResidentId(r._id || r.id)}
                                className="sr-only"
                              />

                              <div className="flex items-center gap-3 w-full">

                                <div className="relative">
                                  {isValidAvatarUrl(r.avatar) ? (
                                    <img
                                      src={r.avatar.startsWith('data:') ? r.avatar : r.avatar}
                                      alt={r.full_name || r.name || 'Avatar'}
                                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-md"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                      onLoad={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.nextElementSibling?.classList.add('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${isValidAvatarUrl(r.avatar) ? 'hidden' : ''}`}>
                                    <UserIcon className="w-6 h-6 text-gray-500" />
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold text-gray-900 text-base truncate">{r.full_name || r.name}</div>
                                        {(() => {
                                      const residentId = r._id || r.id;
                                      const serviceStatus = residentServiceStatus[residentId];

                                          // Show status immediately when available
                                          if (serviceStatus) {
                                      if (!serviceStatus.hasActiveService && !serviceStatus.hasPendingService) {
                                        return (
                                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                            Chưa đăng ký gói dịch vụ
                                          </span>
                                        );
                                      } else if (serviceStatus.hasPendingService) {
                                        return (
                                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                            Đang chờ duyệt
                                          </span>
                                        );
                                            } else {
                                              // Has active service - should not be shown in final list
                                              return null;
                                            }
                                          }
                                          
                                          // Show loading indicator while status is being fetched
                                          if (loadingServiceStatus) {
                                            return (
                                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                                Đang kiểm tra...
                                              </span>
                                            );
                                          }
                                          
                                      return null;
                                    })()}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                    {r.date_of_birth && (
                                      <div className="flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                        <span>{new Date(r.date_of_birth).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                    )}
                                    {r.gender && (
                                      <div className="flex items-center gap-1">
                                        <UserIcon className="w-3 h-3 flex-shrink-0" />
                                        <span>{r.gender === 'male' ? 'Nam' : r.gender === 'female' ? 'Nữ' : r.gender}</span>
                                      </div>
                                    )}
                                    {r.age && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                                        {r.age} tuổi
                                      </span>
                                    )}
                                  </div>

                                  {r.phone && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                      <PhoneIcon className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{r.phone}</span>
                                    </div>
                                  )}

                                      {(() => {
                                    const residentId = r._id || r.id;
                                    const serviceStatus = residentServiceStatus[residentId];
                                    if (serviceStatus?.hasPendingService) {
                                      return (
                                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                          <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                          <span>Đang chờ phê duyệt</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>

                                <div className={`
                                   w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                   ${selectedResidentId === (r._id || r.id)
                                    ? 'border-indigo-500 bg-indigo-500'
                                    : 'border-gray-300 group-hover:border-indigo-300'
                                  }
                                 `}>
                                  {selectedResidentId === (r._id || r.id) && (
                                    <CheckCircleIcon className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>

                        {totalPages > 1 && (
                          <div className="mt-6 flex justify-center">
                            <nav className="flex items-center gap-2">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                Trước
                              </button>

                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`
                                    px-4 py-2 text-sm border rounded-lg transition-colors
                                    ${currentPage === page
                                      ? 'bg-indigo-500 text-white border-indigo-500'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }
                                  `}
                                >
                                  {page}
                                </button>
                              ))}

                              <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                Sau
                              </button>
                            </nav>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => router.push('/services')}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Hủy
              </button>
              <button
                disabled={!isNewResidentFlow && !residentId && !selectedResidentId}
                onClick={() => setStep(2)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${(!isNewResidentFlow && !residentId && !selectedResidentId)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <GiftIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn gói dịch vụ
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Chọn 1 gói chính và các gói bổ sung (nếu cần)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
                {error}
              </div>
            )}

            {(() => {
              const finalResidentId = residentId || selectedResidentId;
              const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
              const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;

              if (isReRegistering) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-800 mb-2">
                          Đăng ký lại dịch vụ
                        </h3>
                        <p className="text-amber-700 mb-3">
                          Người thụ hưởng này đã có dịch vụ hết hạn vào ngày{' '}
                          <span className="font-semibold">
                            {residentAssignmentStatus?.endDate ? new Date(residentAssignmentStatus.endDate).toLocaleDateString('vi-VN') : 'không xác định'}
                          </span>.
                          Khi đăng ký gói dịch vụ mới, gói cũ sẽ được tự động xóa bỏ.
                        </p>
                        <div className="bg-amber-100 rounded-lg p-3">
                          <p className="text-sm text-amber-800 m-0">
                            <strong>Lưu ý:</strong> Việc đăng ký lại sẽ tạo ra một gói dịch vụ mới hoàn toàn với thời hạn và điều khoản mới.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm gói dịch vụ theo tên, mô tả hoặc từ khóa..."
                  value={packageSearchTerm}
                  onChange={(e) => {
                    setPackageSearchTerm(e.target.value);
                    setPackageCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400"
                />
                {packageSearchTerm && (
                  <button
                    onClick={() => {
                      setPackageSearchTerm('');
                      setPackageCurrentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-indigo-700">
                        {paginatedMainPlans.length} gói chính
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-emerald-700">
                        {paginatedSupplementaryPlans.length} gói bổ sung
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 m-0">
                      Tổng cộng: <span className="font-bold text-indigo-600">{filteredAndSortedMainPlans.length + filteredAndSortedSupplementaryPlans.length}</span> gói
                    </p>
                    {packageSearchTerm && (
                      <p className="text-xs text-gray-500 m-0 mt-1">
                        Kết quả cho: "{packageSearchTerm}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white m-0">Gói chính</h2>
                <p className="text-indigo-100 text-sm mt-1 m-0">Chọn 1 gói dịch vụ chính</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm m-0">Đang tải gói dịch vụ...</p>
                  </div>
                ) : mainPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <GiftIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có gói chính khả dụng</h3>
                    <p className="text-sm text-gray-500 m-0">Vui lòng liên hệ quản trị viên để thêm gói dịch vụ.</p>
                  </div>
                ) : filteredAndSortedMainPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Không tìm thấy gói chính</h3>
                    <p className="text-sm text-gray-500 m-0">Thử thay đổi từ khóa tìm kiếm.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedMainPlans.map((plan) => (
                        <label
                          key={plan._id}
                          className={`
                          group relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm block w-full
                          ${mainPackageId === plan._id
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-indigo-300'
                            }
                        `}
                          style={{ minHeight: '60px' }}
                        >
                          <input
                            type="radio"
                            name="mainPlan"
                            checked={mainPackageId === plan._id}
                            onChange={() => setMainPackageId(plan._id)}
                            className="sr-only"
                          />

                          <div className="flex items-center gap-3 w-full">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <GiftIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                                <div className="text-indigo-600 font-bold text-base">
                                  {formatDisplayCurrency(plan.monthly_price)} /tháng
                                </div>
                              </div>
                              <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                            </div>

                            <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${mainPackageId === plan._id
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-gray-300 group-hover:border-indigo-300'
                              }
                          `}>
                              {mainPackageId === plan._id && (
                                <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {totalMainPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <nav className="flex items-center gap-2">
                          <button
                            onClick={() => setPackageCurrentPage(Math.max(1, packageCurrentPage - 1))}
                            disabled={packageCurrentPage === 1}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            Trước
                          </button>

                          {Array.from({ length: totalMainPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setPackageCurrentPage(page)}
                              className={`
                              px-4 py-2 text-sm border rounded-lg transition-colors
                              ${packageCurrentPage === page
                                  ? 'bg-indigo-500 text-white border-indigo-500'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }
                            `}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            onClick={() => setPackageCurrentPage(Math.min(totalMainPages, packageCurrentPage + 1))}
                            disabled={packageCurrentPage === totalMainPages}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            Sau
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20 mb-6">
              <div className={`px-6 py-4 ${mainPackageId ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-100'}`}>
                <h2 className={`text-xl font-bold m-0 ${mainPackageId ? 'text-white' : 'text-gray-700'}`}>Gói bổ sung (tuỳ chọn)</h2>
                <p className={`text-sm mt-1 m-0 ${mainPackageId ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {mainPackageId ? 'Chọn các gói dịch vụ bổ sung' : 'Vui lòng chọn gói chính trước'}
                </p>
              </div>
              <div className={`p-6 ${mainPackageId ? 'opacity-100' : 'opacity-60'}`}>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm m-0">Đang tải gói bổ sung...</p>
                  </div>
                ) : filteredAndSortedSupplementaryPlans.length === 0 ? (
                  <div className="text-center py-8">
                    {packageSearchTerm ? (
                      <>
                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Không tìm thấy gói bổ sung</h3>
                        <p className="text-sm text-gray-500 m-0">Thử thay đổi từ khóa tìm kiếm.</p>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có gói bổ sung khả dụng</h3>
                        <p className="text-sm text-gray-500 m-0">Tất cả gói dịch vụ đã được bao gồm trong gói chính.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedSupplementaryPlans.map((plan) => (
                        <label
                          key={plan._id}
                          className={`
                          group relative border rounded-lg p-3 transition-all duration-200 hover:shadow-sm block w-full
                          ${mainPackageId ? 'cursor-pointer' : 'cursor-not-allowed'}
                          ${supplementaryIds.includes(plan._id)
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-emerald-300'
                            }
                        `}
                          style={{ minHeight: '60px' }}
                        >
                          <input
                            type="checkbox"
                            checked={supplementaryIds.includes(plan._id)}
                            onChange={() => mainPackageId && toggleSupplementary(plan._id)}
                            disabled={!mainPackageId}
                            className="sr-only"
                          />

                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${supplementaryIds.includes(plan._id)
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                              : 'bg-gray-200'
                              }`}>
                              <PlusIcon className={`w-4 h-4 ${supplementaryIds.includes(plan._id) ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                                <div className="text-emerald-600 font-bold text-base">
                                  {formatDisplayCurrency(plan.monthly_price)} /tháng
                                </div>
                              </div>
                              <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                            </div>

                            <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${supplementaryIds.includes(plan._id)
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-gray-300 group-hover:border-emerald-300'
                              }
                          `}>
                              {supplementaryIds.includes(plan._id) && (
                                <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {totalSupplementaryPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <nav className="flex items-center gap-2">
                          <button
                            onClick={() => setPackageCurrentPage(Math.max(1, packageCurrentPage - 1))}
                            disabled={packageCurrentPage === 1}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            Trước
                          </button>

                          {Array.from({ length: totalSupplementaryPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setPackageCurrentPage(page)}
                              className={`
                              px-4 py-2 text-sm border rounded-lg transition-colors
                              ${packageCurrentPage === page
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }
                            `}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            onClick={() => setPackageCurrentPage(Math.min(totalSupplementaryPages, packageCurrentPage + 1))}
                            disabled={packageCurrentPage === totalSupplementaryPages}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            Sau
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!mainPackageId}
                onClick={() => setStep(3)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${!mainPackageId
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
          </div>
        )}


        {step === 3 && (
          <div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn loại phòng
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Lựa chọn loại phòng phù hợp với nhu cầu
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Re-registration options */}
            {(() => {
              const finalResidentId = residentId || selectedResidentId;
              const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
              const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;
              
              if (isReRegistering && existingRoomInfo && existingBedInfo) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-800 mb-3">
                          Tùy chọn phòng và giường
                        </h3>
                        <p className="text-amber-700 mb-4">
                          Bạn có thể giữ lại phòng và giường cũ hoặc chọn phòng và giường mới.
                        </p>
                        
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="roomBedOption"
                              checked={keepExistingRoomBed}
                              onChange={() => setKeepExistingRoomBed(true)}
                              className="w-4 h-4 text-amber-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-amber-800">
                                Giữ lại phòng và giường cũ
                              </div>
                              <div className="text-sm text-amber-600">
                                Phòng {existingRoomInfo.room_number} - Giường {existingBedInfo.bed_number}
                              </div>
                            </div>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="roomBedOption"
                              checked={!keepExistingRoomBed}
                              onChange={() => setKeepExistingRoomBed(false)}
                              className="w-4 h-4 text-amber-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-amber-800">
                                Chọn phòng và giường mới
                              </div>
                              <div className="text-sm text-amber-600">
                                Thay thế phòng và giường hiện tại
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}


            {/* Room type selection - only show if not keeping existing room/bed */}
            {!keepExistingRoomBed && (
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại phòng
                </label>
                <select
                  value={roomType}
                  onChange={e => { setRoomType(e.target.value); setSelectedRoomId(''); setSelectedBedId(''); }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                >
                  <option value=''>-- Chọn loại phòng --</option>
                  {roomTypes.map(rt => (
                    <option key={rt._id} value={rt.room_type}>
                      {(rt.type_name || rt.room_type)} - {formatDisplayCurrency(rt.monthly_price || 0)}/tháng
                    </option>
                  ))}
                </select>
              </div>

              {/* Room-type list view */}
              {roomTypes && roomTypes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {roomTypes.map((rt: any, idx: number) => {
                    const active = roomType === rt.room_type;
                    return (
                      <label
                        key={rt._id}
                        className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${
                          active
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : `border-gray-200 hover:border-indigo-300 border-l-4 ${
                                ['bg-white','bg-slate-50','bg-purple-50/40'][idx % 3]
                              } ${
                                ['border-l-indigo-200','border-l-rose-200','border-l-emerald-200'][idx % 3]
                              }`
                        }`}
                      >
                        <input
                          type="radio"
                          name="roomTypeList"
                          checked={active}
                          onChange={() => { setRoomType(rt.room_type); setSelectedRoomId(''); setSelectedBedId(''); }}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 w-full">
                          {/* Info (left) */}
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold text-gray-900 truncate">{rt.type_name || rt.room_type}</div>
                            {rt.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rt.description}</p>
                            )}
                          </div>
                          {/* Price (fixed width, right aligned) */}
                          <div className="text-right flex-shrink-0 w-44">
                            <div className="text-xs text-gray-500">Giá/tháng</div>
                            <div className="font-bold text-indigo-600 whitespace-nowrap">{formatDisplayCurrency(rt.monthly_price || 0)}</div>
                          </div>
                          {/* Radio indicator */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                            {active && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {roomType && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  {(() => {
                    const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                    const residentGender = (pendingResident?.gender) || selectedResident?.gender;

                    if (loadingRooms) {
                      return (
                        <div className="text-sm text-indigo-600 m-0 font-medium">Đang tải danh sách phòng...</div>
                      );
                    }

                    const availableRooms = rooms.filter(r => {
                      if (r.room_type !== roomType || r.status !== 'available') {
                        return false;
                      }

                      if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                        return false;
                      }

                      const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                      return availableBedsInRoom.length > 0;
                    });

                    const totalAvailableBeds = availableRooms.reduce((total, room) => {
                      return total + getBedsForRoom(room._id, residentGender).length;
                    }, 0);

                    const genderText = residentGender === 'male' ? 'nam' : residentGender === 'female' ? 'nữ' : 'tất cả';

                    return (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-indigo-600 m-0 font-medium">
                          Có <span className="font-semibold">{availableRooms.length}</span> phòng trống cho {genderText} với <span className="font-semibold">{totalAvailableBeds}</span> giường trống.
                        </p>
    
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            )}

            {/* Show existing room/bed info if keeping them */}
            {keepExistingRoomBed && existingRoomInfo && existingBedInfo && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Giữ lại phòng và giường cũ
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/80 rounded-lg p-4 border border-green-200">
                        <div className="text-sm text-green-600 mb-1">Phòng</div>
                        <div className="font-semibold text-green-800">
                          Phòng {existingRoomInfo.room_number} 
                        </div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-green-200">
                        <div className="text-sm text-green-600 mb-1">Giường</div>
                        <div className="font-semibold text-green-800">
                          Giường {existingBedInfo.bed_number}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!keepExistingRoomBed && !roomType}
                onClick={() => keepExistingRoomBed ? setStep(6) : setStep(4)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${(!keepExistingRoomBed && !roomType)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                {keepExistingRoomBed ? 'Tiếp tục' : 'Tiếp tục'}
              </button>
            </div>
          </div>
        )}


        {step === 4 && !keepExistingRoomBed && (
          <div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn phòng cụ thể
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Lựa chọn phòng phù hợp trong loại đã chọn
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phòng
                </label>
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                >
                  <option value=''>-- Chọn phòng --</option>
                  {(() => {
                    return rooms.filter(r => {
                      if (r.room_type !== roomType || r.status !== 'available') {
                        return false;
                      }

                      if (residentGenderForFilter && r.gender && residentGenderForFilter.toLowerCase() !== r.gender.toLowerCase()) {
                        return false;
                      }

                      const availableBedsInRoom = getBedsForRoom(r._id, residentGenderForFilter);
                      return availableBedsInRoom.length > 0;
                    }).map(room => {
                      const availableBedsCount = getBedsForRoom(room._id, residentGenderForFilter).length;
                      const genderText = room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác';
                      return (
                        <option key={room._id} value={room._id}>
                          Phòng {room.room_number} ({genderText}) - {availableBedsCount} giường trống
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              {(() => {
                const availableRooms = rooms.filter(r => {
                  if (r.room_type !== roomType || r.status !== 'available') {
                    return false;
                  }

                  if (residentGenderForFilter && r.gender && residentGenderForFilter.toLowerCase() !== r.gender.toLowerCase()) {
                    return false;
                  }

                  const availableBedsInRoom = getBedsForRoom(r._id, residentGenderForFilter);
                  return availableBedsInRoom.length > 0;
                });

                if (loadingRooms) {
                  return (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                      <p className="text-sm text-indigo-600 m-0 font-medium">Đang tải danh sách phòng...</p>
                    </div>
                  );
                }

                if (availableRooms.length === 0) {
                  const genderText = residentGenderForFilter === 'male' ? 'nam' : residentGenderForFilter === 'female' ? 'nữ' : '';
                  return (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <p className="text-sm text-yellow-700 m-0 font-medium">
                        Không có phòng nào có giường trống cho {genderText} trong loại phòng này
                      </p>
                    </div>
                  );
                }

                  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                const availableBedsCountSelected = selectedRoom ? getBedsForRoom(selectedRoomId, residentGenderForFilter).length : 0;
                const genderTextSelected = selectedRoom?.gender === 'male' ? 'Nam' : selectedRoom?.gender === 'female' ? 'Nữ' : 'Khác';

                  return (
                  <div>
                    {selectedRoom && (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                      <p className="text-sm text-indigo-600 m-0 font-medium">
                          Đã chọn: <span className="font-semibold">Phòng {selectedRoom?.room_number} ({genderTextSelected})</span>
                          <span className="text-indigo-500 ml-2">({availableBedsCountSelected} giường trống)</span>
                      </p>
                    </div>
                    )}

                    <div className="space-y-2">
                      {availableRooms.map((room, idx: number) => {
                        const availableBedsCount = getBedsForRoom(room._id, residentGenderForFilter).length;
                        const roomTypeObj = roomTypes.find(rt => rt.room_type === room.room_type);
                        const monthlyPrice = roomTypeObj?.monthly_price || 0;
                        const genderBadge = room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác';
                        const active = selectedRoomId === room._id;
                        return (
                          <label
                            key={room._id}
                            className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${
                              active
                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                : `border-gray-200 hover:border-indigo-300 border-l-4 ${
                                    ['bg-white','bg-slate-50','bg-purple-50/40'][idx % 3]
                                  } ${
                                    ['border-l-indigo-200','border-l-rose-200','border-l-emerald-200'][idx % 3]
                                  }`
                            }`}
                          >
                            <input
                              type="radio"
                              name="roomList"
                              checked={active}
                              onChange={() => { setSelectedRoomId(room._id); setSelectedBedId(''); }}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3 w-full">
                              {/* Info (left) */}
                              <div className="min-w-0 flex-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                  <div className="text-xs">
                                    <div className="text-gray-500">Phòng</div>
                                    <div className="font-semibold text-gray-900 text-sm">{room.room_number}</div>
                              </div>
                                  <div className="text-xs">
                                    <div className="text-gray-500">Phòng dành cho</div>
                                    <div className="font-medium text-gray-900">{genderBadge}</div>
                              </div>
                                  <div className="text-xs">
                                    <div className="text-gray-500">Tầng</div>
                                    <div className="font-medium text-gray-900">{room.floor}</div>
                            </div>
                                  <div className="text-xs">
                                    <div className="text-gray-500">Loại phòng</div>
                                    <div className="font-medium text-gray-900 truncate">{roomTypeObj?.type_name || room.room_type}</div>
                            </div>
                                  <div className="text-xs">
                                    <div className="text-gray-500">Giường trống</div>
                                    <div className="font-semibold text-emerald-700">{availableBedsCount} giường</div>
                                  </div>
                                </div>
                              </div>
                              {/* Price (fixed width, right aligned) */}
                              <div className="text-right flex-shrink-0 w-44">
                                <div className="text-xs text-gray-500">Giá/tháng</div>
                                <div className="font-bold text-indigo-600 whitespace-nowrap">{formatDisplayCurrency(monthlyPrice)}</div>
                              </div>
                              {/* Radio indicator */}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                                {active && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {selectedRoom && (() => {
                      const typeObj = roomTypes.find(rt => rt.room_type === selectedRoom.room_type);
                      const infoItems = [
                        {
                          label: "Số phòng",
                          value: selectedRoom.room_number,
                          icon: (
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <rect x="4" y="4" width="16" height="16" rx="2" />
                              <path d="M9 9h6v6H9z" />
                            </svg>
                          ),
                        },
                        {
                          label: "Loại phòng",
                          value: typeObj?.type_name || selectedRoom.room_type,
                          icon: (
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M3 7h18M3 12h18M3 17h18" />
                            </svg>
                          ),
                        },
                        {
                          label: "Phòng dành cho",
                          value: selectedRoom.gender === 'male' ? 'Nam' : selectedRoom.gender === 'female' ? 'Nữ' : 'Khác',
                          icon: (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <circle cx="12" cy="8" r="4" />
                              <path d="M6 20v-2a4 4 0 018 0v2" />
                            </svg>
                          ),
                        },
                        {
                          label: "Tầng",
                          value: selectedRoom.floor,
                          icon: (
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <rect x="4" y="10" width="16" height="10" rx="2" />
                              <path d="M12 2v8" />
                            </svg>
                          ),
                        },
                        {
                          label: "Số giường trống",
                          value: `${selectedRoom.bed_count} giường`,
                          icon: (
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <rect x="3" y="10" width="18" height="7" rx="2" />
                              <path d="M21 17v2M3 17v2" />
                            </svg>
                          ),
                        },
                        {
                          label: "Giá phòng",
                          value: (
                            <span className="font-bold text-indigo-600">
                              {formatDisplayCurrency(typeObj?.monthly_price || 0)} <span className="font-normal text-gray-500 text-sm">/tháng</span>
                            </span>
                          ),
                          icon: (
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
                            </svg>
                          ),
                        },
                      ];
                      return (
                        <div className="mt-8 bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg border border-indigo-100">
                          <h2 className="text-xl font-bold text-indigo-700 mb-6">Chi tiết thông tin phòng</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {infoItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                                <div className="flex-shrink-0">{item.icon}</div>
                                <div>
                                  <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                                  <div className={`text-base font-semibold text-gray-900 ${item.label === "Giá phòng" ? "font-bold" : ""}`}>
                                    {item.value}
                            </div>
                            </div>
                            </div>
                            ))}
                          </div>
                          {typeObj?.description && (
                            <div className="mt-8 bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path d="M13 16h-1v-4h-1m1-4h.01" />
                                  <circle cx="12" cy="12" r="10" />
                                </svg>
                                <span className="text-sm text-indigo-700 font-semibold">Mô tả phòng</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed text-sm">{typeObj.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>


            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              {(() => {
                const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                const residentGender = (pendingResident?.gender) || selectedResident?.gender;
                const availableRooms = rooms.filter(r => {
                  if (r.room_type !== roomType || r.status !== 'available') {
                    return false;
                  }
                  if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                    return false;
                  }
                  const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                  return availableBedsInRoom.length > 0;
                });

                const hasAvailableRooms = availableRooms.length > 0;

                return (
                  <button
                    disabled={!selectedRoomId || !hasAvailableRooms}
                    onClick={() => keepExistingRoomBed ? setStep(6) : setStep(5)}
                    className={`
                      px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                      ${(!selectedRoomId || !hasAvailableRooms)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                      }
                    `}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {keepExistingRoomBed ? 'Bỏ qua chọn giường' : (!hasAvailableRooms ? 'Không có phòng trống' : 'Tiếp tục')}
                  </button>
                );
              })()}
            </div>
          </div>
        )}


        {step === 5 && !keepExistingRoomBed && (
          <div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(4)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn giường
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Lựa chọn giường cụ thể trong phòng đã chọn
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giường
                </label>
                <select
                  value={selectedBedId}
                  onChange={e => setSelectedBedId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                >
                  <option value=''>-- Chọn giường --</option>
                  {(() => {
                    const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                    const residentGender = (pendingResident?.gender) || selectedResident?.gender;

                    return getBedsForRoom(selectedRoomId, residentGender).map(bed => {
                      const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                      const roomNumber = selectedRoom?.room_number;
                      return (
                        <option key={bed._id} value={bed._id}>
                          {formatBedName(bed, roomNumber)}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              {(() => {
                const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                const residentGender = (pendingResident?.gender) || selectedResident?.gender;

                const beds = getBedsForRoom(selectedRoomId, residentGender);
                    const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                const roomNumber = selectedRoom?.room_number;

                    return (
                  <div>
                    

                    <div className="text-sm font-semibold text-gray-700 mb-2">Danh sách giường trống</div>
                    <div className="space-y-2">
                      {beds.map((b, idx: number) => {
                        const isSelected = selectedBedId === b._id;
                        const statusBadge = b.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.status === 'occupied'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700';
                        const createdAt = b.created_at ? new Date(b.created_at).toLocaleString('vi-VN') : '-';
                        const updatedAt = b.updated_at ? new Date(b.updated_at).toLocaleString('vi-VN') : '-';
                return (
                          <label
                            key={b._id}
                            className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                : `border-gray-200 hover:border-emerald-300 border-l-4 ${['bg-white','bg-slate-50','bg-green-50/40'][idx % 3]} ${['border-l-emerald-200','border-l-indigo-200','border-l-amber-200'][idx % 3]}`
                            }`}
                          >
                            <input
                              type="radio"
                              name="bedList"
                              checked={isSelected}
                              onChange={() => setSelectedBedId(b._id)}
                              className="sr-only"
                            />

                            <div className="flex items-center gap-3 w-full">
                              <div className="min-w-0 flex-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
                                  <div className="text-xs">
                                    <div className="text-gray-500">Giường</div>
                                    <div className="font-semibold text-gray-900 text-sm">{formatBedName(b, roomNumber)}</div>
                                  </div>
                                  <div className="text-xs">
                                    <div className="text-gray-500">Loại giường</div>
                                    <div className="font-medium text-gray-900">{b.bed_type}</div>
                                  </div>
                                  <div className="text-xs">
                                    <div className="text-gray-500">Trạng thái</div>
                                    <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                                      {b.status === 'available'
                                        ? 'Còn trống'
                                        : b.status === 'occupied'
                                          ? 'Đã có người'
                                          : b.status === 'maintenance'
                                            ? 'Bảo trì'
                                            : 'Không rõ'}
                                    </div>
                                  </div>
                                 
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 group-hover:border-emerald-300'}`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!selectedBedId}
                onClick={() => setStep(6)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${!selectedBedId
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(5)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Thông tin bổ sung
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Cung cấp thêm thông tin đăng ký
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Thông tin đăng ký
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thời gian đăng ký:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="1"
                        checked={registrationPeriod === '1'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${registrationPeriod === '1'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${registrationPeriod === '1'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                            }`}>
                            {registrationPeriod === '1' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">1 tháng</div>
                            <div className="text-sm text-gray-500">Đăng ký ngắn hạn</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="3"
                        checked={registrationPeriod === '3'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${registrationPeriod === '3'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${registrationPeriod === '3'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                            }`}>
                            {registrationPeriod === '3' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">3 tháng</div>
                            <div className="text-sm text-gray-500">Đăng ký quý</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="6"
                        checked={registrationPeriod === '6'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${registrationPeriod === '6'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${registrationPeriod === '6'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                            }`}>
                            {registrationPeriod === '6' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">6 tháng</div>
                            <div className="text-sm text-gray-500">Đăng ký nửa năm</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="12"
                        checked={registrationPeriod === '12'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${registrationPeriod === '12'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${registrationPeriod === '12'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                            }`}>
                            {registrationPeriod === '12' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">1 năm</div>
                            <div className="text-sm text-gray-500">Đăng ký trọn năm</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="custom"
                        checked={registrationPeriod === 'custom'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${registrationPeriod === 'custom'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${registrationPeriod === 'custom'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                            }`}>
                            {registrationPeriod === 'custom' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Tùy chỉnh</div>
                            <div className="text-sm text-gray-500">Chọn thời gian riêng</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                  <DatePicker
                    selected={startDate ? new Date(startDate) : null}
                    onChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                    dateFormat="dd/MM/yyyy"
                    minDate={startDate ? new Date(startDate) : new Date()}
                    placeholderText="Chọn ngày bắt đầu"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc:</label>
                  {registrationPeriod === 'custom' ? (
                    <div>
                      <DatePicker
                        selected={endDate ? new Date(endDate) : null}
                        onChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="dd/MM/yyyy"
                        minDate={startDate ? new Date(startDate) : new Date()}
                        placeholderText="Chọn ngày kết thúc"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Chọn ngày kết thúc cho thời gian đăng ký tùy chỉnh
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          value={endDate ? new Date(endDate).toLocaleDateString('vi-VN') : ''}
                          readOnly
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                          placeholder="Sẽ tự động tính dựa trên ngày bắt đầu"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Tự động tính: {registrationPeriod} tháng từ ngày bắt đầu
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú y tế (tùy chọn):</label>
                  <textarea
                    value={medicalNotes}
                    onChange={e => setMedicalNotes(e.target.value)}
                    placeholder="Nhập thông tin y tế, yêu cầu đặc biệt hoặc ghi chú khác..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-vertical"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(5)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!startDate || (registrationPeriod === 'custom' && !endDate)}
                onClick={() => setStep(7)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${(!startDate || (registrationPeriod === 'custom' && !endDate))
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(6)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Xem lại & xác nhận
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Kiểm tra thông tin trước khi hoàn tất đăng ký
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const finalResidentId = residentId || selectedResidentId;
              const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
              const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;

              if (isReRegistering) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-800 mb-2">
                          ⚠️ Đăng ký lại dịch vụ
                        </h3>
                        <p className="text-amber-700 mb-3">
                          Bạn đang đăng ký lại dịch vụ cho người thụ hưởng có dịch vụ hết hạn vào ngày{' '}
                          <span className="font-semibold">
                            {residentAssignmentStatus?.endDate ? new Date(residentAssignmentStatus.endDate).toLocaleDateString('vi-VN') : 'không xác định'}
                          </span>.
                        </p>
                        <div className="bg-amber-100 rounded-lg p-3">
                          <p className="text-sm text-amber-800 m-0">
                            <strong>Xác nhận:</strong> Gói dịch vụ cũ sẽ được tự động xóa bỏ và thay thế bằng gói dịch vụ mới này.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Thông tin đăng ký
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Người thụ hưởng</div>
                      <div className="font-semibold text-gray-900">{isNewResidentFlow
                        ? (pendingResident?.full_name || 'Chưa chọn')
                        : (residents.find(r => r._id === (residentId || selectedResidentId))?.full_name || residents.find(r => r._id === (residentId || selectedResidentId))?.name || 'Chưa chọn')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <GiftIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Gói chính</div>
                      <div className="font-semibold text-gray-900">{mainPlans.find(p => p._id === mainPackageId)?.plan_name}</div>
                    </div>
                  </div>

                  {supplementaryIds.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <PlusIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 font-medium">Gói bổ sung ({supplementaryIds.length})</div>
                          <div className="font-semibold text-gray-900">
                            {supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).length > 2
                              ? `${supplementaryPlans.filter(p => supplementaryIds.includes(p._id))[0].plan_name} +${supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).length - 1} gói khác`
                              : supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).map(p => p.plan_name).join(', ')
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => setShowSupplementaryDetails(!showSupplementaryDetails)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className={`w-5 h-5 transform transition-transform ${showSupplementaryDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>


                      {showSupplementaryDetails && (
                        <div className="ml-11 space-y-2">
                          {supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).map((plan, index) => (
                            <div key={plan._id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">{plan.plan_name}</div>
                                <div className="text-xs text-gray-500">{plan.description}</div>
                              </div>
                              <div className="text-sm font-semibold text-blue-700">
                                {formatDisplayCurrency(plan.monthly_price || 0)} /tháng
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Phòng</div>
                      <div className="font-semibold text-gray-900">
                        {keepExistingRoomBed && existingRoomInfo 
                          ? `Phòng ${existingRoomInfo.room_number}`
                          : rooms.find(r => r._id === selectedRoomId)?.room_number || 'Chưa chọn'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Giường</div>
                      <div className="font-semibold text-gray-900">
                        {keepExistingRoomBed && existingBedInfo 
                          ? `Giường ${existingBedInfo.bed_number}`
                          : (() => {
                        let selectedBed = beds.find(b => b._id === selectedBedId);

                        if (!selectedBed && selectedRoomId) {
                          const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                          if (selectedRoom?.bed_info) {
                            const bedNumber = selectedBedId.split('_bed_')[1];
                            if (bedNumber) {
                              selectedBed = {
                                _id: selectedBedId,
                                bed_number: parseInt(bedNumber),
                                room_id: selectedRoomId,
                                room_number: selectedRoom.room_number,
                                status: 'available'
                              };
                            }
                          }
                        }

                        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                        return selectedBed ? formatBedName(selectedBed, selectedRoom?.room_number) : 'Chưa chọn';
                            })()
                        }
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 font-medium">Thời gian đăng ký</div>
                        <div className="font-semibold text-gray-900">
                          {registrationPeriod === 'custom' 
                            ? `Tùy chỉnh (${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'} - ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chưa chọn'})`
                            : `${registrationPeriod} tháng${showTimeDetails ? '' : ` (${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'} - ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chưa chọn'})`}`
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTimeDetails(!showTimeDetails)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <svg className={`w-5 h-5 transform transition-transform ${showTimeDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>


                    {showTimeDetails && (
                      <div className="ml-11 space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                            BĐ
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium">Ngày bắt đầu</div>
                            <div className="font-medium text-gray-900">{startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                            KT
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium">Ngày kết thúc</div>
                            <div className="font-medium text-gray-900">{endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</div>
                          </div>
                        </div>

                        {registrationPeriod === 'custom' && startDate && endDate && (
                          <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                              TG
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 font-medium">Thời gian đăng ký</div>
                              <div className="font-medium text-gray-900">
                                {(() => {
                                  const start = new Date(startDate);
                                  const end = new Date(endDate);
                                  const diffTime = Math.abs(end.getTime() - start.getTime());
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  const months = Math.floor(diffDays / 30);
                                  const days = diffDays % 30;
                                  
                                  if (months > 0 && days > 0) {
                                    return `${months} tháng ${days} ngày`;
                                  } else if (months > 0) {
                                    return `${months} tháng`;
                                  } else {
                                    return `${days} ngày`;
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>


              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Chi tiết thanh toán
                </h4>

                {(() => {
                  const mainPlan = mainPlans.find(p => p._id === mainPackageId);
                  const supplementaryPlansList = supplementaryPlans.filter(p => supplementaryIds.includes(p._id));

                  const mainPlanPrice = mainPlan?.monthly_price || 0;
                  const supplementaryPlansPrice = supplementaryPlansList.reduce((total, plan) => total + (plan.monthly_price || 0), 0);
                  const totalServicePrice = mainPlanPrice + supplementaryPlansPrice;

                  // Calculate room price based on whether keeping existing or selecting new
                  let roomPrice = 0;
                  if (keepExistingRoomBed && existingRoomInfo) {
                    // Use existing room type to get price
                    const existingRoomTypeObj = roomTypes.find(rt => rt.room_type === existingRoomInfo.room_type);
                    roomPrice = existingRoomTypeObj?.monthly_price || 0;
                  } else {
                    // Use selected room type to get price
                  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                  const roomTypeObj = roomTypes.find(rt => rt.room_type === selectedRoom?.room_type);
                    roomPrice = roomTypeObj?.monthly_price || 0;
                  }

                  const totalPrice = totalServicePrice + roomPrice;

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                        <span className="text-gray-700">Giá gói chính</span>
                        <span className="font-semibold text-gray-900">{formatDisplayCurrency(mainPlanPrice)} /tháng</span>
                      </div>

                      {supplementaryPlansList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-gray-700">Giá gói bổ sung ({supplementaryPlansList.length})</span>
                            <span className="font-semibold text-gray-900">{formatDisplayCurrency(supplementaryPlansPrice)} /tháng</span>
                          </div>


                          {supplementaryPlansList.map((plan, index) => (
                            <div key={plan._id} className="flex justify-between items-center py-1 px-3 bg-indigo-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                                  {index + 1}
                                </div>
                                <span className="text-sm text-gray-600">{plan.plan_name}</span>
                              </div>
                              <span className="text-sm font-medium text-indigo-700">{formatDisplayCurrency(plan.monthly_price || 0)} /tháng</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                        <span className="text-gray-700">Giá phòng</span>
                        <span className="font-semibold text-gray-900">{formatDisplayCurrency(roomPrice)} /tháng</span>
                      </div>

                      <div className="flex justify-between items-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4">
                        <span className="text-white font-bold text-lg">Tổng cộng</span>
                        <span className="text-white font-bold text-lg">{formatDisplayCurrency(totalPrice)} /tháng</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>


            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(6)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
              </button>
            </div>
          </div>
        )}


        {step === 8 && (
          <div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-emerald-500 to-green-600 bg-clip-text text-transparent tracking-tight">
                      Hoàn tất đăng ký
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Đăng ký dịch vụ đã được xử lý thành công
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-sm">
              <div className="text-center max-w-2xl mx-auto">

                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div className="absolute inset-0 w-20 h-20 border-2 border-emerald-200 rounded-full mx-auto animate-ping opacity-20"></div>
                </div>


                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                  {(() => {
                    const finalResidentId = residentId || selectedResidentId;
                    const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
                    const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;
                    return isReRegistering ? 'Đăng ký lại thành công!' : 'Đăng ký thành công!';
                  })()}
                </h2>


                <div className="text-gray-600 text-base leading-relaxed mb-6 max-w-xl mx-auto">
                  <p className="mb-2 font-medium">
                    {(() => {
                      const finalResidentId = residentId || selectedResidentId;
                      const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
                      const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;
                      return isReRegistering
                        ? 'Thông tin đăng ký lại dịch vụ đã được gửi thành công.'
                        : 'Thông tin đăng ký dịch vụ đã được gửi thành công.';
                    })()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      const finalResidentId = residentId || selectedResidentId;
                      const residentAssignmentStatus = residentsWithAssignmentStatus[finalResidentId];
                      const isReRegistering = residentAssignmentStatus?.hasAssignment && residentAssignmentStatus?.isExpired;
                      return isReRegistering
                        ? 'Gói dịch vụ cũ đã được thay thế bằng gói dịch vụ mới và lưu vào hệ thống.'
                        : 'Gói dịch vụ đã được đăng kí thành công và lưu vào hệ thống.';
                    })()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/services')}
                    className="group px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-xl font-semibold text-base cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Về trang dịch vụ
                  </button>

                  <button
                    onClick={() => router.push('/staff')}
                    className="group px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold text-base cursor-pointer hover:shadow-md hover:scale-105 hover:border-gray-300 transition-all duration-200 shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Về trang chủ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .date-picker-input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            font-size: 1rem;
          }
        `}</style>
      </div>
    </div>
  );
}

