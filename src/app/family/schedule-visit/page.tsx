"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon, ClockIcon, HeartIcon, XMarkIcon, CheckIcon, UsersIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ClockIcon as HistoryIcon } from '@heroicons/react/24/solid';

const residents = [
  { id: 1, name: 'Nguyễn Văn Nam', room: 'A01', avatar: 'https://randomuser.me/api/portraits/men/72.jpg', status: 'Ổn định', relationship: 'Cha', age: 78 },
  { id: 2, name: 'Lê Thị Hoa', room: 'A02', avatar: 'https://randomuser.me/api/portraits/women/65.jpg', status: 'Khá', relationship: 'Mẹ', age: 75 }
];

// Dữ liệu mẫu lịch sử đặt lịch thăm
const visitHistory = [
  {
    id: 1,
    resident: 'Nguyễn Văn Nam',
    date: '2024-05-10',
    time: '09:00 - 10:00',
    purpose: 'Thăm hỏi sức khỏe',
    status: 'Đã xác nhận'
  },
  {
    id: 2,
    resident: 'Lê Thị Hoa',
    date: '2024-05-08',
    time: '14:00 - 15:00',
    purpose: 'Mang quà và thức ăn',
    status: 'Đã xác nhận'
  },
  {
    id: 3,
    resident: 'Nguyễn Văn Nam',
    date: '2024-05-05',
    time: '10:00 - 11:00',
    purpose: 'Sinh nhật',
    status: 'Đã hủy'
  }
];

