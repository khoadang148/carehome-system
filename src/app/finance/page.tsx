"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon, 
  DocumentPlusIcon,
  FunnelIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon
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
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  
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
    
    const matchesCategory = filterCategory === 'Tất cả' || transaction.category === filterCategory;
    const matchesStatus = filterStatus === 'Tất cả' || transaction.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Quản lý tài chính</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <Link 
            href="/finance/new-transaction" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <DocumentPlusIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Giao dịch mới
          </Link>
        </div>
      </div>
      
      {/* Financial summary cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
        <div style={{backgroundColor: '#f0f9ff', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
          <h2 style={{fontSize: '0.875rem', fontWeight: 500, color: '#0c4a6e', marginBottom: '0.75rem', marginTop: 0}}>Thu nhập</h2>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 600, color: '#0369a1'}}>{formatCurrency(totalIncome)}</div>
            <ArrowTrendingUpIcon style={{width: '2rem', height: '2rem', color: '#0ea5e9'}} />
          </div>
        </div>
        
        <div style={{backgroundColor: '#fef2f2', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
          <h2 style={{fontSize: '0.875rem', fontWeight: 500, color: '#991b1b', marginBottom: '0.75rem', marginTop: 0}}>Chi phí</h2>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 600, color: '#b91c1c'}}>{formatCurrency(totalExpenses)}</div>
            <ArrowTrendingDownIcon style={{width: '2rem', height: '2rem', color: '#ef4444'}} />
          </div>
        </div>
        
        <div style={{
          backgroundColor: balance >= 0 ? '#f0fdf4' : '#fef2f2', 
          borderRadius: '0.5rem', 
          padding: '1.25rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '0.875rem', 
            fontWeight: 500, 
            color: balance >= 0 ? '#166534' : '#991b1b', 
            marginBottom: '0.75rem', 
            marginTop: 0
          }}>
            Số dư
          </h2>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 600, color: balance >= 0 ? '#16a34a' : '#b91c1c'}}>{formatCurrency(balance)}</div>
            <BanknotesIcon style={{width: '2rem', height: '2rem', color: balance >= 0 ? '#22c55e' : '#ef4444'}} />
          </div>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{position: 'relative', width: '100%', maxWidth: '20rem'}}>
              <div style={{position: 'absolute', top: 0, bottom: 0, left: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none'}}>
                <MagnifyingGlassIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch..."
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
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
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Mô tả</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Loại</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ngày</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Số tiền</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tham chiếu</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Trạng thái</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{transaction.description}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: transaction.category === 'Thu nhập' ? '#dcfce7' : '#fef2f2',
                      color: transaction.category === 'Thu nhập' ? '#166534' : '#b91c1c'
                    }}>
                      {transaction.category}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <CalendarIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                      {transaction.date}
                    </div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: transaction.category === 'Thu nhập' ? '#15803d' : '#be123c'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <CurrencyDollarIcon style={{width: '1rem', height: '1rem'}} />
                      {formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{transaction.reference}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: transaction.status === 'Đã xử lý' ? '#f0f9ff' : '#fef3c7',
                      color: transaction.status === 'Đã xử lý' ? '#0369a1' : '#92400e'
                    }}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy giao dịch phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
} 