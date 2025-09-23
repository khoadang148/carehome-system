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

const ITEMS_PER_PAGE = 15;

export default function AdminVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{ [residentId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateDisplay, setSelectedDateDisplay] = useState<string>('');

  const [notifications, setNotifications] = useState<{ id: number, message: string, type: 'success' | 'error', time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Sử dụng endpoint /residents/admitted để lấy danh sách người cao tuổi đã nhập viện
        const admittedResidentsData = await residentAPI.getAdmitted();
        const allResidents = Array.isArray(admittedResidentsData) ? admittedResidentsData : [];

        const assignmentsData = await staffAssignmentsAPI.getAll();
        const allAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];

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
            } catch (error) {
              return {
                ...resident,
                roomNumber: 'Chưa hoàn tất đăng kí',
                hasRoom: false
              };
            }
          })
        );

        // Vì đã lấy từ /residents/admitted nên không cần filter thêm
        const completedResidents = residentsWithRooms;

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

        console.log('=== ADMITTED RESIDENTS DATA ===');
        console.log('Admitted residents count:', allResidents.length);
        console.log('Admitted residents:', allResidents.map(r => ({ id: r._id, name: r.full_name, status: r.status || r.resident_status })));
        console.log('Mapped residents:', mappedResidents);
        
        // Lưu admitted residents vào sessionStorage để có thể truy cập sau
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admittedResidents', JSON.stringify(allResidents));
        }
        
        setResidents(mappedResidents);
        setStaffAssignments(allAssignments);

        const roomNumbersMap: { [residentId: string]: string } = {};
        mappedResidents.forEach((resident: any) => {
          roomNumbersMap[resident.id] = resident.roomNumber;
        });
        setRoomNumbers(roomNumbersMap);

      } catch (err) {
        console.error('Error fetching admitted residents:', err);
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

  useEffect(() => {
    const fetchVitalSigns = async () => {
      try {
        console.log('=== FETCHING VITAL SIGNS ===');
        const data = await vitalSignsAPI.getAll();
        console.log('Raw vital signs data:', data);
        const vitalSignsData = Array.isArray(data) ? data : [];
        console.log('Processed vital signs data:', vitalSignsData);
        console.log('Vital signs count:', vitalSignsData.length);
        setVitalSigns(vitalSignsData);
      } catch (err) {
        console.error('Error fetching vital signs:', err);
        setVitalSigns([]);
      }
    };

    if (user) {
      fetchVitalSigns();
    }
  }, [user]);

  const transformVitalSignsForDisplay = async (vitalSignsData: any[]) => {
    const transformedData = await Promise.all(
      vitalSignsData.map(async (vs) => {
        const residentIdStr = String(vs.resident_id);
        
        // Tìm trong residents đã load trước
        let resident = residents.find(r => String(r.id) === residentIdStr);
        let residentName = 'Đang tải...';
        let residentAvatar = null;
        let roomNumber = 'Chưa xác định';
        
        if (resident) {
          residentName = resident.name;
          residentAvatar = resident.avatar;
          roomNumber = roomNumbers[vs.resident_id] || 'Chưa phân phòng';
        } else {
          // Nếu không tìm thấy, gọi API để lấy thông tin resident
          try {
            console.log('Fetching resident info for ID:', residentIdStr);
            const residentData = await residentAPI.getById(residentIdStr);
            if (residentData) {
              residentName = residentData.full_name || 'Người cao tuổi';
              residentAvatar = residentData.avatar;
              roomNumber = 'Chưa xác định';
            }
          } catch (error) {
            console.log('Error fetching resident:', error);
            residentName = 'Người cao tuổi không tồn tại';
          }
        }
        
        console.log('Mapping vital sign:', {
          vitalSignId: vs._id,
          residentId: vs.resident_id,
          residentName,
          roomNumber
        });
        
        const dateTime = vs.date_time || vs.date;

        return {
          id: vs._id,
          residentId: vs.resident_id,
          residentName,
          residentAvatar,
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
          roomNumber,
        };
      })
    );
    
    return transformedData;
  };

  const getFilteredVitalSigns = async (residentId?: string, dateFilter?: string) => {
    console.log('=== FILTERING VITAL SIGNS ===');
    console.log('Total vital signs:', vitalSigns.length);
    console.log('Total residents:', residents.length);
    
    let filtered = vitalSigns;
    console.log('After initial filter:', filtered.length);

    if (residentId) {
      filtered = filtered.filter(vs => vs.resident_id === residentId);
      console.log('After resident filter:', filtered.length);
    }

    if (dateFilter) {
      filtered = filtered.filter(vs => {
        const dateTime = vs.date_time || vs.date;
        if (!dateTime) return false;

        const formattedDate = getDateYYYYMMDDWithTimezone(dateTime);
        return formattedDate === dateFilter;
      });
      console.log('After date filter:', filtered.length);
    }

    // Không lọc theo residents nữa, hiển thị tất cả vital signs
    console.log('Showing all vital signs without resident filtering');

    filtered.sort((a, b) => {
      const dateA = new Date(a.date_time || a.date);
      const dateB = new Date(b.date_time || b.date);
      return dateB.getTime() - dateA.getTime();
    });

    const result = await transformVitalSignsForDisplay(filtered);
    console.log('Final result count:', result.length);
    return result;
  };

  const [filteredVitalSigns, setFilteredVitalSigns] = useState<any[]>([]);

  useEffect(() => {
    const loadFilteredVitalSigns = async () => {
      const result = await getFilteredVitalSigns(selectedResident || undefined, selectedDate || undefined);
      setFilteredVitalSigns(result);
    };
    
    if (vitalSigns.length > 0) {
      loadFilteredVitalSigns();
    }
  }, [vitalSigns, selectedResident, selectedDate, residents]);

  const totalPages = Math.ceil(filteredVitalSigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVitalSigns = filteredVitalSigns.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedResident, selectedDate]);

  const convertDateToISO = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const convertDateToDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return formatDateDDMMYYYY(date);
  };

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

  const totalResidents = residents.length;
  const totalVitalSigns = vitalSigns.length;
  const todayVitalSigns = vitalSigns.filter(vs => {
    const today = new Date().toISOString().split('T')[0];
    const vsDate = new Date(vs.date_time || vs.date).toISOString().split('T')[0];
    return vsDate === today;
  }).length;

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-white via-white to-red-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="group p-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                  title="Quay lại"
                >
                  <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                </button>
                
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <HeartIconSolid className="w-7 h-7 text-white" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 mb-2 tracking-tight">
                    Chỉ Số Sức Khỏe
                  </h1>
                  <p className="text-base text-slate-600 font-semibold flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-red-500" />
                    Theo dõi và quản lý chỉ số sức khỏe của người cao tuổi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 px-6 py-4 rounded-xl border border-red-200/50 shadow-md">
                  <div className="text-center">
                    <div className="text-xs text-red-600 font-bold mb-1 uppercase tracking-wide">
                      Tổng chỉ số
                    </div>
                    <div className="text-2xl font-black text-red-700 mb-1">
                      {filteredVitalSigns.length}
                    </div>
                    <div className="text-xs text-red-600 font-semibold">
                      bản ghi
                    </div>
                    {totalPages > 1 && (
                      <div className="text-xs text-red-500 mt-1 font-medium">
                        Trang {currentPage}/{totalPages}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Filter Section */}
          <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-red-700 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                Tìm kiếm và lọc
              </h2>
              <p className="text-sm text-slate-600 font-medium">Lọc chỉ số sức khỏe theo người cao tuổi và ngày</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Lọc theo người cao tuổi
                </label>
                <div className="relative group">
                  <select
                    value={selectedResident || ''}
                    onChange={(e) => setSelectedResident(e.target.value || null)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-md hover:shadow-lg font-medium text-slate-700 group-hover:border-red-300 appearance-none"
                  >
                    <option value="">Tất cả người cao tuổi</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Phòng {resident.roomNumber}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Lọc theo ngày
                </label>
                <div className="relative date-picker-container group">
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

                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={selectedDateDisplay}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedDateDisplay(value);

                      if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                        setSelectedDate(convertDateToISO(value));
                      } else {
                        setSelectedDate('');
                      }
                    }}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-md hover:shadow-lg font-medium text-slate-700 pr-10 relative group-hover:border-red-300"
                    style={{ zIndex: 0 }}
                  />

                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-red-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                    <HeartIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-red-700 mb-1">
                      Danh sách chỉ số sức khỏe
                    </h2>
                    <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                    </p>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 px-3 py-2 rounded-lg border border-red-200/50 shadow-sm">
                    <p className="text-red-700 font-bold text-sm">
                      Trang {currentPage} / {totalPages}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {filteredVitalSigns.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-red-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <HeartIcon className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-3">
                  Chưa có chỉ số sức khỏe nào
                </h3>
                <p className="text-slate-500 leading-relaxed max-w-md mx-auto text-sm">
                  Thêm chỉ số sức khỏe đầu tiên để theo dõi sức khỏe người cao tuổi một cách hiệu quả
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-red-600 via-pink-600 to-rose-600">
                        <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[200px]">
                          Người cao tuổi
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          Ngày giờ
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                          Huyết áp
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[90px]">
                          Nhịp tim
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[90px]">
                          Nhiệt độ
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[80px]">
                          SpO2
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[110px]">
                          Nhịp thở
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[90px]">
                          Cân nặng
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVitalSigns.map((vs, index) => (
                        <tr
                          key={vs.id}
                          className={`border-b border-slate-200/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-pink-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                            }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md bg-gradient-to-br from-red-100 to-pink-100">
                                <img
                                  src={vs.residentAvatar ? userAPI.getAvatarUrl(vs.residentAvatar) : '/default-avatar.svg'}
                                  alt={ensureString(vs.residentName)}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-avatar.svg';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-800 truncate text-sm">
                                  {ensureString(vs.residentName)}
                                </div>
                                <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  Phòng: {roomNumbers[vs.residentId] || 'Chưa phân phòng'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-700 whitespace-nowrap">
                            <div className="font-bold text-slate-800 text-sm">{vs.date || 'Invalid Date'}</div>
                            <div className="text-slate-500 text-xs flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {vs.time || ''}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className="text-red-700 font-bold px-3 py-1 bg-gradient-to-r from-red-100 to-red-200 rounded-lg border border-red-300 whitespace-nowrap text-xs shadow-sm">
                              {vs.bloodPressure}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className="text-green-700 font-bold px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 rounded-lg border border-green-300 whitespace-nowrap text-xs shadow-sm">
                              {vs.heartRate} bpm
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className="text-orange-700 font-bold px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg border border-orange-300 whitespace-nowrap text-xs shadow-sm">
                              {vs.temperature}°C
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className="text-blue-700 font-bold px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg border border-blue-300 whitespace-nowrap text-xs shadow-sm">
                              {vs.oxygenSaturation}%
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm">
                            {vs.respiratoryRate ? (
                              <span className="text-purple-700 font-bold px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg border border-purple-300 whitespace-nowrap text-xs shadow-sm">
                                {vs.respiratoryRate} lần/phút
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-xs whitespace-nowrap px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-300">
                                Chưa ghi nhận
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            {vs.weight ? (
                              <span className="text-emerald-700 font-bold px-3 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg border border-emerald-300 whitespace-nowrap text-xs shadow-sm">
                                {vs.weight} kg
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-xs whitespace-nowrap px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-300">
                                Chưa ghi nhận
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            {vs.notes ? (
                              <span className="text-slate-700 font-medium text-xs bg-gradient-to-r from-slate-100 to-slate-200 px-2 py-1 rounded-lg border border-slate-300">
                                {vs.notes}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-xs">
                                Không có ghi chú
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-red-50/30">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600 font-medium">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border-2 border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((page, index) => (
                            <button
                              key={index}
                              onClick={() => typeof page === 'number' && setCurrentPage(page)}
                              disabled={page === '...'}
                              className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md ${page === currentPage
                                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md'
                                  : page === '...'
                                    ? 'text-slate-400 cursor-default'
                                    : 'bg-white text-slate-700 border-2 border-slate-300 hover:bg-red-50 hover:border-red-300'
                                }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border-2 border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
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

      <div className="fixed top-6 right-8 z-50">
        

        
      </div>
    </>
  );
} 