"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import useSWR from "swr";
import {
  carePlansAPI,
  carePlanAssignmentsAPI,
  residentAPI,
  roomsAPI,
  bedsAPI,
  roomTypesAPI,
  bedAssignmentsAPI,
  serviceRequestsAPI,
  userAPI,
} from "@/lib/api";
import { CheckCircleIcon, ArrowLeftIcon, UserIcon, GiftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type DurationOption = "3" | "6" | "12" | "custom";

// Helper function to check if bed assignment is active
const isBedAssignmentActive = (assignment: any) => {
  if (!assignment) return false;
  if (!assignment.unassigned_date) return true; // null = active
  const unassignedDate = new Date(assignment.unassigned_date);
  const now = new Date();
  return unassignedDate > now; // ngày trong tương lai = active
};

export default function ChangeCarePlanPage() {
  const router = useRouter();
  const params = useParams();
  const residentId = (params?.id as string) || "";
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [mainPlanId, setMainPlanId] = useState<string>("");
  const [duration, setDuration] = useState<DurationOption | "">("");
  const [customMonths, setCustomMonths] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomType, setRoomType] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [currentEndDate, setCurrentEndDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [residentGender, setResidentGender] = useState<string>("");
  const [residentName, setResidentName] = useState<string>("");
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState<boolean>(false);
  const [pendingBedIds, setPendingBedIds] = useState<string[]>([]);
  // UI: search/sort/pagination for plans
  const [packageSearchTerm, setPackageSearchTerm] = useState<string>("");
  const [packageSortBy, setPackageSortBy] = useState<string>("price");
  const [packageCurrentPage, setPackageCurrentPage] = useState<number>(1);
  const [packageItemsPerPage] = useState<number>(6);
  const [supplementaryIds, setSupplementaryIds] = useState<string[]>([]);
  const [showSupplementaryDetails, setShowSupplementaryDetails] = useState<boolean>(false);
  const [showTimeDetails, setShowTimeDetails] = useState<boolean>(false);
  // New-period date states to mirror purchase UI
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // Additional note field
  const [additionalNote, setAdditionalNote] = useState<string>("");
  // Cache for available beds count to ensure consistency
  const [availableBedsCountCache, setAvailableBedsCountCache] = useState<Record<string, number>>({});

  // Local date helpers to avoid timezone shifts
  const formatLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const parseYMDToDate = (ymd: string | undefined | null): Date | null => {
    if (!ymd || typeof ymd !== 'string') return null;
    const parts = ymd.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const formatYMDToDisplay = (ymd: string | undefined | null) => {
    const dt = parseYMDToDate(ymd || '');
    return dt ? dt.toLocaleDateString('vi-VN') : '';
  };

  // Helpers: today (local start), first day of next month
  const todayStart = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const nextMonthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }, []);
  const nextMonthStartYMD = useMemo(() => formatLocalYMD(nextMonthStart), [nextMonthStart]);
  const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

  const isCustomMonthsInvalid = useMemo(() => {
    if (duration !== 'custom') return false;
    const n = parseInt(customMonths || '0', 10);
    return !Number.isFinite(n) || n < 3;
  }, [duration, customMonths]);

  // Compute endDate from startDate + duration/customMonths, then clamp to end of month (local)
  useEffect(() => {
    if (!startDate || !duration) {
      setEndDate("");
      return;
    }
    try {
      const start = parseYMDToDate(startDate);
      if (!start) { setEndDate(""); return; }
      let months = 0;
      if (duration === 'custom') {
        months = parseInt(customMonths || '0', 10) || 0;
      } else {
        months = parseInt(String(duration), 10) || 0;
      }
      if (months < 3) { setEndDate(""); return; }
      
      // Tính đúng: cộng thêm months - 1 tháng, sau đó lấy ngày cuối tháng
      // Ví dụ: 01/11/2025 + 3 tháng = 01/01/2026, lấy ngày cuối tháng 1 = 31/01/2026
      const temp = new Date(start);
      temp.setMonth(temp.getMonth() + months - 1);
      const endOfMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
      endOfMonth.setHours(0, 0, 0, 0);
      setEndDate(formatLocalYMD(endOfMonth));
    } catch {
      setEndDate("");
    }
  }, [startDate, duration, customMonths]);

  // Load care plans
  const { data: swrCarePlans } = useSWR("care-plans", () => carePlansAPI.getAll(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    loadingTimeout: 5000
  });
  useEffect(() => {
    if (Array.isArray(swrCarePlans)) setCarePlans(swrCarePlans);
  }, [swrCarePlans]);

  // Load rooms/room types
  const { data: swrRooms } = useSWR("rooms", () => roomsAPI.getAll(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    loadingTimeout: 5000
  });
  const { data: swrRoomTypes } = useSWR("room-types", () => roomTypesAPI.getAll(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    loadingTimeout: 5000
  });
  useEffect(() => {
    if (Array.isArray(swrRooms)) setRooms(swrRooms);
    if (Array.isArray(swrRoomTypes)) setRoomTypes(swrRoomTypes);
  }, [swrRooms, swrRoomTypes]);

  // SWR: Resident detail
  const { data: swrResident } = useSWR(
    residentId ? ["resident-detail", residentId] : null,
    () => residentAPI.getById?.(residentId),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // SWR: Bed assignments for resident
  const { data: swrBedAssignments } = useSWR(
    residentId ? ["bed-assignments", residentId] : null,
    () => bedAssignmentsAPI.getByResidentId(residentId),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Populate resident info and current end date from SWR
  useEffect(() => {
    try {
      if (swrResident) {
        const assignments = swrResident?.care_plan_assignments || swrResident?.assignments || [];
        if (swrResident?.gender) setResidentGender(swrResident.gender);
        if (swrResident?.full_name || swrResident?.name) setResidentName(swrResident.full_name || swrResident.name);
        let nearestEnd: Date | null = null;
        for (const a of assignments) {
          if (a?.end_date && (a.status === "active" || a.status === "approved" || a.status === "completed")) {
            const d = new Date(a.end_date);
            if (!nearestEnd || d > nearestEnd) nearestEnd = d;
          }
        }
        setCurrentEndDate(nearestEnd);
      }
    } catch {}
  }, [swrResident]);

  // Load user profile for emergency contact info
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await userAPI.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);


  // Fallback: if name is still empty, fetch by family member and find by residentId
  useEffect(() => {
    (async () => {
      if (residentName || !user?.id || !residentId) return;
      try {
        const list = await residentAPI.getByFamilyMemberId?.(user.id);
        const arr = Array.isArray(list) ? list : (list ? [list] : []);
        const found = arr.find((r: any) => (r?._id || r?.id) === residentId);
        if (found && (found.full_name || found.name)) {
          setResidentName(found.full_name || found.name);
        }
      } catch {}
    })();
  }, [residentName, user?.id, residentId]);

  // SWR: user profile for emergency contact
  const { data: swrUserProfile } = useSWR(
    user?.id ? ["user-profile", user.id] : null,
    () => userAPI.getById(user!.id),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  useEffect(() => { if (swrUserProfile) setUserProfile(swrUserProfile); }, [swrUserProfile]);

  const mainPlans = useMemo(() => carePlans.filter((p) => p?.category === "main" && p?.is_active !== false), [carePlans]);
  const supplementaryPlans = useMemo(() => carePlans.filter((p) => p?.category !== "main" && p?.is_active !== false), [carePlans]);

  const filteredAndSortedMainPlans = useMemo(() => {
    let filtered = mainPlans.filter((plan: any) =>
      (plan.plan_name || "").toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      (plan.description || "").toLowerCase().includes(packageSearchTerm.toLowerCase())
    );

    // Mặc định sắp xếp theo giá tăng dần
    if (packageSortBy === "name") {
      filtered.sort((a: any, b: any) => (a.plan_name || "").localeCompare(b.plan_name || ""));
    } else if (packageSortBy === "type") {
      filtered.sort((a: any, b: any) => (a.plan_type || "").localeCompare(b.plan_type || ""));
    } else {
      filtered.sort((a: any, b: any) => (a.monthly_price || 0) - (b.monthly_price || 0));
    }
    return filtered;
  }, [mainPlans, packageSearchTerm, packageSortBy]);

  const paginatedMainPlans = useMemo(() => {
    const start = (packageCurrentPage - 1) * packageItemsPerPage;
    return filteredAndSortedMainPlans.slice(start, start + packageItemsPerPage);
  }, [filteredAndSortedMainPlans, packageCurrentPage, packageItemsPerPage]);

  const totalMainPages = useMemo(() => Math.ceil(filteredAndSortedMainPlans.length / packageItemsPerPage) || 1, [filteredAndSortedMainPlans.length, packageItemsPerPage]);

  const formatCurrency = (n: number) => {
    try {
      const scaled = (n || 0) * 10000; // Match registration page: unit price × 10,000
      return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(scaled);
    } catch {
      const fallback = (n || 0) * 10000;
      return String(fallback);
    }
  };

  // Helpers to format bed info similar to registration page
  const formatBedName = useCallback((bed: any, roomNumber?: string) => {
    if (!bed) return "";
    if (typeof bed.bed_number === "string" && bed.bed_number.includes("-")) return bed.bed_number;
    if (bed.bed_name) return bed.bed_name;
    if (roomNumber && bed.bed_number) {
      const roomNum = String(roomNumber).replace(/\D/g, "");
      const bedLetter = String.fromCharCode(64 + parseInt(bed.bed_number));
      return `${roomNum}-${bedLetter}`;
    }
    return bed.bed_number || `Giường ${bed._id || "?"}`;
  }, []);

  const formatBedType = useCallback((bedType: string) => {
    if (!bedType) return "";
    const map: Record<string, string> = {
      standard: "Tiêu chuẩn",
      electric: "Điều khiển điện",
      hospital: "Bệnh viện",
      reclining: "Nằm ngả",
      adjustable: "Điều chỉnh được",
      single: "Đơn",
      double: "Đôi",
      twin: "Đôi nhỏ",
      queen: "Queen",
      king: "King",
    };
    const vi = map[String(bedType).toLowerCase()] || bedType;
    return vi.charAt(0).toUpperCase() + vi.slice(1);
  }, []);

  // Helper: available beds count for a room (without fetching beds list)
  const getAvailableBedsCountForRoom = useCallback((room: any): number => {
    if (!room) return 0;
    if (Array.isArray(room.beds) && room.beds.length > 0) {
      return room.beds.filter((b: any) => b?.status === "available").length;
    }
    if (room.bed_info && typeof room.bed_info.available_beds === "number") {
      return room.bed_info.available_beds;
    }
    if (typeof room.available_beds === "number") return room.available_beds;
    return 0;
  }, []);

  // Helper: get available beds count from API data (for consistency)
  const getAvailableBedsCountFromAPI = useCallback((roomId: string, apiBeds: any[]): number => {
    if (!roomId || !Array.isArray(apiBeds)) return 0;
    return apiBeds.filter((b: any) => b?.status === "available").length;
  }, []);

  // Helper: get consistent available beds count (with caching)
  const getConsistentAvailableBedsCount = useCallback((room: any): number => {
    if (!room) return 0;
    
    // If we have API data for this room, use it
    if (selectedRoomId === room._id && availableBeds) {
      return getAvailableBedsCountFromAPI(room._id, availableBeds);
    }
    
    // Check cache first
    if (availableBedsCountCache[room._id]) {
      return availableBedsCountCache[room._id];
    }
    
    // Fallback to room data
    return getAvailableBedsCountForRoom(room);
  }, [selectedRoomId, availableBeds, availableBedsCountCache, getAvailableBedsCountFromAPI, getAvailableBedsCountForRoom]);

  // SWR: available beds by room
  const { data: swrBeds, isLoading: swrBedsLoading } = useSWR(
    selectedRoomId ? ["beds-by-room", selectedRoomId] : null,
    () => bedsAPI.getByRoom?.(selectedRoomId, "available"),
    { 
      revalidateOnFocus: false, 
      dedupingInterval: 10000,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      loadingTimeout: 5000
    }
  );

  // Update cache when API data changes
  useEffect(() => {
    if (selectedRoomId && availableBeds) {
      const count = getAvailableBedsCountFromAPI(selectedRoomId, availableBeds);
      setAvailableBedsCountCache(prev => {
        if (prev[selectedRoomId] !== count) {
          return { ...prev, [selectedRoomId]: count };
        }
        return prev;
      });
    }
  }, [selectedRoomId, availableBeds, getAvailableBedsCountFromAPI]);

  // Memoized available beds count for selected room
  const selectedRoomAvailableBedsCount = useMemo(() => {
    if (!selectedRoomId || !availableBeds) return 0;
    return getAvailableBedsCountFromAPI(selectedRoomId, availableBeds);
  }, [selectedRoomId, availableBeds, getAvailableBedsCountFromAPI]);

  useEffect(() => {
    if (!selectedRoomId) {
      setAvailableBeds([]);
      setPendingBedIds([]);
      setLoadingBeds(false);
      return;
    }
    setLoadingBeds(!!swrBedsLoading);
    setAvailableBeds(Array.isArray(swrBeds) ? swrBeds : []);
  }, [selectedRoomId, swrBeds, swrBedsLoading]);

  // SWR: pending service requests, to hide beds being requested
  const { data: swrServiceRequests } = useSWR(
    selectedRoomId ? ["pending-service-requests"] : null,
    async () => {
      try {
        const mine = await serviceRequestsAPI.getMyRequests?.();
        return Array.isArray(mine) ? mine : [];
      } catch (_) {
        return [];
      }
    },
    { 
      revalidateOnFocus: false, 
      dedupingInterval: 10000,
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      loadingTimeout: 3000
    }
  );
  useEffect(() => {
    if (!selectedRoomId) {
      setPendingBedIds([]);
      return;
    }
    const list = Array.isArray(swrServiceRequests) ? swrServiceRequests : [];
    const pending = list.filter((r: any) => r?.status === 'pending' && (r?.request_type === 'room_change' || r?.request_type === 'care_plan_change'));
    const ids = pending
      .filter((r: any) => r?.target_bed_id)
      .map((r: any) => (typeof r.target_bed_id === 'object' ? r.target_bed_id?._id : r.target_bed_id))
      .filter(Boolean);
    setPendingBedIds(ids);
  }, [selectedRoomId, swrServiceRequests]);

  const selectedPlan = useMemo(() => mainPlans.find((p) => p._id === mainPlanId), [mainPlans, mainPlanId]);

  // Auto compute endDate from startDate + duration, then clamp to end of month (local)
  useEffect(() => {
    if (!startDate || !duration) {
      setEndDate("");
      return;
    }
    try {
      const start = parseYMDToDate(startDate);
      if (!start) { setEndDate(""); return; }
      const months = parseInt(String(duration), 10);
      const temp = new Date(start);
      // Tính đúng: cộng thêm months - 1 tháng, sau đó lấy ngày cuối tháng
      temp.setMonth(temp.getMonth() + months - 1);
      // Set to last day of that month
      const endOfMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
      endOfMonth.setHours(0, 0, 0, 0);
      setEndDate(formatLocalYMD(endOfMonth));
    } catch {
      setEndDate("");
    }
  }, [startDate, duration]);

  // When entering step 6, initialize start date if empty to the minimal allowed first-of-month
  useEffect(() => {
    if (step !== 6) return;
    if (startDate) return; // keep user's manual selection
    try {
      const hasEnd = !!currentEndDate;
      const endLocal = hasEnd ? new Date(currentEndDate as Date) : null;
      const isNotExpired = endLocal ? (new Date(endLocal.getFullYear(), endLocal.getMonth(), endLocal.getDate()) >= todayStart) : true;
      const minStart = isNotExpired ? nextMonthStart : firstDayOfMonth(todayStart);
      setStartDate(formatLocalYMD(minStart));
    } catch {}
  }, [step, currentEndDate, startDate, todayStart, nextMonthStartYMD]);

  const handleSubmit = useCallback(async () => {
    if (!residentId || !mainPlanId || !duration) return;
    
    // Validation: bắt buộc nhập note cho care plan change
    if (!additionalNote.trim()) {
      alert('Vui lòng nhập lý do thay đổi gói dịch vụ');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Gửi dạng YYYY-MM-DD để tránh lệch timezone ở BE
      const startISO = startDate || undefined;
      const endISO = endDate || undefined;

      // Determine room info to send to BE
      const selectedRoomObj = rooms.find((r:any) => r._id === selectedRoomId);
      const payloadRoomId = selectedRoomId || null;
      const payloadBedId = selectedBedId || null;
      const selectedRoomType = selectedRoomObj?.room_type;

      // Calculate costs
      const mainPlan = carePlans.find((p:any) => p._id === mainPlanId);
      const suppList = carePlans.filter((p:any) => supplementaryIds.includes(p._id));
      const mainPrice = mainPlan?.monthly_price || 0;
      const suppPrice = suppList.reduce((sum:number, p:any) => sum + (p?.monthly_price || 0), 0);
      let roomPrice = 0;
      const roomTypeKey = selectedRoomObj?.room_type;
      const roomTypeObj = roomTypes.find((rt:any) => rt.room_type === roomTypeKey);
      roomPrice = roomTypeObj?.monthly_price || 0;
      const totalMonthlyCost = mainPrice + suppPrice + roomPrice;

      // Create care plan assignment first
      const carePlanAssignmentData = {
        resident_id: residentId,
        care_plan_ids: [mainPlanId, ...supplementaryIds],
        selected_room_type: selectedRoomType,
        assigned_room_id: payloadRoomId,
        assigned_bed_id: payloadBedId,
        total_monthly_cost: totalMonthlyCost,
        room_monthly_cost: roomPrice,
        care_plans_monthly_cost: mainPrice + suppPrice,
        start_date: startISO,
        end_date: endISO,
        status: 'pending'
      };

      console.log("Creating care plan assignment:", carePlanAssignmentData);
      const carePlanAssignment = await carePlanAssignmentsAPI.create(carePlanAssignmentData);

      // Create bed assignment
      console.log("User object:", user);
      console.log("UserProfile object:", userProfile);
      const assignedBy = (user as any)?.user_id || (user as any)?._id || (user as any)?.id || userProfile?._id || userProfile?.id;
      console.log("Assigned by:", assignedBy);
      
      if (!assignedBy) {
        throw new Error("Không tìm thấy ID người dùng để tạo bed assignment");
      }
      
      const bedAssignmentData = {
        resident_id: residentId,
        bed_id: payloadBedId,
        status: 'pending',
        assigned_by: assignedBy,
        unassigned_date: endISO || (() => {
          // Fallback: calculate end date if not set
          const fallbackStart = new Date();
          const fallbackEnd = new Date(fallbackStart);
          fallbackEnd.setMonth(fallbackEnd.getMonth() + 6);
          const year = fallbackEnd.getFullYear();
          const month = fallbackEnd.getMonth();
          const lastDay = new Date(year, month + 1, 0).getDate();
          return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        })()
      };

      console.log("Creating bed assignment:", bedAssignmentData);
      const bedAssignment = await bedAssignmentsAPI.create(bedAssignmentData);

      // Get selected room and bed details
      const selectedRoom = rooms.find((r: any) => r._id === selectedRoomId);
      const selectedBed = availableBeds.find((b: any) => b._id === selectedBedId);
      const selectedRoomTypeObj = roomTypes.find((rt: any) => rt.room_type === selectedRoom?.room_type);

      // Use only the additional note provided by user
      const detailedNote = additionalNote || '';

      // Get current bed assignment for the resident
      const currentBedAssignments = await bedAssignmentsAPI.getAllStatuses({ resident_id: residentId });
      const currentBedAssignment = Array.isArray(currentBedAssignments) 
        ? currentBedAssignments.find((a: any) => 
            (a.status === 'active' || a.status === 'accepted') && 
            isBedAssignmentActive(a)
          )
        : null;

      // Get current care plan assignment for the resident
      const currentCarePlanAssignments = await carePlanAssignmentsAPI.getByResidentId(residentId);
      const currentCarePlanAssignment = Array.isArray(currentCarePlanAssignments)
        ? currentCarePlanAssignments.find((a: any) => a.status === 'active')
        : null;

      // Get selected room type
      const selectedRoomForType = rooms.find(r => r._id === selectedRoomId);
      const selectedRoomTypeValue = selectedRoomForType?.room_type || '';
      
      console.log('Debug - Room type info:', {
        selectedRoomId,
        selectedRoomForType,
        selectedRoomTypeValue,
        roomType,
        finalSelectedRoomType: selectedRoomTypeValue || roomType
      });

      // Create service request with the new assignment IDs
      const serviceRequestData = {
        request_type: "care_plan_change" as const,
        resident_id: residentId,
        family_member_id: (user as any)?.user_id || (user as any)?._id,
        note: detailedNote,
        target_care_plan_assignment_id: carePlanAssignment._id,
        target_bed_assignment_id: bedAssignment._id,
        current_care_plan_assignment_id: currentCarePlanAssignment?._id,
        current_bed_assignment_id: currentBedAssignment?._id,
        emergencyContactName: userProfile?.full_name || userProfile?.name || (user as any)?.name || 'Chưa có thông tin',
        emergencyContactPhone: userProfile?.phone || (user as any)?.phone || 'Chưa có thông tin',
        medicalNote: additionalNote || undefined,
        selected_room_type: selectedRoomTypeValue || roomType, // Fallback to roomType if selectedRoomTypeValue is empty
        // Legacy fields for backward compatibility
        target_service_package_id: mainPlanId,
        new_start_date: startISO,
        new_end_date: endISO,
        target_room_id: selectedRoomId,
        target_bed_id: selectedBedId,
      };

      console.log("Creating service request:", serviceRequestData);
      await serviceRequestsAPI.create(serviceRequestData);

      router.replace(`/family/services/${residentId}`);
    } catch (error) {
      console.error('Error creating care plan change request:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  }, [residentId, mainPlanId, supplementaryIds, duration, startDate, endDate, selectedRoomId, selectedBedId, additionalNote, router, user, carePlans, roomTypes, rooms, userProfile]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/family/services/${residentId}`)}
              className="text-indigo-500 flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow">
                <GiftIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Đổi gói dịch vụ
                </h1>
               
              </div>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" /> Chọn gói chính mới
            </h2>

            <div className="relative mb-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm gói dịch vụ theo tên, mô tả..."
                value={packageSearchTerm}
                onChange={(e) => { setPackageSearchTerm(e.target.value); setPackageCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-indigo-700">
                      {paginatedMainPlans.length} gói chính
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Sắp xếp:</label>
                  <select
                    value={packageSortBy}
                    onChange={(e) => setPackageSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                  >
                    <option value="name">Theo tên</option>
                    <option value="price">Theo giá</option>
                    <option value="type">Theo loại</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main plans */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 rounded-xl text-white mb-2">
              <h3 className="text-base font-bold m-0">Gói chính</h3>
              <p className="text-indigo-100 text-xs m-0">Chọn 1 gói dịch vụ chính</p>
            </div>

            {!carePlans.length ? (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-700 m-0 font-medium">Đang tải danh sách gói dịch vụ...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
              {paginatedMainPlans.map((plan: any) => (
                <label
                  key={plan._id}
                  className={`group relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm block w-full ${
                    mainPlanId === plan._id ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="mainPlan"
                    checked={mainPlanId === plan._id}
                    onChange={() => setMainPlanId(plan._id)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <GiftIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                        <div className="text-indigo-600 font-bold text-base">{formatCurrency(plan.monthly_price || 0)} VND/tháng</div>
                      </div>
                      <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        mainPlanId === plan._id ? "border-indigo-500 bg-indigo-500" : "border-gray-300 group-hover:border-indigo-300"
                      }`}
                    >
                      {mainPlanId === plan._id && <CheckCircleIcon className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                </label>
              ))}
              </div>
            )}

            {/* Supplementary plans */}
            <div className={`bg-gradient-to-r ${mainPlanId ? 'from-emerald-500 to-teal-600' : 'from-gray-300 to-gray-400'} px-6 py-4 rounded-xl text-white mb-2`}>
              <h3 className="text-base font-bold m-0">Gói bổ sung (tuỳ chọn)</h3>
              <p className="text-emerald-100 text-xs m-0">{mainPlanId ? 'Chọn thêm các gói bổ trợ nếu cần' : 'Vui lòng chọn gói chính trước'}</p>
            </div>

            <div className={`space-y-2 ${mainPlanId ? '' : 'opacity-60'}`}>
              {(() => {
                const filtered = supplementaryPlans.filter((plan: any) =>
                  (plan.plan_name || '').toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                  (plan.description || '').toLowerCase().includes(packageSearchTerm.toLowerCase())
                );
                // sort ascending by price by default
                if (packageSortBy === 'name') {
                  filtered.sort((a: any, b: any) => (a.plan_name || '').localeCompare(b.plan_name || ''));
                } else if (packageSortBy === 'type') {
                  filtered.sort((a: any, b: any) => (a.plan_type || '').localeCompare(b.plan_type || ''));
                } else {
                  filtered.sort((a: any, b: any) => (a.monthly_price || 0) - (b.monthly_price || 0));
                }
                return filtered.map((plan: any) => (
                <label
                  key={plan._id}
                  className={`group relative border rounded-lg p-3 transition-all duration-200 hover:shadow-sm block w-full ${mainPlanId ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                    supplementaryIds.includes(plan._id) ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-gray-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={supplementaryIds.includes(plan._id)}
                    onChange={() => mainPlanId && setSupplementaryIds(prev => prev.includes(plan._id) ? prev.filter(x=>x!==plan._id) : [...prev, plan._id])}
                    disabled={!mainPlanId}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${supplementaryIds.includes(plan._id) ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gray-200'}`}>
                      <GiftIcon className={`w-4 h-4 ${supplementaryIds.includes(plan._id) ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                        <div className="text-emerald-600 font-bold text-base">{formatCurrency(plan.monthly_price || 0)} VND/tháng</div>
                      </div>
                      <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        supplementaryIds.includes(plan._id) ? "border-emerald-500 bg-emerald-500" : "border-gray-300 group-hover:border-emerald-300"
                      }`}
                    >
                      {supplementaryIds.includes(plan._id) && <CheckCircleIcon className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                </label>
              ));
              })()}
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
                      className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                        packageCurrentPage === page ? "bg-indigo-500 text-white border-indigo-500" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
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

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => router.push(`/family/services/${residentId}`)}
                className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow"
              >
                Hủy
              </button>
              <button
                disabled={!mainPlanId}
                onClick={() => setStep(2)}
                className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${
                  !mainPlanId ? "bg-gray-400 text-white cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105"
                }`}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Chọn phòng và giường mới</h2>
              <p className="text-xs text-slate-500">Vui lòng chọn phòng và giường mới phù hợp cho gói dịch vụ</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-indigo-700 font-medium">
                  Khi thay đổi gói dịch vụ, bạn cần chọn phòng và giường mới phù hợp.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Chọn loại phòng</h2>
            <div className="mb-4">
              <select
                value={roomType}
                onChange={(e) => { setRoomType(e.target.value); setSelectedRoomId(""); setSelectedBedId(""); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              >
                <option value="">-- Chọn loại phòng --</option>
                {[...roomTypes]
                  .sort((a: any, b: any) => (a?.monthly_price || 0) - (b?.monthly_price || 0))
                  .map((rt: any) => (
                    <option key={rt._id} value={rt.room_type}>
                      {(rt.type_name || rt.room_type)} - {formatDisplayCurrency(rt.monthly_price || 0)}/tháng
                    </option>
                  ))}
              </select>
            </div>

            {roomTypes && roomTypes.length > 0 && (
              <div className="space-y-2 mb-4">
                {[...roomTypes]
                  .sort((a: any, b: any) => (a?.monthly_price || 0) - (b?.monthly_price || 0))
                  .map((rt: any, idx: number) => {
                    const active = roomType === rt.room_type;
                    return (
                      <label
                        key={rt._id}
                        className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${
                          active
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : `border-gray-200 hover:border-indigo-300 border-l-4 ${['bg-white','bg-slate-50','bg-purple-50/40'][idx % 3]} ${['border-l-indigo-200','border-l-rose-200','border-l-emerald-200'][idx % 3]}`
                        }`}
                      >
                        <input
                          type="radio"
                          name="roomTypeList"
                          checked={active}
                          onChange={() => { setRoomType(rt.room_type); setSelectedRoomId(""); setSelectedBedId(""); }}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 w-full">
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold text-gray-900 truncate">{rt.type_name || rt.room_type}</div>
                            {rt.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rt.description}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 w-44">
                            <div className="text-xs text-gray-500">Giá/tháng</div>
                            <div className="font-bold text-indigo-600 whitespace-nowrap">{formatDisplayCurrency(rt.monthly_price || 0)}</div>
                          </div>
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
                  const availableRooms = rooms.filter((r: any) => {
                    if (r.room_type !== roomType || r.status !== 'available') return false;
                    if (residentGender && r.gender && String(residentGender).toLowerCase() !== String(r.gender).toLowerCase()) return false;
                    const count = getAvailableBedsCountForRoom(r);
                    return count > 0;
                  });

                  const totalAvailableBeds = availableRooms.reduce((total: number, room: any) => total + getAvailableBedsCountForRoom(room), 0);
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

            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow">Quay lại</button>
              <button disabled={!roomType} onClick={() => setStep(4)} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${!roomType ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>Tiếp tục</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Chọn phòng</h2>
            <div className="mb-4">
              <select
                value={selectedRoomId}
                onChange={(e) => { setSelectedRoomId(e.target.value); setSelectedBedId(""); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              >
                <option value="">-- Chọn phòng --</option>
                {rooms
                  .filter((r: any) => r.room_type === roomType && r.status === 'available')
                  .filter((r: any) => !residentGender || !r.gender || String(r.gender).toLowerCase() === String(residentGender).toLowerCase())
                  .filter((r: any) => getAvailableBedsCountForRoom(r) > 0)
                  .map((room: any) => {
                    // Use consistent data source
                    const availableCount = (selectedRoomId === room._id && availableBeds) 
                      ? selectedRoomAvailableBedsCount
                      : getConsistentAvailableBedsCount(room);
                    return (
                      <option key={room._id} value={room._id}>
                        Phòng {room.room_number} ({room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác'}) - {availableCount} giường trống
                      </option>
                    );
                  })}
              </select>
            </div>

            {(() => {
              if (!rooms.length || !roomTypes.length) {
                return (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-blue-700 m-0 font-medium">Đang tải danh sách phòng...</p>
                    </div>
                  </div>
                );
              }

              const availableRooms = rooms
                .filter((r: any) => r.room_type === roomType && r.status === 'available')
                .filter((r: any) => !residentGender || !r.gender || String(r.gender).toLowerCase() === String(residentGender).toLowerCase())
                .filter((r: any) => getAvailableBedsCountForRoom(r) > 0);

              if (availableRooms.length === 0) {
                const genderText = residentGender === 'male' ? 'nam' : residentGender === 'female' ? 'nữ' : '';
                return (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                    <p className="text-sm text-yellow-700 m-0 font-medium">Không có phòng nào có giường trống cho {genderText} trong loại phòng này</p>
                  </div>
                );
              }

              const selectedRoom = rooms.find((r: any) => r._id === selectedRoomId);
              // Use memoized value for selected room
              const availableBedsCountSelected = selectedRoomAvailableBedsCount;
              const genderTextSelected = selectedRoom?.gender === 'male' ? 'Nam' : selectedRoom?.gender === 'female' ? 'Nữ' : 'Khác';

              return (
                <div>
                  {selectedRoom && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                      <p className="text-sm text-indigo-600 m-0 font-medium">
                        Đã chọn: <span className="font-semibold">Phòng {selectedRoom.room_number} ({genderTextSelected})</span>
                        <span className="text-indigo-500 ml-2">({availableBedsCountSelected} giường trống)</span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {availableRooms.map((room: any, idx: number) => {
                      // Use consistent data source
                      const availableBedsCount = getConsistentAvailableBedsCount(room);
                      const roomTypeObj = roomTypes.find((rt: any) => rt.room_type === room.room_type);
                      const monthlyPrice = roomTypeObj?.monthly_price || 0;
                      const genderBadge = room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác';
                      const active = selectedRoomId === room._id;
                      return (
                        <label
                          key={room._id}
                          className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${
                            active
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : `border-gray-200 hover:border-indigo-300 border-l-4 ${['bg-white','bg-slate-50','bg-purple-50/40'][idx % 3]} ${['border-l-indigo-200','border-l-rose-200','border-l-emerald-200'][idx % 3]}`
                          }`}
                        >
                          <input
                            type="radio"
                            name="roomList"
                            checked={active}
                            onChange={() => { setSelectedRoomId(room._id); setSelectedBedId(""); }}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 w-full">
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
                            <div className="text-right flex-shrink-0 w-44">
                              <div className="text-xs text-gray-500">Giá/tháng</div>
                              <div className="font-bold text-indigo-600 whitespace-nowrap">{formatDisplayCurrency(monthlyPrice)}</div>
                            </div>
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
                </div>
              );
            })()}

            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setStep(3)} className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow">Quay lại</button>
              <button disabled={!selectedRoomId} onClick={() => setStep(5)} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${!selectedRoomId ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>Tiếp tục</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Chọn giường</h2>
            <div className="mb-4">
              <select
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              >
                <option value="">-- Chọn giường --</option>
                {(() => {
                  const room = rooms.find((r:any)=>r._id===selectedRoomId);
                  const roomNumber = room?.room_number;
                  const list = (availableBeds || [])
                    .filter((b: any) => !pendingBedIds.includes(b._id))
                    .map((b: any) => ({ id: b._id, label: String(b?.bed_number ?? '') }));
                  return list.map(b => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ));
                })()}
              </select>
            </div>

            {(() => {
              if (loadingBeds) {
                return (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-blue-700 m-0 font-medium">Đang tải danh sách giường...</p>
                    </div>
                  </div>
                );
              }

              const beds = (availableBeds || []).filter((b: any) => !pendingBedIds.includes(b._id));
              const selectedRoom = rooms.find((r:any)=>r._id===selectedRoomId);
              const roomNumber = selectedRoom?.room_number;
              
              // Debug: Log để kiểm tra sự khác biệt
              console.log('Selected room:', selectedRoom);
              console.log('Available beds from API:', availableBeds);
              console.log('Filtered beds:', beds);
              console.log('Room beds count from getAvailableBedsCountForRoom:', getAvailableBedsCountForRoom(selectedRoom));

              if (!beds.length) {
                return (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                    <p className="text-sm text-yellow-700 m-0 font-medium">Không còn giường trống trong phòng này</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {beds.map((b: any, idx: number) => {
                    const isSelected = selectedBedId === b._id;
                    const statusBadge = b.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700'
                      : b.status === 'occupied'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700';
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
                                <div className="font-semibold text-gray-900 text-sm">{String(b?.bed_number ?? '')}</div>
                              </div>
                              <div className="text-xs">
                                <div className="text-gray-500">Loại giường</div>
                                <div className="font-medium text-gray-900">{formatBedType(b.bed_type)}</div>
                              </div>
                              <div className="text-xs">
                                <div className="text-gray-500">Trạng thái</div>
                                <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                                  {b.status === 'available' ? 'Còn trống' : b.status === 'occupied' ? 'Đã có người' : 'Không rõ'}
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
              );
            })()}

            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setStep(4)} className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow">Quay lại</button>
              <button disabled={!selectedBedId} onClick={() => setStep(6)} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${!selectedBedId ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>Tiếp tục</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-6 shadow-lg border border-white/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Thời gian sử dụng
            </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời hạn sử dụng dịch vụ</label>
            <div className="flex items-center gap-2 flex-nowrap w-full">
              {['3','6','12','custom'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDuration(opt as DurationOption)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors border-2 whitespace-nowrap ${duration === opt
                    ? opt === 'custom'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  aria-pressed={duration === opt}
                >
                  {opt === '3' && '3 tháng'}
                  {opt === '6' && '6 tháng'}
                  {opt === '12' && '12 tháng'}
                  {opt === 'custom' && 'Tùy chọn'}
                </button>
              ))}
              {duration === 'custom' && (
                <div className="relative flex-shrink-0">
                  <input
                    type="number"
                    min={3}
                    step={1}
                    value={customMonths}
                    onChange={(e) => setCustomMonths(e.target.value)}
                    onBlur={() => {
                      const n = parseInt(customMonths || '0', 10);
                      if (!Number.isFinite(n) || n < 3) setCustomMonths('3');
                    }}
                    placeholder="Số tháng"
                    className="w-36 pr-12 rounded-xl border-2 border-amber-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                    aria-label="Số tháng sử dụng dịch vụ tùy chọn"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">tháng</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Thời hạn sử dụng dịch vụ tối thiểu là 3 tháng.</p>
            {duration === 'custom' && isCustomMonthsInvalid && (
              <p className="mt-1 text-[11px] font-semibold text-red-600">Số tháng tối thiểu là 3.</p>
            )}
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                {(() => {
                  const hasEnd = !!currentEndDate;
                  const endLocal = hasEnd ? new Date(currentEndDate as Date) : null;
                  const isNotExpired = endLocal ? (new Date(endLocal.getFullYear(), endLocal.getMonth(), endLocal.getDate()) >= todayStart) : true;
                  const minStart = isNotExpired ? nextMonthStart : firstDayOfMonth(todayStart);
                  return (
                    <DatePicker
                      selected={parseYMDToDate(startDate)}
                      onChange={(date) => {
                        if (!date) { setStartDate(''); return; }
                        const normalized = firstDayOfMonth(date);
                        setStartDate(formatLocalYMD(normalized));
                      }}
                      dateFormat="dd/MM/yyyy"
                      minDate={minStart}
                      placeholderText="Chọn ngày bắt đầu (ngày đầu tháng)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  );
                })()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Ngày bắt đầu phải là ngày đầu tháng để bắt đầu sử dụng.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc mới:</label>
                <div className="relative">
                  <input type="text" value={formatYMDToDisplay(endDate)} readOnly className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" placeholder="Sẽ tự động tính dựa trên thời hạn" />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Tự động tính: {duration === 'custom' ? (customMonths || '0') : (duration || '0')} tháng từ ngày bắt đầu</p>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setStep(5)} className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow">Quay lại</button>
              <button disabled={!startDate || !duration || (duration === 'custom' && isCustomMonthsInvalid)} onClick={() => setStep(7)} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${!startDate || !duration || (duration === 'custom' && isCustomMonthsInvalid) ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>Tiếp tục</button>
            </div>
          </div>
        )}


        {step === 7 && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-6 shadow-lg border border-white/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Xem lại & xác nhận
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Người thụ hưởng</div>
                    <div className="font-semibold text-gray-900">{residentName || 'Chưa chọn'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <GiftIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Gói chính</div>
                    <div className="font-semibold text-gray-900">{selectedPlan?.plan_name || 'Chưa chọn'}</div>
                  </div>
                </div>

                {supplementaryIds.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 font-medium">Gói bổ sung ({supplementaryIds.length})</div>
                        <div className="font-semibold text-gray-900">
                          {(() => {
                            const picked = supplementaryPlans.filter(p => supplementaryIds.includes(p._id));
                            return picked.length > 2 ? `${picked[0]?.plan_name} +${picked.length - 1} gói khác` : picked.map(p => p.plan_name).join(', ');
                          })()}
                        </div>
                      </div>
                      <button onClick={() => setShowSupplementaryDetails(!showSupplementaryDetails)} className="text-blue-600 hover:text-blue-800 transition-colors">
                        <svg className={`w-5 h-5 transform transition-transform ${showSupplementaryDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>

                    {showSupplementaryDetails && (
                      <div className="ml-11 space-y-2">
                        {supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).map((plan, index) => (
                          <div key={plan._id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">{index + 1}</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">{plan.plan_name}</div>
                              <div className="text-xs text-gray-500">{plan.description}</div>
                            </div>
                            <div className="text-sm font-semibold text-blue-700">{formatDisplayCurrency(plan.monthly_price || 0)} /tháng</div>
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
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Phòng</div>
                    <div className="font-semibold text-gray-900">{rooms.find((r:any)=>r._id===selectedRoomId)?.room_number || 'Chưa chọn'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" /></svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Giường</div>
                    <div className="font-semibold text-gray-900">{(() => {
                      const b = (availableBeds || []).find((x:any)=>x._id===selectedBedId);
                      return b ? (typeof b.bed_number === 'string' ? b.bed_number : `${b.bed_number}`) : 'Chưa chọn';
                    })()}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 font-medium">Thời gian</div>
                      <div className="font-semibold text-gray-900">{`${duration || '0'} tháng${showTimeDetails ? '' : ` (${formatYMDToDisplay(startDate) || 'Chưa chọn'} - ${formatYMDToDisplay(endDate) || 'Chưa chọn'})`}`}</div>
                    </div>
                    <button onClick={() => setShowTimeDetails(!showTimeDetails)} className="text-green-600 hover:text-green-800 transition-colors">
                      <svg className={`w-5 h-5 transform transition-transform ${showTimeDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  {showTimeDetails && (
                    <div className="ml-11 space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">BĐ</div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 font-medium">Ngày bắt đầu</div>
                          <div className="font-medium text-gray-900">{formatYMDToDisplay(startDate) || 'Chưa chọn'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">KT</div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 font-medium">Ngày kết thúc</div>
                          <div className="font-medium text-gray-900">{formatYMDToDisplay(endDate) || 'Chưa chọn'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <h4 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Thông tin bổ sungsung
              </h4>
              <div className="space-y-3">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  <p className="text-sm text-indigo-700 font-medium mb-2">
                    Thông tin liên hệ khẩn cấp sẽ được lấy thông tin khi đăng ký người cao tuổi:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm text-indigo-600">
                        <strong>Tên:</strong> {userProfile?.full_name || 'Chưa có thông tin'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm text-indigo-600">
                        <strong>Số điện thoại:</strong> {userProfile?.phone || 'Chưa có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-700 mb-2">
                    Lý do thay đổi gói dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-24 resize-none"
                    placeholder="Nhập lý do thay đổi gói dịch vụ..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
                Chi tiết thanh toán
              </h4>
              {(() => {
                const mainPlan = carePlans.find((p:any) => p._id === mainPlanId);
                const suppList = carePlans.filter((p:any) => supplementaryIds.includes(p._id));
                const mainPrice = mainPlan?.monthly_price || 0;
                const suppPrice = suppList.reduce((sum:number, p:any) => sum + (p?.monthly_price || 0), 0);
                let roomPrice = 0;
                const selectedRoom = rooms.find((r:any) => r._id === selectedRoomId);
                const roomTypeKey = selectedRoom?.room_type;
                const roomTypeObj = roomTypes.find((rt:any) => rt.room_type === roomTypeKey);
                roomPrice = roomTypeObj?.monthly_price || 0;
                const total = mainPrice + suppPrice + roomPrice;
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                      <span className="text-gray-700">Giá gói chính</span>
                      <span className="font-semibold text-gray-900">{formatDisplayCurrency(mainPrice)} /tháng</span>
                    </div>
                    {suppList.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                          <span className="text-gray-700">Giá gói bổ sung ({suppList.length})</span>
                          <span className="font-semibold text-gray-900">{formatDisplayCurrency(suppPrice)} /tháng</span>
                        </div>
                        <div className="ml-1">
                          <button onClick={() => setShowSupplementaryDetails(!showSupplementaryDetails)} className="text-xs text-indigo-600 hover:text-indigo-800">{showSupplementaryDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}</button>
                          {showSupplementaryDetails && (
                            <div className="mt-2 space-y-1">
                              {suppList.map((p:any, idx:number) => (
                                <div key={p._id} className="flex justify-between items-center py-1 px-3 bg-indigo-50 rounded-lg">
                                  <span className="text-sm text-gray-600">{idx+1}. {p.plan_name}</span>
                                  <span className="text-sm font-medium text-indigo-700">{formatDisplayCurrency(p.monthly_price || 0)} /tháng</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                      <span className="text-gray-700">Giá phòng</span>
                      <span className="font-semibold text-gray-900">{formatDisplayCurrency(roomPrice)} /tháng</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4">
                      <span className="text-white font-bold text-lg">Tổng cộng</span>
                      <span className="text-white font-bold text-lg">{formatDisplayCurrency(total)} /tháng</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setStep(6)} className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow">Quay lại</button>
              <button onClick={handleSubmit} disabled={isSubmitting || !duration || !selectedRoomId || !selectedBedId} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${isSubmitting || !duration || !selectedRoomId || !selectedBedId ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


