"use client";

import { useEffect, useState } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface VisitRequest {
  id: string;
  type: 'visit';
  visitorName: string;
  relationship: string;
  residentName: string;
  residentId: string;
  requestedDate: string;
  requestedTime: string;
  duration: number;
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

interface ServiceRequest {
  id: string;
  type: 'service';
  familyName: string;
  residentName: string;
  residentId: string;
  packageName: string;
  packagePrice: number;
  requestedStartDate: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  familyPhone: string;
  familyEmail: string;
  notes?: string;
}

type ApprovalRequest = VisitRequest | ServiceRequest;

export default function ActivityApprovalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    // Visit requests
    {
      id: 'V1',
      type: 'visit',
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
      id: 'V2',
      type: 'visit',
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
    // Service package requests
    {
      id: 'S1',
      type: 'service',
      familyName: 'Nguyễn Văn An',
      residentName: 'Nguyễn Thị Bình',
      residentId: 'R004',
      packageName: 'Gói Nâng Cao',
      packagePrice: 25000000,
      requestedStartDate: '2024-02-01',
      status: 'pending',
      submittedAt: '2024-01-14T09:00:00',
      familyPhone: '0945678901',
      familyEmail: 'an.nguyen@email.com',
      notes: 'Cần chăm sóc đặc biệt cho người bệnh tiểu đường'
    },
    {
      id: 'S2',
      type: 'service',
      familyName: 'Lê Thị Cẩm',
      residentName: 'Lê Văn Đức',
      residentId: 'R005',
      packageName: 'Gói Cao Cấp',
      packagePrice: 35000000,
      requestedStartDate: '2024-02-15',
      status: 'pending',
      submittedAt: '2024-01-17T11:30:00',
      familyPhone: '0956789012',
      familyEmail: 'cam.le@email.com',
      notes: 'Yêu cầu phòng riêng và chăm sóc y tế 24/7'
    },
    // Approved items
    {
      id: 'V3',
      type: 'visit',
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      (request.type === 'visit' && (
        (request as VisitRequest).visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request as VisitRequest).relationship.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
      (request.type === 'service' && (
        (request as ServiceRequest).familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request as ServiceRequest).packageName.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  useEffect(() => {
    if (showDetailModal) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };



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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px -10px rgba(102, 126, 234, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '1rem',
              padding: '1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <CheckCircleIcon style={{ 
                width: '2rem', 
                height: '2rem', 
                color: '#ffffff'
              }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#ffffff',
                marginBottom: '0.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                Phê duyệt hoạt động
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
                fontWeight: '500',
                margin: 0
              }}>
                Quản lý yêu cầu thăm viếng và đăng ký gói dịch vụ
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '300px' }}>
              <MagnifyingGlassIcon style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                color: '#9ca3af',
                pointerEvents: 'none',
                zIndex: 1
              }} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  position: 'relative',
                  zIndex: 0
                }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="all">Tất cả loại</option>
              <option value="visit">Lịch thăm</option>
              <option value="service">Gói dịch vụ</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white'
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
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {filteredRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              Không có yêu cầu nào phù hợp với tiêu chí tìm kiếm
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Loại</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Người yêu cầu</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cư dân</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Chi tiết</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ngày gửi</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {request.type === 'visit' ? (
                            <>
                              <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#10b981' }}>Lịch thăm</span>
                            </>
                          ) : (
                            <>
                              <BuildingLibraryIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#3b82f6' }}>Gói dịch vụ</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {request.type === 'visit' ? (request as VisitRequest).visitorName : (request as ServiceRequest).familyName}
                          </div>
                          {request.type === 'visit' && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {(request as VisitRequest).relationship}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{request.residentName}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{request.residentId}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {request.type === 'visit' ? (
                          <div>
                            <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                              {(request as VisitRequest).requestedDate} - {(request as VisitRequest).requestedTime}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {(request as VisitRequest).purpose}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                              {(request as ServiceRequest).packageName}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {formatCurrency((request as ServiceRequest).packagePrice)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {new Date(request.submittedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: `${getStatusColor(request.status)}20`,
                          color: getStatusColor(request.status)
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
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Xem chi tiết"
                          >
                            <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #10b981',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Phê duyệt"
                              >
                                <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                              </button>
                              
                              <button
                                onClick={() => handleReject(request.id)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #ef4444',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Từ chối"
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
          )}
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative'
          }}>
            {/* Header with gradient */}
            <div style={{
              background: selectedRequest.type === 'visit' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '1.5rem 1.5rem 0 0',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background decorative elements */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(40px)'
              }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {selectedRequest.type === 'visit' ? (
                      <CalendarDaysIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ffffff' }} />
                    ) : (
                      <BuildingLibraryIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ffffff' }} />
                    )}
                  </div>
                  <div>
                    <h2 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      color: '#ffffff', 
                      margin: 0,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      Chi tiết {selectedRequest.type === 'visit' ? 'lịch thăm' : 'gói dịch vụ'}
                    </h2>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.875rem',
                      margin: '0.25rem 0 0 0',
                      fontWeight: '500'
                    }}>
                      Mã yêu cầu: {selectedRequest.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem' }}>
              <div style={{ 
                display: 'grid', 
                gap: '1.5rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
              }}>
                {selectedRequest.type === 'visit' ? (
                  <>
                    {/* Visitor Information Section */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                        Thông tin người thăm
                      </h3>
                      
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Họ và tên:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as VisitRequest).visitorName}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Mối quan hệ:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as VisitRequest).relationship}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Số điện thoại:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as VisitRequest).visitorPhone}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Email:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as VisitRequest).visitorEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visit Details Section */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                        Chi tiết lịch thăm
                      </h3>
                      
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Cư dân được thăm:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {selectedRequest.residentName} ({selectedRequest.residentId})
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Ngày và giờ thăm:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as VisitRequest).requestedDate} - {(selectedRequest as VisitRequest).requestedTime} 
                            ({(selectedRequest as VisitRequest).duration} giờ)
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Mục đích thăm:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as VisitRequest).purpose}
                          </p>
                        </div>
                        
                        {(selectedRequest as VisitRequest).notes && (
                          <div>
                            <label style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: '#475569',
                              display: 'block',
                              marginBottom: '0.25rem'
                            }}>
                              Ghi chú thêm:
                            </label>
                            <p style={{ 
                              margin: 0, 
                              color: '#1e293b',
                              fontSize: '1rem',
                              fontWeight: '500',
                              padding: '0.5rem 0.75rem',
                              background: 'white',
                              borderRadius: '0.5rem',
                              border: '1px solid #e2e8f0'
                            }}>
                              {(selectedRequest as VisitRequest).notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Family Information Section */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                        Thông tin người đăng ký
                      </h3>
                      
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Họ và tên:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as ServiceRequest).familyName}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Cư dân thụ hưởng:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {selectedRequest.residentName} ({selectedRequest.residentId})
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Số điện thoại:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as ServiceRequest).familyPhone}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Email:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as ServiceRequest).familyEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service Package Section */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <BuildingLibraryIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                        Chi tiết gói dịch vụ
                      </h3>
                      
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Tên gói dịch vụ:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as ServiceRequest).packageName}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Giá gói dịch vụ:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#dc2626',
                            fontSize: '1.125rem',
                            fontWeight: '700',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <CurrencyDollarIcon style={{ width: '1rem', height: '1rem' }} />
                            {formatCurrency((selectedRequest as ServiceRequest).packagePrice)}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Ngày bắt đầu dự kiến:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {(selectedRequest as ServiceRequest).requestedStartDate}
                          </p>
                        </div>
                        
                        {(selectedRequest as ServiceRequest).notes && (
                          <div>
                            <label style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: '#475569',
                              display: 'block',
                              marginBottom: '0.25rem'
                            }}>
                              Ghi chú đặc biệt:
                            </label>
                            <p style={{ 
                              margin: 0, 
                              color: '#1e293b',
                              fontSize: '1rem',
                              fontWeight: '500',
                              padding: '0.5rem 0.75rem',
                              background: 'white',
                              borderRadius: '0.5rem',
                              border: '1px solid #e2e8f0'
                            }}>
                              {(selectedRequest as ServiceRequest).notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Status and Timeline Section */}
                <div style={{
                  background: 'linear-gradient(135deg, #fefefe 0%, #f8fafc 100%)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  gridColumn: selectedRequest.type === 'visit' ? '1 / -1' : '1 / -1'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                    Trạng thái và thời gian
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div>
                      <label style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#475569',
                        display: 'block',
                        marginBottom: '0.25rem'
                      }}>
                        Trạng thái hiện tại:
                      </label>
                      <div style={{ 
                        margin: 0, 
                        padding: '0.5rem 0.75rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(selectedRequest.status)
                        }} />
                        <span style={{ 
                          color: getStatusColor(selectedRequest.status),
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {getStatusLabel(selectedRequest.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#475569',
                        display: 'block',
                        marginBottom: '0.25rem'
                      }}>
                        Ngày gửi yêu cầu:
                      </label>
                      <p style={{ 
                        margin: 0, 
                        color: '#1e293b',
                        fontSize: '1rem',
                        fontWeight: '500',
                        padding: '0.5rem 0.75rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        {new Date(selectedRequest.submittedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    
                    {selectedRequest.reviewedAt && (
                      <>
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Ngày xem xét:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {new Date(selectedRequest.reviewedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#475569',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Người xem xét:
                          </label>
                          <p style={{ 
                            margin: 0, 
                            color: '#1e293b',
                            fontSize: '1rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {selectedRequest.reviewedBy}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div style={{ 
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 1rem 0'
                  }}>
                    Thao tác phê duyệt:
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #ef4444',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#dc2626';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 8px 15px -3px rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#ef4444';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      <XCircleIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                      Từ chối yêu cầu
                    </button>
                    
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #10b981',
                        backgroundColor: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#059669';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 8px 15px -3px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#10b981';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <CheckCircleIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                      Phê duyệt yêu cầu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 