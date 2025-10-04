"use client";

import { useEffect, useState } from "react";
import useSWR from 'swr';
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { serviceRequestsAPI, residentAPI, roomsAPI, roomTypesAPI, bedsAPI, bedAssignmentsAPI, userAPI, carePlanAssignmentsAPI } from "@/lib/api";
import { useBedAssignments as useBedAssignmentsSWR, useRoom as useRoomSWR } from '@/hooks/useSWRData';
import {
  ArrowLeftIcon,
  HomeIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PhoneIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleIconSolid,
  HomeIcon as HomeIconSolid
} from "@heroicons/react/24/solid";

// Helper function to check if bed assignment is active (for admitted residents)
const isBedAssignmentActive = (assignment) => {
  if (!assignment) return false;
  
  // Chỉ chấp nhận status 'done' và 'active'
  if (assignment.status !== 'done' && assignment.status !== 'active') return false;
  
  // Nếu status là 'active', luôn active
  if (assignment.status === 'active') return true;
  
  // Nếu status là 'done', kiểm tra unassigned_date
  if (assignment.status === 'done') {
    if (!assignment.unassigned_date) return true; // null = active
    const unassignedDate = new Date(assignment.unassigned_date);
    const now = new Date();
    return unassignedDate > now; // ngày trong tương lai = active
  }
  
  return false;
};

interface Resident {
  _id: string;
  full_name: string;
  date_of_birth: string;
  cccd_id: string;
  status: string;
  current_room?: {
    _id: string;
    room_number: string;
    floor: number;
  };
}

interface Room {
  _id: string;
  room_number: string;
  bed_count: number;
  room_type: string;
  gender: string;
  floor: number;
  status: string;
}

interface RoomType {
  _id: string;
  room_type: string;
  type_name: string;
  bed_count: string;
  monthly_price: number;
  description: string;
  amenities: string[];
}

interface Bed {
  _id: string;
  bed_number: string;
  room_id: string | { _id: string; room_number: string };
  bed_type: string;
  status: string;
}


