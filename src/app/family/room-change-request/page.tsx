"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { serviceRequestsAPI, residentAPI, roomsAPI, roomTypesAPI, bedsAPI, bedAssignmentsAPI, userAPI } from "@/lib/api";
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
  
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [bedAssignments, setBedAssignments] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedBed, setSelectedBed] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const hasPendingRoomChangeRequest = (residentId: string) => {
    return serviceRequests.some(request => 
      request.resident_id === residentId && 
      request.request_type === 'room_change' && 
      request.status === 'pending'
    );
  };

  const getCurrentRoomAndBed = (residentId: string) => {
    const assignment = bedAssignments.find(ba => 
      ba.resident_id._id === residentId && !ba.unassigned_date
    );
    
    if (!assignment) return { room: null, bed: null };
    
    const bed = assignment.bed_id ? 
      beds.find(b => b._id === assignment.bed_id._id || b._id === assignment.bed_id) : null;
    
    const room = bed && bed.room_id ? 
      rooms.find(r => {
        const bedRoomId = typeof bed.room_id === 'string' ? bed.room_id : bed.room_id._id;
        return r._id === bedRoomId;
      }) : null;
    
    return { room, bed };
  };

  const getAvailableRooms = () => {
    if (!selectedResident) return [];
    
    const resident = residents.find(r => r._id === selectedResident);
    if (!resident) return [];

    // Check if resident is eligible for room change
    if (resident.status !== 'admitted' && resident.status !== 'active') {
      return [];
    }

    const { room: currentRoom } = getCurrentRoomAndBed(selectedResident);

    return rooms.filter(room => {
      // Same gender requirement
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

      // Cho phép chọn lại phòng cũ (chỉ cần cùng giới tính và có giường trống)
      return sameGender && hasAvailableBeds;
    });
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
      const isPendingInRequest = serviceRequests.some(request => 
        request.request_type === 'room_change' && 
        request.status === 'pending' && 
        request.target_bed_id === bed._id
      );

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [residentsData, roomsData, bedsData, roomTypesData, serviceRequestsData] = await Promise.all([
          residentAPI.getByFamilyMemberId(user?.id || ''),
          roomsAPI.getAll(),
          bedsAPI.getAll(),
          roomTypesAPI.getAll(),
          serviceRequestsAPI.getMyRequests()
        ]);
        
        setResidents(Array.isArray(residentsData) ? residentsData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setBeds(Array.isArray(bedsData) ? bedsData : []);
        setRoomTypes(Array.isArray(roomTypesData) ? roomTypesData : []);
        setServiceRequests(Array.isArray(serviceRequestsData) ? serviceRequestsData : []);

        // Load bed assignments for each resident
        if (Array.isArray(residentsData) && residentsData.length > 0) {
          const assignmentsPromises = residentsData.map(resident => 
            bedAssignmentsAPI.getByResidentId(resident._id)
          );
          const assignmentsResults = await Promise.all(assignmentsPromises);
          const allAssignments = assignmentsResults.flat();
          setBedAssignments(allAssignments);
        }

        // Tự động load thông tin user để điền vào emergency contact
        await loadUserInfo();
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể tải thông tin cần thiết. Vui lòng thử lại.',
          category: 'system'
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedResident || !selectedRoom || !selectedBed || !note.trim()) {
      addNotification({
        type: 'error',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn người thân, phòng, giường mới và nhập lý do đổi phòng.',
        category: 'system'
      });
      return;
    }

    setSubmitting(true);
    try {
      await serviceRequestsAPI.create({
        resident_id: selectedResident,
        family_member_id: user?.id || '',
        request_type: 'room_change',
        target_room_id: selectedRoom,
        target_bed_id: selectedBed,
        note: note,
        emergencyContactName: emergencyContactName || userProfile?.full_name || '',
        emergencyContactPhone: emergencyContactPhone || userProfile?.phone || ''
      });

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
                    return currentRoom ? (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white font-bold">
                            <HomeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-green-700 font-medium">Phòng hiện tại</p>
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
                    return currentBed ? (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center text-white font-bold">
                            <MapPinIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-700 font-medium">Giường hiện tại</p>
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
                            Đã chọn phòng và giường mới
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
                  (r.status === 'admitted' || r.status === 'active') && 
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
                        Chỉ có thể đổi phòng cho người thân có trạng thái "Đã nhập viện" hoặc "Đang hoạt động" và chưa có yêu cầu đổi phòng đang chờ duyệt
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
                      const isEligible = (resident.status === 'admitted' || resident.status === 'active') && 
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
                                (resident.status === 'admitted' || resident.status === 'active') && 
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
                            Chỉ có thể đổi phòng cho người thân có trạng thái "Đã nhập viện" hoặc "Đang hoạt động"
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
                    Chọn phòng mới
                  </h2>

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
                                     <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                       Phòng hiện tại
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

                                 if (pendingCount > 0) {
                                   return `${room.bed_count} (${availableCount} giường trống, ${pendingCount} đang yêu cầu)`;
                                 }
                                 return `${room.bed_count} (${availableCount} giường trống)`;
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
                  Chọn giường mới
                </h2>

                 {availableBeds.length === 0 ? (
                   <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-200">
                     <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                     </div>
                     <h3 className="text-lg font-semibold text-yellow-900 mb-2">Không có giường trống</h3>
                     <p className="text-yellow-800">
                       {(() => {
                         const { room: currentRoom, bed: currentBed } = getCurrentRoomAndBed(selectedResident);
                         const isCurrentRoom = currentRoom && selectedRoom === currentRoom._id;
                         const roomBeds = bedsOfRoom(selectedRoom);
                         const pendingBeds = roomBeds.filter(bed => bed.status === 'pending_request');
                         
                         if (isCurrentRoom && currentBed) {
                           return `Phòng này chỉ có giường ${currentBed.bed_number} (giường hiện tại) còn trống`;
                         }
                         
                         if (pendingBeds.length > 0) {
                           const pendingBedNumbers = pendingBeds.map(bed => bed.bed_number).join(', ');
                           return `Phòng này có ${pendingBeds.length} giường đang được yêu cầu: ${pendingBedNumbers}`;
                         }
                         
                         return "Phòng này không có giường nào còn trống";
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
                    Lý do đổi phòng *
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 shadow-md hover:shadow-lg font-medium text-slate-700"
                    placeholder="Nhập lý do muốn đổi phòng..."
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
                Yêu cầu đổi phòng của bạn đã được gửi thành công và đang chờ duyệt từ quản trị viên. 
                Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.
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
