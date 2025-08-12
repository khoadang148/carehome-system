"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { roomsAPI, bedsAPI, roomTypesAPI, bedAssignmentsAPI } from "@/lib/api";
import { BuildingOfficeIcon, MagnifyingGlassIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon, HomeIcon, UsersIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  resident_id: { _id: string; full_name: string };
  bed_id: { _id: string; bed_number: string; room_id: { _id: string; room_number: string } };
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
    setLoading(true);
    Promise.all([
      roomsAPI.getAll(),
      bedsAPI.getAll(),
      bedAssignmentsAPI.getAll(),
      roomTypesAPI.getAll(),
    ])
      .then(([rooms, beds, assignments, types]) => {
        setRooms(rooms);
        setBeds(beds);
        setBedAssignments(assignments);
        setRoomTypes(types);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải dữ liệu phòng/giường.");
        setLoading(false);
      });
  }, []);

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const bedsOfRoom = (roomId: string) =>
    beds.filter((b) => b.room_id === roomId);

  const getResidentOfBed = (bedId: string) => {
    const assignment = bedAssignments.find(
      (a) => a && a.bed_id && a.bed_id._id === bedId && !a.unassigned_date
    );
    return assignment ? assignment.resident_id.full_name : null;
  };

  // Tìm kiếm phòng theo số phòng, loại phòng, tầng
  const filteredRooms = rooms.filter((room) => {
    const type = getRoomType(room.room_type);
    const search = searchTerm.toLowerCase();
    return (
      room.room_number.toLowerCase().includes(search) ||
      (type?.type_name?.toLowerCase() || '').includes(search) ||
      (room.floor + '').includes(search)
    );
  });

  // Tính toán thống kê
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => room.status === "available").length;
  const occupiedRooms = totalRooms - availableRooms;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl text-sm font-medium cursor-pointer mb-6 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </button>

        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-white to-blue-50 rounded-3xl p-8 mb-8 shadow-xl border border-blue-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BuildingOfficeIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Quản lý phòng & giường
              </h1>
                              <p className="text-lg text-gray-600 font-medium">
                  Quản lý và theo dõi tình trạng phòng và giường bệnh
                </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tổng phòng</p>
                <p className="text-3xl font-bold">{totalRooms}</p>
                <p className="text-blue-100 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <HomeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Phòng trống</p>
                <p className="text-3xl font-bold">{availableRooms}</p>
                <p className="text-green-100 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Phòng đã sử dụng</p>
                <p className="text-3xl font-bold">{occupiedRooms}</p>
                <p className="text-orange-100 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPinIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Tổng giường</p>
                <p className="text-3xl font-bold">{totalBeds}</p>
                <p className="text-purple-100 text-xs font-bold">giường</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm theo số phòng, loại phòng, tầng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-xl border border-blue-200">
              <p className="text-blue-700 font-semibold text-lg">
                Hiển thị: {filteredRooms.length} phòng
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Rooms Table */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <th className="px-6 py-4 text-left text-white font-bold text-base">Số phòng</th>
                  <th className="px-6 py-4 text-left text-white font-bold text-base">Loại phòng</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-base">Số giường</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-base">Giới tính</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-base">Tầng</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-base">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-base">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => {
                  const type = getRoomType(room.room_type);
                  return (
                    <tr
                      key={room._id}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {room.room_number}
                          </div>
                          
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {type ? type.type_name : room.room_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{room.bed_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          room.gender === "male" 
                            ? "bg-blue-100 text-blue-800" 
                            : room.gender === "female" 
                            ? "bg-pink-100 text-pink-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {room.gender === "male" ? "Nam" : room.gender === "female" ? "Nữ" : "Hỗn hợp"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">Tầng {room.floor}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          room.status === "available" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {room.status === "available" ? "Còn trống" : "Hết giường"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 mx-auto ${
                            selectedRoomId === room._id
                              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                              : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
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

        {/* Enhanced Beds Table for selected room */}
        {selectedRoomId && (
          <div className="mt-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 shadow-xl border border-blue-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {rooms.find((r) => r._id === selectedRoomId)?.room_number}
                </div>
                Danh sách giường phòng {rooms.find((r) => r._id === selectedRoomId)?.room_number}
              </h2>
              
              {/* Enhanced Room Type Information */}
              {(() => {
                const room = rooms.find((r) => r._id === selectedRoomId);
                const type = room ? getRoomType(room.room_type) : null;
                if (!type) return null;
                return (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
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
                          <div className="text-lg font-bold text-green-700">{type.monthly_price?.toLocaleString()}đ/tháng</div>
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
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có giường</h3>
                  <p className="text-gray-600">Phòng này hiện chưa có giường nào được thiết lập.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                        <th className="px-6 py-4 text-left text-white font-bold text-base">Số giường</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-base">Loại giường</th>
                        <th className="px-6 py-4 text-center text-white font-bold text-base">Trạng thái</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-base">Người cao tuổi đang ở</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bedsOfRoom(selectedRoomId).map((bed, idx) => (
                        <tr key={bed._id} className={`border-b border-gray-100 hover:bg-indigo-50 transition-all duration-200 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                             
                              <span className="font-semibold text-gray-900">{bed.bed_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                                                       <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                             {bed.bed_type === "standard" ? "Tiêu chuẩn" : 
                              bed.bed_type === "electric" ? "Giường điện" :
                              bed.bed_type}
                           </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                              bed.status === "occupied" 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {bed.status === "occupied" ? "Đang sử dụng" : "Còn trống"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">
                              {getResidentOfBed(bed._id) || "-"}
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
        )}

        {/* Enhanced Empty state */}
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
      </div>
    </div>
  );
}
