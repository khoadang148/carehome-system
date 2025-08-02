"use client";

import { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAssignmentsAPI, staffAPI, residentAPI, userAPI } from '@/lib/api';

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

  // Check permissions
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load data
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [assignmentsData, staffsData, residentsData] = await Promise.all([
          staffAssignmentsAPI.getAll(),
          staffAPI.getAll(),
          residentAPI.getAll(),
        ]);
        
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        setStaffs(Array.isArray(staffsData) ? staffsData : []);
        setResidents(Array.isArray(residentsData) ? residentsData : []);
        setError('');
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        console.error('Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Group assignments by staff
  const getGroupedAssignments = () => {
    const grouped: { [key: string]: any[] } = {};
    
    assignments.forEach(assignment => {
      const staffId = assignment.staff_id._id || assignment.staff_id;
      if (!grouped[staffId]) {
        grouped[staffId] = [];
      }
      grouped[staffId].push(assignment);
    });
    
    return grouped;
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
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle simple update for end date only
  const handleSimpleUpdate = async () => {
    if (!selectedAssignment) return;

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
      
      // Show success message
      setSuccessData({
        type: 'update',
        message: 'Cập nhật ngày kết thúc thành công!',
        assignment: updatedAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật ngày kết thúc. Vui lòng thử lại.';
      alert(errorMessage);
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
      alert(errorMessage);
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
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckIcon className="w-3 h-3 mr-1" />
        Đang hoạt động
      </span>;
    } else if (status === 'expired') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        Đã hết hạn
      </span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        Không xác định
      </span>;
    }
  };

  // Get staff info
  const getStaffInfo = (staffId: string) => {
    return staffs.find(staff => staff._id === staffId);
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
        {/* Header Section */}
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
                <UserGroupIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
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
                  Quản lý phân công nhân viên
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Quản lý tất cả phân công giữa nhân viên và cư dân
                </p>
              </div>
            </div>
            <Link
              href="/admin/staff-assignments/new"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                textDecoration: 'none'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Tạo phân công mới
            </Link>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
          marginTop: '1.5rem'
        }}>
          <div style={{
            background: '#fef2f2',
            borderLeft: '4px solid #f87171',
            color: '#dc2626',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} />
              <p style={{ fontWeight: 500, margin: 0 }}>{error}</p>
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
            height: '16rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                border: '2px solid transparent',
                borderTop: '2px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem auto'
              }}></div>
              <p style={{ color: '#6b7280' }}>Đang tải dữ liệu...</p>
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                </div>
                Danh sách phân công theo nhân viên
              </h2>
              <p className="text-sm text-gray-500 mt-2">Quản lý tất cả phân công được nhóm theo từng nhân viên</p>
            </div>
            
            {Object.keys(groupedAssignments).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserGroupIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có phân công nào</h3>
                <p className="text-gray-500 mb-6">Bắt đầu tạo phân công mới cho nhân viên</p>
                <Link
                  href="/admin/staff-assignments/new"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto w-fit transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  <PlusIcon className="w-5 h-5 mr-3" />
                  Tạo phân công đầu tiên
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAssignments).map(([staffId, staffAssignments]) => {
                  const staff = getStaffInfo(staffId);
                  const isExpanded = expandedStaff.includes(staffId);
                  
                  return (
                    <div key={staffId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Staff Header */}
                      <div 
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                        onClick={() => toggleStaffExpansion(staffId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg overflow-hidden">
                              {staff?.avatar ? (
                                <img
                                  src={userAPI.getAvatarUrl(staff.avatar)}
                                  alt={staff.full_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLElement;
                                    target.style.display = 'none';
                                    const nextSibling = target.nextElementSibling as HTMLElement;
                                    if (nextSibling) {
                                      nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <span className="text-white font-bold text-lg" style={{ display: staff?.avatar ? 'none' : 'flex' }}>
                                {staff?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'NV'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-28 flex-shrink-0">Tên nhân viên:</span>
                                  <span className="text-lg font-bold text-gray-900">{staff?.full_name || 'Nhân viên không xác định'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-28 flex-shrink-0">Email:</span>
                                  <span className="text-sm text-gray-600">{staff?.email || 'Email không xác định'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-28 flex-shrink-0">Tổng:</span>
                                  <span className="text-sm text-gray-500">{staffAssignments.length} người cao tuổi được quản lý</span>
                                </div>
                              </div>
                            </div>
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
                                    Cư dân
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
                              <tbody className="bg-white divide-y divide-gray-200">
                                {staffAssignments.map((assignment) => (
                                  <tr key={assignment._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-md overflow-hidden">
                                          {assignment.resident_id?.avatar ? (
                                            <img
                                              src={userAPI.getAvatarUrl(assignment.resident_id.avatar)}
                                              alt={assignment.resident_id.full_name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                const target = e.currentTarget as HTMLElement;
                                                target.style.display = 'none';
                                                const nextSibling = target.nextElementSibling as HTMLElement;
                                                if (nextSibling) {
                                                  nextSibling.style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <span className="text-white font-bold text-sm" style={{ display: assignment.resident_id?.avatar ? 'none' : 'flex' }}>
                                            {(assignment.resident_id?.full_name || '').split(' ').map((n: string) => n[0]).join('')}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <div className="grid grid-cols-1 gap-1">
                                            <div className="flex items-center">
                                              <span className="text-sm font-semibold text-gray-900">
                                                {assignment.resident_id?.full_name}
                                              </span>
                                            </div>
                                            {assignment.resident_id?.room_number && (
                                              <div className="flex items-center">
                                               <span className="text-sm text-gray-500">
                                                  Phòng {assignment.resident_id.room_number}
                                                </span>
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
                                          {getStatusBadge(assignment.status)}
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
                          </div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <PencilIcon className="w-5 h-5 text-blue-600" />
                </div>
                Chỉnh sửa ngày kết thúc
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
                      <span className="text-sm font-medium text-gray-600">Cư dân:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedAssignment.resident_id?.full_name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Ngày phân công:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(selectedAssignment.assigned_date)}
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
                <input
                  type="date"
                  value={simpleEditForm.end_date}
                  onChange={(e) => setSimpleEditForm({ ...simpleEditForm, end_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '2px solid #e5e7eb',
                    fontSize: '0.875rem',
                    background: 'white',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Để trống nếu không muốn đặt ngày kết thúc
                </p>
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
                    'Cập nhật ngày kết thúc'
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
                        <span className="text-gray-600">Cư dân:</span>
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