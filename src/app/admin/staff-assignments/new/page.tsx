"use client";

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { getAvatarUrlWithFallback } from '@/lib/utils/avatarUtils';
import { userAPI, roomsAPI, residentAPI, staffAssignmentsAPI, bedAssignmentsAPI } from '@/lib/api';

export default function NewStaffAssignmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Local states thay cho Redux
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  const [roomResidents, setRoomResidents] = useState<{ [roomId: string]: any[] }>({});
  const [loadingRoomResidents, setLoadingRoomResidents] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    staff_id: '',
    room_id: '',
    end_date: '',
    notes: '',
    responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'] as string[],
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showResidentsModal, setShowResidentsModal] = useState(false);
  const [selectedRoomForResidents, setSelectedRoomForResidents] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

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

  // SWR data fetching for fast, cached loads
  const enableFetch = Boolean(user && user.role === 'admin');
  const { data: swrStaff, isLoading: swrStaffLoading } = useSWR(enableFetch ? 'staff:getByRoleWithStatus' : null, () => userAPI.getByRoleWithStatus('staff'), { revalidateOnFocus: false });
  const { data: swrRooms, isLoading: swrRoomsLoading } = useSWR(enableFetch ? 'rooms:getAll' : null, () => roomsAPI.getAll(), { revalidateOnFocus: false });
  const { data: swrResidents, isLoading: swrResidentsLoading } = useSWR(enableFetch ? 'residents:getAll' : null, () => residentAPI.getAll(), { revalidateOnFocus: false });
  const { data: swrAssignments, isLoading: swrAssignmentsLoading } = useSWR(enableFetch ? 'staffAssignments:getAll' : null, () => staffAssignmentsAPI.getAll(), { revalidateOnFocus: false });
  const { data: swrBedAssignments } = useSWR(enableFetch ? 'bedAssignments:getAll' : null, () => bedAssignmentsAPI.getAll(), { revalidateOnFocus: false });

  // Sync SWR data into existing local states to minimize code churn
  useEffect(() => {
    setStaffLoading(Boolean(enableFetch && swrStaffLoading));
    if (Array.isArray(swrStaff)) setStaffList(swrStaff);
  }, [enableFetch, swrStaff, swrStaffLoading]);

  useEffect(() => {
    setRoomsLoading(Boolean(enableFetch && swrRoomsLoading));
    if (Array.isArray(swrRooms)) setRooms(swrRooms as any[]);
  }, [enableFetch, swrRooms, swrRoomsLoading]);

  useEffect(() => {
    setResidentsLoading(Boolean(enableFetch && swrResidentsLoading));
    if (Array.isArray(swrResidents)) setResidents(swrResidents as any[]);
  }, [enableFetch, swrResidents, swrResidentsLoading]);

  useEffect(() => {
    setAssignmentsLoading(Boolean(enableFetch && swrAssignmentsLoading));
    if (Array.isArray(swrAssignments)) setAssignments(swrAssignments as any[]);
  }, [enableFetch, swrAssignments, swrAssignmentsLoading]);

  // Load room residents when rooms data is available (do not block on residents)
  useEffect(() => {
    if (rooms.length > 0) {
      loadRoomResidents();
    }
  }, [rooms, residents]);

  const loadRoomResidents = async () => {
    setLoadingRoomResidents(true);
    const roomResidentsMap: { [roomId: string]: any[] } = {};

    try {
      // Initialize room residents map
      rooms.forEach(room => {
        roomResidentsMap[room._id] = [];
      });

      // Get bed assignments to determine which residents are in which rooms (prefer SWR cache)
      const bedAssignments = Array.isArray(swrBedAssignments)
        ? swrBedAssignments
        : await bedAssignmentsAPI.getAll();
      console.log('Bed assignments:', bedAssignments);
      console.log('Residents:', residents);
      console.log('Rooms:', rooms);
      
      if (Array.isArray(bedAssignments)) {
        // Cache to avoid refetching the same resident repeatedly
        const residentStatusCache: Record<string, string> = {};

        // Group residents by room based on active bed assignments (mirror room management page behavior)
        for (const assignment of bedAssignments) {
          console.log('Processing assignment:', assignment);
          // Only consider active assignments (no unassigned_date)
          if (assignment && assignment.resident_id && assignment.bed_id && !assignment.unassigned_date) {
            const roomId = assignment.bed_id.room_id?._id || assignment.bed_id.room_id;

            // Prefer full resident object from residents list; fallback to populated resident on assignment
            const residentIdStr = (assignment.resident_id as any)?._id || assignment.resident_id;
            const residentFromList = residents.find(r => r._id === residentIdStr);
            const resident = residentFromList || assignment.resident_id;

            let status = String(
              (residentFromList as any)?.status ??
              (residentFromList as any)?.resident_status ??
              (assignment.resident_id as any)?.status ??
              (assignment.resident_id as any)?.resident_status ??
              ''
            ).toLowerCase();

            // Fallback: fetch latest status if missing/not admitted and not cached
            if (roomId && resident && status !== 'admitted') {
              try {
                if (!residentStatusCache[residentIdStr]) {
                  const latest = await (residentAPI as any).getById?.(residentIdStr);
                  residentStatusCache[residentIdStr] = String(latest?.status || latest?.resident_status || '').toLowerCase();
                }
                status = residentStatusCache[residentIdStr] || status;
              } catch {}
            }

            console.log('Resolved resident:', resident, 'Final Status:', status, 'Room ID:', roomId);

            // Only include rooms that have at least one resident with status 'admitted'
            if (roomId && resident && status === 'admitted') {
              // Avoid duplicates per room
              const existingResident = roomResidentsMap[roomId]?.find(r => r._id === resident._id);
              if (!existingResident) {
                if (!roomResidentsMap[roomId]) {
                  roomResidentsMap[roomId] = [];
                }
                roomResidentsMap[roomId].push(resident);
              }
            }
          }
        }
      }

      console.log('Final room residents map:', roomResidentsMap);
      setRoomResidents(roomResidentsMap);
    } catch (error) {
      console.error('Error loading room residents:', error);
      // Fallback: initialize empty map
      rooms.forEach(room => {
        roomResidentsMap[room._id] = [];
      });
      setRoomResidents(roomResidentsMap);
    } finally {
      setLoadingRoomResidents(false);
    }
  };

  // Helper functions thay thế Redux actions
  const createAssignment = async (data: any) => {
    setCreatingAssignment(true);
    try {
      const res = await (staffAssignmentsAPI as any).create?.(data);
      if (res) setAssignments(prev => [res, ...prev]);
    } catch (e: any) {
      toast.error(getUserFriendlyError(e?.message || 'Không thể tạo phân công'));
    } finally {
      setCreatingAssignment(false);
    }
  };

  const updateAssignment = async (id: string, data: any) => {
    try {
      const res = await (staffAssignmentsAPI as any).update?.(id, data);
      if (res) setAssignments(prev => prev.map(a => (a._id === id ? res : a)));
    } catch (e: any) {
      toast.error(getUserFriendlyError(e?.message || 'Không thể cập nhật phân công'));
    }
  };

  const handleCreate = async () => {
    setValidationErrors({});

    if (!formData.staff_id || !formData.room_id) {
      toast.error('Vui lòng chọn nhân viên và phòng');
      return;
    }

    // Only validate end date if it's provided
    if (formData.end_date && formData.end_date.trim() !== '') {
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDate < today) {
      setValidationErrors({ end_date: 'Ngày kết thúc không được ở quá khứ' });
      return;
      }
    }

    if (!formData.staff_id.match(/^[0-9a-fA-F]{24}$/)) {
      toast.error('ID nhân viên không hợp lệ');
      return;
    }

    if (!formData.room_id.match(/^[0-9a-fA-F]{24}$/)) {
      toast.error('ID phòng không hợp lệ');
      return;
    }

    // Check if there's already an active assignment for this staff and room
      const existingAssignment = assignments.find(assignment => {
      const assignmentRoomId = assignment.room_id?._id || assignment.room_id;
        const assignmentStaffId = assignment.staff_id?._id || assignment.staff_id;
      return assignmentRoomId === formData.room_id && assignmentStaffId === formData.staff_id;
      });

      // Only block if there's an active assignment (not expired)
      if (existingAssignment && existingAssignment.status === 'active') {
      const room = rooms.find(r => r._id === formData.room_id);
      toast.error(`Phòng ${room?.room_number || formData.room_id} đã được phân công cho nhân viên này rồi. Vui lòng chọn phòng khác hoặc nhân viên khác.`);
      return;
    }

          const assignmentData: any = {
            staff_id: formData.staff_id,
      room_id: formData.room_id,
            assigned_date: new Date().toISOString(),
            assigned_by: user?.id,
            responsibilities: formData.responsibilities || ['vital_signs', 'care_notes', 'activities', 'photos'],
          };

          if (formData.end_date && formData.end_date.trim() !== '') {
            const date = new Date(formData.end_date);
            if (!isNaN(date.getTime())) {
              assignmentData.end_date = date.toISOString();
            }
          }

          if (formData.notes && formData.notes.trim() !== '') {
            assignmentData.notes = formData.notes;
          }

          // If there's an existing assignment, update it instead of creating new
          if (existingAssignment) {
            // Ensure the assignment is set to active when updating
            assignmentData.status = 'active';
            await updateAssignment(existingAssignment._id, assignmentData);
          } else {
            await createAssignment(assignmentData);
          }

    // Set success data for modal
      setSuccessData({
      count: 1,
        staff: selectedStaff,
      room: selectedRoom,
      residents: roomResidents[formData.room_id] || [],
      hasExpiredUpdates: existingAssignment && (existingAssignment.status === 'expired' || isExpired(existingAssignment.end_date || '')),
    });
      
      setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Force refresh the assignments list page
    window.location.href = '/admin/staff-assignments';
  };

  const handleShowResidents = (room: any) => {
    setSelectedRoomForResidents(room);
    setShowResidentsModal(true);
  };

  const handleCloseResidentsModal = () => {
    setShowResidentsModal(false);
    setSelectedRoomForResidents(null);
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      room_id: '',
      end_date: '',
      notes: '',
      responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setValidationErrors({});
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    
    // Reset time to start of day for both dates to avoid timezone issues
    const endStartOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return endStartOfDay < nowStartOfDay;
  };

  const getAvailableRooms = () => {
    return rooms.filter(room => {
      // First check if room has residents
      const roomResidentsCount = roomResidents[room._id]?.length || 0;
      if (roomResidentsCount === 0) {
        return false; // Don't show rooms without residents
      }

      const selectedStaffId = formData.staff_id;
      if (!selectedStaffId) {
        // If no staff selected, show all rooms with residents
          return true;
      } else {
        // Check if this room is already assigned to this staff
        const specificAssignment = assignments.find(assignment => {
          if (!assignment.room_id || !assignment.staff_id) return false;
          const assignmentRoomId = assignment.room_id._id || assignment.room_id;
          const assignmentStaffId = assignment.staff_id._id || assignment.staff_id;
          return assignmentRoomId === room._id && assignmentStaffId === selectedStaffId;
        });

        if (!specificAssignment) {
          return true;
        }

        // If assignment exists but is expired, allow reassignment
        if (specificAssignment.end_date && isExpired(specificAssignment.end_date)) {
          return true;
        }

        // If assignment is active, don't show this room
        return false;
      }
    });
  };

  const hasExpiredAssignments = (roomId: string) => {
    const roomAssignments = assignments.filter(assignment => {
      if (!assignment.room_id) return false;
      const assignmentRoomId = assignment.room_id._id || assignment.room_id;
      return assignmentRoomId === roomId;
    });

    return roomAssignments.length > 0 && roomAssignments.every(assignment =>
      assignment.end_date && isExpired(assignment.end_date)
    );
  };

  const getAssignmentStatus = (roomId: string) => {
    if (!formData.staff_id) return null;

    const assignment = assignments.find(assignment => {
      if (!assignment.room_id || !assignment.staff_id) return false;
      const assignmentRoomId = assignment.room_id._id || assignment.room_id;
      const assignmentStaffId = assignment.staff_id._id || assignment.staff_id;
      return assignmentRoomId === roomId && assignmentStaffId === formData.staff_id;
    });

    if (!assignment) return null;

    if (!assignment.end_date) return 'active';
    if (isExpired(assignment.end_date)) return 'expired';
    return 'active';
  };

  const getFilteredRooms = () => {
    const availableRooms = getAvailableRooms();
    if (!searchTerm) return availableRooms;

    return availableRooms.filter(room =>
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.room_type && room.room_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const selectedStaff = staffList.find(staff => staff._id === formData.staff_id);
  const selectedRoom = rooms.find(room => room._id === formData.room_id);
  const selectedResidents = roomResidents[formData.room_id] || [];



  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateFromDisplay = (displayDate: string) => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString().split('T')[0];
  };

  const isFormValid = () => {
    if (!formData.staff_id || !formData.room_id) return false;

    // Only validate end date if it's provided
    if (formData.end_date && formData.end_date.trim() !== '') {
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate < today) return false;
    }

    return true;
  };

  const loadingData = staffLoading || residentsLoading || roomsLoading || assignmentsLoading;
  
  // Optimize loading by checking if we have minimum required data
  const hasMinimumData = staffList.length > 0 && rooms.length > 0;
  const canShowForm = hasMinimumData && !staffLoading && !roomsLoading;
  
  // Show form even if residents/assignments are still loading
  const showFormWithPartialData = hasMinimumData;
  
  // Show loading indicator for background data
  const isBackgroundLoading = residentsLoading || assignmentsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
        `,
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link
                  href="/admin/staff-assignments"
                  style={{
                    padding: '0.5rem',
                    color: '#6b7280',
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ArrowLeftIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                </Link>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <UserPlusIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em'
                  }}>
                    Tạo phân công mới
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Phân công nhân viên phụ trách theo phòng
                    {isBackgroundLoading && (
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#3b82f6',
                        fontWeight: 600
                      }}>
                        • Đang tải dữ liệu bổ sung...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={resetForm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Làm mới
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creatingAssignment || !isFormValid()}
                  style={{
                    padding: '0.75rem 2rem',
                    background: creatingAssignment || !isFormValid()
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: creatingAssignment || !isFormValid() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: creatingAssignment || !isFormValid()
                      ? 'none'
                      : '0 4px 12px rgba(59, 130, 246, 0.3)',
                    opacity: creatingAssignment || !isFormValid() ? 0.6 : 1
                  }}
                  onMouseOver={e => {
                    if (!creatingAssignment && isFormValid()) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!creatingAssignment && isFormValid()) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                >
                  {creatingAssignment ? (
                    <>
                      <div style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Tạo phân công
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!showFormWithPartialData ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {!hasMinimumData ? 'Đang tải dữ liệu cơ bản...' : 'Đang tải dữ liệu bổ sung...'}
                  </p>
                  {hasMinimumData && (
                    <p className="text-sm text-gray-500 mt-2">
                      Có thể bắt đầu sử dụng form ngay bây giờ
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <UserPlusIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      Thông tin phân công
                    </h2>

                    <div className="space-y-8">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nhân viên phụ trách <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.staff_id}
                          onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200 text-lg"
                        >
                          <option value="">Chọn nhân viên</option>
                          {staffList.length > 0 ? (
                            staffList.map((staff) => (
                              <option key={staff._id} value={staff._id}>
                                {staff.full_name} - {staff.email}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>Không có nhân viên đang làm việc</option>
                          )}
                        </select>
                        {staffList.length === 0 && (
                          <p className="text-sm text-orange-600 mt-2 flex items-center">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                            Không có nhân viên nào đang làm việc để phân công
                          </p>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Phòng được phân công <span className="text-red-500">*</span>
                        </label>

                        <div className="mb-4">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Tìm kiếm phòng theo số phòng..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-all duration-200 text-lg"
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <XMarkIcon className="h-6 w-6" />
                              </button>
                            )}
                          </div>
                          {searchTerm && (
                            <p className="text-sm text-gray-500 mt-2 flex items-center">
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Tìm thấy {getFilteredRooms().length} phòng phù hợp
                            </p>
                          )}
                        </div>

                        <div className="border-2 border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto bg-white shadow-inner">
                          {loadingRoomResidents || residentsLoading ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Đang tải thông tin người cao tuổi...</p>
                              </div>
                            </div>
                          ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {getFilteredRooms().map((room) => {
                                const isSelected = formData.room_id === room._id;
                                const roomResidentsCount = roomResidents[room._id]?.length || 0;
                              return (
                                <div
                                    key={room._id}
                                  onClick={() => {
                                    // Only block if there's an active assignment (not expired)
                                      if (formData.staff_id && getAssignmentStatus(room._id) === 'active') {
                                        toast.error(`Phòng ${room.room_number} đã được phân công cho nhân viên này rồi. Vui lòng chọn phòng khác hoặc nhân viên khác.`);
                                      return;
                                    }

                                      // Allow selection for rooms with expired assignments or no assignments
                                      setFormData({
                                        ...formData,
                                        room_id: isSelected ? '' : room._id
                                      });
                                  }}
                                  className={`
                                p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]
                                ${isSelected
                                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg ring-4 ring-green-100'
                                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
                                    }
                              `}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-200
                                    ${isSelected
                                          ? 'border-green-500 bg-green-500 shadow-md'
                                          : 'border-gray-300 bg-white'
                                        }
                                  `}>
                                        {isSelected && (
                                          <CheckIcon className="w-4 h-4 text-white" />
                                        )}
                                      </div>
                                      <div>
                                        <p className={`font-semibold text-lg ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                            Phòng {room.room_number}
                                          </p>
                                          <p className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                                            • {roomResidentsCount} người cao tuổi
                                          </p>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleShowResidents(room);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 transition-colors"
                                          >
                                            Xem danh sách người cao tuổi
                                          </button>

                                          {formData.staff_id && getAssignmentStatus(room._id) === 'active' && (
                                          <p className="text-xs text-red-600 font-medium mt-1">
                                            ⚠️ Đã được phân công cho nhân viên này
                                          </p>
                                        )}
                                          {formData.staff_id && getAssignmentStatus(room._id) === 'expired' && (
                                          <p className="text-xs text-orange-600 font-medium mt-1">
                                            🔄 Có thể phân công lại (đã hết hạn)
                                          </p>
                                        )}
                                          {!formData.staff_id && hasExpiredAssignments(room._id) && (
                                          <p className="text-xs text-orange-600 font-medium mt-1">
                                            🔄 Có thể phân công lại
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`
                                  w-3 h-3 rounded-full transition-all duration-200
                                  ${isSelected ? 'bg-green-500 shadow-md' : 'bg-gray-300'}
                                `} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          )}

                          {!loadingRoomResidents && getFilteredRooms().length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              {searchTerm ? (
                                <>
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                  </div>
                                  <p className="text-lg font-medium mb-2">Không tìm thấy phòng nào phù hợp</p>
                                  <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                                </>
                              ) : (
                                <>
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlusIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <p className="text-lg font-medium mb-2">Không có phòng nào khả dụng</p>
                                  <p className="text-sm">Tất cả phòng có người cao tuổi đã được phân công</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {formData.room_id && (
                          <div className="mt-4 flex items-center justify-between bg-white rounded-xl p-4 border-2 border-green-200">
                            <p className="text-sm text-gray-600 flex items-center">
                              <CheckIcon className="w-4 h-4 mr-2 text-green-500" />
                              Đã chọn: <span className="font-semibold text-green-600 ml-1 mr-1">Phòng {selectedRoom?.room_number}</span>
                              {selectedResidents.length > 0 && (
                                <span className="text-gray-500">• {selectedResidents.length} người cao tuổi</span>
                              )}
                            </p>
                            <button
                              onClick={() => setFormData({ ...formData, room_id: '' })}
                              className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
                            >
                              Bỏ chọn
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 date-picker-container">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Ngày kết thúc phân công <span className="text-gray-400">(Tùy chọn)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formatDateForDisplay(formData.end_date)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d{0,2}\/?\d{0,2}\/?\d{0,4}$/.test(value)) {
                                let formatted = value.replace(/\D/g, '');
                                if (formatted.length >= 2) {
                                  formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                                }
                                if (formatted.length >= 5) {
                                  formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
                                }
                                formatted = formatted.slice(0, 10);

                                if (formatted.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
                                  const parsedDate = parseDateFromDisplay(formatted);
                                  if (parsedDate) {
                                    setFormData({ ...formData, end_date: parsedDate });
                                    if (validationErrors.end_date) {
                                      setValidationErrors(prev => ({ ...prev, end_date: '' }));
                                    }
                                  }
                                }
                              }
                            }}
                            onFocus={() => setShowDatePicker(true)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all duration-200 text-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>

                          {showDatePicker && (
                            <input
                              type="date"
                              value={formData.end_date}
                              onChange={(e) => {
                                setFormData({ ...formData, end_date: e.target.value });
                                setShowDatePicker(false);
                                if (validationErrors.end_date) {
                                  setValidationErrors(prev => ({ ...prev, end_date: '' }));
                                }
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              style={{ zIndex: 10 }}
                              autoFocus
                            />
                          )}
                        </div>


                        {validationErrors.end_date && (
                          <p className="text-sm text-red-600 mt-2 flex items-center">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                            {validationErrors.end_date}
                          </p>
                        )}
                        {formData.end_date && new Date(formData.end_date) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                          <p className="text-sm text-red-600 mt-2 flex items-center">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                            Ngày kết thúc không được ở quá khứ!
                          </p>
                        )}
                        {!formData.end_date && (
                          <p className="text-sm text-gray-500 mt-2 flex items-center">
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Phân công sẽ không có ngày kết thúc (hoạt động vô thời hạn)
                          </p>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Ghi chú phân công
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 focus:outline-none transition-all duration-200 text-lg resize-none"
                          placeholder="Ghi chú về phân công, yêu cầu đặc biệt, v.v..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      Xem trước phân công
                    </h2>

                    <div className="space-y-6">
                      {selectedStaff && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                            <UserPlusIcon className="w-4 h-4 mr-2" />
                            Nhân viên được chọn
                          </h3>
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg overflow-hidden">
                              {selectedStaff.avatar ? (
                                <img
                                  src={getAvatarUrlWithFallback(selectedStaff.avatar)}
                                  alt={selectedStaff.full_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/default-avatar.svg";
                                  }}
                                />
                              ) : (
                                <img
                                  src="/default-avatar.svg"
                                  alt={selectedStaff.full_name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-blue-900 text-lg">{selectedStaff.full_name}</p>
                              <p className="text-sm text-blue-700">{selectedStaff.email}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRoom && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-green-900 flex items-center">
                              <CheckIcon className="w-4 h-4 mr-2" />
                              Phòng được chọn: {selectedRoom.room_number}
                            </h3>
                            <button
                              onClick={() => setFormData({ ...formData, room_id: '' })}
                              className="text-xs text-green-600 hover:text-green-800 transition-colors font-medium"
                            >
                              Bỏ chọn
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  </div>
                                  <div>
                                  <p className="text-sm font-semibold text-green-900">Phòng {selectedRoom.room_number}</p>
                                  </div>
                                </div>
                            </div>
                            {loadingRoomResidents ? (
                              <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                <div className="flex items-center justify-center py-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                  <p className="text-xs text-gray-600">Đang tải...</p>
                                </div>
                              </div>
                            ) : residentsLoading ? (
                              <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                <div className="flex items-center justify-center py-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                  <p className="text-xs text-gray-600">Đang tải...</p>
                                </div>
                              </div>
                            ) : selectedResidents.length > 0 ? (
                              <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                <p className="text-sm font-semibold text-green-900 mb-2">Người cao tuổi trong phòng ({selectedResidents.length})</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {selectedResidents.map((resident) => (
                                    <div key={resident._id} className="flex items-center text-xs">
                                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      </div>
                                      <span className="text-green-800">{resident.full_name}</span>
                              </div>
                            ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                <p className="text-sm text-gray-600">Không có người cao tuổi nào trong phòng này</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Trách nhiệm được giao
                        </h3>
                        <div className="space-y-3">
                          {formData.responsibilities.map((responsibility) => (
                            <div key={responsibility} className="flex items-center">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <CheckIcon className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-sm text-gray-700 font-medium">
                                {responsibility === 'vital_signs' && 'Đo đạc chỉ số sức khỏe'}
                                {responsibility === 'care_notes' && ' Ghi chú chăm sóc'}
                                {responsibility === 'activities' && ' Quản lý hoạt động'}
                                {responsibility === 'photos' && 'Đăng ảnh hoạt động'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                        <h3 className="text-sm font-semibold text-yellow-900 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Tóm tắt
                        </h3>
                        <div className="text-sm text-yellow-800 space-y-2">
                          <p className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Sẽ tạo <span className="font-bold text-yellow-900 mx-1">1</span> phân công phòng
                          </p>
                          <p className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Nhân viên: <span className="font-semibold text-yellow-900 ml-1">{selectedStaff?.full_name || 'Chưa chọn'}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Phòng: <span className="font-semibold text-yellow-900 ml-1">{selectedRoom?.room_number || 'Chưa chọn'}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Người cao tuổi: <span className="font-semibold text-yellow-900 ml-1">
                              {loadingRoomResidents ? 'Đang tải...' : `${selectedResidents.length} người`}
                            </span>
                          </p>
                          <p className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Trạng thái: <span className="font-semibold text-green-600 ml-1">Hoạt động</span>
                          </p>
                          {formData.end_date ? (
                            <p className="flex items-center">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                              Kết thúc: <span className="font-semibold text-yellow-900 ml-1">{new Date(formData.end_date).toLocaleDateString('vi-VN')}</span>
                            </p>
                          ) : (
                            <p className="flex items-center">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                              Thời hạn: <span className="font-semibold text-blue-600 ml-1">Vô thời hạn</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showSuccessModal && successData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {successData.hasExpiredUpdates ? 'Cập nhật phân công thành công!' : 'Tạo phân công thành công!'}
                </h2>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Số lượng phân công:</span>
                      <span className="font-bold text-green-600 text-lg">{successData.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Nhân viên:</span>
                      <span className="font-semibold text-gray-900">{successData.staff?.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phòng:</span>
                      <span className="font-semibold text-gray-900">Phòng {successData.room?.room_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Người cao tuổi:</span>
                      <span className="font-semibold text-gray-900">{successData.residents.length} người</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-8">
                  {successData.hasExpiredUpdates
                    ? 'Phân công đã được cập nhật thành công từ trạng thái hết hạn và nhân viên có thể bắt đầu thực hiện trách nhiệm của mình.'
                    : 'Phân công đã được tạo thành công và nhân viên có thể bắt đầu thực hiện trách nhiệm của mình.'
                  }
                </p>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSuccessClose}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Xem danh sách phân công
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showResidentsModal && selectedRoomForResidents && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-md">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Danh sách người cao tuổi
                      </h2>
                      <p className="text-gray-600">
                        Phòng {selectedRoomForResidents.room_number}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseResidentsModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingRoomResidents ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải danh sách...</span>
                  </div>
                ) : roomResidents[selectedRoomForResidents._id]?.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có người cao tuổi</h3>
                    <p className="text-gray-600">Phòng này hiện tại chưa có người cao tuổi nào.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomResidents[selectedRoomForResidents._id].map((resident) => (
                      <div key={resident._id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-md overflow-hidden">
                            <img
                              src={resident.avatar ? getAvatarUrlWithFallback(resident.avatar) : "/default-avatar.svg"}
                              alt={resident.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/default-avatar.svg";
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{resident.full_name}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Tổng cộng: <span className="font-semibold">{roomResidents[selectedRoomForResidents._id]?.length || 0}</span> người cao tuổi
                  </div>
                  <button
                    onClick={handleCloseResidentsModal}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 
