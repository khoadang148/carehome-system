"use client";

import { getUserFriendlyError } from '@/lib/utils/error-translations';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  AtSymbolIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  IdentificationIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAPI, userAPI } from '@/lib/api';
import { processAvatarUrl } from '@/lib/utils/avatarUtils';

export default function StaffManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [redirectingToEdit, setRedirectingToEdit] = useState<string | null>(null);



  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoadingData(true);
    staffAPI.getAll()
      .then((data) => setStaffList(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải danh sách nhân viên.'))
      .finally(() => setLoadingData(false));
  }, [user]);

  const filteredStaff = staffList
    .filter((staff) => staff.role === 'staff')
    .filter((staff) => {
      const matchesSearch =
        staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const activeStaff = filteredStaff.filter(staff => staff.status === 'active');
  const inactiveStaff = filteredStaff.filter(staff => staff.status === 'inactive');

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;

    const staffToDelete = staffList.find(s => s._id === deleteId);
    const staffName = staffToDelete?.full_name || 'Nhân viên';

    try {
      await staffAPI.delete(deleteId);
      setStaffList((prev) => prev.filter((s) => s._id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      setError('');
      setSuccessMessage(`Đã xóa thành công nhân viên: ${staffName}`);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error: any) {
      setError(`❌ Không thể xóa nhân viên ${staffName}: ${error.message || 'Lỗi không xác định'}`);
      setSuccessMessage('');
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleEdit = (staffId: string) => {
    setRedirectingToEdit(staffId);
    router.push(`/admin/staff-management/edit/${staffId}`);
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p style={{ marginLeft: 16, color: '#6366f1', fontWeight: 600 }}>Đang tải...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const staffToDelete = staffList.find(s => s._id === deleteId);
  const staffName = staffToDelete?.full_name || 'Nhân viên';
  const staffEmail = staffToDelete?.email || '';

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
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
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
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid',
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca',
              color: '#dc2626'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span style={{ fontWeight: 600 }}>Lỗi:</span>
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
                    color: 'inherit',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '1'}
                  onMouseOut={e => e.currentTarget.style.opacity = '0.7'}
                >
                  <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}>
                <UsersIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Danh sách nhân viên
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {filteredStaff.length} nhân viên
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#667eea',
                  margin: 0,
                  fontWeight: 600
                }}>
                  Hiển thị: {activeTab === 'active' ? activeStaff.length : inactiveStaff.length} nhân viên
                </p>
              </div>
            </div>

            <Link
              href="/admin/staff-management/add"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                marginLeft: 'auto'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <PlusCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Thêm nhân viên
            </Link>


          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                />
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Trạng thái
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang làm</option>
                <option value="inactive">Nghỉ việc</option>
              </select>
            </div>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#6366f1',
                margin: 0,
                fontWeight: 600
              }}>
                Hiển thị: {activeTab === 'active' ? activeStaff.length : inactiveStaff.length} nhân viên
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: activeTab === 'active' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'active' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <CheckCircleIcon style={{ width: '1.125rem', height: '1.125rem' }} />
              Đang làm việc ({activeStaff.length} người)
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'inactive' ? 'linear-gradient(135deg, #6b7280 0%, #374151 100%)' : 'transparent',
                color: activeTab === 'inactive' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'inactive' ? '0 4px 12px rgba(107, 114, 128, 0.3)' : 'none'
              }}
            >
              <XMarkIcon style={{ width: '1.125rem', height: '1.125rem' }} />
              Đã nghỉ việc ({inactiveStaff.length} người)
            </button>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Nhân viên</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>SĐT</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Vị trí</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
                ) : (activeTab === 'active' ? activeStaff : inactiveStaff).length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <UsersIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#d1d5db' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#374151' }}>
                      {activeTab === 'active' ? 'Không có nhân viên đang làm việc' : 'Không có nhân viên đã nghỉ việc'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      {activeTab === 'active' ? 'Tất cả nhân viên đều đã nghỉ việc' : 'Tất cả nhân viên đều đang làm việc'}
                    </p>
                  </td></tr>
                ) : (activeTab === 'active' ? activeStaff : inactiveStaff).map((staff, index) => (
                  <tr
                    key={staff._id}
                    style={{
                      borderBottom: index < (activeTab === 'active' ? activeStaff : inactiveStaff).length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={staff.avatar ? processAvatarUrl(staff.avatar) : '/default-avatar.svg'}
                            alt={staff.full_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.svg';
                            }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>{staff.full_name}</p>

                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{staff.email}</td>
                    <td style={{ padding: '1rem' }}>{staff.phone}</td>
                    <td style={{ padding: '1rem' }}>{staff.position}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowDetailModal(true);
                          }}
                          title="Xem chi tiết"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.color = '#3b82f6';
                          }}
                        >
                          <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        <button
                          onClick={() => handleEdit(staff._id)}
                          title="Sửa thông tin"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#10b981';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                            e.currentTarget.style.color = '#10b981';
                          }}
                        >
                          <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrashIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                  Xác nhận xóa nhân viên
                </h3>
              </div>

              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#dc2626', fontWeight: 600 }}>
                  Bạn sắp xóa nhân viên:
                </p>
                <p style={{ margin: '0 0 0.25rem 0', color: '#374151', fontWeight: 500 }}>
                  <strong>Tên:</strong> {staffName}
                </p>
                {staffEmail && (
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    <strong>Email:</strong> {staffEmail}
                  </p>
                )}
              </div>

              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                ⚠️ <strong>Lưu ý:</strong> Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan. Không thể hoàn tác!
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={cancelDelete}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy bỏ
                </button>

              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedStaff && selectedStaff.role === 'staff' && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
            padding: '1rem'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              padding: '2rem',
              maxWidth: '1000px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 32px 80px -12px rgba(15,23,42,0.3), 0 0 0 1px rgba(226,232,240,0.5)',
              position: 'relative',
              animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(226,232,240,0.5)',
              marginTop: '90px',
              marginLeft: '100px'
            }}>
              <button
                title="Đóng"
                onClick={() => setShowDetailModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#475569',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  boxShadow: '0 4px 12px rgba(100,116,139,0.15), inset 0 1px 0 rgba(255,255,255,0.7)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}

                onMouseOver={e => {
                  e.currentTarget.style.background = 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  marginBottom: '1rem',
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 32px rgba(99,102,241,0.25), 0 0 0 3px rgba(255,255,255,0.8)',
                    border: '2px solid rgba(255,255,255,0.9)',
                  }}>
                    <img
                      src={selectedStaff.avatar ? processAvatarUrl(selectedStaff.avatar) : '/default-avatar.svg'}
                      alt={selectedStaff.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.svg';
                      }}
                    />
                  </div>
                </div>

                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 0.5rem 0',
                  color: '#0f172a',
                  letterSpacing: '-0.02em'
                }}>
                  {selectedStaff.full_name}
                </h2>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '1.5rem',
                  border: '1px solid rgba(226,232,240,0.8)',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.08)'
                }}>
                  <IdentificationIcon style={{ width: '1rem', height: '1rem', color: '#6366f1' }} />

                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(226,232,240,0.6)',
                boxShadow: '0 8px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UsersIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                  Thông tin nhân viên
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <DetailRow
                    icon={<AtSymbolIcon style={{ width: '1rem', height: '1rem', color: '#6366f1' }} />}
                    label="Email"
                    value={selectedStaff.email}
                  />
                  <DetailRow
                    icon={<PhoneIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />}
                    label="Số điện thoại"
                    value={selectedStaff.phone}
                  />
                  <DetailRow
                    icon={<BriefcaseIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />}
                    label="Vị trí"
                    value={selectedStaff.position}
                  />
                  <DetailRow
                    icon={<AcademicCapIcon style={{ width: '1rem', height: '1rem', color: '#0ea5e9' }} />}
                    label="Bằng cấp"
                    value={selectedStaff.qualification}
                  />
                  <DetailRow
                    icon={<CheckCircleIcon style={{ width: '1rem', height: '1rem', color: selectedStaff.status === 'active' ? '#10b981' : '#6b7280' }} />}
                    label="Trạng thái"
                    value={selectedStaff.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                    badge={selectedStaff.status}
                  />
                  <DetailRow
                    icon={<CalendarIcon style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />}
                    label="Ngày vào làm"
                    value={selectedStaff.join_date ? new Date(selectedStaff.join_date).toLocaleDateString('vi-VN') : ''}
                  />
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <DocumentTextIcon style={{ width: '1rem', height: '1rem', color: '#a78bfa', marginTop: '0.125rem' }} />
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}>
                        Ghi chú
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#374151',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      marginLeft: '1.5rem'
                    }}>
                      {selectedStaff.notes || 'Không có ghi chú'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(226,232,240,0.6)'
              }}>

              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
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
              padding: '3rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: '400px'
            }}>
              <CheckCircleIcon style={{
                width: '3rem',
                height: '3rem',
                color: '#10b981',
                margin: '0 auto 1rem'
              }} />
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: '0 0 0.5rem 0'
              }}>
                Xóa thành công!
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                {successMessage}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function DetailRow({ label, value, badge, icon }: { label: string, value: string, badge?: string, icon?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      padding: '0.75rem',
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(226,232,240,0.5)',
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {icon}
        <span style={{
          color: '#334155',
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.025em'
        }}>
          {label}
        </span>
      </div>

      {badge ? (
        <span style={{
          alignSelf: 'flex-start',
          background: badge === 'active'
            ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(156,163,175,0.15) 0%, rgba(107,114,128,0.1) 100%)',
          color: badge === 'active' ? '#059669' : '#6b7280',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: `1px solid ${badge === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)'}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {value}
        </span>
      ) : (
        <span style={{
          color: '#0f172a',
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: '1.5'
        }}>
          {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa hoàn tất đăng kí</span>}
        </span>
      )}
    </div>
  );
} 