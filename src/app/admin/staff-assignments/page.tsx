"use client";

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
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
import { staffAssignmentsAPI, staffAPI, residentAPI, userAPI } from '@/lib/api';
import { processAvatarUrl, getAvatarUrlWithFallback } from '@/lib/utils/avatarUtils';
import { formatDateDDMMYYYY, Validator } from '@/lib/utils/validation';

export default function StaffAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [expandedStaff, setExpandedStaff] = useState<string[]>([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    staff_id: '',
    resident_ids: [] as string[],
    end_date: '',
    notes: '',
    responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
  });

  // Simple edit form for end date only
  const [simpleEditForm, setSimpleEditForm] = useState({
    end_date: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Check permissions
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load data function
  const loadData = async () => {
    if (!user || user.role !== 'admin') return;
    
    setLoadingData(true);
    try {
      const [assignmentsData, staffsData, residentsData] = await Promise.all([
        staffAssignmentsAPI.getAllIncludingExpired(),
        staffAPI.getAll(),
        residentAPI.getAll(),
      ]);
      
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setStaffs(Array.isArray(staffsData) ? staffsData : []);
      setResidents(Array.isArray(residentsData) ? residentsData : []);
      console.log('Loaded data:', { 
        assignments: assignmentsData, 
        staffs: staffsData, 
        residents: residentsData 
      });
      
      // Debug: Kiểm tra staff data có avatar không
      if (Array.isArray(staffsData)) {
        console.log('Staff data sample:', staffsData.slice(0, 2).map(staff => ({
          id: staff._id,
          name: staff.full_name,
          avatar: staff.avatar,
          hasAvatar: !!staff.avatar
        })));
      }
      
      // Debug: Kiểm tra assignment data có populate staff avatar không
      if (Array.isArray(assignmentsData)) {
        console.log('Assignment data sample:', assignmentsData.slice(0, 2).map(assignment => ({
          id: assignment._id,
          staff: {
            id: assignment.staff_id?._id || assignment.staff_id,
            name: assignment.staff_id?.full_name,
            avatar: assignment.staff_id?.avatar,
            hasAvatar: !!assignment.staff_id?.avatar
          },
          resident: {
            id: assignment.resident_id?._id || assignment.resident_id,
            name: assignment.resident_id?.full_name,
            avatar: assignment.resident_id?.avatar,
            hasAvatar: !!assignment.resident_id?.avatar
          }
        })));
      }
      setError('');
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadData();
  }, [user]);

  // Refresh data when page becomes visible (when returning from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && user.role === 'admin') {
        loadData();
      }
    };

    const handleFocus = () => {
      if (user && user.role === 'admin') {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // Group assignments by staff
  const getGroupedAssignments = () => {
    const grouped: { [key: string]: any[] } = {};
    
    // Filter assignments based on search term and actual expiration status
    const filteredAssignments = assignments.filter(assignment => {
      // Filter by actual expiration status (not just status field)
      const isActuallyExpired = assignment.end_date && isExpired(assignment.end_date);
      if (isActuallyExpired) return false; // Don't show expired assignments in main list
      
      // Then filter by search term
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const staffName = assignment.staff_id?.full_name || '';
      const residentName = assignment.resident_id?.full_name || '';
      const staffEmail = assignment.staff_id?.email || '';
      
      return (
        staffName.toLowerCase().includes(searchLower) ||
        residentName.toLowerCase().includes(searchLower) ||
        staffEmail.toLowerCase().includes(searchLower)
      );
    });
    
    filteredAssignments.forEach(assignment => {
        const staffId = assignment.staff_id._id || assignment.staff_id;
        if (!grouped[staffId]) {
          grouped[staffId] = [];
        }
        grouped[staffId].push(assignment);
      });
    
    return grouped;
  };

  // Get expired assignments for a specific staff
  const getExpiredAssignmentsForStaff = (staffId: string) => {
    return assignments.filter(assignment => {
      const assignmentStaffId = assignment.staff_id._id || assignment.staff_id;
      const isActuallyExpired = assignment.end_date && isExpired(assignment.end_date);
      return assignmentStaffId === staffId && isActuallyExpired;
    });
  };

  // Toggle staff expansion
  const toggleStaffExpansion = (staffId: string) => {
    setExpandedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Handle update assignment
  const handleUpdate = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const updatedAssignment = await staffAssignmentsAPI.update(selectedAssignment._id, {
        staff_id: formData.staff_id,
        resident_id: formData.resident_ids[0],
        end_date: formData.end_date || undefined,
        notes: formData.notes,
        responsibilities: formData.responsibilities,
      });
      
      setAssignments(prev => 
        prev.map(a => a._id === selectedAssignment._id ? updatedAssignment : a)
      );
      setShowEditModal(false);
      resetForm();
      
      // Show success message
      setSuccessData({
        type: 'update',
        message: 'Cập nhật phân công thành công!',
        assignment: updatedAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle simple update for end date only
  const handleSimpleUpdate = async () => {
    if (!selectedAssignment) return;

    // Clear previous validation errors
    setValidationErrors({});

    // Validate end date
    const endDateError = Validator.required(simpleEditForm.end_date, 'Ngày kết thúc');
    if (endDateError) {
      setValidationErrors({ end_date: endDateError.message });
      return;
    }

    // Validate date format and logic
    if (simpleEditForm.end_date) {
      const dateError = Validator.date(simpleEditForm.end_date, 'Ngày kết thúc', { 
        allowFuture: true 
      });
      if (dateError) {
        setValidationErrors({ end_date: dateError.message });
        return;
      }

      // Check if end date is before assignment date
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
      const updatedAssignment = await staffAssignmentsAPI.update(selectedAssignment._id, {
        end_date: simpleEditForm.end_date || undefined,
      });
      
      setAssignments(prev => 
        prev.map(a => a._id === selectedAssignment._id ? updatedAssignment : a)
      );
      setShowEditModal(false);
      setSimpleEditForm({ end_date: '' });
      setSelectedAssignment(null);
      setValidationErrors({});
      
      // Show success message
      setSuccessData({
        type: 'update',
        message: 'Cập nhật ngày kết thúc thành công!',
        assignment: updatedAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật ngày kết thúc. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete assignment
  const handleDelete = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      await staffAssignmentsAPI.delete(selectedAssignment._id);
      setAssignments(prev => prev.filter(a => a._id !== selectedAssignment._id));
      setShowDeleteModal(false);
      
      // Show success message
      setSuccessData({
        type: 'delete',
        message: 'Xóa phân công thành công!',
        assignment: selectedAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      staff_id: '',
      resident_ids: [],
      end_date: '',
      notes: '',
      responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setSelectedAssignment(null);
  };

  // Open edit modal
  const openEditModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFormData({
      staff_id: assignment.staff_id._id || assignment.staff_id,
      resident_ids: [assignment.resident_id._id || assignment.resident_id],
      end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : '',
      notes: assignment.notes || '',
      responsibilities: assignment.responsibilities || ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setShowEditModal(true);
  };

  // Open simple edit modal for end date only
  const openSimpleEditModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSimpleEditForm({
      end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return formatDateDDMMYYYY(dateString);
  };

  // Get status badge based on actual expiration date
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

  // Get staff info
  const getStaffInfo = (staffId: string) => {
    const staff = staffs.find(staff => staff._id === staffId);
    if (staff) {
      console.log('Staff info:', { 
        id: staffId, 
        name: staff.full_name, 
        avatar: staff.avatar,
        processedAvatarUrl: staff.avatar ? processAvatarUrl(staff.avatar) : 'No avatar'
      });
    }
    return staff;
  };

  // Check if assignment is expiring soon (within 7 days)
  const isExpiringSoon = (endDate: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  // Check if assignment is expired
  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  // Count expiring assignments
  const expiringAssignments = assignments.filter(assignment => 
    isExpiringSoon(assignment.end_date) && !isExpired(assignment.end_date)
  );

  // Count expired assignments
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
      {/* Background decorations */}
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
          {/* Enhanced Header Section */}
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
          {/* Decorative background elements */}
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
              {/* Enhanced Back Button */}
                  <Link
                    href="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.color = '#64748b';
                }}
                    title="Quay lại trang Admin"
                  >
                <ArrowLeftIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </Link>
                  
              {/* Enhanced Icon */}
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
                    
              {/* Enhanced Title Section */}
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
                  Quản lý tất cả phân công giữa nhân viên và người cao tuổi một cách hiệu quả
                </p>
                  </div>
                </div>

                        {/* Enhanced Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Search Box */}
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
                    placeholder="Tìm kiếm theo tên nhân viên, người cao tuổi..."
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

              {/* Enhanced Refresh Button */}
                    <button
                      onClick={loadData}
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
                    
              {/* Enhanced Create Button */}
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

      {/* Enhanced Error Message */}
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
            {/* Decorative background */}
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

      {/* Main Content */}
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
              {/* Decorative background */}
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
                Danh sách phân công theo nhân viên
              </h2>
                </div>
                
                {/* Search Results Indicator */}
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
                  : 'Quản lý tất cả phân công được nhóm theo từng nhân viên một cách trực quan và hiệu quả'
                }
              </p>
            </div>
            
            {Object.keys(groupedAssignments).length === 0 ? (
              searchTerm ? (
                // No search results
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
                    {/* Decorative background */}
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
                        Không có nhân viên hoặc người cao tuổi nào phù hợp với từ khóa "{searchTerm}"
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
                  {/* Decorative background */}
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
                      Bắt đầu tạo phân công mới để quản lý nhân viên và người cao tuổi một cách hiệu quả
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
                      {/* Enhanced Staff Header */}
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
                        {/* Decorative background */}
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
                                // Thử lấy avatar từ assignment data trước, nếu không có thì dùng staff data
                                const staffAvatar = staffAssignments[0]?.staff_id?.avatar || staff?.avatar;
                                const staffName = staffAssignments[0]?.staff_id?.full_name || staff?.full_name;
                                
                                // Luôn hiển thị avatar mặc định màu xám
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
                                      // Khi avatar lỗi, thay thế bằng avatar mặc định
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
                                    đang quản lý {staffAssignments.length} người cao tuổi 
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
                          
                          {/* Expand/Collapse Button */}
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

                      {/* Staff Assignments Details */}
                      {isExpanded && (
                        <div className="bg-white">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Người cao tuổi
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
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-md overflow-hidden">
                                          <img
                                            src={assignment.resident_id?.avatar ? getAvatarUrlWithFallback(assignment.resident_id.avatar) : "/default-avatar.svg"}
                                            alt={assignment.resident_id?.full_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              // Khi avatar lỗi, thay thế bằng avatar mặc định
                                              e.currentTarget.src = "/default-avatar.svg";
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <div className="grid grid-cols-1 gap-1">
                                            <div className="flex items-center">
                                              <span className="text-sm font-semibold text-gray-900">
                                                {assignment.resident_id?.full_name}
                                              </span>
                                            </div>
                                            {assignment.resident_id?.bed_id?.room_id?.room_number || assignment.resident_id?.room_number && (
                                              <div className="text-sm text-gray-600">
                                                Phòng {assignment.resident_id?.bed_id?.room_id?.room_number || assignment.resident_id?.room_number}
                                              </div>
                                            )}
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
                                
                                {/* Hidden rows for additional assignments */}
                                {staffAssignments.slice(10).map((assignment) => (
                                  <tr key={assignment._id} id={`hidden-${staffId}`} className="hidden hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-md overflow-hidden">
                                          <img
                                            src={assignment.resident_id?.avatar ? getAvatarUrlWithFallback(assignment.resident_id.avatar) : "/default-avatar.svg"}
                                            alt={assignment.resident_id?.full_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              // Khi avatar lỗi, thay thế bằng avatar mặc định
                                              e.currentTarget.src = "/default-avatar.svg";
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <div className="grid grid-cols-1 gap-1">
                                            <div className="flex items-center">
                                              <span className="text-sm font-semibold text-gray-900">
                                                {assignment.resident_id?.full_name}
                                              </span>
                                            </div>
                                            {assignment.resident_id?.bed_id?.room_id?.room_number || assignment.resident_id?.room_number && (
                                              <div className="text-sm text-gray-600">
                                                Phòng {assignment.resident_id?.bed_id?.room_id?.room_number || assignment.resident_id?.room_number}
                                              </div>
                                            )}
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
                            
                            {/* Show more assignments if there are more than 10 */}
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
                                          // Show all
                                          hiddenRows.forEach(row => row.classList.remove('hidden'));
                                          showMoreBtn.textContent = 'Thu gọn';
                                        } else {
                                          // Hide extra
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
                          
                          {/* Expired Assignments Section */}
                          {(() => {
                            const expiredAssignments = getExpiredAssignmentsForStaff(staffId);
                            if (expiredAssignments.length > 0) {
                              const maxVisible = 3; // Chỉ hiển thị tối đa 3 phân công hết hạn
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
                                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3 shadow-sm overflow-hidden flex-shrink-0">
                                              <img
                                                src={assignment.resident_id?.avatar ? getAvatarUrlWithFallback(assignment.resident_id.avatar) : "/default-avatar.svg"}
                                                alt={assignment.resident_id?.full_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  // Khi avatar lỗi, thay thế bằng avatar mặc định
                                                  e.currentTarget.src = "/default-avatar.svg";
                                                }}
                                              />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-medium text-gray-900 truncate">
                                                {assignment.resident_id?.full_name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Hết hạn: {formatDate(assignment.end_date)}
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
                                      
                                      {/* Show more button if there are more expired assignments */}
                                      {hasMore && (
                                        <button
                                          onClick={() => {
                                            // Toggle to show all expired assignments
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
                                      
                                      {/* Hidden section with all expired assignments */}
                                      {hasMore && (
                                        <div id={`expired-${staffId}`} style={{ display: 'none' }} className="space-y-2">
                                          {expiredAssignments.slice(maxVisible).map((assignment) => (
                                            <div key={assignment._id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                                              <div className="flex items-center min-w-0 flex-1">
                                                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3 shadow-sm overflow-hidden flex-shrink-0">
                                                  <img
                                                    src={assignment.resident_id?.avatar ? getAvatarUrlWithFallback(assignment.resident_id.avatar) : "/default-avatar.svg"}
                                                    alt={assignment.resident_id?.full_name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                      // Khi avatar lỗi, thay thế bằng avatar mặc định
                                                      e.currentTarget.src = "/default-avatar.svg";
                                                    }}
                                                  />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-medium text-gray-900 truncate">
                                                    {assignment.resident_id?.full_name}
                                                  </p>
                                                  <p className="text-xs text-gray-500">
                                                    Hết hạn: {formatDate(assignment.end_date)}
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

      {/* Edit Modal */}
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
              
              {/* Assignment Info */}
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
                      <span className="text-sm font-medium text-gray-600">Người cao tuổi:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedAssignment.resident_id?.full_name || 'N/A'}
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

              {/* End Date Input */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngày kết thúc <span style={{color: '#ef4444'}}>*</span>
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
                      // Convert dd/mm/yyyy to yyyy-mm-dd for internal storage
                      const inputValue = e.target.value;
                      const dateMatch = inputValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                      
                      if (dateMatch) {
                        const [, day, month, year] = dateMatch;
                        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        setSimpleEditForm({ ...simpleEditForm, end_date: formattedDate });
                        // Clear validation error when user enters valid date
                        if (validationErrors.end_date) {
                          setValidationErrors(prev => ({ ...prev, end_date: '' }));
                        }
                      } else if (inputValue === '') {
                        setSimpleEditForm({ ...simpleEditForm, end_date: '' });
                      } else {
                        // Keep the input value as is for partial typing
                        setSimpleEditForm({ ...simpleEditForm, end_date: inputValue });
                      }
                    }}
                    onBlur={(e) => {
                      // Validate and format on blur
                      const inputValue = e.target.value;
                      if (inputValue && !inputValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                        // Try to parse and format the date
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
                  
                  {/* Hidden date input */}
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
                
                {/* Validation Error */}
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
                    <div style={{display: 'flex', alignItems: 'center'}}>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
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

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </div>
              
              {/* Success Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {successData.message}
              </h2>
              
              {/* Success Details */}
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
                        <span className="text-gray-600">Người cao tuổi:</span>
                        <span className="font-semibold text-gray-900">
                          {successData.assignment.resident_id?.full_name || 'N/A'}
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
              
              {/* Action Button */}
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
    </div>
    </div>
    </>
  );
} 