"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { activitiesAPI } from '@/lib/api';
import Link from 'next/link';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";

export default function NewActivityPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    activity_name: '',
    description: '',
    duration: '',
    date: '', // vẫn giữ để submit
    time: '',
    location: '',
    capacity: '',
    activity_type: '' // Thêm trường này
  });
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const LOCATIONS = ['Thư viện', 'Vườn hoa', 'Phòng y tế', 'Sân vườn', 'Phòng thiền', 'Phòng giải trí', 'Phòng sinh hoạt chung', 'Nhà bếp', 'Phòng nghệ thuật'];
  const ACTIVITY_TYPES = ['Thể dục', 'Văn nghệ', 'Giải trí', 'Giáo dục', 'Khác'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };
  // Xử lý khi chọn ngày
  const handleDateChange = (date: Date | null) => {
    setDateValue(date);
    setForm(f => ({ ...f, date: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  // Chuyển time về 24h format nếu cần
  function to24Hour(timeStr: string): string {
    // Nếu là 10:00 hoặc 23:30 thì trả về luôn
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // Nếu là 10:00 AM/PM
    const match = timeStr.match(/(\d{1,2}):(\d{2}) ?([APap][Mm])?/);
    if (!match) return timeStr;
    let [_, h, m, ap] = match;
    let hour = parseInt(h, 10);
    if (ap) {
      ap = ap.toUpperCase();
      if (ap === 'PM' && hour < 12) hour += 12;
      if (ap === 'AM' && hour === 12) hour = 0;
    }
    return `${hour.toString().padStart(2, '0')}:${m}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Validate
    if (!form.activity_name.trim() || !form.description.trim() || !form.duration || !form.date || !form.time || !form.location.trim() || !form.capacity || !form.activity_type) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
      setError('Thời lượng phải là số lớn hơn 0.');
      return;
    }
    if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
      setError('Sức chứa phải là số lớn hơn 0.');
      return;
    }
    // Tạo schedule_time ISO
    const time24 = to24Hour(form.time);
    const schedule_time = form.date && form.time ? new Date(`${form.date}T${time24}:00.000Z`).toISOString() : '';
    const payload = {
      activity_name: form.activity_name,
      description: form.description,
      duration: Number(form.duration),
      schedule_time,
      location: form.location,
      capacity: Number(form.capacity),
      activity_type: form.activity_type // Thêm trường này vào payload
    };
    console.log('Payload gửi lên:', payload);
    setLoading(true);
    try {
      await activitiesAPI.create(payload);
      setSuccess('Tạo hoạt động thành công!');
      setTimeout(() => router.push('/activities'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 32px rgba(59,130,246,0.08)', padding: 36, minWidth: 400, maxWidth: 480, width: '100%' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#2563eb', textAlign: 'center' }}>Thêm hoạt động mới</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Tên hoạt động *</label>
            <input name="activity_name" value={form.activity_name} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }} />
            </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Mô tả *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Thời lượng (phút) *</label>
              <input name="duration" type="number" min={1} value={form.duration} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }} />
                    </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Sức chứa *</label>
              <input name="capacity" type="number" min={1} value={form.capacity} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }} />
            </div>
            </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Ngày *</label>
              <ReactDatePicker
                selected={dateValue}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="your-input-class"
                required
                wrapperClassName="w-full"
                customInput={<input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }} />}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Giờ bắt đầu *</label>
              <input name="time" type="time" value={form.time} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }} />
          </div>
            </div>
            <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Địa điểm *</label>
            <select name="location" value={form.location} onChange={handleChange} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }}>
              <option value="">-- Chọn địa điểm --</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
            <div>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>Loại hoạt động *</label>
            <select
              name="activity_type"
              value={form.activity_type}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, marginTop: 4, background: '#f8fafc' }}
            >
              <option value="">-- Chọn loại hoạt động --</option>
              {ACTIVITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
            </div>
        {error && <div style={{ color: '#dc2626', marginTop: 18, textAlign: 'center', fontWeight: 500 }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', marginTop: 18, textAlign: 'center', fontWeight: 500 }}>{success}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <Link href="/activities" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', padding: '8px 20px', borderRadius: 8, background: '#f1f5f9', border: '1.5px solid #e5e7eb' }}>Quay lại</Link>
          <button type="submit" disabled={loading} style={{ padding: '8px 32px', borderRadius: 8, border: 'none', background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)', color: 'white', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.10)', transition: 'all 0.2s' }}>{loading ? 'Đang lưu...' : 'Tạo hoạt động'}</button>
          </div>
        </form>
      </div>
  );
} 
