"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface PendingItem {
  id: string;
  type: 'registration' | 'cancellation';
  residentName: string;
  residentAge: number;
  residentRoom: string;
  registrationId: string;
  packageType?: string;
  price?: number;
  finalPrice?: number;
  discount?: number;
  discountAmount?: number;
  purchaseDate?: string;
  startDate?: string;
  paymentMethod?: string;
  medicalNotes?: string;
  cancellationRequest?: {
    requestedDate: string;
    requestedBy: string;
    reason: string;
    status: string;
  };
}

export default function ActivityApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  const loadPendingItems = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const pending = residents
          .filter((r: any) => {
            if (r.carePackage && r.carePackage.status === 'pending_approval') {
              return true;
            }
            if (r.carePackage && r.carePackage.cancellationRequest && 
                r.carePackage.cancellationRequest.status === 'pending_approval') {
              return true;
            }
            return false;
          })
          .map((r: any) => {
            if (r.carePackage.status === 'pending_approval') {
              return {
                id: r.carePackage.registrationId,
                type: 'registration' as const,
                residentName: r.name,
                residentAge: r.age,
                residentRoom: r.room,
                registrationId: r.carePackage.registrationId,
                packageType: r.carePackage.packageType,
                price: r.carePackage.price,
                finalPrice: r.carePackage.finalPrice,
                discount: r.carePackage.discount,
                discountAmount: r.carePackage.discountAmount,
                purchaseDate: r.carePackage.purchaseDate,
                startDate: r.carePackage.startDate,
                paymentMethod: r.carePackage.paymentMethod,
                medicalNotes: r.carePackage.medicalNotes
              };
            } else if (r.carePackage.cancellationRequest) {
              return {
                id: r.carePackage.registrationId,
                type: 'cancellation' as const,
                residentName: r.name,
                residentAge: r.age,
                residentRoom: r.room,
                registrationId: r.carePackage.registrationId,
                packageType: r.carePackage.packageType,
                cancellationRequest: r.carePackage.cancellationRequest
              };
            }
            return null;
          })
          .filter(Boolean);
        setPendingItems(pending);
      }
    } catch (error) {
      console.error('Error loading pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingItems();
  }, []);

  const handleApprove = (item: PendingItem) => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = residents.map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === item.registrationId) {
            if (item.type === 'registration') {
              return {
                ...r,
                carePackage: {
                  ...r.carePackage,
                  status: 'active',
                  approvedDate: new Date().toISOString(),
                  approvedBy: user?.name || 'Quản trị viên'
                }
              };
            } else if (item.type === 'cancellation') {
              return {
                ...r,
                carePackage: {
                  ...r.carePackage,
                  status: 'cancelled',
                  cancelledDate: new Date().toISOString(),
                  cancelledBy: user?.name || 'Quản trị viên',
                  cancellationRequest: {
                    ...r.carePackage.cancellationRequest,
                    status: 'approved',
                    approvedDate: new Date().toISOString(),
                    approvedBy: user?.name || 'Quản trị viên'
                  }
                }
              };
            }
          }
          return r;
        });
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingItems();
        alert(`✅ Đã duyệt ${item.type === 'registration' ? 'đăng ký' : 'yêu cầu hủy'} thành công!`);
      }
    } catch (error) {
      console.error('Error approving item:', error);
      alert('❌ Có lỗi xảy ra khi duyệt!');
    }
  };

  const handleReject = (item: PendingItem) => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = residents.map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === item.registrationId) {
            if (item.type === 'registration') {
              return {
                ...r,
                carePackage: {
                  ...r.carePackage,
                  status: 'rejected',
                  rejectedDate: new Date().toISOString(),
                  rejectedBy: user?.name || 'Quản trị viên',
                  rejectionReason: 'Đã từ chối'
                }
              };
            } else if (item.type === 'cancellation') {
              return {
                ...r,
                carePackage: {
                  ...r.carePackage,
                  cancellationRequest: {
                    ...r.carePackage.cancellationRequest,
                    status: 'rejected',
                    rejectedDate: new Date().toISOString(),
                    rejectedBy: user?.name || 'Quản trị viên',
                    rejectionReason: 'Đã từ chối'
                  }
                }
              };
            }
          }
          return r;
        });
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingItems();
        alert(`❌ Đã từ chối ${item.type === 'registration' ? 'đăng ký' : 'yêu cầu hủy'}!`);
      }
    } catch (error) {
      console.error('Error rejecting item:', error);
      alert('❌ Có lỗi xảy ra khi từ chối!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.125rem', color: '#374151' }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)', color: 'white', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Duyệt Hoạt Động</h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '1.5rem' }}>Quản lý và duyệt các yêu cầu đăng ký gói dịch vụ và hủy gói dịch vụ</p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingItems.length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Tổng yêu cầu</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingItems.filter(item => item.type === 'registration').length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Đăng ký mới</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingItems.filter(item => item.type === 'cancellation').length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Yêu cầu hủy</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {pendingItems.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockIcon style={{ width: '32px', height: '32px', color: '#94a3b8' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Không có yêu cầu chờ duyệt</h3>
            <p style={{ color: '#6b7280' }}>Tất cả các yêu cầu đã được xử lý</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {pendingItems.map((item) => (
              <div key={item.id} style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ background: item.type === 'cancellation' ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: item.type === 'cancellation' ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {item.type === 'cancellation' ? (<ExclamationTriangleIcon style={{ width: '24px', height: '24px' }} />) : (<DocumentTextIcon style={{ width: '24px', height: '24px' }} />)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{item.type === 'cancellation' ? 'Yêu cầu hủy gói dịch vụ' : 'Đăng ký gói dịch vụ'}</h3>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Mã: {item.registrationId}</p>
                      </div>
                    </div>
                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }}>CHỜ DUYỆT</div>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                      <span style={{ fontWeight: 500 }}>{item.residentName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                      <span>{item.residentAge} tuổi - Phòng {item.residentRoom}</span>
                    </div>
                  </div>
                  {item.type === 'registration' ? (
                    <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>Thông tin gói dịch vụ</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gói dịch vụ:</span><div style={{ fontWeight: 500 }}>{item.packageType}</div></div>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Giá:</span><div style={{ fontWeight: 500, color: '#059669' }}>{formatCurrency(item.finalPrice || 0)}</div></div>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ngày đăng ký:</span><div style={{ fontWeight: 500 }}>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('vi-VN') : 'N/A'}</div></div>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Phương thức thanh toán:</span><div style={{ fontWeight: 500 }}>{item.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</div></div>
                      </div>
                      {item.medicalNotes && (<div style={{ marginTop: '0.75rem' }}><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ghi chú y tế:</span><div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{item.medicalNotes}</div></div>)}
                    </div>
                  ) : (
                    <div style={{ background: '#fef2f2', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#dc2626' }}>Thông tin yêu cầu hủy</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gói hiện tại:</span><div style={{ fontWeight: 500 }}>{item.packageType}</div></div>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Lý do hủy:</span><div style={{ fontWeight: 500, color: '#dc2626' }}>{item.cancellationRequest?.reason}</div></div>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ngày yêu cầu:</span><div style={{ fontWeight: 500 }}>{item.cancellationRequest?.requestedDate ? new Date(item.cancellationRequest.requestedDate).toLocaleDateString('vi-VN') : 'N/A'}</div></div>
                        <div><span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Người yêu cầu:</span><div style={{ fontWeight: 500 }}>{item.cancellationRequest?.requestedBy}</div></div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <button onClick={() => handleReject(item)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}><XMarkIcon style={{ width: '20px', height: '20px' }} />Từ chối</button>
                    <button onClick={() => handleApprove(item)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)'; }}>{item.type === 'cancellation' ? 'Duyệt hủy' : 'Duyệt'}<CheckCircleIcon style={{ width: '20px', height: '20px' }} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 