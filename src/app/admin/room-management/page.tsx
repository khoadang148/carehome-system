"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { roomsAPI, bedsAPI, roomTypesAPI, bedAssignmentsAPI, carePlanAssignmentsAPI } from "@/lib/api";
import { clearCached } from "@/lib/utils/apiCache";
import { BuildingOfficeIcon, MagnifyingGlassIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon, HomeIcon, UsersIcon, MapPinIcon, ClockIcon, ArrowPathIcon, FunnelIcon, ChartBarIcon, UserGroupIcon, CalendarDaysIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { BuildingOfficeIcon as BuildingOfficeIconSolid, HomeIcon as HomeIconSolid, UsersIcon as UsersIconSolid, MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid';
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';

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

interface BedAssignment {
  _id: string;
  resident_id: { _id: string; full_name: string } | null;
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



export default function RoomManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('Loading room management data..');
        
        const [roomsData, bedsData, assignmentsData, typesData] = await Promise.all([
          roomsAPI.getAll(),
          bedsAPI.getAll(),
          bedAssignmentsAPI.getAll(),
          roomTypesAPI.getAll(),
        ]);
        
        console.log('Rooms data received:', roomsData);
        console.log('Beds data received:', bedsData);
        console.log('Assignments data received:', assignmentsData);
        console.log('Room types data received:', typesData);
        
        // Xử lý trường hợp API trả về empty array do timeout
        if (Array.isArray(roomsData) && roomsData.length === 0) {
          console.warn('Rooms API returned empty array - possible timeout or server issue');
        }
        
        setRooms(roomsData || []);
        setBeds(bedsData || []);
        setBedAssignments(assignmentsData || []);
        setRoomTypes(typesData || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError("Không thể tải dữ liệu phòng/giường.");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      console.log('Refreshing data...');
      clearCached(); // Clear API cache
      
      const [roomsData, bedsData, assignmentsData, typesData] = await Promise.all([
        roomsAPI.getAll(),
        bedsAPI.getAll(),
        bedAssignmentsAPI.getAll(),
        roomTypesAPI.getAll(),
      ]);
      
      console.log('Refreshed - Rooms data received:', roomsData);
      console.log('Refreshed - Beds data received:', bedsData);
      
      setRooms(roomsData || []);
      setBeds(bedsData || []);
      setBedAssignments(assignmentsData || []);
      setRoomTypes(typesData || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError("Không thể tải dữ liệu phòng/giường.");
      setLoading(false);
    }
  };

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const bedsOfRoom = (roomId: string) => {
    // Lọc các assignment của phòng này
    const roomAssignments = bedAssignments.filter(assignment => {
      if (!assignment.bed_id || !assignment.bed_id.room_id) return false;

      const assignmentRoomId = typeof assignment.bed_id.room_id === 'string'
        ? assignment.bed_id.room_id
        : assignment.bed_id.room_id._id;

      return assignmentRoomId === roomId;
    });

    // Gom theo bed và chọn assignment đang active, nếu không có thì chọn mới nhất
    const bedIdToAssignments = roomAssignments.reduce((map, assignment) => {
      const bedId = assignment.bed_id._id;
      if (!map[bedId]) map[bedId] = [] as typeof roomAssignments;
      map[bedId].push(assignment);
      return map;
    }, {} as Record<string, typeof roomAssignments>);

    const uniqueBeds = Object.entries(bedIdToAssignments).map(([bedId, assignments]) => {
      const active = assignments.find(a => !a.unassigned_date) || null;
      // Nếu không có active, lấy assignment mới nhất theo assigned_date để lấy metadata giường
      const latest = assignments.slice().sort((a, b) => (
        new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime()
      ))[0];

      const base = active || latest;

      return {
        _id: bedId,
        bed_number: base?.bed_id.bed_number,
        room_id: roomId,
        bed_type: base?.bed_id.bed_type || 'standard',
        status: active ? 'occupied' : 'available',
        assignment: active, // chỉ đính kèm assignment đang active, nếu có
      } as any;
    });

    return uniqueBeds;
  };

  const getResidentOfBed = (bed: any) => {
    // Chỉ hiển thị tên khi có assignment đang active
    if (bed.status === 'occupied' && bed.assignment && !bed.assignment.unassigned_date && bed.assignment.resident_id) {
      const residentName = bed.assignment.resident_id.full_name;
      return residentName;
    }

    const assignment = bedAssignments.find(
      (a) => {
        if (!a || !a.bed_id) return false;

        const assignmentBedId = a.bed_id._id;
        const isActive = !a.unassigned_date;

        return assignmentBedId === bed._id && isActive;
      }
    );

    if (assignment && assignment.resident_id) {
      const residentName = assignment.resident_id.full_name;
      return residentName;
    }

    return null;
  };

  // Tính toán trạng thái phòng dựa trên số giường thực tế đang được sử dụng
  const getRoomStatus = (room: Room) => {
    const roomBeds = bedsOfRoom(room._id);
    const occupiedBedsInRoom = roomBeds.filter(bed => bed.status === "occupied").length;
    
    // Nếu tất cả giường đều được sử dụng
    if (occupiedBedsInRoom >= room.bed_count) {
      return "occupied";
    }
    
    // Nếu còn ít nhất 1 giường trống
    return "available";
  };

  // Lấy thông tin chi tiết về trạng thái phòng
  const getRoomStatusInfo = (room: Room) => {
    const roomBeds = bedsOfRoom(room._id);
    const occupiedBedsInRoom = roomBeds.filter(bed => bed.status === "occupied").length;
    const availableBedsInRoom = room.bed_count - occupiedBedsInRoom;
    
    return {
      occupied: occupiedBedsInRoom,
      available: availableBedsInRoom,
      total: room.bed_count,
      status: getRoomStatus(room)
    };
  };

  const openTransferPage = (bed: any, room: any) => {
    router.push(`/admin/room-management/transfer?bedId=${bed._id}&roomId=${room._id}`);
  };





  const filteredRooms = rooms.filter((room) => {
    const type = getRoomType(room.room_type);
    const search = searchTerm.toLowerCase();
    return (
      room.room_number.toLowerCase().includes(search) ||
      (type?.type_name?.toLowerCase() || '').includes(search) ||
      (room.floor + '').includes(search)
    );
  });

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => getRoomStatus(room) === "available").length;
  const occupiedRooms = rooms.filter(room => getRoomStatus(room) === "occupied").length;
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(bed => bed.status === "occupied").length;

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
      </div>
    </div>
  );

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
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BuildingOfficeIconSolid className="w-7 h-7 text-white" />
            </div>
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2 tracking-tight">
                  Quản Lý Phòng & Giường
              </h1>
                <p className="text-base text-slate-600 font-semibold flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-blue-500" />
                Quản lý và theo dõi tình trạng phòng và giường bệnh
              </p>
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border border-blue-200/50 shadow-md">
                <div className="text-center">
                  <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">
                    Tổng phòng
                  </div>
                  <div className="text-2xl font-black text-blue-700 mb-1">
                    {totalRooms}
                  </div>
                  <div className="text-xs text-blue-600 font-semibold">
                    phòng
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-6 text-blue-800 shadow-lg border border-blue-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wide mb-1">Tổng phòng</p>
                <p className="text-2xl font-black text-blue-900 mb-1">{totalRooms}</p>
                <p className="text-blue-600 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                <HomeIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 rounded-2xl p-6 text-purple-800 shadow-lg border border-purple-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-xs font-bold uppercase tracking-wide mb-1">Tổng giường</p>
                <p className="text-2xl font-black text-purple-900 mb-1">{totalBeds}</p>
                <p className="text-purple-600 text-xs font-bold">giường</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/25">
                <BuildingOfficeIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 rounded-2xl p-6 text-orange-800 shadow-lg border border-orange-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-xs font-bold uppercase tracking-wide mb-1">Giường đã sử dụng</p>
                <p className="text-2xl font-black text-orange-900 mb-1">{occupiedBeds}</p>
                <p className="text-orange-600 text-xs font-bold">giường</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
                <MapPinIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 rounded-2xl p-6 text-emerald-800 shadow-lg border border-emerald-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-wide mb-1">Phòng trống</p>
                <p className="text-2xl font-black text-emerald-900 mb-1">{availableRooms}</p>
                <p className="text-emerald-600 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
                <UsersIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                <FunnelIcon className="w-4 h-4 text-white" />
              </div>
              Tìm kiếm và lọc
            </h2>
            <p className="text-sm text-slate-600 font-medium">Tìm kiếm phòng theo số phòng, loại phòng, tầng</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 relative group">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Tìm theo số phòng, loại phòng, tầng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-md hover:shadow-lg font-medium text-slate-700 group-hover:border-blue-300"
              />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-200/50 shadow-md">
              <p className="text-blue-700 font-bold text-sm">
                Hiển thị: {filteredRooms.length} phòng
              </p>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-700 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-white" />
                  </div>
                  Danh sách phòng
                </h2>
                <p className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-blue-500" />
                  Hiển thị {filteredRooms.length} trong tổng số {totalRooms} phòng
                </p>
              </div>
              <div className="text-xs text-slate-600 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-2 rounded-xl border border-blue-200/50 font-semibold shadow-md">
                <UserGroupIcon className="w-4 h-4 text-blue-500 inline mr-1" />
                Quản lý phòng
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <HomeIcon className="w-4 h-4" />
                      Số phòng
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      Loại phòng
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                    <div className="flex items-center justify-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      Số giường
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                    <div className="flex items-center justify-center gap-2">
                      <UserGroupIcon className="w-4 h-4" />
                      Giới tính
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[80px]">
                    <div className="flex items-center justify-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      Tầng
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Trạng thái
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[140px]">
                    <div className="flex items-center justify-center gap-2">
                      <EyeIcon className="w-4 h-4" />
                      Thao tác
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => {
                  const type = getRoomType(room.room_type);
                  return (
                    <tr
                      key={room._id}
                      className={`border-b border-slate-200/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:shadow-lg hover:shadow-blue-100/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {room.room_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg text-xs font-bold shadow-sm border border-blue-200">
                            {type ? type.type_name : room.room_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">{room.bed_count}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${room.gender === "male"
                            ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
                            : room.gender === "female"
                              ? "bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border border-pink-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                          }`}>
                          {room.gender === "male" ? "Nam" : room.gender === "female" ? "Nữ" : "Hỗn hợp"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">Tầng {room.floor}</span>
                      </td>
                        <td className="px-3 py-4 text-center">
                          {(() => {
                            const statusInfo = getRoomStatusInfo(room);
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${statusInfo.status === "available"
                                    ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300"
                                    : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                                  }`}>
                                  {statusInfo.status === "available" ? "Còn trống" : "Hết giường"}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  {statusInfo.occupied}/{statusInfo.total} giường
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 flex items-center gap-1 mx-auto shadow-md hover:shadow-lg hover:-translate-y-0.5 ${selectedRoomId === room._id
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25"
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
          <div className="mt-6 bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-700 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/25">
                  {rooms.find((r) => r._id === selectedRoomId)?.room_number}
                </div>
                Danh sách giường phòng {rooms.find((r) => r._id === selectedRoomId)?.room_number}
              </h2>

              {(() => {
                const room = rooms.find((r) => r._id === selectedRoomId);
                const type = room ? getRoomType(room.room_type) : null;
                if (!type) return null;
                return (
                  <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 rounded-xl border border-blue-200/50 shadow-md">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/25">
                          LG
                        </div>
                        <div>
                          <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Loại phòng</div>
                          <div className="text-base font-black text-blue-800">{type.type_name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 via-emerald-100 to-green-50 rounded-xl border border-emerald-200/50 shadow-md">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/25">
                          <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Giá phòng</div>
                          <div className="text-base font-black text-emerald-800">{formatDisplayCurrency(type.monthly_price)}/tháng</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50 shadow-md">
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">Mô tả</div>
                        <div className="text-slate-800 leading-relaxed text-sm font-medium">{type.description}</div>
                      </div>
                    </div>

                    {type.amenities && type.amenities.length > 0 && (
                      <div className="mt-6">
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-3">Tiện ích</div>
                        <div className="flex flex-wrap gap-2">
                          {type.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200 shadow-sm"
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
                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <BuildingOfficeIcon className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có người cao tuổi ở phòng này</h3>
                  <p className="text-slate-600 leading-relaxed max-w-md mx-auto text-sm font-medium">Phòng này hiện chưa có người cao tuổi nào được thiết lập.</p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50 backdrop-blur-sm">
                  <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-indigo-700 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
                        <BuildingOfficeIcon className="w-4 h-4 text-white" />
                      </div>
                      Chi tiết giường
                    </h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                        <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            Số giường
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Loại giường
                          </div>
                        </th>
                        <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center justify-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            Trạng thái
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" />
                            Người cao tuổi đang ở
                          </div>
                        </th>
                        <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center justify-center gap-2">
                            <ArrowPathIcon className="w-4 h-4" />
                            Thao tác
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bedsOfRoom(selectedRoomId).map((bed, idx) => (
                        <tr key={bed._id} className={`border-b border-slate-200/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:shadow-lg hover:shadow-indigo-100/50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {bed.bed_number}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-lg text-xs font-bold shadow-sm border border-indigo-200">
                              {bed.bed_type === "standard" ? "Tiêu chuẩn" :
                                bed.bed_type === "electric" ? "Giường điện" :
                                  bed.bed_type}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${bed.status === "occupied"
                                ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                                : "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300"
                              }`}>
                              {bed.status === "occupied" ? "Đang sử dụng" : "Còn trống"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            {(() => {
                              const residentName = getResidentOfBed(bed);

                              if (residentName) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                                    <span className="font-bold text-slate-800 text-sm">{residentName}</span>
                                  </div>
                                );
                              } else if (bed.status === "occupied") {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full shadow-sm"></div>
                                    <span className="text-orange-700 font-bold text-sm">Có người ở (chưa có thông tin)</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full shadow-sm"></div>
                                    <span className="text-slate-600 font-bold text-sm">Chưa có người</span>
                                  </div>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-3 py-4 text-center">
                            {bed.status === "occupied" && bed.assignment && (
                              <button
                                onClick={() => openTransferPage(bed, rooms.find(r => r._id === selectedRoomId))}
                                className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 mx-auto shadow-md shadow-orange-500/25 hover:shadow-orange-600/40 hover:-translate-y-0.5"
                                title="Chuyển đổi phòng/giường"
                              >
                                <ArrowPathIcon className="w-3 h-3" />
                                Chuyển
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <BuildingOfficeIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Không tìm thấy phòng phù hợp</h3>
            <p className="text-slate-600 leading-relaxed max-w-lg mx-auto text-sm font-medium mb-6">Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc để tìm phòng phù hợp</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 shadow-md shadow-blue-500/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}