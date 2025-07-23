"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
  CalendarDaysIcon as CalendarDaysIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { visitsAPI } from '@/lib/api';

interface Visit {
  _id: string;
  family_member_id: {
    _id: string;
    full_name: string;
  };
  visit_date: string;
  visit_time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  purpose: string;
  numberOfVisitors: number;
  notes?: string;
  residents_name: string[];
  created_at?: string;
  updated_at?: string;
}

export default function StaffVisitsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load visits data
  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await visitsAPI.getAll();
      console.log('Visits data:', data);
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      completed: {
        label: 'Hoàn thành',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#86efac',
        icon: CheckCircleIcon
      },
      scheduled: {
        label: 'Đã lên lịch',
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#93c5fd',
        icon: CalendarDaysIcon
      },
      pending: {
        label: 'Chờ duyệt',
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: ClockIcon
      },
      cancelled: {
        label: 'Đã hủy',
        color: '#ef4444',
        bg: '#fef2f2',
        border: '#fca5a5',
        icon: XCircleIcon
      }
    };
    return configs[status] || configs.pending;
  };

  // Filter and sort visits (newest first)
  const filteredVisits = visits
    .filter(visit => {
      const matchesSearch = 
        visit.family_member_id.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.residents_name.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
      
      const matchesDate = !dateFilter || 
        new Date(visit.visit_date).toDateString() === dateFilter.toDateString();
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      // Sort by created_at first (newest first), then by visit_date (newest first)
      const dateA = new Date(a.created_at || a.visit_date);
      const dateB = new Date(b.created_at || b.visit_date);
      return dateB.getTime() - dateA.getTime();
    });

  // Modal management
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

  const handleViewDetail = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #f59e0b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `
      }} />
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
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
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '1rem',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}>
                    <CalendarDaysIconSolid style={{ width: '2rem', height: '2rem', color: 'white' }} />
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Quản Lý Lịch Thăm
                    </h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Theo dõi và quản lý các lịch hẹn thăm viếng của gia đình
                    </p>
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Tổng lịch thăm:
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                    {filteredVisits.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
              {/* Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tìm kiếm
                </label>
                <div style={{ position: 'relative' }}>
                  <MagnifyingGlassIcon style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#9ca3af'
                  }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên người thăm, mục đích, người được thăm..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>


             
            </div>
          </div>

          {/* Visits List */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: 0
              }}>
                Danh sách lịch thăm
              </h2>
              
            </div>

            {filteredVisits.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <CalendarDaysIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem 0' }}>
                  {searchTerm || statusFilter !== 'all' || dateFilter ? 'Không tìm thấy lịch thăm nào' : 'Chưa có lịch thăm nào'}
                </p>
                <p style={{ margin: 0 }}>
                  {searchTerm || statusFilter !== 'all' || dateFilter ? 'Thử thay đổi bộ lọc để xem thêm kết quả' : 'Các lịch hẹn thăm viếng sẽ được hiển thị tại đây'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {filteredVisits.map((visit) => {
                    const statusConfig = getStatusConfig(visit.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div
                        key={visit._id}
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          padding: '1.5rem',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <div style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}>
                                {visit.family_member_id.full_name.charAt(0)}
                              </div>
                              <div>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  fontWeight: 500,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.025em',
                                  marginBottom: '0.25rem'
                                }}>
                                  Người đặt lịch
                                </div>
                                <h3 style={{
                                  fontSize: '1.125rem',
                                  fontWeight: 600,
                                  color: '#1f2937',
                                  margin: '0 0 0.25rem 0'
                                }}>
                                  {visit.family_member_id.full_name}
                                </h3>
                                <p style={{
                                  fontSize: '0.875rem',
                                  color: '#6b7280',
                                  margin: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <UsersIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                                  Thăm: {visit.residents_name.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              background: statusConfig.bg,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.border}`
                            }}>
                              <StatusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                              {statusConfig.label}
                            </span>
                            
                            <button
                              title="Xem chi tiết lịch thăm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(visit);
                              }}
                              style={{
                                padding: '0.5rem',
                                background: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EyeIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <CalendarDaysIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Ngày & Giờ</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
                                {format(new Date(visit.visit_date), 'dd/MM/yyyy', { locale: vi })} - {visit.visit_time}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <ClockIcon style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Thời gian</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
                                {visit.duration} phút
                              </div>
                            </div>
                          </div>

                        

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <DocumentTextIcon style={{ width: '1rem', height: '1rem', color: '#6366f1' }} />
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Mục đích</div>
                              <div style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: 600, 
                                color: '#1f2937',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {visit.purpose}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVisit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2rem 2rem 1rem 2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <EyeIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Chi tiết lịch thăm
                </h2>
              </div>
              <button
                title="Đóng"
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem'
                }}
              >
                <XCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Visitor Info */}
                <div style={{
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}>
                      {selectedVisit.family_member_id.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                        {selectedVisit.family_member_id.full_name}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Người đặt lịch thăm
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: getStatusConfig(selectedVisit.status).bg,
                    color: getStatusConfig(selectedVisit.status).color,
                    border: `1px solid ${getStatusConfig(selectedVisit.status).border}`
                  }}>
                    {React.createElement(getStatusConfig(selectedVisit.status).icon, { 
                      style: { width: '1rem', height: '1rem' } 
                    })}
                    {getStatusConfig(selectedVisit.status).label}
                  </div>
                </div>

                {/* Visit Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Ngày thăm
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      {format(new Date(selectedVisit.visit_date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Giờ thăm
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      {selectedVisit.visit_time}
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Thời gian
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      {selectedVisit.duration} phút
                    </div>
                  </div>

                </div>

                {/* Purpose */}
                <div style={{
                  padding: '1.5rem',
                  background: '#fffbeb',
                  borderRadius: '0.75rem',
                  border: '1px solid #fde68a'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#92400e', margin: '0 0 0.5rem 0' }}>
                    Mục đích thăm
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                    {selectedVisit.purpose}
                  </p>
                </div>

                {/* Residents */}
                <div style={{
                  padding: '1.5rem',
                  background: '#f0f9ff',
                  borderRadius: '0.75rem',
                  border: '1px solid #7dd3fc'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0369a1', margin: '0 0 1rem 0' }}>
                    Người được thăm ({selectedVisit.residents_name.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedVisit.residents_name.map((name, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: '#0369a1',
                          color: 'white',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedVisit.notes && (
                  <div style={{
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>
                      Ghi chú
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      {selectedVisit.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 