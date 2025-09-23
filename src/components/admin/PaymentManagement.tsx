"use client";

import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { billsAPI, residentAPI } from '@/lib/api';
import EmptyState from './EmptyState';
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';

interface PaymentTransaction {
  id: string;
  orderCode: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  completedAt?: string;
  residentName: string;
  billId: string;
  dueDate?: string;
}

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  growthPercentage: number;
}

interface FilterOptions {
  status: string;
  year: number;
  month: number;
}

export default function PaymentManagement() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    growthPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 0, label: 'Tất cả tháng' },
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];

  useEffect(() => {
    fetchPaymentData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      const bills = await billsAPI.getAll();
      console.log('✅ Bills loaded:', bills?.length || 0);
      console.log('📋 Sample bill:', bills?.[0]);
      
      const residentsRaw = await residentAPI.getAll();
      const residents = Array.isArray(residentsRaw)
        ? residentsRaw
        : (residentsRaw && Array.isArray((residentsRaw as any).data))
          ? (residentsRaw as any).data
          : [];
      console.log('✅ Residents loaded:', residents?.length || 0);
      console.log('👤 Sample resident:', residents?.[0]);
      
      // Filter residents by allowed statuses, and build map and allowed id set
      const allowedStatuses = new Set(['admitted','active','discharged','deceased','accepted']);
      const residentsMap = new Map<string, string>();
      const allowedResidentIds = new Set<string>();
      (residents as any[]).forEach((r: any) => {
        const status = String(r?.status || '').toLowerCase();
        if (!allowedStatuses.has(status)) return;
        const id: string = (r._id || r.id || '').toString();
        if (!id) return;
        const name: string | undefined = r.full_name || r.name || r.fullName || r.resident_name;
        if (name) residentsMap.set(id, name);
        allowedResidentIds.add(id);
      });
      
      console.log('✅ Residents mapped:', residentsMap.size);
      console.log('🗺️ Sample mapping:', Array.from(residentsMap.entries()).slice(0, 3));
      
      const transactions: PaymentTransaction[] = [];
      (bills as any[]).forEach((bill: any) => {
        let residentId: any = bill.resident_id || bill.residentId || bill.resident;
        let residentObj: any = null;
        if (typeof residentId === 'object' && residentId !== null) {
          residentObj = residentId;
          residentId = residentId._id || residentId.id || residentId;
        }
        residentId = String(residentId || '');

        // Skip bills if resident is not allowed or not identifiable
        if (!residentId || (!allowedResidentIds.has(residentId) && !allowedStatuses.has(String(residentObj?.status || '').toLowerCase()))) {
          return;
        }

        const residentName = residentsMap.get(residentId) || residentObj?.full_name || residentObj?.name || residentObj?.fullName;
        if (!residentName) return;

        transactions.push({
          id: bill._id,
          orderCode: bill.order_code || `BILL${String(bill._id || '').slice(-6)}`,
          amount: bill.amount,
          status: bill.status === 'paid' ? 'completed' : bill.status === 'pending' ? 'pending' : bill.status === 'cancelled' ? 'cancelled' : 'failed',
          description: bill.title || bill.notes || 'Thanh toán dịch vụ chăm sóc',
          createdAt: bill.created_at,
          completedAt: bill.paid_date,
          residentName,
          billId: bill._id,
          dueDate: bill.due_date || bill.dueDate,
        });
      });

      setTransactions(transactions);
      console.log('✅ Payment management data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching payment data:', error);
      setTransactions([]);
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.month > 0) {
      filtered = filtered.filter(t => {
        // Sử dụng dueDate thay vì createdAt để filter theo tháng
        const dueDate = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
        return dueDate.getFullYear() === filters.year && dueDate.getMonth() + 1 === filters.month;
      });
    } else {
      filtered = filtered.filter(t => {
        // Sử dụng dueDate thay vì createdAt để filter theo năm
        const dueDate = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
        return dueDate.getFullYear() === filters.year;
      });
    }

    setFilteredTransactions(filtered);
    calculateStats(filtered);
    
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total);
  };

  const calculateStats = (transactions: PaymentTransaction[]) => {
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    const failedTransactions = transactions.filter(t => t.status === 'failed');

    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

    const growthPercentage = 0;

    setStats({
      totalRevenue,
      monthlyRevenue: totalRevenue,
      pendingAmount,
      completedCount: completedTransactions.length,
      pendingCount: pendingTransactions.length,
      failedCount: failedTransactions.length,
      growthPercentage
    });
  };

  const getCurrentPageTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
      };

  const formatCurrency = (amount: number) => {
    return formatDisplayCurrency(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        color: '#10b981',
        bgColor: '#dcfce7',
        icon: CheckCircleIcon,
        text: 'Hoàn thành'
      },
      pending: {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: ClockIcon,
        text: 'Đang chờ'
      },
      failed: {
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: XCircleIcon,
        text: 'Thất bại'
      },
      cancelled: {
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: XCircleIcon,
        text: 'Đã hủy'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        backgroundColor: config.bgColor,
        color: config.color,
        fontSize: '0.875rem',
        fontWeight: 600
      }}>
        <Icon style={{ width: '1rem', height: '1rem' }} />
        {config.text}
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: React.ReactElement[] = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          background: currentPage === 1 ? '#f3f4f6' : 'white',
          color: currentPage === 1 ? '#9ca3af' : '#374151',
          borderRadius: '0.375rem',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        <ChevronLeftIcon style={{ width: '1rem', height: '1rem' }} />
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            background: currentPage === i ? '#3b82f6' : 'white',
            color: currentPage === i ? 'white' : '#374151',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: currentPage === i ? 600 : 400
          }}
        >
          {i}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          background: currentPage === totalPages ? '#f3f4f6' : 'white',
          color: currentPage === totalPages ? '#9ca3af' : '#374151',
          borderRadius: '0.375rem',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        <ChevronRightIcon style={{ width: '1rem', height: '1rem' }} />
      </button>
    );

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}>
        {pages}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          width: '100%',
          height: '400px',
          background: '#e2e8f0',
          borderRadius: '0.75rem'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1.25rem',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
         
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%'
        }} />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              margin: '0 0 0.75rem 0',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              Quản lý thanh toán
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontWeight: 400
            }}>
              Theo dõi và phân tích chi tiết tất cả giao dịch thanh toán
            </p>
          </div>
          
        </div>
      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #e2e8f0'
      }}>
        
        
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                background: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Hoàn thành</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Năm
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                background: 'white',
                fontSize: '0.875rem'
              }}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Tháng
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                background: 'white',
                fontSize: '0.875rem'
              }}
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderRadius: '1rem',
          border: '1px solid #86efac',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#065f46' }}>
              Giao dịch hoàn thành
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#065f46' }}>
              {stats.completedCount}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#047857' }}>
              giao dịch
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#047857' }}>
           Tổng thu: {formatCurrency(stats.totalRevenue)}
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60px',
            height: '60px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '50%',
            transform: 'translate(20px, -20px)'
          }} />
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '1rem',
          border: '1px solid #fbbf24',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#92400e' }}>
              Giao dịch đang chờ
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#92400e' }}>
              {stats.pendingCount}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#b45309' }}>
              giao dịch
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#b45309' }}>
            Tổng: {formatCurrency(stats.pendingAmount)}
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60px',
            height: '60px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '50%',
            transform: 'translate(20px, -20px)'
          }} />
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: '1rem',
          border: '1px solid #f87171',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <XCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#991b1b' }}>
              Giao dịch thất bại
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#991b1b' }}>
              {stats.failedCount}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#b91c1c' }}>
              giao dịch
            </span>
          </div>
          
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60px',
            height: '60px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '50%',
            transform: 'translate(20px, -20px)'
          }} />
        </div>

        
      </div>

      <div style={{
        background: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                borderRadius: '2px'
              }} />
              <h3 style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                Danh sách giao dịch
              </h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: 500
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#10b981',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }} />
                <span>Tổng: {filteredTransactions.length} giao dịch</span>
              </div>
              {totalPages > 1 && (
                <>
                  <div style={{
                    width: '1px',
                    height: '16px',
                    background: '#d1d5db'
                  }} />
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontWeight: 500
                  }}>
                    Trang {currentPage}/{totalPages}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <th style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '3px',
                      height: '16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                      borderRadius: '2px'
                    }} />
                    Mã giao dịch
                  </div>
                </th>
                <th style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase'
                }}>
                  Người cao tuổi
                </th>
                <th style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase'
                }}>
                  Mô tả
                </th>
                <th style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase'
                }}>
                  Hạn thanh toán
                </th>
                <th style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'right',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase'
                }}>
                  Số tiền
                </th>
                <th style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase'
                }}>
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {getCurrentPageTransactions().map((transaction, index) => (
                <tr key={transaction.id} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: index % 2 === 0 ? 'white' : '#fafafa'
                }}>
                  <td style={{
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {transaction.orderCode}
                  </td>
                  <td style={{
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    {transaction.residentName}
                  </td>
                  <td style={{
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    maxWidth: '250px'
                  }}>
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {transaction.description}
                    </div>
                  </td>
                  <td style={{
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'center'
                  }}>
                    {getStatusBadge(transaction.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
              
        {renderPagination()}

        {filteredTransactions.length === 0 && (
          <div style={{ padding: '3rem 1.5rem' }}>
            <EmptyState
              type="no-data"
              title="Không có giao dịch nào"
              message={`Không có giao dịch nào trong ${filters.month > 0 ? `tháng ${filters.month}` : ''} năm ${filters.year} với trạng thái đã chọn.`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
