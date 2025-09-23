"use client";

import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import {
  UserIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  KeyIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ClockIcon,
  UserCircleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { userAPI, residentAPI } from '@/lib/api';
import axios from 'axios';

interface User {
  _id: string;
  avatar?: string | null;
  full_name: string;
  email: string;
  phone: string;
  username: string;
  role: 'admin' | 'staff' | 'family';
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | 'pending';
  is_super_admin?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

const activateUser = async (id: string) => axios.patch(`/users/${id}/activate`);
const deactivateUser = async (id: string) => axios.patch(`/users/${id}/deactivate`);

export default function AccountManagementPage() {
  const modalAnimationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .hide-header .header {
      display: none !important;
    }
  `;

  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = modalAnimationStyles;
    document.head.appendChild(styleSheet);
    return () => {
      if (styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, []);

  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [familyAccounts, setFamilyAccounts] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'family'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('all');

  // const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);

  const [formData, setFormData] = useState<any>({});

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const [linkedResidents, setLinkedResidents] = useState<any[]>([]);
  const [loadingLinkedResidents, setLoadingLinkedResidents] = useState(false);
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'family') router.replace('/family');
      else router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const hasModalOpen = /* showCreateModal || */ showEditModal || showDetailModal || showDeleteModal;

    if (hasModalOpen) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [/*showCreateModal,*/ showEditModal, showDetailModal, showDeleteModal]);

  useEffect(() => {
    async function fetchAccounts() {
      setLoadingData(true);
      try {
        const allUsers: User[] = await userAPI.getAll();
        const staff = allUsers.filter((u) => u.role === 'admin' || u.role === 'staff');
        const family = allUsers.filter((u) => u.role === 'family');
        setStaffUsers(staff);
        setFamilyAccounts(family);
      } catch (err) {
        toast.error('Lỗi khi tải dữ liệu tài khoản!');
      } finally {
        setLoadingData(false);
      }
    }
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!showDetailModal) {
      setLinkedResidents([]);
      setLoadingLinkedResidents(false);
    }
  }, [showDetailModal]);

  // Create account removed

  const handleEdit = (account: User) => {
    setSelectedAccount(account);
    setFormData(account);
    setShowEditModal(true);
  };

  const handleView = async (account: User) => {
    router.push(`/admin/account-management/${account._id}`);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAccount(null);
    setLinkedResidents([]);
    setLoadingLinkedResidents(false);
  };

  const handleDelete = (account: User) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;
    setLoadingData(true);
    try {
      if (activeTab === 'staff') {
        if (Array.isArray((selectedAccount as any).roles) && (selectedAccount as any).roles.includes('admin')) {
          toast.error('Không thể xóa tài khoản admin!');
          setShowDeleteModal(false);
          setSelectedAccount(null);
          setLoadingData(false);
          return;
        }
      }
      setShowDeleteModal(false);
      setSelectedAccount(null);
    } catch (err) {
      toast.error('Lỗi khi xóa tài khoản!');
    } finally {
      setLoadingData(false);
    }
  };

  const saveAccount = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'staff') {
        if (showEditModal && selectedAccount) {
          await userAPI.update(String(selectedAccount._id), formData);
          toast.success(`Đã cập nhật tài khoản ${formData.name || formData.full_name} thành công!`);
          const data = await userAPI.getAll();
          setStaffUsers(data.filter((u: any) => u.role === 'admin' || u.role === 'staff'));
        }
      } else {
        if (showEditModal && selectedAccount) {
          await userAPI.update(String(selectedAccount._id), formData);
          toast.success(`Đã cập nhật tài khoản ${formData.fullName} thành công!`);
          const data = await userAPI.getAll();
          setFamilyAccounts(data.filter((u: any) => u.role === 'family'));
        }
      }
      setShowEditModal(false);
      setFormData({});
    } catch (err) {
      toast.error('Lỗi khi lưu tài khoản!');
    } finally {
      setLoadingData(false);
    }
  };

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'Quản trị viên':
        return ['Đọc', 'Ghi', 'Chỉnh sửa', 'Xóa'];
      case 'Bác sĩ':
        return ['Đọc', 'Ghi', 'Chỉnh sửa'];
      case 'Y tá':
        return ['Đọc', 'Ghi', 'Chỉnh sửa'];
      case 'Kế toán':
        return ['Đọc', 'Ghi', 'Chỉnh sửa'];
      default:
        return ['Đọc', 'Ghi'];
    }
  };

  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'suspended': return 'Tạm khóa';
      case 'deleted': return 'Đã xóa';
      case 'pending': return 'Chờ duyệt';
      default: return status;
    }
  };

  const TabButton = ({ tabKey, children, icon: Icon }: { tabKey: 'staff' | 'family', children: React.ReactNode, icon: any }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.625rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        fontWeight: 600,
        fontSize: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: activeTab === tabKey
          ? '#8b5cf6'
          : 'transparent',
        color: activeTab === tabKey ? 'white' : '#6b7280',
        boxShadow: activeTab === tabKey
          ? '0 2px 4px rgba(139, 92, 246, 0.2)'
          : 'none'
      }}
    >
      <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
      {children}
    </button>
  );

  const StaffListItem = ({ user }: { user: User }) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          padding: '1.25rem 2rem',
          marginBottom: '1.25rem',
          gap: '1.5rem',
          transition: 'box-shadow 0.2s, transform 0.15s',
        }}
        onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
      >

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: user.avatar ? 'transparent' : '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: '#6366f1',
            border: '2px solid #e0e7ff',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {user.avatar ? (
            <img
              src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'https://sep490-be-xniz.onrender.com'}/${user.avatar}`}
              alt={user.full_name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
              onError={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.display = 'none';
                const nextSibling = target.nextElementSibling as HTMLElement;
                if (nextSibling) {
                  nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div style={{
            display: user.avatar ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <UserCircleIcon style={{ width: 36, height: 36 }} />
          </div>
        </div>


        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: 8 }}>
            <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Tên:</span> {user.full_name}
          </div>
          <div style={{ display: 'flex', gap: '2.5rem', marginBottom: 6 }}>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>
              <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Chức vụ:</span> {user.position || user.role}
            </span>
            
          </div>
          <div style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 2 }}>
            <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Email:</span> {user.email}
          </div>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>

          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background:
                user.status === 'active' ? '#dcfce7' :
                user.status === 'inactive' ? '#f3f4f6' :
                user.status === 'suspended' ? '#fef9c3' :
                user.status === 'deleted' ? '#fee2e2' :
                user.status === 'pending' ? '#dbeafe' : '#f3f4f6',
              color:
                user.status === 'active' ? '#16a34a' :
                user.status === 'inactive' ? '#64748b' :
                user.status === 'suspended' ? '#b45309' :
                user.status === 'deleted' ? '#dc2626' :
                user.status === 'pending' ? '#1d4ed8' : '#64748b',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Trạng thái:</span>
            {getStatusDisplay(user.status)}
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); handleView(user); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <EyeIcon style={{ width: 20, height: 20, color: '#0ea5e9' }} />
            </button>
            <button title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); router.push(`/admin/account-management/edit/${user._id}`); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <PencilIcon style={{ width: 20, height: 20, color: '#6366f1' }} />
            </button>
            <button title="Cấp lại mật khẩu" onClick={(e) => { e.stopPropagation(); handleResetPassword(user); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <KeyIcon style={{ width: 20, height: 20, color: '#059669' }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FamilyListItem = ({ account }: { account: User }) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          padding: '1.25rem 2rem',
          marginBottom: '1.25rem',
          gap: '1.5rem',
          transition: 'box-shadow 0.2s, transform 0.15s',
        }}
        onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
      >

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: account.avatar ? 'transparent' : '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: '#f59e42',
            border: '2px solid #fde68a',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {account.avatar ? (
            <img
              src={account.avatar.startsWith('http') ? account.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'https://sep490-be-xniz.onrender.com'}/${account.avatar}`}
              alt={account.full_name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
              onError={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.display = 'none';
                const nextSibling = target.nextElementSibling as HTMLElement;
                if (nextSibling) {
                  nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div style={{
            display: account.avatar ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <UserIcon style={{ width: 36, height: 36 }} />
          </div>
        </div>


        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: 8 }}>
            <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Tên:</span>
            {account.full_name}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 2 }}>
            <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Email:</span> {account.email}
          </div>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>

          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background:
                account.status === 'active' ? '#dcfce7' :
                account.status === 'inactive' ? '#f3f4f6' :
                account.status === 'suspended' ? '#fef9c3' :
                account.status === 'deleted' ? '#fee2e2' :
                account.status === 'pending' ? '#dbeafe' : '#f3f4f6',
              color:
                account.status === 'active' ? '#16a34a' :
                account.status === 'inactive' ? '#64748b' :
                account.status === 'suspended' ? '#b45309' :
                account.status === 'deleted' ? '#dc2626' :
                account.status === 'pending' ? '#1d4ed8' : '#64748b',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 500, marginRight: 4 }}>Trạng thái:</span>
            {getStatusDisplay(account.status)}
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); handleView(account); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <EyeIcon style={{ width: 20, height: 20, color: '#0ea5e9' }} />
            </button>
            <button title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); router.push(`/admin/account-management/edit/${account._id}`); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <PencilIcon style={{ width: 20, height: 20, color: '#6366f1' }} />
            </button>
            <button title="Cấp lại mật khẩu" onClick={(e) => { e.stopPropagation(); handleResetPassword(account); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <KeyIcon style={{ width: 20, height: 20, color: '#059669' }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setResetPassword('');
    setResetPasswordConfirm('');
    setResetPasswordError('');
    setResetPasswordSuccess('');
    setShowResetPasswordModal(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '3rem 2rem',
        position: 'relative',
        zIndex: 1
      }}>

        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>

          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)
            `,
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1)'
                }}>
                  <UsersIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'white',
                    letterSpacing: '-0.025em',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    Quản lý người dùng
                  </h1>
                  <p style={{
                    fontSize: '1.125rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    margin: '0.5rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Quản lý tài khoản nhân viên và gia đình của hệ thống
                  </p>
                </div>
              </div>


              <div style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '0.5rem',
                padding: '0.25rem',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}>
                <TabButton tabKey="staff" icon={ShieldCheckIcon}>
                  Nhân viên
                </TabButton>
                <TabButton tabKey="family" icon={UserIcon}>
                  Gia đình
                </TabButton>
              </div>
              {/* Create button removed */}
            </div>
          </div>
        </div>



        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1.125rem',
                  height: '1.125rem',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  type="text"
                  placeholder={activeTab === 'staff' ? 'Tìm theo tên, email nhân viên...' : 'Tìm theo tên, username, email gia đình...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '2.5rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                />
                {searchTerm && (
                  <button
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <XCircleIcon style={{ width: '1.125rem', height: '1.125rem', color: '#9ca3af' }} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '280px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontWeight: 600
              }}>
                Trạng thái
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'active', label: 'Hoạt động' },
                { key: 'pending', label: 'Chờ duyệt' },
                { key: 'suspended', label: 'Tạm khóa' }
              ].map(s => (
                <button
                  key={s.key}
                  aria-pressed={statusFilter === s.key}
                  onClick={() => setStatusFilter(s.key)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '999px',
                    border: `1px solid ${statusFilter === s.key ? '#8b5cf6' : '#e5e7eb'}`,
                    background: statusFilter === s.key
                      ? 'linear-gradient(180deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.08) 100%)'
                      : '#f8fafc',
                    color: statusFilter === s.key ? '#6d28d9' : '#374151',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === s.key
                      ? 'inset 0 0 0 1px rgba(109,40,217,0.12), 0 1px 2px rgba(0,0,0,0.04)'
                      : '0 1px 1px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    if (statusFilter === s.key) {
                      el.style.filter = 'brightness(0.98)';
                    } else {
                      el.style.background = '#f1f5f9';
                    }
                  }}
                  onMouseOut={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.filter = 'none';
                    el.style.background = statusFilter === s.key
                      ? 'linear-gradient(180deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.08) 100%)'
                      : '#f8fafc';
                  }}
                >
                  {s.label}
                </button>
              ))}
              </div>
            </div>
          </div>
        </div>


        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          {loadingData ? (
            <div>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  borderRadius: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e5e7eb',
                  padding: '1.25rem 2rem',
                  marginBottom: '1.25rem',
                  gap: '1.5rem'
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, width: '40%', background: '#e5e7eb', borderRadius: 8, marginBottom: 8 }} />
                    <div style={{ height: 12, width: '60%', background: '#e5e7eb', borderRadius: 8 }} />
                  </div>
                  <div style={{ width: 120, height: 28, background: '#e5e7eb', borderRadius: 999 }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'staff' ? (
                <div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ShieldCheckIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                    Tài khoản nhân viên ({staffUsers.filter(user => {
                      const matchesSearch = (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    }).length} tài khoản)
                  </div>
                  {staffUsers
                    .filter(user => {
                      const matchesSearch = (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((user, idx) => <StaffListItem key={user._id ? String(user._id) : `staff-${idx}`} user={user} />)
                  }
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                    Tài khoản gia đình ({familyAccounts.filter(account => {
                      const matchesSearch = (account.full_name && account.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    }).length} tài khoản)
                  </div>
                  {familyAccounts
                    .filter(account => {
                      const matchesSearch = (account.full_name && account.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((account, idx) => <FamilyListItem key={account._id ? String(account._id) : `family-${idx}`} account={account} />)
                  }
                </div>
              )}
            </>
          )}
        </div>


        {((activeTab === 'staff' && staffUsers.filter(user => {
          const matchesSearch = (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
          return matchesSearch && matchesStatus;
        }).length === 0) ||
          (activeTab === 'family' && familyAccounts.filter(account => {
            const matchesSearch = (account.full_name && account.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0)) && (searchTerm || statusFilter !== 'all') && (
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '4rem 2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              marginTop: '2rem'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <MagnifyingGlassIcon style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                Không tìm thấy kết quả
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {searchTerm && statusFilter !== 'all' 
                  ? `Không có ${activeTab === 'staff' ? 'nhân viên' : 'tài khoản gia đình'} nào phù hợp với từ khóa "${searchTerm}" và trạng thái "${getStatusDisplay(statusFilter)}".`
                  : searchTerm 
                    ? `Không có ${activeTab === 'staff' ? 'nhân viên' : 'tài khoản gia đình'} nào phù hợp với từ khóa "${searchTerm}".`
                    : `Không có ${activeTab === 'staff' ? 'nhân viên' : 'tài khoản gia đình'} nào có trạng thái "${getStatusDisplay(statusFilter)}".`
                }
              </p>
            </div>
          )}
      </div>

      {/* CreateAccountModal removed */}
      {showEditModal && <EditAccountModal />}
      {showDeleteModal && <DeleteConfirmModal />}
      {showResetPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', minWidth: 350, maxWidth: 400 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: '#059669' }}>
              Cấp lại mật khẩu cho tài khoản
            </h2>
            <div style={{ marginBottom: 12, color: '#374151', fontWeight: 500 }}>
              {resetPasswordUser?.full_name} ({resetPasswordUser?.username})
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>Mật khẩu mới</label>
              <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}
                placeholder="Nhập mật khẩu mới" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>Nhập lại mật khẩu</label>
              <input type="password" value={resetPasswordConfirm} onChange={e => setResetPasswordConfirm(e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}
                placeholder="Nhập lại mật khẩu mới" />
            </div>
            {resetPasswordError && <div style={{ color: '#dc2626', marginBottom: 8 }}>{resetPasswordError}</div>}
            {resetPasswordSuccess && <div style={{ color: '#059669', marginBottom: 8 }}>{resetPasswordSuccess}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowResetPasswordModal(false)}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                Hủy
              </button>
              <button
                onClick={async () => {
                  setResetPasswordError('');
                  setResetPasswordSuccess('');
                  if (!resetPassword || resetPassword.length < 6) {
                    setResetPasswordError('Mật khẩu phải có ít nhất 6 ký tự.');
                    return;
                  }
                  if (resetPassword !== resetPasswordConfirm) {
                    setResetPasswordError('Mật khẩu nhập lại không khớp.');
                    return;
                  }
                  setResetPasswordLoading(true);
                  try {
                    await userAPI.resetPassword(resetPasswordUser!._id, resetPassword);
                    setResetPasswordSuccess('Cấp lại mật khẩu thành công!');
                    setTimeout(() => {
                      setShowResetPasswordModal(false);
                    }, 1200);
                  } catch (err) {
                    setResetPasswordError('Có lỗi khi cấp lại mật khẩu.');
                  } finally {
                    setResetPasswordLoading(false);
                  }
                }}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#059669', color: 'white', border: 'none', fontWeight: 600, cursor: resetPasswordLoading ? 'not-allowed' : 'pointer', opacity: resetPasswordLoading ? 0.7 : 1 }}
                disabled={resetPasswordLoading}
              >
                {resetPasswordLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function CreateAccountModal() {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        marginLeft: '12rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '0',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f1f5f9'
        }}>

          <div style={{
            background: 'white',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',

          }}>

          </div>


          <div style={{
            padding: '2rem',
            maxHeight: 'calc(90vh - 10rem)',
            overflow: 'auto'
          }}>

            {activeTab === 'staff' ? (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    Chọn nhân viên <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 400,
                      display: 'block',
                      marginTop: '0.25rem'
                    }}>
                      Những nhân viên chưa có tài khoản
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                  </div>
                </div>

                {formData.selectedStaffId && (
                  <>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <UserIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            margin: 0,
                            color: '#0f172a'
                          }}>
                            Thông tin nhân viên được chọn
                          </h3>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#475569',
                            margin: '0.25rem 0 0 0'
                          }}>
                            Dữ liệu sẽ được tự động điền
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.75rem'
                          }}>
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            value={formData.name || ''}
                            disabled
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#475569',
                              fontWeight: 500
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.75rem'
                          }}>
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email || ''}
                            disabled
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#475569',
                              fontWeight: 500
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.75rem'
                          }}>
                            Chức vụ
                          </label>
                          <input
                            type="text"
                            value={formData.role || ''}
                            disabled
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#475569',
                              fontWeight: 500
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.75rem'
                          }}>
                            Phòng ban
                          </label>
                          <input
                            type="text"
                            value={formData.department || ''}
                            disabled
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#475569',
                              fontWeight: 500
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    <KeyIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
                    Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#10b981';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Chọn người giám hộ <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400, display: 'block', marginTop: '0.25rem' }}>
                      Người thân chưa có tài khoản
                    </span>
                  </label>
                  <select
                    value={formData.selectedGuardianId || ''}
                    onChange={(e) => setFormData({ ...formData, selectedGuardianId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1rem'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">-- Chọn người giám hộ --</option>

                  </select>
                </div>

                {formData.selectedGuardianId && (
                  <>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
                        Thông tin người cao tuổi
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#374151' }}>
                        <strong>Người cao tuổi:</strong> {formData.residentName} (ID: {formData.residentId})
                        <br />
                        <strong>Mối quan hệ:</strong> {formData.relationship}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Tên đăng nhập *</label>
                        <input
                          type="text"
                          value={formData.username || ''}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="Tự động tạo từ tên"
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Họ và tên</label>
                        <input
                          type="text"
                          value={formData.fullName || ''}
                          disabled
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            background: '#f9fafb',
                            color: '#6b7280'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Email</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          disabled
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            background: '#f9fafb',
                            color: '#6b7280'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Số điện thoại</label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          disabled
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            background: '#f9fafb',
                            color: '#6b7280'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Mật khẩu *</label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Ghi chú</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Nhập ghi chú về tài khoản (tùy chọn)"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
            )}
          </div>


          <div style={{
            background: '#f8fafc',
            padding: '1rem 2rem 1rem 2rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '-1rem'
          }}>
            {/* Create modal controls removed */}
            {/* Create action removed */}
          </div>
        </div>
      </div>
    );
  }

  function EditAccountModal() {
    if (!selectedAccount) return null;

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const isStaff = 'role' in selectedAccount;

    const validateForm = () => {
      const newErrors: { [key: string]: string } = {};

      if (isStaff) {
        if (!formData.name?.trim()) newErrors.name = 'Tên không được để trống';
        if (!formData.email?.trim()) newErrors.email = 'Email không được để trống';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
        if (!formData.role) newErrors.role = 'Vui lòng chọn vai trò';
        if (!formData.department?.trim()) newErrors.department = 'Phòng ban không được để trống';
      } else {
        if (!formData.username?.trim()) newErrors.username = 'Tên đăng nhập không được để trống';
        if (!formData.fullName?.trim()) newErrors.fullName = 'Họ tên không được để trống';
        if (!formData.email?.trim()) newErrors.email = 'Email không được để trống';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
        if (!formData.phone?.trim()) newErrors.phone = 'Số điện thoại không được để trống';
        else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
      if (validateForm()) {
        saveAccount();
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        marginLeft: '12rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e2e8f0',

          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
              }}>
                <PencilIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.7rem',
                  fontWeight: 600,
                  margin: 0,
                  color: '#3b82f6',
                  marginBottom: '0.25rem'
                }}>
                  Chỉnh sửa tài khoản {isStaff ? 'nhân viên' : 'gia đình'}
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#1d4ed8',
                  margin: 0
                }}>
                  Cập nhật thông tin tài khoản
                </p>
              </div>
            </div>
          </div>


          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {isStaff ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Tên nhân viên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || formData.full_name || ''}
                      onChange={e => {
                        setFormData({ ...formData, name: e.target.value, full_name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.name ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={e => e.currentTarget.style.borderColor = errors.name ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.name}</span>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Vai trò <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={formData.role || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, role: e.target.value });
                        if (errors.role) setErrors({ ...errors, role: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.role ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        background: 'white'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.role ? '#ef4444' : '#e5e7eb'}
                    >
                      <option value="">Chọn vai trò</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="staff">Nhân viên</option>
                      <option value="family">Gia đình</option>
                    </select>
                    {errors.role && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.role}</span>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Chức vụ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.position || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, position: e.target.value });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>


                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Trạng thái
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      background: 'white'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="suspended">Tạm khóa</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="deleted">Đã xóa</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Tên đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, username: e.target.value });
                        if (errors.username) setErrors({ ...errors, username: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.username ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.username ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.username && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.username}</span>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Họ tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.fullName ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.fullName ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.fullName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.fullName}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email}</span>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.phone ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.phone ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.phone}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Liên hệ khẩn cấp
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact || ''}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>


                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Trạng thái
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      background: 'white'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="suspended">Tạm khóa</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="deleted">Đã xóa</option>
                  </select>
                </div>
              </>
            )}
          </div>


          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                padding: '0.875rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                fontSize: '0.875rem',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
              }}
            >
              <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    );
  }

  function DetailModal() {
    if (!selectedAccount) return null;

    const isStaff = selectedAccount.role === 'staff' || selectedAccount.role === 'admin';
    const isFamily = selectedAccount.role === 'family';

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        marginLeft: '12rem',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: 0,
          width: '95%',
          maxWidth: '900px',
          maxHeight: '95vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>

          <div style={{
            background: isStaff ? 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)' : 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)',
            padding: '2rem 2.5rem',
            borderRadius: '1rem 1rem 0 0',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: selectedAccount.avatar ? 'transparent' : 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              border: isStaff ? '2px solid #e0e7ff' : '2px solid #fde68a',
              overflow: 'hidden',
            }}>
              {selectedAccount.avatar ? (
                <img
                  src={selectedAccount.avatar.startsWith('http') ? selectedAccount.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'https://sep490-be-xniz.onrender.com'}/${selectedAccount.avatar}`}
                  alt={selectedAccount.full_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.display = 'none';
                    const nextSibling = target.nextElementSibling as HTMLElement;
                    if (nextSibling) {
                      nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div style={{
                display: selectedAccount.avatar ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}>
                {isStaff ? (
                  <UserCircleIcon style={{ width: 40, height: 40, color: '#fff' }} />
                ) : (
                  <UserIcon style={{ width: 40, height: 40, color: '#fff' }} />
                )}
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                {selectedAccount.full_name}
              </h2>
              <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: 4 }}>
                {isStaff ? 'Nhân viên/Quản trị viên' : 'Tài khoản Gia đình'}
              </div>
            </div>
            <span style={{
              marginLeft: 'auto',
              alignSelf: 'flex-start',
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background:
                selectedAccount.status === 'active' ? '#dcfce7' :
                selectedAccount.status === 'inactive' ? '#f3f4f6' :
                selectedAccount.status === 'suspended' ? '#fef9c3' :
                selectedAccount.status === 'deleted' ? '#fee2e2' :
                selectedAccount.status === 'pending' ? '#dbeafe' : '#f3f4f6',
              color:
                selectedAccount.status === 'active' ? '#16a34a' :
                selectedAccount.status === 'inactive' ? '#64748b' :
                selectedAccount.status === 'suspended' ? '#b45309' :
                selectedAccount.status === 'deleted' ? '#dc2626' :
                selectedAccount.status === 'pending' ? '#1d4ed8' : '#64748b',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}>
              {getStatusDisplay(selectedAccount.status)}
            </span>
          </div>


          <div style={{
            padding: '2rem 2.5rem',
            overflow: 'auto',
            background: '#fafafa',
            flex: 1,
            minHeight: 0
          }}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Họ và tên:</div>
                  <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.full_name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Username:</div>
                  <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.username}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Email:</div>
                  <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.email}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Số điện thoại:</div>
                  <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.phone}</div>
                </div>
              </div>


              {isStaff && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Chức vụ:</div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.position || selectedAccount.role}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Bằng cấp:</div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.qualification || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Ngày vào làm:</div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.join_date ? new Date(selectedAccount.join_date).toLocaleDateString('vi-VN') : '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Ghi chú:</div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.notes || '—'}</div>
                  </div>
                </div>
              )}
              {isFamily && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Địa chỉ:</div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Ghi chú:</div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedAccount.notes || '—'}</div>
                  </div>
                </div>
              )}


              {isFamily && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <UserIcon style={{ width: 20, height: 20 }} />
                    Người cao tuổi được liên kết
                  </div>

                  {loadingLinkedResidents ? (
                    <div style={{
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      color: '#64748b'
                    }}>
                      Đang tải thông tin...
                    </div>
                  ) : linkedResidents.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {linkedResidents.map((resident, index) => (
                        <div key={resident._id || index} style={{
                          background: '#f8fafc',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          border: '1px solid #e2e8f0',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1rem'
                        }}>
                          <div>
                            <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Họ và tên:</div>
                            <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '1rem' }}>
                              {resident.full_name}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Mối quan hệ:</div>
                            <div style={{ color: '#1e293b', fontWeight: 600 }}>
                              {resident.relationship}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Ngày sinh:</div>
                            <div style={{ color: '#1e293b', fontWeight: 600 }}>
                              {resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString('vi-VN') : '—'}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Trạng thái:</div>
                            <div style={{
                              color: resident.status === 'active' ? '#16a34a' : '#64748b',
                              fontWeight: 600
                            }}>
                              {resident.status === 'active' ? 'Đang nằm viện' : 'Đã xuất viện'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      background: '#fef2f2',
                      borderRadius: '0.5rem',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      textAlign: 'center'
                    }}>
                      Chưa có người cao tuổi nào được liên kết với tài khoản này
                    </div>
                  )}
                </div>
              )}


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>Trạng thái:</div>
                  <div style={{
                    color:
                      selectedAccount.status === 'active' ? '#16a34a' :
                      selectedAccount.status === 'inactive' ? '#64748b' :
                      selectedAccount.status === 'suspended' ? '#b45309' :
                      selectedAccount.status === 'deleted' ? '#dc2626' :
                      selectedAccount.status === 'pending' ? '#1d4ed8' : '#64748b',
                    fontWeight: 700
                  }}>
                    {getStatusDisplay(selectedAccount.status)}
                  </div>
                </div>

              </div>
            </div>
          </div>


          <div style={{
            background: 'white',
            padding: '1.5rem 2.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            borderRadius: '0 0 1rem 1rem',
            flexShrink: 0
          }}>
            <button
              onClick={closeDetailModal}
              style={{
                padding: '0.875rem 2rem',
                background: isStaff ? 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)' : 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                boxShadow: isStaff ? '0 2px 4px rgba(99,102,241,0.15)' : '0 2px 4px rgba(245,158,66,0.15)'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  function DeleteConfirmModal() {
    if (!selectedAccount) return null;

    return (
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          width: '90%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <TrashIcon style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#dc2626' }}>
              Xác nhận xóa tài khoản
            </h2>
          </div>

          <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', textAlign: 'center' }}>
            Bạn có chắc chắn muốn xóa tài khoản{' '}
            <strong style={{ color: '#1f2937' }}>
              {activeTab === 'staff'
                ? (selectedAccount as User).full_name
                : (selectedAccount as User).full_name}
            </strong>?
            <br />
            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              Hành động này không thể hoàn tác.
            </span>
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              Hủy
            </button>
            <button
              onClick={confirmDelete}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }
} 