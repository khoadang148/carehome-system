"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userAPI, residentAPI } from '@/lib/api';

interface User {
  _id: string;
  avatar?: string | null;
  full_name: string;
  email: string;
  phone: string;
  username: string;
  role: 'admin' | 'staff' | 'family';
  status: 'active' | 'inactive' | 'suspended';
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

  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{padding: 40, color: 'red', textAlign: 'center'}}>{error}</div>;
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

  return (
    <div style={{ padding: '2rem' }}>
      <button
        onClick={() => router.push('/admin/account-management')}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#f8fafc',
          color: '#374151',
          cursor: 'pointer',
          marginBottom: '1rem',
          fontWeight: 600
        }}
      >
        ← Quay lại
      </button>

      <div style={{
        background: 'white',
        borderRadius: '1rem',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 10px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          background: isStaff ? 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)' : 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)',
          padding: '2rem 2.5rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: account.avatar ? 'transparent' : 'rgba(255,255,255,0.18)',
            overflow: 'hidden',
            border: isStaff ? '2px solid #e0e7ff' : '2px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700
          }}>
            <img
              src={getAccountAvatarUrl()}
              alt={account.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg'; }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                Họ và tên
              </div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{account.full_name}</h1>
            </div>
            <div style={{ opacity: 0.9, marginTop: 4 }}>{roleDisplay}</div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
              Trạng thái:
            </div>
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: 999,
              background: account.status === 'active' ? '#dcfce7' : account.status === 'inactive' ? '#f3f4f6' : '#fef9c3',
              color: account.status === 'active' ? '#16a34a' : account.status === 'inactive' ? '#64748b' : '#b45309',
              fontWeight: 700
            }}>
              {account.status === 'active' ? 'Hoạt động' : account.status === 'inactive' ? 'Không hoạt động' : 'Tạm khóa'}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.5rem 2rem', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ color: '#64748b' }}>Họ và tên</div>
              <div style={{ fontWeight: 600 }}>{account.full_name}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Username</div>
              <div style={{ fontWeight: 600 }}>{account.username}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Email</div>
              <div style={{ fontWeight: 600 }}>{account.email}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Số điện thoại</div>
              <div style={{ fontWeight: 600 }}>{account.phone}</div>
            </div>
          </div>

          {isStaff && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ color: '#64748b' }}>Chức vụ</div>
                <div style={{ fontWeight: 600 }}>{account.position || account.role}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Bằng cấp</div>
                <div style={{ fontWeight: 600 }}>{account.qualification || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Ngày vào làm</div>
                <div style={{ fontWeight: 600 }}>{account.join_date ? new Date(account.join_date).toLocaleDateString('vi-VN') : '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#64748b' }}>Ghi chú</div>
                <div style={{ fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{account.notes || '—'}</div>
              </div>
            </div>
          )}

          {isFamily && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ color: '#64748b' }}>Địa chỉ</div>
                <div style={{ fontWeight: 600 }}>{account.address || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Ghi chú</div>
                <div style={{ fontWeight: 600 }}>{account.notes || '—'}</div>
              </div>
            </div>
          )}

          {isFamily && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Người cao tuổi được liên kết</div>
              {loadingLinkedResidents ? (
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>Đang tải thông tin...</div>
              ) : linkedResidents.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {linkedResidents.map((resident: any, index: number) => (
                    <div key={resident._id || index} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <div style={{ color: '#64748b' }}>Họ và tên</div>
                        <div style={{ fontWeight: 600 }}>{resident.full_name}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b' }}>Mối quan hệ</div>
                        <div style={{ fontWeight: 600 }}>{resident.relationship}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b' }}>Ngày sinh</div>
                        <div style={{ fontWeight: 600 }}>{resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString('vi-VN') : '—'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b' }}>Trạng thái</div>
                        <div style={{ fontWeight: 700, color: resident.status === 'active' ? '#16a34a' : '#64748b' }}>
                          {resident.status === 'active' ? 'Đang nằm viện' : 'Đã xuất viện'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8 }}>Chưa có người cao tuổi nào được liên kết</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


