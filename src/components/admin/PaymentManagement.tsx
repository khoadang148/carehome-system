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

  // Pagination state
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
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch bills from API
      const bills = await billsAPI.getAll();
      console.log('✅ Bills loaded:', bills?.length || 0);
      console.log('📋 Sample bill:', bills?.[0]);
      
      // Fetch residents to get names
      const residents = await residentAPI.getAll();
      console.log('✅ Residents loaded:', residents?.length || 0);
      console.log('👤 Sample resident:', residents?.[0]);
      
      // Create residents map with multiple possible field names
      const residentsMap = new Map();
      residents.forEach((r: any) => {
        // Try different possible field names for ID
        const id = r._id || r.id;
        // Try different possible field names for name
        const name = r.full_name || r.name || r.fullName || r.resident_name || 'Không xác định';
        residentsMap.set(id, name);
      });
      
      console.log('✅ Residents mapped:', residentsMap.size);
      console.log('🗺️ Sample mapping:', Array.from(residentsMap.entries()).slice(0, 3));
      
      // Transform bills to payment transactions
      const transactions: PaymentTransaction[] = bills.map((bill: any) => {
        // Handle resident_id that might be an object
        let residentId = bill.resident_id || bill.residentId || bill.resident;
        
        // If resident_id is an object, try to extract the _id field
        if (typeof residentId === 'object' && residentId !== null) {
          residentId = residentId._id || residentId.id || residentId;
        }
        
        const residentName = residentsMap.get(residentId) || 'Không xác định';
        
        console.log(`🔍 Bill ${bill._id}: residentId=${residentId}, mappedName=${residentName}`);
        
        return {
          id: bill._id,
          orderCode: bill.order_code || `BILL${bill._id.slice(-6)}`,
          amount: bill.amount,
          status: bill.status === 'paid' ? 'completed' : 
                  bill.status === 'pending' ? 'pending' : 
                  bill.status === 'cancelled' ? 'cancelled' : 'failed',
          description: bill.title || bill.notes || 'Thanh toán dịch vụ chăm sóc',
          createdAt: bill.created_at,
          completedAt: bill.paid_date,
          residentName: residentName,
          billId: bill._id
        };
      });

      setTransactions(transactions);
      console.log('✅ Payment management data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching payment data:', error);
      setTransactions([]);
      
      // Add user-friendly error handling
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Filter by year and month
    if (filters.month > 0) {
      filtered = filtered.filter(t => {
        const date = new Date(t.createdAt);
        return date.getFullYear() === filters.year && date.getMonth() + 1 === filters.month;
      });
    } else {
      // Filter by year only
      filtered = filtered.filter(t => {
        const date = new Date(t.createdAt);
        return date.getFullYear() === filters.year;
      });
    }

    setFilteredTransactions(filtered);
    calculateStats(filtered);
    
    // Calculate total pages
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total);
  };

  const calculateStats = (transactions: PaymentTransaction[]) => {
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    const failedTransactions = transactions.filter(t => t.status === 'failed');

    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate growth percentage (simplified)
    const growthPercentage = 0; // This would need historical data to calculate properly

    setStats({
      totalRevenue,
      monthlyRevenue: totalRevenue, // For filtered view
      pendingAmount,
      completedCount: completedTransactions.length,
      pendingCount: pendingTransactions.length,
      failedCount: failedTransactions.length,
      growthPercentage
    });
  };

  // Get current page transactions
  const getCurrentPageTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
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

    // Previous button
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

    // Page numbers
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

    // Next button
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
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            color: '#1e293b'
          }}>
            Quản lý thanh toán
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: 0
          }}>
            Theo dõi và phân tích chi tiết tất cả giao dịch thanh toán
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '0.75rem',
            color: 'white',
            fontWeight: 600
          }}>
            <CurrencyDollarIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>Tổng thu: {formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
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
          {/* Status Filter */}
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

          {/* Year Filter */}
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

          {/* Month Filter */}
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

      {/* Enhanced Stats Cards */}
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

      {/* Transactions Table */}
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
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1e293b',
              margin: 0
            }}>
              Danh sách giao dịch
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              <span>Tổng: {filteredTransactions.length} giao dịch</span>
              {totalPages > 1 && (
                <span>• Trang {currentPage}/{totalPages}</span>
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
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <th style={{
                  padding: '1rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Mã giao dịch
                </th>
                <th style={{
                  padding: '1rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Người cao tuổi
                </th>
                <th style={{
                  padding: '1rem 1.5rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Mô tả
                </th>
                <th style={{
                  padding: '1rem 1.5rem',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Số tiền
                </th>
                <th style={{
                  padding: '1rem 1.5rem',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.875rem'
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

        {/* Pagination */}
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
