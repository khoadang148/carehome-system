import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RESIDENTS_DATA } from '@/lib/residents-data';

export default function FamilyRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    residentId: '',
    role: 'family',
    permissions: ['Đọc'],
    department: 'Chăm sóc',
    lastActive: new Date().toISOString().split('T')[0],
    status: 'Hoạt động',
    avatar: null
  });
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);

  useEffect(() => {
    // Lấy residents từ localStorage nếu có, ưu tiên dữ liệu mới nhất
    const saved = localStorage.getItem('nurseryHomeResidents');
    if (saved) {
      try {
        setResidents(JSON.parse(saved));
      } catch {
        setResidents(RESIDENTS_DATA);
      }
    } else {
      setResidents(RESIDENTS_DATA);
    }
  }, []);

  const validate = () => {
    const errs: any = {};
    if (!form.name.trim()) errs.name = 'Họ tên là bắt buộc';
    if (!form.email.trim()) errs.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.phone.trim()) errs.phone = 'Số điện thoại là bắt buộc';
    else if (!/^\d{9,11}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Số điện thoại không hợp lệ';
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (!form.residentId) errs.residentId = 'Vui lòng chọn người cao tuổi liên kết';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      const familyUsers = JSON.parse(localStorage.getItem('familyUsers') || '[]');
      if (familyUsers.some((u: any) => u.email === form.email)) {
        setErrors({ email: 'Email đã tồn tại' });
        setSubmitting(false);
        return;
      }
      const resident = residents.find((r: any) => r.id.toString() === form.residentId);
      familyUsers.push({ ...form, residentName: resident?.name || '', createdAt: new Date().toISOString() });
      localStorage.setItem('familyUsers', JSON.stringify(familyUsers));
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)', padding: '2rem' }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px 0 rgba(139,92,246,0.10)',
        padding: '2.5rem 2.5rem 2rem 2.5rem',
        minWidth: 350,
        maxWidth: 400,
        width: '100%',
        border: '1px solid #ede9fe',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#7c3aed', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.01em' }}>Đăng ký tài khoản người thân</h2>
        <p style={{ color: '#6b7280', fontSize: '1rem', textAlign: 'center', marginBottom: 12 }}>Dành cho gia đình/người thân của người cao tuổi</p>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Họ và tên</label>
          <input name="name" value={form.name} onChange={handleChange} disabled={submitting} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.name ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.name ? '#fef2f2' : 'white' }} placeholder="Nhập họ tên" />
          {errors.name && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.name}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
          <input name="email" value={form.email} onChange={handleChange} disabled={submitting} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.email ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.email ? '#fef2f2' : 'white' }} placeholder="Nhập email" />
          {errors.email && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.email}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Số điện thoại</label>
          <input name="phone" value={form.phone} onChange={handleChange} disabled={submitting} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.phone ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.phone ? '#fef2f2' : 'white' }} placeholder="Nhập số điện thoại" />
          {errors.phone && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.phone}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Mật khẩu</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} disabled={submitting} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.password ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.password ? '#fef2f2' : 'white' }} placeholder="Nhập mật khẩu" />
          {errors.password && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.password}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Xác nhận mật khẩu</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} disabled={submitting} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.confirmPassword ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.confirmPassword ? '#fef2f2' : 'white' }} placeholder="Nhập lại mật khẩu" />
          {errors.confirmPassword && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.confirmPassword}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Liên kết với người cao tuổi</label>
          <select name="residentId" value={form.residentId} onChange={handleChange} disabled={submitting} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.residentId ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.residentId ? '#fef2f2' : 'white' }}>
            <option value="">-- Chọn người cao tuổi --</option>
            {residents.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name} (Phòng {r.room})</option>
            ))}
          </select>
          {errors.residentId && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.residentId}</div>}
        </div>
        <button type="submit" disabled={submitting} style={{
          width: '100%',
          padding: '0.9rem',
          borderRadius: '0.75rem',
          background: submitting ? 'linear-gradient(135deg, #a5b4fc 0%, #ede9fe 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.1rem',
          border: 'none',
          marginTop: 8,
          boxShadow: '0 2px 8px rgba(139,92,246,0.10)',
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}>
          {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
        {success && <div style={{ color: '#16a34a', fontWeight: 600, textAlign: 'center', marginTop: 12 }}>Đăng ký thành công! Đang chuyển hướng...</div>}
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.98rem' }}>
          Đã có tài khoản? <a href="/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'underline', marginLeft: 4 }}>Đăng nhập</a>
        </div>
      </form>
    </div>
  );
}
