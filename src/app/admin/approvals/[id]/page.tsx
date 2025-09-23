"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from 'swr';
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { userAPI, API_BASE_URL } from "@/lib/api";
import SuccessModal from "@/components/SuccessModal";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, UserIcon } from "@heroicons/react/24/outline";

export default function ApprovalDetailPage() {
  // Add CSS for loading spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { user, loading } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || ""); // user id

  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | undefined>(undefined);
  const [successName, setSuccessName] = useState<string | undefined>(undefined);
  const [successActionType, setSuccessActionType] = useState<string | undefined>(undefined);
  const [successDetails, setSuccessDetails] = useState<string | undefined>(undefined);
  const [nextUrlAfterSuccess, setNextUrlAfterSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch user data for approval
  const { data: userDetail, error: userError } = useSWR(
    id ? ["user", id] : null,
    () => userAPI.getById(id),
    { 
      revalidateOnFocus: false, 
      dedupingInterval: 30000,
      onError: (error) => {
        console.warn('Failed to fetch user data:', error);
      }
    }
  );

  const isLoadingInitial = !userDetail;
  const showError = userError && !userDetail;

  const getStatusLabel = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
        return 'Tạm khóa';
      case 'deleted':
        return 'Đã xóa';
      case 'pending':
        return 'Chờ duyệt';
      case 'accepted':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status || '---';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return 'Quản trị viên';
      case 'staff':
        return 'Nhân viên';
      case 'family':
        return 'Gia đình';
      default:
        return role || '---';
    }
  };

  const approveUser = async () => {
    try {
      setBusy(true);
      if (userDetail?._id) {
        await userAPI.approveUser(userDetail._id);
        
        // Add notification for admin
        addNotification({
          type: 'success',
          title: 'Phê duyệt tài khoản thành công',
          message: `Tài khoản ${userDetail?.full_name || userDetail?.username || 'người dùng'} đã được phê duyệt thành công.`,
          category: 'system',
          actionUrl: '/admin/approvals'
        });
        
        setSuccessTitle('Phê duyệt tài khoản thành công!');
        setSuccessName(userDetail?.full_name || userDetail?.username || 'Tài khoản');
        setSuccessActionType('approve');
        setSuccessDetails('Tài khoản đã được phê duyệt thành công. Người dùng có thể đăng nhập và sử dụng hệ thống.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
      }
    } finally {
      setBusy(false);
    }
  };

  const rejectUser = async () => {
    try {
      const reason = window.prompt('Nhập lý do từ chối');
      if (reason === null) return;
      setBusy(true);
      if (userDetail?._id) {
        await userAPI.deactivateUser(userDetail._id, reason || undefined);
        
        // Add notification for admin
        addNotification({
          type: 'warning',
          title: 'Từ chối tài khoản',
          message: `Tài khoản ${userDetail?.full_name || userDetail?.username || 'người dùng'} đã bị từ chối${reason ? ` với lý do: ${reason}` : ''}.`,
          category: 'system',
          actionUrl: '/admin/approvals'
        });
        
        setSuccessTitle('Đã từ chối tài khoản');
        setSuccessName(userDetail?.full_name || userDetail?.username || 'Tài khoản');
        setSuccessActionType('reject');
        setSuccessDetails(reason ? `Lý do từ chối: ${reason}` : 'Tài khoản đã bị từ chối.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/admin/approvals')}
              title="Quay lại"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e9d5ff 100%)',
                  borderRadius: '0.9rem',
                  color: '#7c3aed',
                  border: '1px solid #e9d5ff',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(124, 58, 237, 0.15)'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
              <div>
            <h1 style={{
                  fontSize: '1.9rem',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.01em'
            }}>
              Chi tiết phê duyệt
            </h1>
                <div style={{ marginTop: '0.25rem', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                  Xem và xử lý yêu cầu phê duyệt tài khoản người dùng
                </div>
              </div>
            </div>
          </div>
        </div>

        {showError ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Không thể tải thông tin phê duyệt
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Không tìm thấy thông tin tài khoản với ID: {id}
            </div>
            <button
              onClick={() => router.push('/admin/approvals')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Quay lại danh sách phê duyệt
            </button>
          </div>
        ) : (isLoadingInitial) ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.9rem' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '1rem', width: '40%', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ height: '0.75rem', width: '25%', borderRadius: '0.5rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{ padding: '1rem', borderRadius: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="skeleton" style={{ height: '0.75rem', width: '40%', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '1rem', width: '70%', borderRadius: '0.5rem' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : userDetail && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1.5rem', 
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '0.9rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                }}>
                  <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    margin: 0,
                    color: '#1e293b',
                    letterSpacing: '-0.01em'
                  }}>
                    THÔNG TIN TÀI KHOẢN
                  </h2>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Thông tin chi tiết tài khoản người dùng
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1.5rem 0' }}>
                <div style={{
                  position: 'relative',
                  width: '6rem',
                  height: '6rem'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '9999px',
                    padding: '3px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #7c3aed)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor' as any,
                    maskComposite: 'exclude'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    background: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {userDetail.avatar ? (
                      <img
                        src={`${API_BASE_URL}/${String(userDetail.avatar || '').replace(/\\/g,'/')}`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <UserIcon style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
                    )}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    fontWeight: 600, 
                    marginBottom: '0.25rem', 
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Tài khoản:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <h1 style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: 800, 
                      color: '#0f172a', 
                      margin: 0,
                      letterSpacing: '-0.01em'
                    }}>
                      {userDetail.full_name || userDetail.username || '---'}
                    </h1>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#64748b', 
                      fontWeight: 600, 
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Trạng thái tài khoản:
                    </span>
                    {(() => {
                      const status = userDetail?.status;
                      const getStatusStyle = (status: string) => {
                        switch (status) {
                          case 'active':
                            return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
                          case 'inactive':
                            return 'bg-gradient-to-r from-gray-500 to-gray-600';
                          case 'suspended':
                            return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                          case 'deleted':
                            return 'bg-gradient-to-r from-red-500 to-red-600';
                          case 'pending':
                            return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                          case 'accepted':
                            return 'bg-gradient-to-r from-green-500 to-green-600';
                          case 'rejected':
                            return 'bg-gradient-to-r from-red-500 to-red-600';
                          default:
                            return 'bg-gradient-to-r from-slate-500 to-slate-600';
                        }
                      };
                      return (
                        <span className={`text-sm font-semibold text-white rounded-full px-4 py-1.5 shadow-lg uppercase tracking-wider text-center ${getStatusStyle(status)}`}>
                          {getStatusLabel(userDetail.status)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '0.75rem 0 1.25rem 0' }} />

              <div style={{
                padding: '1.75rem',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1.5rem',
                  padding: '0 1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Họ và tên</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{userDetail.full_name || '---'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Email</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{userDetail.email || '---'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Số điện thoại</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{userDetail.phone || '---'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Địa chỉ</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{userDetail.address || '---'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Vai trò</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{getRoleLabel(userDetail.role)}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Ngày tạo tài khoản</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                </div>
              </div>

              {/* CCCD section for user account */}
              {(userDetail?.cccd_id || userDetail?.cccd_front || userDetail?.cccd_back) && (
                <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: '#059669' }} />
                    <div style={{ color: '#065f46', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CCCD tài khoản</div>
                  </div>
                  {userDetail?.cccd_id && (
                    <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700, marginBottom: '0.75rem' }}>
                      Số CCCD: {userDetail.cccd_id}
                    </div>
                  )}
                  {(userDetail?.cccd_front || userDetail?.cccd_back) && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {userDetail?.cccd_front && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#059669', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            textAlign: 'center'
                          }}>
                            Ảnh mặt trước
                          </div>
                          <a href={`${API_BASE_URL}/${String(userDetail.cccd_front).replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{ 
                            display: 'block', 
                            width: '10rem', 
                            height: '7rem', 
                            overflow: 'hidden', 
                            borderRadius: '0.5rem', 
                            border: '2px solid #059669', 
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
                          }}>
                            <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={`${API_BASE_URL}/${String(userDetail.cccd_front).replace(/\\/g,'/')}`} alt="CCCD mặt trước" />
                          </a>
                        </div>
                      )}
                      {userDetail?.cccd_back && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#059669', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            textAlign: 'center'
                          }}>
                            Ảnh mặt sau
                          </div>
                          <a href={`${API_BASE_URL}/${String(userDetail.cccd_back).replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{ 
                            display: 'block', 
                            width: '10rem', 
                            height: '7rem', 
                            overflow: 'hidden', 
                            borderRadius: '0.5rem', 
                            border: '2px solid #059669', 
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
                          }}>
                            <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={`${API_BASE_URL}/${String(userDetail.cccd_back).replace(/\\/g,'/')}`} alt="CCCD mặt sau" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1.5rem', 
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '0.9rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                }}>
                  <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    margin: 0,
                    color: '#1e293b',
                    letterSpacing: '-0.01em'
                  }}>
                    PHÊ DUYỆT
                  </h2>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Xem xét và quyết định phê duyệt hoặc từ chối yêu cầu
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={approveUser}
                  disabled={busy}
                  title="Phê duyệt"
                  aria-label="Phê duyệt"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    background: busy ? '#10b98180' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: busy ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 8px 25px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => { 
                    if (!busy) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => { 
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = busy ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 8px 25px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  </div>
                  Phê duyệt
                </button>
                
                <button
                  onClick={rejectUser}
                  disabled={busy}
                  title="Từ chối"
                  aria-label="Từ chối"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    background: busy ? '#ef444480' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: busy ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 8px 25px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => { 
                    if (!busy) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 35px rgba(239, 68, 68, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => { 
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = busy ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 8px 25px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <XCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  </div>
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        <ApprovalSuccessModal
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            if (nextUrlAfterSuccess) {
              const url = nextUrlAfterSuccess;
              setNextUrlAfterSuccess(null);
              try { router.push(url); } catch {}
            }
          }}
          title={successTitle}
          name={successName}
          actionType={successActionType}
          details={successDetails}
        />
      </div>
    </div>
  );
}

// Approval Success Modal Component
function ApprovalSuccessModal({ 
  open, 
  onClose, 
  title, 
  name, 
  actionType, 
  details 
}: { 
  open: boolean; 
  onClose: () => void; 
  title?: string; 
  name?: string; 
  actionType?: string; 
  details?: string; 
}) {
  if (!open) return null;

  const isApproved = actionType === 'approve';
  const isRejected = actionType === 'reject';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            color: '#64748b',
            fontSize: '1.5rem',
            lineHeight: 1
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            background: isApproved 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : isRejected
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isApproved 
              ? '0 10px 25px rgba(16, 185, 129, 0.3)'
              : isRejected
                ? '0 10px 25px rgba(239, 68, 68, 0.3)'
                : '0 10px 25px rgba(107, 114, 128, 0.3)'
          }}>
            {isApproved ? (
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            ) : isRejected ? (
              <XCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            ) : (
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: '#1e293b',
            letterSpacing: '-0.01em'
          }}>
            {title || 'Thành công!'}
          </h2>
        </div>

        {/* Name */}
        {name && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '0.5rem'
            }}>
              {isApproved ? 'Đã phê duyệt:' : isRejected ? 'Đã từ chối:' : 'Đối tượng:'}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b'
            }}>
              {name}
            </div>
          </div>
        )}

        {/* Details */}
        {details && (
          <div style={{
            background: isApproved 
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : isRejected
                ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: `1px solid ${isApproved ? '#a7f3d0' : isRejected ? '#fecaca' : '#cbd5e1'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: isApproved ? '#065f46' : isRejected ? '#991b1b' : '#475569',
              lineHeight: '1.5',
              textAlign: 'center'
            }}>
              {details}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              background: isApproved 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : isRejected
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: isApproved 
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : isRejected
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(107, 114, 128, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {isApproved ? 'Tiếp tục' : isRejected ? 'Đóng' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';