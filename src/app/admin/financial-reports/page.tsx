"use client";

import { useState } from 'react';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  residentId?: string;
  residentName?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function FinancialReportsPage() {
  const router = useRouter();
  const [records] = useState<FinancialRecord[]>([
    {
      id: '1',
      date: '2024-01-18',
      type: 'income',
      category: 'Phí chăm sóc',
      description: 'Phí chăm sóc tháng 1/2024 - Nguyễn Thị Lan',
      amount: 8000000,
      paymentMethod: 'Chuyển khoản',
      residentId: 'R001',
      residentName: 'Nguyễn Thị Lan',
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-01-17',
      type: 'expense',
      category: 'Y tế',
      description: 'Mua thuốc và vật tư y tế',
      amount: 2500000,
      paymentMethod: 'Tiền mặt',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-01-16',
      type: 'income',
      category: 'Phí dịch vụ',
      description: 'Phí dịch vụ cao cấp - Lê Văn Hùng',
      amount: 5000000,
      paymentMethod: 'Chuyển khoản',
      residentId: 'R003',
      residentName: 'Lê Văn Hùng',
      status: 'completed'
    },
    {
      id: '4',
      date: '2024-01-15',
      type: 'expense',
      category: 'Thực phẩm',
      description: 'Mua thực phẩm tuần 3 tháng 1',
      amount: 3200000,
      paymentMethod: 'Chuyển khoản',
      status: 'completed'
    },
    {
      id: '5',
      date: '2024-01-14',
      type: 'expense',
      category: 'Lương nhân viên',
      description: 'Lương tháng 1/2024',
      amount: 45000000,
      paymentMethod: 'Chuyển khoản',
      status: 'completed'
    },
    {
      id: '6',
      date: '2024-01-12',
      type: 'income',
      category: 'Phí chăm sóc',
      description: 'Phí chăm sóc tháng 1/2024 - Trần Thị Mai',
      amount: 12000000,
      paymentMethod: 'Tiền mặt',
      residentId: 'R002',
      residentName: 'Trần Thị Mai',
      status: 'completed'
    }
  ]);

  const [dateFilter, setDateFilter] = useState<string>('this_month');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const now = new Date();
    
    let dateMatch = true;
    if (dateFilter === 'this_month') {
      dateMatch = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = recordDate >= weekAgo;
    }
    
    const typeMatch = typeFilter === 'all' || record.type === typeFilter;
    const categoryMatch = categoryFilter === 'all' || record.category === categoryFilter;
    
    return dateMatch && typeMatch && categoryMatch;
  });

  const totalIncome = filteredRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = filteredRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const netIncome = totalIncome - totalExpense;

  const categories = [...new Set(records.map(r => r.category))];

  const categoryData = categories.map(category => {
    const categoryRecords = filteredRecords.filter(r => r.category === category);
    const income = categoryRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = categoryRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    return { category, income, expense, net: income - expense };
  });

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
            Báo cáo Tài chính
          </h1>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem 0' }}>
            Thống kê thu chi và phân tích tài chính chi tiết
          </p>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="this_month">Tháng này</option>
              <option value="this_week">Tuần này</option>
              <option value="all">Tất cả</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="all">Tất cả loại</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi phí</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '1.25rem',
            padding: '2rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '1rem',
                padding: '0.75rem'
              }}>
                <ArrowUpIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tổng Thu nhập</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {totalIncome.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '1.25rem',
            padding: '2rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '1rem',
                padding: '0.75rem'
              }}>
                <ArrowDownIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tổng Chi phí</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {totalExpense.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${netIncome >= 0 ? '#3b82f6' : '#f59e0b'} 0%, ${netIncome >= 0 ? '#2563eb' : '#d97706'} 100%)`,
            borderRadius: '1.25rem',
            padding: '2rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '1rem',
                padding: '0.75rem'
              }}>
                <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Lợi nhuận ròng</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {netIncome.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
          </div>
        </div>

        {/* Category Analysis */}
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 1.5rem 0',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            Phân tích theo Danh mục
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {categoryData.map((item) => (
              <div
                key={item.category}
                style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, auto)', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Thu nhập</div>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>
                      {item.income.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Chi phí</div>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>
                      {item.expense.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ròng</div>
                    <div style={{ fontWeight: 600, color: item.net >= 0 ? '#10b981' : '#ef4444' }}>
                      {item.net.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Records */}
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '2rem 2rem 0 2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: '0 0 1.5rem 0',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <DocumentTextIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Chi tiết Giao dịch ({filteredRecords.length})
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Ngày</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Loại</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Danh mục</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Mô tả</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Số tiền</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Phương thức</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#374151' }}>
                        {new Date(record.date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: record.type === 'income' ? '#10b981' : '#ef4444',
                        color: 'white'
                      }}>
                        {record.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#374151' }}>{record.category}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ maxWidth: '300px' }}>
                        <div style={{ color: '#1f2937', fontWeight: 500 }}>{record.description}</div>
                        {record.residentName && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {record.residentName} (ID: {record.residentId})
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{
                        fontWeight: 600,
                        color: record.type === 'income' ? '#10b981' : '#ef4444'
                      }}>
                        {record.type === 'income' ? '+' : '-'}{record.amount.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#374151' }}>{record.paymentMethod}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: record.status === 'completed' ? '#10b981' : '#f59e0b',
                        color: 'white'
                      }}>
                        {record.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 