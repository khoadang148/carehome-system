"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { userAPI } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    userAPI.getById(id)
      .then((data) => {
        setFormData({
          ...data,
          name: data.name || data.full_name || "",
          full_name: data.full_name || data.name || ""
        });
      })
      .catch(() => setError("Không tìm thấy tài khoản!"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    if (field === "name" || field === "full_name") {
      setFormData((prev: any) => ({ ...prev, name: value, full_name: value }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await userAPI.update(id, formData);
      alert("Cập nhật thành công!");
      router.push("/admin/account-management");
    } catch (err) {
      setError("Có lỗi khi cập nhật tài khoản!");
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chấp nhận file ảnh JPG, PNG, GIF');
      return;
    }
    if (file.size > 1024 * 1024) {
      alert('File quá lớn, chỉ chấp nhận tối đa 1MB');
      return;
    }
    setAvatarUploading(true);
    setAvatarPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`http://localhost:8000/users/${id}/avatar`, {
        method: 'PATCH',
        headers: {
          // KHÔNG set 'Content-Type' ở đây!
          'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('access_token') || ''}` : ''
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev: any) => ({ ...prev, avatar: data.avatar }));
        alert('Cập nhật ảnh đại diện thành công!');
      } else {
        alert('Lỗi khi upload ảnh đại diện!');
      }
    } catch (err) {
      alert('Lỗi khi upload ảnh đại diện!');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === formData.status) return;
    setSaving(true);
    try {
      if (newStatus === 'active') {
        await fetch(`http://localhost:8000/users/${id}/activate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
          },
        });
      } else if (newStatus === 'inactive') {
        await fetch(`http://localhost:8000/users/${id}/deactivate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
          },
        });
      }
      setFormData((prev: any) => ({ ...prev, status: newStatus }));
    } catch {
      alert('Cập nhật trạng thái thất bại!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{padding: 40, color: 'red', textAlign: 'center'}}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: '2rem',
        boxShadow: '0 12px 48px rgba(99,102,241,0.10)',
        padding: '2.5rem 2rem 2rem 2rem',
        minWidth: 1020,
        maxWidth: 1150,
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0
      }}>
        {/* Nút quay lại */}
        <Link href="/admin/account-management" style={{
          position: 'absolute',
          top: 24,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#6366f1',
          fontWeight: 600,
          fontSize: 16,
          textDecoration: 'none',
          background: 'rgba(99,102,241,0.08)',
          padding: '0.5rem 1.25rem',
          borderRadius: 12,
          transition: 'background 0.2s',
          zIndex: 2
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Quay lại
        </Link>
        {/* Header với avatar lớn và tiêu đề */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', width: 104, height: 104, marginBottom: 12 }}>
            <div style={{ width: 104, height: 104, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', border: '3px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: '#6366f1', boxShadow: '0 4px 16px rgba(99,102,241,0.10)' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : formData.avatar ? (
                <img src={formData.avatar.startsWith('http') ? formData.avatar : `http://localhost:8000/${formData.avatar.replace(/^\\+|^\/+/, '').replace(/\\/g, '/')}`}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{formData.name?.charAt(0) || formData.full_name?.charAt(0) || '?'}</span>
              )}
              {/* Overlay icon camera */}
              <label htmlFor="avatar-upload" style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '50%',
                padding: 8,
                boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                border: '2px solid #fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }} title="Đổi ảnh đại diện">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75A2.25 2.25 0 0 0 13.5 4.5h-3A2.25 2.25 0 0 0 8.25 6.75v3.75m-2.25 0h12a2.25 2.25 0 0 1 2.25 2.25v6.75A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25v-6.75A2.25 2.25 0 0 1 6 10.5z" /></svg>
                <input id="avatar-upload" type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarUploading(true);
                  setAvatarPreview(URL.createObjectURL(file));
                  const formDataUpload = new FormData();
                  formDataUpload.append('avatar', file);
                  try {
                    const res = await fetch(`http://localhost:8000/users/${id}/avatar`, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
                      },
                      body: formDataUpload,
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.avatar) {
                        setFormData((prev: any) => ({ ...prev, avatar: data.avatar }));
                      } else {
                        alert('Upload ảnh thành công nhưng không nhận được URL!');
                      }
                    } else {
                      alert('Upload ảnh thất bại!');
                    }
                  } catch {
                    alert('Upload ảnh thất bại!');
                  } finally {
                    setAvatarUploading(false);
                  }
                }} disabled={avatarUploading} style={{ display: 'none' }} />
              </label>
            </div>
            {avatarUploading && <span style={{ color: '#6366f1', fontSize: 13, marginTop: 4 }}>Đang tải ảnh lên...</span>}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'transparent', background: 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', margin: 0, letterSpacing: '-0.01em', textAlign: 'center' }}>Chỉnh sửa tài khoản nhân viên</h2>
          <p style={{ color: '#64748b', marginBottom: 24, marginTop: 8, textAlign: 'center', fontSize: 15 }}>Cập nhật thông tin tài khoản</p>
        </div>
        {/* Form fields */}
        <div style={{ display: 'grid', gap: 18, width: '100%' }}>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Tên nhân viên *</label>
            <input
              type="text"
              value={formData.name || formData.full_name || ''}
              onChange={e => handleChange('name', e.target.value)}
              required
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 2, outline: 'none', transition: 'border-color 0.2s', background: '#f8fafc' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              required
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 2, outline: 'none', transition: 'border-color 0.2s', background: '#f8fafc' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Vai trò *</label>
            <select
              value={formData.role || ''}
              onChange={e => handleChange('role', e.target.value)}
              required
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 2, background: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="">Chọn vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="family">Gia đình</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Chức vụ *</label>
            <input
              type="text"
              value={formData.position || ''}
              onChange={e => handleChange('position', e.target.value)}
              required
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 2, outline: 'none', transition: 'border-color 0.2s', background: '#f8fafc' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Trạng thái</label>
            <select
              value={formData.status || 'active'}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 2, background: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' }}
              disabled={saving || formData.role === 'admin'}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
            {formData.role === 'admin' && (
              <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>
                Không thể thay đổi trạng thái tài khoản quản trị viên (admin)
              </div>
            )}
          </div>
        </div>
        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 36, width: '100%' }}>
          <button type="button" onClick={() => router.push('/admin/account-management')} style={{
            padding: '0.75rem 2rem',
            borderRadius: 10,
            border: '1.5px solid #e5e7eb',
            background: '#f1f5f9',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 15,
            transition: 'all 0.2s',
          }}>Hủy</button>
          <button type="submit" disabled={saving} style={{
            padding: '0.75rem 2rem',
            borderRadius: 10,
            border: 'none',
            background: saving ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: 15,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>{saving ? 'Đang lưu...' : (<><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" style={{marginRight: 4}}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Cập nhật</>)}</button>
        </div>
      </form>
    </div>
  );
} 