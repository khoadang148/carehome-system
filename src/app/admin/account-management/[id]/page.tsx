"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userAPI, residentAPI, photosAPI, API_BASE_URL } from '@/lib/api';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface User {
  _id: string;
  avatar?: string | null;
  full_name: string;
  email: string;
  phone: string;
  username: string;
  role: 'admin' | 'staff' | 'family';
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | 'pending';
  position?: string;
  qualification?: string;
  join_date?: string;
  notes?: string;
  address?: string;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [account, setAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedResidents, setLinkedResidents] = useState<any[]>([]);
  const [loadingLinkedResidents, setLoadingLinkedResidents] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await userAPI.getById(id);
        if (!mounted) return;
        setAccount(data);
        if (data?.role === 'family') {
          setLoadingLinkedResidents(true);
          try {
            const residents = await residentAPI.getByFamilyMemberId(data._id);
            if (!mounted) return;
            setLinkedResidents(Array.isArray(residents) ? residents : [residents]);
          } catch {
            if (!mounted) return;
            setLinkedResidents([]);
          } finally {
            if (mounted) setLoadingLinkedResidents(false);
          }
        } else {
          setLinkedResidents([]);
        }
      } catch {
        setError('Không tìm thấy tài khoản!');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/account-management')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!account) return null;

  const isStaff = account.role === 'staff' || account.role === 'admin';
  const isFamily = account.role === 'family';

  const roleDisplay = account.role === 'admin'
    ? 'Quản trị viên'
    : account.role === 'staff'
    ? 'Nhân viên'
    : 'Gia đình';

  const getAccountAvatarUrl = () => {
    const raw = account.avatar;
    if (raw && typeof raw === 'string') {
      const clean = raw.replace(/\\/g, '/').replace(/\"/g, '/').replace(/"/g, '/');
      if (clean.startsWith('http')) return clean;
      return userAPI.getAvatarUrl(clean);
    }
    return userAPI.getAvatarUrlById(account._id);
  };

  const getFileUrl = (path?: string | null) => {
    if (!path || typeof path !== 'string') return '';
    const clean = path.replace(/\\/g, '/').replace(/\"/g, '').replace(/"/g, '');
    if (clean.startsWith('http')) return clean;
    // Use same URL construction as approval page
    return `${API_BASE_URL}/${clean}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
        return 'Tạm khóa';
      case 'deleted':
        return 'Đã xóa';
      case 'pending':
        return 'Chờ duyệt';
      default:
        return 'Không xác định';
    }
  };

  const getResidentStatusStyle = (status: string) => {
    switch (status) {
      case 'admitted':
        return { dot: 'bg-blue-500', text: 'text-blue-600', label: 'Đã nhập viện' };
      case 'active':
        return { dot: 'bg-green-500', text: 'text-green-600', label: 'Hoàn tất đăng ký' };
      case 'cancelled':
        return { dot: 'bg-gray-400', text: 'text-gray-600', label: 'Đã hủy' };
      case 'discharged':
        return { dot: 'bg-gray-500', text: 'text-gray-700', label: 'Đã xuất viện' };
      case 'deceased':
        return { dot: 'bg-red-600', text: 'text-red-600', label: 'Đã qua đời' };
      case 'accepted':
        return { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Đã chấp nhận' };
      case 'rejected':
        return { dot: 'bg-rose-500', text: 'text-rose-600', label: 'Bị từ chối' };
      case 'pending':
        return { dot: 'bg-amber-500', text: 'text-amber-600', label: 'Chờ duyệt' };
      default:
        return { dot: 'bg-gray-400', text: 'text-gray-600', label: status };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/account-management')}
                className="group p-3 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-blue-700 hover:shadow-lg transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Chi tiết tài khoản
                </h1>
                <p className="text-gray-600 mt-1">Thông tin chi tiết về tài khoản người dùng</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push(`/admin/account-management/edit/${id}`)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <PencilIcon className="w-5 h-5" />
              Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <img
                    src={getAccountAvatarUrl()}
                    alt={account.full_name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg'; }}
                  />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${
                  account.status === 'active' ? 'bg-green-500' : 
                  account.status === 'inactive' ? 'bg-gray-500' : 
                  account.status === 'suspended' ? 'bg-yellow-500' :
                  account.status === 'deleted' ? 'bg-red-500' :
                  account.status === 'pending' ? 'bg-blue-500' : 'bg-gray-500'
                }`}></div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {account.full_name}
                </h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Vai trò:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {roleDisplay}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                      {getStatusText(account.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b-2 border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IdentificationIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  Thông tin cơ bản
                </h3>

                <div className="space-y-4">
                  
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Họ và tên</p>
                      <p className="font-semibold text-gray-900">{account.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{account.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-semibold text-gray-900">{account.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b-2 border-green-100">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-green-600" />
                  </div>
                  Thông tin bổ sung
                </h3>

                <div className="space-y-4">
                  {isStaff && (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Chức vụ</p>
                          <p className="font-semibold text-gray-900">{account.position || roleDisplay}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Bằng cấp</p>
                          <p className="font-semibold text-gray-900">{account.qualification || '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Ngày vào làm</p>
                          <p className="font-semibold text-gray-900">
                            {account.join_date ? new Date(account.join_date).toLocaleDateString('vi-VN') : '—'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {isFamily && (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Địa chỉ</p>
                          <p className="font-semibold text-gray-900">{account.address || '—'}</p>
                        </div>
                      </div>

                      {(account as any).cccd_id && (
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <p className="text-sm font-bold text-green-700 uppercase tracking-wide">Giấy tờ tùy thân (CCCD)</p>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">Số CCCD</p>
                            <p className="font-semibold text-gray-900 text-lg">{(account as any).cccd_id}</p>
                          </div>

                          <div className="flex gap-4 flex-wrap">
                            {(() => {
                              const frontUrl = getFileUrl((account as any).cccd_front);
                              return frontUrl ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide text-center">
                                    Ảnh mặt trước
                                  </div>
                                  <a 
                                    href={frontUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="block w-40 h-28 overflow-hidden rounded-lg border-2 border-green-500 bg-white shadow-lg hover:shadow-xl transition-shadow"
                                  >
                                    <img
                                      src={frontUrl}
                                      alt="CCCD mặt trước"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const placeholder = document.createElement('div');
                                        placeholder.innerHTML = `
                                          <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs text-gray-500">
                                            <div class="text-center">
                                              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="mb-1 opacity-50">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                                <polyline points="21,15 16,10 5,21"/>
                                              </svg>
                                              <div>Không thể tải ảnh</div>
                                            </div>
                                          </div>
                                        `;
                                        e.currentTarget.parentNode?.appendChild(placeholder.firstElementChild!);
                                      }}
                                    />
                                  </a>
                                </div>
                              ) : null;
                            })()}

                            {(() => {
                              const backUrl = getFileUrl((account as any).cccd_back);
                              return backUrl ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide text-center">
                                    Ảnh mặt sau
                                  </div>
                                  <a 
                                    href={backUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="block w-40 h-28 overflow-hidden rounded-lg border-2 border-green-500 bg-white shadow-lg hover:shadow-xl transition-shadow"
                                  >
                                    <img
                                      src={backUrl}
                                      alt="CCCD mặt sau"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const placeholder = document.createElement('div');
                                        placeholder.innerHTML = `
                                          <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs text-gray-500">
                                            <div class="text-center">
                                              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="mb-1 opacity-50">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                                <polyline points="21,15 16,10 5,21"/>
                                              </svg>
                                              <div>Không thể tải ảnh</div>
                                            </div>
                                          </div>
                                        `;
                                        e.currentTarget.parentNode?.appendChild(placeholder.firstElementChild!);
                                      }}
                                    />
                                  </a>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Ghi chú</p>
                      <p className="font-semibold text-gray-900 whitespace-pre-wrap">
                        {account.notes || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Residents for Family Members */}
            {isFamily && (
              <div className="mt-8 bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b-2 border-purple-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  Người cao tuổi được liên kết
                </h3>

                {loadingLinkedResidents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin...</p>
                  </div>
                ) : linkedResidents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {linkedResidents.map((resident: any, index: number) => (
                      <div key={resident._id || index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{resident.full_name}</h4>
                            <p className="text-sm text-gray-500">{resident.relationship}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Ngày sinh</p>
                            <p className="text-sm font-medium text-gray-900">
                              {resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString('vi-VN') : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Trạng thái</p>
                            {(() => {
                              const s = getResidentStatusStyle(resident.status);
                              return (
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${s.dot}`}></div>
                                  <span className={`text-sm font-medium ${s.text}`}>{s.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Chưa có liên kết</h4>
                    <p className="text-gray-600">Chưa có người cao tuổi nào được liên kết với tài khoản này</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

 
