'use client';
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { residentAPI, carePlansAPI, carePlanAssignmentsAPI, userAPI } from '@/lib/api';
import { ClipboardDocumentCheckIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Avatar from '@/components/Avatar';

export default function ServiceAssignmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPackageSelectModal, setShowPackageSelectModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (!(user.role === 'admin' || user.role === 'staff')) {
      router.push('/');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resList = await residentAPI.getAll();
      setResidents(resList);
      
      // Lấy assignment cho từng resident và gộp các gói dịch vụ
      const allAssignments = await Promise.all(
        resList.map(async (r: any) => {
          try {
            const residentId = typeof r._id === 'object' && (r._id as any)?._id 
              ? (r._id as any)._id 
              : r._id;
            const data = await carePlansAPI.getByResidentId(residentId);
            const assignments = Array.isArray(data) ? data : [];
            
            if (assignments.length === 0) {
              return [];
            }
            
                          // Gộp tất cả gói dịch vụ của resident này thành một assignment duy nhất
              const mergedAssignment = {
                _id: assignments[0]._id, // Sử dụng ID của assignment đầu tiên
                resident_id: residentId,
                resident: r,
                status: assignments[0].status,
                start_date: assignments[0].start_date,
                end_date: assignments[0].end_date,
                notes: assignments[0].notes,
                consultation_notes: assignments[0].consultation_notes,
                family_preferences: assignments[0].family_preferences,
                // Tính tổng chi phí từ tất cả assignments
                care_plans_monthly_cost: assignments.reduce((total: number, assignment: any) => {
                  return total + (assignment.care_plans_monthly_cost || 0);
                }, 0),
                total_monthly_cost: assignments.reduce((total: number, assignment: any) => {
                  return total + (assignment.total_monthly_cost || 0);
                }, 0),
                room_monthly_cost: assignments[0].room_monthly_cost || 0,
                selected_room_type: assignments[0].selected_room_type,
                assigned_room_id: assignments[0].assigned_room_id,
                assigned_bed_id: assignments[0].assigned_bed_id,
                additional_medications: assignments[0].additional_medications,
                // Gộp tất cả care_plan_ids từ các assignments
                care_plan_ids: assignments.reduce((allPlans: any[], assignment: any) => {
                  if (Array.isArray(assignment.care_plan_ids)) {
                    allPlans.push(...assignment.care_plan_ids);
                  }
                  return allPlans;
                }, [])
              };
            
            return [mergedAssignment];
          } catch {
            return [];
          }
        })
      );
      setAssignments(allAssignments.flat());
      setTotalItems(allAssignments.flat().length);
    } catch (error) {
      setError('Không thể tải danh sách người cao tuổi hoặc đăng ký dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  // Filter theo search term và tab
  const filteredAssignments = assignments.filter(a => {
    const residentName = a.resident?.full_name || a.resident?.name || '';
    const planNames = Array.isArray(a.care_plan_ids) ? a.care_plan_ids.map((cp: any) => cp.description || cp.plan_name || cp.name || '').join(', ') : '';
    const matchesSearch = (
      residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planNames.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!matchesSearch) return false;

    // Filter theo tab
    const isExpired = a.end_date && new Date(a.end_date) < new Date();
    
    switch (activeTab) {
      case 'active':
        return !isExpired;
      case 'expired':
        return isExpired;
      default:
        return true; // 'all' tab
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAssignments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

  // Reset to first page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Handle view details
  const handleViewDetails = (assignmentId: string) => {
    router.push(`/services/assignments/${assignmentId}`);
  };

  // Handle edit
  const handleEdit = (assignmentId: string) => {
    router.push(`/services/assignments/${assignmentId}/edit`);
  };

  // Handle delete
  const handleDelete = (assignment: any) => {
    // Chỉ admin mới được xóa
    if (user?.role !== 'admin') {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    const carePlanCount = Array.isArray(assignment.care_plan_ids) ? assignment.care_plan_ids.length : 0;
    
    if (carePlanCount > 1) {
      // Nếu có nhiều gói, hiện modal chọn gói
      setSelectedAssignment(assignment);
      setShowPackageSelectModal(true);
    } else {
      // Nếu chỉ có 1 gói, hiện modal xác nhận xóa toàn bộ
      setDeleteConfirmId(assignment._id);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    // Chỉ admin mới được xóa
    if (user?.role !== 'admin') {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
      setDeleteConfirmId(null);
      return;
    }

    try {
      await carePlanAssignmentsAPI.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      setShowSuccessModal(true);
      // Refresh data
      loadData();
    } catch (error: any) {
      toast.error('Không thể xóa đăng ký dịch vụ: ' + (error.message || 'Có lỗi xảy ra'));
    }
  };

  // Handle delete specific package
  const handleDeletePackage = async (packageId: string) => {
    if (!selectedAssignment) return;

    // Chỉ admin mới được xóa
    if (user?.role !== 'admin') {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
      setShowPackageSelectModal(false);
      setSelectedAssignment(null);
      return;
    }

    try {
      // Sử dụng API mới để xóa gói riêng lẻ
      await carePlanAssignmentsAPI.removePackage(selectedAssignment._id, packageId);

      setShowPackageSelectModal(false);
      setSelectedAssignment(null);
      setShowSuccessModal(true);
      // Refresh data
      loadData();
    } catch (error: any) {
      console.error('Error deleting package:', error);
      toast.error('Không thể xóa gói dịch vụ: ' + (error.message || 'Có lỗi xảy ra'));
    }
  };

  // Get status text and color based on assignment end date
  const getStatusInfo = (status: string, endDate?: string, carePlanIds?: any[]) => {
    // Kiểm tra nếu có ngày kết thúc và đã hết hạn
    if (endDate && new Date(endDate) < new Date()) {
      return { text: 'Đã hết hạn', color: '#ef4444' };
    }
    
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'consulting': { text: 'Đang tư vấn', color: '#f59e0b' },
      'packages_selected': { text: 'Đã chọn gói', color: '#3b82f6' },
      'room_assigned': { text: 'Đã phân phòng', color: '#8b5cf6' },
      'payment_completed': { text: 'Đã thanh toán', color: '#10b981' },
      'active': { text: 'Đang sử dụng', color: '#059669' },
      'completed': { text: 'Đã hoàn thành', color: '#6b7280' },
      'cancelled': { text: 'Đã hủy', color: '#ef4444' },
      'paused': { text: 'Tạm dừng', color: '#f97316' },
      'expired': { text: 'Đã hết hạn', color: '#ef4444' }
    };
    return statusMap[status] || { text: status, color: '#6b7280' };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations giống residents */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
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
        {/* Back Button */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => router.push('/services')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại
          </button>
        </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <ClipboardDocumentCheckIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em'
            }}>
              Danh sách người cao tuổi đã đăng ký dịch vụ
            </h1>
          </div>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: '0.25rem 0 0 0',
            fontWeight: 500
          }}>
            Tổng số đăng ký: {filteredAssignments.length} | Hiển thị: {paginatedAssignments.length} / {filteredAssignments.length}
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Tìm theo tên người cao tuổi hoặc gói dịch vụ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: 320,
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem',
                background: 'white'
              }}
            />
            <span style={{ color: '#667eea', fontWeight: 600 }}>
              Hiển thị: {paginatedAssignments.length} / {filteredAssignments.length} đăng ký
            </span>
            
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>mục/trang</span>
            </div>
          </div>
          
          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'all' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#f3f4f6',
                color: activeTab === 'all' ? 'white' : '#6b7280'
              }}
            >
              Tất cả ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'active' 
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                  : '#f3f4f6',
                color: activeTab === 'active' ? 'white' : '#6b7280'
              }}
            >
              Còn hạn ({assignments.filter(a => !(a.end_date && new Date(a.end_date) < new Date())).length})
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'expired' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                  : '#f3f4f6',
                color: activeTab === 'expired' ? 'white' : '#6b7280'
              }}
            >
              Hết hạn ({assignments.filter(a => a.end_date && new Date(a.end_date) < new Date()).length})
            </button>
          </div>
        </div>
        
        {/* Table Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải dữ liệu...</div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>{error}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', width: '25%' }}>Người cao tuổi</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', width: '45%' }}>Gói dịch vụ</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', width: '15%' }}>Trạng thái</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#374151', width: '15%' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssignments.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>Không có dữ liệu đăng ký dịch vụ nào.</td></tr>
                  ) : (
                    paginatedAssignments.map((a, idx) => (
                      <tr key={a._id + '-' + idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar
                              src={a.resident?.avatar ? userAPI.getAvatarUrl(a.resident.avatar) : undefined}
                              alt={a.resident?.full_name || a.resident?.name || 'Avatar'}
                              size="small"
                              className="w-10 h-10"
                              showInitials={true}
                              name={a.resident?.full_name || a.resident?.name || ''}
                            />
                            <div>
                              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                                {a.resident?.full_name || a.resident?.name || ''}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                                ID: {a.resident?._id || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {Array.isArray(a.care_plan_ids) && a.care_plan_ids.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {a.care_plan_ids.map((cp: any, index: number) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                  <span style={{ 
                                    color: activeTab === 'expired' ? '#ef4444' : '#059669', 
                                    fontSize: '0.75rem', 
                                    marginTop: '0.125rem',
                                    fontWeight: 'bold'
                                  }}>•</span>
                                  <span style={{ 
                                    fontSize: '0.875rem', 
                                    color: '#374151', 
                                    lineHeight: '1.4'
                                  }}>
                                    {cp.description || cp.plan_name || cp.name || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {(() => {
                            const statusInfo = getStatusInfo(a.status, a.end_date, a.care_plan_ids);
                            return (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                backgroundColor: statusInfo.color + '20',
                                color: statusInfo.color,
                                border: `1px solid ${statusInfo.color}40`
                              }}>
                                {statusInfo.text}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              title="Xem chi tiết"
                              onClick={() => handleViewDetails(a._id)}
                              style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #3b82f6',
                                backgroundColor: 'white',
                                color: '#3b82f6',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <button
                              title="Chỉnh sửa"
                              onClick={() => handleEdit(a._id)}
                              style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #059669',
                                backgroundColor: 'white',
                                color: '#059669',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginTop: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredAssignments.length)} trong tổng số {filteredAssignments.length} đăng ký
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <ChevronLeftIcon style={{ width: '1rem', height: '1rem' }} />
                Trước
              </button>
              
              {/* Page Numbers */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #d1d5db',
                        backgroundColor: currentPage === pageNum ? '#667eea' : 'white',
                        color: currentPage === pageNum ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: currentPage === pageNum ? 600 : 500
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                Sau
                <ChevronRightIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && user?.role === 'admin' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Xác nhận xóa đăng ký dịch vụ
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa đăng ký dịch vụ này? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && user?.role === 'admin' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#111827' }}>
              Xóa thành công!
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
              Đăng ký dịch vụ đã được xóa khỏi hệ thống.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Package Selection Modal */}
      {showPackageSelectModal && selectedAssignment && user?.role === 'admin' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#111827' }}>
                  Chọn gói dịch vụ để xóa
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  Người cao tuổi: {selectedAssignment.resident?.full_name || selectedAssignment.resident?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6b7280', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                Vui lòng chọn gói dịch vụ bạn muốn xóa khỏi đăng ký này:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.isArray(selectedAssignment.care_plan_ids) && selectedAssignment.care_plan_ids.map((cp: any, index: number) => (
                  <div key={cp._id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#ef4444'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  onClick={() => handleDeletePackage(cp._id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        border: '2px solid #ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fef2f2'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ef4444' }}>
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                          {cp.plan_name || cp.name || 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                          {cp.description || 'Không có mô tả'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPackageSelectModal(false);
                  setSelectedAssignment(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}