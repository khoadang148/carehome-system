"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { serviceRequestsAPI, carePlansAPI, bedAssignmentsAPI, bedsAPI, roomsAPI, carePlanAssignmentsAPI, residentAPI } from "@/lib/api";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, UserIcon, CalendarDaysIcon, DocumentTextIcon, CurrencyDollarIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";

export default function ServiceRequestDetailsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any | null>(null);
  const [groupPreview, setGroupPreview] = useState<any | null>(null);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | undefined>(undefined);
  const [successName, setSuccessName] = useState<string | undefined>(undefined);
  const [successActionType, setSuccessActionType] = useState<string | undefined>(undefined);
  const [successDetails, setSuccessDetails] = useState<string | undefined>(undefined);
  const [planDetails, setPlanDetails] = useState<Record<string, any>>({});
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [bedAssignmentDetails, setBedAssignmentDetails] = useState<Record<string, any>>({});
  const [bedDetails, setBedDetails] = useState<Record<string, any>>({});
  const [roomDetails, setRoomDetails] = useState<Record<string, any>>({});
  const [bedAssignmentErrors, setBedAssignmentErrors] = useState<Record<string, string>>({});
  const [residentBedAssignments, setResidentBedAssignments] = useState<Record<string, any[]>>({});
  const [residentBedAssignmentErrors, setResidentBedAssignmentErrors] = useState<Record<string, string>>({});
  const [carePlanAssignmentDetails, setCarePlanAssignmentDetails] = useState<Record<string, any>>({});
  const [carePlanAssignmentErrors, setCarePlanAssignmentErrors] = useState<Record<string, string>>({});
  const [residentDetails, setResidentDetails] = useState<Record<string, any>>({});
  const [residentErrors, setResidentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem("serviceRequestPreview") : null;
      if (cached) setGroupPreview(JSON.parse(cached));
    } catch { }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Backend doesn't have getById endpoint, so fetch all and find the specific one
        try {
          const all = await serviceRequestsAPI.getAll();
          const found = Array.isArray(all) ? all.find((x: any) => x?._id === id) : null;
          if (mounted && found) {
            setRequest(found);
            console.log('Service request found:', found);
            console.log('Service request data structure:', {
              id: found._id,
              request_type: found.request_type,
              resident_id: found.resident_id,
              target_bed_assignment_id: found.target_bed_assignment_id,
              target_room_id: found.target_room_id,
              target_bed_id: found.target_bed_id,
              note: found.note,
              status: found.status
            });
          } else {
            console.log('Service request not found for ID:', id);
          }
        } catch (error) {
          console.error('Error fetching service requests:', error);
        }
      } catch (_) {
        /* noop */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const grouped = useMemo(() => groupPreview?.groupedRequests || (request ? [request] : []), [groupPreview, request]);
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "---");
  const typeLabel = (t?: string) => t === 'room_change' ? 'Đổi phòng' : t === 'service_date_change' ? 'Gia hạn dịch vụ' : t === 'care_plan_change' ? 'Đổi gói dịch vụ' : (t || '---');
  const typeColor = (t?: string) => t === 'room_change' ? 'from-orange-500 to-red-600' : t === 'service_date_change' ? 'from-emerald-500 to-teal-600' : 'from-violet-500 to-indigo-600';
  const formatCurrency = (n?: number) => typeof n === 'number' ? n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }) : '---';

  // Fetch care plan details when needed
  useEffect(() => {
    const uniquePlanIds = Array.from(new Set((grouped || [])
      .filter((r: any) => r?.request_type === 'care_plan_change')
      .map((r: any) => r?.target_service_package_id?._id || r?.target_service_package_id)
      .filter(Boolean)));
    if (uniquePlanIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, any> = {};
      for (const pid of uniquePlanIds) {
        if (planDetails[pid as string]) continue;
        try {
          const detail = await carePlansAPI.getById(pid as string);
          if (!cancelled) updates[pid as string] = detail;
        } catch { }
      }
      if (!cancelled && Object.keys(updates).length) {
        setPlanDetails(prev => ({ ...prev, ...updates }));
      }
    })();
    return () => { cancelled = true; };
  }, [grouped]);

  // Fetch additional data for room change requests
  useEffect(() => {
    const roomChangeRequests = (grouped || []).filter((r: any) => r?.request_type === 'room_change');

    console.log('Room change requests found:', roomChangeRequests);

    if (roomChangeRequests.length === 0) return;

    let cancelled = false;
    (async () => {
      const bedAssignmentUpdates: Record<string, any> = {};
      const bedUpdates: Record<string, any> = {};
      const roomUpdates: Record<string, any> = {};

      for (const request of roomChangeRequests) {
        // Fetch target bed assignment details if target_bed_assignment_id exists
        if (request?.target_bed_assignment_id) {
          const baId = request.target_bed_assignment_id;
          if (!bedAssignmentDetails[baId] && !bedAssignmentErrors[baId]) {
            try {
              console.log('Fetching bed assignment for ID:', baId);
              // Backend doesn't have getById, so we need to fetch all and find the specific one
              const allBedAssignments = await bedAssignmentsAPI.getAll();
              const bedAssignment = Array.isArray(allBedAssignments)
                ? allBedAssignments.find((ba: any) => ba._id === baId)
                : null;

              if (bedAssignment) {
                console.log('Bed assignment fetched:', bedAssignment);
                if (!cancelled) bedAssignmentUpdates[baId] = bedAssignment;

                // Fetch bed and room details for target
                if (bedAssignment?.bed_id) {
                  const bedId = typeof bedAssignment.bed_id === 'string'
                    ? bedAssignment.bed_id
                    : bedAssignment.bed_id._id;

                  if (!bedDetails[bedId]) {
                    try {
                      const bed = await bedsAPI.getById(bedId);
                      console.log('Target bed fetched:', bed);
                      if (!cancelled) bedUpdates[bedId] = bed;

                      // Fetch room details
                      if (bed?.room_id) {
                        const roomId = typeof bed.room_id === 'string'
                          ? bed.room_id
                          : bed.room_id._id;

                        if (!roomDetails[roomId]) {
                          try {
                            const room = await roomsAPI.getById(roomId);
                            console.log('Target room fetched:', room);
                            if (!cancelled) roomUpdates[roomId] = room;
                          } catch (error) {
                            console.error('Error fetching target room:', error);
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error fetching target bed:', error);
                    }
                  }
                }
              } else {
                console.log('Bed assignment not found for ID:', baId);
                if (!cancelled) {
                  setBedAssignmentErrors(prev => ({ ...prev, [baId]: 'Bed assignment not found' }));
                }
              }
            } catch (error) {
              console.error('Error fetching target bed assignment:', error);
              if (!cancelled) {
                setBedAssignmentErrors(prev => ({ ...prev, [baId]: 'Error fetching bed assignment' }));
              }
            }
          }
        }

        // Fetch current bed assignments for each resident to get current room/bed info
        if (request?.resident_id) {
          const residentId = typeof request.resident_id === 'string'
            ? request.resident_id
            : request.resident_id._id;

          try {
            console.log('Fetching current bed assignments for resident:', residentId);
            const currentAssignments = await bedAssignmentsAPI.getAllStatuses({ resident_id: residentId });
            console.log('Current assignments:', currentAssignments);

            // Store the assignments for this resident
            if (!cancelled && Array.isArray(currentAssignments)) {
              setResidentBedAssignments(prev => ({ ...prev, [residentId]: currentAssignments }));
            }

            // Find active assignment
            const activeAssignment = Array.isArray(currentAssignments)
              ? currentAssignments.find((a: any) => !a.unassigned_date && a.status === 'active')
              : null;

            if (activeAssignment) {
              console.log('Active assignment found:', activeAssignment);

              // Fetch current bed and room details
              const currentBedId = typeof activeAssignment.bed_id === 'string'
                ? activeAssignment.bed_id
                : activeAssignment.bed_id?._id;

              if (currentBedId && !bedDetails[currentBedId]) {
                try {
                  const currentBed = await bedsAPI.getById(currentBedId);
                  console.log('Current bed fetched:', currentBed);
                  if (!cancelled) bedUpdates[currentBedId] = currentBed;

                  // Fetch current room details
                  if (currentBed?.room_id) {
                    const currentRoomId = typeof currentBed.room_id === 'string'
                      ? currentBed.room_id
                      : currentBed.room_id._id;

                    if (!roomDetails[currentRoomId]) {
                      try {
                        const currentRoom = await roomsAPI.getById(currentRoomId);
                        console.log('Current room fetched:', currentRoom);
                        if (!cancelled) roomUpdates[currentRoomId] = currentRoom;
                      } catch (error) {
                        console.error('Error fetching current room:', error);
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error fetching current bed:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching current assignments:', error);
            if (!cancelled) {
              setResidentBedAssignmentErrors(prev => ({ 
                ...prev, 
                [residentId]: 'Error fetching bed assignments' 
              }));
            }
          }
        }
      }

      if (!cancelled) {
        console.log('Updating states with:', { bedAssignmentUpdates, bedUpdates, roomUpdates });
        if (Object.keys(bedAssignmentUpdates).length) {
          setBedAssignmentDetails(prev => ({ ...prev, ...bedAssignmentUpdates }));
        }
        if (Object.keys(bedUpdates).length) {
          setBedDetails(prev => ({ ...prev, ...bedUpdates }));
        }
        if (Object.keys(roomUpdates).length) {
          setRoomDetails(prev => ({ ...prev, ...roomUpdates }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [grouped]);

  // Fetch care plan assignment details for service date change requests
  useEffect(() => {
    const serviceDateChangeRequests = (grouped || []).filter((r: any) => r?.request_type === 'service_date_change');

    if (serviceDateChangeRequests.length === 0) return;

    let cancelled = false;
    (async () => {
      const carePlanAssignmentUpdates: Record<string, any> = {};

      for (const request of serviceDateChangeRequests) {
        if (request?.current_care_plan_assignment_id) {
          const cpaId = request.current_care_plan_assignment_id;
          if (!carePlanAssignmentDetails[cpaId] && !carePlanAssignmentErrors[cpaId]) {
            try {
              console.log('Fetching care plan assignment for ID:', cpaId);
              const carePlanAssignment = await carePlanAssignmentsAPI.getById(cpaId);
              console.log('Care plan assignment fetched:', carePlanAssignment);
              if (!cancelled) carePlanAssignmentUpdates[cpaId] = carePlanAssignment;
            } catch (error) {
              console.error('Error fetching care plan assignment:', error);
              if (!cancelled) {
                setCarePlanAssignmentErrors(prev => ({ ...prev, [cpaId]: 'Error fetching care plan assignment' }));
              }
            }
          }
        }
      }

      if (!cancelled && Object.keys(carePlanAssignmentUpdates).length) {
        setCarePlanAssignmentDetails(prev => ({ ...prev, ...carePlanAssignmentUpdates }));
      }
    })();
    return () => { cancelled = true; };
  }, [grouped]);

  // Fetch resident details for emergency contact information
  useEffect(() => {
    const uniqueResidentIds = Array.from(new Set((grouped || [])
      .map((r: any) => typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id)
      .filter(Boolean)));
    
    if (uniqueResidentIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const residentUpdates: Record<string, any> = {};

      for (const residentId of uniqueResidentIds) {
        if (residentDetails[residentId as string] || residentErrors[residentId as string]) continue;
        
        try {
          console.log('Fetching resident details for ID:', residentId);
          const resident = await residentAPI.getById(residentId as string);
          console.log('Resident details fetched:', resident);
          if (!cancelled) residentUpdates[residentId as string] = resident;
        } catch (error) {
          console.error('Error fetching resident details:', error);
          if (!cancelled) {
            setResidentErrors(prev => ({ ...prev, [residentId as string]: 'Error fetching resident details' }));
          }
        }
      }

      if (!cancelled && Object.keys(residentUpdates).length) {
        setResidentDetails(prev => ({ ...prev, ...residentUpdates }));
      }
    })();
    return () => { cancelled = true; };
  }, [grouped]);

  const approve = async () => {
    try {
      setBusy("approve");
      
      // Pre-validate required fields expected by BE (e.g., selected_room_type)
      for (const req of grouped) {
        if (req?.request_type === 'care_plan_change' && !req?.selected_room_type) {
          // Try to infer from current room to help admin understand
          const residentId = req?.resident_id?._id || req?.resident_id;
          let inferredRoomType: string | undefined;
          try {
            const assignments = residentBedAssignments[residentId];
            if (assignments && assignments.length > 0) {
              const assignment = assignments.find(ba => !ba.unassigned_date);
              if (assignment?.bed_id && typeof assignment.bed_id === 'object') {
                const room = assignment.bed_id.room_id;
                if (room && typeof room === 'object') {
                  inferredRoomType = room.room_type;
                }
              }
            }
          } catch {}
          addNotification({
            type: 'warning',
            title: 'Thiếu thông tin bắt buộc',
            message: `Yêu cầu đổi gói dịch vụ thiếu selected_room_type.${inferredRoomType ? ` Gợi ý: loại phòng hiện tại là "${inferredRoomType}".` : ''} Vui lòng cập nhật yêu cầu hoặc yêu cầu người dùng gửi lại.`,
            category: 'system',
            actionUrl: '/admin/approvals'
          });
          setBusy(null);
          return;
        }
      }
      
      // Approve all requests in the group (sequential for clearer error handling)
      for (const req of grouped) {
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
      
      const request = grouped[0];
      const count = grouped.length;
      
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
      
      // Show success modal
      setSuccessTitle('Phê duyệt yêu cầu thành công!');
      setSuccessName(request?.resident_id?.full_name || 'Người dùng');
      setSuccessActionType('approve');
      setSuccessDetails(`Đã phê duyệt ${count} yêu cầu thành công.`);
      setSuccessOpen(true);
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    try {
      setBusy("reject");
      setShowRejectModal(false);
      
      // Reject all requests in the group (sequential)
      for (const req of grouped) {
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
      
      const request = grouped[0];
      const count = grouped.length;
      
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
        id: `reject_requests_${id}_${Date.now()}`,
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
      
      // Show success modal
      setSuccessTitle('Đã từ chối yêu cầu');
      setSuccessName(request?.resident_id?.full_name || 'Người dùng');
      setSuccessActionType('reject');
      setSuccessDetails(rejectReason ? `Đã từ chối ${count} yêu cầu. Lý do: ${rejectReason}` : `Đã từ chối ${count} yêu cầu.`);
      setSuccessOpen(true);
    } finally {
      setBusy(null);
      setRejectReason("");
    }
  };

  const Arrow = () => (<span className="mx-2 text-slate-400 font-bold">→</span>);
  function ChangePreview({ label, from, to, tone }: { label: string; from?: string | null; to?: string | null; tone: 'orange' | 'violet' | 'emerald' }) {
    const toColor = tone === 'orange' ? 'text-orange-700' : tone === 'emerald' ? 'text-emerald-700' : 'text-violet-700';
    return (
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</div>
        {(from && to) ? (
          <div className="flex items-center flex-wrap">
            <span className="font-bold text-slate-700">{from}</span>
            <Arrow />
            <span className={`font-bold ${toColor}`}>{to}</span>
          </div>
        ) : (
          <div className={`font-bold ${toColor}`}>{to || from || '---'}</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 bg-blue-100/80 rounded-xl text-blue-600 hover:bg-blue-200 transition-all duration-200"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <div className="absolute inset-1 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    <DocumentTextIcon className="w-10 h-10 text-blue-500" />
              </div>
                </div>
                
              <div>
                                <div className="mb-4">
                                  <span className="text-sm font-medium text-slate-600 block mb-1">
                                    Chi tiết yêu cầu:
                                  </span>
                                  <h1 className="text-3xl font-bold text-slate-900">
                                    {(() => {
                                      if (grouped.length > 0) {
                                        const firstRequest = grouped[0];
                                        switch(firstRequest.request_type) {
                                          case 'room_change':
                                            return 'Yêu cầu đổi phòng';
                                          case 'service_date_change':
                                            return 'Yêu cầu gia hạn dịch vụ';
                                          case 'care_plan_change':
                                            return 'Yêu cầu đổi gói dịch vụ';
                                          default:
                                            return 'Yêu cầu dịch vụ';
                                        }
                                      }
                                      return 'Yêu cầu dịch vụ';
                                    })()}
                </h1>
              </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-slate-100 rounded-lg px-3 py-1 font-medium">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span>Trạng thái:</span>
                      <span>Chờ xử lý</span>
                    </span>
            </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={approve} 
                disabled={busy !== null} 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {busy === "approve" ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                Phê duyệt
              </button>
              <button 
                onClick={reject} 
                disabled={busy !== null} 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {busy === "reject" ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircleIcon className="w-4 h-4" />
                )}
                Từ chối
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
          {loading && (
            <div className="flex items-center justify-center min-h-96">
              <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
                <div className="w-12 h-12 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-600">
                  Đang tải thông tin yêu cầu dịch vụ...
                </p>
              </div>
            </div>
          )}
          {!loading && grouped.length === 0 && (
            <div className="flex items-center justify-center min-h-96">
              <div className="bg-white rounded-2xl p-12 shadow-xl text-center max-w-md">
                <DocumentTextIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Không tìm thấy yêu cầu
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Yêu cầu dịch vụ này có thể đã bị xóa hoặc không tồn tại
                </p>
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Quay lại danh sách
                </button>
              </div>
            </div>
          )}
          {!loading && grouped.length > 0 && (
            <div className="space-y-8">
                {grouped.map((r: any, idx: number) => {
                  const planId = r?.target_service_package_id?._id || r?.target_service_package_id;
                  const plan = planId ? planDetails[planId] : null;
                  return (
                  <div key={r._id || idx} className="bg-blue-50/30 rounded-2xl p-6 border border-blue-200/30">
                     {/* Request Info Header */}
                     <div className="flex items-center gap-4 mb-6">
                       <div className="relative w-16 h-16">
                         <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                         <div className="absolute inset-1 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                           <UserIcon className="w-8 h-8 text-blue-500" />
                         </div>
                       </div>
                       
                       <div className="flex-1">
                         <div className="mb-3">
                           <span className="text-sm font-medium text-slate-600 block mb-1">
                             Người yêu cầu:
                          </span>
                           <h2 className="text-2xl font-bold text-slate-900">
                             {r.resident_id?.full_name || "Chưa xác định"}
                           </h2>
                         </div>
                         <div className="flex items-center gap-4 flex-wrap">
                           <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-slate-100 rounded-lg px-3 py-1 font-medium">
                             <DocumentTextIcon className="w-4 h-4" />
                             <span>Loại:</span>
                             <span>{typeLabel(r.request_type)}</span>
                           </span>
                           <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-slate-100 rounded-lg px-3 py-1 font-medium">
                             <CalendarDaysIcon className="w-4 h-4" />
                             <span>Ngày gửi:</span>
                             <span>{formatDate(r.createdAt || r.created_at)}</span>
                          </span>
                          {plan && (
                             <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-slate-100 rounded-lg px-3 py-1 font-medium">
                               <CurrencyDollarIcon className="w-4 h-4" />
                               <span>Giá:</span>
                               <span>{formatCurrency(plan.price || plan.plan_price || plan.monthly_price)}</span>
                            </span>
                          )}
                        </div>
                        </div>
                      </div>

                    <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Emergency Contact Information */}
                        <div className="bg-green-50/50 rounded-2xl p-6 border border-green-200/50">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <PhoneIcon className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              Thông tin liên hệ khẩn cấp
                            </h3>
                        </div>

                        {(() => {
                          const residentId = typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id;
                          const resident = residentDetails[residentId];
                          const error = residentErrors[residentId];

                          if (error) {
                            return (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-lg font-semibold text-red-600 mb-1">Lỗi tải thông tin</h4>
                                  <p className="text-sm text-red-500">Không thể tải thông tin liên hệ</p>
                              </div>
                            );
                          }

                          if (!resident) {
                            return (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </div>
                                  <h4 className="text-lg font-semibold text-slate-600 mb-1">Đang tải...</h4>
                                  <p className="text-sm text-slate-500">Đang tải thông tin liên hệ</p>
                              </div>
                            );
                          }

                          // Display emergency contact if available
                          if (resident.emergency_contact) {
                            return (
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <p className="text-xs font-medium text-slate-600 mb-2">
                                      Người liên hệ khẩn cấp
                                    </p>
                                    <p className="text-lg font-semibold text-slate-900">
                                      {resident.emergency_contact.name || 'Chưa có thông tin'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-600 mb-2">
                                      Số điện thoại liên hệ
                                    </p>
                                    <p className="text-lg font-semibold text-slate-900">
                                      {resident.emergency_contact.phone ? (
                                        <a href={`tel:${resident.emergency_contact.phone}`} className="hover:underline text-blue-600">
                                            {resident.emergency_contact.phone}
                                          </a>
                                      ) : 'Chưa có thông tin'}
                                    </p>
                                        </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-600 mb-2">
                                      Mối quan hệ
                                    </p>
                                    <p className="text-lg font-semibold text-slate-900">
                                      {(() => {
                                        const relationship = resident.emergency_contact.relationship;
                                        if (!relationship) return 'Chưa có thông tin';
                                        
                                        // Capitalize first letter of each word
                                        return relationship
                                          .toLowerCase()
                                          .split(' ')
                                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                          .join(' ');
                                      })()}
                                    </p>
                                </div>
                              </div>
                            );
                          }

                            return (
                              <div className="text-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <PhoneIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-slate-600 mb-1">Chưa có thông tin</h4>
                                <p className="text-sm text-slate-500">Chưa có thông tin liên hệ khẩn cấp</p>
                              </div>
                            );
                        })()}
                      </div>

                        {/* Room Change Section */}
                      {r.request_type === 'room_change' && (
                          <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-200/50">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                Chi tiết đổi phòng/giường  
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                  {/* From Room */}
                              <div className="md:col-span-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-4 h-4 bg-slate-500 rounded flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    </svg>
                                  </div>
                                  <p className="text-xs font-medium text-slate-600 uppercase whitespace-nowrap">Từ phòng/giường</p>
                                      </div>
                                      {(() => {
                                        const residentId = typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id;
                                        const assignments = residentBedAssignments[residentId];
                                        const error = residentBedAssignmentErrors[residentId];

                                        if (error) return (
                                    <div className="text-center py-1">
                                      <p className="text-xs text-red-600">Lỗi tải dữ liệu</p>
                                          </div>
                                        );
                                        
                                        if (!Array.isArray(assignments)) return (
                                    <div className="text-center py-1">
                                      <p className="text-xs text-slate-500">Đang tải...</p>
                                          </div>
                                        );

                                        const activeAssignment = assignments.find((a: any) => a.status === 'active' && !a.unassigned_date);
                                        if (activeAssignment?.bed_id) {
                                          const bed = activeAssignment.bed_id;
                                          const room = bed?.room_id;
                                          return (
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-1">Số phòng</div>
                                        <div className="text-xl font-bold text-slate-900 mb-3">
                                          {room?.room_number || 'N/A'}
                                              </div>
                                        
                                        <div className="flex justify-center gap-2 mb-3">
                                          <div className="bg-white rounded px-2 py-1 border border-slate-200 text-xs text-center">
                                            <div className="text-slate-500 mb-1">Giường</div>
                                            <span className="font-medium text-slate-900">{bed?.bed_number || 'N/A'}</span>
                                          </div>
                                          <div className="bg-white rounded px-2 py-1 border border-slate-200 text-xs text-center">
                                            <div className="text-slate-500 mb-1">Tầng</div>
                                            <span className="font-medium text-slate-900">{room?.floor ? `${room.floor}` : 'N/A'}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-center">
                                          <span className="text-xs text-slate-500 mb-1">Phòng dành cho</span>
                                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            room?.gender === 'male' ? 'bg-blue-100 text-blue-700' : 
                                            room?.gender === 'female' ? 'bg-pink-100 text-pink-700' : 
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            {room?.gender === 'male' ? 'Nam' : 
                                             room?.gender === 'female' ? 'Nữ' : 
                                             'N/A'}
                                          </span>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return (
                                    <div className="text-center py-2">
                                      <p className="text-xs text-slate-600">Chưa có thông tin</p>
                                          </div>
                                        );
                                      })()}
                                  </div>

                                  {/* Arrow */}
                                  <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                    </div>
                                  </div>

                                  {/* To Room */}
                              <div className="md:col-span-3 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                  </div>
                                  <p className="text-xs font-medium text-emerald-600 uppercase whitespace-nowrap">Đến phòng/giường</p>
                                      </div>
                                      {(() => {
                                        const residentId = typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id;
                                        const assignments = residentBedAssignments[residentId];
                                        const error = residentBedAssignmentErrors[residentId];

                                        if (error) return (
                                    <div className="text-center py-1">
                                      <p className="text-xs text-red-600">Lỗi tải dữ liệu</p>
                                          </div>
                                        );
                                        
                                        if (!Array.isArray(assignments)) return (
                                    <div className="text-center py-1">
                                      <p className="text-xs text-emerald-600">Đang tải...</p>
                                          </div>
                                        );

                                        const pendingAssignment = assignments.find((a: any) => a.status === 'pending');
                                        if (pendingAssignment?.bed_id) {
                                          const bed = pendingAssignment.bed_id;
                                          const room = bed?.room_id;
                                          return (
                                      <div className="text-center">
                                        <div className="text-xs text-emerald-600 mb-1">Số phòng</div>
                                        <div className="text-xl font-bold text-emerald-900 mb-3">
                                          {room?.room_number || 'N/A'}
                                              </div>
                                        
                                        <div className="flex justify-center gap-2 mb-3">
                                          <div className="bg-white rounded px-2 py-1 border border-emerald-200 text-xs text-center">
                                            <div className="text-emerald-600 mb-1">Giường</div>
                                            <span className="font-medium text-emerald-900">{bed?.bed_number || 'N/A'}</span>
                                          </div>
                                          <div className="bg-white rounded px-2 py-1 border border-emerald-200 text-xs text-center">
                                            <div className="text-emerald-600 mb-1">Tầng</div>
                                            <span className="font-medium text-emerald-900">{room?.floor ? `${room.floor}` : 'N/A'}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-center">
                                          <span className="text-xs text-emerald-600 mb-1">Phòng dành cho</span>
                                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            room?.gender === 'male' ? 'bg-blue-100 text-blue-700' : 
                                            room?.gender === 'female' ? 'bg-pink-100 text-pink-700' : 
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            {room?.gender === 'male' ? 'Nam' : 
                                             room?.gender === 'female' ? 'Nữ' : 
                                             'N/A'}
                                          </span>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return (
                                    <div className="text-center py-2">
                                      <p className="text-xs text-amber-600">Chưa có thông tin</p>
                                          </div>
                                        );
                                      })()}
                                </div>
                              </div>

                            {/* Reason for Room Change */}
                            {r.note && (
                              <div className="mt-6 pt-6 border-t border-orange-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">
                                    Lý do đổi phòng
                                  </p>
                                    </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {r.note}
                                </p>
                              </div>
                            )}
                        </div>
                      )}

                        {/* Service Date Change Section */}
                      {r.request_type === 'service_date_change' && (
                          <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-200/50">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <CalendarDaysIcon className="w-4 h-4 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                Chi tiết gia hạn dịch vụ
                              </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Tên gói dịch vụ
                                </p>
                                <p className="text-lg font-semibold text-slate-900">
                                  {(() => {
                                    const cpaId = r.current_care_plan_assignment_id;
                                    if (!cpaId) return '---';

                                    const carePlanAssignment = carePlanAssignmentDetails[cpaId];
                                    const carePlanAssignmentError = carePlanAssignmentErrors[cpaId];

                                    if (carePlanAssignmentError) {
                                      return `Lỗi: ${carePlanAssignmentError}`;
                                    }

                                    if (!carePlanAssignment) {
                                      return 'Đang tải thông tin...';
                                    }

                                    const carePlan = carePlanAssignment.care_plan_id;
                                    if (carePlan && typeof carePlan === 'object') {
                                      return carePlan.plan_name || carePlan.name || '---';
                                    }

                                    if (carePlanAssignment.plan_name) {
                                      return carePlanAssignment.plan_name;
                                    }

                                    if (carePlanAssignment.care_plan_name) {
                                      return carePlanAssignment.care_plan_name;
                                    }

                                    if (r.medicalNote) {
                                      const match = r.medicalNote.match(/Gia hạn gói: ([^thêm]+)/);
                                      if (match && match[1]) {
                                        return match[1].trim();
                                      }
                                    }

                                    return '---';
                                  })()}
                                </p>
                                </div>
                              
                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Ngày hết hạn mới
                                </p>
                                <p className="text-lg font-semibold text-emerald-700">
                                  {formatDate(r.new_end_date)}
                                </p>
                              </div>
                            </div>

                            {r.medicalNote && (
                              <div className="mt-6 pt-6 border-t border-emerald-200">
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Ghi chú y tế
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {r.medicalNote}
                                </p>
                              </div>
                            )}
                        </div>
                      )}

                        {/* Care Plan Change Section */}
                      {r.request_type === 'care_plan_change' && (
                          <div className="bg-violet-50/50 rounded-2xl p-6 border border-violet-200/50">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <CurrencyDollarIcon className="w-4 h-4 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                Chi tiết gói dịch vụ mới
                              </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Tên gói dịch vụ
                                </p>
                                <p className="text-lg font-semibold text-slate-900">
                                  {plan?.plan_name || r.target_service_package_id?.plan_name || '---'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Giá mỗi tháng
                                </p>
                                <p className="text-lg font-semibold text-emerald-700">
                                  {formatCurrency(plan?.monthly_price || plan?.plan_price || plan?.price)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Thời hạn/Billing
                                </p>
                                <p className="text-lg font-semibold text-slate-900">
                                  {plan?.duration ? `${plan.duration} ngày` : (plan?.billing_cycle || 'Hàng tháng')}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Loại phòng áp dụng
                                </p>
                                <p className="text-lg font-semibold text-slate-900">
                                  {plan?.room_type || plan?.roomCategory || '---'}
                                </p>
                              </div>
                            </div>

                            {plan?.description && (
                              <div className="mt-6 pt-6 border-t border-violet-200">
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Mô tả gói dịch vụ
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {plan.description}
                                </p>
                              </div>
                            )}

                            {Array.isArray(plan?.services_included || plan?.services || plan?.features) && ((plan?.services_included?.length || plan?.services?.length || plan?.features?.length)) && (
                              <div className="mt-6 pt-6 border-t border-violet-200">
                                <p className="text-xs font-medium text-slate-600 mb-3">
                                  Dịch vụ bao gồm
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {(plan.services_included || plan.services || plan.features)
                                    .slice(0, expandedServices[String(plan?._id)] ? undefined : 6)
                                    .map((s: any, i: number) => (
                                      <span key={i} className="bg-violet-100 text-violet-800 text-xs px-3 py-1.5 rounded-full border border-violet-200 font-medium">
                                        {typeof s === 'string' ? s : (s?.name || s?.title || JSON.stringify(s))}
                                      </span>
                                    ))}
                                  {((plan.services_included || plan.services || plan.features)?.length || 0) > 6 && (
                                    <button 
                                      onClick={() => setExpandedServices(prev => ({ ...prev, [String(plan?._id)]: !prev[String(plan?._id)] }))} 
                                      className="bg-violet-200 text-violet-800 text-xs px-3 py-1.5 rounded-full border border-violet-300 font-medium hover:bg-violet-300 transition-colors duration-200"
                                    >
                                      {expandedServices[String(plan?._id)] ? 'Thu gọn' : `+${((plan.services_included || plan.services || plan.features)?.length || 0) - 6} dịch vụ`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <RejectReasonModal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        onConfirm={handleRejectConfirm}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        isProcessing={busy === "reject"}
      />

      {/* Success Modal */}
      <ApprovalSuccessModal
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          router.replace("/admin/approvals?tab=service-requests");
        }}
        title={successTitle}
        name={successName}
        actionType={successActionType}
        details={successDetails}
      />
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
              <CheckCircleIcon className="w-8 h-8 text-white" />
            ) : isRejected ? (
              <XCircleIcon className="w-8 h-8 text-white" />
            ) : (
              <CheckCircleIcon className="w-8 h-8 text-white" />
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
  isProcessing
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  reason: string; 
  onReasonChange: (reason: string) => void; 
  isProcessing: boolean;
}) {
  if (!open) return null;

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
            <XCircleIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-black text-slate-800 mb-2 tracking-tight">
            Từ chối yêu cầu dịch vụ
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Vui lòng nhập lý do từ chối yêu cầu dịch vụ này
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
            placeholder="Nhập lý do từ chối yêu cầu dịch vụ này"
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
