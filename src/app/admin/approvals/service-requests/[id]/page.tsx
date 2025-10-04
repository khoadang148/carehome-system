"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { serviceRequestsAPI, carePlansAPI, bedAssignmentsAPI, bedsAPI, roomsAPI, carePlanAssignmentsAPI, residentAPI } from "@/lib/api";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, UserIcon, CalendarDaysIcon, DocumentTextIcon, CurrencyDollarIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { formatDisplayCurrency } from "@/lib/utils/currencyUtils";

export default function ServiceRequestDetailsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  // Helper function to check if bed assignment is active
  const isBedAssignmentActive = (assignment: any) => {
    if (!assignment) return false;
    if (!assignment.unassigned_date) return true; // null = active
    const unassignedDate = new Date(assignment.unassigned_date);
    const now = new Date();
    return unassignedDate > now; // ngày trong tương lai = active
  };
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
  
  // Helper function to get room type info (similar to room management page)
  const getRoomType = (room_type: string) => {
    // We need to fetch room types data first, but for now we'll use a simple mapping
    const roomTypeMap: Record<string, string> = {
      '1_bed': '1 giường',
      '2_bed': '2 giường', 
      '3_bed': '3 giường',
      '4_bed': '4 giường',
      '4_5_bed': '4-5 giường',
      '6_bed': '6 giường',
      '6_8_bed': '6-8 giường',
      '8_bed': '8 giường',
      'private': 'Phòng riêng',
      'shared': 'Phòng chung',
      'vip': 'Phòng VIP',
      'standard': 'Tiêu chuẩn',
      'deluxe': 'Cao cấp'
    };
    return roomTypeMap[room_type] || room_type.replace('_', ' ').toUpperCase();
  };

  // Fetch care plan details when needed
  useEffect(() => {
    const uniquePlanIds = Array.from(new Set((grouped || [])
      .filter((r: any) => r?.request_type === 'care_plan_change')
      .map((r: any) => r?.target_care_plan_assignment_id?._id || r?.target_care_plan_assignment_id)
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
        } catch (error: any) {
          // Log error but don't break the flow
          console.warn(`Failed to fetch care plan ${pid}:`, error?.response?.status || error?.message);
        }
      }
      if (!cancelled && Object.keys(updates).length) {
        setPlanDetails(prev => ({ ...prev, ...updates }));
      }
    })();
    return () => { cancelled = true; };
  }, [grouped]);

  // Fetch additional data for all requests that need bed info
  useEffect(() => {
    const roomChangeRequests = (grouped || []).filter((r: any) => r?.request_type === 'room_change');
    const serviceDateChangeRequests = (grouped || []).filter((r: any) => r?.request_type === 'service_date_change');
    const carePlanChangeRequests = (grouped || []).filter((r: any) => r?.request_type === 'care_plan_change');
    const allRequestsNeedingBedInfo = [...roomChangeRequests, ...serviceDateChangeRequests, ...carePlanChangeRequests];

    console.log('Requests needing bed info found:', allRequestsNeedingBedInfo);
    console.log('Room change requests:', roomChangeRequests);
    console.log('Service date change requests:', serviceDateChangeRequests);
    console.log('Care plan change requests:', carePlanChangeRequests);

    if (allRequestsNeedingBedInfo.length === 0) return;

    let cancelled = false;
    (async () => {
      const bedAssignmentUpdates: Record<string, any> = {};
      const bedUpdates: Record<string, any> = {};
      const roomUpdates: Record<string, any> = {};

      for (const request of allRequestsNeedingBedInfo) {
        // Fetch target bed assignment details if target_bed_assignment_id exists (for room change requests)
        if (request?.request_type === 'room_change' && request?.target_bed_assignment_id) {
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
            } catch (error: any) {
              console.warn(`Failed to fetch bed assignment ${baId}:`, error?.response?.status || error?.message);
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

          console.log('Processing request for resident:', residentId, 'Request type:', request.request_type);

          try {
            console.log('Fetching current bed assignments for resident:', residentId);
            const currentAssignments = await bedAssignmentsAPI.getAllStatuses({ resident_id: residentId });
            console.log('Current assignments:', currentAssignments);

            // Store the assignments for this resident
            if (!cancelled && Array.isArray(currentAssignments)) {
              console.log('Storing assignments for resident:', residentId, currentAssignments);
              setResidentBedAssignments(prev => {
                const newState = { ...prev, [residentId]: currentAssignments };
                console.log('Updated residentBedAssignments state:', newState);
                return newState;
              });
            }

            // Find active assignment
            const activeAssignment = Array.isArray(currentAssignments)
              ? currentAssignments.find((a: any) => isBedAssignmentActive(a) && a.status === 'active')
              : null;

            if (activeAssignment) {
              console.log('Active assignment found:', activeAssignment);

              // Use bed and room data directly from assignment response (no need for additional API calls)
              if (activeAssignment.bed_id && typeof activeAssignment.bed_id === 'object') {
                const bed = activeAssignment.bed_id;
                const room = bed.room_id;
                
                // Store bed details directly
                if (bed._id && !bedDetails[bed._id]) {
                  if (!cancelled) bedUpdates[bed._id] = bed;
                }
                
                // Store room details directly
                if (room && room._id && !roomDetails[room._id]) {
                  if (!cancelled) roomUpdates[room._id] = room;
                }
              }
            }
          } catch (error: any) {
            console.warn(`Failed to fetch bed assignments for resident ${residentId}:`, error?.response?.status || error?.message);
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
      const carePlanUpdates: Record<string, any> = {};

      for (const request of serviceDateChangeRequests) {
        if (request?.current_care_plan_assignment_id) {
          const cpaId = typeof request.current_care_plan_assignment_id === 'string' 
            ? request.current_care_plan_assignment_id 
            : request.current_care_plan_assignment_id?._id;
          if (cpaId && !carePlanAssignmentDetails[cpaId] && !carePlanAssignmentErrors[cpaId]) {
            try {
              console.log('Fetching care plan assignment for ID:', cpaId);
              const carePlanAssignment = await carePlanAssignmentsAPI.getById(cpaId);
              console.log('Care plan assignment fetched:', carePlanAssignment);
              if (!cancelled) {
                carePlanAssignmentUpdates[cpaId] = carePlanAssignment;

                // Fetch individual care plans from care_plan_ids array
                if (carePlanAssignment?.care_plan_ids && Array.isArray(carePlanAssignment.care_plan_ids)) {
                  for (const planId of carePlanAssignment.care_plan_ids) {
                    if (!planDetails[planId]) {
                      try {
                        console.log('Fetching care plan for ID:', planId);
                        const carePlan = await carePlansAPI.getById(planId);
                        console.log('Care plan fetched:', carePlan);
                        if (!cancelled) carePlanUpdates[planId] = carePlan;
                      } catch (planError: any) {
                        console.warn(`Failed to fetch care plan ${planId}:`, planError?.response?.status || planError?.message);
                      }
                    }
                  }
                }
                // Also try to fetch single care_plan_id if it exists (fallback)
                else if (carePlanAssignment?.care_plan_id) {
                  const planId = typeof carePlanAssignment.care_plan_id === 'string' 
                    ? carePlanAssignment.care_plan_id 
                    : carePlanAssignment.care_plan_id._id;
                  
                  if (planId && !planDetails[planId]) {
                    try {
                      console.log('Fetching single care plan for ID:', planId);
                      const carePlan = await carePlansAPI.getById(planId);
                      console.log('Single care plan fetched:', carePlan);
                      if (!cancelled) carePlanUpdates[planId] = carePlan;
                    } catch (planError: any) {
                      console.warn(`Failed to fetch single care plan ${planId}:`, planError?.response?.status || planError?.message);
                    }
                  }
                }
              }
            } catch (error: any) {
              console.warn(`Failed to fetch care plan assignment ${cpaId}:`, error?.response?.status || error?.message);
              if (!cancelled) {
                setCarePlanAssignmentErrors(prev => ({ ...prev, [cpaId]: 'Error fetching care plan assignment' }));
              }
            }
          }
        }
      }

      if (!cancelled) {
        if (Object.keys(carePlanAssignmentUpdates).length) {
        setCarePlanAssignmentDetails(prev => ({ ...prev, ...carePlanAssignmentUpdates }));
        }
        if (Object.keys(carePlanUpdates).length) {
          setPlanDetails(prev => ({ ...prev, ...carePlanUpdates }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [grouped, planDetails]);

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
        } catch (error: any) {
          console.warn(`Failed to fetch resident ${residentId}:`, error?.response?.status || error?.message);
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

  // Fetch current care plan assignments for residents
  useEffect(() => {
    const carePlanChangeRequests = (grouped || []).filter((r: any) => r?.request_type === 'care_plan_change');
    
    if (carePlanChangeRequests.length === 0) return;

    let cancelled = false;
    (async () => {
      const carePlanAssignmentUpdates: Record<string, any> = {};
      const carePlanUpdates: Record<string, any> = {};

      for (const request of carePlanChangeRequests) {
        const residentId = typeof request.resident_id === 'string' ? request.resident_id : request.resident_id?._id;
        if (!residentId) continue;

        try {
          // Fetch current care plan assignments
          const assignments = await carePlanAssignmentsAPI.getByResidentId(residentId);

          if (Array.isArray(assignments)) {
            // Find active assignment
            const activeAssignment = assignments.find((a: any) => a.status === 'active');
            if (activeAssignment) {
              const cpaId = activeAssignment._id;
              if (!cancelled) carePlanAssignmentUpdates[cpaId] = activeAssignment;

              // Fetch care plan details for current assignment
              if (activeAssignment.care_plan_ids && Array.isArray(activeAssignment.care_plan_ids)) {
                for (const planId of activeAssignment.care_plan_ids) {
                  if (!planDetails[planId]) {
                    try {
                      const carePlan = await carePlansAPI.getById(planId);
                      if (!cancelled) carePlanUpdates[planId] = carePlan;
                    } catch (planError: any) {
                      console.warn(`Failed to fetch current care plan ${planId}:`, planError?.response?.status || planError?.message);
                    }
                  }
                }
              }
            }
          }

          // Target care plan assignment details are already included in the service request response
          // No need to fetch additional data
        } catch (error: any) {
          console.warn('Failed to fetch care plan data:', error?.response?.status || error?.message);
        }
      }

      if (!cancelled) {
        if (Object.keys(carePlanAssignmentUpdates).length) {
          setCarePlanAssignmentDetails(prev => ({ ...prev, ...carePlanAssignmentUpdates }));
        }
        if (Object.keys(carePlanUpdates).length) {
          setPlanDetails(prev => ({ ...prev, ...carePlanUpdates }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [grouped, planDetails]);

  const approve = async () => {
    try {
      setBusy("approve");
      
      console.log('Starting approval process for requests:', grouped);
      
      // Pre-validate required fields expected by BE (e.g., selected_room_type)
      for (const req of grouped) {
        console.log('Validating request:', req._id, 'Type:', req.request_type, 'Selected room type:', req.selected_room_type);
        
        if (req?.request_type === 'care_plan_change' && !req?.selected_room_type) {
          // Try to infer from current room to help admin understand
          const residentId = req?.resident_id?._id || req?.resident_id;
          let inferredRoomType: string | undefined;
          try {
            const assignments = residentBedAssignments[residentId];
            if (assignments && assignments.length > 0) {
              const assignment = assignments.find(ba => isBedAssignmentActive(ba));
              if (assignment?.bed_id && typeof assignment.bed_id === 'object') {
                const room = assignment.bed_id.room_id;
                if (room && typeof room === 'object') {
                  inferredRoomType = room.room_type;
                }
              }
            }
          } catch {}
          
          console.log('Missing selected_room_type for care_plan_change request. Inferred room type:', inferredRoomType);
          
          // Auto-set selected_room_type if we can infer it
          if (inferredRoomType) {
            console.log('Auto-setting selected_room_type to:', inferredRoomType);
            req.selected_room_type = inferredRoomType;
          } else {
          addNotification({
            type: 'warning',
            title: 'Thiếu thông tin bắt buộc',
              message: `Yêu cầu đổi gói dịch vụ thiếu selected_room_type. Vui lòng cập nhật yêu cầu hoặc yêu cầu người dùng gửi lại.`,
            category: 'system',
            actionUrl: '/admin/approvals'
          });
          setBusy(null);
          return;
          }
        }
      }
      
      // Approve all requests in the group (sequential for clearer error handling)
      for (const req of grouped) {
        try {
          console.log('Approving request:', req._id, 'Type:', req.request_type);
          const result = await serviceRequestsAPI.approve(req._id);
          console.log('Approval successful for request:', req._id, result);
        } catch (err: any) {
          console.error('Approval failed for request:', req._id, err);
          const msg = err?.response?.data?.message || 'Không thể thực hiện thay đổi. Vui lòng kiểm tra dữ liệu yêu cầu.';
          addNotification({
            type: 'warning',
            title: 'Phê duyệt thất bại',
            message: `${msg} (ID: ${req?._id || ''})`,
            category: 'system',
            actionUrl: '/admin/approvals'
          });
          // Stop on first failure
          setBusy(null);
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
                {(() => {
                  // Group service_date_change requests by current_care_plan_assignment_id
                  const groupedByAssignment: Record<string, any[]> = {};
                  const otherRequests: any[] = [];
                  
                  grouped.forEach((r: any) => {
                    if (r.request_type === 'service_date_change' && r.current_care_plan_assignment_id) {
                      const assignmentId = typeof r.current_care_plan_assignment_id === 'string' 
                        ? r.current_care_plan_assignment_id 
                        : r.current_care_plan_assignment_id?._id;
                      if (assignmentId) {
                        if (!groupedByAssignment[assignmentId]) {
                          groupedByAssignment[assignmentId] = [];
                        }
                        groupedByAssignment[assignmentId].push(r);
                      } else {
                        otherRequests.push(r);
                      }
                    } else {
                      otherRequests.push(r);
                    }
                  });
                  
                  // Create display items: one for each care plan assignment group + individual other requests
                  const displayItems: any[] = [];
                  
                  // Add grouped service date change requests
                  Object.entries(groupedByAssignment).forEach(([assignmentId, requests]) => {
                    displayItems.push({
                      type: 'grouped_service_date_change',
                      assignmentId,
                      requests,
                      // Use first request for common properties
                      ...requests[0],
                      count: requests.length
                    });
                  });
                  
                  // Add other individual requests
                  otherRequests.forEach(r => {
                    displayItems.push({
                      type: 'individual',
                      ...r
                    });
                  });
                  
                  return displayItems;
                })().map((item: any, idx: number) => {
                  const planId = item?.target_care_plan_assignment_id?._id || item?.target_care_plan_assignment_id;
                  const plan = planId ? planDetails[planId] : null;
                  const r = item.type === 'grouped_service_date_change' ? item.requests[0] : item;
                  return (
                  <div key={item._id || item.assignmentId || idx} className="bg-blue-50/30 rounded-2xl p-6 border border-blue-200/30">
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
                             Người cao tuổi:
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

                    <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Emergency Contact Information */}
                        <div className="bg-green-50/50 rounded-xl p-4 border border-green-200/50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <PhoneIcon className="w-3 h-3 text-white" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              Liên hệ khẩn cấp
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
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-slate-600 mb-1">
                                      Người liên hệ
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {resident.emergency_contact.name || 'Chưa có thông tin'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-600 mb-1">
                                      Số điện thoại
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {resident.emergency_contact.phone ? (
                                        <a href={`tel:${resident.emergency_contact.phone}`} className="hover:underline text-blue-600">
                                            {resident.emergency_contact.phone}
                                          </a>
                                      ) : 'Chưa có thông tin'}
                                    </p>
                                        </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-600 mb-1">
                                      Mối quan hệ
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
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

                        {/* Main Content - Room Change, Service Date Change, Care Plan Change */}
                        <div className="lg:col-span-2">
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

                                        const activeAssignment = assignments.find((a: any) => a.status === 'active' && isBedAssignmentActive(a));
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
                            {(r.note || r.medicalNote) && (
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
                                  {(() => {
                                    const note = r.note || r.medicalNote;
                                    if (!note) return '';
                                    // Remove content within parentheses
                                    return note.replace(/\s*\([^)]*\)/g, '').trim();
                                  })()}
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
                                {item.type === 'grouped_service_date_change' && item.count > 1 && (
                                  <span className="ml-2 text-sm font-normal text-emerald-600">
                                    ({item.count} gói dịch vụ)
                                  </span>
                                )}
                              </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Thời gian gia hạn
                                </p>
                                <p className="text-lg font-semibold text-blue-700">
                                  {(() => {
                                    // Calculate extension period from medical note or new_end_date
                                    if (r.medicalNote) {
                                      const match = r.medicalNote.match(/thêm (\d+) tháng/);
                                      if (match && match[1]) {
                                        return `${match[1]} tháng`;
                                      }
                                    }
                                    
                                    // Fallback: try to calculate from dates if available
                                    const cpaId = typeof r.current_care_plan_assignment_id === 'string' 
                                      ? r.current_care_plan_assignment_id 
                                      : r.current_care_plan_assignment_id?._id;
                                    
                                    if (cpaId && carePlanAssignmentDetails[cpaId] && r.new_end_date) {
                                      const assignment = carePlanAssignmentDetails[cpaId];
                                      if (assignment.end_date) {
                                        const oldEnd = new Date(assignment.end_date);
                                        const newEnd = new Date(r.new_end_date);
                                        const diffMonths = Math.round((newEnd.getTime() - oldEnd.getTime()) / (1000 * 60 * 60 * 24 * 30));
                                        if (diffMonths > 0) {
                                          return `${diffMonths} tháng`;
                                        }
                                      }
                                    }

                                    return '---';
                                  })()}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  Gia hạn đến ngày
                                </p>
                                <p className="text-lg font-semibold text-emerald-700">
                                  {formatDate(r.new_end_date)}
                                </p>
                              </div>
                            </div>

                            {/* Service Packages Section */}
                            <div className="mb-6">
                              <p className="text-xs font-medium text-slate-600 mb-3">
                                {item.type === 'grouped_service_date_change' && item.count > 1 ? 'Các gói dịch vụ' : 'Tên gói dịch vụ'}
                              </p>
                              {item.type === 'grouped_service_date_change' && item.count > 1 ? (
                                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                                  {(() => {
                                    // Collect all unique plan names from all requests
                                    const allPlanNames = new Set<string>();
                                    
                                    item.requests.forEach((req: any) => {
                                      const cpaId = typeof req.current_care_plan_assignment_id === 'string' 
                                        ? req.current_care_plan_assignment_id 
                                        : req.current_care_plan_assignment_id?._id;
                                      
                                      console.log('Processing request:', req._id, 'CPA ID:', cpaId);
                                      
                                      if (cpaId) {
                                        const carePlanAssignment = carePlanAssignmentDetails[cpaId];
                                        console.log('Care plan assignment:', carePlanAssignment);
                                        
                                        if (carePlanAssignment) {
                                          // Get care plan names from care_plan_ids array
                                          if (carePlanAssignment.care_plan_ids && Array.isArray(carePlanAssignment.care_plan_ids)) {
                                            console.log('Found care_plan_ids:', carePlanAssignment.care_plan_ids);
                                            carePlanAssignment.care_plan_ids.forEach((planId: string) => {
                                              const plan = planDetails[planId];
                                              const planName = plan?.plan_name || plan?.name;
                                              console.log(`Plan ${planId}:`, plan, 'Name:', planName);
                                              if (planName && planName.trim().length > 1) { // Filter out single character names
                                                allPlanNames.add(planName);
                                              }
                                            });
                                          }
                                          // Try single care_plan_id (fallback)
                                          else if (carePlanAssignment.care_plan_id) {
                                            const planId = typeof carePlanAssignment.care_plan_id === 'string' 
                                              ? carePlanAssignment.care_plan_id 
                                              : carePlanAssignment.care_plan_id._id;
                                            
                                            if (planId) {
                                              const plan = planDetails[planId];
                                              const planName = plan?.plan_name || plan?.name;
                                              console.log(`Single plan ${planId}:`, plan, 'Name:', planName);
                                              if (planName && planName.trim().length > 1) { // Filter out single character names
                                                allPlanNames.add(planName);
                                              }
                                            }
                                          }
                                          // Fallback to assignment properties - ONLY if no care_plan_ids found
                                          else {
                                            if (carePlanAssignment.plan_name && carePlanAssignment.plan_name.trim().length > 1) {
                                              console.log('Using assignment plan_name:', carePlanAssignment.plan_name);
                                              allPlanNames.add(carePlanAssignment.plan_name);
                                            }
                                            else if (carePlanAssignment.care_plan_name && carePlanAssignment.care_plan_name.trim().length > 1) {
                                              console.log('Using assignment care_plan_name:', carePlanAssignment.care_plan_name);
                                              allPlanNames.add(carePlanAssignment.care_plan_name);
                                            }
                                          }
                                        }
                                      }
                                      
                                      // Fallback to medical note - ONLY if no other data found
                                      if (allPlanNames.size === 0 && req.medicalNote) {
                                        const match = req.medicalNote.match(/Gia hạn gói: ([^thêm]+)/);
                                        if (match && match[1]) {
                                          const planName = match[1].trim();
                                          console.log('Using medical note plan name:', planName);
                                          if (planName.length > 1) { // Filter out single character names
                                            allPlanNames.add(planName);
                                          }
                                        }
                                      }
                                    });
                                    
                                    const uniquePlanNames = Array.from(allPlanNames);
                                    
                                    if (uniquePlanNames.length > 0) {
                                      return (
                                        <ul className="space-y-2">
                                          {uniquePlanNames.map((planName, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                              <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                                              <span className="text-sm font-semibold text-slate-900 leading-relaxed">
                                                {planName}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      );
                                    }
                                    
                                    return (
                                      <p className="text-sm text-slate-500">Đang tải thông tin gói dịch vụ...</p>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                                <p className="text-lg font-semibold text-slate-900">
                                  {(() => {
                                      const cpaId = typeof r.current_care_plan_assignment_id === 'string' 
                                        ? r.current_care_plan_assignment_id 
                                        : r.current_care_plan_assignment_id?._id;
                                    if (!cpaId) return '---';

                                    const carePlanAssignment = carePlanAssignmentDetails[cpaId];
                                    const carePlanAssignmentError = carePlanAssignmentErrors[cpaId];

                                    if (carePlanAssignmentError) {
                                      return `Lỗi: ${carePlanAssignmentError}`;
                                    }

                                    if (!carePlanAssignment) {
                                      return 'Đang tải thông tin...';
                                    }

                                      // Get care plan names from care_plan_ids array using planDetails
                                      if (carePlanAssignment.care_plan_ids && Array.isArray(carePlanAssignment.care_plan_ids)) {
                                        const planNames = carePlanAssignment.care_plan_ids
                                          .map((planId: string) => {
                                            const plan = planDetails[planId];
                                            return plan?.plan_name || plan?.name;
                                          })
                                          .filter(Boolean);
                                        
                                        if (planNames.length > 0) {
                                          return (
                                            <div className="space-y-1">
                                              {planNames.map((planName, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                                  <span>{planName}</span>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        }
                                      }

                                      // Try single care_plan_id (fallback)
                                      if (carePlanAssignment.care_plan_id) {
                                        const planId = typeof carePlanAssignment.care_plan_id === 'string' 
                                          ? carePlanAssignment.care_plan_id 
                                          : carePlanAssignment.care_plan_id._id;
                                        
                                        if (planId) {
                                          const plan = planDetails[planId];
                                          if (plan) {
                                            return plan.plan_name || plan.name || '---';
                                          }
                                        }
                                      }

                                      // Fallback to assignment properties
                                    if (carePlanAssignment.plan_name) {
                                      return carePlanAssignment.plan_name;
                                    }

                                    if (carePlanAssignment.care_plan_name) {
                                      return carePlanAssignment.care_plan_name;
                                    }

                                      // Fallback to medical note to extract plan names
                                    if (r.medicalNote) {
                                      const match = r.medicalNote.match(/Gia hạn gói: ([^thêm]+)/);
                                      if (match && match[1]) {
                                        return match[1].trim();
                                      }
                                    }

                                      return 'Đang tải thông tin gói dịch vụ...';
                                  })()}
                                </p>
                                </div>
                              )}
                                </div>
                              
                            {/* Current Room and Bed Information */}
                              <div className="mt-6 pt-6 border-t border-emerald-200">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                  Thông tin phòng/giường hiện tại
                                </p>
                              </div>
                              
                              {(() => {
                                const residentId = typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id;
                                const assignments = residentBedAssignments[residentId];
                                const error = residentBedAssignmentErrors[residentId];

                                if (error) {
                                  return (
                                    <div className="text-center py-4">
                                      <p className="text-sm text-red-600">Lỗi tải thông tin phòng/giường</p>
                            </div>
                                  );
                                }
                                
                                if (!Array.isArray(assignments)) {
                                  return (
                                    <div className="text-center py-4">
                                      <p className="text-sm text-slate-500">Đang tải thông tin phòng/giường...</p>
                                    </div>
                                  );
                                }

                                const activeAssignment = assignments.find((a: any) => a.status === 'active' && isBedAssignmentActive(a));
                                if (activeAssignment?.bed_id) {
                                  const bed = activeAssignment.bed_id;
                                  const room = bed?.room_id;
                                  return (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Số phòng</p>
                                        <p className="text-lg font-bold text-slate-900">{room?.room_number || 'N/A'}</p>
                                      </div>
                                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Số giường</p>
                                        <p className="text-lg font-bold text-slate-900">{bed?.bed_number || 'N/A'}</p>
                                      </div>
                                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Tầng</p>
                                        <p className="text-lg font-bold text-slate-900">{room?.floor ? `Tầng ${room.floor}` : 'N/A'}</p>
                                      </div>
                                      
                            </div>
                                  );
                                }
                                
                                return (
                                  <div className="text-center py-4">
                                    <p className="text-sm text-slate-600">Chưa có thông tin phòng/giường</p>
                                  </div>
                                );
                              })()}
                            </div>

                            {(r.medicalNote || r.note) && (
                              <div className="mt-6 pt-6 border-t border-emerald-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">
                                    Ghi chú yêu cầu
                                  </p>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {(() => {
                                    const note = r.medicalNote || r.note;
                                    if (!note) return '';
                                    // Remove content within parentheses
                                    return note.replace(/\s*\([^)]*\)/g, '').trim();
                                  })()}
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
                                Chi tiết đổi gói dịch vụ
                              </h3>
                            </div>
                            
                            {/* Current vs New Service Packages and Room/Bed */}
                            <div className="mb-8">
                              <h4 className="text-sm font-bold text-slate-800 mb-4">Gói dịch vụ và phòng/giường đang sử dụng</h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Current Service Packages */}
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-4 h-4 bg-slate-500 rounded flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                              </div>
                                    <p className="text-xs font-medium text-slate-600 uppercase">Gói hiện tại</p>
                              </div>
                                  {(() => {
                                    const residentId = typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id;
                                    
                                    // Find current active care plan assignment
                                    const currentCarePlanAssignment = Object.values(carePlanAssignmentDetails).find((assignment: any) => 
                                      assignment.resident_id === residentId && assignment.status === 'active'
                                    );
                                    
                                    if (currentCarePlanAssignment) {
                                      if (currentCarePlanAssignment.care_plan_ids && Array.isArray(currentCarePlanAssignment.care_plan_ids)) {
                                        // Check if care_plan_ids contains full plan objects or just IDs
                                        const plans = currentCarePlanAssignment.care_plan_ids.filter((plan: any) => {
                                          if (typeof plan === 'object' && plan.plan_name) {
                                            return true; // Full plan object
                                          }
                                          return false;
                                        });
                                        
                                        if (plans.length > 0) {
                                          // care_plan_ids contains full plan objects
                                          return (
                                            <div className="space-y-2">
                                              {plans.map((plan: any, idx: number) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                                  <div className="flex-1">
                                                    <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{plan.plan_name}</span>
                                                    <div className="text-xs text-slate-700 mt-0.5">
                                                      {formatDisplayCurrency(plan.monthly_price || 0)}/tháng
                                                      {plan.category === 'main' ? ' (Gói chính)' : ' (Gói bổ sung)'}
                              </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        } else {
                                          // care_plan_ids contains only IDs, need to fetch from planDetails
                                          const currentPlans = currentCarePlanAssignment.care_plan_ids
                                            .map((planId: string) => {
                                              const plan = planDetails[planId];
                                              return plan;
                                            })
                                            .filter(Boolean);
                                          
                                          if (currentPlans.length > 0) {
                                            return (
                                              <div className="space-y-2">
                                                {currentPlans.map((plan: any, idx: number) => (
                                                  <div key={idx} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                                    <div className="flex-1">
                                                      <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{plan.plan_name || plan.name}</span>
                                                      <div className="text-xs text-slate-700 mt-0.5">
                                                        {formatDisplayCurrency(plan.monthly_price || 0)}/tháng
                                                        {plan.category === 'main' ? ' (Gói chính)' : ' (Gói bổ sung)'}
                              </div>
                            </div>
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          }
                                        }
                                      }
                                    }
                                    
                                    return <p className="text-sm text-slate-500">Chưa có gói dịch vụ hiện tại</p>;
                                  })()}
                              </div>

                                {/* Current Room/Bed */}
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-4 h-4 bg-slate-500 rounded flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                      </svg>
                            </div>
                                    <p className="text-xs font-medium text-slate-600 uppercase">Phòng/giường hiện tại</p>
                                  </div>
                                  {(() => {
                                    const residentId = typeof r.resident_id === 'string' ? r.resident_id : r.resident_id?._id;
                                    const assignments = residentBedAssignments[residentId];
                                    
                                    console.log('Current room display - residentId:', residentId);
                                    console.log('Current room display - assignments:', assignments);
                                    console.log('Current room display - residentBedAssignments state:', residentBedAssignments);
                                    
                                    // Debug: Show what we have
                                    if (assignments === undefined) {
                                      return <p className="text-sm text-red-500">Chưa fetch dữ liệu cho resident {residentId}</p>;
                                    }
                                    
                                    if (!Array.isArray(assignments)) {
                                      return <p className="text-sm text-slate-500">Đang tải thông tin phòng hiện tại...</p>;
                                    }

                                    if (assignments.length === 0) {
                                      return <p className="text-sm text-slate-500">Không có dữ liệu bed assignment</p>;
                                    }

                                    const activeAssignment = assignments.find((a: any) => a.status === 'active' && isBedAssignmentActive(a));
                                    console.log('Current room display - activeAssignment:', activeAssignment);
                                    
                                    if (activeAssignment?.bed_id) {
                                      const bed = activeAssignment.bed_id;
                                      const room = bed?.room_id;
                                      console.log('Current room display - bed:', bed);
                                      console.log('Current room display - room:', room);
                                      
                                      return (
                                        <div className="space-y-2">
                                          <div className="text-sm font-medium text-slate-900">
                                            Phòng {room?.room_number || 'N/A'}
                                            {room?.floor ? ` (Tầng ${room.floor})` : ''}
                                          </div>
                                          <div className="text-sm text-slate-700">
                                            Giường {bed?.bed_number || 'N/A'}
                                          </div>
                                         
                                            {room?.room_type && (
                                              <div className="text-xs text-slate-600">
                                                Loại phòng: {getRoomType(room.room_type)}
                                </div>
                                            )}
                                        </div>
                                      );
                                    }
                                    
                                    return <p className="text-sm text-slate-500">Không tìm thấy active assignment</p>;
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* New Service Packages and Room/Bed */}
                            <div className="mb-8">
                              <h4 className="text-sm font-bold text-slate-800 mb-4">Gói và phòng/giường mới</h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* New Service Packages */}
                                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                            </div>
                                    <p className="text-xs font-medium text-emerald-600 uppercase">Gói mới</p>
                            </div>
                                  {(() => {
                                    const carePlanAssignment = r.target_care_plan_assignment_id;
                                    if (carePlanAssignment && typeof carePlanAssignment === 'object') {
                                      if (carePlanAssignment.care_plan_ids && Array.isArray(carePlanAssignment.care_plan_ids)) {
                                        // care_plan_ids đã chứa đầy đủ thông tin care plan
                                        const plans = carePlanAssignment.care_plan_ids.filter((plan: any) => 
                                          plan && typeof plan === 'object' && plan.plan_name
                                        );
                                        
                                        if (plans.length > 0) {
                                          return (
                                            <div className="space-y-2">
                                              {plans.map((plan: any, idx: number) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                                                  <div className="flex-1">
                                                    <span className="text-sm font-medium text-emerald-900 whitespace-nowrap">{plan.plan_name}</span>
                                                    <div className="text-xs text-emerald-700 mt-0.5">
                                                      {formatDisplayCurrency(plan.monthly_price || 0)}/tháng
                                                      {plan.category === 'main' ? ' (Gói chính)' : ' (Gói bổ sung)'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        }
                                      }
                                    }
                                    
                                    return <p className="text-sm text-emerald-500">Chưa có thông tin gói mới</p>;
                                  })()}
                                </div>

                                {/* New Room/Bed */}
                                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                    </div>
                                    <p className="text-xs font-medium text-emerald-600 uppercase">Phòng/giường mới</p>
                                  </div>
                                  {(() => {
                                    const bedAssignment = r.target_bed_assignment_id;
                                    if (bedAssignment && typeof bedAssignment === 'object') {
                                      const bed = bedAssignment.bed_id;
                                      if (bed && typeof bed === 'object') {
                                        const room = bed.room_id;
                                        if (room && typeof room === 'object') {
                                          return (
                                            <div className="space-y-2">
                                              <div className="text-sm font-medium text-emerald-900">
                                                Phòng {room.room_number || 'N/A'}
                                                {room.floor ? ` (Tầng ${room.floor})` : ''}
                                              </div>
                                              <div className="text-sm text-emerald-700">
                                                Giường {bed.bed_number || 'N/A'}
                                              </div>
                                              
                                              
                                                {room.room_type && (
                                                  <div className="text-xs text-emerald-600">
                                                    Loại phòng: {getRoomType(room.room_type)}
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        }
                                      }
                                    }
                                    
                                    return <p className="text-sm text-emerald-500">Chưa có thông tin phòng mới</p>;
                                  })()}
                                </div>
                              </div>
                            </div>

                            


                            {/* Service Period Information */}
                            <div className="mb-8">
                              <h4 className="text-sm font-bold text-slate-800 mb-4">Thời gian áp dụng gói mới</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <p className="text-xs font-medium text-blue-600 uppercase">Ngày bắt đầu</p>
                                  </div>
                                  <p className="text-lg font-semibold text-blue-900">
                                    {(() => {
                                      const carePlanAssignment = r.target_care_plan_assignment_id;
                                      if (carePlanAssignment && typeof carePlanAssignment === 'object' && carePlanAssignment.start_date) {
                                        return new Date(carePlanAssignment.start_date).toLocaleDateString('vi-VN');
                                      }
                                      return 'Chưa xác định';
                                    })()}
                                  </p>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <p className="text-xs font-medium text-purple-600 uppercase">Ngày kết thúc</p>
                                  </div>
                                  <p className="text-lg font-semibold text-purple-900">
                                    {(() => {
                                      const carePlanAssignment = r.target_care_plan_assignment_id;
                                      if (carePlanAssignment && typeof carePlanAssignment === 'object' && carePlanAssignment.end_date) {
                                        return new Date(carePlanAssignment.end_date).toLocaleDateString('vi-VN');
                                      }
                                      return 'Chưa xác định';
                                    })()}
                                </p>
                              </div>
                              </div>
                            </div>

                            {/* Note for Care Plan Change */}
                            {(r.note || r.medicalNote) && (
                              <div className="mt-6 pt-6 border-t border-violet-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-5 h-5 bg-violet-500 rounded flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">
                                    Ghi chú yêu cầu
                                  </p>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {(() => {
                                    const note = r.note || r.medicalNote;
                                    if (!note) return '';
                                    // Remove content within parentheses
                                    return note.replace(/\s*\([^)]*\)/g, '').trim();
                                  })()}
                                </p>
                              </div>
                            )}
                        </div>
                      )}
                        </div>
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
