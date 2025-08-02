"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon, ClockIcon, HeartIcon, XMarkIcon, CheckIcon, UsersIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ClockIcon as HistoryIcon } from '@heroicons/react/24/solid';
import { residentAPI, visitsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

export default function ScheduleVisitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [scheduledResidents, setScheduledResidents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);

  function getTimeRange(startTime: string) {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = hour + 1;
    return `${startTime} - ${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // Hàm xác định trạng thái của lịch thăm
  function getVisitStatus(date: string, time: string) {
    if (!date || !time) return 'unknown';

    const visitDate = new Date(date);
    const now = new Date();

    // Lấy ngày/tháng/năm của lịch thăm
    const visitDay = visitDate.getDate();
    const visitMonth = visitDate.getMonth();
    const visitYear = visitDate.getFullYear();

    // Lấy ngày/tháng/năm hiện tại
    const nowDay = now.getDate();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    if (
      visitYear < nowYear ||
      (visitYear === nowYear && visitMonth < nowMonth) ||
      (visitYear === nowYear && visitMonth === nowMonth && visitDay < nowDay)
    ) {
      return 'past'; // Đã qua
    } else if (
      visitYear === nowYear &&
      visitMonth === nowMonth &&
      visitDay === nowDay
    ) {
      return 'today'; // Hôm nay
    } else {
      return 'future'; // Tương lai
    }
  }

  // Gộp các entry có cùng ngày, giờ, mục đích, status thành 1 dòng với danh sách người thân
  function groupVisitHistory(history: any[], residents: any[]) {
    const grouped: {
      key: string;
      residents: string[];
      date: string;
      time: string;
      purpose: string;
      status: string;
    }[] = [];
    history.forEach(item => {
      const date = item.visit_date || item.requestedDate || item.date || '';
      const time = item.visit_time || item.requestedTime || item.time || '';
      // Ánh xạ resident_id sang tên từ residents
      let residentName = 'Chưa cập nhật';
      if (item.resident_id) {
        const found = residents.find(r => r._id === item.resident_id);
        residentName = found?.full_name || found?.fullName || found?.name || 'Chưa cập nhật';
      }
      const key = `${date}|${time}|${item.purpose}|${item.status}`;
      const foundGroup = grouped.find(g =>
        g.date === date &&
        g.time === time &&
        g.purpose === item.purpose &&
        g.status === item.status
      );
      if (foundGroup) {
        if (!foundGroup.residents.includes(residentName)) {
          foundGroup.residents.push(residentName);
        }
      } else {
        grouped.push({
          key,
          residents: [residentName],
          date,
          time,
          purpose: item.purpose,
          status: item.status
        });
      }
    });
    return grouped;
  }

  // Fetch residents
  useEffect(() => {
    setLoadingResidents(true);
    if (user?.id) {
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr && arr.filter(r => r && r._id));
          setSelectedResident((arr && arr[0]) || null);
        })
        .catch(() => setResidents([]))
        .finally(() => setLoadingResidents(false));
    } else {
      setResidents([]);
      setLoadingResidents(false);
    }
  }, [user]);

  // Cập nhật displayDate khi visitDate thay đổi
  useEffect(() => {
    if (visitDate) {
      try {
        const date = new Date(visitDate);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          setDisplayDate(`${day}/${month}/${year}`);
        }
      } catch (error) {
        setDisplayDate('');
      }
    } else {
      setDisplayDate('');
    }
  }, [visitDate]);

  // Fetch visits (nếu API hỗ trợ lấy theo user, nên truyền userId)
  const fetchVisits = () => {
    setLoadingVisits(true);
    visitsAPI.getAll()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setVisitHistory(arr);
        console.log('DEBUG visitHistory after fetch:', arr); // Log dữ liệu thực tế
      })
      .catch(() => setVisitHistory([]))
      .finally(() => setLoadingVisits(false));
  };
  useEffect(() => {
    if (user?.id) fetchVisits();
  }, [user]);

  useEffect(() => {
    const hasModalOpen = showSuccess || showMessageModal;
    if (hasModalOpen) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showSuccess, showMessageModal]);

  const submitVisitSchedule = async () => {
    setError(null);
    if (!visitDate || !visitTime || !visitPurpose) {
      setError('Vui lòng điền đầy đủ thông tin.');
      setShowErrorModal(true);
      return;
    }
    if (visitPurpose === 'Khác' && !customPurpose.trim()) {
      setError('Vui lòng nhập lý do thăm  khi chọn "Khác".');
      setShowErrorModal(true);
      return;
    }
    if (!residents.length) {
      setError('Không có người thân nào để đặt lịch.');
      setShowErrorModal(true);
      return;
    }
    setLoading(true);
    try {
      // Kiểm tra trùng lịch cho từng resident: cùng resident_id, visit_date, visit_time
      const duplicatedNames = residents.filter(resident =>
        visitHistory.some((item) =>
          (item.resident_id === resident._id) &&
          (item.visit_date === new Date(visitDate).toISOString()) &&
          (item.visit_time === visitTime)
        )
      ).map(r => r.fullName || r.name || 'Người thân');
      if (duplicatedNames.length > 0) {
        setError(`Người thân sau đã có lịch thăm vào khung giờ này: ${duplicatedNames.join(', ')}. Vui lòng chọn thời gian khác.`);
        setShowErrorModal(true);
        setLoading(false);
        return;
      }
      const visitDateTime = new Date(`${visitDate}T${visitTime}:00`);
      const now = new Date();
      const timeDiff = visitDateTime.getTime() - now.getTime();
      const minTimeDiff = 24 * 60 * 60 * 1000; // 24 giờ
      const maxTimeDiff = 30 * 24 * 60 * 60 * 1000; // 30 ngày
      
      if (timeDiff < minTimeDiff) {
        setError('Bạn chỉ được đặt lịch trước ít nhất 24 giờ so với thời điểm hiện tại.');
        setShowErrorModal(true);
        setLoading(false);
        return;
      }
      
      if (timeDiff > maxTimeDiff) {
        setError('Bạn chỉ được đặt lịch trước tối đa 30 ngày so với thời điểm hiện tại.');
        setShowErrorModal(true);
        setLoading(false);
        return;
      }
      // Gọi API tạo lịch cho tất cả người thân
      await Promise.all(residents.map(resident => {
        if (!resident._id) return Promise.resolve(); // Bỏ qua resident không hợp lệ
        const payload = {
          resident_id: String(resident._id),
          visit_date: new Date(visitDate).toISOString(),
          visit_time: visitTime,
          purpose: visitPurpose === 'Khác' ? customPurpose.trim() : visitPurpose,
          duration: 60,
          numberOfVisitors: 1
        };
        return visitsAPI.create(payload);
      }));
      setScheduledResidents(residents.map(r => r.full_name || r.fullName || r.name || 'Người thân'));
      setShowSuccess(true);
      fetchVisits();
    } catch (err) {
      setError(String((err && (err as any).message) || err || 'Có lỗi xảy ra khi đặt lịch.'));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      

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
              onClick={() => router.push('/family/schedule-visit/history')}
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
              {residents.length === 0 && !loadingResidents && (
                <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 16 }}>
                  Không có người thân nào để đặt lịch. Vui lòng liên hệ nhân viên để được hỗ trợ thêm.
                </div>
              )}
              <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.98rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                    <CalendarDaysIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    Ngày thăm <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={displayDate}
                    onChange={e => {
                      const value = e.target.value;
                      
                      // Chỉ cho phép số và dấu /
                      const cleanValue = value.replace(/[^0-9/]/g, '');
                      
                      // Cập nhật hiển thị trực tiếp
                      setDisplayDate(cleanValue);
                      
                      // Chỉ set visitDate khi đủ 3 phần và năm có 4 chữ số
                      const parts = cleanValue.split('/');
                      if (parts.length === 3 && parts[0] && parts[1] && parts[2] && parts[2].length === 4) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        const isoDate = `${year}-${month}-${day}`;
                        setVisitDate(isoDate);
                      } else {
                        setVisitDate('');
                      }
                    }}
                    placeholder="dd/mm/yyyy"
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', fontSize: '0.98rem', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.10)'; }}
                    onBlur={e => { 
                      e.currentTarget.style.borderColor = '#e2e8f0'; 
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.07)';
                      
                      // Tự động format khi blur nếu chưa có dấu /
                      const value = displayDate;
                      if (value && !value.includes('/')) {
                        let formattedValue = value;
                        if (value.length >= 2) {
                          formattedValue = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        if (value.length >= 4) {
                          formattedValue = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
                        }
                        setDisplayDate(formattedValue);
                      }
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>Chỉ được đặt lịch trước ít nhất <b>24 giờ</b> và tối đa <b>30 ngày</b>. Thời gian thăm: <b>9:00-11:00</b> và <b>14:00-17:00</b>.</div>
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
                    onChange={e => {
                      setVisitPurpose(e.target.value);
                      if (e.target.value !== 'Khác') {
                        setCustomPurpose('');
                      }
                    }}
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
                  
                  {visitPurpose === 'Khác' && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>•</span>
                        Lý do khác <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={customPurpose}
                        onChange={e => setCustomPurpose(e.target.value)}
                        placeholder="Nhập mục đích thăm.."
                        style={{ 
                          width: '100%', 
                          padding: '0.875rem 1rem', 
                          borderRadius: '0.75rem', 
                          border: '1.5px solid #e2e8f0', 
                          fontSize: '0.95rem', 
                          transition: 'all 0.2s ease', 
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)',
                          background: 'white'
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.10)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.07)'; }}
                      />
                    </div>
                  )}
                  
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                    {visitPurpose === 'Khác' 
                      ? 'Vui lòng mô tả chi tiết lý do thăm để nhân viên chuẩn bị phù hợp.'
                      : 'Chọn đúng mục đích để nhân viên chuẩn bị tốt nhất cho chuyến thăm.'
                    }
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #bbf7d0', borderRadius: '0.75rem', padding: '1.1rem 1.5rem', marginBottom: '2rem', color: '#059669', fontWeight: 500, fontSize: '0.98rem' }}>
                <span style={{ fontWeight: 700, color: '#10b981', marginRight: 6 }}>Lưu ý:</span> Vui lòng mang theo giấy tờ tùy thân khi đến thăm. Đặt lịch trước ít nhất 24 giờ và tối đa 30 ngày. Nếu có thay đổi, hãy liên hệ nhân viên để được hỗ trợ.
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
                  disabled={!visitDate || !visitTime || !visitPurpose || (visitPurpose === 'Khác' && !customPurpose.trim()) || loading}
                  style={{ padding: '0.85rem 1.7rem', borderRadius: '0.75rem', border: 'none', background: loading ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', boxShadow: loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.13)' }}
                  onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.18)'; } }}
                  onMouseOut={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.13)'; } }}
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
              {scheduledResidents.length > 0 ? (
                <div style={{ fontSize: '1.08rem', color: '#6b7280', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
                  Đã đặt lịch thăm cho các người thân:
                  <ul style={{ margin: '0.5rem 0 0 0', padding: 0, listStyle: 'none', color: '#059669', fontWeight: 600 }}>
                    {scheduledResidents.map(name => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ fontSize: '1.08rem', color: '#6b7280', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
                  Chúng tôi sẽ xác nhận lịch hẹn với bạn trong vòng 3 đến 12 tiếng. Vui lòng kiểm tra thông báo hoặc liên hệ nhân viên nếu cần hỗ trợ thêm.
                </p>
              )}
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
      {showErrorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.25rem',
            padding: '2.2rem 2.5rem',
            minWidth: 340,
            maxWidth: 400,
            boxShadow: '0 8px 32px rgba(239,68,68,0.18)',
            border: '1.5px solid #fecaca',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ marginBottom: 18 }}>
              <XMarkIcon style={{ width: '2.2rem', height: '2.2rem', color: '#ef4444', marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#dc2626', marginBottom: 8 }}>Không thể đặt lịch!</div>
              <div style={{ color: '#991b1b', fontSize: '1rem', fontWeight: 500 }}>{error}</div>
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              style={{
                padding: '0.7rem 2.2rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #fca5a5 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(239,68,68,0.10)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #fca5a5 100%)'; }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 