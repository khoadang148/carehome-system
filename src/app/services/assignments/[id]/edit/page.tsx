'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { carePlanAssignmentsAPI } from '@/lib/api';

export default function EditCarePlanAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const data = await carePlanAssignmentsAPI.getById(assignmentId);
        setAssignment(data);
        setStatus(data.status || '');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải thông tin phân công');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!status) {
      setError('Vui lòng chọn trạng thái');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await carePlanAssignmentsAPI.updateStatus(assignmentId, status);
      
      router.push(`/services/assignments/${assignmentId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/services/assignments/${assignmentId}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'consulting': return 'Đang tư vấn';
      case 'packages_selected': return 'Đã chọn gói';
      case 'room_assigned': return 'Đã phân phòng';
      case 'payment_completed': return 'Đã thanh toán';
      case 'active': return 'Đang hoạt động';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'paused': return 'Tạm dừng';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'consulting': return '#f59e0b';
      case 'packages_selected': return '#3b82f6';
      case 'room_assigned': return '#8b5cf6';
      case 'payment_completed': return '#10b981';
      case 'active': return '#059669';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'paused': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Đang tải...
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ color: '#ef4444', fontSize: '1.125rem' }}>{error}</div>
        <button
          onClick={() => router.push('/services/assignments')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => router.push(`/services/assignments/${assignmentId}`)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, margin: 0, color: '#111827' }}>
            Chỉnh sửa trạng thái phân công
          </h1>
        </div>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Cập nhật trạng thái của phân công dịch vụ chăm sóc
        </p>
      </div>



      {/* Edit Form */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: '#111827' }}>
          Cập nhật trạng thái
        </h3>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Trạng thái mới *
            </label>
                          <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
              >
                <option value="">Chọn trạng thái</option>
                <option value="consulting">Đang tư vấn</option>
                <option value="packages_selected">Đã chọn gói</option>
                <option value="room_assigned">Đã phân phòng</option>
                <option value="payment_completed">Đã thanh toán</option>
                <option value="active">Đang hoạt động</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="paused">Tạm dừng</option>
              </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
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
              type="submit"
              disabled={saving || !status}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: saving || !status ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: saving || !status ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 