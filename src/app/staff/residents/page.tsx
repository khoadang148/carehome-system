"use client";
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { staffAssignmentsAPI, carePlansAPI, roomsAPI, userAPI, bedAssignmentsAPI, residentAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

// Helper function to check if bed assignment is active
const isBedAssignmentActive = (assignment) => {
  if (!assignment) return false;
  if (!assignment.unassigned_date) return true; // null = active
  const unassignedDate = new Date(assignment.unassigned_date);
  const now = new Date();
  return unassignedDate > now; // ngày trong tương lai = active
};
import Avatar from '@/components/Avatar';

interface Resident {
  _id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  emergency_contact?: string;
  medical_conditions?: string;
  allergies?: string;
  room_number?: string;
  bed_number?: string;
  avatar?: string;
}

interface StaffAssignment {
  _id: string;
  resident_id: Resident;
  assigned_date: string;
  end_date?: string;
  notes?: string;
  responsibilities: string[];
}

export default function StaffResidentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [residentsData, setResidentsData] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user && user.role !== 'staff') {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchResidents = async () => {
      setLoadingData(true);
      try {
        const data = await staffAssignmentsAPI.getMyAssignments();
        console.log('Staff assignments response:', data);
        const assignmentsData = Array.isArray(data) ? data : [];

        const isAssignmentActive = (a: any) => {
          if (!a) return false;
          if (a.status && String(a.status).toLowerCase() === 'expired') return false;
          if (!a.end_date) return true;
          const end = new Date(a.end_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return end >= today;
        };

        // Detect new room-based shape: item has room_id and residents array
        const isRoomBased = assignmentsData.some((a: any) => a && (a.room_id || a.residents));
        console.log('Is room based:', isRoomBased, 'Assignments data:', assignmentsData);
        
        // If no assignments, show empty state
        if (assignmentsData.length === 0) {
          console.log('No assignments found');
          setResidentsData([]);
          setRoomNumbers({});
          setError('');
          return;
        }

        if (isRoomBased) {
          // Flatten residents from each assigned room
          const uniqueRooms: { [roomId: string]: any } = {};
          const flattened: any[] = [];

          const activeRoomAssignments = assignmentsData.filter((a: any) => isAssignmentActive(a));
          console.log('Active room assignments:', activeRoomAssignments);

          for (const assignment of activeRoomAssignments) {
            const room = assignment.room_id;
            let residents: any[] = Array.isArray(assignment.residents) ? assignment.residents : [];
            console.log('Assignment room:', room, 'Residents:', residents);

            // Cache room info for later number resolution
            const roomId = typeof room === 'object' ? (room?._id || room?.id) : room;
            if (roomId && !uniqueRooms[roomId]) uniqueRooms[roomId] = room;

            // Get residents from bed assignments for this room
            if (roomId) {
              try {
                const bedAssignments = await bedAssignmentsAPI.getAll();
                if (Array.isArray(bedAssignments)) {
                  const roomBedAssignments = bedAssignments.filter((ba: any) => {
                    if (!isBedAssignmentActive(ba) || !ba.bed_id) return false;
                    const bedRoomId = typeof ba.bed_id.room_id === 'object' ? ba.bed_id.room_id._id : ba.bed_id.room_id;
                    return bedRoomId === roomId;
                  });
                  
                  residents = roomBedAssignments
                    .map((ba: any) => ba.resident_id)
                    .filter(Boolean);
                  
                  console.log('Found residents for room', roomId, ':', residents);
                }
              } catch (error) {
                console.error('Error fetching bed assignments:', error);
              }
            }

            for (const resident of residents) {
              const age = resident?.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '';
              flattened.push({
                id: resident?._id,
                name: resident?.full_name || '',
                age: age || '',
                careLevel: resident?.care_level || '',
                emergencyContact: resident?.emergency_contact?.name || '',
                contactPhone: resident?.emergency_contact?.phone || '',
                avatar: Array.isArray(resident?.avatar) ? resident.avatar[0] : resident?.avatar || null,
                gender: (resident?.gender || '').toLowerCase(),
                assignmentStatus: assignment.status || 'active',
                assignmentId: assignment._id,
                endDate: assignment.end_date,
                assignedDate: assignment.assigned_date,
                __roomId: roomId,
              });
            }
            
            // If no residents found for this room, log it
            if (residents.length === 0) {
              console.log('No residents found for room', roomId, 'in assignment', assignment._id);
            }
          }

          // Enrich with avatar + emergency contact from resident detail
          const enriched = await Promise.all(flattened.map(async (r) => {
            try {
              const detail = await residentAPI.getById(r.id);
              const emergency = detail?.emergency_contact || {};
              return {
                ...r,
                emergencyContact: emergency?.name || r.emergencyContact || '',
                contactPhone: emergency?.phone || r.contactPhone || '',
                avatar: detail?.avatar ? residentAPI.getAvatarUrl(r.id) : r.avatar,
              };
            } catch {
              return r;
            }
          }));

          console.log('Flattened residents:', flattened);
          
          if (flattened.length === 0) {
            console.log('No residents found in any assigned rooms');
            setResidentsData([]);
            setRoomNumbers({});
            setError('');
            return;
          }
          
          setResidentsData(enriched);

          // Resolve room numbers for residents
          const roomNumberMap: { [roomId: string]: string } = {};
          // First, take known numbers from objects
          for (const [rid, roomVal] of Object.entries(uniqueRooms)) {
            const rn = (roomVal && typeof roomVal === 'object' && roomVal.room_number) ? roomVal.room_number : '';
            if (rn) roomNumberMap[rid] = rn;
          }
          // Fetch missing room objects only once per room id
          const missingRoomIds = Object.keys(uniqueRooms).filter(rid => !roomNumberMap[rid]);
          const fetchedRooms = await Promise.all(missingRoomIds.map(async (rid) => {
            try { return [rid, await roomsAPI.getById(rid)] as const; } catch { return [rid, null] as const; }
          }));
          fetchedRooms.forEach(([rid, room]) => {
            if (room?.room_number) roomNumberMap[rid] = room.room_number;
          });

          const nextMap: { [key: string]: string } = {};
          flattened.forEach((r) => {
            if (r.__roomId && roomNumberMap[r.__roomId]) nextMap[r.id] = roomNumberMap[r.__roomId];
          });
          setRoomNumbers(nextMap);
        } else {
          // Backward compatibility: resident-based assignments
          console.log('Using backward compatibility mode');
          const mapped = assignmentsData
            .filter((assignment: any) => isAssignmentActive(assignment))
            .map((assignment: any) => {
              const resident = assignment.resident_id;
              const age = resident.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '';
              return {
                id: resident._id,
                name: resident.full_name || '',
                age: age || '',
                careLevel: resident.care_level || '',
                emergencyContact: resident.emergency_contact?.name || '',
                contactPhone: resident.emergency_contact?.phone || '',
                avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
                gender: (resident.gender || '').toLowerCase(),
                assignmentStatus: assignment.status || 'active',
                assignmentId: assignment._id,
                endDate: assignment.end_date,
                assignedDate: assignment.assigned_date,
              };
            });

          const enriched = await Promise.all(mapped.map(async (r) => {
            try {
              const detail = await residentAPI.getById(r.id);
              const emergency = detail?.emergency_contact || {};
              return {
                ...r,
                emergencyContact: emergency?.name || r.emergencyContact || '',
                contactPhone: emergency?.phone || r.contactPhone || '',
                avatar: detail?.avatar ? residentAPI.getAvatarUrl(r.id) : r.avatar,
              };
            } catch {
              return r;
            }
          }));

          console.log('Mapped residents (backward compatibility):', mapped);
          
          if (mapped.length === 0) {
            console.log('No residents found in backward compatibility mode');
            setResidentsData([]);
            setRoomNumbers({});
            setError('');
            return;
          }
          
          setResidentsData(enriched);

          const roomEntries = await Promise.all(
            mapped.map(async (resident: any) => {
              try {
                const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident.id);
                const bedAssignment = Array.isArray(bedAssignments)
                  ? bedAssignments.find((a: any) => a.bed_id?.room_id)
                  : null;
                if (bedAssignment?.bed_id?.room_id) {
                  if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                    return [resident.id, bedAssignment.bed_id.room_id.room_number] as [string, string];
                  }
                  const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                  if (roomId) {
                    const room = await roomsAPI.getById(roomId);
                    return [resident.id, room?.room_number || 'Chưa hoàn tất đăng kí'] as [string, string];
                  }
                }

                const assignments = await carePlansAPI.getByResidentId(resident.id);
                const assignment = Array.isArray(assignments)
                  ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id)
                  : null;
                const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
                const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                if (roomIdString) {
                  const room = await roomsAPI.getById(roomIdString);
                  return [resident.id, room?.room_number || 'Chưa hoàn tất đăng kí'] as [string, string];
                }
                return [resident.id, 'Chưa hoàn tất đăng kí'] as [string, string];
              } catch {
                return [resident.id, 'Chưa hoàn tất đăng kí'] as [string, string];
              }
            })
          );
          const nextMap: { [key: string]: string } = {};
          roomEntries.forEach(([id, number]) => {
            nextMap[id] = number;
          });
          setRoomNumbers(nextMap);
        }
        
        console.log('Final residents data:', residentsData);
        setError('');
      } catch (err) {
        setError('Không thể tải danh sách người cao tuổi được phân công.');
        setResidentsData([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (user && user.role === 'staff') {
      fetchResidents();
    }
  }, [user]);

  const filteredResidents = residentsData.filter((resident) => {
    const searchValue = (searchTerm || '').toString();
    const residentName = (resident.name || '').toString();
    const residentRoom = (roomNumbers[resident.id] || '').toString();
    return residentName.toLowerCase().includes(searchValue.toLowerCase()) ||
           residentRoom.toLowerCase().includes(searchValue.toLowerCase());
  });
  

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="ml-4 text-indigo-600 font-semibold">Đang tải...</p>
      </div>
    );
  }

  if (user.role !== 'staff') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(102,126,234,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.05)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(245,158,11,0.03)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Danh sách người cao tuổi được phân công chăm sóc
                </h1>
                <p className="text-base text-slate-600 mt-1 font-medium">
                  Tổng số: {residentsData.length} người cao tuổi đang được phân công cho bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-md border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc phòng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 text-sm bg-white"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-600 m-0 font-semibold">
                Hiển thị: {filteredResidents.length} người cao tuổi
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {loadingData && (
          <div className="flex justify-center items-center py-16 px-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-gray-500">Đang tải danh sách người cao tuổi...</p>
          </div>
        )}

        {!loadingData && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-br from-slate-50 to-slate-200 border-b border-gray-200">
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Người cao tuổi
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Phòng
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Tuổi
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Giới tính
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Liên hệ khẩn cấp
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="p-4 text-center text-sm font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident, index) => (
                    <tr 
                      key={resident.id}
                      className={`border-b border-gray-100 transition-all duration-200 hover:bg-indigo-50/50 ${
                        index < filteredResidents.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={resident.avatar ? residentAPI.getAvatarUrl(resident.id) : undefined}
                            alt={resident.name}
                            size="small"
                            className="w-10 h-10"
                            showInitials={true}
                            name={resident.name}
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 m-0">
                              {resident.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
                          {roomNumbers[resident.id] || 'Đang tải...'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {resident.age} tuổi
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'Khác'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 m-0">
                            {resident.emergencyContact}
                          </p>
                          <p className="text-xs text-gray-500 m-0">
                            {resident.contactPhone}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
                          Đang quản lý
                        </span>
                        {resident.endDate && (
                          <p className="text-xs text-gray-500 mt-1 m-0">
                            Hết hạn: {new Date(resident.endDate).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/staff/residents/${resident.id}`}
                            title="Xem thông tin chi tiết người cao tuổi"
                            className="p-2 rounded-md border-none bg-blue-100 text-blue-600 cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:text-white no-underline"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredResidents.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2 text-gray-700">
                  {searchTerm ? 'Không tìm thấy người cao tuổi' : 'Chưa có người cao tuổi nào được phân công'}
                </h3>
                <p className="m-0 text-sm">
                  {searchTerm ? 'Thử thay đổi tiêu chí tìm kiếm' : 'Admin sẽ phân công người cao tuổi cho bạn sớm'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 