"use client";

import { useState } from 'react';
import { 
  BanknotesIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Mock family financial data
const familyFinancialData = [
  {
    id: 1,
    residentName: 'Nguyễn Văn Nam',
    relationship: 'Cha',
    monthlyFee: 15000000,
    additionalServices: [
      { name: 'Vật lý trị liệu', amount: 2000000, frequency: 'Hàng tuần' },
      { name: 'Chăm sóc y tế đặc biệt', amount: 1500000, frequency: 'Hàng tháng' },
    ],
    payments: [
      { id: 1, description: 'Phí chăm sóc tháng 5/2024', amount: 15000000, date: '2024-05-01', status: 'Đã thanh toán', method: 'Chuyển khoản' },
      { id: 2, description: 'Vật lý trị liệu tuần 3/5', amount: 500000, date: '2024-05-15', status: 'Đã thanh toán', method: 'Thẻ tín dụng' },
      { id: 3, description: 'Phí chăm sóc tháng 6/2024', amount: 15000000, date: '2024-06-01', status: 'Chờ thanh toán', method: '' },
    ],
    totalPaid: 15500000,
    totalDue: 15000000,
    nextPaymentDate: '2024-06-01'
  },
  {
    id: 2,
    residentName: 'Lê Thị Hoa',
    relationship: 'Mẹ',
    monthlyFee: 18000000,
    additionalServices: [
      { name: 'Liệu pháp âm nhạc', amount: 800000, frequency: 'Hai lần/tuần' },
    ],
    payments: [
      { id: 4, description: 'Phí chăm sóc tháng 5/2024', amount: 18000000, date: '2024-05-01', status: 'Đã thanh toán', method: 'Chuyển khoản' },
      { id: 5, description: 'Liệu pháp âm nhạc tuần 2/5', amount: 400000, date: '2024-05-10', status: 'Đã thanh toán', method: 'Tiền mặt' },
    ],
    totalPaid: 18400000,
    totalDue: 0,
    nextPaymentDate: '2024-06-01'
  }
];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function FamilyFinance() {
  const [selectedResident, setSelectedResident] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const currentResident = familyFinancialData[selectedResident];
  
  // Filter payments based on search term
  const filteredPayments = currentResident?.payments.filter((payment) => 
    payment.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã thanh toán':
        return { bg: '#dcfce7', text: '#166534', icon: CheckCircleIcon };
      case 'Chờ thanh toán':
        return { bg: '#fef3c7', text: '#d97706', icon: ClockIcon };
      case 'Quá hạn':
        return { bg: '#fecaca', text: '#dc2626', icon: ExclamationTriangleIcon };
      default:
        return { bg: '#f3f4f6', text: '#374151', icon: ClockIcon };
    }
  };

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
                <BanknotesIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
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
                  Thông tin tài chính
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi chi phí chăm sóc người thân
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Family Member Selector */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <UserGroupIcon style={{width: '1.25rem', height: '1.25rem', color: '#8b5cf6'}} />
            Chọn người thân để xem thông tin tài chính
          </h3>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
            {familyFinancialData.map((resident, index) => (
              <div
                key={resident.id}
                onClick={() => setSelectedResident(index)}
                style={{
                  background: selectedResident === index ? '#eff6ff' : 'white',
                  border: selectedResident === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h4 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0'}}>
                      {resident.residentName}
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0'}}>
                      {resident.relationship}
                    </p>
                    <div style={{fontSize: '0.875rem', color: '#374151'}}>
                      <p style={{margin: '0 0 0.25rem 0'}}>
                        Phí hàng tháng: <strong>{formatCurrency(resident.monthlyFee)}</strong>
                      </p>
                      <p style={{margin: '0'}}>
                        Còn phải trả: <strong style={{color: resident.totalDue > 0 ? '#dc2626' : '#16a34a'}}>
                          {formatCurrency(resident.totalDue)}
                        </strong>
                      </p>
                    </div>
                  </div>
                  {selectedResident === index && (
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircleIcon style={{width: '1rem', height: '1rem', color: 'white'}} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                  Đã thanh toán
                </p>
                <p style={{fontSize: '1.875rem', fontWeight: 700, color: '#16a34a', margin: 0}}>
                  {formatCurrency(currentResident?.totalPaid || 0)}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                  Còn phải trả
                </p>
                <p style={{fontSize: '1.875rem', fontWeight: 700, color: '#dc2626', margin: 0}}>
                  {formatCurrency(currentResident?.totalDue || 0)}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClockIcon style={{width: '1.5rem', height: '1.5rem', color: '#dc2626'}} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                  Lần thanh toán tiếp theo
                </p>
                <p style={{fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', margin: 0}}>
                  {new Date(currentResident?.nextPaymentDate || '').toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarDaysIcon style={{width: '1.5rem', height: '1.5rem', color: '#3b82f6'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Services */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
            Dịch vụ bổ sung
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
            {currentResident?.additionalServices.map((service, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem'
                }}
              >
                <h4 style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0'}}>
                  {service.name}
                </h4>
                <p style={{fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem 0'}}>
                  {service.frequency}
                </p>
                <p style={{fontSize: '1rem', fontWeight: 600, color: '#8b5cf6', margin: 0}}>
                  {formatCurrency(service.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0}}>
              Lịch sử thanh toán
            </h3>
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                outline: 'none',
                minWidth: '200px'
              }}
            />
          </div>

          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                  <th style={{textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151'}}>
                    Mô tả
                  </th>
                  <th style={{textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151'}}>
                    Số tiền
                  </th>
                  <th style={{textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151'}}>
                    Ngày
                  </th>
                  <th style={{textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151'}}>
                    Phương thức
                  </th>
                  <th style={{textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151'}}>
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const statusStyle = getStatusColor(payment.status);
                  const StatusIcon = statusStyle.icon;
                  
                  return (
                    <tr key={payment.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827'}}>
                        {payment.description}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827'}}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        {new Date(payment.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          <CreditCardIcon style={{width: '1rem', height: '1rem'}} />
                          {payment.method || 'Chưa xác định'}
                        </div>
                      </td>
                      <td style={{padding: '1rem 0.75rem'}}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text
                        }}>
                          <StatusIcon style={{width: '0.875rem', height: '0.875rem'}} />
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredPayments.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#6b7280'
              }}>
                <BanknotesIcon style={{width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5}} />
                <p style={{fontSize: '1rem', margin: 0}}>
                  {searchTerm ? 'Không tìm thấy giao dịch nào phù hợp' : 'Chưa có giao dịch nào'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
