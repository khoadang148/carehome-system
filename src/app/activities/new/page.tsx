"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { activitiesAPI } from '@/lib/api';
import Link from 'next/link';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [customActivityType, setCustomActivityType] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const LOCATIONS = ['Thư viện', 'Vườn hoa', 'Phòng y tế', 'Sân vườn', 'Phòng thiền', 'Phòng giải trí', 'Phòng sinh hoạt chung', 'Nhà bếp', 'Phòng nghệ thuật'];
  const ACTIVITY_TYPES = ['Thể dục', 'Văn nghệ', 'Giải trí', 'Giáo dục', 'Khác'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'activity_type') {
      if (value === 'Khác') {
        setShowCustomInput(true);
        setForm({ ...form, [name]: value });
      } else {
        setShowCustomInput(false);
        setCustomActivityType('');
        setForm({ ...form, [name]: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
    
    setError('');
    setSuccess('');
  };

  const handleCustomActivityTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomActivityType(e.target.value);
    setForm({ ...form, activity_type: e.target.value });
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
    
    // Validate activity type
    if (showCustomInput && !customActivityType.trim()) {
      setError('Vui lòng nhập loại hoạt động khi chọn "Khác".');
      return;
    }
    
    // Validate
    if (!form.activity_name.trim() || !form.description.trim() || !form.duration || !form.date || !form.time || !form.location.trim() || !form.capacity || !form.activity_type) {
      setError('Vui lòng điền đầy đủ tất cả các trường bắt buộc (*) để tiếp tục.');
      return;
    }
    if (isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
      setError('Thời lượng hoạt động phải là số nguyên dương (ví dụ: 30, 45, 60 phút).');
      return;
    }
    if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
      setError('Sức chứa phải là số nguyên dương (ví dụ: 10, 20, 50 người).');
      return;
    }

    // Validate thời gian
    const time24 = to24Hour(form.time);
    const scheduleDateTime = form.date && form.time ? `${form.date}T${time24}:00` : '';
    // Tạo Date object từ local time string, không thêm Z để tránh chuyển đổi UTC
    const selectedDateTime = new Date(scheduleDateTime);
    const now = new Date();
    
    // Kiểm tra không được tạo trong quá khứ
    if (selectedDateTime <= now) {
      setError('Thời gian bắt đầu không thể là thời gian trong quá khứ. Vui lòng chọn thời gian trong tương lai.');
      return;
    }
    
    // Kiểm tra phải tạo trước ít nhất 2 tiếng
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (selectedDateTime < twoHoursFromNow) {
      setError('Hoạt động phải được tạo trước ít nhất 2 tiếng so với thời gian bắt đầu để đảm bảo chuẩn bị đầy đủ.');
      return;
    }
    
    // Kiểm tra không được tạo trước quá 1 tuần
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (selectedDateTime > oneWeekFromNow) {
      setError('Hoạt động chỉ có thể được tạo trước tối đa 1 tuần so với thời gian bắt đầu.');
      return;
    }

    const payload = {
      activity_name: form.activity_name,
      description: form.description,
      duration: Number(form.duration),
      schedule_time: scheduleDateTime,
      location: form.location,
      capacity: Number(form.capacity),
      activity_type: showCustomInput ? customActivityType : form.activity_type
    };
    console.log('Payload gửi lên:', payload);
    setLoading(true);
    try {
      await activitiesAPI.create(payload);
      
      // Hiển thị modal thành công
      setSuccessMessage(`Hoạt động "${form.activity_name}" đã được tạo thành công!`);
      setShowSuccessModal(true);
      
      // Tự động chuyển hướng sau 3 giây
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/activities');
      }, 3000);
      
    } catch (err: any) {
      let errorMessage = 'Đã xảy ra lỗi khi tạo hoạt động. Vui lòng thử lại sau.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <Link href="/activities" style={{
            marginRight: '1rem', 
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(102, 126, 234, 0.1)',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}>
            <ArrowLeftIcon style={{height: '1.25rem', width: '1.25rem'}} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <CalendarIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <h1 style={{
                fontSize: '1.875rem', 
                fontWeight: 700, 
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                Thêm hoạt động mới
              </h1>
            </div>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Tạo hoạt động mới để người cao tuổi tham gia
            </p>
          </div>
        </div>
        
        {/* Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <DocumentTextIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin cơ bản
                </h2>
              </div>
            </div>
            
            <div style={{padding: '2rem'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Tên hoạt động <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input 
                    name="activity_name" 
                    value={form.activity_name} 
                    onChange={handleChange} 
                    required 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem', 
                      border: '2px solid #e5e7eb', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                    placeholder="Nhập tên hoạt động"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Loại hoạt động <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  {!showCustomInput ? (
                    <select
                      name="activity_type"
                      value={form.activity_type}
                      onChange={handleChange}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: '0.5rem', 
                        border: '2px solid #e5e7eb', 
                        fontSize: '0.95rem', 
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        background: 'white'
                      }}
                    >
                      <option value="">-- Chọn loại hoạt động --</option>
                      {ACTIVITY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={customActivityType}
                        onChange={handleCustomActivityTypeChange}
                        placeholder="Nhập loại hoạt động..."
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: '0.5rem', 
                          border: '2px solid #667eea', 
                          fontSize: '0.95rem', 
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          background: 'white',
                          paddingRight: '2.5rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomActivityType('');
                          setForm({ ...form, activity_type: '' });
                        }}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          transition: 'all 0.2s',
                          fontSize: '0.875rem'
                        }}
                        title="Quay lại danh sách"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {showCustomInput && (
                    <p style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      Nhập loại hoạt động tùy chỉnh hoặc nhấn ✕ để quay lại danh sách
                    </p>
                  )}
                </div>
              </div>

              <div style={{marginBottom: '2rem'}}>
                <label style={{
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '0.5rem'
                }}>
                  Mô tả <span style={{color: '#ef4444'}}>*</span>
                </label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  required 
                  rows={4} 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '0.95rem', 
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'white',
                    resize: 'vertical' 
                  }}
                  placeholder="Mô tả chi tiết về hoạt động..."
                />
              </div>
            </div>

            {/* Schedule Information Section */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <ClockIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin lịch trình
                </h2>
              </div>
            </div>

            <div style={{padding: '2rem'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Ngày <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <ReactDatePicker
                    selected={dateValue}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    className="your-input-class"
                    required
                    wrapperClassName="w-full"
                    customInput={<input style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem', 
                      border: '2px solid #e5e7eb', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }} />}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Giờ bắt đầu <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input 
                    name="time" 
                    type="time" 
                    value={form.time} 
                    onChange={handleChange} 
                    required 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem', 
                      border: '2px solid #e5e7eb', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }} 
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Thời lượng (phút) <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input 
                    name="duration" 
                    type="number" 
                    min={1} 
                    value={form.duration} 
                    onChange={handleChange} 
                    required 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem', 
                      border: '2px solid #e5e7eb', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }} 
                    placeholder="30, 45, 60..."
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Sức chứa <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input 
                    name="capacity" 
                    type="number" 
                    min={1} 
                    value={form.capacity} 
                    onChange={handleChange} 
                    required 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem', 
                      border: '2px solid #e5e7eb', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }} 
                    placeholder="10, 20, 50..."
                  />
                </div>
              </div>
            </div>

            {/* Location Information Section */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <MapPinIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin địa điểm
                </h2>
              </div>
            </div>

            <div style={{padding: '2rem'}}>
              <div style={{marginBottom: '2rem'}}>
                <label style={{
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '0.5rem'
                }}>
                  Địa điểm <span style={{color: '#ef4444'}}>*</span>
                </label>
                <select 
                  name="location" 
                  value={form.location} 
                  onChange={handleChange} 
                  required 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '0.95rem', 
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'white'
                  }}
                >
                  <option value="">-- Chọn địa điểm --</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div style={{ 
                margin: '0 2rem 2rem 2rem', 
                padding: '1rem', 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '0.5rem', 
                color: '#dc2626', 
                fontWeight: 500 
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ 
                margin: '0 2rem 2rem 2rem', 
                padding: '1rem', 
                background: '#f0fdf4', 
                border: '1px solid #bbf7d0', 
                borderRadius: '0.5rem', 
                color: '#16a34a', 
                fontWeight: 500 
              }}>
                {success}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '1rem',
              padding: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Link 
                href="/activities" 
                style={{
                  padding: '0.75rem 2rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  textDecoration: 'none',
                  background: 'white',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  border: '2px solid transparent',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'white',
                  background: loading 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading && (
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {loading ? 'Đang tạo...' : 'Tạo hoạt động'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
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
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
              animation: 'successIconBounce 0.6s ease-out'
            }}>
              <CheckCircleIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            
            {/* Success Title */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#3730a3',
              margin: '0 0 1rem 0',
              letterSpacing: '-0.025em'
            }}>
              Tạo hoạt động thành công!
            </h2>
            
            {/* Success Message */}
            <p style={{
              fontSize: '1rem',
              color: '#4b5563',
              margin: '0 0 2rem 0',
              lineHeight: 1.6
            }}>
              {successMessage}
            </p>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '0.25rem',
              background: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '9999px',
                animation: 'progressBar 3s linear forwards'
              }} />
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/activities');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #5b21b6 0%, #3730a3 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                Xem danh sách
              </button>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes successIconBounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        input:focus, select:focus, textarea:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        a:hover {
          background: rgba(102, 126, 234, 0.2) !important;
        }
        
        button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
} 
