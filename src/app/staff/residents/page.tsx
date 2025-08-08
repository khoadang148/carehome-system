"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { staffAssignmentsAPI, carePlansAPI, roomsAPI, userAPI, bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
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

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'staff') {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load residents from API when component mounts
  useEffect(() => {
    const fetchResidents = async () => {
      setLoadingData(true);
      try {
        const data = await staffAssignmentsAPI.getMyAssignments();
        const assignmentsData = Array.isArray(data) ? data : [];
        
        // Debug: Log assignments data
        console.log('Raw assignments data:', assignmentsData);
        
        // Map API data về đúng format UI và chỉ lấy những assignment active
        const mapped = assignmentsData
          .filter((assignment: any) => assignment.status === 'active') // Chỉ lấy active assignments
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
              assignmentStatus: assignment.status || 'unknown',
              assignmentId: assignment._id,
              endDate: assignment.end_date,
              assignedDate: assignment.assigned_date,
            };
          });
        
        setResidentsData(mapped);
        
        // Lấy số phòng cho từng resident
        mapped.forEach(async (resident: any) => {
          try {
            const assignments = await bedAssignmentsAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
            const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
            // Đảm bảo roomId là string, không phải object
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
          }
        });
        
        setError('');
      } catch (err) {
        console.error('Error loading assignments:', err);
        setError('Không thể tải danh sách cư dân được phân công.');
        setResidentsData([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (user && user.role === 'staff') {
      fetchResidents();
    }
  }, [user]);

  // Filter residents chỉ theo search term
  const filteredResidents = residentsData.filter((resident) => {
    const searchValue = (searchTerm || '').toString();
    const residentName = (resident.name || '').toString();
    const residentRoom = (roomNumbers[resident.id] || '').toString();
    return residentName.toLowerCase().includes(searchValue.toLowerCase()) ||
           residentRoom.toLowerCase().includes(searchValue.toLowerCase());
  });
  
  // Handle view resident details
  const handleViewResident = (residentId: number) => {
    router.push(`/staff/residents/${residentId}`);
  };

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
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(102,126,234,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.05)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(245,158,11,0.03)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Danh sách cư dân được phân công
                </h1>
                <p className="text-base text-slate-600 mt-1 font-medium">
                  Tổng số: {residentsData.length} cư dân đang được phân công cho bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-md border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            {/* Search Input */}
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

            {/* Results Count */}
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-600 m-0 font-semibold">
                Hiển thị: {filteredResidents.length} cư dân
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading */}
        {loadingData && (
          <div className="flex justify-center items-center py-16 px-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-gray-500">Đang tải danh sách cư dân...</p>
          </div>
        )}

        {/* Residents Table */}
        {!loadingData && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-br from-slate-50 to-slate-200 border-b border-gray-200">
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Cư dân
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
                            src={resident.avatar ? userAPI.getAvatarUrl(resident.avatar) : undefined}
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
                            <p className="text-xs text-gray-500 m-0">
                              ID: {resident.id}
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
                          <button
                            onClick={() => handleViewResident(resident.id)}
                            title="Xem thông tin chi tiết cư dân"
                            className="p-2 rounded-md border-none bg-blue-100 text-blue-600 cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:text-white"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
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
                  {searchTerm ? 'Không tìm thấy cư dân' : 'Chưa có cư dân nào được phân công'}
                </h3>
                <p className="m-0 text-sm">
                  {searchTerm ? 'Thử thay đổi tiêu chí tìm kiếm' : 'Admin sẽ phân công cư dân cho bạn sớm'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 