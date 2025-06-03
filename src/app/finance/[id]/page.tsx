"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Mock transaction data - in real app, this would come from API
const getTransactionById = (id: string) => {
  const transactions = [
    { 
      id: 1, 
      description: 'Chi phí nhân sự tháng 5', 
      category: 'Chi phí',
      subcategory: 'Lương nhân viên',
      amount: 24500000,
      date: '2023-05-15',
      paymentMethod: 'Chuyển khoản',
      reference: 'HR-2023-05',
      status: 'Đã xử lý',
      notes: 'Thanh toán lương tháng 5 cho tất cả nhân viên bao gồm lương cơ bản, phụ cấp và thưởng hiệu suất.',
      createdAt: '2023-05-15T08:30:00',
      updatedAt: '2023-05-15T08:30:00',
      createdBy: 'Nguyễn Văn Admin',
      approvedBy: 'Trần Thị Manager'
    },
    { 
      id: 2, 
      description: 'Thanh toán dịch vụ từ gia đình Johnson', 
      category: 'Thu nhập',
      subcategory: 'Phí dịch vụ chăm sóc',
      amount: 7800000,
      date: '2023-05-12',
      paymentMethod: 'Thẻ tín dụng',
      reference: 'PMT-10045',
      status: 'Đã xử lý',
      notes: 'Thanh toán phí chăm sóc tháng 5 cho bà Johnson, bao gồm dịch vụ chăm sóc 24/7 và các hoạt động trị liệu.',
      createdAt: '2023-05-12T14:20:00',
      updatedAt: '2023-05-12T14:20:00',
      createdBy: 'Lê Văn Kế toán',
      approvedBy: 'Trần Thị Manager'
    },
    { 
      id: 3, 
      description: 'Chi phí thuốc và vật tư y tế', 
      category: 'Chi phí',
      subcategory: 'Chi phí y tế',
      amount: 4200000,
      date: '2023-05-10',
      paymentMethod: 'Chuyển khoản',
      reference: 'MED-2023-05-A',
      status: 'Đã xử lý',
      notes: 'Mua thuốc điều trị thường xuyên và vật tư y tế cần thiết cho tháng 5.',
      createdAt: '2023-05-10T10:15:00',
      updatedAt: '2023-05-10T10:15:00',
      createdBy: 'Phạm Thị Y tá trưởng',
      approvedBy: 'Bác sĩ Nguyễn Văn A'
    },
    { 
      id: 4, 
      description: 'Thanh toán dịch vụ từ gia đình Smith', 
      category: 'Thu nhập',
      subcategory: 'Phí dịch vụ chăm sóc',
      amount: 8500000,
      date: '2023-05-08',
      paymentMethod: 'Thẻ tín dụng',
      reference: 'PMT-10046',
      status: 'Đang xử lý',
      notes: 'Thanh toán phí chăm sóc tháng 5 cho ông Smith, bao gồm dịch vụ chăm sóc đặc biệt và vật lý trị liệu.',
      createdAt: '2023-05-08T16:45:00',
      updatedAt: '2023-05-08T16:45:00',
      createdBy: 'Lê Văn Kế toán',
      approvedBy: 'Chờ phê duyệt'
    },
    { 
      id: 5, 
      description: 'Tiện ích và dịch vụ', 
      category: 'Chi phí',
      subcategory: 'Tiện ích & Vận hành',
      amount: 3150000,
      date: '2023-05-05',
      paymentMethod: 'Chuyển khoản',
      reference: 'UTIL-2023-05',
      status: 'Đã xử lý',
      notes: 'Thanh toán hóa đơn điện, nước, internet và các dịch vụ tiện ích khác cho tháng 5.',
      createdAt: '2023-05-05T09:00:00',
      updatedAt: '2023-05-05T09:00:00',
      createdBy: 'Nguyễn Văn Admin',
      approvedBy: 'Trần Thị Manager'
    },
  ];
  
  return transactions.find(t => t.id === parseInt(id));
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
      
      // Simulate API call
      setTimeout(() => {
        const foundTransaction = getTransactionById(resolved.id);
        setTransaction(foundTransaction);
        setLoading(false);
      }, 500);
    };
    resolveParams();
  }, [params]);

  const handleEdit = () => {
    if (resolvedParams) {
      router.push(`/finance/${resolvedParams.id}/edit`);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success and redirect
      setShowDeleteModal(false);
      router.push('/finance');
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !resolvedParams) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Đang tải thông tin giao dịch...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <ExclamationTriangleIcon style={{width: '3rem', height: '3rem', color: '#ef4444', margin: '0 auto 1rem'}} />
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
            Không tìm thấy giao dịch
          </h2>
          <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>
            Giao dịch với ID {resolvedParams.id} không tồn tại trong hệ thống.
          </p>
          <Link
            href="/finance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeftIcon style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
            Quay về danh sách
          </Link>
        </div>
      </div>
    );
  }

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
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <Link href="/finance" style={{color: '#6b7280', display: 'flex'}}>
                <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </Link>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <EyeIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Chi tiết giao dịch
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Mã tham chiếu: {transaction.reference}
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <button 
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <PrinterIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                In
              </button>
              <button 
                onClick={handleEdit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <PencilIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Chỉnh sửa
              </button>
              <button 
                onClick={handleDelete}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <TrashIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem'}}>
                {transaction.description}
              </h2>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
                <span style={{
                  display: 'inline-flex', 
                  padding: '0.5rem 1rem', 
                  fontSize: '0.875rem', 
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
                <span style={{
                  display: 'inline-flex', 
                  padding: '0.375rem 0.875rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  borderRadius: '0.5rem',
                  background: 
                    transaction.status === 'Đã xử lý' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : transaction.status === 'Đang xử lý'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                  color: 
                    transaction.status === 'Đã xử lý' 
                      ? '#059669' 
                      : transaction.status === 'Đang xử lý'
                      ? '#d97706'
                      : '#dc2626',
                  border: '1px solid',
                  borderColor: 
                    transaction.status === 'Đã xử lý' 
                      ? '#86efac' 
                      : transaction.status === 'Đang xử lý'
                      ? '#fbbf24'
                      : '#fca5a5'
                }}>
                  {transaction.status === 'Đã xử lý' && <CheckCircleIcon style={{width: '1rem', height: '1rem', marginRight: '0.25rem'}} />}
                  {transaction.status === 'Đang xử lý' && <ClockIcon style={{width: '1rem', height: '1rem', marginRight: '0.25rem'}} />}
                  {transaction.status === 'Chờ phê duyệt' && <ExclamationTriangleIcon style={{width: '1rem', height: '1rem', marginRight: '0.25rem'}} />}
                  {transaction.status}
                </span>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{
                fontSize: '2.5rem', 
                fontWeight: 700, 
                color: transaction.category === 'Thu nhập' ? '#16a34a' : '#dc2626',
                lineHeight: 1
              }}>
                {transaction.category === 'Thu nhập' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </div>
              <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem'}}>
                {new Date(transaction.date).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem'
        }}>
          {/* Transaction Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#111827', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <DocumentTextIcon style={{width: '1.25rem', height: '1.25rem', color: '#3b82f6'}} />
              Thông tin giao dịch
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Mô tả
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500}}>
                  {transaction.description}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Danh mục chi tiết
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500}}>
                  {transaction.subcategory}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Mã tham chiếu
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500, fontFamily: 'monospace'}}>
                  {transaction.reference}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Ngày giao dịch
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <CalendarIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                  {new Date(transaction.date).toLocaleDateString('vi-VN')}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Phương thức thanh toán
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <CreditCardIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                  {transaction.paymentMethod}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#111827', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BanknotesIcon style={{width: '1.25rem', height: '1.25rem', color: '#16a34a'}} />
              Thông tin bổ sung
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Ghi chú
                </label>
                <div style={{
                  fontSize: '0.875rem', 
                  color: '#374151', 
                  marginTop: '0.5rem', 
                  lineHeight: 1.6,
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  {transaction.notes}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Người tạo
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500}}>
                  {transaction.createdBy}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Người phê duyệt
                </label>
                <div style={{fontSize: '1rem', color: '#111827', marginTop: '0.25rem', fontWeight: 500}}>
                  {transaction.approvedBy}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Ngày tạo
                </label>
                <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem'}}>
                  {formatDateTime(transaction.createdAt)}
                </div>
              </div>
              
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Cập nhật lần cuối
                </label>
                <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem'}}>
                  {formatDateTime(transaction.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <ExclamationTriangleIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
            </div>
            
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#111827',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              Xác nhận xóa giao dịch
            </h3>
            
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isDeleting ? 0.5 : 1
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: isDeleting 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  gap: '0.5rem'
                }}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <TrashIcon style={{width: '1rem', height: '1rem'}} />
                    Xóa giao dịch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 