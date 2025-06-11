"use client";

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusCircleIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { RESIDENTS_DATA } from '@/lib/residents-data';

export default function FamilyAccountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [familyUsers, setFamilyUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string|null>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', residentId: ''
  });
  const [errors, setErrors] = useState<any>({});
  
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('familyUsers') || '[]');
      setFamilyUsers(users);
      setFilteredUsers(users);
      setLoading(false);
    }, 700);
    // Lấy residents
    const saved = localStorage.getItem('nurseryHomeResidents');
    if (saved) {
      try { setResidents(JSON.parse(saved)); } catch { setResidents(RESIDENTS_DATA); }
    } else { setResidents(RESIDENTS_DATA); }
  }, []);

  useEffect(() => {
    const users = familyUsers.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(users);
  }, [searchTerm, familyUsers]);

  const handleAddUser = () => {
    setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', residentId: '' });
    setErrors({});
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setErrors({});
  };

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

  const handleFormChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('familyUsers') || '[]');
      if (users.some((u: any) => u.email === form.email)) {
        setErrors({ email: 'Email đã tồn tại' });
        setLoading(false);
        return;
      }
      const resident = residents.find((r: any) => r.id.toString() === form.residentId);
      const newUser = {
        ...form,
        residentName: resident?.name || '',
        createdAt: new Date().toISOString(),
        role: 'family',
        permissions: ['Đọc'],
        department: 'Chăm sóc',
        lastActive: new Date().toISOString().split('T')[0],
        status: 'Hoạt động',
        avatar: null
      };
      users.push(newUser);
      localStorage.setItem('familyUsers', JSON.stringify(users));
      setFamilyUsers(users);
      setFilteredUsers(users);
      setShowModal(false);
      setToast('Thêm người thân thành công!');
      setLoading(false);
      setTimeout(() => setToast(null), 2000);
    }, 900);
  };

  const handleDeleteUser = (index: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      setLoading(true);
      setTimeout(() => {
        const updated = [...familyUsers];
        updated.splice(index, 1);
        setFamilyUsers(updated);
        setFilteredUsers(updated);
        localStorage.setItem('familyUsers', JSON.stringify(updated));
        setToast('Đã xóa tài khoản!');
        setLoading(false);
        setTimeout(() => setToast(null), 1800);
      }, 700);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', position: 'relative' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 32, background: '#a21caf', color: 'white', padding: '1rem 2rem', borderRadius: 12, fontWeight: 600, zIndex: 1000, boxShadow: '0 2px 8px #a21caf33', fontSize: 18 }}>{toast}</div>}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#a21caf', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserGroupIcon style={{ width: 32, height: 32, color: '#a21caf' }} />
              Quản lý tài khoản người thân
            </h1>
            <div style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Quản lý tài khoản và liên kết người thân với người cao tuổi</div>
          </div>
          <button onClick={handleAddUser} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #a21caf 0%, #f3e8ff 100%)',
            color: 'white', fontWeight: 700, fontSize: '1.05rem',
            border: 'none', borderRadius: '0.75rem', padding: '0.85rem 1.5rem',
            boxShadow: '0 2px 8px rgba(168,85,247,0.10)', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <PlusCircleIcon style={{ width: 22, height: 22, color: 'white' }} />
            Thêm người thân mới
          </button>
        </div>
        <div style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 4px 24px 0 rgba(168,85,247,0.08)', padding: '2rem 1.5rem', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <MagnifyingGlassIcon style={{ width: 22, height: 22, color: '#a21caf' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '0.8rem 1.2rem', borderRadius: '0.75rem', border: '1.5px solid #e5e7eb', fontSize: '1rem', background: '#f8fafc' }}
            />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#a21caf', padding: '2rem 0', fontWeight: 600, fontSize: 20 }}>Đang tải dữ liệu...</div>
          ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3e8ff' }}>
                  <th style={{ padding: '1rem', fontWeight: 700, color: '#a21caf', fontSize: '1rem', textAlign: 'left' }}>Họ tên</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: '#a21caf', fontSize: '1rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: '#a21caf', fontSize: '1rem', textAlign: 'left' }}>Số điện thoại</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: '#a21caf', fontSize: '1rem', textAlign: 'left' }}>Người cao tuổi liên kết</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: '#a21caf', fontSize: '1rem', textAlign: 'left' }}>Ngày tạo</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: '#a21caf', fontSize: '1rem', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#a21caf', padding: '2rem 0', fontWeight: 600 }}>Không có tài khoản nào</td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3e8ff' }}>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#4b2067' }}>{user.name}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{user.email}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{user.phone}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{user.residentName || '-'}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        {/* <button onClick={() => handleEditUser(idx)} style={{ marginRight: 8, background: 'none', border: 'none', cursor: 'pointer' }} title="Chỉnh sửa">
                          <PencilIcon style={{ width: 20, height: 20, color: '#a21caf' }} />
                        </button> */}
                        <button onClick={() => handleDeleteUser(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Xóa">
                          <TrashIcon style={{ width: 20, height: 20, color: '#ef4444' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
      {/* Modal thêm người thân */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleFormSubmit} style={{ background: 'white', borderRadius: 18, boxShadow: '0 8px 32px 0 rgba(168,85,247,0.15)', padding: '2.5rem 2.5rem 2rem 2.5rem', minWidth: 350, maxWidth: 400, width: '100%', border: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <button type="button" onClick={handleModalClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer' }}>
              <XMarkIcon style={{ width: 28, height: 28, color: '#a21caf' }} />
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a21caf', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.01em' }}>Thêm người thân mới</h2>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Họ và tên</label>
              <input name="name" value={form.name} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.name ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.name ? '#fef2f2' : 'white' }} placeholder="Nhập họ tên" />
              {errors.name && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.name}</div>}
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
              <input name="email" value={form.email} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.email ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.email ? '#fef2f2' : 'white' }} placeholder="Nhập email" />
              {errors.email && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.email}</div>}
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Số điện thoại</label>
              <input name="phone" value={form.phone} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.phone ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.phone ? '#fef2f2' : 'white' }} placeholder="Nhập số điện thoại" />
              {errors.phone && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.phone}</div>}
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Mật khẩu</label>
              <input name="password" type="password" value={form.password} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.password ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.password ? '#fef2f2' : 'white' }} placeholder="Nhập mật khẩu" />
              {errors.password && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.password}</div>}
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Xác nhận mật khẩu</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.confirmPassword ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.confirmPassword ? '#fef2f2' : 'white' }} placeholder="Nhập lại mật khẩu" />
              {errors.confirmPassword && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.confirmPassword}</div>}
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Liên kết với người cao tuổi</label>
              <select name="residentId" value={form.residentId} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1.5px solid ${errors.residentId ? '#fca5a5' : '#e5e7eb'}`, fontSize: '1rem', background: errors.residentId ? '#fef2f2' : 'white' }}>
                <option value="">-- Chọn người cao tuổi --</option>
                {residents.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name} (Phòng {r.room})</option>
                ))}
              </select>
              {errors.residentId && <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: 4 }}>{errors.residentId}</div>}
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
              Thêm người thân
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 