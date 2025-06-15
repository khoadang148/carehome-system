"use client";

import { useState } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface VisitRequest {
  id: string;
  visitorName: string;
  relationship: string;
  residentName: string;
  residentId: string;
  requestedDate: string;
  requestedTime: string;
  duration: number; // in hours
  purpose: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  visitorPhone: string;
  visitorEmail: string;
  emergencyContact?: string;
}

export default function VisitApprovalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<VisitRequest[]>([
    {
      id: '1',
      visitorName: 'Nguyễn Văn Minh',
      relationship: 'Con trai',
      residentName: 'Nguyễn Thị Lan',
      residentId: 'R001',
      requestedDate: '2024-01-20',
      requestedTime: '14:00',
      duration: 2,
      purpose: 'Thăm hỏi sức khỏe mẹ',
      notes: 'Mẹ tôi đang cần được chăm sóc đặc biệt sau khi mới xuất viện',
      status: 'pending',
      submittedAt: '2024-01-15T10:30:00',
      visitorPhone: '0912345678',
      visitorEmail: 'minh.nguyen@email.com',
      emergencyContact: '0987654321'
    },
    {
      id: '2',
      visitorName: 'Trần Thị Mai',
      relationship: 'Con gái',
      residentName: 'Trần Văn Hùng',
      residentId: 'R002',
      requestedDate: '2024-01-22',
      requestedTime: '10:00',
      duration: 3,
      purpose: 'Đưa thuốc và thăm hỏi',
      status: 'pending',
      submittedAt: '2024-01-16T14:20:00',
      visitorPhone: '0923456789',
      visitorEmail: 'mai.tran@email.com'
    },
    {
      id: '3',
      visitorName: 'Lê Văn Tú',
      relationship: 'Cháu',
      residentName: 'Lê Thị Hoa',
      residentId: 'R003',
      requestedDate: '2024-01-18',
      requestedTime: '16:00',
      duration: 1,
      purpose: 'Thăm bà ngoại',
      status: 'approved',
      submittedAt: '2024-01-12T09:15:00',
      reviewedAt: '2024-01-13T11:00:00',
      reviewedBy: 'Admin',
      visitorPhone: '0934567890',
      visitorEmail: 'tu.le@email.com'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<VisitRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.relationship.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    setRequests(requests.map(request => 
      request.id === id ? {
        ...request,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin'
      } : request
    ));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(request => 
      request.id === id ? {
        ...request,
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin'
      } : request
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'pending': return 'Chờ duyệt';
      default: return 'Không xác định';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Phê duyệt Yêu cầu Thăm viếng
          </h1>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem 0' }}>
            Quản lý và phê duyệt các yêu cầu thăm người thân
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingCount}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Chờ duyệt</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{approvedCount}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Đã duyệt</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{rejectedCount}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Từ chối</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlassIcon style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.25rem',
                height: '1.25rem',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Tìm kiếm yêu cầu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Người thăm</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Người cao tuổi</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Thời gian</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Mục đích</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Trạng thái</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{request.visitorName}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{request.relationship}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{request.visitorPhone}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{request.residentName}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>ID: {request.residentId}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                          {new Date(request.requestedDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {request.requestedTime} ({request.duration}h)
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#374151'
                      }}>
                        {request.purpose}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: getStatusColor(request.status),
                        color: 'white'
                      }}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.5rem',
                                cursor: 'pointer'
                              }}
                            >
                              <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.5rem',
                                cursor: 'pointer'
                              }}
                            >
                              <XCircleIcon style={{ width: '1rem', height: '1rem' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
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
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Chi tiết Yêu cầu Thăm viếng</h2>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Visitor Info */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Thông tin người thăm
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Họ tên</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.visitorName}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Mối quan hệ</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.relationship}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Số điện thoại</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.visitorPhone}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Email</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.visitorEmail}</div>
                    </div>
                  </div>
                  {selectedRequest.emergencyContact && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Liên hệ khẩn cấp</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.emergencyContact}</div>
                    </div>
                  )}
                </div>

                {/* Visit Info */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Thông tin thăm viếng
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Người cao tuổi</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.residentName} (ID: {selectedRequest.residentId})</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Ngày thăm</label>
                      <div style={{ color: '#1f2937' }}>
                        {new Date(selectedRequest.requestedDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Thời gian</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.requestedTime}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Thời lượng</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.duration} giờ</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Mục đích</label>
                    <div style={{ color: '#1f2937' }}>{selectedRequest.purpose}</div>
                  </div>
                  {selectedRequest.notes && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Ghi chú</label>
                      <div style={{ color: '#1f2937' }}>{selectedRequest.notes}</div>
                    </div>
                  )}
                </div>

                {/* Status Info */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClockIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Trạng thái xử lý
                  </h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Ngày gửi yêu cầu</label>
                      <div style={{ color: '#1f2937' }}>
                        {new Date(selectedRequest.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Trạng thái</label>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: getStatusColor(selectedRequest.status),
                        color: 'white'
                      }}>
                        {getStatusLabel(selectedRequest.status)}
                      </span>
                    </div>
                    {selectedRequest.reviewedAt && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Ngày xét duyệt</label>
                          <div style={{ color: '#1f2937' }}>
                            {new Date(selectedRequest.reviewedAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Người xét duyệt</label>
                          <div style={{ color: '#1f2937' }}>{selectedRequest.reviewedBy}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Phê duyệt
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <XCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Từ chối
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    flex: selectedRequest.status === 'pending' ? 0.5 : 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}