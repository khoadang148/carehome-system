"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  PlusIcon,
  ArrowLeftIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDateDDMMYYYYWithTimezone, formatTimeWithTimezone, getDateYYYYMMDDWithTimezone } from '@/lib/utils/validation';
import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI, userAPI } from '@/lib/api';

// Helper function to ensure string values
const ensureString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if (value.full_name || value.fullName || value.name) {
      return value.full_name || value.fullName || value.name;
    }
    if (value.username || value.email) {
      return value.username || value.email;
    }
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    return 'Unknown';
  }
  if (value === null || value === undefined) return 'N/A';
  return String(value || 'N/A');
};

const ITEMS_PER_PAGE = 10; // Số chỉ số sức khỏe hiển thị trên mỗi trang

export default function StaffVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: 'success' | 'error', time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load residents from API when component mounts
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        let mapped: any[] = [];
        
        if (user?.role === 'staff') {
          const data = await staffAssignmentsAPI.getMyAssignments();
          const assignmentsData = Array.isArray(data) ? data : [];
          
          mapped = assignmentsData
            .filter((assignment: any) => assignment.status === 'active')
            .map((assignment: any) => {
              const resident = assignment.resident_id;
              
              return {
                id: resident._id,
                name: resident.full_name || '',
                avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
                assignmentStatus: assignment.status || 'unknown',
                assignmentId: assignment._id,
              };
            });
        } else if (user?.role === 'admin') {
          const data = await residentAPI.getAll();
          const residentsData = Array.isArray(data) ? data : [];
          
          mapped = residentsData.map((resident: any) => ({
            id: resident._id,
            name: resident.full_name || '',
            avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
          }));
        }
        
        setResidents(mapped);
        
        // Get room numbers for each resident
        mapped.forEach(async (resident: any) => {
          try {
            const assignments = await carePlansAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
            const roomId = assignment?.assigned_room_id;
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa cập nhật' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
          }
        });
        
      } catch (err) {
        console.error('Error loading residents:', err);
        setResidents([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchResidents();
    }
  }, [user]);

  // Load vital signs data
  useEffect(() => {
    const fetchVitalSigns = async () => {
      try {
        const data = await vitalSignsAPI.getAll();
        const vitalSignsData = Array.isArray(data) ? data : [];
        setVitalSigns(vitalSignsData);
      } catch (err) {
        console.error('Error loading vital signs:', err);
        setVitalSigns([]);
      }
    };
    
    if (user) {
      fetchVitalSigns();
    }
  }, [user]);

  // Transform vital signs data for display
  const transformVitalSignsForDisplay = (vitalSignsData: any[]) => {
    return vitalSignsData.map(vs => {
      const resident = residents.find(r => r.id === vs.resident_id);
      const dateTime = vs.date_time || vs.date;
      
      return {
        id: vs._id,
        residentId: vs.resident_id,
        residentName: resident?.name || 'Unknown',
        residentAvatar: resident?.avatar,
        date: formatDateDDMMYYYYWithTimezone(dateTime),
        time: formatTimeWithTimezone(dateTime),
        bloodPressure: vs.blood_pressure || vs.bloodPressure,
        heartRate: vs.heart_rate || vs.heartRate,
        temperature: vs.temperature,
        oxygenSaturation: vs.oxygen_level || vs.oxygen_saturation || vs.oxygenSaturation,
        respiratoryRate: vs.respiratory_rate || vs.respiratoryRate,
        weight: vs.weight,
        notes: vs.notes,
        recordedBy: vs.recorded_by || vs.recordedBy || null,
      };
    });
  };

  // Get filtered vital signs
  const getFilteredVitalSigns = (residentId?: string, dateFilter?: string) => {
    let filtered = vitalSigns;
    
    if (residentId) {
      filtered = filtered.filter(vs => vs.resident_id === residentId);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(vs => {
        const dateTime = vs.date_time || vs.date;
        if (!dateTime) return false;
        
        const formattedDate = getDateYYYYMMDDWithTimezone(dateTime);
        return formattedDate === dateFilter;
      });
    }
    
    return transformVitalSignsForDisplay(filtered);
  };

  // Get filtered data
  const filteredVitalSigns = getFilteredVitalSigns(selectedResident || undefined, selectedDate || undefined);

  // Pagination logic
  const totalPages = Math.ceil(filteredVitalSigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVitalSigns = filteredVitalSigns.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedResident, selectedDate]);

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer mb-4 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 flex items-center justify-center shadow-lg">
                    <HeartIconSolid className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-2">
                      Theo Dõi Các Chỉ Số Sức Khỏe
                    </h1>
                    <p className="text-gray-500">
                      Ghi nhận và theo dõi các thông số sinh lý quan trọng của người cao tuổi
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">
                      Tổng chỉ số:
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {filteredVitalSigns.length}
                    </div>
                    {totalPages > 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Trang {currentPage}/{totalPages}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => router.push('/staff/vital-signs/add')}
                  disabled={user?.role === 'staff' && residents.length === 0}
                  className={`flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-lg transition-all ${
                    user?.role === 'staff' && residents.length === 0
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-xl hover:scale-105'
                  }`}
                  title={user?.role === 'staff' && residents.length === 0 
                    ? 'Bạn chưa được phân công quản lý cư dân nào' 
                    : 'Thêm chỉ số sức khỏe mới'
                  }
                >
                  <PlusIcon className="w-5 h-5" />
                  Thêm chỉ số
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
              {/* Resident Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                   Lọc theo người cao tuổi
                </label>
                <select
                  value={selectedResident || ''}
                  onChange={(e) => setSelectedResident(e.target.value || null)}
                  className="w-full p-4 border border-gray-300 rounded-xl text-sm outline-none bg-white transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm"
                  disabled={residents.length === 0}
                >
                  <option value="">
                    {residents.length === 0 
                      ? (user?.role === 'staff' 
                          ? 'Chưa được phân công cư dân nào' 
                          : 'Chưa có cư dân nào trong hệ thống')
                      : 'Tất cả người cao tuổi được phân công'
                    }
                  </option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} - Phòng {roomNumbers[resident.id] || 'Chưa cập nhật'}
                    </option>
                  ))}
                </select>
                {residents.length === 0 && user?.role === 'staff' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-400 rounded-xl text-sm text-yellow-800 shadow-sm">
                    ⚠️ Bạn chưa được phân công quản lý cư dân nào. Vui lòng liên hệ admin để được phân công.
                  </div>
                )}
                {residents.length === 0 && user?.role === 'admin' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-400 rounded-xl text-sm text-blue-800 shadow-sm">
                    ℹ️ Chưa có cư dân nào trong hệ thống.
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                  Lọc theo ngày
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-xl text-sm outline-none bg-white transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Vital Signs List */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-red-500 mb-1">
                    Danh sách chỉ số sức khỏe
                  </h2>
                  <p className="text-sm text-gray-500">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="text-sm text-gray-500">
                    Trang {currentPage} / {totalPages}
                  </div>
                )}
              </div>
            </div>

            {filteredVitalSigns.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {residents.length === 0 && user?.role === 'staff' 
                    ? 'Bạn chưa được phân công quản lý cư dân nào'
                    : 'Chưa có chỉ số sức khỏe nào'
                  }
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {residents.length === 0 && user?.role === 'staff'
                    ? 'Vui lòng liên hệ admin để được phân công quản lý cư dân'
                    : 'Thêm chỉ số sức khỏe đầu tiên để theo dõi sức khỏe'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                          Người cao tuổi
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                          Ngày giờ
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-semibold text-red-600 uppercase tracking-wider min-w-[100px]">
                          Huyết áp
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-semibold text-green-600 uppercase tracking-wider min-w-[90px]">
                          Nhịp tim
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-semibold text-orange-600 uppercase tracking-wider min-w-[90px]">
                          Nhiệt độ
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider min-w-[80px]">
                          SpO2
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider min-w-[110px]">
                          Nhịp thở
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-semibold text-green-600 uppercase tracking-wider min-w-[90px]">
                          Cân nặng
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-semibold text-green-600 uppercase tracking-wider min-w-[120px]">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVitalSigns.map((vs, index) => (
                        <tr 
                          key={vs.id}
                          className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden flex-shrink-0">
                                {vs.residentAvatar ? (
                                  <img
                                    src={userAPI.getAvatarUrl(vs.residentAvatar)}
                                    alt={ensureString(vs.residentName)}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.textContent = ensureString(vs.residentName).charAt(0).toUpperCase();
                                      }
                                    }}
                                  />
                                ) : (
                                  ensureString(vs.residentName).charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate">
                                  {ensureString(vs.residentName)}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  ID: {ensureString(vs.residentId)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 whitespace-nowrap">
                            <div className="font-medium">{vs.date || 'Invalid Date'}</div>
                            <div className="text-gray-500 text-xs">{vs.time || ''}</div>
                          </td>
                          <td className="px-2 py-4 text-sm">
                            <span className="text-red-600 font-semibold px-2 py-1 bg-red-50 rounded-md border border-red-200 whitespace-nowrap text-xs">
                              {vs.bloodPressure}
                            </span>
                          </td>
                          <td className="px-2 py-4 text-sm">
                            <span className="text-green-600 font-semibold px-2 py-1 bg-green-50 rounded-md border border-green-200 whitespace-nowrap text-xs">
                              {vs.heartRate} bpm
                            </span>
                          </td>
                          <td className="px-2 py-4 text-sm">
                            <span className="text-orange-600 font-semibold px-2 py-1 bg-orange-50 rounded-md border border-orange-200 whitespace-nowrap text-xs">
                              {vs.temperature}°C
                            </span>
                          </td>
                          <td className="px-2 py-4 text-sm">
                            <span className="text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded-md border border-blue-200 whitespace-nowrap text-xs">
                              {vs.oxygenSaturation}%
                            </span>
                          </td>
                          <td className="px-2 py-4 text-sm">
                            {vs.respiratoryRate ? (
                              <span className="text-purple-600 font-semibold px-2 py-1 bg-purple-50 rounded-md border border-purple-200 whitespace-nowrap text-xs">
                                {vs.respiratoryRate} lần/phút
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-xs whitespace-nowrap">
                                Chưa ghi nhận
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-4 text-sm">
                            {vs.weight ? (
                              <span className="text-green-600 font-semibold px-2 py-1 bg-green-50 rounded-md border border-green-200 whitespace-nowrap text-xs">
                                {vs.weight} kg
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-xs whitespace-nowrap">
                                Chưa ghi nhận
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            {vs.notes ? (
                              <span className="text-gray-700 font-medium text-xs">
                                {vs.notes}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-xs">
                                Không có ghi chú
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((page, index) => (
                            <button
                              key={index}
                              onClick={() => typeof page === 'number' && setCurrentPage(page)}
                              disabled={page === '...'}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                page === currentPage
                                  ? 'bg-red-500 text-white'
                                  : page === '...'
                                  ? 'text-gray-400 cursor-default'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Center Button */}
      <div className="fixed top-6 right-8 z-50">
        <button
          onClick={() => setShowNotifications(v => !v)}
          className="relative bg-white border border-gray-300 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        >
          <BellIcon className="w-6 h-6 text-red-500" />
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs font-bold px-2 py-1 min-w-5 text-center leading-none">
              {notifications.length}
            </span>
          )}
        </button>
        
        {/* Notification List Popup */}
        {showNotifications && (
          <div className="absolute top-14 right-0 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-base text-gray-900">Thông báo</span>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="bg-none border-none text-red-500 font-bold cursor-pointer text-xl hover:text-red-600"
              >
                ×
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Không có thông báo nào</div>
            ) : (
              <ul className="space-y-3">
                {notifications.map(n => (
                  <li key={n.id} className={`p-3 rounded-xl border flex items-center gap-3 ${
                    n.type === 'success' 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <span className="text-xl">{n.type === 'success' ? '✅' : '❌'}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        n.type === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {n.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{n.time}</div>
                    </div>
                    <button 
                      onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} 
                      className="bg-none border-none text-gray-500 text-xl cursor-pointer hover:text-gray-700"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
} 