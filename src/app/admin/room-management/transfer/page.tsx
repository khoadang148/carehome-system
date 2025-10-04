"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { roomsAPI, bedsAPI, roomTypesAPI, bedAssignmentsAPI, carePlanAssignmentsAPI } from "@/lib/api";
import { useAuth } from '@/lib/contexts/auth-context';
import { BuildingOfficeIcon, ArrowLeftIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon, HomeIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';

// Helper function to check if bed assignment is active
const isBedAssignmentActive = (assignment) => {
  if (!assignment) return false;
  if (!assignment.unassigned_date) return true; // null = active
  const unassignedDate = new Date(assignment.unassigned_date);
  const now = new Date();
  return unassignedDate > now; // ngày trong tương lai = active
};
import TransferSuccessModal from '@/components/TransferSuccessModal';

interface Room {
  _id: string;
  room_number: string;
  bed_count: number;
  room_type: string;
  gender: string;
  floor: number;
  status: string;
}

interface Bed {
  _id: string;
  bed_number: string;
  room_id: string | { _id: string; room_number: string };
  bed_type: string;
  status: string;
}

interface BedAssignment {
  _id: string;
  resident_id: { _id: string; full_name: string };
  bed_id: {
    _id: string;
    bed_number: string;
    bed_type?: string;
    room_id: { _id: string; room_number: string }
  };
  assigned_date: string;
  unassigned_date: string | null;
  assigned_by: { _id: string; full_name: string };
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

export default function TransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentBed, setCurrentBed] = useState<any>(null);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [selectedNewRoom, setSelectedNewRoom] = useState<string | null>(null);
  const [selectedNewBed, setSelectedNewBed] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [currentCarePlanAssignment, setCurrentCarePlanAssignment] = useState<any | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [residentId, setResidentId] = useState<string | null>(null);

  // Load care plan assignment for the current resident
  useEffect(() => {
    let isCancelled = false;
    const fetchCarePlanAssignment = async () => {
      if (!residentId) {
        setCurrentCarePlanAssignment(null);
        return;
      }
      try {
        // Fetch care plan assignments
        const carePlanAssignments = await carePlanAssignmentsAPI.getByResidentId(residentId);
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
  }, [residentId]);

  // Update available rooms when care plan assignment changes
  useEffect(() => {
    if (!rooms.length || !currentRoom || !currentCarePlanAssignment) return;

    const availableRoomsData = rooms.filter((r: Room) => {
      const sameGender = r.gender === currentRoom.gender;
      
      // Kiểm tra xem phòng có giường trống hay không (cho phép chọn phòng hiện tại nhưng loại trừ chính giường hiện tại)
      const roomBeds = beds.filter(bed => {
        const bedRoomId = typeof bed.room_id === 'string'
          ? bed.room_id
          : (bed.room_id as { _id: string })._id;
        return bedRoomId === r._id;
      });

      const roomAssignments = bedAssignments.filter(assignment => {
        if (!assignment.bed_id || !assignment.bed_id.room_id) {
          return false;
        }

        const assignmentRoomId = typeof assignment.bed_id.room_id === 'string'
          ? assignment.bed_id.room_id
          : assignment.bed_id.room_id._id;

        return assignmentRoomId === r._id;
      });

      const assignmentMap = new Map();
      roomAssignments.forEach(assignment => {
        assignmentMap.set(assignment.bed_id._id, assignment);
      });

      const hasAvailableBeds = roomBeds.some(bed => {
        const assignment = assignmentMap.get(bed._id);
        const status = assignment && isBedAssignmentActive(assignment) ? 'occupied' : 'available';
        // Nếu là phòng hiện tại thì loại trừ chính giường đang ở
        const isCurrentRoom = r._id === currentRoom._id;
        const isCurrentBed = isCurrentRoom && currentBed && bed._id === currentBed._id;
        return status === 'available' && !isCurrentBed;
      });

      // Validation: Kiểm tra main care plan id cho ROOM_CHANGE
      // Phòng mới phải có cùng main care plan id với phòng hiện tại
      let sameMainCarePlan = true;
      if (currentCarePlanAssignment && currentCarePlanAssignment.care_plan_ids && Array.isArray(currentCarePlanAssignment.care_plan_ids)) {
        // Lấy main care plan id từ current assignment (care plan đầu tiên trong mảng)
        const currentMainCarePlanId = currentCarePlanAssignment.care_plan_ids[0];
        const currentMainCarePlanIdStr = typeof currentMainCarePlanId === 'string' ? currentMainCarePlanId : currentMainCarePlanId?._id;
        
        // Kiểm tra phòng mới có cùng main care plan id không
        // Giả sử room có field main_care_plan_id hoặc tương tự
        if ((r as any).main_care_plan_id && currentMainCarePlanIdStr) {
          sameMainCarePlan = (r as any).main_care_plan_id === currentMainCarePlanIdStr;
        }
      }

      // Luôn cho phép chọn phòng hiện tại nếu có giường trống (để chuyển giường)
      if (currentRoom && r._id === currentRoom._id) {
        return hasAvailableBeds;
      }
      
      // Các phòng khác: cần cùng giới tính, có giường trống và cùng main care plan id
      return sameGender && hasAvailableBeds && sameMainCarePlan;
    });

    setAvailableRooms(availableRoomsData);
  }, [rooms, currentRoom, beds, bedAssignments, currentCarePlanAssignment, currentBed]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    residentName: '',
    fromRoom: '',
    toRoom: '',
    fromBed: '',
    toBed: ''
  });

  useEffect(() => {
    const bedId = searchParams.get('bedId');
    const roomId = searchParams.get('roomId');

    if (!bedId || !roomId) {
      setError("Thiếu thông tin giường hoặc phòng");
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      roomsAPI.getAll(),
      bedsAPI.getAll(),
      bedAssignmentsAPI.getAll(),
      roomTypesAPI.getAll(),
    ])
      .then(([roomsData, bedsData, assignmentsData, typesData]) => {
        setRooms(roomsData);
        setBeds(bedsData);
        setBedAssignments(assignmentsData);
        setRoomTypes(typesData);

        const currentRoomData = roomsData.find((r: Room) => r._id === roomId);
        const currentBedData = findBedWithAssignment(bedId, assignmentsData);

        if (!currentRoomData || !currentBedData) {
          setError("Không tìm thấy thông tin giường/phòng");
          setLoading(false);
          return;
        }

        setCurrentRoom(currentRoomData);
        setCurrentBed(currentBedData);
        
        // Set resident ID for care plan assignment loading
        if (currentBedData.assignment && currentBedData.assignment.resident_id) {
          const residentId = typeof currentBedData.assignment.resident_id === 'string' 
            ? currentBedData.assignment.resident_id 
            : (currentBedData.assignment.resident_id as any)?._id;
          if (residentId) {
            setResidentId(residentId);
          }
        }

        // Tạm thời lọc phòng chỉ dựa trên giới tính và giường trống
        // Logic kiểm tra gói dịch vụ sẽ được thêm trong useEffect riêng
        const availableRoomsData = roomsData.filter((r: Room) => {
          const sameGender = r.gender === currentRoomData.gender;
          
          // Kiểm tra xem phòng có giường trống hay không (cho phép chọn phòng hiện tại nhưng loại trừ chính giường hiện tại)
          const roomBeds = bedsData.filter(bed => {
            const bedRoomId = typeof bed.room_id === 'string'
              ? bed.room_id
              : (bed.room_id as { _id: string })._id;
            return bedRoomId === r._id;
          });

          const roomAssignments = assignmentsData.filter(assignment => {
            if (!assignment.bed_id || !assignment.bed_id.room_id) {
              return false;
            }

            const assignmentRoomId = typeof assignment.bed_id.room_id === 'string'
              ? assignment.bed_id.room_id
              : assignment.bed_id.room_id._id;

            return assignmentRoomId === r._id;
          });

          const assignmentMap = new Map();
          roomAssignments.forEach(assignment => {
            assignmentMap.set(assignment.bed_id._id, assignment);
          });

          const hasAvailableBeds = roomBeds.some(bed => {
            const assignment = assignmentMap.get(bed._id);
            const status = assignment && isBedAssignmentActive(assignment) ? 'occupied' : 'available';
            // Nếu là phòng hiện tại thì loại trừ chính giường đang ở
            const isCurrentRoom = r._id === roomId;
            const isCurrentBed = isCurrentRoom && currentBedData && bed._id === currentBedData._id;
            return status === 'available' && !isCurrentBed;
          });

          return sameGender && hasAvailableBeds;
        });

        setAvailableRooms(availableRoomsData);

        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải dữ liệu phòng/giường.");
        setLoading(false);
      });
  }, [searchParams]);

  const findBedWithAssignment = (bedId: string, assignments: BedAssignment[]) => {
    const assignment = assignments.find(a =>
      a.bed_id._id === bedId && isBedAssignmentActive(a)
    );

    if (assignment) {
      return {
        _id: bedId,
        bed_number: assignment.bed_id.bed_number,
        bed_type: assignment.bed_id.bed_type || 'standard',
        assignment: assignment
      };
    }
    return null;
  };

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const bedsOfRoom = (roomId: string) => {
    const roomBeds = beds.filter(bed => {
      const bedRoomId = typeof bed.room_id === 'string'
        ? bed.room_id
        : (bed.room_id as { _id: string })._id;
      return bedRoomId === roomId;
    });

    const roomAssignments = bedAssignments.filter(assignment => {
      if (!assignment.bed_id || !assignment.bed_id.room_id) {
        return false;
      }

      const assignmentRoomId = typeof assignment.bed_id.room_id === 'string'
        ? assignment.bed_id.room_id
        : assignment.bed_id.room_id._id;

      const matches = assignmentRoomId === roomId;

      return matches;
    });

    const assignmentMap = new Map();
    roomAssignments.forEach(assignment => {
      assignmentMap.set(assignment.bed_id._id, assignment);
    });

    const bedsWithStatus = roomBeds.map(bed => {
      const assignment = assignmentMap.get(bed._id);
      const status = assignment && isBedAssignmentActive(assignment) ? 'occupied' : 'available';

      return {
        _id: bed._id,
        bed_number: bed.bed_number,
        room_id: roomId,
        bed_type: bed.bed_type || 'standard',
        status: status,
        assignment: assignment || null
      };
    });

    return bedsWithStatus;
  };

  const handleRoomSelection = (roomId: string) => {
    const selectedRoom = rooms.find(r => r._id === roomId);
    if (!selectedRoom) return;

    const roomBeds = bedsOfRoom(roomId);
    // Nếu chọn phòng hiện tại, loại trừ giường hiện tại khỏi danh sách trống
    let availableBedsData = roomBeds.filter(bed => bed.status === 'available');
    if (currentBed && currentRoom && roomId === currentRoom._id) {
      availableBedsData = availableBedsData.filter(bed => bed._id !== currentBed._id);
    }

    setSelectedNewRoom(roomId);
    setSelectedNewBed(null);
    setAvailableBeds(availableBedsData);
  };

  const handleBedSelection = (bedId: string) => {
    setSelectedNewBed(bedId);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/admin/room-management');
  };

  const executeTransfer = async () => {
    if (!selectedNewRoom || !selectedNewBed || !currentBed) {
      setTransferError("Vui lòng chọn phòng và giường mới");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);

    try {
      // Không cho phép chuyển sang đúng giường hiện tại
      if (currentRoom && currentBed && selectedNewRoom === currentRoom._id && selectedNewBed === currentBed._id) {
        setTransferError("Vui lòng chọn một giường khác trong phòng hiện tại");
        return;
      }

      if (!currentBed.assignment) {
        throw new Error('Không tìm thấy thông tin phân giường hiện tại');
      }

      if (currentBed.assignment) {
        await bedAssignmentsAPI.update(currentBed.assignment._id, {
          unassigned_date: new Date().toISOString(),
          status: 'exchanged'
        });
      }

      const payload: any = {
        resident_id: currentBed.assignment.resident_id._id,
        bed_id: selectedNewBed,
        assigned_date: new Date().toISOString(),
        status: 'active'
      };
      // set assigned_by theo user hiện tại nếu có quyền (admin/staff); fallback dùng assigned_by cũ nếu tồn tại
      if (user?.id) {
        payload.assigned_by = user.id;
      } else if (currentBed.assignment.assigned_by && currentBed.assignment.assigned_by._id) {
        payload.assigned_by = currentBed.assignment.assigned_by._id;
      }
      const newAssignment = await bedAssignmentsAPI.create(payload);

      const carePlanAssignments = await carePlanAssignmentsAPI.getByResidentId(currentBed.assignment.resident_id._id);
      if (carePlanAssignments.length > 0) {
        const activeCarePlan = carePlanAssignments.find(cpa => !cpa.end_date);
        if (activeCarePlan) {
          await carePlanAssignmentsAPI.update(activeCarePlan._id, {
            room_id: selectedNewRoom
          });
        }
      }

      const selectedRoomData = rooms.find(r => r._id === selectedNewRoom);
      const selectedBedData = availableBeds.find(b => b._id === selectedNewBed);

      setSuccessData({
        residentName: currentBed.assignment.resident_id.full_name,
        fromRoom: currentRoom.room_number,
        toRoom: selectedRoomData?.room_number || '',
        fromBed: currentBed.bed_number,
        toBed: selectedBedData?.bed_number || ''
      });

      setShowSuccessModal(true);

    } catch (error) {
      setTransferError("Có lỗi xảy ra khi chuyển đổi. Vui lòng thử lại.");
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BuildingOfficeIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push('/admin/room-management')}
          className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          Quay lại
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto p-6">

        <div className="bg-gradient-to-r from-white to-blue-50 rounded-3xl p-8 mb-8 shadow-xl border border-blue-100">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/admin/room-management')}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại quản lý phòng"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ArrowPathIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Chuyển đổi phòng/giường
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Chuyển đổi người cao tuổi sang phòng/giường mới
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
                Thông tin hiện tại
              </h2>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      👤
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Người cao tuổi</p>
                      <p className="text-lg font-bold text-blue-900">
                        {currentBed?.assignment?.resident_id?.full_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                      <HomeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Phòng hiện tại</p>
                      <div className="mt-1">
                        <div className="text-xs text-slate-500 font-semibold">Số phòng</div>
                        <p className="text-lg font-bold text-green-900">
                          {currentRoom?.room_number} - Tầng {currentRoom?.floor}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Phòng dành cho</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentRoom?.gender === 'male'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-pink-100 text-pink-800'
                        }`}>
                        {currentRoom?.gender === 'male' ? 'Nam' : 'Nữ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Loại phòng</span>
                      <span className="text-sm text-gray-700 font-medium">
                        {getRoomType(currentRoom?.room_type)?.type_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Giường hiện tại</p>
                      <div className="mt-1">
                        <div className="text-xs text-slate-500 font-semibold">Số giường</div>
                        <p className="text-lg font-bold text-purple-900">
                          {currentBed?.bed_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-xs text-slate-500 font-semibold">Loại giường</div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {currentBed?.bed_type === "standard" ? "Tiêu chuẩn" :
                        currentBed?.bed_type === "electric" ? "Giường điện" : currentBed?.bed_type}
                    </span>
                  </div>
                </div>

                {selectedNewRoom && selectedNewBed && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                        <CheckCircleIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-medium">Sẵn sàng chuyển đổi</p>
                        <p className="text-sm font-medium text-green-900">
                          Đã chọn phòng và giường mới
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <HomeIcon className="w-6 h-6 text-blue-600" />
                Chọn phòng mới
              </h2>

              {availableRooms.length === 0 ? (
                <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Không có phòng khả dụng</h3>
                    <p className="text-yellow-800">Không tìm thấy phòng cùng giới tính, cùng gói dịch vụ và còn trống</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.map((room) => {
                    const type = getRoomType(room.room_type);
                    const isCurrentRoom = currentRoom && room._id === currentRoom._id;
                    return (
                      <button
                        key={room._id}
                        onClick={() => handleRoomSelection(room._id)}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${selectedNewRoom === room._id
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl shadow-blue-200/50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 hover:shadow-lg'
                          }`}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-10 translate-x-10" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                <HomeIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xl text-gray-900">Phòng {room.room_number}</span>
                                {isCurrentRoom && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Phòng hiện tại</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">👥</span>
                              </div>
                              <span className="font-medium">Phòng dành cho:</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${room.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                {room.gender === 'male' ? 'Nam' : 'Nữ'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">🏢</span>
                              </div>
                              <span className="font-medium">Tầng:</span> {room.floor}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">🛏️</span>
                              </div>
                              <span className="font-medium">Số giường:</span> {room.bed_count}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">🏠</span>
                              </div>
                              <span className="font-medium">Loại phòng:</span> {type?.type_name}
                            </div>

                           
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedNewRoom && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-green-600" />
                  Chọn giường mới
                </h2>

                {availableBeds.length === 0 ? (
                  <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Không có giường trống</h3>
                    <p className="text-yellow-800">Phòng này không có giường nào còn trống</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBeds.map((bed) => (
                      <button
                        key={bed._id}
                        onClick={() => handleBedSelection(bed._id)}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${selectedNewBed === bed._id
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-xl shadow-green-200/50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-green-50 hover:shadow-lg'
                          }`}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-100/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                                <MapPinIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="font-bold text-xl text-gray-900 whitespace-nowrap">Giường {bed.bed_number}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">✔️</span>
                              </div>
                              <span className="font-medium">Trạng thái:</span>
                              <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Còn trống</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">🛏️</span>
                              </div>
                              <span className="font-medium">Loại giường:</span>
                              <span className="text-gray-700 font-medium">
                                {bed.bed_type === "standard" ? "Tiêu chuẩn" :
                                  bed.bed_type === "electric" ? "Giường điện" : bed.bed_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {transferError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-center font-medium">{transferError}</p>
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => router.push('/admin/room-management')}
                className="px-8 py-4 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                disabled={transferLoading}
              >
                Hủy
              </button>
              <button
                onClick={executeTransfer}
                disabled={!selectedNewRoom || !selectedNewBed || transferLoading}
                className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${!selectedNewRoom || !selectedNewBed || transferLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
                  }`}
              >
                {transferLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Xác nhận chuyển đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <TransferSuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        residentName={successData.residentName}
        fromRoom={successData.fromRoom}
        toRoom={successData.toRoom}
        fromBed={successData.fromBed}
        toBed={successData.toBed}
      />
    </div>
  );
}
