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
import { format, isToday, isYesterday, isTomorrow, isAfter, isBefore, startOfDay } from 'date-fns';
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
  const [timeStatusFilter, setTimeStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);


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

  // Get time-based status for a visit
  const getTimeBasedStatus = (visit: Visit) => {
    const visitDate = new Date(visit.visit_date);
    const today = startOfDay(new Date());
    const visitDay = startOfDay(visitDate);

    if (isBefore(visitDay, today)) {
      return 'past';
    } else if (isToday(visitDate)) {
      return 'today';
    } else if (isAfter(visitDay, today)) {
      return 'upcoming';
    }
    
    return 'today'; // fallback
  };

  // Get status configuration based on time
  const getStatusConfig = (visit: Visit) => {
    const timeStatus = getTimeBasedStatus(visit);
    
    const configs = {
      past: {
        label: 'Trạng thái: Đã qua',
        color: '#6b7280',
        bg: '#f3f4f6',
        border: '#d1d5db',
        icon: CheckCircleIcon
      },
      today: {
        label: 'Trạng thái: Hôm nay',
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: CalendarDaysIcon
      },
      upcoming: {
        label: 'Trạng thái: Sắp tới',
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#93c5fd',
        icon: ClockIcon
      }
    };
    return configs[timeStatus] || configs.upcoming;
  };

  // Filter and sort visits (newest first)
  const filteredVisits = visits
    .filter(visit => {
      const matchesSearch = 
        (visit.family_member_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        visit.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.residents_name.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTimeStatus = timeStatusFilter === 'all' || getTimeBasedStatus(visit) === timeStatusFilter;
      
      const matchesDate = !dateFilter || 
        new Date(visit.visit_date).toDateString() === dateFilter.toDateString();
      
      return matchesSearch && matchesTimeStatus && matchesDate;
    })
    .sort((a, b) => {
      // Sort by visit_date first (newest first), then by created_at
      const dateA = new Date(a.visit_date);
      const dateB = new Date(b.visit_date);
      if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime();
      }
      // If same date, sort by created_at
      const createdA = new Date(a.created_at || a.visit_date);
      const createdB = new Date(b.created_at || b.visit_date);
      return createdB.getTime() - createdA.getTime();
    });



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

              {/* Time Status Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Trạng thái thời gian
                </label>
                <select
                  value={timeStatusFilter}
                  onChange={(e) => setTimeStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="past">Đã qua</option>
                  <option value="today">Hôm nay</option>
                  <option value="upcoming">Sắp tới</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Lọc theo ngày
                </label>
                <DatePicker
                  selected={dateFilter}
                  onChange={(date) => setDateFilter(date)}
                  placeholderText="Chọn ngày..."
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  isClearable
                  customInput={
                    <input
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  }
                />
              </div>

              {/* Clear Filters */}
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTimeStatusFilter('all');
                    setDateFilter(null);
                  }}
                  title="Xóa tất cả bộ lọc"
                  style={{
                    padding: '0.75rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <FunnelIcon style={{ width: '1rem', height: '1rem' }} />
                </button>
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
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#4f46e5',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
                  {searchTerm || timeStatusFilter !== 'all' || dateFilter ? 'Không tìm thấy lịch thăm nào' : 'Chưa có lịch thăm nào'}
                </p>
                <p style={{ margin: 0 }}>
                  {searchTerm || timeStatusFilter !== 'all' || dateFilter ? 'Thử thay đổi bộ lọc để xem thêm kết quả' : 'Các lịch hẹn thăm viếng sẽ được hiển thị tại đây'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {filteredVisits.map((visit) => {
                    const statusConfig = getStatusConfig(visit);
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
                                {visit.family_member_id?.full_name?.charAt(0) || '?'}
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
                                  {visit.family_member_id?.full_name}
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
                                  Thăm người thân: {visit.residents_name.join(', ')}
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


    </>
  );
} 