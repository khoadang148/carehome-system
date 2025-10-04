"use client";
import { useEffect, useState } from "react";
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { roomsAPI, bedsAPI, roomTypesAPI, serviceRequestsAPI, residentAPI, bedAssignmentsAPI } from "@/lib/api";
import { BuildingOfficeIcon, MagnifyingGlassIcon, EyeIcon, ArrowLeftIcon, HomeIcon, UsersIcon, MapPinIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

// Helper function to check if bed assignment is active
const isBedAssignmentActive = (assignment) => {
  if (!assignment) return false;
  if (isBedAssignmentActive(a)) return true; // null = active
  const unassignedDate = new Date(assignment.unassigned_date);
  const now = new Date();
  return unassignedDate > now; // ngày trong tương lai = active
};

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
  room_id: string;
  bed_type: string;
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

export default function FamilyRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  // SWR data sources
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
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [bedsByRoom, setBedsByRoom] = useState<Record<string, Bed[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRoomChangeRequest, setPendingRoomChangeRequest] = useState<any>(null);
  const [allResidentsHavePendingRequests, setAllResidentsHavePendingRequests] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { data: serviceRequestsData = [], isLoading: serviceRequestsLoading, mutate: mutateServiceRequests } = useSWR<any[]>(
    user?.id ? ['serviceRequests:mine', user.id] : null,
    () => serviceRequestsAPI.getMyRequests(),
    { revalidateOnFocus: true }
  );
  const { data: residents = [], isLoading: residentsLoading, mutate: mutateResidents } = useSWR<any[]>(
    user?.id ? ['familyResidents', user.id] : null,
    () => residentAPI.getByFamilyMemberId(user?.id || ''),
    { revalidateOnFocus: true }
  );
  const [bedAssignments, setBedAssignments] = useState<any[]>([]);

  // Stable keys to avoid effect loops on changing array identities
  const residentsIdsKey = Array.isArray(residents) ? residents.map((r: any) => r._id).join(',') : '';
  const pendingRequestsKey = Array.isArray(serviceRequestsData)
    ? serviceRequestsData
        .filter((request: any) => request.request_type === 'room_change' && request.status === 'pending')
        .map((r: any) => r._id || r.id)
        .join(',')
    : '';

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

  // Compute pending request and pending state when data changes (guard against loops)
  useEffect(() => {
    const nextPending = (serviceRequestsData || []).find((request: any) =>
      request.request_type === 'room_change' && request.status === 'pending'
    ) || null;
    setPendingRoomChangeRequest((prev: any) => {
      const prevId = prev?._id || prev?.id || null;
      const nextId = nextPending?._id || nextPending?.id || null;
      return prevId !== nextId ? nextPending : prev;
    });

    const residentsList = Array.isArray(residents) ? residents : [];
    const pendingRequests = (serviceRequestsData || []).filter((request: any) =>
      request.request_type === 'room_change' && request.status === 'pending'
    );
    const nextAllHavePending = residentsList.length > 0
      ? residentsList.every((resident: any) =>
          new Set(pendingRequests.map((r: any) => r.resident_id?._id || r.resident_id)).has(resident._id)
        )
      : false;
    setAllResidentsHavePendingRequests(prev => (prev !== nextAllHavePending ? nextAllHavePending : prev));
  }, [residentsIdsKey, pendingRequestsKey]);

  // Load bed assignments when residents list changes (avoid redundant updates)
  useEffect(() => {
    const loadAssignments = async () => {
      if (!Array.isArray(residents) || residents.length === 0) {
        setBedAssignments(prev => (prev.length > 0 ? [] : prev));
        return;
      }
      try {
        const assignmentsPromises = residents.map((resident: any) =>
          bedAssignmentsAPI.getByResidentId(resident._id)
        );
        const assignmentsResults = await Promise.all(assignmentsPromises);
        const allAssignments = assignmentsResults.flat();
        setBedAssignments(prev => (prev.length !== allAssignments.length ? allAssignments : prev));
      } catch {
        setBedAssignments(prev => (prev.length > 0 ? [] : prev));
      }
    };

    loadAssignments();
  }, [residentsIdsKey]);

  // Function to refresh service requests
  const refreshServiceRequests = async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing service requests...');
      const [newServiceRequests, newResidents] = await Promise.all([
        mutateServiceRequests(),
        mutateResidents()
      ]);

      const listResidents = Array.isArray(newResidents) ? newResidents : (residents || []);
      // Reload bed assignments for each resident individually
      if (Array.isArray(listResidents) && listResidents.length > 0) {
        const assignmentsPromises = listResidents.map((resident: any) =>
          bedAssignmentsAPI.getByResidentId(resident._id)
        );
        const assignmentsResults = await Promise.all(assignmentsPromises);
        const allAssignments = assignmentsResults.flat();
        setBedAssignments(allAssignments);
      } else {
        setBedAssignments([]);
      }
    } catch (error) {
      console.error('Error refreshing service requests:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh service requests when page becomes visible (useful when coming back from room change request)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshServiceRequests();
      }
    };

    const handleFocus = () => {
      refreshServiceRequests();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const bedsOfRoom = (roomId: string) => {
    return bedsByRoom[roomId] || [];
  };

  const getCurrentRoomAndBed = (residentId: string) => {
    // Tìm bed assignment active cho resident này
    const assignment = bedAssignments.find(ba => {
      const baResidentId = typeof ba.resident_id === 'string'
        ? ba.resident_id
        : ba.resident_id?._id || ba.resident_id;
      return baResidentId === residentId && isBedAssignmentActive(a);
    });

    if (!assignment) return { room: null, bed: null };

    // Backend đã populate bed_id với room_id, nên ta có thể lấy trực tiếp
    if (assignment.bed_id && typeof assignment.bed_id === 'object') {
      const bed = assignment.bed_id;
      const room = bed.room_id && typeof bed.room_id === 'object' ? bed.room_id : null;
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

    if (!bed) return { room: null, bed: null };

    // Lấy room từ bed
    const room = bed.room_id ?
      rooms.find(r => {
        const bedRoomId = typeof bed.room_id === 'string'
          ? bed.room_id
          : (bed.room_id as any)?._id || bed.room_id;
        return r._id === bedRoomId;
      }) : null;

    return { room, bed };
  };

  // Load beds by room from backend when a room is selected
  useEffect(() => {
    const loadBeds = async () => {
      if (!selectedRoomId) return;
      // Avoid refetch if already loaded
      if (bedsByRoom[selectedRoomId]) return;
      try {
        const list = await bedsAPI.getByRoom(selectedRoomId);
        setBedsByRoom(prev => ({ ...prev, [selectedRoomId]: Array.isArray(list) ? list : [] }));
      } catch {
        setBedsByRoom(prev => ({ ...prev, [selectedRoomId]: [] }));
      }
    };
    loadBeds();
  }, [selectedRoomId, bedsByRoom]);


  const filteredRooms = rooms
    .filter((room) => room.status === 'available')
    .filter((room) => {
      const type = getRoomType(room.room_type);
      const search = searchTerm.toLowerCase();
      return (
        room.room_number.toLowerCase().includes(search) ||
        (type?.type_name?.toLowerCase() || '').includes(search) ||
        (room.floor + '').includes(search)
      );
    });

  // Bỏ các biến thống kê không dùng

  const loading = roomsLoading || bedsLoading || roomTypesLoading || serviceRequestsLoading || residentsLoading;
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải thông tin phòng...</p>
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
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">

        <div className="relative overflow-hidden rounded-3xl mb-8 shadow-xl border border-slate-200 bg-white">
          <div className="absolute inset-0 opacity-70" style={{
            background: 'radial-gradient(1200px 400px at 80% -10%, rgba(59,130,246,0.12), transparent), radial-gradient(800px 300px at -10% 120%, rgba(99,102,241,0.12), transparent)'
          }} />
          <div className="relative flex items-center gap-6 p-8">
              <button
                onClick={() => router.push('/family')}
              className="group p-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 hover:shadow-md hover:-translate-x-0.5 transition-all duration-200"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 mb-1">
                Thông tin phòng & giường
                </h1>
              <p className="text-base text-slate-600 font-medium">
                Xem thông tin chi tiết về các phòng và giường trong viện dưỡng lão
                </p>
            </div>
          </div>
        </div>

        {/* Thông báo yêu cầu đổi phòng đang chờ duyệt */}
        {(() => {
          const pendingRequests = serviceRequestsData.filter((request: any) =>
            request.request_type === 'room_change' && request.status === 'pending'
          );
          return pendingRequests.length > 0;
        })() && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-800 mb-1">
                    Yêu cầu đổi phòng đang chờ duyệt
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const pendingRequests = serviceRequestsData.filter((request: any) =>
                        request.request_type === 'room_change' && request.status === 'pending'
                      );
                      return pendingRequests.map((request: any, index: number) => {
                        const residentName = request.resident_id?.full_name ||
                          (typeof request.resident_id === 'string' ?
                            residents.find(r => r._id === request.resident_id)?.full_name :
                            'Người cao tuổi'
                          );

                        const residentId = request.resident_id?._id || request.resident_id;
                        const { room: currentRoom, bed: currentBed } = getCurrentRoomAndBed(residentId);

                        return (
                          <div key={index} className="text-xs text-amber-700">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                              <span className="text-amber-800 font-medium">Người cao tuổi:</span>
                              <strong>{residentName}</strong>
                            </div>
                            <div className="ml-3 text-amber-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <span>Phòng hiện tại:</span>
                                <span className="font-medium">
                                  {currentRoom?.room_number || 'Chưa có'}
                                  {currentBed?.bed_number && ` - Giường ${currentBed.bed_number}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>→ Phòng muốn chuyển:</span>
                                <span className="font-medium">
                                  {(() => {
                                    // Debug log để xem dữ liệu
                                    console.log('Debug - request.target_bed_assignment_id:', request.target_bed_assignment_id);

                                    // Tìm bed assignment từ target_bed_assignment_id
                                    const targetBedAssignment = bedAssignments.find(ba => 
                                      ba._id === request.target_bed_assignment_id
                                    );

                                    if (targetBedAssignment && targetBedAssignment.bed_id) {
                                      const bed = typeof targetBedAssignment.bed_id === 'object' 
                                        ? targetBedAssignment.bed_id 
                                        : beds.find(b => b._id === targetBedAssignment.bed_id);
                                      
                                      if (bed) {
                                        const room = typeof bed.room_id === 'object' 
                                          ? bed.room_id 
                                          : rooms.find(r => r._id === bed.room_id);
                                        
                                        if (room) {
                                          return `${room.room_number} - Giường ${bed.bed_number}`;
                                        }
                                      }
                                    }
                                    return 'Chưa xác định';
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Ngày gửi yêu cầu:</span>
                                <span className="font-medium">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                <button
                  onClick={refreshServiceRequests}
                  disabled={refreshing}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? '...' : 'Cập nhật'}
                </button>
              </div>
            </div>
          )}


        {/* Đã bỏ phần thống kê theo yêu cầu */}

        <div className="bg-white rounded-2xl p-5 mb-8 shadow-lg border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm theo số phòng, loại phòng, tầng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 placeholder-slate-400"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            <div className="px-5 py-3 rounded-xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <p className="text-slate-700 font-semibold">
                Hiển thị: <span className="text-blue-600 font-bold">{filteredRooms.length}</span> phòng
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <th className="px-6 py-4 text-left text-white font-semibold text-sm uppercase tracking-wide">Số phòng</th>
                  <th className="px-6 py-4 text-left text-white font-semibold text-sm uppercase tracking-wide">Loại phòng</th>
                  <th className="px-6 py-4 text-center text-white font-semibold text-sm uppercase tracking-wide">Số giường</th>
                  <th className="px-6 py-4 text-center text-white font-semibold text-sm uppercase tracking-wide">Giới tính</th>
                  <th className="px-6 py-4 text-center text-white font-semibold text-sm uppercase tracking-wide">Tầng</th>
                  <th className="px-6 py-4 text-center text-white font-semibold text-sm uppercase tracking-wide">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-white font-semibold text-sm uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => {
            const type = getRoomType(room.room_type);
            return (
                    <tr
                      key={room._id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                    >
                      <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {room.room_number}
                      </div>
                      </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                            {type ? type.type_name : room.room_type}
                    </span>
                  </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-800">{room.bed_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${room.gender === "male"
                          ? "bg-blue-50 text-blue-700"
                          : room.gender === "female"
                            ? "bg-pink-50 text-pink-700"
                            : "bg-slate-50 text-slate-700"
                          }`}>
                          {room.gender === "male" ? "Nam" : room.gender === "female" ? "Nữ" : "Hỗn hợp"}
                    </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-800">Tầng {room.floor}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${room.status === "available"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                          }`}>
                          {room.status === "available" ? "Còn trống" : "Hết giường"}
                    </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                  <button
                          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 mx-auto ${selectedRoomId === room._id
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                            }`}
                          onClick={() => setSelectedRoomId(selectedRoomId === room._id ? null : room._id)}
                  >
                    <EyeIcon className="w-4 h-4" />
                          {selectedRoomId === room._id ? "Ẩn giường" : "Xem giường"}
                  </button>
                      </td>
                    </tr>
            );
          })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRoomId && (
          <div className="mt-8 rounded-3xl p-8 shadow-xl border border-slate-200 bg-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-60" style={{
              background: 'radial-gradient(900px 300px at 110% 0%, rgba(79,70,229,0.07), transparent), radial-gradient(700px 260px at -10% 120%, rgba(59,130,246,0.08), transparent)'
            }} />
            <div className="relative">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {rooms.find((r) => r._id === selectedRoomId)?.room_number}
                </div>
                Danh sách giường phòng {rooms.find((r) => r._id === selectedRoomId)?.room_number}
              </h2>

              {(() => {
                const room = rooms.find((r) => r._id === selectedRoomId);
                const type = room ? getRoomType(room.room_type) : null;
                if (!type) return null;
                return (
                  <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                          LG
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 font-medium">Loại phòng</div>
                          <div className="text-lg font-bold text-blue-700">{type.type_name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                          $
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 font-medium">Giá phòng</div>
                          <div className="text-lg font-bold text-green-700">{formatDisplayCurrency(type.monthly_price)}/tháng</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 font-medium mb-2">Mô tả</div>
                        <div className="text-gray-800 leading-relaxed">{type.description}</div>
                      </div>
                    </div>

                    {type.amenities && type.amenities.length > 0 && (
                      <div className="mt-6">
                        <div className="text-sm text-gray-600 font-medium mb-3">Tiện ích</div>
                        <div className="flex flex-wrap gap-2">
                          {type.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-sm font-semibold border border-slate-200"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="overflow-x-auto">
              {bedsOfRoom(selectedRoomId).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có người cao tuổi ở phòng này</h3>
                  <p className="text-gray-600">Phòng này hiện chưa có người cao tuổi nào được thiết lập.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                        <th className="px-6 py-4 text-left text-white font-semibold text-sm uppercase tracking-wide">Số giường</th>
                        <th className="px-6 py-4 text-left text-white font-semibold text-sm uppercase tracking-wide">Loại giường</th>
                        <th className="px-6 py-4 text-center text-white font-semibold text-sm uppercase tracking-wide">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bedsOfRoom(selectedRoomId).map((bed, idx) => (
                        <tr key={bed._id} className={`border-b border-slate-100 hover:bg-indigo-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">{bed.bed_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-200">
                              {bed.bed_type === "standard" ? "Tiêu chuẩn" :
                                bed.bed_type === "electric" ? "Giường điện" :
                                  bed.bed_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${bed.status === "occupied"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                              {bed.status === "occupied" ? "Đã có người cao tuổi" : "Còn trống"}
                            </span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BuildingOfficeIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Không tìm thấy phòng phù hợp</h3>
            <p className="text-gray-600 mb-6">Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Call to Action Section - Only show if not all residents have pending requests */}
        {!allResidentsHavePendingRequests && (
          <div className="mt-8 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl p-8 shadow-lg border border-orange-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
                <HomeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Muốn đổi phòng cho người cao tuổi?
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                Nếu bạn muốn đổi phòng cho người cao tuổi, hãy gửi yêu cầu đổi phòng.
                Chúng tôi sẽ xem xét và thông báo kết quả trong thời gian sớm nhất.
              </p>
              <button
                onClick={() => router.push('/family/room-change-request')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300 flex items-center gap-3 mx-auto hover:-translate-y-1"
              >
                <HomeIcon className="w-6 h-6" />
                Đổi phòng/giường
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


