"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import useSWR from "swr";
import {
  carePlansAPI,
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

type DurationOption = "6" | "12";

export default function ChangeCarePlanPage() {
  const router = useRouter();
  const params = useParams();
  const residentId = (params?.id as string) || "";
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [mainPlanId, setMainPlanId] = useState<string>("");
  const [duration, setDuration] = useState<DurationOption | "">("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomType, setRoomType] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [keepExistingRoomBed, setKeepExistingRoomBed] = useState<boolean>(true);
  const [existingRoomInfo, setExistingRoomInfo] = useState<any>(null);
  const [existingBedInfo, setExistingBedInfo] = useState<any>(null);
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

  // Load care plans
  const { data: swrCarePlans } = useSWR("care-plans", () => carePlansAPI.getAll(), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  useEffect(() => {
    if (Array.isArray(swrCarePlans)) setCarePlans(swrCarePlans);
  }, [swrCarePlans]);

  // Load rooms/room types
  const { data: swrRooms } = useSWR("rooms", () => roomsAPI.getAll(), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  const { data: swrRoomTypes } = useSWR("room-types", () => roomTypesAPI.getAll(), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
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

  // Populate existing room/bed from SWR bed assignments
  useEffect(() => {
    try {
      const bas = swrBedAssignments;
      const activeBA = Array.isArray(bas) ? bas.find((a: any) => a?.bed_id?.room_id && !a.unassigned_date) : null;
      if (activeBA?.bed_id?.room_id) {
        setExistingRoomInfo(typeof activeBA.bed_id.room_id === "object" ? activeBA.bed_id.room_id : null);
        setExistingBedInfo(typeof activeBA.bed_id === "object" ? activeBA.bed_id : null);
      }
    } catch {}
  }, [swrBedAssignments]);

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

  // SWR: available beds by room
  const { data: swrBeds, isLoading: swrBedsLoading } = useSWR(
    selectedRoomId && !keepExistingRoomBed ? ["beds-by-room", selectedRoomId] : null,
    () => bedsAPI.getByRoom?.(selectedRoomId, "available"),
    { revalidateOnFocus: false, dedupingInterval: 20000 }
  );
  useEffect(() => {
    if (!selectedRoomId || keepExistingRoomBed) {
      setAvailableBeds([]);
      setPendingBedIds([]);
      setLoadingBeds(false);
      return;
    }
    setLoadingBeds(!!swrBedsLoading);
    setAvailableBeds(Array.isArray(swrBeds) ? swrBeds : []);
  }, [selectedRoomId, keepExistingRoomBed, swrBeds, swrBedsLoading]);

  // SWR: pending service requests, to hide beds being requested
  const { data: swrServiceRequests } = useSWR(
    !keepExistingRoomBed ? ["pending-service-requests"] : null,
    async () => {
      try {
        const all = await serviceRequestsAPI.getAll?.();
        return Array.isArray(all) ? all : [];
      } catch (_) {
        try {
          const pend = await serviceRequestsAPI.getPending?.();
          return Array.isArray(pend) ? pend : [];
        } catch {
          const mine = await serviceRequestsAPI.getMyRequests?.();
          return Array.isArray(mine) ? mine : [];
        }
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 20000 }
  );
  useEffect(() => {
    if (!selectedRoomId || keepExistingRoomBed) {
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
  }, [selectedRoomId, keepExistingRoomBed, swrServiceRequests]);

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
      const temp = new Date(start);
      // Add duration months
      temp.setMonth(temp.getMonth() + parseInt(String(duration), 10));
      // Set to last day of that month
      const endOfMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
      endOfMonth.setHours(0, 0, 0, 0);
      setEndDate(formatLocalYMD(endOfMonth));
    } catch {
      setEndDate("");
    }
  }, [startDate, duration]);

  // When entering step 6, auto-set start date to exactly the old plan's end date (local YMD)
  useEffect(() => {
    if (step !== 6) return;
    if (startDate) return; // keep user's manual selection
    try {
      const base = currentEndDate ? new Date(currentEndDate) : new Date();
      base.setHours(0, 0, 0, 0);
      setStartDate(formatLocalYMD(base));
    } catch {}
  }, [step, currentEndDate, startDate]);

  const handleSubmit = useCallback(async () => {
    if (!residentId || !mainPlanId || !duration) return;
    setIsSubmitting(true);
    try {
      // Gửi dạng YYYY-MM-DD để tránh lệch timezone ở BE
      const startISO = startDate || undefined;
      const endISO = endDate || undefined;

      // Determine room info to always send to BE (even when keeping old room/bed)
      const selectedRoomObj = rooms.find((r:any) => r._id === selectedRoomId);
      const payloadRoomId = keepExistingRoomBed ? (existingRoomInfo?._id || null) : (selectedRoomId || null);
      const payloadBedId = keepExistingRoomBed ? (existingBedInfo?._id || null) : (selectedBedId || null);
      const selectedRoomType = (() => {
        if (keepExistingRoomBed) return existingRoomInfo?.room_type || undefined;
        if (selectedRoomObj?.room_type) return selectedRoomObj.room_type;
        return undefined;
      })();

      const common: any = {
        request_type: "care_plan_change",
        resident_id: residentId,
        new_start_date: startISO,
        start_date: startISO,
        new_end_date: endISO,
        target_room_id: payloadRoomId,
        target_bed_id: payloadBedId,
        selected_room_type: selectedRoomType,
        emergencyContactName: userProfile?.full_name || user?.name || "",
        emergencyContactPhone: userProfile?.phone || (user as any)?.phone || "",
      };

      // Debug: Log payload để kiểm tra
      console.log("=== DEBUG: Service Request Payload ===");
      console.log("startDate:", startDate);
      console.log("endDate:", endDate);
      console.log("startISO:", startISO);
      console.log("endISO:", endISO);
      console.log("keepExistingRoomBed:", keepExistingRoomBed);
      console.log("selectedRoomId:", selectedRoomId);
      console.log("selectedBedId:", selectedBedId);
      console.log("payloadRoomId:", payloadRoomId);
      console.log("payloadBedId:", payloadBedId);
      console.log("selected_room_type:", selectedRoomType);
      console.log("common payload:", common);

      // Gửi 1 yêu cầu cho gói chính và 1 yêu cầu cho mỗi gói bổ sung
      const allPlanIds = [mainPlanId, ...supplementaryIds];
      const requests = allPlanIds.map((planId) => {
        const noteText = supplementaryIds.length
          ? `Yêu cầu đổi gói dịch vụ (gói: ${carePlans.find(p=>p._id===planId)?.plan_name || planId}). Kèm các gói khác: ${supplementaryPlans.filter(p=>supplementaryIds.includes(p._id)).map(p=>p.plan_name).join(', ')}`
          : `Yêu cầu đổi gói dịch vụ (gói: ${carePlans.find(p=>p._id===planId)?.plan_name || planId})`;
        const payload = { ...common, target_service_package_id: planId, note: noteText };
        
        // Debug: Log từng payload
        console.log(`Payload for plan ${planId}:`, payload);
        
        return serviceRequestsAPI.create(payload);
      });

      await Promise.all(requests);
      router.replace(`/family/services/${residentId}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [residentId, mainPlanId, supplementaryIds, duration, startDate, endDate, keepExistingRoomBed, selectedRoomId, selectedBedId, router, user?.name, userProfile, carePlans, supplementaryPlans]);

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
              <h2 className="text-lg font-bold text-slate-800 mb-1">Phòng và giường</h2>
              <p className="text-xs text-slate-500">Giữ nguyên chỗ ở hiện tại hoặc chọn phòng/giường mới phù hợp</p>
            </div>

            {/* Option cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${keepExistingRoomBed ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="roomBedOption"
                    checked={keepExistingRoomBed}
                    onChange={() => setKeepExistingRoomBed(true)}
                    className="mt-1 w-4 h-4 text-emerald-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-emerald-700">Giữ lại phòng và giường cũ</span>
                      {keepExistingRoomBed && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Đã chọn</span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-700">
                      {existingRoomInfo && existingBedInfo ? (
                        <span>Phòng <span className="font-semibold">{existingRoomInfo.room_number}</span> – Giường <span className="font-semibold">{existingBedInfo.bed_number}</span></span>
                      ) : (
                        <span>Hệ thống sẽ giữ nguyên chỗ ở hiện tại (nếu có)</span>
                      )}
                    </div>
                  </div>
                </div>
              </label>

              <label className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${!keepExistingRoomBed ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="roomBedOption"
                    checked={!keepExistingRoomBed}
                    onChange={() => setKeepExistingRoomBed(false)}
                    className="mt-1 w-4 h-4 text-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-indigo-700">Chọn phòng và giường mới</span>
                      {!keepExistingRoomBed && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">Đã chọn</span>
                      )}
                    </div>
                    <div className="text-xs text-indigo-700">Thay thế phòng và giường hiện tại bằng lựa chọn mới</div>
                  </div>
                </div>
              </label>
            </div>

            {/* Khi chọn phòng/giường mới, thực hiện các bước riêng như trang đăng ký */}
            {!keepExistingRoomBed && (
              <div className="mt-4 text-sm text-slate-600">
                Hãy bấm "Tiếp tục" để tiếp tục đăng kí.
              </div>
            )}

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(keepExistingRoomBed ? 6 : 3)}
                className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${
                  'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                }`}
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
                  .map((room: any) => (
                    <option key={room._id} value={room._id}>
                      Phòng {room.room_number} ({room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác'}) - {getAvailableBedsCountForRoom(room)} giường trống
                    </option>
                  ))}
              </select>
            </div>

            {(() => {
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
              const availableBedsCountSelected = selectedRoom ? getAvailableBedsCountForRoom(selectedRoom) : 0;
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
                      const availableBedsCount = getAvailableBedsCountForRoom(room);
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
              const beds = (availableBeds || []).filter((b: any) => !pendingBedIds.includes(b._id));
              const selectedRoom = rooms.find((r:any)=>r._id===selectedRoomId);
              const roomNumber = selectedRoom?.room_number;

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
                <label className="block text-sm font-medium text-gray-700 mb-3">Thời hạn:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative cursor-pointer">
                    <input type="radio" name="duration" value="6" checked={duration === '6'} onChange={() => setDuration('6')} className="sr-only" />
                    <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${duration === '6' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${duration === '6' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>{duration === '6' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                        <div>
                          <div className="font-semibold text-gray-900">6 tháng</div>
                          <div className="text-sm text-gray-500">Gia hạn nửa năm</div>
                        </div>
                      </div>
                    </div>
                  </label>
                  <label className="relative cursor-pointer">
                    <input type="radio" name="duration" value="12" checked={duration === '12'} onChange={() => setDuration('12')} className="sr-only" />
                    <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${duration === '12' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${duration === '12' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>{duration === '12' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                        <div>
                          <div className="font-semibold text-gray-900">1 năm</div>
                          <div className="text-sm text-gray-500">Gia hạn trọn năm</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                <DatePicker
                  selected={parseYMDToDate(startDate)}
                  onChange={(date) => setStartDate(date ? formatLocalYMD(date) : '')}
                  dateFormat="dd/MM/yyyy"
                  minDate={currentEndDate ? new Date(currentEndDate) : new Date()}
                  placeholderText="Chọn ngày bắt đầu"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc mới:</label>
                <div className="relative">
                  <input type="text" value={formatYMDToDisplay(endDate)} readOnly className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" placeholder="Sẽ tự động tính dựa trên thời hạn" />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Tự động tính: {duration || '0'} tháng từ ngày bắt đầu</p>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setStep(5)} className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow">Quay lại</button>
              <button disabled={!startDate || !duration} onClick={() => setStep(7)} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${!startDate || !duration ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>Tiếp tục</button>
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
                    <div className="font-semibold text-gray-900">{keepExistingRoomBed && existingRoomInfo ? `Phòng ${existingRoomInfo.room_number}` : (rooms.find((r:any)=>r._id===selectedRoomId)?.room_number || 'Chưa chọn')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" /></svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Giường</div>
                    <div className="font-semibold text-gray-900">{keepExistingRoomBed && existingBedInfo ? `Giường ${existingBedInfo.bed_number}` : (() => {
                      const b = (availableBeds || []).find((x:any)=>x._id===selectedBedId);
                      const room = rooms.find((r:any)=>r._id===selectedRoomId);
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
                const selRoom = rooms.find((r:any) => r._id === selectedRoomId) || existingRoomInfo;
                const roomTypeKey = selRoom?.room_type;
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
              <button onClick={handleSubmit} disabled={isSubmitting || !duration || (!keepExistingRoomBed && (!selectedRoomId || !selectedBedId))} className={`px-5 py-2 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow ${isSubmitting || !duration || (!keepExistingRoomBed && (!selectedRoomId || !selectedBedId)) ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'}`}>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


