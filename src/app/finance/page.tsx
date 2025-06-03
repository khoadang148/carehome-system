"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon, 
  DocumentPlusIcon,
  FunnelIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

// Mock financial transactions data
const transactions = [
  { 
    id: 1, 
    description: 'Chi phí nhân sự tháng 5', 
    category: 'Chi phí',
    amount: 24500000,
    date: '2023-05-15',
    paymentMethod: 'Chuyển khoản',
    reference: 'HR-2023-05',
    status: 'Đã xử lý'
  },
  { 
    id: 2, 
    description: 'Thanh toán dịch vụ từ gia đình Johnson', 
    category: 'Thu nhập',
    amount: 7800000,
    date: '2023-05-12',
    paymentMethod: 'Thẻ tín dụng',
    reference: 'PMT-10045',
    status: 'Đã xử lý'
  },
  { 
    id: 3, 
    description: 'Chi phí thuốc và vật tư y tế', 
    category: 'Chi phí',
    amount: 4200000,
    date: '2023-05-10',
    paymentMethod: 'Chuyển khoản',
    reference: 'MED-2023-05-A',
    status: 'Đã xử lý'
  },
  { 
    id: 4, 
    description: 'Thanh toán dịch vụ từ gia đình Smith', 
    category: 'Thu nhập',
    amount: 8500000,
    date: '2023-05-08',
    paymentMethod: 'Thẻ tín dụng',
    reference: 'PMT-10046',
    status: 'Đang xử lý'
  },
  { 
    id: 5, 
    description: 'Tiện ích và dịch vụ', 
    category: 'Chi phí',
    amount: 3150000,
    date: '2023-05-05',
    paymentMethod: 'Chuyển khoản',
    reference: 'UTIL-2023-05',
    status: 'Đã xử lý'
  },
];

const categories = ['Tất cả', 'Thu nhập', 'Chi phí'];
const statuses = ['Tất cả', 'Đã xử lý', 'Đang xử lý'];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const router = useRouter();

  // Handler functions for button actions
  const handleViewTransaction = (transactionId: number) => {
    router.push(`/finance/${transactionId}`);
  };

  const handleEditTransaction = (transactionId: number) => {
    router.push(`/finance/${transactionId}/edit`);
  };

  // Financial summary calculations
  const totalIncome = transactions
    .filter(t => t.category === 'Thu nhập')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.category === 'Chi phí')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  
  // Filter transactions based on search term, category and status
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterType === 'Tất cả' || transaction.category === filterType;
    const matchesStatus = filterStatus === 'Tất cả' || transaction.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  return (
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
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
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
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}>
                <ChartBarIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý tài chính
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi thu chi và báo cáo tài chính
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <Link 
                href="/finance/reports" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <ChartBarIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Báo cáo
              </Link>
              <Link 
                href="/finance/new-transaction" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <DocumentPlusIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Giao dịch mới
              </Link>
            </div>
          </div>
        </div>
        
        {/* Financial summary cards */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem'
        }}>
          {/* Income Card */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h2 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#166534', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Thu nhập
            </h2>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#16a34a',
                lineHeight: 1
              }}>
                {formatCurrency(totalIncome)}
              </div>
              <ArrowTrendingUpIcon style={{width: '3rem', height: '3rem', color: '#22c55e'}} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#166534',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              +12.5% so với tháng trước
            </div>
          </div>
          
          {/* Expenses Card */}
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h2 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#991b1b', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Chi phí
            </h2>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#dc2626',
                lineHeight: 1
              }}>
                {formatCurrency(totalExpenses)}
              </div>
              <ArrowTrendingDownIcon style={{width: '3rem', height: '3rem', color: '#ef4444'}} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#991b1b',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              -4.2% so với tháng trước
            </div>
          </div>
          
          {/* Balance Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h2 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#1e40af', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Số dư
            </h2>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: balance >= 0 ? '#2563eb' : '#dc2626',
                lineHeight: 1
              }}>
                {formatCurrency(balance)}
              </div>
              <BanknotesIcon style={{width: '3rem', height: '3rem', color: '#3b82f6'}} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: balance >= 0 ? '#1e40af' : '#991b1b',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              {balance >= 0 ? '+18.7%' : '-8.3%'} so với tháng trước
            </div>
          </div>
        </div>
        
        {/* Filters and Transactions */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Filters */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap', 
              alignItems: 'center', 
              gap: '1.5rem'
            }}>
              <div style={{flex: '1', minWidth: '20rem'}}>
                <div style={{position: 'relative'}}>
                  <div style={{
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    pointerEvents: 'none'
                  }}>
                    <MagnifyingGlassIcon style={{width: '1.125rem', height: '1.125rem', color: '#9ca3af'}} />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm giao dịch..."
                    style={{
                      width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(22, 163, 74, 0.1)',
                  borderRadius: '0.5rem'
                }}>
                  <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#16a34a'}} />
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#16a34a'}}>
                    Lọc
                  </span>
                </div>
                <select
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    fontWeight: 500,
                    minWidth: '10rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    fontWeight: 500,
                    minWidth: '10rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div style={{overflowX: 'auto'}}>
            <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                }}>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Mô tả
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Loại
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'right', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Số tiền
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Ngày
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Trạng thái
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id} 
                    style={{
                      borderBottom: index !== filteredTransactions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#111827'
                    }}>
                      <div>
                        {transaction.description}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem'
                      }}>
                        Ref: {transaction.reference}
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.375rem 0.875rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '9999px',
                        background: 
                          transaction.category === 'Thu nhập' 
                            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: 
                          transaction.category === 'Thu nhập' ? '#166534' : '#dc2626',
                        border: '1px solid',
                        borderColor: transaction.category === 'Thu nhập' ? '#86efac' : '#fca5a5'
                      }}>
                        {transaction.category}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700,
                      color: transaction.category === 'Thu nhập' ? '#16a34a' : '#dc2626',
                      textAlign: 'right'
                    }}>
                      {transaction.category === 'Thu nhập' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {new Date(transaction.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '0.375rem',
                        background: 
                          transaction.status === 'Đã xử lý' 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(245, 158, 11, 0.1)',
                        color: 
                          transaction.status === 'Đã xử lý' ? '#059669' : '#d97706',
                        border: '1px solid',
                        borderColor: transaction.status === 'Đã xử lý' ? '#86efac' : '#fbbf24'
                      }}>
                        {transaction.status}
                      </span>
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button
                          onClick={() => handleViewTransaction(transaction.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                          }}
                          title="Xem chi tiết giao dịch"
                        >
                          <EyeIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                        <button
                          onClick={() => handleEditTransaction(transaction.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                          }}
                          title="Chỉnh sửa giao dịch"
                        >
                          <PencilIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td 
                      colSpan={6} 
                      style={{
                        padding: '3rem', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        fontSize: '1rem',
                        fontWeight: 500
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <ChartBarIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                        Không tìm thấy giao dịch nào
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 