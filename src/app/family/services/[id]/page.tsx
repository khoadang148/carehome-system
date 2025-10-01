"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  ArrowLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowPathIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { carePlansAPI, carePlanAssignmentsAPI, residentAPI, userAPI, roomsAPI, bedAssignmentsAPI, serviceRequestsAPI, bedsAPI } from '@/lib/api';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return '/default-avatar.svg';

  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;

  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const [relatives, setRelatives] = useState<any[]>([]);
  const [selectedRelative, setSelectedRelative] = useState<any>(null);
  const [residentCarePlans, setResidentCarePlans] = useState<any[]>([]);
  const [residentCarePlanDetail, setResidentCarePlanDetail] = useState<any>(null);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [loadingCarePlanDetail, setLoadingCarePlanDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedNumber, setBedNumber] = useState<string>('Chưa phân giường');
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomPrice, setRoomPrice] = useState<number>(0);
  const [expandedServices, setExpandedServices] = useState<{ [key: number]: boolean }>({});
  const [showBulkExtensionModal, setShowBulkExtensionModal] = useState(false);
  // Removed old BulkChangeModal in favor of dedicated change page
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [targetPlanNames, setTargetPlanNames] = useState<Record<string, string>>({});
  const [targetRoomsById, setTargetRoomsById] = useState<Record<string, any>>({});
  const [targetBedsById, setTargetBedsById] = useState<Record<string, any>>({});

  const residentId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user?.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadRelatives = async () => {
      try {
        setLoading(true);
        const response = await residentAPI.getByFamilyMemberId(user?.id || '');
        const relativesData = Array.isArray(response) ? response : [];
        setRelatives(relativesData);

        const selected = relativesData.find((r: any) => r._id === residentId);
        if (selected) {
          setSelectedRelative(selected);
        } else if (relativesData.length > 0) {
          setSelectedRelative(relativesData[0]);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadRelatives();
    }
  }, [user?.id, residentId]);

  useEffect(() => {
    const loadCarePlans = async () => {
      if (!selectedRelative?._id) return;

      try {
        const response = await carePlanAssignmentsAPI.getByResidentId(selectedRelative._id);
        setResidentCarePlans(Array.isArray(response) ? response : []);
      } catch (error) {
      }
    };

    loadCarePlans();
  }, [selectedRelative?._id]);

  useEffect(() => {
    const loadCarePlanDetail = async () => {
      if (!selectedRelative?._id || residentCarePlans.length === 0) return;

      try {
        setLoadingCarePlanDetail(true);

        const allAssignments = await carePlanAssignmentsAPI.getByResidentId(selectedRelative._id);
        
        // Lọc ra những assignment không bị hủy (bao gồm cả completed)
        const activeAssignments = allAssignments.filter((assignment: any) => {
          // Chỉ loại bỏ các assignment bị hủy
          if (assignment.status === 'cancelled') {
            return false;
          }
          
          return true; // Hiển thị tất cả trạng thái khác (active, completed, pending, etc.)
        });
        
        setCarePlanAssignments(activeAssignments);

        const allCarePlanIds: any[] = [];
        if (Array.isArray(activeAssignments)) {
          activeAssignments.forEach((assignment: any) => {
            if (Array.isArray(assignment.care_plan_ids)) {
              assignment.care_plan_ids.forEach((plan: any) => {
                const planId = plan._id || plan;
                if (!allCarePlanIds.find(p => (p._id || p) === planId)) {
                  allCarePlanIds.push(plan);
                }
              });
            }
          });
        }

        if (allCarePlanIds.length > 0) {
          const carePlanPromises = allCarePlanIds.map(async (plan: any) => {
            const planId = plan._id || plan;
            try {
              const planData = await carePlansAPI.getById(planId);
              return planData;
            } catch (err) {
              return plan;
            }
          });

          const carePlanData = await Promise.all(carePlanPromises);
          setCarePlanDetails(carePlanData);
        } else {
          setCarePlanDetails([]);
        }

        if (activeAssignments.length > 0) {
          setResidentCarePlanDetail(activeAssignments[0]);

          // Ưu tiên sử dụng room_monthly_cost từ care plan assignment
          const assignmentWithRoomCost = activeAssignments.find((assignment: any) =>
            assignment.room_monthly_cost && assignment.room_monthly_cost > 0
          );
          if (assignmentWithRoomCost) {
            setRoomPrice(assignmentWithRoomCost.room_monthly_cost);
          }
        }
      } catch (error) {
      } finally {
        setLoadingCarePlanDetail(false);
      }
    };

    loadCarePlanDetail();
  }, [selectedRelative?._id, residentCarePlans]);

  // Load pending requests
  useEffect(() => {
    const loadPendingRequests = async () => {
      if (!user?.id) return;
      
      try {
        const requests = await serviceRequestsAPI.getMyRequests();
        const pending = Array.isArray(requests) ? requests.filter((req: any) => req.status === 'pending') : [];
        setPendingRequests(pending);
      } catch (error) {
        console.error('Error loading pending requests:', error);
        setPendingRequests([]);
      }
    };

    loadPendingRequests();
  }, [user?.id]);

  // Resolve missing details for pending requests (plan name, room number, bed number)
  useEffect(() => {
    (async () => {
      const updatesPlan: Record<string, string> = {};
      const updatesRooms: Record<string, any> = {};
      const updatesBeds: Record<string, any> = {};
      const tasks: Promise<void>[] = [];

      for (const req of pendingRequests || []) {
        // Plan name
        if (req?.request_type === 'care_plan_change') {
          const planId = typeof req?.target_service_package_id === 'string' ? req.target_service_package_id : null;
          if (planId && !targetPlanNames[planId]) {
            tasks.push((async () => {
              try {
                const plan = await carePlansAPI.getById(planId);
                if (plan?.plan_name) updatesPlan[planId] = plan.plan_name;
              } catch {}
            })());
          }
        }
        // Room number
        const roomId = typeof req?.target_room_id === 'string' ? req.target_room_id : null;
        if (roomId && !targetRoomsById[roomId]) {
          tasks.push((async () => {
            try {
              const room = await roomsAPI.getById(roomId);
              if (room?._id) updatesRooms[roomId] = room;
            } catch {}
          })());
        }
        // Bed number
        const bedId = typeof req?.target_bed_id === 'string' ? req.target_bed_id : null;
        if (bedId && !targetBedsById[bedId]) {
          tasks.push((async () => {
            try {
              const bed = await bedsAPI.getById(bedId);
              if (bed?._id) updatesBeds[bedId] = bed;
              // If room not provided but bed has room_id, fetch room too
              const bedRoomId = (bed?.room_id && typeof bed.room_id === 'object' && bed.room_id?._id)
                ? bed.room_id._id
                : (typeof bed?.room_id === 'string' ? bed.room_id : '');
              if (bedRoomId && !targetRoomsById[bedRoomId]) {
                try {
                  const room = await roomsAPI.getById(bedRoomId);
                  if (room?._id) updatesRooms[bedRoomId] = room;
                } catch {}
              }
            } catch {}
          })());
        }
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
        if (Object.keys(updatesPlan).length) setTargetPlanNames(prev => ({ ...prev, ...updatesPlan }));
        if (Object.keys(updatesRooms).length) setTargetRoomsById(prev => ({ ...prev, ...updatesRooms }));
        if (Object.keys(updatesBeds).length) setTargetBedsById(prev => ({ ...prev, ...updatesBeds }));
      }
    })();
  }, [pendingRequests]);

  useEffect(() => {
    if (!selectedRelative?._id) {
      setRoomNumber('Chưa hoàn tất đăng kí');
      setBedNumber('Chưa phân giường');
      setRoomPrice(0);
      return;
    }
    
    setRoomLoading(true);
    
    // Hàm để cập nhật thông tin phòng và lấy giá từ room_types
    const updateRoomInfo = async (roomData: any, bedInfo: any) => {
      setRoomNumber(roomData?.room_number || 'Chưa hoàn tất đăng kí');
      
      if (bedInfo) {
        if (typeof bedInfo === 'object' && bedInfo.bed_number) {
          setBedNumber(bedInfo.bed_number);
        } else {
          const bedId = typeof bedInfo === 'object' && bedInfo?._id ? bedInfo._id : bedInfo;
          setBedNumber(bedId || 'Chưa phân giường');
        }
      } else {
        setBedNumber('Chưa phân giường');
      }

      // Lấy giá phòng từ room_types dựa trên room_type của phòng
      if (roomData?.room_type) {
        try {
          // Import roomTypesAPI để lấy giá phòng
          const { roomTypesAPI } = await import('@/lib/api');
          const roomTypes = await roomTypesAPI.getAll();
          const roomType = roomTypes.find((type: any) => type.room_type === roomData.room_type);
          
          if (roomType && roomType.monthly_price) {
            setRoomPrice(roomType.monthly_price);
          } else {
            setRoomPrice(0);
          }
        } catch (error) {
          console.error('Error fetching room type price:', error);
          setRoomPrice(0);
        }
      } else {
        setRoomPrice(0);
      }
    };

    // Thử lấy thông tin từ bed assignments trước
    bedAssignmentsAPI.getByResidentId(selectedRelative._id)
      .then((assignments: any[]) => {
        const assignment = Array.isArray(assignments) ? assignments.find(a => a.bed_id?.room_id) : null;
        
        if (assignment?.bed_id?.room_id) {
          const roomData = assignment.bed_id.room_id;
          
          if (typeof roomData === 'object' && roomData.room_number) {
            // Có thông tin phòng đầy đủ
            updateRoomInfo(roomData, assignment.bed_id);
          } else {
            // Cần fetch thông tin phòng
            const roomId = roomData._id || roomData;
            if (roomId) {
              return roomsAPI.getById(roomId)
                .then((room: any) => {
                  updateRoomInfo(room, assignment.bed_id);
                })
                .catch(() => {
                  updateRoomInfo(null, null);
                });
            } else {
              updateRoomInfo(null, null);
            }
          }
        } else {
          // Không có bed assignment, thử từ care plan assignments
          return carePlanAssignmentsAPI.getByResidentId(selectedRelative._id)
            .then((careAssignments: any[]) => {
              const careAssignment = Array.isArray(careAssignments) ? 
                careAssignments.find(a => a.bed_id?.room_id || a.assigned_room_id) : null;
              
              const roomId = careAssignment?.bed_id?.room_id || careAssignment?.assigned_room_id;
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              
              if (roomIdString) {
                return roomsAPI.getById(roomIdString)
                  .then((room: any) => {
                    updateRoomInfo(room, careAssignment?.bed_id);
                  })
                  .catch(() => {
                    updateRoomInfo(null, null);
                  });
              } else {
                updateRoomInfo(null, null);
              }
            })
            .catch(() => {
              updateRoomInfo(null, null);
            });
        }
      })
      .catch(() => {
        updateRoomInfo(null, null);
      })
      .finally(() => setRoomLoading(false));
  }, [selectedRelative?._id]);

  // Debug logging để kiểm tra roomPrice
  useEffect(() => {
    if (roomPrice > 0) {
      console.log('Room price updated:', roomPrice);
    }
  }, [roomPrice]);

  // Debug logging để kiểm tra carePlanDetails
  useEffect(() => {
    if (carePlanDetails.length > 0) {
      console.log('Care plan details updated:', carePlanDetails.map(cp => ({
        name: cp.plan_name,
        price: cp.monthly_price
      })));
    }
  }, [carePlanDetails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format a YYYY-MM-DD string as local date to avoid UTC shift in JS Date parsing
  const formatLocalYMDToDisplay = (ymd: string | undefined | null) => {
    if (!ymd || typeof ymd !== 'string') return 'N/A';
    const parts = ymd.split('-');
    if (parts.length !== 3) return 'N/A';
    const [yStr, mStr, dStr] = parts;
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (!y || !m || !d) return 'N/A';
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('vi-VN');
  };

  // Resolve and format date from multiple possible field names and formats
  const resolveRequestDate = (request: any, candidateFields: string[]) => {
    if (!request) return 'N/A';
    const raw = candidateFields.map((f) => request?.[f]).find((v) => !!v);
    if (!raw) return 'N/A';
    if (typeof raw === 'string') {
      // If YYYY-MM-DD use local YMD formatter
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatLocalYMDToDisplay(raw);
      // If ISO string, take date part to avoid timezone shifting
      if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return formatLocalYMDToDisplay(raw.slice(0, 10));
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString('vi-VN');
      return 'N/A';
    }
    return 'N/A';
  };

  // Given a date string (YYYY-MM-DD or ISO), return the last day of that month in local time
  const endOfMonthFromDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== 'string') return 'N/A';
    const base = /^\d{4}-\d{2}-\d{2}T/.test(dateStr)
      ? dateStr.slice(0, 10)
      : dateStr;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) return 'N/A';
    const [yStr, mStr] = base.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    if (!y || !m) return 'N/A';
    const eom = new Date(y, m, 0);
    return eom.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'from-green-500 to-emerald-500';
      case 'pending':
        return 'from-yellow-500 to-amber-500';
      case 'inactive':
      case 'rejected':
        return 'from-red-500 to-rose-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };



  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getAssignmentForCarePlan = (carePlanId: string) => {
    if (!Array.isArray(carePlanAssignments)) return null;

    return carePlanAssignments.find((assignment: any) => {
      if (Array.isArray(assignment.care_plan_ids)) {
        return assignment.care_plan_ids.some((plan: any) => {
          const planId = plan._id || plan;
          return planId === carePlanId;
        });
      }
      return false;
    });
  };

  const calculateTotalServiceCost = () => {
    if (!Array.isArray(carePlanDetails)) return 0;

    return carePlanDetails.reduce((total, carePlan) => {
      const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
      // Tính chi phí cho tất cả gói (bao gồm cả completed), chỉ loại bỏ cancelled
      if (carePlanAssignment && carePlanAssignment.status !== 'cancelled') {
      return total + (carePlan.monthly_price || 0);
      }
      return total;
    }, 0);
  };

  const getDisplayRoomPrice = () => {
    // Sử dụng roomPrice đã được lấy từ room_types
    return roomPrice;
  };

  const isCarePlanExpired = (carePlanAssignment: any) => {
    if (!carePlanAssignment?.end_date) return false;
    const endDate = new Date(carePlanAssignment.end_date);
    const today = new Date();
    return endDate < today;
  };

  const isCarePlanExpiringSoon = (carePlanAssignment: any) => {
    if (!carePlanAssignment?.end_date) return false;
    const endDate = new Date(carePlanAssignment.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0; // Expiring within 7 days (including today)
  };

  const hasExpiringOrExpiredCarePlans = () => {
    return carePlanDetails.some((carePlan: any) => {
      const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
      return carePlanAssignment && (isCarePlanExpired(carePlanAssignment) || isCarePlanExpiringSoon(carePlanAssignment));
    });
  };

  // Check if there are pending service requests for this resident
  const hasPendingServiceRequests = () => {
    return pendingRequests.some((request: any) => 
      request.resident_id === selectedRelative?._id && 
      (request.request_type === 'service_date_change' || request.request_type === 'care_plan_change')
    );
  };

  // Get pending service requests for this resident (grouped by type and details)
  const getPendingServiceRequests = () => {
    const requests = pendingRequests.filter((request: any) => 
      request.resident_id === selectedRelative?._id && 
      (request.request_type === 'service_date_change' || request.request_type === 'care_plan_change')
    );

    // Group similar requests by type and dates
    const grouped = requests.reduce((acc: any, request: any) => {
      const key = `${request.request_type}_${request.new_start_date}_${request.new_end_date}`;
      if (!acc[key]) {
        acc[key] = {
          ...request,
          count: 1,
          planNames: [], // For care_plan_change
          affectedPlans: [] // For service_date_change: [{name, oldEndDate}]
        };
      } else {
        acc[key].count += 1;
      }
      
      // Add plan name to the group
      if (request.request_type === 'care_plan_change') {
        const planName = request.target_service_package_id?.plan_name || 
          (typeof request.target_service_package_id === 'string' ? targetPlanNames[request.target_service_package_id] : 'N/A');
        if (planName && !acc[key].planNames.includes(planName)) {
          acc[key].planNames.push(planName);
        }
      } else if (request.request_type === 'service_date_change') {
        // Enrich with the current expiring/expired plans for this resident
        const details = carePlanDetails
          .map((cp: any) => ({
            plan: cp,
            assignment: getAssignmentForCarePlan(cp._id)
          }))
          .filter(({ assignment }) => assignment && (isCarePlanExpired(assignment) || isCarePlanExpiringSoon(assignment)))
          .map(({ plan, assignment }) => ({
            name: plan?.plan_name || 'Gói dịch vụ',
            oldEndDate: assignment?.end_date || null
          }));
        acc[key].affectedPlans = details;
      }
      
      return acc;
    }, {});

    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!selectedRelative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy thông tin</h2>
          <p className="text-gray-600 mb-4">Không thể tìm thấy thông tin người thân</p>
          <button
            onClick={() => router.push('/family/services')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push('/family/services')}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>

            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  Chi tiết dịch vụ
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Thông tin gói dịch vụ đã đăng ký
                </span>
              </div>
            </div>
          </div>

          {relatives.length > 1 && (
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
                <UserIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <label className="font-bold text-gray-800 text-lg tracking-tight mr-1 whitespace-nowrap">
                  Chọn người thân:
                </label>
                <select
                  value={selectedRelative._id}
                  onChange={(e) => {
                    const selected = relatives.find(r => r._id === e.target.value);
                    if (selected) {
                      setSelectedRelative(selected);
                      router.push(`/family/services/${selected._id}`);
                    }
                  }}
                  className="py-2 px-4 rounded-xl border-2 border-blue-200 text-base bg-white text-gray-800 font-semibold min-w-32 shadow-sm outline-none transition-all duration-200 cursor-pointer focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100"
                  aria-label="Chọn người thân để xem thông tin dịch vụ"
                >
                  <option value="" disabled className="text-gray-500 bg-white">-- Chọn người thân --</option>
                  {relatives.map((relative) => (
                    <option key={relative._id} value={relative._id} className="text-gray-800 bg-white hover:bg-blue-50">
                      {relative.full_name || relative.name || 'Không có tên'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Request Notification */}
        {hasPendingServiceRequests() && (
          <div className="mb-6 rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-white shadow-[0_10px_30px_-12px_rgba(30,64,175,0.35)]">
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-md ring-1 ring-blue-100 flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow">
                    {getPendingServiceRequests().length}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-blue-900">
                        Yêu cầu của bạn đang được xem xét
                      </h3>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-blue-800/90">
                        Đang xử lý cho {selectedRelative?.full_name || selectedRelative?.name || 'người thân'}. Vui lòng chờ thông báo tiếp theo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Chờ duyệt
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {getPendingServiceRequests().map((request: any, index: number) => (
                      <div
                        key={index}
                        className="group rounded-xl border border-blue-200/70 bg-white/90 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[12px] sm:text-[13px] font-extrabold ${
                                request.request_type === 'service_date_change' ? 'text-amber-700' : 'text-violet-700'
                              }`}
                            >
                              {request.request_type === 'service_date_change' ? 'Gia hạn gói dịch vụ' : 'Đổi gói dịch vụ'}
                              {request.count > 1 && ` (${request.count} gói)`}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-gray-500">
                            Gửi ngày {request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-dashed border-blue-100">
                          {request.request_type === 'care_plan_change' ? (
                            <div className="grid grid-cols-12 gap-3 md:gap-4">
                              <div className="col-span-12 md:col-span-5">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Gói mới</div>
                                <div className="space-y-1.5">
                                  {(() => {
                                    const names: string[] = (() => {
                                      if (request.planNames && request.planNames.length > 0) return request.planNames;
                                      if (request.target_service_package_id?.plan_name) return [request.target_service_package_id.plan_name];
                                      const id = typeof request.target_service_package_id === 'string' ? request.target_service_package_id : '';
                                      return id && targetPlanNames[id] ? [targetPlanNames[id]] : ['N/A'];
                                    })();
                                    return names.map((n, i) => (
                                      <div key={i} className="text-blue-700 text-sm font-medium">- {n}</div>
                                    ));
                                  })()}
                                </div>
                              </div>
                              <div className="col-span-12 md:col-span-3 md:border-l md:border-blue-100 md:pl-3 min-w-0">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Phòng/Giường</div>
                                <div
                                  className="text-gray-900 font-medium truncate"
                                  title={(() => {
                                    const targetRoom = typeof request.target_room_id === 'object' ? request.target_room_id?.room_number : (typeof request.target_room_id === 'string' ? targetRoomsById[request.target_room_id]?.room_number : undefined);
                                    const targetBed = typeof request.target_bed_id === 'object' ? request.target_bed_id?.bed_number : (typeof request.target_bed_id === 'string' ? targetBedsById[request.target_bed_id]?.bed_number : undefined);
                                    const currentRoom = roomNumber && !String(roomNumber).toLowerCase().includes('chưa') ? roomNumber : undefined;
                                    const currentBed = bedNumber && !String(bedNumber).toLowerCase().includes('chưa') ? bedNumber : undefined;
                                    const roomNo = targetRoom || currentRoom;
                                    const bedNo = targetBed || currentBed;
                                    if (roomNo || bedNo) return `Phòng ${roomNo || 'N/A'}${bedNo ? ` – Giường ${bedNo}` : ''}`;
                                    return 'Giữ phòng/giường cũ';
                                  })()}
                                >
                                  {(() => {
                                    const targetRoom = typeof request.target_room_id === 'object' ? request.target_room_id?.room_number : (typeof request.target_room_id === 'string' ? targetRoomsById[request.target_room_id]?.room_number : undefined);
                                    const targetBed = typeof request.target_bed_id === 'object' ? request.target_bed_id?.bed_number : (typeof request.target_bed_id === 'string' ? targetBedsById[request.target_bed_id]?.bed_number : undefined);
                                    const currentRoom = roomNumber && !String(roomNumber).toLowerCase().includes('chưa') ? roomNumber : undefined;
                                    const currentBed = bedNumber && !String(bedNumber).toLowerCase().includes('chưa') ? bedNumber : undefined;
                                    const roomNo = targetRoom || currentRoom;
                                    const bedNo = targetBed || currentBed;
                                    if (roomNo || bedNo) return `Phòng ${roomNo || 'N/A'}${bedNo ? ` – Giường ${bedNo}` : ''}`;
                                    return 'Giữ phòng/giường cũ';
                                  })()}
                                </div>
                              </div>
                              <div className="col-span-6 md:col-span-2 md:border-l md:border-blue-100 md:pl-3">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Ngày bắt đầu</div>
                                <div className="text-gray-900 font-semibold">
                                  {request.new_start_date ? new Date(request.new_start_date).toLocaleDateString('vi-VN') : 'N/A'}
                                </div>
                              </div>
                              <div className="col-span-6 md:col-span-2 md:border-l md:border-blue-100 md:pl-3">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Ngày kết thúc</div>
                                <div className="text-gray-900 font-semibold">
                                  {request.new_end_date ? new Date(request.new_end_date).toLocaleDateString('vi-VN') : 'N/A'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-12 gap-3 md:gap-4">
                              <div className="col-span-12 md:col-span-5">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Gói áp dụng</div>
                                <div className="space-y-1.5">
                                  {(request.affectedPlans || []).length > 0 ? (
                                    request.affectedPlans.map((p: any, i: number) => (
                                      <div key={i} className="text-blue-700 text-sm font-medium">
                                        - {p.name}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-[11px] text-gray-500">Các gói sắp hết hạn hiện tại</div>
                                  )}
                                </div>
                              </div>
                              <div className="col-span-12 md:col-span-2 md:border-l md:border-blue-100 md:pl-3">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Thời gian gia hạn</div>
                                <div className="text-gray-900 font-semibold">
                                  {(() => {
                                    try {
                                      const newEnd = request?.new_end_date ? new Date(request.new_end_date) : null;
                                      const oldDates = (request?.affectedPlans || [])
                                        .map((p: any) => p?.oldEndDate)
                                        .filter((d: any) => !!d)
                                        .map((d: any) => new Date(d));
                                      if (!newEnd || oldDates.length === 0) return 'N/A';
                                      const minOld = new Date(Math.min.apply(null, oldDates.map((d: Date) => d.getTime())));
                                      const diffDays = Math.max(0, Math.ceil((newEnd.getTime() - minOld.getTime()) / (1000 * 60 * 60 * 24)));
                                      const months = Math.max(1, Math.round(diffDays / 30));
                                      return `${months} tháng`;
                                    } catch {
                                      return 'N/A';
                                    }
                                  })()}
                                </div>
                              </div>
                              <div className="col-span-6 md:col-span-2 md:border-l md:border-blue-100 md:pl-3">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Ngày bắt đầu</div>
                                <div className="text-gray-900 font-semibold">
                                  {resolveRequestDate(request, ['new_start_date', 'newStartDate', 'start_date', 'startDate'])}
                                </div>
                              </div>
                              <div className="col-span-6 md:col-span-2 md:border-l md:border-blue-100 md:pl-3">
                                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Ngày hết hạn</div>
                                <div className="text-gray-900 font-semibold">
                                  {(() => {
                                    const src =
                                      request?.new_end_date ||
                                      request?.newEndDate ||
                                      request?.end_date ||
                                      request?.endDate ||
                                      request?.new_start_date ||
                                      request?.newStartDate;
                                    return endOfMonthFromDateString(src);
                                  })()}
                                </div>
                              </div>
                              {/* Ghi chú đã được yêu cầu bỏ */}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push('/family/services')}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 shadow-sm"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Quay lại danh sách
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Banner for Expiring Services */}
        {hasExpiringOrExpiredCarePlans() && !hasPendingServiceRequests() && (
          <div className="mb-4 bg-red-100 rounded-xl p-4 shadow-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-1">
                    CẢNH BÁO: CÓ GÓI DỊCH VỤ SẮP HẾT HẠN!
                  </h3>
                  <p className="text-red-700 text-sm font-medium">
                    Gói dịch vụ của <span className="font-bold text-red-900">{selectedRelative?.full_name || selectedRelative?.name || 'người thân'}</span> sắp hết hạn
                    {(() => {
                      const expiringCarePlans = carePlanDetails.filter((carePlan: any) => {
                        const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
                        return carePlanAssignment && (isCarePlanExpired(carePlanAssignment) || isCarePlanExpiringSoon(carePlanAssignment));
                      });
                      
                      if (expiringCarePlans.length === 0) return '';
                      
                      // Tìm ngày hết hạn gần nhất
                      let nearestExpiry: Date | null = null;
                      let nearestDays = Infinity;
                      
                      expiringCarePlans.forEach((carePlan: any) => {
                        const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
                        if (carePlanAssignment?.end_date) {
                          const endDate = new Date(carePlanAssignment.end_date);
                          const today = new Date();
                          const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (daysUntilExpiry < nearestDays) {
                            nearestDays = daysUntilExpiry;
                            nearestExpiry = endDate;
                          }
                        }
                      });
                      
                      if (nearestDays < 0) {
                        return ` (đã hết hạn ${Math.abs(nearestDays)} ngày)`;
                      } else if (nearestDays === 0) {
                        return ' (hết hạn hôm nay)';
                      } else if (nearestDays === 1) {
                        return ' (hết hạn ngày mai)';
                      } else {
                        return ` (còn ${nearestDays} ngày)`;
                      }
                    })()}.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkExtensionModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center gap-1 shadow-md hover:shadow-lg text-sm"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  GIA HẠN
                </button>
                <button
                  onClick={() => router.push(`/family/services/${selectedRelative?._id || selectedRelative?.id}/change`)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  THAY ĐỔI
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-6">
              <div className="text-center mb-6">

                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg">
                  <img
                    src={getAvatarUrl(selectedRelative.avatar)}
                    alt={`Ảnh đại diện của ${selectedRelative.full_name || selectedRelative.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-700 font-medium text-sm mb-2">Tên người cao tuổi:</p>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedRelative.full_name || selectedRelative.name || 'Không có tên'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 font-medium text-sm mb-2">Ngày sinh:</p>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900 font-medium">
                      {selectedRelative.date_of_birth || selectedRelative.dateOfBirth ? (
                        (() => {
                          const birthDate = new Date(selectedRelative.date_of_birth || selectedRelative.dateOfBirth);
                          const age = new Date().getFullYear() - birthDate.getFullYear();
                          const formattedDate = birthDate.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                          return `${formattedDate} (${age} tuổi)`;
                        })()
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 font-medium text-sm mb-2">Số phòng:</p>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <HomeIcon className="w-5 h-5 text-green-600" />
                    <span className="text-gray-900 font-medium">
                      {roomLoading ? 'Đang tải...' : roomNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bulk Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                 <div className="flex gap-2">
                  {hasExpiringOrExpiredCarePlans() && !hasPendingServiceRequests() && (
                    <button
                      onClick={() => setShowBulkExtensionModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Gia hạn tất cả
                    </button>
                  )}
                  {!hasPendingServiceRequests() && (
                    <button
                      onClick={() => router.push(`/family/services/${selectedRelative?._id || selectedRelative?.id}/change`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <ArrowRightIcon className="w-4 h-4" />
                      Thay đổi dịch vụ
                    </button>
                  )}
                </div>
                {hasExpiringOrExpiredCarePlans() && !hasPendingServiceRequests() && (
                  <p className="text-yellow-600 text-xs text-center mt-2 font-medium">
                    Có gói dịch vụ sắp hết hạn
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Gói dịch vụ đã đăng ký</h3>
                    <p className="text-blue-100">Thông tin chi tiết về gói dịch vụ đang sử dụng</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingCarePlanDetail ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin dịch vụ...</p>
                  </div>
                ) : residentCarePlanDetail ? (
                  <div className="space-y-6">


                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Tổng chi phí dịch vụ</h4>
                          <p className="text-gray-600 text-sm">Chi phí hàng tháng bao gồm phòng và dịch vụ</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600 mb-1">
                          {formatDisplayCurrency(getDisplayRoomPrice() + calculateTotalServiceCost())}
                        </p>
                        <p className="text-gray-600 text-sm mb-4">Mỗi tháng</p>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-gray-600 text-sm">Tiền phòng</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatDisplayCurrency(getDisplayRoomPrice())}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600 text-sm">Tiền dịch vụ</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatDisplayCurrency(calculateTotalServiceCost())}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Gói dịch vụ đã đăng ký</h4>
                          <p className="text-gray-600 text-sm">Chi tiết các dịch vụ đang sử dụng</p>
                        </div>
                        <div className="ml-4">
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            Tổng: {carePlanDetails.length} gói dịch vụ
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {carePlanDetails.length > 0 ? (
                          carePlanDetails.map((carePlan: any, index: number) => {
                          const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
                            
                            // Chỉ loại bỏ các assignment bị hủy
                            if (!carePlanAssignment || carePlanAssignment.status === 'cancelled') {
                              return null; // Không hiển thị gói bị hủy
                            }
                            
                          return (
                            <div key={index} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-1">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h5 className="font-bold text-gray-900 text-lg">{carePlan.plan_name}</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      carePlanAssignment?.status === 'completed' 
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : carePlanAssignment?.status === 'active' || carePlanAssignment?.status === 'approved'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : carePlanAssignment?.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}>
                                      {carePlanAssignment?.status === 'completed' ? 'Hoàn tất đăng ký' :
                                       carePlanAssignment?.status === 'active' || carePlanAssignment?.status === 'approved' ? 'Đang sử dụng' :
                                       carePlanAssignment?.status === 'pending' ? 'Đang chờ duyệt' :
                                       carePlanAssignment?.status || 'Không xác định'}
                                    </span>
                                    {/* Expiry Warning Badge */}
                                    {isCarePlanExpired(carePlanAssignment) && (
                                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                        ĐÃ HẾT HẠN
                                      </span>
                                    )}
                                    {isCarePlanExpiringSoon(carePlanAssignment) && !isCarePlanExpired(carePlanAssignment) && (
                                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse">
                                        SẮP HẾT HẠN
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 text-sm leading-relaxed">{carePlan.description}</p>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <span className="text-gray-500 text-xs">Giá:</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {formatDisplayCurrency(carePlan.monthly_price || 0)}
                                    </span>
                                  </div>
                                  <p className="text-gray-500 text-xs">mỗi tháng</p>
                                </div>
                              </div>

                              <div className={`rounded-lg p-3 mb-3 border ${
                                isCarePlanExpired(carePlanAssignment) 
                                  ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' 
                                  : isCarePlanExpiringSoon(carePlanAssignment)
                                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'
                              }`}>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                      <ClockIcon className="w-4 h-4 text-green-600" />
                                      <span className="text-green-700 text-xs font-medium">Ngày bắt đầu</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {carePlanAssignment?.start_date ? formatDate(carePlanAssignment.start_date) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                      <CalendarIcon className={`w-4 h-4 ${
                                        isCarePlanExpired(carePlanAssignment) 
                                          ? 'text-red-600' 
                                          : isCarePlanExpiringSoon(carePlanAssignment)
                                          ? 'text-yellow-600'
                                          : 'text-purple-600'
                                      }`} />
                                      <span className={`text-xs font-medium ${
                                        isCarePlanExpired(carePlanAssignment) 
                                          ? 'text-red-700' 
                                          : isCarePlanExpiringSoon(carePlanAssignment)
                                          ? 'text-yellow-700'
                                          : 'text-purple-700'
                                      }`}>Ngày kết thúc đến hết ngày</span>
                                    </div>
                                    <p className={`text-sm font-semibold ${
                                      isCarePlanExpired(carePlanAssignment) 
                                        ? 'text-red-900' 
                                        : isCarePlanExpiringSoon(carePlanAssignment)
                                        ? 'text-yellow-900'
                                        : 'text-gray-900'
                                    }`}>
                                      {carePlanAssignment?.end_date ? formatDate(carePlanAssignment.end_date) : 'Không có thời hạn'}
                                    </p>
                                    {/* Days remaining indicator: only show when <= 7 days or expired */}
                                    {carePlanAssignment?.end_date && (() => {
                                      const endDate = new Date(carePlanAssignment.end_date);
                                      const today = new Date();
                                      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                      if (daysUntilExpiry > 7) return null;
                                      return (
                                        <p className={`text-xs font-bold mt-1 ${
                                          isCarePlanExpired(carePlanAssignment) 
                                            ? 'text-red-600' 
                                            : isCarePlanExpiringSoon(carePlanAssignment)
                                            ? 'text-yellow-600'
                                            : 'text-green-600'
                                        }`}>
                                          {daysUntilExpiry < 0
                                            ? `Đã hết hạn ${Math.abs(daysUntilExpiry)} ngày`
                                            : daysUntilExpiry === 0
                                            ? 'Hết hạn hôm nay'
                                            : `Còn ${daysUntilExpiry} ngày`}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-gray-100 pt-3">
                                <p className="text-gray-700 text-sm font-medium mb-2">Dịch vụ bao gồm:</p>
                                <div className="flex flex-wrap gap-2">
                                  {carePlan.services_included?.slice(0, expandedServices[index] ? undefined : 4).map((service: string, serviceIndex: number) => (
                                    <span key={serviceIndex} className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                      {service}
                                    </span>
                                  ))}
                                  {carePlan.services_included?.length > 4 && !expandedServices[index] && (
                                    <button
                                      onClick={() => toggleServiceExpansion(index)}
                                      className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium hover:bg-blue-200 transition-colors cursor-pointer flex items-center space-x-1"
                                      aria-label={`Xem thêm ${carePlan.services_included.length - 4} dịch vụ khác của ${carePlan.plan_name}`}
                                    >
                                      <span>+{carePlan.services_included.length - 4} dịch vụ khác</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  )}
                                  {carePlan.services_included?.length > 4 && expandedServices[index] && (
                                    <button
                                      onClick={() => toggleServiceExpansion(index)}
                                      className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200 font-medium hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-1"
                                      aria-label={`Thu gọn danh sách dịch vụ của ${carePlan.plan_name}`}
                                    >
                                      <span>Thu gọn danh sách</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                          }).filter(Boolean) // Lọc bỏ các item null
                        ) : (
                          <div className="text-center py-8">
                            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Không có gói dịch vụ đang hoạt động</p>
                            <p className="text-gray-400 text-sm mt-1">Tất cả gói dịch vụ đã hết hạn hoặc bị hủy</p>
                          </div>
                        )}
                      </div>
                    </div>



                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <HomeIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Phòng & Giường</h4>
                          <p className="text-gray-600 text-sm">Vị trí lưu trú hiện tại</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-gray-600 text-sm mb-1">Phòng</p>
                            <p className="text-xl font-bold text-green-600">
                              {roomLoading ? 'Đang tải...' : roomNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-gray-600 text-sm mb-1">Giường</p>
                            <p className="text-xl font-bold text-green-600">
                              {roomLoading ? 'Đang tải...' : bedNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>



                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có gói dịch vụ</h3>
                    <p className="text-gray-600 mb-4">
                      {selectedRelative.full_name || selectedRelative.name || 'Người thân'} chưa đăng ký gói dịch vụ nào
                    </p>
                    <button
                      onClick={() => router.push('/services/purchase')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Chuyển đến trang đăng ký dịch vụ mới"
                    >
                      Đăng ký dịch vụ mới
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


       {/* Bulk Extension Modal */}
       {showBulkExtensionModal && (
         <BulkExtensionModal
           carePlanDetails={carePlanDetails}
           getAssignmentForCarePlan={getAssignmentForCarePlan}
           isCarePlanExpired={isCarePlanExpired}
           isCarePlanExpiringSoon={isCarePlanExpiringSoon}
           residentId={selectedRelative?._id}
           onClose={() => setShowBulkExtensionModal(false)}
           onSuccess={() => {
             setShowBulkExtensionModal(false);
             // Refresh data
             window.location.reload();
           }}
           onShowSuccess={(message) => {
             setSuccessMessage(message);
             setShowSuccessModal(true);
           }}
         />
       )}

      {/* Bulk Change Modal removed in favor of dedicated change page */}

       {/* Success Modal */}
       {showSuccessModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
             <div className="text-center">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircleIcon className="w-8 h-8 text-green-600" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Thành công!</h3>
               <p className="text-gray-600 mb-6">{successMessage}</p>
               <button
                 onClick={() => setShowSuccessModal(false)}
                 className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
               >
                 Đóng
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
} 

// Bulk Extension Modal Component
function BulkExtensionModal({ 
  carePlanDetails, 
  getAssignmentForCarePlan, 
  isCarePlanExpired, 
  isCarePlanExpiringSoon, 
  residentId, 
  onClose, 
  onSuccess,
  onShowSuccess
}: { 
  carePlanDetails: any[]; 
  getAssignmentForCarePlan: (id: string) => any; 
  isCarePlanExpired: (assignment: any) => boolean; 
  isCarePlanExpiringSoon: (assignment: any) => boolean; 
  residentId: string; 
  onClose: () => void; 
  onSuccess: () => void; 
  onShowSuccess: (message: string) => void;
}) {
  const [extensionPeriod, setExtensionPeriod] = useState('6'); // '3' | '6' | '12' | 'custom'
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const [customMonths, setCustomMonths] = useState<string>('3');
    
    // Helpers for date display within the modal
    const formatDisplay = (date: Date) => date.toLocaleDateString('vi-VN');
    const getEndOfMonthAfterAddingMonths = (baseDate: Date, addMonths: number) => {
      return new Date(baseDate.getFullYear(), baseDate.getMonth() + addMonths + 1, 0);
    };
  const addDays = (date: Date, numDays: number) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + numDays);
    return d;
  };
  
  // Format YYYY-MM-DD in local time to avoid timezone shift
  const formatLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Get all expiring/expired care plans
  const expiringCarePlans = carePlanDetails.filter((carePlan: any) => {
    const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
    return carePlanAssignment && (isCarePlanExpired(carePlanAssignment) || isCarePlanExpiringSoon(carePlanAssignment));
  });
  const expiredCount = expiringCarePlans.filter((cp: any) => {
    const a = getAssignmentForCarePlan(cp._id);
    return isCarePlanExpired(a);
  }).length;
  const expiringSoonCount = Math.max(0, expiringCarePlans.length - expiredCount);
  
    // Preview start/end dates for the bulk extension (using the earliest current end date)
    const previewBaseEndDate: Date | null = (() => {
      const ends = expiringCarePlans
        .map((cp: any) => getAssignmentForCarePlan(cp._id))
        .map((a: any) => (a?.end_date ? new Date(a.end_date) : null))
        .filter((d: Date | null) => d && !isNaN((d as Date).getTime())) as Date[];
      if (!ends.length) return null;
      return new Date(Math.min.apply(null, ends.map(d => d.getTime())));
    })();
  
    const previewMonths: number = (() => {
      const isCustom = extensionPeriod === 'custom';
      const parsed = isCustom ? parseInt(customMonths) : parseInt(extensionPeriod);
      return Number.isFinite(parsed) ? Math.max(3, parsed) : 0;
    })();
  
  const previewStartDateText = previewBaseEndDate ? formatDisplay(addDays(previewBaseEndDate, 1)) : 'N/A';
  const previewEndDateText = previewBaseEndDate && previewMonths > 0
      ? formatDisplay(getEndOfMonthAfterAddingMonths(addDays(previewBaseEndDate, 1), previewMonths))
      : 'N/A';

  // Load user profile to get phone number
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await userAPI.getById(user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionPeriod || !note.trim()) return;
    const isCustom = extensionPeriod === 'custom';
    const parsed = isCustom ? parseInt(customMonths) : parseInt(extensionPeriod);
    const extensionMonths = Number.isFinite(parsed) ? Math.max(3, parsed) : 0;
    if (!extensionMonths) return;

    setSubmitting(true);
    try {
      // Create extension requests for all expiring care plans
      const requests = expiringCarePlans.map(async (carePlan: any) => {
        const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
        const currentEndDate = new Date(carePlanAssignment?.end_date || new Date());
        // Ngày bắt đầu = ngày kế tiếp ngày hết hạn hiện tại (local)
        const nextDayAfterEnd = addDays(currentEndDate, 1);
        const newStartDate = formatLocalYMD(nextDayAfterEnd);

        // Ngày hết hạn mới = ngày cuối cùng của tháng đích tính từ ngày bắt đầu mới
        const targetMonthEnd = new Date(
          nextDayAfterEnd.getFullYear(),
          nextDayAfterEnd.getMonth() + extensionMonths + 1,
          0
        );
        const newEndDateStr = formatLocalYMD(targetMonthEnd);
        
        return serviceRequestsAPI.create({
          resident_id: residentId,
          family_member_id: user?.id || '',
          request_type: 'service_date_change',
          new_start_date: newStartDate,
          new_end_date: newEndDateStr,
          note: `${note} (Gia hạn gói: ${carePlan.plan_name} thêm ${extensionMonths} tháng)`,
          emergencyContactName: userProfile?.full_name || user?.name || '',
          emergencyContactPhone: userProfile?.phone || user?.phone || ''
        });
      });

      await Promise.all(requests);
      const extensionText = `${extensionMonths} tháng`;
      onShowSuccess(`Đã gửi thành công ${requests.length} yêu cầu gia hạn dịch vụ thêm ${extensionText}`);
      onSuccess();
    } catch (error) {
      console.error('Error submitting bulk extension requests:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow">
              <ArrowPathIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Gia hạn tất cả gói dịch vụ</h3>
              <p className="text-xs font-medium text-slate-500">Thực hiện gia hạn cho các gói sắp hết hạn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white ring-1 ring-amber-100 flex items-center justify-center shadow-sm">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Sẽ gia hạn {expiringCarePlans.length} gói dịch vụ</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {expiredCount} đã hết hạn
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {expiringSoonCount} sắp hết hạn
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(v => !v)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                {showDetails ? 'Thu gọn' : 'Xem chi tiết'}
              </button>
            </div>
            {showDetails && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {expiringCarePlans.map((carePlan: any) => {
              const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
              const isExpired = isCarePlanExpired(carePlanAssignment);
              return (
                    <div key={carePlan._id} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 border border-amber-100">
                      <span className="text-sm font-medium text-slate-800 whitespace-normal break-words" title={carePlan.plan_name}>
                        {carePlan.plan_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isExpired ? 'Đã hết hạn' : 'Sắp hết hạn'}
                  </span>
                </div>
              );
            })}
          </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời gian gia hạn</label>
                <div className="flex items-center gap-2 flex-nowrap w-full">
                  {['3','6','12','custom'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setExtensionPeriod(opt)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors border-2 whitespace-nowrap ${extensionPeriod === opt
                        ? opt === 'custom'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      aria-pressed={extensionPeriod === opt}
                    >
                      {opt === '3' && '3 tháng'}
                      {opt === '6' && '6 tháng'}
                      {opt === '12' && '12 tháng'}
                      {opt === 'custom' && 'Tùy chọn'}
                    </button>
                  ))}
                  {extensionPeriod === 'custom' && (
                    <div className="relative flex-shrink-0">
                      <input
                        type="number"
                        min={3}
                        step={1}
                        value={customMonths}
                        onChange={(e) => setCustomMonths(e.target.value)}
                        placeholder="Số tháng"
                        className="w-36 pr-12 rounded-xl border-2 border-amber-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        aria-label="Số tháng gia hạn tùy chọn"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">tháng</span>
                    </div>
                  )}
                </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                  Thời gian gia hạn tối thiểu là 3 tháng.
                  </p>
                  
              </div>
              <div className="hidden sm:block" />
          </div>

          {/* Preview start/end dates */}
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50/60 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Ngày bắt đầu</div>
                <div className="text-gray-900 font-semibold">
                  {previewStartDateText}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Ngày kết thúc</div>
                <div className="text-gray-900 font-semibold">
                  {previewEndDateText}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-blue-700">Thời gian hiệu lực được tính nối tiếp từ ngày hết hạn hiện tại và tự động đến cuối tháng.</p>
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập lý do gia hạn tất cả gói dịch vụ..."
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              rows={3}
              required
            />
          </div>

            <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
                className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!extensionPeriod || !note.trim() || submitting}
                className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${(!extensionPeriod || !note.trim() || submitting)
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700'}`}
            >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

// Old BulkChangeModal removed; now handled by dedicated change page
