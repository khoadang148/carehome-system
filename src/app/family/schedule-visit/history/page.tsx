"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon, ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { visitsAPI, residentAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

export default function VisitHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (user?.id) {
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr && arr.filter(r => r && r._id));
        })
        .catch(() => setResidents([]));
    } else {
      setResidents([]);
    }
  }, [user]);

  // Fetch visits
  useEffect(() => {
    setLoading(true);
    visitsAPI.getAll()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setVisitHistory(arr);
      })
      .catch(() => setVisitHistory([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải lịch sử thăm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          {/* Trái: Nút quay lại + Icon + Tiêu đề */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push('/family/schedule-visit')}
              title="Quay lại"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 15px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                color: '#64748b',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#475569';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <ArrowLeftIcon style={{ width: 20, height: 20 }} />
              <span></span>
            </button>
            
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  Lịch sử đặt lịch thăm
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Theo dõi các lịch hẹn thăm viếng đã đặt
                </span>
              </div>
            </div>
          </div>

          {/* Phải: Để trống hoặc có thể thêm thông tin khác */}
          <div className="flex items-center justify-end">
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Danh sách lịch hẹn</h3>
                <p className="text-green-100">Tổng cộng có {groupVisitHistory([...visitHistory], residents).length} lịch hẹn đã được tạo</p>
              </div>
            </div>
          </div>

          {/* Chú thích màu sắc */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-b border-green-100">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Lịch thăm đã qua</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Lịch thăm hôm nay</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Lịch thăm sắp tới</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
                             <thead>
                 <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ngày thăm</th>
                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mục đích</th>
                 </tr>
               </thead>
              <tbody>
                {groupVisitHistory([...visitHistory], residents)
                  .sort((a, b) => {
                    if (a.date < b.date) return 1;
                    if (a.date > b.date) return -1;
                    const aStart = a.time.split(' - ')[0];
                    const bStart = b.time.split(' - ')[0];
                    return aStart < bStart ? 1 : aStart > bStart ? -1 : 0;
                  })
                  .map((item) => {
                    const status = getVisitStatus(item.date, item.time);
                    const getStatusStyle = () => {
                      switch (status) {
                        case 'past':
                          return 'bg-gray-50 border-l-4 border-gray-500 text-gray-600';
                        case 'today':
                          return 'bg-red-50 border-l-4 border-red-500 text-red-700';
                        case 'future':
                          return 'bg-green-50 border-l-4 border-green-500 text-green-700';
                        default:
                          return 'bg-transparent border-l-4 border-gray-300 text-gray-600';
                      }
                    };
                    
                    return (
                      <tr key={item.key} className={`border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 ${getStatusStyle()}`}>
                        <td className="px-6 py-4 text-sm font-medium">
                          {item.date ? (() => {
                            try {
                              const date = new Date(item.date);
                              if (isNaN(date.getTime())) return 'N/A';
                              const day = date.getDate().toString().padStart(2, '0');
                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                              const year = date.getFullYear();
                              return `${day}/${month}/${year}`;
                            } catch (error) {
                              return 'N/A';
                            }
                          })() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {getTimeRange(item.time)}
                        </td>
                                                 <td className="px-6 py-4 text-sm">
                           {item.purpose}
                         </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {groupVisitHistory([...visitHistory], residents).length === 0 && (
            <div className="text-center py-12">
              <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
              <p className="text-gray-500 mb-6">Bạn chưa đặt lịch thăm nào. Hãy đặt lịch thăm đầu tiên!</p>
              <button
                onClick={() => router.push('/family/schedule-visit')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold"
              >
                Đặt lịch thăm mới
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 