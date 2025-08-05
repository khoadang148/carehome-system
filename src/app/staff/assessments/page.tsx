"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { staffAssignmentsAPI, careNotesAPI, carePlansAPI, roomsAPI, userAPI } from '@/lib/api';
import { 
  HeartIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';

interface Resident {
  id: number | string;
  full_name: string;
  room_number: string;
  age: number | string;
  careLevel: string;
  lastNote?: string;
  notesCount?: number;
  date_of_birth?: string;
  avatar?: string;
}

export default function CareNotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [careNotesMap, setCareNotesMap] = useState<Record<string, any[]>>({});
  
  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [residentsPerPage] = useState(5); // Hiển thị 5 cư dân mỗi trang

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // setNotification({ message, type }); // This state was removed
    // setTimeout(() => setNotification(null), 2000); // This state was removed
  };

  useEffect(() => {
    if (!user || user.role !== 'staff') {
      router.push('/');
      return;
    }
    loadResidents();
  }, [user, router]);

  useEffect(() => {
    const filtered = residents.filter(resident =>
      (resident.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resident.room_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResidents(filtered);
    // Reset về trang đầu tiên khi tìm kiếm
    setCurrentPage(1);
  }, [residents, searchTerm]);

  const loadResidents = async () => {
    try {
      // Lấy danh sách assignments của staff đang đăng nhập
      const assignmentsData = await staffAssignmentsAPI.getMyAssignments();
      const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];
      
      // Debug: Log assignments data
      console.log('Raw assignments data for assessments:', assignmentsData);
      
      // Chỉ lấy những assignment có trạng thái active
      const activeAssignments = assignments.filter((assignment: any) => assignment.status === 'active');
      console.log('Active assignments:', activeAssignments);
      
      const residentsWithNotes = await Promise.all(activeAssignments.map(async (assignment: any) => {
        const resident = assignment.resident_id;
        
        let age = '';
        if (resident.date_of_birth) {
          const dob = new Date(resident.date_of_birth);
          const now = new Date();
          age = (now.getFullYear() - dob.getFullYear()).toString();
          const m = now.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
            age = (parseInt(age) - 1).toString();
          }
        }
        
        // Lấy số phòng từ assignment data
        let room_number = '';
        if (resident.room_number) {
          room_number = resident.room_number;
        } else {
          // Fallback: lấy từ care plan assignments
          try {
            const carePlanAssignments = await carePlansAPI.getByResidentId(resident._id);
            const carePlanAssignment = Array.isArray(carePlanAssignments) ? 
              carePlanAssignments.find((a: any) => a.assigned_room_id) : null;
            
            if (carePlanAssignment?.assigned_room_id) {
              const roomId = carePlanAssignment.assigned_room_id;
              // Đảm bảo roomId là string, không phải object
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              if (roomIdString) {
                const room = await roomsAPI.getById(roomIdString);
                room_number = room?.room_number || '';
              }
            }
        } catch {}
        }
        
        return {
          id: resident._id || resident.id,
          full_name: resident.full_name || resident.name || resident.fullName || '',
          room_number,
          age: age || '',
          careLevel: resident.care_level || resident.careLevel || '',
          date_of_birth: resident.date_of_birth || resident.dateOfBirth || '',
          avatar: resident.avatar || '',
        };
      }));
      
      setResidents(residentsWithNotes);
      
      // Load care notes cho từng resident song song
      const notesMap: Record<string, any[]> = {};
      await Promise.all(residentsWithNotes.map(async (resident) => {
        try {
          const notes = await careNotesAPI.getAll({ resident_id: resident.id });
          notesMap[resident.id] = Array.isArray(notes) ? notes : [];
        } catch {
          notesMap[resident.id] = [];
        }
      }));
      setCareNotesMap(notesMap);
    } catch (error) {
      setResidents([]);
      setCareNotesMap({});
      console.error('Error loading residents:', error);
    }
  };

  const handleShowNotes = (residentId: string) => {
    const resident = residents.find(r => String(r.id) === residentId);
    const residentName = resident?.full_name || '';
    router.push(`/staff/assessments/${residentId}/notes?residentName=${encodeURIComponent(residentName)}`);
  };

  const handleCloseModal = () => {
    // This function is no longer needed as modal state is removed
  };

  const handleCreateCareNote = (resident: Resident) => {
    router.push(`/staff/assessments/new?residentId=${resident.id}&residentName=${encodeURIComponent(resident.full_name)}`);
  };

  if (!user || user.role !== 'staff') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold m-0 text-slate-800">
                Nhật ký theo dõi
              </h1>
              <p className="text-base text-slate-600 mt-1">
                Ghi chú quan sát và chăm sóc hàng ngày cho {residents.length} cư dân đang được phân công
              </p>
            </div>
          </div>

          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm người cao tuổi theo tên hoặc phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Tính toán phân trang */}
          {(() => {
            const totalPages = Math.ceil(filteredResidents.length / residentsPerPage);
            const startIndex = (currentPage - 1) * residentsPerPage;
            const endIndex = startIndex + residentsPerPage;
            const currentResidents = filteredResidents.slice(startIndex, endIndex);
            
            return (
              <>
                {/* Hiển thị thông tin phân trang */}
                {filteredResidents.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-700 mb-6 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold shadow-sm">
                        Hiển thị <span className="text-blue-600">{startIndex + 1}-{Math.min(endIndex, filteredResidents.length)}</span>
                      </span>
                      <span className="text-gray-400">/</span>
                      <span>
                        Tổng số <span className="font-semibold text-blue-600">{filteredResidents.length}</span> cư dân
                      </span>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-medium shadow-sm">
                          Trang <span className="font-bold">{currentPage}</span> / {totalPages}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Danh sách cư dân */}
                {currentResidents.length > 0 ? (
                  currentResidents.map((resident) => {
            const notes = careNotesMap[resident.id] || [];
            const lastNote = notes[0]?.notes || 'Chưa có ghi chú';
            const notesCount = notes.length;
            return (
            <div
              key={resident.id}
                      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-md border border-white/20 transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-4">
                {/* Avatar */}
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
                  <img
                    src={resident.avatar ? userAPI.getAvatarUrl(resident.avatar) : ''}
                    alt={`Avatar của ${resident.full_name}`}
                            className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                  <UserIcon 
                            className="w-4 h-4 text-gray-400 hidden"
                  />
                </div>
                        <div className="text-sm text-slate-800 flex items-center gap-2 flex-wrap">
                          <span><span className="text-blue-600 font-medium">Họ và tên:</span> <span className="font-semibold">{resident.full_name}</span></span>
                          <span className="text-gray-300">|</span>
                          <span><span className="text-blue-600 font-medium">Phòng:</span> {resident.room_number}</span>
                  {resident.date_of_birth && (
                    (() => {
                      const dob = new Date(resident.date_of_birth);
                      const now = new Date();
                      let age = now.getFullYear() - dob.getFullYear();
                      const m = now.getMonth() - dob.getMonth();
                      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
                        age--;
                      }
                      const day = dob.getDate().toString().padStart(2, '0');
                      const month = (dob.getMonth() + 1).toString().padStart(2, '0');
                      const year = dob.getFullYear();
                      return (
                        <>
                                  <span className="text-gray-300">|</span>
                          <span>
                                    <span className="text-blue-600 font-medium">Ngày sinh:</span> {`${day}/${month}/${year}`} ({age} tuổi)
                          </span>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>

                      <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-blue-600 font-medium">Ghi chú gần nhất:</span>
                        <span className="text-sm text-slate-600">{lastNote}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-blue-600 font-medium">Tổng ghi chú:</span>
                        <span className="text-sm text-blue-600 font-bold">{notesCount}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowNotes(String(resident.id))}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-blue-700 hover:to-blue-600"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          Xem ghi chú
                        </button>
                        <button
                          onClick={() => handleCreateCareNote(resident)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Thêm ghi chú mới
                        </button>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-2">
                      {searchTerm ? 'Không tìm thấy cư dân nào phù hợp' : 'Chưa có cư dân nào được phân công'}
              </div>
                    <div className="text-gray-400 text-sm">
                      {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng liên hệ quản lý để được phân công'}
            </div>
          </div>
        )}

                {/* Điều khiển phân trang */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Trước
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                </button>
          </div>
        )}
              </>
            );
          })()}
        </div>

        {/* Modal xem ghi chú */}
        {/* This section was removed as modal state is removed */}

        {/* Modal sửa ghi chú */}
        {/* This section was removed as modal state is removed */}
      </div>

      {/* Notification */}
      {/* This section was removed as notification state is removed */}

      {/* Confirm Delete Modal */}
      {/* This section was removed as confirmDelete state is removed */}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
} 
