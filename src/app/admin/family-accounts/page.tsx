"use client";

import { useState } from 'react';
import { 
  UserIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  KeyIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

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

export default function FamilyAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<FamilyAccount[]>([
    {
      id: 'FA001',
      username: 'minh.nguyen',
      email: 'minh.nguyen@email.com',
      fullName: 'Nguyễn Văn Minh',
      phone: '0912345678',
      relationship: 'Con trai',
      residentName: 'Nguyễn Thị Lan',
      residentId: 'R001',
      status: 'active',
      lastLogin: '2024-01-20T14:30:00',
      createdDate: '2024-01-15T10:00:00',
      emergencyContact: '0987654321',
      address: 'Hà Nội'
    },
    {
      id: 'FA002',
      username: 'hai.tran',
      email: 'hai.tran@email.com',
      fullName: 'Trần Văn Hải',
      phone: '0923456789',
      relationship: 'Con trai',
      residentName: 'Trần Thị Mai',
      residentId: 'R002',
      status: 'active',
      lastLogin: '2024-01-19T16:45:00',
      createdDate: '2024-01-10T09:30:00',
      emergencyContact: '0976543210',
      address: 'TP.HCM'
    },
    {
      id: 'FA003',
      username: 'linh.pham',
      email: 'linh.pham@email.com',
      fullName: 'Phạm Thị Linh',
      phone: '0934567890',
      relationship: 'Con gái',
      residentName: 'Phạm Văn Nam',
      residentId: 'R003',
      status: 'inactive',
      lastLogin: '2024-01-10T11:20:00',
      createdDate: '2024-01-05T14:15:00',
      emergencyContact: '0965432109',
      address: 'Đà Nẵng'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FamilyAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FamilyAccount | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    relationship: '',
    residentName: '',
    residentId: '',
    emergencyContact: '',
    address: ''
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      fullName: '',
      phone: '',
      relationship: '',
      residentName: '',
      residentId: '',
      emergencyContact: '',
      address: ''
    });
  };

  const handleAdd = () => {
    setEditingAccount(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (account: FamilyAccount) => {
    setEditingAccount(account);
    setFormData({
      username: account.username,
      email: account.email,
      fullName: account.fullName,
      phone: account.phone,
      relationship: account.relationship,
      residentName: account.residentName,
      residentId: account.residentId,
      emergencyContact: account.emergencyContact,
      address: account.address
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.email || !formData.fullName) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (editingAccount) {
      // Update existing account
      setAccounts(accounts.map(account => 
        account.id === editingAccount.id 
          ? { ...account, ...formData }
          : account
      ));
    } else {
      // Create new account
      const newAccount: FamilyAccount = {
        id: `FA${String(accounts.length + 1).padStart(3, '0')}`,
        ...formData,
        status: 'active',
        lastLogin: '',
        createdDate: new Date().toISOString()
      };
      setAccounts([...accounts, newAccount]);
    }

    setShowModal(false);
    resetForm();
    setEditingAccount(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setAccounts(accounts.filter(account => account.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: FamilyAccount['status']) => {
    setAccounts(accounts.map(account => 
      account.id === id ? { ...account, status: newStatus } : account
    ));
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'suspended': return 'Tạm khóa';
      default: return status;
    }
  };

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
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 700,
                margin: '0 0 0.5rem 0',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Tài khoản Gia đình
              </h1>
              <p style={{ color: '#64748b', margin: 0 }}>
                Quản lý tài khoản đăng nhập cho người thân
              </p>
            </div>
            <button
              onClick={handleAdd}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Thêm tài khoản
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {accounts.filter(a => a.status === 'active').length}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tài khoản hoạt động</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{accounts.length}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tổng tài khoản</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {accounts.filter(a => a.lastLogin && new Date(a.lastLogin) > new Date(Date.now() - 7*24*60*60*1000)).length}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Đăng nhập tuần này</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlassIcon style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.25rem',
                height: '1.25rem',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                minWidth: '150px'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Hiển thị {filteredAccounts.length} / {accounts.length} tài khoản
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
            Danh sách tài khoản ({filteredAccounts.length})
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredAccounts.map((account) => (
              <div key={account.id} style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                background: '#f9fafb'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
                        {account.fullName}
                      </h3>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        @{account.username}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(account.status)}20`,
                        color: getStatusColor(account.status)
                      }}>
                        {getStatusLabel(account.status)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email: </span>
                        <span style={{ fontWeight: 600 }}>{account.email}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Điện thoại: </span>
                        <span style={{ fontWeight: 600 }}>{account.phone}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Quan hệ: </span>
                        <span style={{ fontWeight: 600 }}>{account.relationship}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Người thân: </span>
                        <span style={{ fontWeight: 600 }}>{account.residentName}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Đăng nhập cuối: </span>
                        <span style={{ fontWeight: 600 }}>
                          {account.lastLogin ? new Date(account.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowDetailModal(true);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      title="Xem chi tiết"
                    >
                      <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    <button
                      onClick={() => handleEdit(account)}
                      style={{
                        padding: '0.5rem',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      title="Chỉnh sửa"
                    >
                      <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    <select
                      value={account.status}
                      onChange={(e) => handleStatusChange(account.id, e.target.value as FamilyAccount['status'])}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                      <option value="suspended">Tạm khóa</option>
                    </select>
                    <button
                      onClick={() => handleDelete(account.id)}
                      style={{
                        padding: '0.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      title="Xóa"
                    >
                      <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
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
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>
                {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Quan hệ với người cao tuổi
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Chọn quan hệ...</option>
                      <option value="Con trai">Con trai</option>
                      <option value="Con gái">Con gái</option>
                      <option value="Cháu trai">Cháu trai</option>
                      <option value="Cháu gái">Cháu gái</option>
                      <option value="Anh/Em trai">Anh/Em trai</option>
                      <option value="Chị/Em gái">Chị/Em gái</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      Tên người cao tuổi
                    </label>
                    <input
                      type="text"
                      value={formData.residentName}
                      onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                      ID người cao tuổi
                    </label>
                    <input
                      type="text"
                      value={formData.residentId}
                      onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {editingAccount ? 'Cập nhật' : 'Thêm tài khoản'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedAccount && (
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
              maxWidth: '600px'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                Chi tiết tài khoản
              </h2>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Mã tài khoản
                    </label>
                    <div style={{ color: '#1f2937' }}>{selectedAccount.id}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Tên đăng nhập
                    </label>
                    <div style={{ color: '#1f2937' }}>{selectedAccount.username}</div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                    Họ và tên
                  </label>
                  <div style={{ color: '#1f2937' }}>{selectedAccount.fullName}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Email
                    </label>
                    <div style={{ color: '#1f2937' }}>{selectedAccount.email}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Điện thoại
                    </label>
                    <div style={{ color: '#1f2937' }}>{selectedAccount.phone}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Quan hệ
                    </label>
                    <div style={{ color: '#1f2937' }}>{selectedAccount.relationship}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Trạng thái
                    </label>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: `${getStatusColor(selectedAccount.status)}20`,
                      color: getStatusColor(selectedAccount.status)
                    }}>
                      {getStatusLabel(selectedAccount.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                    Người cao tuổi
                  </label>
                  <div style={{ color: '#1f2937' }}>{selectedAccount.residentName} (ID: {selectedAccount.residentId})</div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                    Liên hệ khẩn cấp
                  </label>
                  <div style={{ color: '#1f2937' }}>{selectedAccount.emergencyContact}</div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                    Địa chỉ
                  </label>
                  <div style={{ color: '#1f2937' }}>{selectedAccount.address}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Ngày tạo
                    </label>
                    <div style={{ color: '#1f2937' }}>
                      {new Date(selectedAccount.createdDate).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>
                      Đăng nhập cuối
                    </label>
                    <div style={{ color: '#1f2937' }}>
                      {selectedAccount.lastLogin ? new Date(selectedAccount.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}