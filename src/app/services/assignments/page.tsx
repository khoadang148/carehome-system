'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { residentAPI, carePlansAPI, carePlanAssignmentsAPI, userAPI } from '@/lib/api';
import { ClipboardDocumentCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';


export default function ServiceAssignmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!(user.role === 'admin' || user.role === 'staff')) {
      router.push('/');
      return;
    }
    setLoading(true);
    setError(null);
    residentAPI.getAll()
      .then(async (resList) => {
        setResidents(resList);
        // Lấy assignment cho từng resident song song
        const allAssignments = await Promise.all(
          resList.map(async (r: any) => {
            try {
              // Đảm bảo r._id là string
            const residentId = typeof r._id === 'object' && (r._id as any)?._id 
              ? (r._id as any)._id 
              : r._id;
            const data = await carePlansAPI.getByResidentId(residentId);
              return (Array.isArray(data) ? data : []).map((a: any) => ({ ...a, resident: r }));
            } catch {
              return [];
            }
          })
        );
        setAssignments(allAssignments.flat());
      })
      .catch(() => setError('Không thể tải danh sách cư dân hoặc đăng ký dịch vụ.'))
      .finally(() => setLoading(false));
  }, [user, router]);

  // Filter theo search term
  const filteredAssignments = assignments.filter(a => {
    const residentName = a.resident?.full_name || a.resident?.name || '';
    const planNames = Array.isArray(a.care_plan_ids) ? a.care_plan_ids.map((cp: any) => cp.plan_name).join(', ') : '';
    return (
      residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle view details
  const handleViewDetails = (assignmentId: string) => {
    router.push(`/services/assignments/${assignmentId}`);
  };

  // Handle edit
  const handleEdit = (assignmentId: string) => {
    router.push(`/services/assignments/${assignmentId}/edit`);
  };

  // Handle delete
  const handleDelete = (assignmentId: string) => {
    setDeleteConfirmId(assignmentId);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      await carePlanAssignmentsAPI.delete(deleteConfirmId);
      // Refresh data
      window.location.reload();
    } catch (error: any) {
      alert('Không thể xóa đăng ký dịch vụ: ' + (error.message || 'Có lỗi xảy ra'));
    }
  };



  // Get status text and color
  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'consulting': { text: 'Đang tư vấn', color: '#f59e0b' },
      'packages_selected': { text: 'Đã chọn gói', color: '#3b82f6' },
      'room_assigned': { text: 'Đã phân phòng', color: '#8b5cf6' },
      'payment_completed': { text: 'Đã thanh toán', color: '#10b981' },
      'active': { text: 'Đang sử dụng', color: '#059669' },
      'completed': { text: 'Đã hoàn thành', color: '#6b7280' },
      'cancelled': { text: 'Đã hủy', color: '#ef4444' },
      'paused': { text: 'Tạm dừng', color: '#f97316' }
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
            onClick={() => router.back()}
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
              Danh sách cư dân đã đăng ký dịch vụ
            </h1>
          </div>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: '0.25rem 0 0 0',
            fontWeight: 500
          }}>
            Tổng số đăng ký: {filteredAssignments.length}
          </p>
        </div>
        {/* Search Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tìm theo tên cư dân hoặc gói dịch vụ..."
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
              Hiển thị: {filteredAssignments.length} đăng ký
            </span>
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
                  {filteredAssignments.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>Không có dữ liệu đăng ký dịch vụ nào.</td></tr>
                  ) : (
                    filteredAssignments.map((a, idx) => (
                      <tr key={a._id + '-' + idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              overflow: 'hidden'
                            }}>
                              {a.resident?.avatar ? (
                                <img src={userAPI.getAvatarUrl(a.resident.avatar)} alt={a.resident.full_name || a.resident.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (a.resident?.full_name || a.resident?.name || '').charAt(0)
                              )}
                            </div>
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
                          {Array.isArray(a.care_plan_ids)
                            ? a.care_plan_ids.map((cp: any) => cp.description || cp.plan_name || cp.name || 'N/A').join(', ')
                            : 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {(() => {
                            const statusInfo = getStatusInfo(a.status);
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
                            {user?.role === 'admin' && (
                              <button
                                title="Xóa"
                                onClick={() => handleDelete(a._id)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #ef4444',
                                  backgroundColor: 'white',
                                  color: '#ef4444',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                                
                              </button>
                            )}
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
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
    </div>
  );
} 