"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  PlusIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDateDDMMYYYYWithTimezone, formatTimeWithTimezone, getDateYYYYMMDDWithTimezone, formatDateDDMMYYYY } from '@/lib/utils/validation';
import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI, userAPI, bedAssignmentsAPI } from '@/lib/api';

// Helper function to check if bed assignment is active
const isBedAssignmentActive = (assignment) => {
  if (!assignment) return false;
  if (!assignment.unassigned_date) return true; // null = active
  const unassignedDate = new Date(assignment.unassigned_date);
  const now = new Date();
  return unassignedDate > now; // ngày trong tương lai = active
};

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

const ITEMS_PER_PAGE = 10;

export default function StaffVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateDisplay, setSelectedDateDisplay] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const myAssignmentsData = await staffAssignmentsAPI.getMyAssignments();
        console.log('Staff assignments response (vital signs):', myAssignmentsData);
        const myAssignments = Array.isArray(myAssignmentsData) ? myAssignmentsData : [];
        
        const isAssignmentActive = (a: any) => {
          if (!a) return false;
          if (a.status && String(a.status).toLowerCase() === 'expired') return false;
          if (!a.end_date) return true;
          const end = new Date(a.end_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return end >= today;
        };

        // If no assignments, show empty state
        if (myAssignments.length === 0) {
          console.log('No assignments found (vital signs)');
          setResidents([]);
          setRoomNumbers({});
          return;
        }

        const isRoomBased = myAssignments.some((a: any) => a && (a.room_id || a.residents));
        console.log('Is room based (vital signs):', isRoomBased, 'Assignments:', myAssignments);
        let residentRows: any[] = [];

        if (isRoomBased) {
          const activeRoomAssignments = myAssignments.filter((a: any) => isAssignmentActive(a));
          console.log('Active room assignments (vital signs):', activeRoomAssignments);
          for (const assignment of activeRoomAssignments) {
            const room = assignment.room_id;
            const roomId = typeof room === 'object' ? (room?._id || room?.id) : room;
            let residentsList: any[] = Array.isArray(assignment.residents) ? assignment.residents : [];
            console.log('Assignment room:', room, 'Residents from assignment:', residentsList);
            
            if ((!residentsList || residentsList.length === 0) && roomId) {
              try {
                const bedAssignments = await bedAssignmentsAPI.getAll();
                if (Array.isArray(bedAssignments)) {
                  residentsList = bedAssignments
                    .filter((ba: any) => isBedAssignmentActive(ba) && ba.bed_id && (ba.bed_id.room_id?._id || ba.bed_id.room_id) === roomId)
                    .map((ba: any) => ba.resident_id)
                    .filter(Boolean);
                  console.log('Found residents for room', roomId, ':', residentsList);
                }
              } catch (error) {
                console.error('Error fetching bed assignments:', error);
              }
            }
            for (const res of residentsList) {
              residentRows.push({ id: res?._id, name: res?.full_name || '', avatar: Array.isArray(res?.avatar) ? res.avatar[0] : res?.avatar || null, roomId });
            }
          }

          const enriched = await Promise.all(residentRows.map(async (r) => {
            try {
              const detail = await residentAPI.getById(r.id);
              return { ...r, name: detail?.full_name || r.name, avatar: detail?.avatar ? (Array.isArray(detail.avatar) ? detail.avatar[0] : detail.avatar) : r.avatar };
            } catch { return r; }
          }));

          const uniqueRoomIds = Array.from(new Set(enriched.map(r => r.roomId).filter(Boolean)));
          const fetchedRooms = await Promise.all(uniqueRoomIds.map(async (rid) => {
            try { return [rid, await roomsAPI.getById(rid)] as const; } catch { return [rid, null] as const; }
          }));
          const ridToNumber: {[rid: string]: string} = {};
          fetchedRooms.forEach(([rid, room]) => { if (room?.room_number) ridToNumber[rid as any] = room.room_number; });

          const finalResidents = enriched.map(r => ({
            id: r.id,
            name: r.name,
            avatar: r.avatar,
            roomNumber: ridToNumber[r.roomId] || 'Chưa hoàn tất đăng kí',
            hasRoom: !!ridToNumber[r.roomId]
          }));

          console.log('Final residents (room-based):', finalResidents);
          const validResidents = finalResidents.filter(r => r.hasRoom);
          console.log('Valid residents (room-based):', validResidents);
          
          if (validResidents.length === 0) {
            console.log('No residents found in any assigned rooms (vital signs)');
            setResidents([]);
            setRoomNumbers({});
            return;
          }
          
          setResidents(validResidents);
          const roomNumbersMap: {[residentId: string]: string} = {};
          validResidents.forEach((resident: any) => { roomNumbersMap[resident.id] = resident.roomNumber; });
          setRoomNumbers(roomNumbersMap);
        } else {
          console.log('Using backward compatibility mode (vital signs)');
          const activeAssignments = myAssignments.filter((assignment: any) => isAssignmentActive(assignment));
          console.log('Active assignments (backward compatibility):', activeAssignments);
        const assignedResidents = await Promise.all(
          activeAssignments.map(async (assignment: any) => {
            let residentIdToFetch = assignment.resident_id;
            if (assignment.resident_id && typeof assignment.resident_id === 'object' && assignment.resident_id._id) {
              residentIdToFetch = assignment.resident_id._id;
            }
              if (!residentIdToFetch) return null;
            try {
              const resident = await residentAPI.getById(residentIdToFetch);
              let roomNumber = 'Chưa hoàn tất đăng kí';
              try {
                const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident._id);
                const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
                const roomId = bedAssignment?.bed_id?.room_id || bedAssignment?.assigned_room_id;
                const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                if (roomIdString) {
                  const room = await roomsAPI.getById(roomIdString);
                  roomNumber = room?.room_number || 'Chưa hoàn tất đăng kí';
                }
                } catch {}
              return {
                id: resident._id,
                name: resident.full_name || '',
                avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
                  roomNumber,
                hasRoom: roomNumber !== 'Chưa hoàn tất đăng kí'
              };
              } catch {
              if (assignment.resident_id && typeof assignment.resident_id === 'object') {
                return {
                  id: assignment.resident_id._id || assignment.resident_id,
                  name: assignment.resident_id.full_name || '',
                  avatar: Array.isArray(assignment.resident_id.avatar) ? assignment.resident_id.avatar[0] : assignment.resident_id.avatar || null,
                  roomNumber: 'Chưa hoàn tất đăng kí',
                  hasRoom: false
                };
              }
              return null;
            }
          })
        );
          console.log('Assigned residents (backward compatibility):', assignedResidents);
          const validResidents = (assignedResidents || []).filter((resident: any) => resident && resident.hasRoom);
          console.log('Valid residents (backward compatibility):', validResidents);
          
          if (validResidents.length === 0) {
            console.log('No residents found in backward compatibility mode (vital signs)');
            setResidents([]);
            setRoomNumbers({});
            return;
          }
          
        setResidents(validResidents);
        const roomNumbersMap: {[residentId: string]: string} = {};
          validResidents.forEach((resident: any) => { roomNumbersMap[resident.id] = resident.roomNumber; });
        setRoomNumbers(roomNumbersMap);
        }
        
      } catch (err) {
        setResidents([]);
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
        const assignedResidentIds = residents.map(resident => resident.id);
        
        if (assignedResidentIds.length === 0) {
          setVitalSigns([]);
          return;
        }
        
        const allVitalSigns = await Promise.all(
          assignedResidentIds.map(async (residentId) => {
            try {
              const data = await vitalSignsAPI.getByResidentId(residentId);
              return Array.isArray(data) ? data : [];
            } catch (err) {
              return [];
            }
          })
        );
        
        const vitalSignsData = allVitalSigns.flat();
        setVitalSigns(vitalSignsData);
      } catch (err) {
        setVitalSigns([]);
      }
    };
    
    if (user && residents.length > 0) {
      fetchVitalSigns();
    } else if (user && residents.length === 0) {
      setVitalSigns([]);
    }
  }, [user, residents]);

  const transformVitalSignsForDisplay = (vitalSignsData: any[]) => {
    return vitalSignsData.map(vs => {
      const resident = residents.find(r => {
        const match = String(r.id) === String(vs.resident_id);
        return match;
      });
      
      const dateTime = vs.date_time || vs.date;
      
      return {
        id: vs._id,
        residentId: vs.resident_id,
        residentName: resident?.name || `Người cao tuổi không tồn tại (ID: ${vs.resident_id})`,
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
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.date_time || a.date);
      const dateB = new Date(b.date_time || b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return transformVitalSignsForDisplay(filtered);
  };

  const filteredVitalSigns = getFilteredVitalSigns(selectedResident || undefined, selectedDate || undefined);
  


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
    
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const adjustedDate = new Date(localDate.getTime() + 7 * 60 * 60 * 1000);
    
    const isoDate = adjustedDate.toISOString().split('T')[0];
    
    return isoDate;
  };

  const convertDateToDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    
    const formattedDate = formatDateDDMMYYYY(date);
    
    return formattedDate;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return isSameDay(date, selected);
  };

  const handleDateSelect = (day: number) => {
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    const localDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
    
    const adjustedDate = new Date(localDate.getTime() + 7 * 60 * 60 * 1000);
    const isoDate = adjustedDate.toISOString().split('T')[0];
    
    setSelectedDate(isoDate);
    setSelectedDateDisplay(formatDateDDMMYYYY(localDate));
    setShowDatePicker(false);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);


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
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4">
                  <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại trang trước"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 flex items-center justify-center shadow-lg">
                    <HeartIconSolid className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-2">
                      Theo Dõi Các Chỉ Số Sức Khỏe
                    </h1>
                                         <p className="text-gray-500">
                       Xem và quản lý chỉ số sức khỏe của các người cao tuổi được phân công
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
                    ? 'Bạn chưa được phân công quản lý người cao tuổi nào' 
                    : 'Thêm chỉ số sức khỏe mới'
                  }
                >
                  <PlusIcon className="w-5 h-5" />
                  Thêm chỉ số
                </button>
              </div>
            </div>
          </div>

         
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              
              {(selectedResident || selectedDate) && (
                <button
                  onClick={() => {
                    setSelectedResident(null);
                    setSelectedDate('');
                    setSelectedDateDisplay('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
             
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
                  <option value="">Tất cả người cao tuổi được phân công</option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} - Phòng {roomNumbers[resident.id] || 'Chưa hoàn tất đăng kí'}
                    </option>
                  ))}
                </select>
                {residents.length === 0 && user?.role === 'staff' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-400 rounded-xl text-sm text-yellow-800 shadow-sm">
                    ⚠️ Bạn chưa được phân công quản lý người cao tuổi nào. Vui lòng liên hệ admin để được phân công.
                  </div>
                )}
                {residents.length === 0 && user?.role === 'admin' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-400 rounded-xl text-sm text-blue-800 shadow-sm">
                    ℹ️ Chưa có người cao tuổi nào trong hệ thống.
                  </div>
                )}
              </div>

             
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                  Lọc theo ngày
                </label>
                <div className="relative date-picker-container">
                  <input
                    type="text"
                    value={selectedDateDisplay}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedDateDisplay(value);
                      
                     
                      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                      if (dateRegex.test(value)) {
                        const isoDate = convertDateToISO(value);
                        setSelectedDate(isoDate);
                      }
                    }}
                    onFocus={() => setShowDatePicker(true)}
                    placeholder="dd/mm/yyyy"
                    className="w-full p-4 border border-gray-300 rounded-xl text-sm outline-none bg-white transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                 
                  {showDatePicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 p-4 min-w-[280px]">
                     
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={prevMonth}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={nextMonth}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                     
                      <div className="grid grid-cols-7 gap-1">
                      
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                          <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                        
                        {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                          <div key={`empty-${i}`} className="w-8 h-8"></div>
                        ))}
                        
                        {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                          
                          return (
                            <button
                              key={day}
                              onClick={() => handleDateSelect(day)}
                              className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors ${
                                isSelectedDate(date)
                                  ? 'bg-red-500 text-white font-semibold'
                                  : isToday(date)
                                  ? 'bg-red-100 text-red-600 font-semibold'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                     
                      <div className="mt-3 pt-3 border-t border-gray-200">
                                                  <button
                            onClick={() => {
                              const today = new Date();
                              
                              const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                              
                              const adjustedToday = new Date(localToday.getTime() + 7 * 60 * 60 * 1000);
                              const isoDate = adjustedToday.toISOString().split('T')[0];
                              
                              setSelectedDate(isoDate);
                              setSelectedDateDisplay(formatDateDDMMYYYY(localToday));
                              setCurrentMonth(localToday);
                              setShowDatePicker(false);
                            }}
                          className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Hôm nay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
               
              </div>
            </div>
          </div>

                  
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
                  {residents.length === 0 ? 'Chưa có người cao tuổi nào được phân công' : 'Chưa có chỉ số sức khỏe nào'}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {residents.length === 0 
                    
                ? 'Bạn chưa được phân công chăm sóc người cao tuổi nào. Vui lòng liên hệ admin để được phân công.'
                    : 'Thêm chỉ số sức khỏe đầu tiên để theo dõi sức khỏe người cao tuổi được phân công'
                  }
                </p>
                

              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1400px]">
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
                        <th className="px-3 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider min-w-[180px]">
                          Thao tác
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
                                {(() => {
                                  const text = String(vs.notes);
                                  const tooLong = text.length > 120;
                                  const isExpanded = !!expandedNotes[vs.id];
                                  const display = isExpanded || !tooLong ? text : text.slice(0, 120) + '...';
                                  return (
                                    <>
                                      <span>{display}</span>
                                      {tooLong && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedNotes(prev => ({ ...prev, [vs.id]: !isExpanded }))}
                                          className="ml-1 text-[11px] text-red-600 hover:text-red-700 underline underline-offset-2"
                                        >
                                          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-xs">
                                Không có ghi chú
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/staff/vital-signs/${vs.id}/edit`)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Chỉnh sửa chỉ số sức khỏe"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVitalSigns.length)} trong tổng số {filteredVitalSigns.length} bản ghi
                      </div>
                      
                      <div className="flex items-center gap-2">
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>

                        
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
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-11/12 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-100 rounded-full p-3 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-800 m-0">
                Xác nhận xóa
              </h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa chỉ số sức khỏe này?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                  <p className="text-red-700 text-sm font-medium">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                  <p className="text-red-700 text-sm font-medium">
                    Dữ liệu sẽ bị xóa vĩnh viễn
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="px-6 py-3 bg-gray-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-gray-600"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  if (deleteTarget) {
                    try {
                      await vitalSignsAPI.delete(deleteTarget);
                      setShowDeleteModal(false);
                      setDeleteTarget(null);
                      window.location.reload();
                    } catch (error) {
                      alert('Có lỗi xảy ra khi xóa chỉ số sức khỏe');
                    }
                  }
                }}
                className="px-6 py-3 bg-red-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 