"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { RESIDENTS_DATA } from '@/lib/residents-data';

const statuses = ['Hoạt động', 'Tạm khóa'];

export default function EditFamilyUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', residentId: '', status: 'Hoạt động', createdAt: '', residentName: ''
  });
  const [errors, setErrors] = useState<any>({});
  const [residents, setResidents] = useState<any[]>([]);

  useEffect(() => {
    // Fake API: load user by id
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('familyUsers') || '[]');
      const user = users[parseInt(params.id)];
      if (user) {
        setForm({
          name: user.name,
          email: user.email,
          phone: user.phone,
          residentId: user.residentId,
          status: user.status || 'Hoạt động',
          createdAt: user.createdAt,
          residentName: user.residentName || ''
        });
      } else {
        setShowError(true);
      }
      setLoading(false);
    }, 700);
    // Residents
    const saved = localStorage.getItem('nurseryHomeResidents');
    if (saved) {
      try { setResidents(JSON.parse(saved)); } catch { setResidents(RESIDENTS_DATA); }
    } else { setResidents(RESIDENTS_DATA); }
  }, [params.id]);

  const validate = () => {
    const errs: any = {};
    if (!form.name.trim()) errs.name = 'Họ tên là bắt buộc';
    if (!form.email.trim()) errs.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.phone.trim()) errs.phone = 'Số điện thoại là bắt buộc';
    else if (!/^\d{9,11}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Số điện thoại không hợp lệ';
    if (!form.residentId) errs.residentId = 'Vui lòng chọn người cao tuổi liên kết';
    return errs;
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('familyUsers') || '[]');
      const idx = parseInt(params.id);
      const resident = residents.find((r: any) => r.id.toString() === form.residentId);
      users[idx] = {
        ...users[idx],
        ...form,
        residentName: resident?.name || '',
        status: form.status
      };
      localStorage.setItem('familyUsers', JSON.stringify(users));
      setShowSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/permissions/family');
      }, 1800);
    }, 900);
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a21caf', fontWeight: 600, fontSize: 20 }}>Đang tải dữ liệu...</div>;
  if (showError) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 600, fontSize: 20 }}>Không tìm thấy tài khoản!</div>;
  if (showSuccess) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 700, fontSize: 22 }}><CheckCircleIcon style={{width: 32, height: 32, marginRight: 12}} />Cập nhật thành công!</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 8px 32px 0 rgba(168,85,247,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', minWidth: 350, maxWidth: 420, width: '100%', border: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
        <Link href="/permissions/family" style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#a21caf', fontWeight: 600, fontSize: 18, textDecoration: 'underline' }}><XMarkIcon style={{ width: 28, height: 28, color: '#a21caf' }} /></Link>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a21caf', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}><UserGroupIcon style={{ width: 32, height: 32, color: '#a21caf' }} />Chỉnh sửa người thân</h2>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Họ và tên</label>
          <input name="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.name ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.name ? '#fef2f2' : 'white' }} placeholder="Nhập họ tên" />
          {errors.name && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.name}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
          <input name="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.email ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.email ? '#fef2f2' : 'white' }} placeholder="Nhập email" />
          {errors.email && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.email}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Số điện thoại</label>
          <input name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.phone ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.phone ? '#fef2f2' : 'white' }} placeholder="Nhập số điện thoại" />
          {errors.phone && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.phone}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Liên kết với người cao tuổi</label>
          <select name="residentId" value={form.residentId} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.residentId ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.residentId ? '#fef2f2' : 'white' }}>
            <option value="">-- Chọn người cao tuổi --</option>
            {residents.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name} (Phòng {r.room})</option>
            ))}
          </select>
          {errors.residentId && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.residentId}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Trạng thái</label>
          <select name="status" value={form.status} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1.5px solid #e5e7eb', fontSize: '1rem', background: 'white' }}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" style={{
          width: '100%',
          padding: '0.9rem',
          borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #a21caf 0%, #f3e8ff 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.1rem',
          border: 'none',
          marginTop: 8,
          boxShadow: '0 2px 8px rgba(168,85,247,0.10)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
} 