export default function ScheduleVisitPage() {
  const router = useRouter();
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    console.log('Modal states:', { showHistory, showSuccess, showMessageModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showHistory || showSuccess || showMessageModal;
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showHistory, showSuccess, showMessageModal]);

  const submitVisitSchedule = () => {
    if (visitDate && visitTime && visitPurpose) {
      setShowSuccess(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          marginLeft: '270px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            minWidth: '800px',
            maxWidth: '910px',
            width: '90%',
            maxHeight: '80vh',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setShowHistory(false)}
              title="Đóng"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                color: '#6b7280',
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                e.currentTarget.style.color = '#6b7280';
              }}
              aria-label="Đóng"
            >
              <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                borderRadius: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' 
              }}>
                <CalendarDaysIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  margin: 0, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Lịch sử đặt lịch thăm
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi các lịch hẹn thăm viếng đã đặt
                </p>
              </div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <CalendarDaysIcon style={{width: '1.25rem', height: '1.25rem', color: '#059669'}} />
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#059669'
                }}>
                  Danh sách lịch hẹn
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#047857',
                margin: 0
              }}>
                Tổng cộng có {visitHistory.length} lịch hẹn đã được tạo
              </p>
            </div>
            
            <div style={{ 
              background: 'white',
              borderRadius: '1rem',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      color: '#374151',
                      letterSpacing: '0.025em'
                    }}>
                      Người thân
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      color: '#374151',
                      letterSpacing: '0.025em'
                    }}>
                      Ngày thăm
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      color: '#374151',
                      letterSpacing: '0.025em'
                    }}>
                      Thời gian
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      color: '#374151',
                      letterSpacing: '0.025em'
                    }}>
                      Mục đích
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visitHistory.map((item, index) => (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: index < visitHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ 
                        padding: '1rem', 
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>
                        {item.resident}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {new Date(item.date).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontWeight: 500
                      }}>
                        {item.time}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {item.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '1.8rem', background: 'white', borderRadius: '2rem', boxShadow: '0 8px 32px rgba(16,185,129,0.10)', padding: '2.5rem 2rem', maxWidth: 900, width: '100%', alignItems: 'flex-start', position: 'relative' }}>
        {/* Cột phải: Form đặt lịch */}
        <div style={{ flex: 2, minWidth: 350 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.13)' }}>
                <CalendarDaysIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: ' #059669', letterSpacing: '-0.5px' }}>Đặt lịch thăm người thân</h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Vui lòng điền đầy đủ thông tin để đặt lịch thăm viếng</div>
              </div>
            </div>

            {/* Nút xem lịch sử đặt lịch thăm */}
            <button
              onClick={() => setShowHistory(true)}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '9999px',
                border: '1.5px solid #10b981',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.98rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16,185,129,0.07)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: '1rem'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)'; }}
            >
              <HistoryIcon style={{ width: '1.1rem', height: '1.1rem', color: '#059669' }} />
              Lịch sử thăm
            </button>
          </div>
          {!showSuccess ? (
            <>
              <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.98rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                    <CalendarDaysIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    Ngày thăm <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', fontSize: '0.98rem', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.10)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.07)'; }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>Chỉ được đặt lịch trước ít nhất <b>24 giờ</b>. Thời gian thăm: <b>9:00-11:00</b> và <b>14:00-17:00</b>.</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.98rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                    <ClockIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    Giờ thăm <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                  </label>
                  <select
                    value={visitTime}
                    onChange={e => setVisitTime(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', fontSize: '0.98rem', background: 'white', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.10)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.07)'; }}
                  >
                    <option value="">Chọn giờ thăm...</option>
                    <option value="09:00">09:00 - 10:00</option>
                    <option value="10:00">10:00 - 11:00</option>
                    <option value="14:00">14:00 - 15:00</option>
                    <option value="15:00">15:00 - 16:00</option>
                    <option value="16:00">16:00 - 17:00</option>
                  </select>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>Mỗi lần thăm kéo dài <b>1 giờ</b>. Vui lòng đến đúng giờ đã chọn.</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.98rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                    <HeartIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    Mục đích thăm <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                  </label>
                  <select
                    value={visitPurpose}
                    onChange={e => setVisitPurpose(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', fontSize: '0.98rem', background: 'white', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.10)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.07)'; }}
                  >
                    <option value="">Chọn mục đích...</option>
                    <option value="Thăm hỏi sức khỏe">Thăm hỏi sức khỏe</option>
                    <option value="Sinh nhật">Chúc mừng sinh nhật</option>
                    <option value="Mang quà">Mang quà và thức ăn</option>
                    <option value="Tham gia hoạt động">Tham gia hoạt động</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>Chọn đúng mục đích để nhân viên chuẩn bị tốt nhất cho chuyến thăm.</div>
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #bbf7d0', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', marginBottom: '2rem', color: '#059669', fontWeight: 500, fontSize: '0.98rem' }}>
                <span style={{ fontWeight: 700, color: '#10b981', marginRight: 6 }}>Lưu ý:</span> Vui lòng mang theo giấy tờ tùy thân khi đến thăm. Đặt lịch trước ít nhất 24 giờ. Nếu có thay đổi, hãy liên hệ nhân viên để được hỗ trợ.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => router.back()}
                  style={{ padding: '0.85rem 1.7rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)' }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={submitVisitSchedule}
                  disabled={!visitDate || !visitTime || !visitPurpose}
                  style={{ padding: '0.85rem 1.7rem', borderRadius: '0.75rem', border: 'none', background: (!visitDate || !visitTime || !visitPurpose) ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', cursor: (!visitDate || !visitTime || !visitPurpose) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', boxShadow: (!visitDate || !visitTime || !visitPurpose) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.13)' }}
                  onMouseOver={e => { if (!(!visitDate || !visitTime || !visitPurpose)) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.18)'; } }}
                  onMouseOut={e => { if (!(!visitDate || !visitTime || !visitPurpose)) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.13)'; } }}
                >
                  <CheckIcon style={{ width: '1.1rem', height: '1.1rem' }} />
                  Đặt lịch
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: '5rem', height: '5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.13)' }}>
                <CheckIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 1rem 0' }}>Đã đặt lịch thăm thành công!</h2>
              <p style={{ fontSize: '1.08rem', color: '#6b7280', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>Chúng tôi sẽ xác nhận lịch hẹn với bạn trong vòng 3 đến 12 tiếng. Vui lòng kiểm tra thông báo hoặc liên hệ nhân viên nếu cần hỗ trợ thêm.</p>
              <button
                onClick={() => router.push('/family')}
                style={{ padding: '1rem 3rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.08rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.13)', minWidth: '120px' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.18)'; e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.13)'; e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; }}
              >
                Quay lại trang chính
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 