export default function RoomChangeRequestPage() {
  const { user, loading } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();

  // SWR sources
  const { data: residents = [], isLoading: residentsLoading } = useSWR<Resident[]>(
    () => (user?.id ? ["familyResidents", user.id] : null),
    () => residentAPI.getByFamilyMemberId(user?.id || ''),
    { revalidateOnFocus: true }
  );
  const { data: rooms = [], isLoading: roomsLoading } = useSWR<Room[]>(
    'rooms:list',
    () => roomsAPI.getAll(),
    { revalidateOnFocus: true }
  );
  const { data: beds = [], isLoading: bedsLoading } = useSWR<Bed[]>(
    'beds:list',
    () => bedsAPI.getAll(),
    { revalidateOnFocus: true }
  );
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useSWR<RoomType[]>(
    'roomTypes:list',
    () => roomTypesAPI.getAll(),
    { revalidateOnFocus: true }
  );
  const [currentCarePlanAssignment, setCurrentCarePlanAssignment] = useState<any | null>(null);
  const [selectedResident, setSelectedResident] = useState<string>("");
  
  // SWR hooks for bed assignments and room data
  const { bedAssignment, roomId, isLoading: bedIsLoading } = useBedAssignmentsSWR(selectedResident);
  const { room, isLoading: roomIsLoading } = useRoomSWR(roomId || '');
  const { data: serviceRequests = [], isLoading: serviceRequestsLoading } = useSWR<any[]>(
    () => (user?.id ? ["serviceRequests:mine", user.id] : null),
    () => serviceRequestsAPI.getMyRequests(),
    { revalidateOnFocus: true }
  );
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedBed, setSelectedBed] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [changeType, setChangeType] = useState<'room' | 'bed'>('room'); // 'room' = chuyển phòng, 'bed' = chuyển giường
  const loadingData = residentsLoading || roomsLoading || bedsLoading || roomTypesLoading || serviceRequestsLoading;
  const currentInfoLoading = bedIsLoading || roomIsLoading;
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const hasPendingRoomChangeRequest = (residentId: string) => {
    return serviceRequests.some((request: any) => {
      const reqResidentId = typeof request.resident_id === 'string'
        ? request.resident_id
        : request.resident_id?._id || request.resident_id;
      return (
        String(reqResidentId) === String(residentId) &&
        request.request_type === 'room_change' &&
        request.status === 'pending'
      );
    });
  };

  const getCurrentRoomAndBed = (residentId: string) => {
    // Chỉ trả về data nếu đang load cho resident được chọn
    if (String(residentId) !== String(selectedResident)) {
      return { room: null, bed: null };
    }

    // Sử dụng data từ SWR hooks
    if (!bedAssignment) return { room: null, bed: null };

    // Resolve bed
    let bed: any = null;
    if (bedAssignment.bed_id && typeof bedAssignment.bed_id === 'object') {
      bed = bedAssignment.bed_id;
    } else if (bedAssignment.bed_id) {
      bed = beds.find((b: any) => b._id === bedAssignment.bed_id);
    }

    if (!bed) return { room: null, bed: null };

    // Sử dụng room từ SWR hook hoặc tìm từ beds list
    if (room) {
      return { room, bed };
    }

    // Fallback: resolve room from beds list
    const bedRoomId = typeof bed.room_id === 'string' ? bed.room_id : (bed.room_id?._id || bed.room_id);
    const foundRoom = rooms.find((r: any) => String(r._id) === String(bedRoomId)) || null;

    return { room: foundRoom, bed };
  };

  const getAvailableRooms = () => {
    if (!selectedResident) return [];

    const resident = residents.find(r => r._id === selectedResident);
    if (!resident) return [];

    // Check if resident is eligible for room change (only admitted)
    if (resident.status !== 'admitted') {
      return [];
    }

    const { room: currentRoom } = getCurrentRoomAndBed(selectedResident);

    // Debug log để kiểm tra phòng hiện tại
    console.log('Current room debug:', {
      selectedResident,
      currentRoom: currentRoom ? {
        id: currentRoom._id,
        number: currentRoom.room_number,
        gender: currentRoom.gender
      } : null,
      totalRooms: rooms.length
    });

    const filteredRooms = rooms.filter(room => {
      // Same gender requirement - sử dụng giới tính của phòng hiện tại hoặc mặc định
      const residentGender = currentRoom?.gender || 'male'; // default
      const sameGender = room.gender === residentGender;

      // Kiểm tra xem phòng có giường trống hay không
      const roomBeds = beds.filter(bed => {
        const bedRoomId = typeof bed.room_id === 'string'
          ? bed.room_id
          : (bed.room_id as { _id: string })._id;
        return bedRoomId === room._id;
      });

      // Sử dụng status từ beds thay vì bedAssignments, loại trừ giường đang được yêu cầu
      const hasAvailableBeds = roomBeds.some(bed =>
        bed.status === 'available'
      );

      // Validation: Kiểm tra main care plan id cho ROOM_CHANGE
      // Phòng mới phải có cùng main care plan id với phòng hiện tại
      let sameMainCarePlan = true;
      if (currentCarePlanAssignment && currentCarePlanAssignment.care_plan_ids && Array.isArray(currentCarePlanAssignment.care_plan_ids)) {
        // Lấy main care plan id từ current assignment (care plan đầu tiên trong mảng)
        const currentMainCarePlanId = currentCarePlanAssignment.care_plan_ids[0];
        const currentMainCarePlanIdStr = typeof currentMainCarePlanId === 'string' ? currentMainCarePlanId : currentMainCarePlanId?._id;
        
        // Kiểm tra phòng mới có cùng main care plan id không
        // Giả sử room có field main_care_plan_id hoặc tương tự
        // Nếu không có field này, có thể cần thêm logic khác
        if ((room as any).main_care_plan_id && currentMainCarePlanIdStr) {
          sameMainCarePlan = (room as any).main_care_plan_id === currentMainCarePlanIdStr;
        }
      }

      // Debug log
      console.log('Room filter debug:', {
        roomNumber: room.room_number,
        roomGender: room.gender,
        residentGender,
        sameGender,
        hasAvailableBeds,
        sameMainCarePlan,
        isCurrentRoom: currentRoom && room._id === currentRoom._id,
        roomBedsCount: roomBeds.length,
        availableBedsCount: roomBeds.filter(bed => bed.status === 'available').length,
        currentMainCarePlanId: currentCarePlanAssignment?.care_plan_ids?.[0],
        roomMainCarePlanId: (room as any).main_care_plan_id
      });

      // Luôn cho phép chọn phòng hiện tại nếu có giường trống (để chuyển giường)
      // Và cho phép chọn phòng khác nếu có giường trống và cùng main care plan (để chuyển phòng)
      
      // Đặc biệt: Luôn cho phép chọn phòng hiện tại nếu có giường trống
      if (currentRoom && room._id === currentRoom._id) {
        return hasAvailableBeds;
      }
      
      // Các phòng khác: cần cùng giới tính, có giường trống và cùng main care plan id
      return sameGender && hasAvailableBeds && sameMainCarePlan;
    });

    // Fallback: Nếu phòng hiện tại không có trong danh sách, thêm vào nếu có giường trống
    if (currentRoom && !filteredRooms.some(room => room._id === currentRoom._id)) {
      const currentRoomBeds = beds.filter(bed => {
        const bedRoomId = typeof bed.room_id === 'string'
          ? bed.room_id
          : (bed.room_id as { _id: string })._id;
        return bedRoomId === currentRoom._id;
      });
      
      const hasAvailableBedsInCurrentRoom = currentRoomBeds.some(bed =>
        bed.status === 'available'
      );
      
      if (hasAvailableBedsInCurrentRoom) {
        console.log('Adding current room to available rooms:', currentRoom.room_number);
        filteredRooms.unshift(currentRoom);
      }
    }

    return filteredRooms;
  };

  // Xác định loại thay đổi dựa trên phòng được chọn
  const determineChangeType = (roomId: string) => {
    const { room: currentRoom } = getCurrentRoomAndBed(selectedResident);
    return currentRoom && roomId === currentRoom._id ? 'bed' : 'room';
  };

  const bedsOfRoom = (roomId: string) => {
    const roomBeds = beds.filter(bed => {
      const bedRoomId = typeof bed.room_id === 'string'
        ? bed.room_id
        : (bed.room_id as { _id: string })._id;
      return bedRoomId === roomId;
    });

    // Kiểm tra giường có đang trong quá trình duyệt không
    const bedsWithStatus = roomBeds.map(bed => {
      // Kiểm tra xem giường này có đang được yêu cầu trong service requests pending không
      const isPendingInRequest = serviceRequests.some((request: any) => {
        if (request.request_type === 'room_change' && request.status === 'pending' && request.target_bed_assignment_id) {
          // Tạm thời disable logic này vì cần refactor để không phụ thuộc vào bedAssignments array
          return false;
        }
        return false;
      });

      return {
        _id: bed._id,
        bed_number: bed.bed_number,
        room_id: roomId,
        bed_type: bed.bed_type || 'standard',
        status: isPendingInRequest ? 'pending_request' : bed.status, // Đánh dấu giường đang được yêu cầu
        assignment: null // Không cần assignment cho family role
      };
    });

    return bedsWithStatus;
  };

  const handleRoomSelection = (roomId: string) => {
    const roomBeds = bedsOfRoom(roomId);
    const { bed: currentBed } = getCurrentRoomAndBed(selectedResident);

    // Xác định loại thay đổi
    const newChangeType = determineChangeType(roomId);
    setChangeType(newChangeType);

    // Lọc giường trống, nhưng nếu chọn phòng cũ thì loại trừ giường hiện tại
    const availableBedsData = roomBeds.filter(bed => {
      // Loại trừ giường đang được yêu cầu bởi người khác
      if (bed.status === 'pending_request') return false;

      // Loại trừ giường không available
      if (bed.status !== 'available') return false;

      // Nếu chọn phòng cũ và giường này là giường hiện tại thì loại trừ
      if (currentBed && bed._id === currentBed._id) return false;

      return true;
    });

    setSelectedRoom(roomId);
    setSelectedBed("");
    setAvailableBeds(availableBedsData);
  };

  const handleBedSelection = (bedId: string) => {
    setSelectedBed(bedId);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Reset form
    setSelectedResident("");
    setSelectedRoom("");
    setSelectedBed("");
    setAvailableBeds([]);
    setNote("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    // Navigate back to family page
    router.push('/family');
  };

  const loadUserInfo = async () => {
    if (!user?.id) return;

    try {
      const profile = await userAPI.getById(user.id);
      if (profile) {
        setUserProfile(profile);
        // Chỉ điền vào form nếu user chưa nhập gì
        if (!emergencyContactName) {
          setEmergencyContactName(profile.full_name || "");
        }
        if (!emergencyContactPhone) {
          setEmergencyContactPhone(profile.phone || "");
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "family")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load care plan assignment for the selected resident
  useEffect(() => {
    let isCancelled = false;
    const fetchCarePlanAssignment = async () => {
      if (!selectedResident) {
        setCurrentCarePlanAssignment(null);
        return;
      }
      try {
        // Fetch care plan assignments
        const carePlanAssignments = await carePlanAssignmentsAPI.getByResidentId(selectedResident);
        if (isCancelled) return;
        const activeCarePlanAssignment = Array.isArray(carePlanAssignments) ? carePlanAssignments.find((a: any) => 
          a.status === 'active'
        ) : null;
        setCurrentCarePlanAssignment(activeCarePlanAssignment || null);
      } catch {
        if (isCancelled) return;
        setCurrentCarePlanAssignment(null);
      }
    };
    fetchCarePlanAssignment();
    return () => { isCancelled = true; };
  }, [selectedResident]);

  // Load user profile once
  useEffect(() => {
    loadUserInfo();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResident || !selectedRoom || !selectedBed || !note.trim()) {
      addNotification({
        type: 'error',
        title: 'Thiếu thông tin',
        message: changeType === 'room' 
          ? 'Vui lòng chọn người thân, phòng, giường mới và nhập lý do đổi phòng.'
          : 'Vui lòng chọn người thân, giường mới và nhập lý do chuyển giường.',
        category: 'system'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Lấy bed assignment hiện tại để lấy unassigned_date
      const currentBedAssignment = bedAssignment;
      const unassignedDate = currentBedAssignment?.unassigned_date || null;

      console.log('Current bed assignment:', currentBedAssignment);
      console.log('Unassigned date from current assignment:', unassignedDate);

      // Bước 1: Tạo bed assignment mới với status "pending"
      const bedAssignmentData = {
        resident_id: selectedResident,
        bed_id: selectedBed,
        assigned_by: user?.id || '',
        status: 'pending',
        unassigned_date: unassignedDate // Truyền unassigned_date từ bed assignment hiện tại
      };

      console.log('Creating bed assignment:', bedAssignmentData);
      const newBedAssignment = await bedAssignmentsAPI.create(bedAssignmentData);
      console.log('Bed assignment created:', newBedAssignment);
      console.log('Bed assignment ID:', newBedAssignment._id);

      // Validate that we have the bed assignment ID
      if (!newBedAssignment || !newBedAssignment._id) {
        throw new Error('Failed to create bed assignment - no ID returned');
      }

      // Bước 2: Tạo service request với target_bed_assignment_id
      const serviceRequestData = {
        resident_id: selectedResident,
        family_member_id: user?.id || '',
        request_type: 'room_change' as const,
        target_bed_assignment_id: newBedAssignment._id,
        note: note,
        emergencyContactName: emergencyContactName || userProfile?.full_name || '',
        emergencyContactPhone: emergencyContactPhone || userProfile?.phone || '',
        medicalNote: '' // Optional field
      };

      console.log('Creating service request:', serviceRequestData);
      await serviceRequestsAPI.create(serviceRequestData);

      // Show success modal instead of redirecting immediately
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      addNotification({
        type: 'error',
        title: 'Lỗi gửi yêu cầu',
        message: 'Không thể gửi yêu cầu đổi phòng. Vui lòng thử lại.',
        category: 'system'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "family") return null;

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto p-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-white to-blue-50 rounded-3xl p-8 mb-8 shadow-xl border border-blue-100">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/family/room')}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại quản lý phòng"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <HomeIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Yêu cầu đổi phòng
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Gửi yêu cầu đổi phòng cho người thân
              </p>
            </div>
          </div>
        </div>

        <div className={`grid gap-8 ${selectedResident ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          {/* Sidebar - Current Information - Only show when resident is selected */}
          {selectedResident && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
                  Thông tin hiện tại
                </h2>

                <div className="space-y-4">
                  {/* Resident Info */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
                        👤
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Người thân</p>
                        <p className="text-sm font-bold text-blue-900">
                          {residents.find(r => r._id === selectedResident)?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="ml-10 text-xs text-blue-600">
                      <p><span className="font-medium">Trạng thái:</span> {
                        (() => {
                          const resident = residents.find(r => r._id === selectedResident);
                          return resident?.status === 'pending' ? 'Chờ duyệt' :
                            resident?.status === 'rejected' ? 'Bị từ chối' :
                              resident?.status === 'discharged' ? 'Đã xuất viện' :
                                resident?.status === 'admitted' ? 'Đã nhập viện' :
                                  resident?.status === 'active' ? 'Đang hoạt động' :
                                    resident?.status || 'Chưa xác định';
                        })()
                      }</p>
                    </div>
                  </div>

                  {/* Current Room Info */}
                  {(() => {
                    const { room: currentRoom } = getCurrentRoomAndBed(selectedResident);
                    if (currentInfoLoading) {
                      return (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-slate-300 rounded-md animate-pulse" />
                            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                          </div>
                          <div className="ml-10 space-y-2">
                            <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
                            <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
                          </div>
                        </div>
                      );
                    }
                    return currentRoom ? (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white font-bold">
                            <HomeIcon className="w-4 h-4" />
                          </div>
                        <div>
                          <p className="text-xs text-green-700 font-medium">
                            {changeType === 'bed' ? 'Phòng hiện tại (chuyển giường)' : 'Phòng hiện tại'}
                          </p>
                          <p className="text-sm font-bold text-green-900">
                            {currentRoom.room_number} - Tầng {currentRoom.floor}
                          </p>
                        </div>
                        </div>
                        <div className="ml-10 text-xs text-green-600 space-y-1">
                          <p><span className="font-medium">Phòng dành cho:</span> {currentRoom.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                          <p><span className="font-medium">Loại phòng:</span> {getRoomType(currentRoom.room_type)?.type_name}</p>
                          <p><span className="font-medium">Số lượng giường:</span> {currentRoom.bed_count || 'Chưa xác định'} giường</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center text-white font-bold">
                            <HomeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-yellow-700 font-medium">Phòng hiện tại</p>
                            <p className="text-sm font-bold text-yellow-900">
                              Chưa được phân phòng
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Current Bed Info */}
                  {(() => {
                    const { bed: currentBed } = getCurrentRoomAndBed(selectedResident);
                    if (currentInfoLoading) {
                      return (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-slate-300 rounded-md animate-pulse" />
                            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                          </div>
                          <div className="ml-10 space-y-2">
                            <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
                          </div>
                        </div>
                      );
                    }
                    return currentBed ? (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center text-white font-bold">
                            <MapPinIcon className="w-4 h-4" />
                          </div>
                        <div>
                          <p className="text-xs text-purple-700 font-medium">
                            {changeType === 'bed' ? 'Giường hiện tại (sẽ chuyển)' : 'Giường hiện tại'}
                          </p>
                          <p className="text-sm font-bold text-purple-900">
                            {currentBed.bed_number}
                          </p>
                        </div>
                        </div>
                        <div className="ml-10 text-xs text-purple-600">
                          <p><span className="font-medium">Loại giường:</span> {
                            currentBed.bed_type === "standard" ? "Tiêu chuẩn" :
                              currentBed.bed_type === "electric" ? "Giường điện" : currentBed.bed_type
                          }</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center text-white font-bold">
                            <MapPinIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-yellow-700 font-medium">Giường hiện tại</p>
                            <p className="text-sm font-bold text-yellow-900">
                              Chưa được phân giường
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ready to Submit */}
                  {selectedRoom && selectedBed && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white font-bold">
                          <CheckCircleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-green-700 font-medium">Sẵn sàng gửi yêu cầu</p>
                          <p className="text-xs font-medium text-green-900">
                            {changeType === 'room' 
                              ? 'Đã chọn phòng và giường mới'
                              : 'Đã chọn giường mới trong phòng hiện tại'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={selectedResident ? "lg:col-span-2" : "col-span-1"}>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Resident Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  Chọn người thân
                </h2>

                {(() => {
                  const eligibleResidents = residents.filter(r =>
                    r.status === 'admitted' &&
                    !hasPendingRoomChangeRequest(r._id)
                  );

                  if (eligibleResidents.length === 0) {
                    return (
                      <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Không có người thân đủ điều kiện</h3>
                          <p className="text-yellow-800 mb-4">
                            Chỉ có thể đổi phòng cho người thân có trạng thái "Đã nhập viện" và chưa có yêu cầu đổi phòng đang chờ duyệt
                          </p>
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium mb-2">Trạng thái hiện tại của người thân:</p>
                          <ul className="text-left space-y-1">
                            {residents.map((resident) => {
                              const hasPending = hasPendingRoomChangeRequest(resident._id);
                              const statusText = resident.status === 'pending' ? 'Chờ duyệt' :
                                resident.status === 'rejected' ? 'Bị từ chối' :
                                  resident.status === 'discharged' ? 'Đã xuất viện' :
                                    resident.status === 'admitted' ? 'Đã nhập viện' :
                                      resident.status === 'active' ? 'Đang hoạt động' :
                                        resident.status;
                              return (
                                <li key={resident._id} className="flex justify-between">
                                  <span>{resident.full_name}:</span>
                                  <span className="font-medium">
                                    {statusText}
                                    {hasPending && <span className="text-orange-600 ml-1">(Có yêu cầu đổi phòng đang chờ)</span>}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <select
                      value={selectedResident}
                      onChange={(e) => {
                        setSelectedResident(e.target.value);
                        setSelectedRoom(""); // Reset room selection
                      }}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-md hover:shadow-lg font-medium text-slate-700"
                      required
                    >
                      <option value="">-- Chọn người thân --</option>
                      {residents.map((resident) => {
                        const isEligible = resident.status === 'admitted' &&
                          !hasPendingRoomChangeRequest(resident._id);
                        const hasPending = hasPendingRoomChangeRequest(resident._id);
                        return (
                          <option
                            key={resident._id}
                            value={resident._id}
                            disabled={!isEligible}
                          >
                            {resident.full_name} {resident.current_room ? `(Phòng ${resident.current_room.room_number})` : ''}
                            {!isEligible ? ` - ${hasPending ? 'Có yêu cầu đổi phòng đang chờ' :
                              resident.status === 'pending' ? 'Chờ duyệt' :
                                resident.status === 'rejected' ? 'Bị từ chối' :
                                  resident.status === 'discharged' ? 'Đã xuất viện' :
                                    resident.status}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </div>

              {/* Room Selection */}
              {selectedResident && (() => {
                const resident = residents.find(r => r._id === selectedResident);
                const isEligible = resident &&
                  resident.status === 'admitted' &&
                  !hasPendingRoomChangeRequest(resident._id);
                const hasPending = resident && hasPendingRoomChangeRequest(resident._id);

                if (!isEligible) {
                  return (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <HomeIcon className="w-6 h-6 text-blue-600" />
                        Chọn phòng mới
                      </h2>
                      <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Không thể đổi phòng</h3>
                        <p className="text-red-800 mb-2">
                          {resident?.full_name} không đủ điều kiện để đổi phòng
                        </p>
                        {hasPending ? (
                          <p className="text-sm text-red-700">
                            Lý do: <span className="font-medium">Đã có yêu cầu đổi phòng đang chờ duyệt</span>
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-red-700">
                              Trạng thái hiện tại: <span className="font-medium">
                                {resident?.status === 'pending' ? 'Chờ duyệt' :
                                  resident?.status === 'rejected' ? 'Bị từ chối' :
                                    resident?.status === 'discharged' ? 'Đã xuất viện' :
                                      resident?.status}
                              </span>
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                              Chỉ có thể đổi phòng cho người thân có trạng thái "Đã nhập viện"
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <HomeIcon className="w-6 h-6 text-blue-600" />
                      Chọn phòng
                    </h2>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Hướng dẫn:</strong> Chọn phòng hiện tại để chuyển giường trong cùng phòng, hoặc chọn phòng khác để chuyển phòng hoàn toàn.
                      </p>
                    </div>

                    {getAvailableRooms().length === 0 ? (
                      <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Không có phòng khả dụng</h3>
                        <p className="text-yellow-800">Không tìm thấy phòng cùng giới tính và còn trống</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getAvailableRooms().map((room) => {
                          const type = getRoomType(room.room_type);
                          const { room: currentRoom } = getCurrentRoomAndBed(selectedResident);
                          const isCurrentRoom = currentRoom && room._id === currentRoom._id;

                          return (
                            <button
                              key={room._id}
                              type="button"
                              onClick={() => handleRoomSelection(room._id)}
                              className={`p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${selectedRoom === room._id
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl shadow-blue-200/50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 hover:shadow-lg'
                                }`}
                            >
                              {/* Decorative background pattern */}
                              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>

                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                      <HomeIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-xl text-gray-900">
                                        Phòng {room.room_number}
                                      </span>
                                      {isCurrentRoom && (
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                          Phòng hiện tại (chuyển giường)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </div>
                              <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">🏢</span>
                                  </div>
                                  <span className="font-medium">Tầng:</span> {room.floor}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">🏠</span>
                                  </div>
                                  <span className="font-medium">Loại:</span> {type?.type_name}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">👥</span>
                                  </div>
                                  <span className="font-medium">Dành cho:</span> {room.gender === "male" ? "Nam" : "Nữ"}
                                </div>

                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-green-600">🛏️</span>
                                  </div>
                                  <span className="font-medium">Số lượng giường:</span> {(() => {
                                    const roomBeds = bedsOfRoom(room._id);
                                    const availableCount = roomBeds.filter(
                                      (bed) => bed.status === "available"
                                    ).length;
                                    const pendingCount = roomBeds.filter(
                                      (bed) => bed.status === "pending_request"
                                    ).length;

                                    if (isCurrentRoom) {
                                      if (pendingCount > 0) {
                                        return `${room.bed_count} (${availableCount} giường trống để chuyển, ${pendingCount} đang yêu cầu)`;
                                      }
                                      return `${room.bed_count} (${availableCount} giường trống để chuyển)`;
                                    } else {
                                      if (pendingCount > 0) {
                                        return `${room.bed_count} (${availableCount} giường trống, ${pendingCount} đang yêu cầu)`;
                                      }
                                      return `${room.bed_count} (${availableCount} giường trống)`;
                                    }
                                  })()}
                                </div>
                              </div>
                              {isCurrentRoom && (
                                <p className="text-sm text-orange-600 font-medium mt-2">
                                  💡 Có thể chọn giường khác trong phòng này
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bed Selection */}
              {selectedRoom && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <MapPinIcon className="w-6 h-6 text-green-600" />
                    {changeType === 'room' ? 'Chọn giường mới' : 'Chọn giường khác trong phòng'}
                  </h2>

                  {availableBeds.length === 0 ? (
                    <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        {changeType === 'room' ? 'Không có giường trống' : 'Không có giường khác trong phòng'}
                      </h3>
                      <p className="text-yellow-800">
                        {(() => {
                          const { room: currentRoom, bed: currentBed } = getCurrentRoomAndBed(selectedResident);
                          const isCurrentRoom = currentRoom && selectedRoom === currentRoom._id;
                          const roomBeds = bedsOfRoom(selectedRoom);
                          const pendingBeds = roomBeds.filter(bed => bed.status === 'pending_request');

                          if (isCurrentRoom && currentBed) {
                            return changeType === 'bed' 
                              ? `Phòng này chỉ có giường ${currentBed.bed_number} (giường hiện tại) còn trống. Không thể chuyển giường trong cùng phòng.`
                              : `Phòng này chỉ có giường ${currentBed.bed_number} (giường hiện tại) còn trống`;
                          }

                          if (pendingBeds.length > 0) {
                            const pendingBedNumbers = pendingBeds.map(bed => bed.bed_number).join(', ');
                            return `Phòng này có ${pendingBeds.length} giường đang được yêu cầu: ${pendingBedNumbers}`;
                          }

                          return changeType === 'room' 
                            ? "Phòng này không có giường nào còn trống"
                            : "Phòng này không có giường nào khác còn trống";
                        })()}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableBeds.map((bed) => (
                        <button
                          key={bed._id}
                          type="button"
                          onClick={() => handleBedSelection(bed._id)}
                          className={`p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${selectedBed === bed._id
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-xl shadow-green-200/50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-green-50 hover:shadow-lg'
                            }`}
                        >
                          {/* Decorative background pattern */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-100/30 to-transparent rounded-full -translate-y-8 translate-x-8"></div>

                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                                  <MapPinIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <span className="font-bold text-xl text-gray-900">
                                    Giường {bed.bed_number}
                                  </span>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                Còn trống
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">🛏️</span>
                              </div>
                              <span className="font-medium">Loại:</span> {
                                bed.bed_type === "standard" ? "Tiêu chuẩn" :
                                  bed.bed_type === "electric" ? "Giường điện" : bed.bed_type
                              }
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* Notes */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                    <DocumentTextIcon className="w-4 h-4 text-white" />
                  </div>
                  Ghi chú bổ sung
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {changeType === 'room' ? 'Lý do đổi phòng *' : 'Lý do chuyển giường *'}
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 shadow-md hover:shadow-lg font-medium text-slate-700"
                      placeholder={changeType === 'room' ? 'Nhập lý do muốn đổi phòng...' : 'Nhập lý do muốn chuyển giường...'}
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/family/room')}
                  className="px-8 py-4 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedResident || !selectedRoom || !selectedBed || !note.trim() || submitting}
                  className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${!selectedResident || !selectedRoom || !selectedBed || !note.trim() || submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
                    }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Gửi yêu cầu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Gửi yêu cầu thành công!
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {changeType === 'room' 
                  ? 'Yêu cầu đổi phòng của bạn đã được gửi thành công và đang chờ duyệt từ quản trị viên. Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.'
                  : 'Yêu cầu chuyển giường của bạn đã được gửi thành công và đang chờ duyệt từ quản trị viên. Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.'
                }
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSuccessModalClose}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
