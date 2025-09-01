"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon, ClockIcon, HeartIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ClockIcon as HistoryIcon } from '@heroicons/react/24/solid';
import { residentAPI, visitsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import VisitSuccessModal from '@/components/VisitSuccessModal';
import VisitErrorModal from '@/components/VisitErrorModal';

export default function ScheduleVisitPage() {
  const router = useRouter();
  const { user } = useAuth();


  const [residents, setResidents] = useState<any[]>([]);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scheduledResidents, setScheduledResidents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);

  function getTimeRange(startTime: string) {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = hour + 1;
    return `${startTime} - ${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    setLoadingResidents(true);
    if (user?.id) {
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          const activeResidents = arr && arr.filter(r => r && r._id && r.status === 'active');
          setResidents(activeResidents);
        })
        .catch(() => setResidents([]))
        .finally(() => setLoadingResidents(false));
    } else {
      setResidents([]);
      setLoadingResidents(false);
    }
  }, [user]);

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

  const fetchVisits = () => {
    setLoadingVisits(true);
    visitsAPI.getAll()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setVisitHistory(arr);

      })
      .catch(() => setVisitHistory([]))
      .finally(() => setLoadingVisits(false));
  };
  useEffect(() => {
    if (user?.id) fetchVisits();
  }, [user]);

  useEffect(() => {
    const hasModalOpen = showSuccessModal;
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
  }, [showSuccessModal]);

  const submitVisitSchedule = async () => {
    setError(null);

    if (!visitDate || !visitTime || !visitPurpose) {
      setError('Vui lòng điền đầy đủ thông tin.');
      setShowErrorModal(true);
      return;
    }
    if (visitPurpose === 'Khác' && !customPurpose.trim()) {
      setError('Vui lòng nhập lý do thăm khi chọn "Khác".');
      setShowErrorModal(true);
      return;
    }
    if (!residents.length) {
      setError('Không có người thân nào đang ở viện để đặt lịch thăm. Chỉ có thể đặt lịch thăm cho người thân chưa xuất viện.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const visitDateTime = new Date(`${visitDate}T${visitTime}:00`);
      const now = new Date();
      const timeDiff = visitDateTime.getTime() - now.getTime();
      const minTimeDiff = 24 * 60 * 60 * 1000;
      const maxTimeDiff = 30 * 24 * 60 * 60 * 1000;

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

      if (visitHistory.length > 0) {
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
      }

      const residentIds = residents.filter(resident => resident._id).map(r => String(r._id));
      const payload = {
        resident_ids: residentIds,
        visit_date: new Date(visitDate).toISOString(),
        visit_time: visitTime,
        purpose: visitPurpose === 'Khác' ? customPurpose.trim() : visitPurpose,
        duration: 60,
        numberOfVisitors: 1
      };

      const result = await visitsAPI.createMultiple(payload);

      if (result && result.isDuplicate === true) {
        setError(result.message || 'Đã có lịch thăm trùng thời gian. Vui lòng chọn thời điểm khác.');
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      const successfulResidents = residents.map(r => r.full_name || r.fullName || r.name || 'Người thân');
      setScheduledResidents(successfulResidents);
      setShowSuccessModal(true);

      setTimeout(() => fetchVisits(), 100);

    } catch (err) {
      setError(String((err && (err as any).message) || err || 'Có lỗi xảy ra khi đặt lịch.'));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-8">
      <div className="flex gap-7 bg-white rounded-3xl shadow-xl p-10 max-w-4xl w-full items-start relative">

        <div className="flex-2 min-w-80">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CalendarDaysIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold m-0 text-emerald-600 tracking-tight">Đặt lịch thăm người thân</h2>
                <div className="text-sm text-slate-500 mt-1">Vui lòng điền đầy đủ thông tin để đặt lịch thăm viếng</div>
              </div>
            </div>


            <button
              onClick={() => router.push('/family/schedule-visit/history')}
              className="px-4 py-2 rounded-full border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600 font-bold text-base cursor-pointer shadow-lg transition-all duration-200 flex items-center gap-2 ml-4 hover:from-emerald-100 hover:to-emerald-200"
            >
              <HistoryIcon className="w-4 h-4 text-emerald-600" />
              Lịch sử thăm
            </button>
          </div>
          {!showSuccessModal ? (
            <>
              {residents.length === 0 && !loadingResidents && (
                <div className="text-red-500 font-semibold mb-4">
                  Không có người thân nào đang ở viện để đặt lịch thăm. Chỉ có thể đặt lịch thăm cho người thân chưa xuất viện. Vui lòng liên hệ nhân viên nếu cần hỗ trợ thêm.
                </div>
              )}
              <div className="grid gap-6 mb-6">
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">
                    <CalendarDaysIcon className="w-4 h-4 text-emerald-500" />
                    Ngày thăm <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayDate}
                      onChange={e => {
                        const value = e.target.value;
                        const cleanValue = value.replace(/[^0-9/]/g, '');
                        setDisplayDate(cleanValue);

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
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 text-base transition-all duration-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none"
                      onBlur={e => {
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
                    <input
                      type="date"
                      ref={datePickerRef}
                      value={visitDate}
                      onChange={e => {
                        const selectedDate = e.target.value;
                        setVisitDate(selectedDate);
                        if (selectedDate) {
                          const date = new Date(selectedDate);
                          const day = date.getDate().toString().padStart(2, '0');
                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                          const year = date.getFullYear();
                          setDisplayDate(`${day}/${month}/${year}`);
                        }
                      }}
                      min={(() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return tomorrow.toISOString().split('T')[0];
                      })()}
                      max={(() => {
                        const maxDate = new Date();
                        maxDate.setDate(maxDate.getDate() + 30);
                        return maxDate.toISOString().split('T')[0];
                      })()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => datePickerRef.current?.showPicker?.() || datePickerRef.current?.click?.()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500 hover:text-emerald-600 cursor-pointer transition-colors duration-200"
                    >
                      <CalendarDaysIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Chỉ được đặt lịch trước ít nhất <b>24 giờ</b> và tối đa <b>30 ngày</b>. Thời gian thăm: <b>9:00-11:00</b> và <b>14:00-17:00</b>.</div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">
                    <ClockIcon className="w-4 h-4 text-emerald-500" />
                    Giờ thăm <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={visitTime}
                    onChange={e => setVisitTime(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base bg-white transition-all duration-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none"
                  >
                    <option value="">Chọn giờ thăm...</option>
                    <option value="09:00">09:00 - 10:00</option>
                    <option value="10:00">10:00 - 11:00</option>
                    <option value="14:00">14:00 - 15:00</option>
                    <option value="15:00">15:00 - 16:00</option>
                    <option value="16:00">16:00 - 17:00</option>
                  </select>
                  <div className="text-sm text-gray-500 mt-1">Mỗi lần thăm kéo dài <b>1 giờ</b>. Vui lòng đến đúng giờ đã chọn. Lưu ý: Thời gian nghỉ trưa là 12h đến 13h</div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">
                    <HeartIcon className="w-4 h-4 text-emerald-500" />
                    Mục đích thăm <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={visitPurpose}
                    onChange={e => {
                      setVisitPurpose(e.target.value);
                      if (e.target.value !== 'Khác') {
                        setCustomPurpose('');
                      }
                    }}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base bg-white transition-all duration-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none"
                  >
                    <option value="">Chọn mục đích...</option>
                    <option value="Thăm hỏi sức khỏe">Thăm hỏi sức khỏe</option>
                    <option value="Sinh nhật">Chúc mừng sinh nhật</option>
                    <option value="Mang quà">Mang quà và thức ăn</option>
                    <option value="Tham gia hoạt động">Tham gia hoạt động</option>
                    <option value="Khác">Khác</option>
                  </select>

                  {visitPurpose === 'Khác' && (
                    <div className="mt-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <span className="text-red-500 text-xs">•</span>
                        Lý do khác <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={customPurpose}
                        onChange={e => setCustomPurpose(e.target.value)}
                        placeholder="Nhập mục đích thăm.."
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm transition-all duration-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none bg-white"
                      />
                    </div>
                  )}

                  <div className="text-sm text-gray-500 mt-1">
                    {visitPurpose === 'Khác'
                      ? 'Vui lòng mô tả chi tiết lý do thăm để nhân viên chuẩn bị phù hợp.'
                      : 'Chọn đúng mục đích để nhân viên chuẩn bị tốt nhất cho chuyến thăm.'
                    }
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-8 text-emerald-600 font-medium text-base">
                <span className="font-bold text-emerald-500 mr-2">Lưu ý:</span> Vui lòng mang theo giấy tờ tùy thân khi đến thăm. Đặt lịch trước ít nhất 24 giờ và tối đa 30 ngày. Chỉ có thể đặt lịch thăm cho người thân chưa xuất viện. Nếu có thay đổi, hãy liên hệ nhân viên để được hỗ trợ.
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => router.back()}
                  className="px-7 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 cursor-pointer font-semibold text-base transition-all duration-200 shadow-sm hover:bg-gray-50 hover:border-gray-300"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={submitVisitSchedule}
                  disabled={!visitDate || !visitTime || !visitPurpose || (visitPurpose === 'Khác' && !customPurpose.trim()) || loading}
                  className={`px-7 py-3.5 rounded-xl border-none text-white font-bold text-base flex items-center gap-2 transition-all duration-200 ${loading
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Đặt lịch
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 m-0 mb-4">Đã đặt lịch thăm thành công!</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Chúng tôi sẽ xác nhận lịch hẹn với bạn trong vòng 3 đến 12 tiếng. Vui lòng kiểm tra thông báo hoặc liên hệ nhân viên nếu cần hỗ trợ thêm.
              </p>
              <button
                onClick={() => router.push('/family')}
                className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 min-w-32"
              >
                Quay lại trang chính
              </button>
            </div>
          )}
        </div>
      </div>


      <VisitSuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);

          setVisitDate('');
          setVisitTime('');
          setVisitPurpose('');
          setCustomPurpose('');
          setDisplayDate('');
        }}
        scheduledResidents={scheduledResidents}
      />
      <VisitErrorModal
        open={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setError(null);
        }}
        title="Không thể đặt lịch!"
        message={error || 'Có lỗi xảy ra khi đặt lịch.'}
        type="error"
      />
    </div>
  );
} 