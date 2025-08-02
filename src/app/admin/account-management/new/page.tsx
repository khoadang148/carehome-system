"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { residentAPI } from "@/lib/api";
import { userAPI } from "@/lib/api";

// Format ngày sinh dạng dd/mm/yyyy
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function NewAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "staff",
    avatar: null as File | null,
    address: "",
    notes: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  
  // State cho modal thông báo thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (formData.role === "family") {
      residentAPI.getAll()
        .then((data: any[]) => setResidents(data.filter((r: any) => !r.family_member_id)))
        .catch(() => setResidents([]));
    }
  }, [formData.role]);

  const handleChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Chỉ chấp nhận file ảnh JPG, PNG, GIF");
      return;
    }
    if (file.size > 1024 * 1024) {
      alert("File quá lớn, chỉ chấp nhận tối đa 1MB");
      return;
    }
    setFormData((prev) => ({ ...prev, avatar: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setValidationErrors({});
    
    // Validate form
    const errors: {[key: string]: string} = {};
    
    if (!formData.username.trim()) {
      errors.username = "Tên đăng nhập không được để trống";
    } else if (formData.username.length < 3) {
      errors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới";
    }
    
    if (!formData.password.trim()) {
      errors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Email không đúng định dạng";
    }
    
    if (!formData.role) {
      errors.role = "Vui lòng chọn vai trò";
    }
    
    // Nếu là gia đình thì phải chọn cư dân
    if (formData.role === "family" && !selectedResidentId) {
      errors.resident = "Vui lòng chọn cư dân thuộc tài khoản gia đình này";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }
    try {
      const data = new FormData();
      data.append("username", formData.username);
      data.append("password", formData.password);
      data.append("email", formData.email);
      data.append("role", formData.role);
      if (formData.avatar) data.append("avatar", formData.avatar);
      // Thêm các trường backend yêu cầu (ẩn khỏi form)
      data.append("full_name", formData.username);
      data.append("phone", "0123456789");
      data.append("status", "active");
      data.append("created_at", new Date().toISOString());
      data.append("updated_at", new Date().toISOString());
      // Thêm các trường mới cho family accounts
      if (formData.role === "family") {
        if (formData.address) data.append("address", formData.address);
        if (formData.notes) data.append("notes", formData.notes);
      }
              const res = await userAPI.create(data);
        if (res.status === 201) {
          const user = res.data;
          // Nếu là gia đình, cập nhật resident
          if (formData.role === "family" && selectedResidentId) {
            await residentAPI.update(selectedResidentId, { family_member_id: user._id });
          }
          setSuccessMessage("Tài khoản đã được tạo thành công!");
          setShowSuccessModal(true);
        } else {
        const errData = res.data;
        setError(errData.detail || errData.message || "Tạo tài khoản thất bại!");
      }
    } catch (err: any) {
      // Xử lý lỗi trùng lặp cụ thể
      if (err.message?.includes('username') || err.message?.includes('tên đăng nhập')) {
        setValidationErrors(prev => ({ ...prev, username: "Tên đăng nhập đã tồn tại trong hệ thống" }));
      } else if (err.message?.includes('email')) {
        setValidationErrors(prev => ({ ...prev, email: "Email đã được sử dụng bởi tài khoản khác" }));
      } else {
        setError(err.message || "Tạo tài khoản thất bại! Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

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
              ) : (
                <span>?</span>
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
              }} title="Chọn ảnh đại diện">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75A2.25 2.25 0 0 0 13.5 4.5h-3A2.25 2.25 0 0 0 8.25 6.75v3.75m-2.25 0h12a2.25 2.25 0 0 1 2.25 2.25v6.75A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25v-6.75A2.25 2.25 0 0 1 6 10.5z" /></svg>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'transparent', background: 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', margin: 0, letterSpacing: '-0.01em', textAlign: 'center' }}>Thêm tài khoản mới</h2>
          <p style={{ color: '#64748b', marginBottom: 24, marginTop: 8, textAlign: 'center', fontSize: 15 }}>Điền thông tin để tạo tài khoản mới cho hệ thống</p>
        </div>
        {/* Form fields */}
        <div style={{ display: 'grid', gap: 18, width: '100%' }}>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Tên đăng nhập *</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => handleChange('username', e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: 14, 
                borderRadius: 10, 
                border: validationErrors.username ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', 
                fontSize: 15, 
                marginTop: 2, 
                outline: 'none', 
                transition: 'border-color 0.2s', 
                background: validationErrors.username ? '#fef2f2' : '#f8fafc' 
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = validationErrors.username ? '#ef4444' : '#e5e7eb'}
            />
            {validationErrors.username && (
              <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {validationErrors.username}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Mật khẩu *</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: 14, 
                borderRadius: 10, 
                border: validationErrors.password ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', 
                fontSize: 15, 
                marginTop: 2, 
                outline: 'none', 
                transition: 'border-color 0.2s', 
                background: validationErrors.password ? '#fef2f2' : '#f8fafc' 
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = validationErrors.password ? '#ef4444' : '#e5e7eb'}
            />
            {validationErrors.password && (
              <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {validationErrors.password}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: 14, 
                borderRadius: 10, 
                border: validationErrors.email ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', 
                fontSize: 15, 
                marginTop: 2, 
                outline: 'none', 
                transition: 'border-color 0.2s', 
                background: validationErrors.email ? '#fef2f2' : '#f8fafc' 
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = validationErrors.email ? '#ef4444' : '#e5e7eb'}
            />
            {validationErrors.email && (
              <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {validationErrors.email}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Vai trò *</label>
            <select
              value={formData.role}
              onChange={e => handleChange('role', e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: 14, 
                borderRadius: 10, 
                border: validationErrors.role ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', 
                fontSize: 15, 
                marginTop: 2, 
                background: validationErrors.role ? '#fef2f2' : '#f8fafc', 
                outline: 'none', 
                transition: 'border-color 0.2s' 
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = validationErrors.role ? '#ef4444' : '#e5e7eb'}
            >
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="family">Gia đình</option>
            </select>
            {validationErrors.role && (
              <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {validationErrors.role}
              </div>
            )}
          </div>
          {/* Nếu là gia đình thì chọn cư dân */}
          {formData.role === "family" && (
            <>
              <div>
                <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Chọn cư dân thuộc tài khoản này *</label>
                <select
                  value={selectedResidentId}
                  onChange={e => {
                    setSelectedResidentId(e.target.value);
                    if (validationErrors.resident) {
                      setValidationErrors(prev => ({ ...prev, resident: "" }));
                    }
                  }}
                  required
                  style={{ 
                    width: '100%', 
                    padding: 14, 
                    borderRadius: 10, 
                    border: validationErrors.resident ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', 
                    fontSize: 15, 
                    marginTop: 2, 
                    background: validationErrors.resident ? '#fef2f2' : '#f8fafc', 
                    outline: 'none', 
                    transition: 'border-color 0.2s' 
                  }}
                >
                  <option value="">-- Chọn cư dân --</option>
                  {residents.map(r => (
                    <option key={r._id} value={r._id}>{r.full_name} ({formatDate(r.date_of_birth)})</option>
                  ))}
                </select>
                {validationErrors.resident && (
                  <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {validationErrors.resident}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Nhập địa chỉ của người giám hộ"
                  style={{ 
                    width: '100%', 
                    padding: 14, 
                    borderRadius: 10, 
                    border: '1.5px solid #e5e7eb', 
                    fontSize: 15, 
                    marginTop: 2, 
                    outline: 'none', 
                    transition: 'border-color 0.2s', 
                    background: '#f8fafc' 
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, marginBottom: 4, display: 'block' }}>Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="Nhập ghi chú về tài khoản (tùy chọn)"
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: 14, 
                    borderRadius: 10, 
                    border: '1.5px solid #e5e7eb', 
                    fontSize: 15, 
                    marginTop: 2, 
                    outline: 'none', 
                    transition: 'border-color 0.2s', 
                    background: '#f8fafc',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>
            </>
          )}
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
          }}>{saving ? 'Đang lưu...' : (<><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" style={{marginRight: 4}}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Tạo tài khoản</>)}          </button>
        </div>
      </form>

      {/* Modal thông báo thành công */}
      {showSuccessModal && (
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
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {/* Icon thành công */}
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            {/* Tiêu đề */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 0.75rem 0',
              letterSpacing: '-0.01em'
            }}>
              Thành công!
            </h3>

            {/* Nội dung */}
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              margin: '0 0 2rem 0',
              lineHeight: 1.6
            }}>
              {successMessage}
            </p>

            {/* Nút đóng */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/admin/account-management");
              }}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                minWidth: '120px'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 