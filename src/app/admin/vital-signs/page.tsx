"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  PlusIcon,
  ArrowLeftIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDateDDMMYYYYWithTimezone, formatTimeWithTimezone, getDateYYYYMMDDWithTimezone, formatDateDDMMYYYY } from '@/lib/utils/validation';
import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI, userAPI, bedAssignmentsAPI } from '@/lib/api';

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

const ITEMS_PER_PAGE = 15; // Số chỉ số sức khỏe hiển thị trên mỗi trang

export default function AdminVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateDisplay, setSelectedDateDisplay] = useState<string>('');

  const [notifications, setNotifications] = useState<{ id: number, message: string, type: 'success' | 'error', time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load all residents and staff assignments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load all residents
        const residentsData = await residentAPI.getAll();
        const allResidents = Array.isArray(residentsData) ? residentsData : [];
        
        // Load all staff assignments
        const assignmentsData = await staffAssignmentsAPI.getAll();
        const allAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];
        
        // Get room assignments for all residents first
        const residentsWithRooms = await Promise.all(
          allResidents.map(async (resident: any) => {
            try {
              const assignments = await bedAssignmentsAPI.getByResidentId(resident._id);
              const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
              const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              
              let roomNumber = 'Chưa hoàn tất đăng kí';
              if (roomIdString) {
                const room = await roomsAPI.getById(roomIdString);
                roomNumber = room?.room_number || 'Chưa hoàn tất đăng kí';
              }
              
              return {
                ...resident,
                roomNumber,
                hasRoom: roomNumber !== 'Chưa hoàn tất đăng kí'
              };
            } catch {
              return {
                ...resident,
                roomNumber: 'Chưa hoàn tất đăng kí',
                hasRoom: false
              };
            }
          })
        );
        
        // Filter only residents who have completed registration (have room assigned)
        const completedResidents = residentsWithRooms.filter((resident: any) => resident.hasRoom);
        
        // Map residents with their assignment status
        const mappedResidents = completedResidents.map((resident: any) => {
          const activeAssignment = allAssignments.find((assignment: any) => 
            assignment.resident_id === resident._id && assignment.status === 'active'
          );
          
          return {
            id: resident._id,
            name: resident.full_name || '',
            avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
            assignmentStatus: activeAssignment ? 'active' : 'inactive',
            assignmentId: activeAssignment?._id || null,
            assignedStaff: activeAssignment?.staff_id || null,
            roomNumber: resident.roomNumber,
          };
        });
        
        setResidents(mappedResidents);
        setStaffAssignments(allAssignments);
        
        // Set room numbers
        const roomNumbersMap: {[residentId: string]: string} = {};
        mappedResidents.forEach((resident: any) => {
          roomNumbersMap[resident.id] = resident.roomNumber;
        });
        setRoomNumbers(roomNumbersMap);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setResidents([]);
        setStaffAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
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
        residentName: resident?.name || 'Cư dân không tồn tại',
        residentAvatar: resident?.avatar,
        assignmentStatus: resident?.assignmentStatus || 'unknown',
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
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date_time || a.date);
      const dateB = new Date(b.date_time || b.date);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
    
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

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd
  const convertDateToISO = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Helper function to convert yyyy-mm-dd to dd/mm/yyyy
  const convertDateToDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return formatDateDDMMYYYY(date);
  };

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

  // Calculate statistics
  const totalResidents = residents.length;
  const totalVitalSigns = vitalSigns.length;
  const todayVitalSigns = vitalSigns.filter(vs => {
    const today = new Date().toISOString().split('T')[0];
    const vsDate = new Date(vs.date_time || vs.date).toISOString().split('T')[0];
    return vsDate === today;
  }).length;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl text-sm font-medium cursor-pointer mb-6 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>

          {/* Enhanced Header */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <HeartIconSolid className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-red-600 mb-2">
                    Quản Lý Chỉ Số Sức Khỏe
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">
                    Theo dõi và quản lý chỉ số sức khỏe của người cao tuổi
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-red-50 px-6 py-4 rounded-2xl border border-red-200">
                  <div className="text-center">
                    <div className="text-sm text-red-600 font-medium mb-1">
                      Tổng chỉ số
                    </div>
                    <div className="text-3xl font-bold text-red-700">
                      {filteredVitalSigns.length} 
                    </div>
                    <div className="text-sm text-red-600 font-medium mb-1">
                      bản ghi
                    </div>
                    {totalPages > 1 && (
                      <div className="text-xs text-red-500 mt-1">
                        Trang {currentPage}/{totalPages}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Enhanced Filters */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
              {/* Resident Filter */}
              <div>
                                <label className="block text-sm font-semibold text-red-600 mb-3">
                   Lọc theo người cao tuổi
                </label>
                <div className="relative">
                  <select
                    value={selectedResident || ''}
                    onChange={(e) => setSelectedResident(e.target.value || null)}
                    className="w-full p-4 border border-gray-300 rounded-xl text-base outline-none bg-white transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm appearance-none"
                  >
                    <option value="">Tất cả người cao tuổi</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Phòng {resident.roomNumber}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     </svg>
                  </div>
                </div>
              </div>

                                          {/* Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-red-600 mb-3">
                   Lọc theo ngày
                </label>
                <div className="relative date-picker-container">
                  {/* Hidden date input for native picker */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        setSelectedDate(value);
                        setSelectedDateDisplay(convertDateToDisplay(value));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    style={{ zIndex: 1 }}
                  />
                  
                  {/* Visible text input */}
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={selectedDateDisplay}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedDateDisplay(value);
                      
                      // Validate and convert to ISO format for filtering
                      if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                        setSelectedDate(convertDateToISO(value));
                      } else {
                        setSelectedDate('');
                      }
                    }}
                    className="w-full p-4 border border-gray-300 rounded-xl text-base outline-none bg-white transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm text-gray-700 pr-12 relative"
                    style={{ zIndex: 0 }}
                  />
                  
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Vital Signs List */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    Danh sách chỉ số sức khỏe
                  </h2>
                  <p className="text-sm text-gray-600">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                    Trang {currentPage} / {totalPages}
                  </div>
                )}
              </div>
            </div>

            {filteredVitalSigns.length === 0 ? (
              <div className="p-16 text-center bg-white">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HeartIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Chưa có chỉ số sức khỏe nào
                </h3>
                <p className="text-gray-500 leading-relaxed max-w-md mx-auto">
                  Thêm chỉ số sức khỏe đầu tiên để theo dõi sức khỏe người cao tuổi một cách hiệu quả
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="bg-red-600">
                        <th className="px-6 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[200px]">
                          <div className="flex items-center gap-2">
                            
                            Người cao tuổi
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center gap-2">
                            
                            Ngày giờ
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                          Huyết áp
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[90px]">
                          Nhịp tim
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[90px]">
                          Nhiệt độ
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[80px]">
                          SpO2
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[110px]">
                          Nhịp thở
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[90px]">
                          Cân nặng
                        </th>
                        <th className="px-4 py-4 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVitalSigns.map((vs, index) => (
                        <tr 
                          key={vs.id}
                          className={`border-b border-gray-100 transition-all duration-200 hover:bg-red-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden flex-shrink-0 shadow-lg">
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
                                <div className="font-semibold text-gray-900 truncate text-base">
                                  {ensureString(vs.residentName)}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Phòng: {roomNumbers[vs.residentId] || 'Chưa phân phòng'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{vs.date || 'Invalid Date'}</div>
                            <div className="text-gray-500 text-xs">{vs.time || ''}</div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="text-red-600 font-bold px-3 py-2 bg-red-50 rounded-lg border border-red-200 whitespace-nowrap text-sm shadow-sm">
                              {vs.bloodPressure}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="text-green-600 font-bold px-3 py-2 bg-green-50 rounded-lg border border-green-200 whitespace-nowrap text-sm shadow-sm">
                              {vs.heartRate} bpm
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="text-orange-600 font-bold px-3 py-2 bg-orange-50 rounded-lg border border-orange-200 whitespace-nowrap text-sm shadow-sm">
                              {vs.temperature}°C
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="text-blue-600 font-bold px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 whitespace-nowrap text-sm shadow-sm">
                              {vs.oxygenSaturation}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {vs.respiratoryRate ? (
                              <span className="text-purple-600 font-bold px-3 py-2 bg-purple-50 rounded-lg border border-purple-200 whitespace-nowrap text-sm shadow-sm">
                                {vs.respiratoryRate} lần/phút
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-sm whitespace-nowrap px-3 py-2 bg-gray-50 rounded-lg">
                                Chưa ghi nhận
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {vs.weight ? (
                              <span className="text-green-600 font-bold px-3 py-2 bg-green-50 rounded-lg border border-green-200 whitespace-nowrap text-sm shadow-sm">
                                {vs.weight} kg
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-sm whitespace-nowrap px-3 py-2 bg-gray-50 rounded-lg">
                                Chưa ghi nhận
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {vs.notes ? (
                              <span className="text-gray-700 font-medium text-sm">
                                {vs.notes}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-sm">
                                Không có ghi chú
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-3 rounded-xl border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((page, index) => (
                            <button
                              key={index}
                              onClick={() => typeof page === 'number' && setCurrentPage(page)}
                              disabled={page === '...'}
                              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                page === currentPage
                                  ? 'bg-red-500 text-white shadow-lg'
                                  : page === '...'
                                  ? 'text-gray-400 cursor-default'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:border-red-300'
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
                          className="p-3 rounded-xl border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
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

      {/* Enhanced Notification Center Button */}
      <div className="fixed top-6 right-8 z-50">
        <button
          onClick={() => setShowNotifications(v => !v)}
          className="relative bg-white border border-gray-300 rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <BellIcon className="w-7 h-7 text-red-500" />
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs font-bold px-2 py-1 min-w-6 text-center leading-none shadow-lg">
              {notifications.length}
            </span>
          )}
        </button>
        
        {/* Enhanced Notification List Popup */}
        {showNotifications && (
          <div className="absolute top-16 right-0 w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-lg text-gray-900">Thông báo</span>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="bg-none border-none text-red-500 font-bold cursor-pointer text-2xl hover:text-red-600 transition-colors"
              >
                ×
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="text-gray-500 text-center py-8">Không có thông báo nào</div>
            ) : (
              <ul className="space-y-3">
                {notifications.map(n => (
                  <li key={n.id} className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-200 ${
                    n.type === 'success' 
                      ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                      : 'bg-red-50 border-red-300 hover:bg-red-100'
                  }`}>
                    <span className="text-2xl">{n.type === 'success' ? '✅' : '❌'}</span>
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        n.type === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {n.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{n.time}</div>
                    </div>
                    <button 
                      onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} 
                      className="bg-none border-none text-gray-500 text-xl cursor-pointer hover:text-gray-700 transition-colors"
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