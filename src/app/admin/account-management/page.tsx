"use client";

import React, { useState, useEffect } from 'react';
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
  UserPlusIcon,
  ClockIcon,
  UserCircleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAPI, familyMembersAPI } from '@/lib/api';
import axios from 'axios';

// Interfaces
interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  department: string;
  lastActive: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface FamilyAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  relationship: string;
  residentName: string;
  residentId: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdDate: string;
  emergencyContact: string;
  address: string;
}

// Thêm hàm gọi API activate/deactivate
const activateUser = async (id: string) => axios.patch(`/users/${id}/activate`);
const deactivateUser = async (id: string) => axios.patch(`/users/${id}/deactivate`);

export default function AccountManagementPage() {
  // Add CSS animations for modals
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

  // Inject styles
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

  // State for managing data
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [familyAccounts, setFamilyAccounts] = useState<FamilyAccount[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'family'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<StaffUser | FamilyAccount | null>(null);
  
  // Form data states
  const [formData, setFormData] = useState<any>({});
  
  const router = useRouter();
  const { user, loading } = useAuth();

  // Check access permissions
  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'family') router.replace('/family');
      else router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    console.log('Modal states:', { showCreateModal, showEditModal, showDetailModal, showDeleteModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showCreateModal || showEditModal || showDetailModal || showDeleteModal;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal, showDetailModal, showDeleteModal]);

  // Fetch accounts from API
  useEffect(() => {
    async function fetchAccounts() {
      setLoadingData(true);
      try {
        const allUsers = await staffAPI.getAll();
        const staff = allUsers.filter((u: any) => Array.isArray(u.roles) && (u.roles.includes('admin') || u.roles.includes('staff')));
        const family = allUsers.filter((u: any) => Array.isArray(u.roles) && u.roles.includes('family'));
        setStaffUsers(staff);
        setFamilyAccounts(family);
      } catch (err) {
        alert('Lỗi khi tải dữ liệu tài khoản!');
      } finally {
        setLoadingData(false);
      }
    }
    fetchAccounts();
  }, []); // Không thay đổi dependency array này

  // CRUD Functions
  const handleCreate = () => {
    setFormData(activeTab === 'staff' ? {
      selectedStaffId: '',
      name: '',
      email: '',
      role: '',
      department: '',
      password: '',
      permissions: []
    } : {
      selectedGuardianId: '',
      username: '',
      email: '',
      fullName: '',
      phone: '',
      relationship: '',
      residentId: '',
      residentName: '',
      password: '',
      emergencyContact: '',
      address: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (account: StaffUser | FamilyAccount) => {
    setSelectedAccount(account);
    setFormData(account);
    setShowEditModal(true);
  };

  const handleView = (account: StaffUser | FamilyAccount) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  };

  const handleDelete = (account: StaffUser | FamilyAccount) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;
    setLoadingData(true);
    try {
      if (activeTab === 'staff') {
        if (Array.isArray((selectedAccount as any).roles) && (selectedAccount as any).roles.includes('admin')) {
          alert('Không thể xóa tài khoản admin!');
          setShowDeleteModal(false);
          setSelectedAccount(null);
          setLoadingData(false);
          return;
        }
        await staffAPI.delete(String(selectedAccount.id));
        const data = await staffAPI.getAll();
        setStaffUsers(data);
        alert(`Đã xóa tài khoản ${selectedAccount.name} thành công!`);
      } else {
        await familyMembersAPI.delete(String(selectedAccount.id));
        const data = await familyMembersAPI.getAll();
        setFamilyAccounts(data);
        alert(`Đã xóa tài khoản ${selectedAccount.fullName} thành công!`);
      }
      setShowDeleteModal(false);
      setSelectedAccount(null);
    } catch (err) {
      alert('Lỗi khi xóa tài khoản!');
    } finally {
      setLoadingData(false);
    }
  };

  const saveAccount = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'staff') {
        if (showCreateModal) {
          await staffAPI.create({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            password: formData.password,
          });
          alert(`Đã tạo tài khoản nhân viên cho ${formData.name} thành công!`);
        } else if (showEditModal && selectedAccount) {
          // Kiểm tra nếu status thay đổi
          if (formData.status && formData.status !== selectedAccount.status) {
            if (formData.status === 'active') {
              await activateUser(String(selectedAccount.id));
            } else {
              await deactivateUser(String(selectedAccount.id));
            }
          }
          // Xóa trường status khỏi formData trước khi update
          const { status, ...updateData } = formData;
          if (activeTab === 'staff') {
            await staffAPI.update(String(selectedAccount.id), updateData);
            alert(`Đã cập nhật tài khoản ${formData.name} thành công!`);
            const data = await staffAPI.getAll();
            setStaffUsers(data);
          } else {
            await familyMembersAPI.update(String(selectedAccount.id), updateData);
            alert(`Đã cập nhật tài khoản ${formData.fullName} thành công!`);
            const data = await familyMembersAPI.getAll();
            setFamilyAccounts(data);
          }
        }
      } else {
        if (showCreateModal) {
          await familyMembersAPI.create({
            username: formData.username,
            email: formData.email,
            fullName: formData.fullName,
            phone: formData.phone,
            relationship: formData.relationship,
            residentName: formData.residentName,
            residentId: formData.residentId,
            password: formData.password,
            emergencyContact: formData.emergencyContact,
            address: formData.address,
          });
          alert(`Đã tạo tài khoản gia đình cho ${formData.fullName} thành công!`);
        } else if (showEditModal && selectedAccount) {
          await familyMembersAPI.update(String(selectedAccount.id), formData);
          alert(`Đã cập nhật tài khoản ${formData.fullName} thành công!`);
          const data = await familyMembersAPI.getAll();
          setFamilyAccounts(data);
        }
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setFormData({});
    } catch (err) {
      alert('Lỗi khi lưu tài khoản!');
    } finally {
      setLoadingData(false);
    }
  };

  // Helper function to get default permissions based on role
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

  // Function to convert status to Vietnamese display
  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'suspended': return 'Tạm khóa';
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

  const StaffListItem = ({ user }: { user: StaffUser }) => {
    const roleColors = {
      'Quản trị viên': { bg: '#f0f9ff', color: '#1e40af', border: '#93c5fd' },
      'Bác sĩ': { bg: '#ecfdf5', color: '#166534', border: '#86efac' },
      'Y tá': { bg: '#f0fdf4', color: '#15803d', border: '#a3e635' },
      'Kế toán': { bg: '#fffbeb', color: '#92400e', border: '#fbbf24' }
    };
    const colors = roleColors[user.role as keyof typeof roleColors] || { bg: '#f8fafc', color: '#4338ca', border: '#c7d2fe' };

    const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');

    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.875rem 1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f1f5f9',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = '#f1f5f9';
      }}
      >
        {/* Avatar */}
        <div style={{
          width: '3rem',
          height: '3rem',
          background: colors.bg,
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${colors.border}`,
          flexShrink: 0
        }}>
          <UserCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: colors.color }} />
        </div>

        {/* Main Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <h3 style={{ 
            margin: '0 0 0.5rem 0', 
            fontWeight: 600, 
            color: '#1f2937', 
            fontSize: '1rem',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            {user.name}
          </h3>
          
          {/* Role & Department */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>Chức vụ:</span>
              <span style={{
                background: colors.bg,
                color: colors.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                border: `1px solid ${colors.border}`
              }}>
                {user.role}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>Phòng ban:</span>
              <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>{user.department}</span>
            </div>
          </div>
          
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 500 }}>Email:</span>
            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{user.email}</span>
          </div>
        </div>

        {/* Status & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>Trạng thái:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{
                width: '0.475rem',
                height: '0.475rem',
                borderRadius: '50%',
                background: user.status === 'active' ? '#10b981' : '#ef4444'
              }} />
              <span style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 500 }}>
                {getStatusDisplay(user.status)}
              </span>
            </div>
          </div>
          
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem' }}>
            <button 
              title="Xem chi tiết"
              onClick={(e) => {
                e.stopPropagation();
                handleView(user);
              }}
              style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
              }}
            >
              <EyeIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            <button 
              title="Chỉnh sửa"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}
              style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            <button 
              title="Xóa"
              onClick={(e) => {
                e.stopPropagation();
                if (!isAdmin) handleDelete(user);
              }}
              style={{
                padding: '0.5rem',
                background: isAdmin ? '#e5e7eb' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: isAdmin ? '#9ca3af' : 'white',
                cursor: isAdmin ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isAdmin ? 'none' : '0 2px 4px rgba(239, 68, 68, 0.3)'
              }}
              disabled={isAdmin}
              onMouseOver={(e) => {
                if (!isAdmin) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isAdmin) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                }
              }}
            >
              <TrashIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FamilyListItem = ({ account }: { account: FamilyAccount }) => {
    const statusColors = {
      active: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
      inactive: { bg: '#f9fafb', color: '#374151', border: '#d1d5db' },
      suspended: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' }
    };
    const defaultColors = { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
    const colors = statusColors[account.status] || defaultColors;

    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.875rem 1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f1f5f9',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = '#f1f5f9';
      }}
      >
        {/* Avatar */}
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          background: colors.bg,
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${colors.border}`,
          flexShrink: 0
        }}>
          <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: colors.color }} />
        </div>

        {/* Main Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <h3 style={{ 
            margin: '0 0 0.375rem 0', 
            fontWeight: 600, 
            color: '#1f2937', 
            fontSize: '0.875rem',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            {account.fullName}
          </h3>
          
          {/* Username & Relationship */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 500 }}>Username:</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 500 }}>@{account.username}</span>
            </div>
          </div>
          
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 500 }}>Email:</span>
            <span style={{ color: '#6b7280', fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{account.email}</span>
          </div>
        </div>

        {/* Contact & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 500 }}>Trạng thái:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{
                width: '0.375rem',
                height: '0.375rem',
                borderRadius: '50%',
                background: account.status === 'active' ? '#10b981' : account.status === 'inactive' ? '#6b7280' : '#ef4444'
              }} />
              <span style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 500 }}>
                {account.status === 'active' ? 'Hoạt động' : account.status === 'inactive' ? 'Không hoạt động' : 'Tạm khóa'}
              </span>
            </div>
          </div>
          
         
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem' }}>
            <button 
              title="Xem chi tiết"
              onClick={(e) => {
                e.stopPropagation();
                handleView(account);
              }}
              style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
              }}
            >
              <EyeIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            <button 
              title="Chỉnh sửa"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(account);
              }}
              style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            <button 
              title="Xóa"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(account);
              }}
              style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
              }}
            >
              <TrashIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </div>
      </div>
    );
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
        {/* Header Section */}
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
          {/* Background pattern */}
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
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
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
                  <UsersIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
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
                    Quản lý tài khoản
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
              
              {/* Tab Navigation */}
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
            </div>
          </div>
        </div>


        {/* Search and Filters */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
                    paddingRight: '1rem',
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
              </div>
            </div>
            
            <button 
              onClick={handleCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <PlusIcon style={{ width: '1.125rem', height: '1.125rem' }} />
              Thêm {activeTab === 'staff' ? 'tài khoản nhân viên' : 'tài khoản gia đình'}
            </button>
          </div>
        </div>

        {/* Content List */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          {loadingData ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
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
                    Tài khoản Nhân viên ({staffUsers.filter(user => 
                      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length} tài khoản)
                  </div>
                  {staffUsers
                    .filter(user => 
                      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((user, idx) => <StaffListItem key={user.id ? String(user.id) : `staff-${idx}`} user={user} /> )
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
                    Tài khoản Gia đình ({familyAccounts.filter(account => 
                      (account.fullName && account.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length} tài khoản)
                  </div>
                  {familyAccounts
                    .filter(account => 
                      (account.fullName && account.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((account, idx) => <FamilyListItem key={account.id ? String(account.id) : `family-${idx}`} account={account} />)
                  }
                </div>
              )}
            </>
          )}
        </div>

        {/* Empty State - show inside the content area if no results */}
        {((activeTab === 'staff' && staffUsers.filter(user => 
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length === 0) || 
        (activeTab === 'family' && familyAccounts.filter(account => 
          (account.fullName && account.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length === 0)) && searchTerm && (
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
              Không có {activeTab === 'staff' ? 'nhân viên' : 'tài khoản gia đình'} nào phù hợp với từ khóa "{searchTerm}".
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreateAccountModal />}
      {showEditModal && <EditAccountModal />}
      {showDetailModal && <DetailModal />}
      {showDeleteModal && <DeleteConfirmModal />}
    </div>
  );

  // Modal Components
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
          {/* Modal Header */}
          <div style={{
            background: 'white',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserPlusIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 700, 
                  margin: 0, 
                  color: '#059669'
                }}>
                  {activeTab === 'staff' ? 'Thêm tài khoản' : 'Thêm tài khoản'}
                </h2>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  margin: 0
                }}>
                  Tạo tài khoản {activeTab === 'staff' ? 'cho nhân viên hệ thống' : 'cho người giám hộ'}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
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
                  <select
                    value={formData.selectedStaffId || ''}
                    onChange={(e) => handleStaffSelection(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      background: 'white',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1rem'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#10b981';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {availableStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role} ({staff.department})
                      </option>
                    ))}
                  </select>
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
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                  onChange={(e) => handleGuardianSelection(e.target.value)}
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
                  {availableGuardians.map(guardian => (
                    <option key={guardian.id} value={guardian.id}>
                      {guardian.name} - {guardian.relationship} của {guardian.residentName}
                    </option>
                  ))}
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
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            </div>
          )}
          </div>

          {/* Modal Footer */}
          <div style={{
            background: '#f8fafc',
            padding: '1rem 2rem 1rem 2rem', // giảm padding dưới
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '-1rem' // đẩy footer lên gần body hơn
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = 'white';
              }}
            >
              Hủy
            </button>
            <button
              onClick={saveAccount}
              disabled={activeTab === 'staff' ? !formData.selectedStaffId : !formData.selectedGuardianId}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: 'none',
                background: (activeTab === 'staff' ? formData.selectedStaffId : formData.selectedGuardianId)
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : '#9ca3af',
                color: 'white',
                cursor: (activeTab === 'staff' ? formData.selectedStaffId : formData.selectedGuardianId) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: (activeTab === 'staff' ? formData.selectedStaffId : formData.selectedGuardianId) ? 1 : 0.7
              }}
              onMouseOver={(e) => {
                if (activeTab === 'staff' ? formData.selectedStaffId : formData.selectedGuardianId) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab === 'staff' ? formData.selectedStaffId : formData.selectedGuardianId) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                }
              }}
            >
              <UserPlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Tạo tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  function EditAccountModal() {
    if (!selectedAccount) return null;

    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const isStaff = 'role' in selectedAccount;

    const validateForm = () => {
      const newErrors: {[key: string]: string} = {};

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
          {/* Header */}
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
          
          {/* Form */}
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
                      value={formData.name || ''}
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value});
                        if (errors.name) setErrors({...errors, name: ''});
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
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.name ? '#ef4444' : '#e5e7eb'}
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
                        setFormData({...formData, email: e.target.value});
                        if (errors.email) setErrors({...errors, email: ''});
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
                        setFormData({...formData, role: e.target.value});
                        if (errors.role) setErrors({...errors, role: ''});
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
                      <option value="Quản trị viên">Quản trị viên</option>
                      <option value="Bác sĩ">Bác sĩ</option>
                      <option value="Y tá">Y tá</option>
                      <option value="Kế toán">Kế toán</option>
                      <option value="Nhân viên">Nhân viên</option>
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
                      Phòng ban <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => {
                        setFormData({...formData, department: e.target.value});
                        if (errors.department) setErrors({...errors, department: ''});
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${errors.department ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.department ? '#ef4444' : '#e5e7eb'}
                    />
                    {errors.department && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.department}</span>}
                  </div>
                </div>
                
                {/* Status Field for Staff */}
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
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                        setFormData({...formData, username: e.target.value});
                        if (errors.username) setErrors({...errors, username: ''});
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
                        setFormData({...formData, fullName: e.target.value});
                        if (errors.fullName) setErrors({...errors, fullName: ''});
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
                        setFormData({...formData, email: e.target.value});
                        if (errors.email) setErrors({...errors, email: ''});
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
                        setFormData({...formData, phone: e.target.value});
                        if (errors.phone) setErrors({...errors, phone: ''});
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
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
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
                
                {/* Status Field for Family */}
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
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
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

    // Determine if the selected account is a staff user or family account
    const isStaffAccount = 'role' in selectedAccount;

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
          padding: '0',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with gradient */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem 2.5rem',
            borderRadius: '1rem 1rem 0 0',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  {isStaffAccount ? (
                    <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  ) : (
                    <HomeIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  )}
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700, 
                    margin: '0 0 0.5rem 0'
                  }}>
                    Chi tiết tài khoản {isStaffAccount ? 'nhân viên' : 'gia đình'}
                  </h2>
                  <p style={{ 
                    fontSize: '0.95rem', 
                    opacity: 0.9,
                    margin: 0 
                  }}>
                    {isStaffAccount ? 'Thông tin chi tiết tài khoản nhân viên hệ thống' : 'Thông tin chi tiết tài khoản người giám hộ'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body with enhanced styling */}
          <div style={{ 
            padding: '2.5rem',
            overflow: 'auto',
            background: '#fafafa',
            flex: 1,
            minHeight: 0
          }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {isStaffAccount ? (
                <>
                  {/* Personal Information Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Thông tin cá nhân
                    </h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Họ và tên:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as StaffUser).name}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Email:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {selectedAccount.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Information Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Thông tin công việc
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Chức vụ:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as StaffUser).role}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Phòng ban:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as StaffUser).department}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Activity Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Trạng thái & Hoạt động
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Trạng thái:
                        </div>
                        <span style={{
                          background: (selectedAccount as StaffUser).status === 'active' ? '#dcfce7' : '#fef2f2',
                          color: (selectedAccount as StaffUser).status === 'active' ? '#166534' : '#dc2626',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {(selectedAccount as StaffUser).status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '140px'
                        }}>
                          Hoạt động cuối:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as StaffUser).lastActive}
                        </div>
                      </div>
                    </div>
                  </div>


                </>
              ) : (
                <>
                  {/* Basic Information Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Thông tin cơ bản
                    </h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '140px'
                        }}>
                          Tên đăng nhập:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as FamilyAccount).username}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '140px'
                        }}>
                          Họ và tên:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as FamilyAccount).fullName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Thông tin liên hệ
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '100px'
                        }}>
                          Email:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {selectedAccount.email}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '100px'
                        }}>
                          Số điện thoại:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as FamilyAccount).phone}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      marginTop: '1rem'
                    }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        minWidth: '100px'
                      }}>
                        Địa chỉ:
                      </div>
                      <div style={{ 
                        color: '#1f2937',
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}>
                        {(selectedAccount as FamilyAccount).address}
                      </div>
                    </div>
                  </div>

                  {/* Family Information Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Thông tin gia đình
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Mối quan hệ:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as FamilyAccount).relationship}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '120px'
                        }}>
                          Trạng thái:
                        </div>
                        <span style={{
                          background: (selectedAccount as FamilyAccount).status === 'active' ? '#dcfce7' : 
                                     (selectedAccount as FamilyAccount).status === 'inactive' ? '#fef2f2' : '#fef3c7',
                          color: (selectedAccount as FamilyAccount).status === 'active' ? '#166534' : 
                                 (selectedAccount as FamilyAccount).status === 'inactive' ? '#dc2626' : '#d97706',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {(selectedAccount as FamilyAccount).status === 'active' ? 'Hoạt động' : 
                           (selectedAccount as FamilyAccount).status === 'inactive' ? 'Không hoạt động' : 'Tạm khóa'}
                        </span>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      marginTop: '1rem',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        minWidth: '180px'
                      }}>
                        Người thân được chăm sóc:
                      </div>
                      <div style={{ 
                        color: '#1f2937',
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}>
                        {(selectedAccount as FamilyAccount).residentName} 
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {' '}(ID: {(selectedAccount as FamilyAccount).residentId})
                        </span>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 0'
                    }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        minWidth: '180px'
                      }}>
                        Liên hệ khẩn cấp:
                      </div>
                      <div style={{ 
                        color: '#1f2937',
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}>
                        {(selectedAccount as FamilyAccount).emergencyContact}
                      </div>
                    </div>
                  </div>

                  {/* Activity Information Section */}
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 1.25rem 0',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      Thông tin hoạt động
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '160px'
                        }}>
                          Ngày tạo tài khoản:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {new Date((selectedAccount as FamilyAccount).createdDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          minWidth: '160px'
                        }}>
                          Đăng nhập gần nhất:
                        </div>
                        <div style={{ 
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }}>
                          {(selectedAccount as FamilyAccount).lastLogin 
                            ? new Date((selectedAccount as FamilyAccount).lastLogin).toLocaleDateString('vi-VN')
                            : 'Chưa đăng nhập lần nào'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer with enhanced button */}
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
              onClick={() => setShowDetailModal(false)}
              style={{
                padding: '0.875rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
              }}
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
                ? (selectedAccount as StaffUser).name 
                : (selectedAccount as FamilyAccount).fullName}
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