"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ArrowLeftIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { billsAPI, paymentAPI } from '@/lib/api';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const invoiceId = params.id as string;
        console.log('Fetching invoice with ID:', invoiceId);
        
        // Fetch invoice details
        const invoiceData = await billsAPI.getById(invoiceId);
        console.log('Invoice data:', invoiceData);
        
        setInvoice(invoiceData);
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(err?.message || 'Không thể tải thông tin hóa đơn');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#e6f9ed', color: '#16a34a', border: '#bbf7d0', text: 'Đã thanh toán' };
      case 'pending':
        return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', text: 'Chờ thanh toán' };
      case 'overdue':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', text: 'Quá hạn' };
      case 'cancelled':
        return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db', text: 'Đã hủy' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db', text: 'Không xác định' };
    }
  };

  const handlePayOnline = async (payment: any) => {
    try {
      const data = await paymentAPI.createPayment(payment._id);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Không lấy được link thanh toán online. Vui lòng thử lại.');
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
    }
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
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', margin: 0 }}>Đang tải thông tin hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
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
          textAlign: 'center',
          maxWidth: '30rem'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            background: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <DocumentPlusIcon style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
          </div>
          <h3 style={{ color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            Không tìm thấy hóa đơn
          </h3>
          <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0' }}>
            {error || 'Hóa đơn không tồn tại hoặc đã bị xóa'}
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusColor(invoice.status);

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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          width: '100%',
          maxWidth: '1240px',
          marginLeft: 'auto',
          marginRight: 'auto',
          fontFamily: 'Inter, Roboto, Arial, Helvetica, sans-serif',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          marginTop: '30px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            {/* Trái: Nút quay lại + Icon + Tiêu đề */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <button
                onClick={() => router.back()}
                title="Quay lại"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 15px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  color: '#64748b',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <ArrowLeftIcon style={{ width: 20, height: 20 }} />
                <span></span>
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{
                  width: 54,
                  height: 54,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(16,185,129,0.15)'
                }}>
                  <BanknotesIcon style={{ width: 32, height: 32, color: 'white' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em'
                  }}>
                    Chi tiết hóa đơn
                  </span>
                  <span style={{
                    fontSize: '1.125rem',
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    Thông tin chi tiết về hóa đơn dịch vụ
                  </span>
                </div>
              </div>
            </div>

            {/* Phải: Để trống hoặc có thể thêm thông tin khác */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Status Information */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: statusConfig.color }} />
                Trạng thái hóa đơn
              </h2>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: statusConfig.bg,
                borderRadius: '0.75rem',
                border: `2px solid ${statusConfig.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '3rem',
                  height: '3rem',
                  background: statusConfig.color,
                  borderRadius: '50%',
                  color: 'white'
                }}>
                  {invoice.status === 'paid' && <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />}
                  {invoice.status === 'pending' && <ClockIcon style={{ width: '1.5rem', height: '1.5rem' }} />}
                  {invoice.status === 'overdue' && <ClockIcon style={{ width: '1.5rem', height: '1.5rem' }} />}
                  {invoice.status === 'cancelled' && <DocumentPlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />}
                </div>
                <div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: statusConfig.color,
                    marginBottom: '0.25rem'
                  }}>
                    {statusConfig.text}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>
                    {invoice.status === 'paid' && 'Hóa đơn đã được thanh toán thành công'}
                    {invoice.status === 'pending' && 'Hóa đơn đang chờ thanh toán'}
                    {invoice.status === 'overdue' && 'Hóa đơn đã quá hạn thanh toán'}
                    {invoice.status === 'cancelled' && 'Hóa đơn đã bị hủy'}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <DocumentPlusIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                Thông tin hóa đơn
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Mã hóa đơn:</span>
                  <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 700 }}>{invoice._id}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Mô tả:</span>
                  <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>
                    {invoice.care_plan_snapshot?.planName || invoice.notes || 'Hóa đơn dịch vụ'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Số tiền:</span>
                  <span style={{ fontSize: '1.125rem', color: '#16a34a', fontWeight: 700 }}>
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                Thông tin thanh toán
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#eff6ff',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Hạn thanh toán:</span>
                  <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 700 }}>
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#eff6ff',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Ngày thanh toán:</span>
                  <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 700 }}>
                    {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString('vi-VN') : 'Chưa thanh toán'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#eff6ff',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Phương thức:</span>
                  <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 700 }}>
                    {invoice.payment_method || 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
                
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Care Plan Information */}
            {invoice.care_plan_snapshot && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  Thông tin gói chăm sóc
                </h2>
                
                <div style={{
                  background: '#fef3c7',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>Tên gói:</span>
                    <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 700 }}>
                      {invoice.care_plan_snapshot.planName || 'N/A'}
                    </span>
                  </div>
                  
                  {invoice.care_plan_snapshot.description && (
                    <div style={{
                      background: 'white',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#92400e',
                        margin: 0,
                        lineHeight: 1.5
                      }}>
                        {invoice.care_plan_snapshot.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <DocumentPlusIcon style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
                  Ghi chú
                </h2>
                
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    {invoice.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BanknotesIcon style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                Thao tác
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => router.back()}
                  style={{
                    padding: '0.875rem 1.5rem',
                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(100, 116, 139, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(100, 116, 139, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(100, 116, 139, 0.3)';
                  }}
                >
                  Quay lại
                </button>
                
                {invoice.status !== 'paid' && (
                  <button
                    onClick={() => handlePayOnline(invoice)}
                    style={{
                      padding: '0.875rem 1.5rem',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(22, 163, 74, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(22, 163, 74, 0.3)';
                    }}
                  >
                    Thanh toán ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}