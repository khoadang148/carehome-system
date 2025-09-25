"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from 'swr';
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { userAPI, serviceRequestsAPI, bedAssignmentsAPI, bedsAPI, roomsAPI } from "@/lib/api";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  HomeIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MapPinIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid
} from "@heroicons/react/24/solid";
import SuccessModal from "@/components/SuccessModal";

type TabType = 'users' | 'service-requests';

export default function ApprovalsPage() {
  const { user, loading } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | undefined>(undefined);
  const [successName, setSuccessName] = useState<string | undefined>(undefined);
  const [successActionType, setSuccessActionType] = useState<string | undefined>(undefined);
  const [successDetails, setSuccessDetails] = useState<string | undefined>(undefined);
  const [nextUrlAfterSuccess, setNextUrlAfterSuccess] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // SWR hooks for data fetching with caching
  const { data: pendingUsers = [], error: usersError, mutate: mutateUsers } = useSWR(
    user ? '/admin/pending-users' : null,
    () => userAPI.getByRoleWithStatus("family", "pending"),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );

  const { data: allServiceRequests = [], error: requestsError, mutate: mutateRequests } = useSWR(
    user ? '/admin/service-requests' : null,
    () => serviceRequestsAPI.getAll(),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const { data: beds = [], error: bedsError } = useSWR(
    user ? '/admin/beds' : null,
    () => bedsAPI.getAll(),
    {
      refreshInterval: 60000, // Beds change less frequently
      revalidateOnFocus: false,
    }
  );

  const { data: rooms = [], error: roomsError } = useSWR(
    user ? '/admin/rooms' : null,
    () => roomsAPI.getAll(),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  const { data: bedAssignments = [], error: assignmentsError } = useSWR(
    user ? '/admin/bed-assignments' : null,
    () => bedAssignmentsAPI.getAll(),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  // Filter pending service requests
  const pendingRoomChangeRequests = useMemo(() => {
    return Array.isArray(allServiceRequests) 
      ? allServiceRequests.filter((req: any) => req.status === 'pending')
      : [];
  }, [allServiceRequests]);

  const getStatusLabel = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
        return 'Tạm khóa';
      case 'deleted':
        return 'Đã xóa';
      case 'pending':
        return 'Chờ duyệt';
      default:
        return status || '---';
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'inactive':
        return 'bg-slate-50 text-slate-700 border border-slate-200';
      case 'suspended':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'deleted':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'pending':
        return 'bg-violet-50 text-violet-700 border border-violet-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getCurrentRoomAndBed = (residentId: string) => {
    console.log('Debug - getCurrentRoomAndBed for residentId:', residentId);
    console.log('Debug - bedAssignments:', bedAssignments);
    
    // Tìm bed assignment active cho resident này
    const assignment = bedAssignments.find(ba => {
      const baResidentId = typeof ba.resident_id === 'string' 
        ? ba.resident_id 
        : ba.resident_id?._id || ba.resident_id;
      console.log('Debug - comparing:', baResidentId, 'with', residentId);
      return baResidentId === residentId && !ba.unassigned_date;
    });
    
    console.log('Debug - found assignment:', assignment);
    
    if (!assignment) return { room: null, bed: null };
    
    // Backend đã populate bed_id với room_id, nên ta có thể lấy trực tiếp
    if (assignment.bed_id && typeof assignment.bed_id === 'object') {
      const bed = assignment.bed_id;
      const room = bed.room_id && typeof bed.room_id === 'object' ? bed.room_id : null;
      
      console.log('Debug - found bed from assignment:', bed);
      console.log('Debug - found room from bed:', room);
      
      return { room, bed };
    }
    
    // Fallback: tìm trong beds array nếu assignment.bed_id chỉ là string
    const bed = assignment.bed_id ? 
      beds.find(b => {
        const bedId = typeof assignment.bed_id === 'string' 
          ? assignment.bed_id 
          : assignment.bed_id?._id || assignment.bed_id;
        return b._id === bedId;
      }) : null;
    
    console.log('Debug - found bed from beds array:', bed);
    
    if (!bed) return { room: null, bed: null };
    
    // Lấy room từ bed
    const room = bed.room_id ? 
      rooms.find(r => {
        const bedRoomId = typeof bed.room_id === 'string' 
          ? bed.room_id 
          : bed.room_id?._id || bed.room_id;
        return r._id === bedRoomId;
      }) : null;
    
    console.log('Debug - found room from rooms array:', room);
    
    return { room, bed };
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Loading states
  const isLoading = !pendingUsers && !usersError;
  const isRequestsLoading = !allServiceRequests && !requestsError;
  const isBedsLoading = !beds && !bedsError;
  const isRoomsLoading = !rooms && !roomsError;
  const isAssignmentsLoading = !bedAssignments && !assignmentsError;

  const filtered = useMemo(() => {
    const currentData = activeTab === 'users' ? pendingUsers : pendingRoomChangeRequests;
    
    if (activeTab === 'users') {
      if (!search.trim()) return currentData;
      const q = search.toLowerCase();
      return currentData.filter((item) => {
        return [item.full_name, item.email, item.phone, item.username]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q));
      });
    } else {
      // Group similar service requests
      const groupedRequests = currentData.reduce((acc: any, request: any) => {
        // Heuristic grouping: group by type + family + resident + createdAt (minute bucket)
        const fam = request.family_member_id?._id || request.family_member_id;
        const res = request.resident_id?._id || request.resident_id;
        const created = request.createdAt || request.created_at || request.updatedAt || '';
        const bucket = created ? new Date(created).toISOString().slice(0, 16) : '';

        let key = `${request.request_type}_${fam}_${res}_${bucket}`;

        // For room changes, also include target room/bed if provided to avoid mixing truly separate ops
        if (request.request_type === 'room_change') {
          key += `_${request.target_room_id?._id || request.target_room_id || ''}_${request.target_bed_id?._id || request.target_bed_id || ''}`;
        }

        if (!acc[key]) {
          acc[key] = {
            ...request,
            count: 1,
            groupedRequests: [request]
          };
        } else {
          acc[key].count += 1;
          acc[key].groupedRequests.push(request);
        }
        return acc;
      }, {});
      
      const groupedArray = Object.values(groupedRequests);
      
      if (!search.trim()) return groupedArray;
      const q = search.toLowerCase();
      return groupedArray.filter((item: any) => {
        return [
          item.resident_id?.full_name,
          item.family_member_id?.full_name,
          item.note,
          item.request_type === 'room_change' ? 'đổi phòng' :
          item.request_type === 'service_date_change' ? 'gia hạn dịch vụ' :
          item.request_type === 'care_plan_change' ? 'đổi gói dịch vụ' : '',
          item.target_room_id?.room_number,
          item.target_bed_id?.bed_number,
          item.target_service_package_id?.plan_name,
          item.new_end_date ? new Date(item.new_end_date).toLocaleDateString('vi-VN') : ''
        ]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q));
      });
    }
  }, [search, activeTab, pendingUsers, pendingRoomChangeRequests]);

  const approve = async (id: string) => {
    try {
      setBusyId(id);
      await userAPI.approveUser(id);
      const u = pendingUsers.find((x: any) => x._id === id);
      
      // Optimistically update the cache
      mutateUsers((currentData: any) => {
        if (!currentData) return currentData;
        return currentData.filter((user: any) => user._id !== id);
      }, false);
      
      // Add notification for admin
      addNotification({
        type: 'success',
        title: 'Phê duyệt tài khoản thành công',
        message: `Tài khoản ${u?.full_name || u?.username || 'người dùng'} đã được phê duyệt thành công.`,
        category: 'system',
        actionUrl: '/admin/approvals'
      });

      // Create notification for family member
      const familyNotification = {
        id: `approve_user_${id}_${Date.now()}`,
        type: 'success' as const,
        title: 'Tài khoản được phê duyệt',
        message: `Tài khoản của bạn đã được phê duyệt thành công! Bạn có thể đăng nhập và sử dụng hệ thống ngay bây giờ.`,
        category: 'system' as const,
        timestamp: new Date().toISOString(),
        read: false,
        userId: id
      };

      // Store notification for family member
      const existingNotifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
      existingNotifications.push(familyNotification);
      localStorage.setItem('familyNotifications', JSON.stringify(existingNotifications));
      
      setSuccessTitle('Phê duyệt tài khoản thành công!');
      setSuccessName(u?.full_name || u?.username || 'Tài khoản');
      setSuccessActionType('approve');
      setSuccessDetails('Tài khoản đã được phê duyệt thành công. Người dùng có thể đăng nhập và sử dụng hệ thống.');
      setSuccessOpen(true);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setRejectingId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    
    try {
      setBusyId(rejectingId);
      setShowRejectModal(false);
      
      await userAPI.deactivateUser(rejectingId, rejectReason || undefined);
      const u = pendingUsers.find((x: any) => x._id === rejectingId);
      
      // Optimistically update the cache
      mutateUsers((currentData: any) => {
        if (!currentData) return currentData;
        return currentData.filter((user: any) => user._id !== rejectingId);
      }, false);
      
      // Add notification for admin
      addNotification({
        type: 'warning',
        title: 'Từ chối tài khoản',
        message: `Tài khoản ${u?.full_name || u?.username || 'người dùng'} đã bị từ chối${rejectReason ? ` với lý do: ${rejectReason}` : ''}.`,
        category: 'system',
        actionUrl: '/admin/approvals'
      });

      // Create notification for family member
      const familyNotification = {
        id: `reject_user_${rejectingId}_${Date.now()}`,
        type: 'warning' as const,
        title: 'Tài khoản bị từ chối',
        message: `Tài khoản của bạn đã bị từ chối${rejectReason ? ` với lý do: ${rejectReason}` : ''}. Vui lòng liên hệ quản trị viên để được hỗ trợ.`,
        category: 'system' as const,
        timestamp: new Date().toISOString(),
        read: false,
        userId: rejectingId
      };

      // Store notification for family member
      const existingNotifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
      existingNotifications.push(familyNotification);
      localStorage.setItem('familyNotifications', JSON.stringify(existingNotifications));
      
      setSuccessTitle('Đã từ chối tài khoản');
      setSuccessName(u?.full_name || u?.username || 'Tài khoản');
      setSuccessActionType('reject');
      setSuccessDetails(rejectReason ? `Lý do từ chối: ${rejectReason}` : 'Tài khoản đã bị từ chối.');
      setSuccessOpen(true);
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  const approveRoomChange = async (id: string) => {
    try {
      setBusyId(id);
      
      // Find the grouped request
      const groupedRequest = filtered.find((x: any) => x._id === id);
      if (!groupedRequest) {
        addNotification({
          type: 'warning',
          title: 'Không tìm thấy yêu cầu',
          message: 'Không thể xác định nhóm yêu cầu để phê duyệt.',
          category: 'system',
          actionUrl: '/admin/approvals'
        });
        return;
      }
      const requestsToApprove = groupedRequest?.groupedRequests || [groupedRequest];

      // Pre-validate required fields expected by BE (e.g., selected_room_type)
      for (const req of requestsToApprove) {
        if (req?.request_type === 'care_plan_change' && !req?.selected_room_type) {
          // Try to infer from current room to help admin understand
          const residentId = req?.resident_id?._id || req?.resident_id;
          let inferredRoomType: string | undefined;
          try {
            const { room } = getCurrentRoomAndBed(residentId);
            inferredRoomType = room?.room_type;
          } catch {}
          addNotification({
            type: 'warning',
            title: 'Thiếu thông tin bắt buộc',
            message: `Yêu cầu đổi gói dịch vụ thiếu selected_room_type.${inferredRoomType ? ` Gợi ý: loại phòng hiện tại là "${inferredRoomType}".` : ''} Vui lòng cập nhật yêu cầu hoặc yêu cầu người dùng gửi lại.`,
            category: 'system',
            actionUrl: '/admin/approvals'
          });
          setBusyId(null);
          return;
        }
      }
      
      // Approve all requests in the group (sequential for clearer error handling)
      for (const req of requestsToApprove) {
        try {
          await serviceRequestsAPI.approve(req._id);
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Không thể thực hiện thay đổi. Vui lòng kiểm tra dữ liệu yêu cầu.';
          addNotification({
            type: 'warning',
            title: 'Phê duyệt thất bại',
            message: `${msg} (ID: ${req?._id || ''})`,
            category: 'system',
            actionUrl: '/admin/approvals'
          });
          // Stop on first failure
          return;
        }
      }
      
      const request = requestsToApprove[0];
      const count = requestsToApprove.length;
      
      // Optimistically update the cache
      mutateRequests((currentData: any) => {
        if (!currentData) return currentData;
        const requestIds = requestsToApprove.map((r: any) => r._id);
        return currentData.filter((req: any) => !requestIds.includes(req._id));
      }, false);
      
      // Add notification for admin
      addNotification({
        type: 'success',
        title: 'Phê duyệt yêu cầu thành công',
        message: `Đã phê duyệt ${count} yêu cầu của ${request?.resident_id?.full_name || 'người dùng'}.`,
        category: 'system',
        actionUrl: '/admin/approvals'
      });

      // Create notification for family member
      const familyNotification = {
        id: `approve_requests_${id}_${Date.now()}`,
        type: 'success' as const,
        title: 'Yêu cầu được phê duyệt',
        message: `Đã phê duyệt ${count} yêu cầu của ${request?.resident_id?.full_name || 'người thân'}.`,
        category: 'system' as const,
        timestamp: new Date().toISOString(),
        read: false,
        userId: request?.family_member_id?._id || request?.family_member_id
      };

      // Store notification for family member
      const existingNotifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
      existingNotifications.push(familyNotification);
      localStorage.setItem('familyNotifications', JSON.stringify(existingNotifications));
      
      setSuccessTitle('Phê duyệt yêu cầu thành công!');
      setSuccessName(request?.resident_id?.full_name || 'Người dùng');
      setSuccessActionType('approve');
      setSuccessDetails(`Đã phê duyệt ${count} yêu cầu thành công.`);
      setSuccessOpen(true);
    } finally {
      setBusyId(null);
    }
  };

  const rejectRoomChange = async (id: string) => {
    setRejectingId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectRoomChangeConfirm = async () => {
    if (!rejectingId) return;
    
    try {
      setBusyId(rejectingId);
      setShowRejectModal(false);
      
      // Find the grouped request
      const groupedRequest = filtered.find((x: any) => x._id === rejectingId);
      if (!groupedRequest) {
        addNotification({
          type: 'warning',
          title: 'Không tìm thấy yêu cầu',
          message: 'Không thể xác định nhóm yêu cầu để từ chối.',
          category: 'system',
          actionUrl: '/admin/approvals'
        });
        return;
      }
      const requestsToReject = groupedRequest?.groupedRequests || [groupedRequest];
      
      // Reject all requests in the group (sequential)
      for (const req of requestsToReject) {
        try {
          await serviceRequestsAPI.reject(req._id, rejectReason || undefined);
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Không thể từ chối yêu cầu.';
          addNotification({
            type: 'warning',
            title: 'Từ chối thất bại',
            message: `${msg} (ID: ${req?._id || ''})`,
            category: 'system',
            actionUrl: '/admin/approvals'
          });
          return;
        }
      }
      
      const request = requestsToReject[0];
      const count = requestsToReject.length;
      
      // Optimistically update the cache
      mutateRequests((currentData: any) => {
        if (!currentData) return currentData;
        const requestIds = requestsToReject.map((r: any) => r._id);
        return currentData.filter((req: any) => !requestIds.includes(req._id));
      }, false);
      
      // Add notification for admin
      addNotification({
        type: 'warning',
        title: 'Từ chối yêu cầu',
        message: `Đã từ chối ${count} yêu cầu của ${request?.resident_id?.full_name || 'người dùng'}${rejectReason ? ` với lý do: ${rejectReason}` : ''}.`,
        category: 'system',
        actionUrl: '/admin/approvals'
      });

      // Create notification for family member
      const familyNotification = {
        id: `reject_requests_${rejectingId}_${Date.now()}`,
        type: 'warning' as const,
        title: 'Yêu cầu bị từ chối',
        message: `Đã từ chối ${count} yêu cầu của ${request?.resident_id?.full_name || 'người thân'}${rejectReason ? ` với lý do: ${rejectReason}` : ''}. Vui lòng liên hệ quản trị viên để được hỗ trợ thêm.`,
        category: 'system' as const,
        timestamp: new Date().toISOString(),
        read: false,
        userId: request?.family_member_id?._id || request?.family_member_id
      };

      // Store notification for family member
      const existingNotifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
      existingNotifications.push(familyNotification);
      localStorage.setItem('familyNotifications', JSON.stringify(existingNotifications));
      
      setSuccessTitle('Đã từ chối yêu cầu');
      setSuccessName(request?.resident_id?.full_name || 'Người dùng');
      setSuccessActionType('reject');
      setSuccessDetails(rejectReason ? `Đã từ chối ${count} yêu cầu. Lý do: ${rejectReason}` : `Đã từ chối ${count} yêu cầu.`);
      setSuccessOpen(true);
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  // Residents approval flow removed

  const goToDetails = (item: any) => {
    router.push(`/admin/approvals/${item._id}`);
    return;
  };

  if (!user || user.role !== "admin") return null;

  // Show loading state
  if (isLoading || isRequestsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Đang tải dữ liệu...</h3>
          <p className="text-slate-600 text-sm">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (usersError || requestsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-slate-600 text-sm mb-4">
            Không thể tải danh sách phê duyệt. Vui lòng thử lại sau.
          </p>
          <button
            onClick={() => {
              mutateUsers();
              mutateRequests();
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-violet-600 hover:to-indigo-700 transition-all duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
      
        {/* Header Section */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
                className="group p-3 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-blue-100 hover:to-indigo-100 text-slate-700 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <ShieldCheckIconSolid className="w-7 h-7 text-white" />
              </div>
            <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 mb-2 tracking-tight">
                  Phê Duyệt Đăng Ký
              </h1>
                <p className="text-base text-slate-600 font-semibold flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-violet-500" />
                  Quản lý và duyệt tài khoản người dùng
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 px-6 py-4 rounded-2xl border border-violet-200/50 shadow-md">
                <div className="text-center">
                  <div className="text-xs text-violet-600 font-bold mb-1 uppercase tracking-wide">
                    Chờ duyệt
                  </div>
                  <div className="text-2xl font-black text-violet-700 mb-1">
                    {pendingUsers.length}
                  </div>
                  <div className="text-xs text-violet-600 font-semibold">
                    tài khoản
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 px-6 py-4 rounded-2xl border border-orange-200/50 shadow-md">
                <div className="text-center">
                  <div className="text-xs text-orange-600 font-bold mb-1 uppercase tracking-wide">
                    Yêu cầu dịch vụ
                  </div>
                  <div className="text-2xl font-black text-orange-700 mb-1">
                    {pendingRoomChangeRequests.length}
                  </div>
                  <div className="text-xs text-orange-600 font-semibold">
                    chờ duyệt
                  </div>
                </div>
              </div>
          </div>
        </div>

          {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-md ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-violet-500/25 transform scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <UserGroupIcon className="w-4 h-4" />
                Tài khoản người dùng ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('service-requests')}
                className={`px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-md ${
                  activeTab === 'service-requests'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/25 transform scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                Yêu cầu dịch vụ ({pendingRoomChangeRequests.length})
              </button>
            </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md flex items-center justify-center">
                <FunnelIcon className="w-4 h-4 text-white" />
              </div>
              Tìm kiếm và lọc
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              {activeTab === 'users' 
                ? 'Tìm kiếm tài khoản chờ duyệt theo thông tin cá nhân'
                : 'Tìm kiếm yêu cầu dịch vụ theo tên người dùng, loại yêu cầu, ghi chú'
              }
            </p>
          </div>
          
          <div className="relative group">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-violet-500 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'users' 
                ? "Tìm theo họ tên, email, số điện thoại..."
                : "Tìm theo tên người dùng, loại yêu cầu, ghi chú..."
              }
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 shadow-md hover:shadow-lg font-medium text-slate-700 group-hover:border-violet-300"
            />
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-violet-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-violet-700 mb-2 flex items-center gap-2">
                  <div className={`w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center ${
                    activeTab === 'users' 
                      ? 'from-violet-500 to-indigo-600' 
                      : 'from-orange-500 to-red-600'
                  }`}>
                    {activeTab === 'users' ? (
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    ) : (
                      <HomeIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {activeTab === 'users' ? 'Danh sách tài khoản chờ duyệt' : 'Danh sách yêu cầu dịch vụ'}
                </h2>
                <p className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-violet-500" />
                  Hiển thị {filtered.length} trong tổng số {activeTab === 'users' ? pendingUsers.length : pendingRoomChangeRequests.length} {activeTab === 'users' ? 'tài khoản' : 'yêu cầu'}
                </p>
              </div>
              <div className="text-xs text-slate-600 bg-gradient-to-r from-violet-100 to-indigo-100 px-3 py-2 rounded-xl border border-violet-200/50 font-semibold shadow-md">
                <ExclamationTriangleIcon className="w-4 h-4 text-violet-500 inline mr-1" />
                Cần xem xét kỹ lưỡng
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-gradient-to-br from-slate-50 to-violet-50/30">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-violet-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                {activeTab === 'users' ? (
                  <ShieldCheckIcon className="w-8 h-8 text-slate-500" />
                ) : (
                  <HomeIcon className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-3">
                {activeTab === 'users' ? 'Không có tài khoản chờ duyệt' : 'Không có yêu cầu dịch vụ'}
              </h3>
              <p className="text-slate-600 leading-relaxed max-w-md mx-auto text-sm font-medium">
                {activeTab === 'users' 
                  ? 'Tất cả tài khoản đã được xử lý. Hệ thống sẽ tự động cập nhật khi có yêu cầu mới.'
                  : 'Tất cả yêu cầu dịch vụ đã được xử lý. Hệ thống sẽ tự động cập nhật khi có yêu cầu mới.'
                }
              </p>
            </div>
              ) : (
                <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                    <thead>
                  <tr className={`bg-gradient-to-r ${
                    activeTab === 'users' 
                      ? 'from-violet-600 via-indigo-600 to-purple-600'
                      : 'from-orange-600 via-red-600 to-pink-600'
                  }`}>
                    {activeTab === 'users' ? (
                      <>
                        <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Thông tin người dùng
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Email
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Số điện thoại
                          </div>
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Người dùng
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" />
                            Loại yêu cầu
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" />
                            Chi tiết yêu cầu
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" />
                            Ghi chú
                          </div>
                        </th>
                      </>
                    )}
                    <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[160px]">
                      <div className="flex items-center justify-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" />
                        Thao tác
                      </div>
                    </th>
                      </tr>
                    </thead>
                    <tbody>
                  {filtered.map((item, index) => (
                    <tr 
                      key={item._id} 
                      className={`border-b border-slate-200/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 hover:shadow-lg hover:shadow-violet-100/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {activeTab === 'users' ? (
                        <>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md bg-gradient-to-br from-violet-100 to-indigo-100 border border-white">
                                <img
                                  src={item.avatar ? userAPI.getAvatarUrl(item.avatar) : '/default-avatar.svg'}
                                  alt={item.full_name || item.username || 'User'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-avatar.svg';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-800 truncate text-sm">
                                  {item.full_name || item.username || '---'}
                                </div>
                                <div className={`text-xs inline-flex items-center px-2 py-1 rounded-md font-semibold shadow-sm ${getStatusBadgeClass(item.status)}`}>
                                  <ClockIcon className="w-3 h-3 mr-1" />
                                    {getStatusLabel(item.status)}
                                  </div>
                                </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-800 text-sm">{item.email || '---'}</div>
                            <div className="text-slate-500 text-xs">Email đăng ký</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-800 text-sm">{item.phone || '---'}</div>
                            <div className="text-slate-500 text-xs">Số liên hệ</div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => goToDetails(item)}
                                title="Xem chi tiết"
                                aria-label="Xem chi tiết"
                                className="w-9 h-9 rounded-xl bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700 inline-flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => approve(item._id)}
                                disabled={busyId === item._id}
                                title="Phê duyệt tài khoản"
                                aria-label="Phê duyệt"
                                className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                              >
                                {busyId === item._id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircleIconSolid className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => reject(item._id)}
                                disabled={busyId === item._id}
                                title="Từ chối tài khoản"
                                aria-label="Từ chối"
                                className="w-9 h-9 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                              >
                                {busyId === item._id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircleIconSolid className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md bg-gradient-to-br from-orange-100 to-red-100 border border-white">
                                <UserIcon className="w-5 h-5 text-orange-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-800 truncate text-sm">
                                  {item.resident_id?.full_name || '---'}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.family_member_id?.full_name || '---'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-800 text-sm">
                              {item.request_type === 'room_change' ? 'Đổi phòng' :
                               item.request_type === 'service_date_change' ? `Gia hạn dịch vụ${item.count > 1 ? ` (${item.count} gói)` : ''}` :
                               item.request_type === 'care_plan_change' ? `Đổi gói dịch vụ${item.count > 1 ? ` (${item.count} gói)` : ''}` :
                               item.request_type || '---'}
                            </div>
                            <div className="text-slate-500 text-xs">Loại yêu cầu</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-800 text-sm">
                              {item.request_type === 'room_change' ? (
                                <>
                                  <div>Phòng: {item.target_room_id?.room_number || '---'}</div>
                                  <div>Giường: {item.target_bed_id?.bed_number || '---'}</div>
                                </>
                              ) : item.request_type === 'service_date_change' ? (
                                <>
                                  <div>
                                    Ngày hết hạn mới: {
                                      (() => {
                                        const dates = (item.groupedRequests || [item])
                                          .map((r: any) => r.new_end_date)
                                          .filter(Boolean)
                                          .map((d: string) => new Date(d).toLocaleDateString('vi-VN'));
                                        return dates.length ? [...new Set(dates)].join(', ') : '---';
                                      })()
                                    }
                                  </div>
                                </>
                              ) : item.request_type === 'care_plan_change' ? (
                                <>
                                  <div>
                                    Gói mới: {
                                      (() => {
                                        const names = (item.groupedRequests || [item])
                                          .map((r: any) => r.target_service_package_id?.plan_name)
                                          .filter(Boolean);
                                        return names.length ? [...new Set(names)].join(', ') : (item.target_service_package_id?.plan_name || '---');
                                      })()
                                    }
                                  </div>
                                </>
                              ) : '---'}
                            </div>
                            <div className="text-slate-500 text-xs">Chi tiết yêu cầu</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-800 text-sm">{item.note || '---'}</div>
                            <div className="text-slate-500 text-xs">Ghi chú yêu cầu</div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => approveRoomChange(item._id)}
                                disabled={busyId === item._id}
                                title="Phê duyệt yêu cầu"
                                aria-label="Phê duyệt"
                                className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                              >
                                {busyId === item._id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircleIconSolid className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => rejectRoomChange(item._id)}
                                disabled={busyId === item._id}
                                title="Từ chối yêu cầu"
                                aria-label="Từ chối"
                                className="w-9 h-9 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                              >
                                {busyId === item._id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircleIconSolid className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

        <ApprovalSuccessModal
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            if (nextUrlAfterSuccess) {
              const url = nextUrlAfterSuccess;
              setNextUrlAfterSuccess(null);
              try { router.push(url); } catch {}
            }
          }}
          title={successTitle}
          name={successName}
          actionType={successActionType}
          details={successDetails}
        />

        {/* Reject Reason Modal */}
        <RejectReasonModal
          open={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectingId(null);
            setRejectReason("");
          }}
          onConfirm={activeTab === 'users' ? handleRejectConfirm : handleRejectRoomChangeConfirm}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          isProcessing={busyId === rejectingId}
          type={activeTab === 'users' ? 'user' : 'service-request'}
        />
      </div>
    </div>
  );
}

// Approval Success Modal Component
function ApprovalSuccessModal({ 
  open, 
  onClose, 
  title, 
  name, 
  actionType, 
  details 
}: { 
  open: boolean; 
  onClose: () => void; 
  title?: string; 
  name?: string; 
  actionType?: string; 
  details?: string; 
}) {
  if (!open) return null;

  const isApproved = actionType === 'approve';
  const isRejected = actionType === 'reject';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 max-w-md w-full shadow-xl border border-white/50 backdrop-blur-sm relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
            isApproved 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25' 
              : isRejected
                ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/25'
                : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/25'
          }`}>
            {isApproved ? (
              <CheckCircleIconSolid className="w-8 h-8 text-white" />
            ) : isRejected ? (
              <XCircleIconSolid className="w-8 h-8 text-white" />
            ) : (
              <ShieldCheckIconSolid className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-black text-slate-800 mb-2 tracking-tight">
            {title || 'Thành công!'}
          </h2>
        </div>

        {/* Name */}
        {name && (
          <div className="text-center mb-4">
            <div className="text-slate-600 font-semibold mb-1 text-sm">
              {isApproved ? 'Đã phê duyệt:' : isRejected ? 'Đã từ chối:' : 'Đối tượng:'}
            </div>
            <div className="text-base font-bold text-slate-800">
              {name}
            </div>
          </div>
        )}

        {/* Details */}
        {details && (
          <div className={`rounded-xl p-3 mb-4 border ${
            isApproved 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' 
              : isRejected
                ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
          }`}>
            <div className={`text-xs text-center leading-relaxed ${
              isApproved ? 'text-emerald-800' : isRejected ? 'text-rose-800' : 'text-slate-700'
            }`}>
              {details}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-xl font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
              isApproved 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' 
                : isRejected
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700'
            }`}
          >
            {isApproved ? 'Tiếp tục' : isRejected ? 'Đóng' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reject Reason Modal Component
function RejectReasonModal({ 
  open, 
  onClose, 
  onConfirm, 
  reason, 
  onReasonChange, 
  isProcessing,
  type 
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  reason: string; 
  onReasonChange: (reason: string) => void; 
  isProcessing: boolean;
  type: 'user' | 'service-request';
}) {
  if (!open) return null;

  const isUserReject = type === 'user';
  const title = isUserReject ? 'Từ chối tài khoản' : 'Từ chối yêu cầu dịch vụ';
  const placeholder = isUserReject 
    ? 'Nhập lý do từ chối tài khoản (tùy chọn)...' 
    : 'Nhập lý do từ chối yêu cầu dịch vụ (tùy chọn)...';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 max-w-md w-full shadow-xl border border-white/50 backdrop-blur-sm relative">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/25">
            <XCircleIconSolid className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-black text-slate-800 mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            {isUserReject 
              ? 'Vui lòng nhập lý do từ chối tài khoản này'
              : 'Vui lòng nhập lý do từ chối yêu cầu dịch vụ này'
            }
          </p>
        </div>

        {/* Reason Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Lý do từ chối
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={placeholder}
            disabled={isProcessing}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 shadow-md hover:shadow-lg font-medium text-slate-700 resize-none h-24 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <div className="text-xs text-slate-500 mt-1 text-right">
            {reason.length}/500 ký tự
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-6 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận từ chối'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


