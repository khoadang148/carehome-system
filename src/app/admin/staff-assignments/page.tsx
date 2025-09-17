"use client";

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { userAPI, residentAPI, staffAssignmentsAPI } from '@/lib/api';
import { processAvatarUrl, getAvatarUrlWithFallback } from '@/lib/utils/avatarUtils';
import { formatDateDDMMYYYY, Validator } from '@/lib/utils/validation';

export default function StaffAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Local states thay cho Redux
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  
  const [staffs, setStaffs] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  
  const [residents, setResidents] = useState<any[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [residentsError, setResidentsError] = useState('');

  const [expandedStaff, setExpandedStaff] = useState<string[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [showResidentsModal, setShowResidentsModal] = useState(false);
  const [selectedRoomForResidents, setSelectedRoomForResidents] = useState<any>(null);
  const [roomResidents, setRoomResidents] = useState<any[]>([]);
  const [loadingRoomResidents, setLoadingRoomResidents] = useState(false);

  const [formData, setFormData] = useState({
    staff_id: '',
    room_id: '',
    end_date: '',
    notes: '',
    responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
  });

  const [simpleEditForm, setSimpleEditForm] = useState({
    end_date: '',
  });
  const [originalEndDate, setOriginalEndDate] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Computed loading and error states
  const loadingData = assignmentsLoading || staffLoading || residentsLoading;
  const error = assignmentsError || staffError || residentsError;

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user || user.role !== 'admin') return;

    try {
      setAssignmentsLoading(true);
      const assignmentsData = await (staffAssignmentsAPI as any).getAll?.() || [];
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (e: any) {
      setAssignmentsError(e?.message || 'Lỗi tải danh sách phân công');
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }

    try {
      setStaffLoading(true);
      const staffData = await userAPI.getByRoleWithStatus('staff');
      setStaffs(Array.isArray(staffData) ? staffData : []);
    } catch (e: any) {
      setStaffError(e?.message || 'Lỗi tải danh sách nhân viên');
      setStaffs([]);
    } finally {
      setStaffLoading(false);
    }

    try {
      setResidentsLoading(true);
      const residentsData = await (residentAPI as any).getAll?.() || [];
      setResidents(Array.isArray(residentsData) ? residentsData : []);
    } catch (e: any) {
      setResidentsError(e?.message || 'Lỗi tải danh sách người cao tuổi');
      setResidents([]);
    } finally {
      setResidentsLoading(false);
    }
  };

  const forceReloadData = () => {
    if (!user || user.role !== 'admin') return;
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Reload data when assignments are updated/deleted successfully
  useEffect(() => {
    if (!assignmentsLoading && !assignmentsError) {
      // Data has been loaded successfully, no need to reload
    }
  }, [assignmentsLoading, assignmentsError]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && user.role === 'admin') {
        loadData();
      }
    };

    const handleFocus = () => {
      if (user && user.role === 'admin') {
        forceReloadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const getGroupedAssignments = () => {
    const grouped: { [key: string]: any[] } = {};

    const filteredAssignments = assignments.filter(assignment => {
      const isActuallyExpired = assignment.end_date && isExpired(assignment.end_date);
      if (isActuallyExpired) return false;

      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();
      const staffName = assignment.staff_id?.full_name || '';
      const roomNumber = assignment.room_id?.room_number || '';
      const staffEmail = assignment.staff_id?.email || '';

      return (
        staffName.toLowerCase().includes(searchLower) ||
        roomNumber.toLowerCase().includes(searchLower) ||
        staffEmail.toLowerCase().includes(searchLower)
      );
    });

    filteredAssignments.forEach(assignment => {
      const staffId = assignment.staff_id?._id || assignment.staff_id;
      if (!grouped[staffId]) {
        grouped[staffId] = [];
      }
      grouped[staffId].push(assignment);
    });

    return grouped;
  };

  const getExpiredAssignmentsForStaff = (staffId: string) => {
    return assignments.filter(assignment => {
      const assignmentStaffId = assignment.staff_id?._id || assignment.staff_id;
      const isActuallyExpired = assignment.end_date && isExpired(assignment.end_date);
      return assignmentStaffId === staffId && isActuallyExpired;
    });
  };

  const toggleStaffExpansion = (staffId: string) => {
    setExpandedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleUpdate = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const updatedAssignment = await (staffAssignmentsAPI as any).update?.(selectedAssignment._id, {
        staff_id: formData.staff_id,
        room_id: formData.room_id,
        end_date: formData.end_date || undefined,
        notes: formData.notes,
        responsibilities: formData.responsibilities,
      });
      
      if (updatedAssignment) {
        setAssignments(prev => prev.map(a => a._id === selectedAssignment._id ? updatedAssignment : a));
        toast.success('Cập nhật phân công thành công');
      }

      setShowEditModal(false);
      resetForm();

      setSuccessData({
        type: 'update',
        message: 'Cập nhật phân công thành công!',
        assignment: selectedAssignment,
      });
      setShowSuccessModal(true);
      
      // Reload data to get updated information
      setTimeout(() => {
        forceReloadData();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimpleUpdate = async () => {
    if (!selectedAssignment) return;

    setValidationErrors({});

    const endDateError = Validator.required(simpleEditForm.end_date, 'Ngày kết thúc');
    if (endDateError) {
      setValidationErrors({ end_date: endDateError.message });
      return;
    }

    if (simpleEditForm.end_date) {
      const dateError = Validator.date(simpleEditForm.end_date, 'Ngày kết thúc', {
        allowFuture: true
      });
      if (dateError) {
        setValidationErrors({ end_date: dateError.message });
        return;
      }

      const assignmentDate = new Date(selectedAssignment.assigned_date);
      const endDate = new Date(simpleEditForm.end_date);
      if (endDate <= assignmentDate) {
        setValidationErrors({
          end_date: 'Ngày kết thúc phải sau ngày phân công'
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const updatedAssignment = await (staffAssignmentsAPI as any).update?.(selectedAssignment._id, {
        end_date: simpleEditForm.end_date || undefined,
      });
      
      if (updatedAssignment) {
        setAssignments(prev => prev.map(a => a._id === selectedAssignment._id ? updatedAssignment : a));
        toast.success('Cập nhật ngày kết thúc thành công');
      }

      setShowEditModal(false);
      setSimpleEditForm({ end_date: '' });
      setOriginalEndDate('');
      setSelectedAssignment(null);
      setValidationErrors({});

      setSuccessData({
        type: 'update',
        message: 'Cập nhật ngày kết thúc thành công!',
        assignment: selectedAssignment,
      });
      setShowSuccessModal(true);
      
      // Reload data to get updated information
      setTimeout(() => {
        forceReloadData();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật ngày kết thúc. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      // For now, just show success message and reload data
      // TODO: Implement delete action in Redux slice
      setShowDeleteModal(false);

      setSuccessData({
        type: 'delete',
        message: 'Xóa phân công thành công!',
        assignment: selectedAssignment,
      });
      setShowSuccessModal(true);
      
      // Reload data to get updated information
      setTimeout(() => {
        forceReloadData();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  const handleShowResidents = async (room: any) => {
    setSelectedRoomForResidents(room);
    setLoadingRoomResidents(true);
    setShowResidentsModal(true);

    try {
      // Load residents for this room using bed assignments
      const { bedAssignmentsAPI } = await import('@/lib/api');
      const bedAssignments = await bedAssignmentsAPI.getAll();

      const roomResidentsData: any[] = [];

      if (Array.isArray(bedAssignments)) {
        bedAssignments.forEach((assignment: any) => {
          // Only consider active assignments (no unassigned_date)
          if (assignment && assignment.resident_id && assignment.bed_id && !assignment.unassigned_date) {
            const roomId = assignment.bed_id.room_id?._id || assignment.bed_id.room_id;

            if (roomId !== room._id) return;

            // Prefer resident from list; fallback to populated resident on assignment
            const residentId = (assignment.resident_id && assignment.resident_id._id) || assignment.resident_id;
            const residentFromList = residents.find((r: any) => r._id === residentId);
            const resident = residentFromList || assignment.resident_id;

            if (resident) {
              const exists = roomResidentsData.find(r => r._id === resident._id);
              if (!exists) roomResidentsData.push(resident);
            }
          }
        });
      }

      setRoomResidents(roomResidentsData);
    } catch (err) {
      console.error('Error loading room residents:', err);
      setRoomResidents([]);
    } finally {
      setLoadingRoomResidents(false);
    }
  };

  const handleCloseResidentsModal = () => {
    setShowResidentsModal(false);
    setSelectedRoomForResidents(null);
    setRoomResidents([]);
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      room_id: '',
      end_date: '',
      notes: '',
      responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setSelectedAssignment(null);
  };

  // Check if there are changes in the simple edit form
  const hasSimpleEditChanges = () => {
    return simpleEditForm.end_date !== originalEndDate;
  };

  const openEditModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFormData({
      staff_id: assignment.staff_id?._id || assignment.staff_id,
      room_id: assignment.room_id?._id || assignment.room_id,
      end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : '',
      notes: assignment.notes || '',
      responsibilities: assignment.responsibilities || ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setShowEditModal(true);
  };

  const openSimpleEditModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    const assignmentEndDate = assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : '';
    setSimpleEditForm({
      end_date: assignmentEndDate,
    });
    setOriginalEndDate(assignmentEndDate);
    setShowEditModal(true);
  };

  const openDeleteModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return formatDateDDMMYYYY(dateString);
  };

  const getStatusBadge = (assignment: any) => {
    if (!assignment.end_date) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <CheckIcon className="w-3 h-3 mr-1" />
        Không có hạn
      </span>;
    }

    if (isExpired(assignment.end_date)) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        Đã hết hạn
      </span>;
    }

    if (isExpiringSoon(assignment.end_date)) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        Sắp hết hạn
      </span>;
    }

    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckIcon className="w-3 h-3 mr-1" />
      Đang quản lý
    </span>;
  };

  const getStaffInfo = (staffId: string | undefined) => {
    if (!staffId) return null;
    const staff = staffs.find(staff => staff._id === staffId);
    return staff;
  };

  const isExpiringSoon = (endDate: string | undefined) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isExpired = (endDate: string | undefined) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  const expiringAssignments = assignments.filter(assignment =>
    isExpiringSoon(assignment.end_date) && !isExpired(assignment.end_date)
  );

  const expiredAssignments = assignments.filter(assignment =>
    isExpired(assignment.end_date)
  );

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

  const groupedAssignments = getGroupedAssignments();

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
            borderRadius: '2rem',
            padding: '2.5rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-10%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0
            }} />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                  onClick={() => router.push('/admin')}
                  className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                  title="Quay lại"
                >
                  <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                </button>

                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                    animation: 'shimmer 2s infinite'
                  }} />
                  <UserGroupIcon style={{ width: '2.25rem', height: '2.25rem', color: 'white' }} />
                </div>

                <div>
                  <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    margin: 0,
                    color: '#1e293b',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2
                  }}>
                    Quản lý phân công nhân viên
                  </h1>
                  <p style={{
                    fontSize: '1.125rem',
                    color: '#64748b',
                    margin: '0.5rem 0 0 0',
                    fontWeight: 500,
                    lineHeight: 1.5
                  }}>
                    Quản lý tất cả phân công giữa nhân viên và phòng một cách hiệu quả
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  position: 'relative',
                  minWidth: '300px'
                }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '1rem',
                      zIndex: 2,
                      color: searchFocused ? '#3b82f6' : '#9ca3af'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên nhân viên, số phòng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem 0.875rem 3rem',
                        borderRadius: '1rem',
                        border: `2px solid ${searchFocused ? '#3b82f6' : '#e5e7eb'}`,
                        background: 'white',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: searchFocused
                          ? '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)'
                          : '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.color = '#9ca3af';
                          e.currentTarget.style.background = 'transparent';
                        }}
                        title="Xóa tìm kiếm"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={forceReloadData}
                  disabled={loadingData}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '1rem',
                    padding: '0.875rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: loadingData ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                    opacity: loadingData ? 0.6 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={e => {
                    if (!loadingData) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!loadingData) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  title="Làm mới dữ liệu"
                >
                  <ArrowPathIcon style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    animation: loadingData ? 'spin 1s linear infinite' : 'none'
                  }} />
                  {loadingData ? 'Đang tải...' : 'Làm mới'}
                </button>

                <Link
                  href="/admin/staff-assignments/new"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '1rem',
                    padding: '0.875rem 1.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Tạo phân công mới
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto',
              padding: '0 1.5rem',
              marginTop: '1.5rem',
              animation: 'fadeInUp 0.5s ease-out'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 0 0 1px rgba(220, 38, 38, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                  }}>
                    <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div>
                    <p style={{
                      fontWeight: 600,
                      margin: 0,
                      fontSize: '1rem',
                      lineHeight: 1.5
                    }}>
                      {error}
                    </p>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.875rem',
                      opacity: 0.8
                    }}>
                      Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 1.5rem 2rem 1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            {loadingData ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '20rem',
                animation: 'fadeInUp 0.5s ease-out'
              }}>
                <div style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '2rem',
                  padding: '3rem',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      border: '3px solid #e2e8f0',
                      borderTop: '3px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1.5rem auto',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)'
                    }}></div>
                    <h3 style={{
                      color: '#1e293b',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: '0 0 0.5rem 0'
                    }}>
                      Đang tải dữ liệu...
                    </h3>
                    <p style={{
                      color: '#64748b',
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: 1.5
                    }}>
                      Vui lòng chờ trong giây lát
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  marginBottom: '2rem',
                  animation: 'fadeInUp 0.5s ease-out'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                      }}>
                        <UserGroupIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                      </div>
                      <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: 0,
                        lineHeight: 1.3
                      }}>
                        Danh sách phân công phòng theo nhân viên
                      </h2>
                    </div>

                    {searchTerm && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '0.75rem',
                        border: '1px solid #bae6fd',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#3b82f6' }}>
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#1e40af'
                        }}>
                          {Object.keys(groupedAssignments).length} nhân viên tìm thấy
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.5,
                    paddingLeft: '4rem'
                  }}>
                    {searchTerm
                      ? `Kết quả tìm kiếm cho "${searchTerm}"`
                      : 'Quản lý tất cả phân công phòng được nhóm theo từng nhân viên một cách trực quan và hiệu quả'
                    }
                  </p>
                </div>

                {Object.keys(groupedAssignments).length === 0 ? (
                  searchTerm ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '4rem 2rem',
                      animation: 'fadeInUp 0.6s ease-out'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: '2rem',
                        padding: '3rem',
                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(20px)',
                        position: 'relative',
                        overflow: 'hidden',
                        maxWidth: '500px',
                        margin: '0 auto'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-30%',
                          right: '-20%',
                          width: '150px',
                          height: '150px',
                          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                          borderRadius: '50%',
                          zIndex: 0
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{
                            width: '5rem',
                            height: '5rem',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <svg width="2.5rem" height="2.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#f59e0b' }}>
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.35-4.35"></path>
                            </svg>
                          </div>

                          <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            margin: '0 0 0.75rem 0',
                            lineHeight: 1.3
                          }}>
                            Không tìm thấy kết quả
                          </h3>

                          <p style={{
                            color: '#64748b',
                            fontSize: '1rem',
                            margin: '0 0 1.5rem 0',
                            lineHeight: 1.6
                          }}>
                            Không có nhân viên hoặc phòng nào phù hợp với từ khóa "{searchTerm}"
                          </p>

                          <button
                            onClick={() => setSearchTerm('')}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              padding: '0.75rem 1.5rem',
                              borderRadius: '0.75rem',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                          >
                            Xóa tìm kiếm
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '4rem 2rem',
                      animation: 'fadeInUp 0.6s ease-out'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: '2rem',
                        padding: '3rem',
                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(20px)',
                        position: 'relative',
                        overflow: 'hidden',
                        maxWidth: '500px',
                        margin: '0 auto'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-30%',
                          right: '-20%',
                          width: '150px',
                          height: '150px',
                          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                          borderRadius: '50%',
                          zIndex: 0
                        }} />
                        <div style={{
                          position: 'absolute',
                          bottom: '-20%',
                          left: '-15%',
                          width: '100px',
                          height: '100px',
                          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
                          borderRadius: '50%',
                          zIndex: 0
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{
                            width: '5rem',
                            height: '5rem',
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                            borderRadius: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              left: '0',
                              right: '0',
                              bottom: '0',
                              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                              animation: 'shimmer 2s infinite'
                            }} />
                            <UserGroupIcon style={{ width: '2.5rem', height: '2.5rem', color: '#64748b' }} />
                          </div>

                          <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            margin: '0 0 0.75rem 0',
                            lineHeight: 1.3
                          }}>
                            Chưa có phân công nào
                          </h3>

                          <p style={{
                            color: '#64748b',
                            fontSize: '1rem',
                            margin: '0 0 2rem 0',
                            lineHeight: 1.6
                          }}>
                            Bắt đầu tạo phân công mới để quản lý nhân viên và phòng một cách hiệu quả
                          </p>

                          <Link
                            href="/admin/staff-assignments/new"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              padding: '1rem 2rem',
                              borderRadius: '1rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                            }}
                          >
                            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                            Tạo phân công đầu tiên
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '1.5rem',
                    animation: 'fadeInUp 0.6s ease-out'
                  }}>
                    {Object.entries(groupedAssignments).map(([staffId, staffAssignments], index) => {
                      const staff = getStaffInfo(staffId);
                      const isExpanded = expandedStaff.includes(staffId);

                      return (
                        <div
                          key={staffId}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '1.5rem',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px -10px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div
                            style={{
                              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                              padding: '2rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                            }}
                            onClick={() => toggleStaffExpansion(staffId)}
                          >
                            <div style={{
                              position: 'absolute',
                              top: '-50%',
                              right: '-20%',
                              width: '200px',
                              height: '200px',
                              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                              borderRadius: '50%',
                              zIndex: 0
                            }} />

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              position: 'relative',
                              zIndex: 1
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                  width: '3rem',
                                  height: '3rem',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '1rem',
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                  overflow: 'hidden'
                                }}>
                                  {(() => {
                                    const staffAvatar = staffAssignments[0]?.staff_id?.avatar || staff?.avatar;
                                    const staffName = staffAssignments[0]?.staff_id?.full_name || staff?.full_name;

                                    return (
                                      <img
                                        src={staffAvatar ? getAvatarUrlWithFallback(staffAvatar) : "/default-avatar.svg"}
                                        alt={staffName}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.src = "/default-avatar.svg";
                                        }}
                                      />
                                    );
                                  })()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        width: '7rem',
                                        flexShrink: 0
                                      }}>
                                        Tên nhân viên:
                                      </span>
                                      <span style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 700,
                                        color: '#1e293b'
                                      }}>
                                        {staff?.full_name || 'Nhân viên không xác định'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        width: '7rem',
                                        flexShrink: 0
                                      }}>
                                        Email:
                                      </span>
                                      <span style={{
                                        fontSize: '0.875rem',
                                        color: '#4b5563'
                                      }}>
                                        {staff?.email || 'Email không xác định'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        width: '7rem',
                                        flexShrink: 0
                                      }}>
                                        Tổng:
                                      </span>
                                      <span style={{
                                        fontSize: '0.875rem',
                                        color: '#6b7280'
                                      }}>
                                        đang quản lý {staffAssignments.length} phòng
                                        {(() => {
                                          const expiredCount = getExpiredAssignmentsForStaff(staffId).length;
                                          return expiredCount > 0 ? (
                                            <span style={{ color: '#ea580c', marginLeft: '0.25rem' }}>
                                              ({expiredCount} đã hết hạn)
                                            </span>
                                          ) : null;
                                        })()}
                                        {staffAssignments.length > 10 && (
                                          <span style={{ color: '#3b82f6', marginLeft: '0.25rem', fontWeight: 500 }}>
                                            (Quá tải - {staffAssignments.length} phân công)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div
                                onClick={() => toggleStaffExpansion(staffId)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                  borderRadius: '0.75rem',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  cursor: 'pointer'
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)';
                                  e.currentTarget.style.transform = isExpanded ? 'rotate(180deg) scale(1.05)' : 'rotate(0deg) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)';
                                  e.currentTarget.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                title={isExpanded ? 'Thu gọn danh sách phân công' : 'Xem chi tiết phân công'}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ color: '#3b82f6' }}
                                >
                                  <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="bg-white">
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Phòng được phân công
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Ngày phân công
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Ngày kết thúc
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody id={`tbody-${staffId}`} className="bg-white divide-y divide-gray-200">
                                    {staffAssignments.slice(0, 10).map((assignment) => (
                                      <tr key={assignment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                              </svg>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                              <div className="grid grid-cols-1 gap-1">
                                                <div className="flex items-center">
                                                  <span className="text-sm font-semibold text-gray-900">
                                                    Phòng {assignment.room_id?.room_number || 'N/A'}
                                                  </span>
                                                </div>

                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShowResidents(assignment.room_id);
                                                  }}
                                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 transition-colors"
                                                >
                                                  Xem danh sách người cao tuổi
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <span className="text-sm text-gray-900">
                                              {formatDate(assignment.assigned_date)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="flex flex-col">
                                              <span className={`text-sm ${isExpired(assignment.end_date) ? 'text-red-600 font-semibold' : isExpiringSoon(assignment.end_date) ? 'text-orange-600 font-semibold' : 'text-gray-900'}`}>
                                                {assignment.end_date ? formatDate(assignment.end_date) : 'Không có'}
                                              </span>
                                              {isExpired(assignment.end_date) && (
                                                <span className="text-xs text-red-500">Đã hết hạn</span>
                                              )}
                                              {isExpiringSoon(assignment.end_date) && !isExpired(assignment.end_date) && (
                                                <span className="text-xs text-orange-500">Sắp hết hạn</span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div>
                                              {getStatusBadge(assignment)}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => openSimpleEditModal(assignment)}
                                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                              title="Chỉnh sửa ngày kết thúc"
                                            >
                                              <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => openDeleteModal(assignment)}
                                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                              title="Xóa"
                                            >
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}

                                    {staffAssignments.slice(10).map((assignment) => (
                                      <tr key={assignment._id} id={`hidden-${staffId}`} className="hidden hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                              </svg>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                              <div className="grid grid-cols-1 gap-1">
                                                <div className="flex items-center">
                                                  <span className="text-sm font-semibold text-gray-900">
                                                    Phòng {assignment.room_id?.room_number || 'N/A'}
                                                  </span>
                                                </div>
                                                {assignment.room_id?.room_type && (
                                                  <div className="text-sm text-gray-600">
                                                    {assignment.room_id.room_type}
                                                  </div>
                                                )}
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShowResidents(assignment.room_id);
                                                  }}
                                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 transition-colors"
                                                >
                                                  Xem danh sách người cao tuổi
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <span className="text-sm text-gray-900">
                                              {formatDate(assignment.assigned_date)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="flex flex-col">
                                              <span className={`text-sm ${isExpired(assignment.end_date) ? 'text-red-600 font-semibold' : isExpiringSoon(assignment.end_date) ? 'text-orange-600 font-semibold' : 'text-gray-900'}`}>
                                                {assignment.end_date ? formatDate(assignment.end_date) : 'Không có'}
                                              </span>
                                              {isExpired(assignment.end_date) && (
                                                <span className="text-xs text-red-500">Đã hết hạn</span>
                                              )}
                                              {isExpiringSoon(assignment.end_date) && !isExpired(assignment.end_date) && (
                                                <span className="text-xs text-orange-500">Sắp hết hạn</span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div>
                                              {getStatusBadge(assignment)}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => openSimpleEditModal(assignment)}
                                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                              title="Chỉnh sửa ngày kết thúc"
                                            >
                                              <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => openDeleteModal(assignment)}
                                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                              title="Xóa"
                                            >
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {staffAssignments.length > 10 && (
                                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">
                                        Hiển thị 10/{staffAssignments.length} phân công
                                      </span>
                                      <button
                                        onClick={() => {
                                          const tbody = document.querySelector(`#tbody-${staffId}`);
                                          const showMoreBtn = document.getElementById(`show-more-assignments-${staffId}`);
                                          const hiddenRows = document.querySelectorAll(`#hidden-${staffId}`);

                                          if (tbody && showMoreBtn && hiddenRows.length > 0) {
                                            if (hiddenRows[0].classList.contains('hidden')) {
                                              hiddenRows.forEach(row => row.classList.remove('hidden'));
                                              showMoreBtn.textContent = 'Thu gọn';
                                            } else {
                                              hiddenRows.forEach(row => row.classList.add('hidden'));
                                              showMoreBtn.textContent = `Xem thêm ${staffAssignments.length - 10} phân công`;
                                            }
                                          }
                                        }}
                                        id={`show-more-assignments-${staffId}`}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                                      >
                                        Xem thêm {staffAssignments.length - 10} phân công
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {(() => {
                                const expiredAssignments = getExpiredAssignmentsForStaff(staffId);
                                if (expiredAssignments.length > 0) {
                                  const maxVisible = 3;
                                  const hasMore = expiredAssignments.length > maxVisible;
                                  const visibleAssignments = expiredAssignments.slice(0, maxVisible);

                                  return (
                                    <div className="border-t border-gray-200 bg-orange-50">
                                      <div className="px-6 py-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="text-sm font-semibold text-orange-800 flex items-center">
                                            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                                            Phân công đã hết hạn ({expiredAssignments.length})
                                          </h4>
                                          {hasMore && (
                                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                              +{expiredAssignments.length - maxVisible} nữa
                                            </span>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          {visibleAssignments.map((assignment) => (
                                            <div key={assignment._id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                                              <div className="flex items-center min-w-0 flex-1">
                                                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3 shadow-sm flex-shrink-0">
                                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                  </svg>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-medium text-gray-900 truncate">
                                                    Phòng {assignment.room_id?.room_number || 'N/A'}
                                                  </p>
                                                  <p className="text-xs text-gray-500">
                                                    Hết hạn: {assignment.end_date ? formatDate(assignment.end_date) : 'N/A'}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                                <button
                                                  onClick={() => openSimpleEditModal(assignment)}
                                                  className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                                  title="Gia hạn phân công"
                                                >
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                  </svg>
                                                </button>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                                                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                                  Đã hết hạn
                                                </span>
                                              </div>
                                            </div>
                                          ))}

                                          {hasMore && (
                                            <button
                                              onClick={() => {
                                                const allExpiredDiv = document.getElementById(`expired-${staffId}`);
                                                const showMoreBtn = document.getElementById(`show-more-${staffId}`);
                                                if (allExpiredDiv && showMoreBtn) {
                                                  if (allExpiredDiv.style.display === 'none') {
                                                    allExpiredDiv.style.display = 'block';
                                                    showMoreBtn.textContent = 'Thu gọn';
                                                  } else {
                                                    allExpiredDiv.style.display = 'none';
                                                    showMoreBtn.textContent = `Xem thêm ${expiredAssignments.length - maxVisible} phân công`;
                                                  }
                                                }
                                              }}
                                              id={`show-more-${staffId}`}
                                              className="w-full text-center text-sm text-orange-600 hover:text-orange-700 py-2 px-3 rounded-lg hover:bg-orange-100 transition-colors font-medium"
                                            >
                                              Xem thêm {expiredAssignments.length - maxVisible} phân công
                                            </button>
                                          )}

                                          {hasMore && (
                                            <div id={`expired-${staffId}`} style={{ display: 'none' }} className="space-y-2">
                                              {expiredAssignments.slice(maxVisible).map((assignment) => (
                                                <div key={assignment._id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                                                  <div className="flex items-center min-w-0 flex-1">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3 shadow-sm flex-shrink-0">
                                                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                      </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-sm font-medium text-gray-900 truncate">
                                                        Phòng {assignment.room_id?.room_number || 'N/A'}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        Hết hạn: {assignment.end_date ? formatDate(assignment.end_date) : 'N/A'}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                                    <button
                                                      onClick={() => openSimpleEditModal(assignment)}
                                                      className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                                      title="Gia hạn phân công"
                                                    >
                                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                      </svg>
                                                    </button>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                                                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                                      Đã hết hạn
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="p-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <PencilIcon className="w-6 h-6 text-white" />
                    </div>
                    {selectedAssignment && isExpired(selectedAssignment.end_date) ? 'Gia hạn phân công' : 'Chỉnh sửa phân công'}
                  </h2>

                  {selectedAssignment && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Nhân viên:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {selectedAssignment.staff_id?.full_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Phòng:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            Phòng {selectedAssignment.room_id?.room_number || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Ngày phân công:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatDateDDMMYYYY(selectedAssignment.assigned_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Ngày kết thúc <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy (bắt buộc)"
                        value={simpleEditForm.end_date ? formatDateDDMMYYYY(simpleEditForm.end_date) : ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const dateMatch = inputValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

                          if (dateMatch) {
                            const [, day, month, year] = dateMatch;
                            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                            setSimpleEditForm({ ...simpleEditForm, end_date: formattedDate });
                            if (validationErrors.end_date) {
                              setValidationErrors(prev => ({ ...prev, end_date: '' }));
                            }
                          } else if (inputValue === '') {
                            setSimpleEditForm({ ...simpleEditForm, end_date: '' });
                          } else {
                            setSimpleEditForm({ ...simpleEditForm, end_date: inputValue });
                          }
                        }}
                        onBlur={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue && !inputValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                            const date = new Date(inputValue);
                            if (!isNaN(date.getTime())) {
                              const formattedDate = formatDateDDMMYYYY(date);
                              const yyyyMMdd = date.toISOString().split('T')[0];
                              setSimpleEditForm({ ...simpleEditForm, end_date: yyyyMMdd });
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                          borderRadius: '0.5rem',
                          border: '2px solid #e5e7eb',
                          fontSize: '0.875rem',
                          background: 'white',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(true)}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.color = '#3b82f6';
                          e.currentTarget.style.background = '#f3f4f6';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.color = '#6b7280';
                          e.currentTarget.style.background = 'transparent';
                        }}
                        title="Chọn ngày"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </button>

                      {showDatePicker && (
                        <input
                          type="date"
                          value={simpleEditForm.end_date || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setSimpleEditForm({ ...simpleEditForm, end_date: e.target.value });
                            }
                            setShowDatePicker(false);
                          }}
                          onBlur={() => setShowDatePicker(false)}
                          style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            opacity: '0',
                            cursor: 'pointer',
                            zIndex: 10
                          }}
                          autoFocus
                        />
                      )}
                    </div>

                    {validationErrors.end_date && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.375rem',
                        color: '#dc2626'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {validationErrors.end_date}
                        </span>
                      </div>
                    )}

                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    marginTop: '2rem'
                  }}>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setSimpleEditForm({ end_date: '' });
                        setOriginalEndDate('');
                        setSelectedAssignment(null);
                        setShowDatePicker(false);
                        setValidationErrors({});
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        border: '2px solid #d1d5db',
                        background: 'white',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        transition: 'all 0.2s'
                      }}
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                    {hasSimpleEditChanges() && (
                      <button
                        onClick={handleSimpleUpdate}
                        disabled={submitting}
                        style={{
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.75rem',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                          color: 'white',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          transition: 'all 0.2s',
                          opacity: submitting ? 0.5 : 1
                        }}
                      >
                        {submitting ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              width: '1rem',
                              height: '1rem',
                              border: '2px solid transparent',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              marginRight: '0.5rem'
                            }}></div>
                            Đang cập nhật...
                          </div>
                        ) : (
                          selectedAssignment && isExpired(selectedAssignment.end_date) ? 'Gia hạn phân công' : 'Cập nhật ngày kết thúc'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Xác nhận xóa</h2>
                  <p className="text-gray-600 mb-8">
                    Bạn có chắc chắn muốn xóa phân công này không? Hành động này không thể hoàn tác.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={submitting}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang xóa...
                        </div>
                      ) : (
                        'Xóa'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSuccessModal && successData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircleIcon className="w-12 h-12 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {successData.message}
                  </h2>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Hành động:</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {successData.type === 'update' && 'Cập nhật'}
                          {successData.type === 'delete' && 'Xóa'}
                        </span>
                      </div>
                      {successData.assignment && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Phòng:</span>
                            <span className="font-semibold text-gray-900">
                              Phòng {successData.assignment.room_id?.room_number || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Nhân viên:</span>
                            <span className="font-semibold text-gray-900">
                              {successData.assignment.staff_id?.full_name || 'N/A'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSuccessClose}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Đóng
                  </button>
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
                  ) : roomResidents.length === 0 ? (
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
                      {roomResidents.map((resident) => (
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
                      Tổng cộng: <span className="font-semibold">{roomResidents.length}</span> người cao tuổi
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
      </div>
    </>
  );
} 