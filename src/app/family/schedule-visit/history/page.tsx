"use client";
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { visitsAPI, residentAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { useOptimizedData } from '@/hooks/useOptimizedData';

const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Đang tải lịch sử thăm...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const VisitHistoryTable = memo(({ visitHistory, residents, currentPage, itemsPerPage, isExpanded }: {
  visitHistory: any[];
  residents: any[];
  currentPage: number;
  itemsPerPage: number;
  isExpanded: boolean;
}) => {
  const getTimeRange = useCallback((startTime: string) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = hour + 1;
    return `${startTime} - ${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }, []);

  const getVisitStatus = useCallback((date: string, time: string) => {
    if (!date || !time) return 'unknown';

    const visitDate = new Date(date);
    const now = new Date();

    const visitDay = visitDate.getDate();
    const visitMonth = visitDate.getMonth();
    const visitYear = visitDate.getFullYear();

    const nowDay = now.getDate();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    if (
      visitYear < nowYear ||
      (visitYear === nowYear && visitMonth < nowMonth) ||
      (visitYear === nowYear && visitMonth === nowMonth && visitDay < nowDay)
    ) {
      return 'past';
    } else if (
      visitYear === nowYear &&
      visitMonth === nowMonth &&
      visitDay === nowDay
    ) {
      return 'today';
    } else {
      return 'future';
    }
  }, []);

  const groupVisitHistory = useCallback((history: any[], residents: any[]) => {
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
      let residentName = 'Chưa hoàn tất đăng kí';
      if (item.resident_id) {
        const found = residents.find(r => r._id === item.resident_id);
        residentName = found?.full_name || found?.fullName || found?.name || 'Chưa hoàn tất đăng kí';
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
  }, []);

  const sortedHistory = useMemo(() => {
    return groupVisitHistory([...visitHistory], residents)
      .sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        const aStart = a.time.split(' - ')[0];
        const bStart = b.time.split(' - ')[0];
        return aStart < bStart ? 1 : aStart > bStart ? -1 : 0;
      });
  }, [visitHistory, residents, groupVisitHistory]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = isExpanded ? sortedHistory.length : startIndex + itemsPerPage;
  const displayedHistory = useMemo(() =>
    sortedHistory.slice(startIndex, endIndex),
    [sortedHistory, startIndex, endIndex]
  );

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  }, []);

  const getStatusStyle = useCallback((status: string) => {
    switch (status) {
      case 'past':
        return 'bg-gray-50 border-l-4 border-gray-500 text-gray-600';
      case 'today':
        return 'bg-red-50 border-l-4 border-red-500 text-red-700';
      case 'future':
        return 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700';
      default:
        return 'bg-transparent border-l-4 border-gray-300 text-gray-600';
    }
  }, []);

  return (
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
          {displayedHistory.map((item) => {
            const status = getVisitStatus(item.date, item.time);
            return (
              <tr key={item.key} className={`border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 ${getStatusStyle(status)}`}>
                <td className="px-6 py-4 text-sm font-medium">
                  {formatDate(item.date)}
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
  );
});

VisitHistoryTable.displayName = 'VisitHistoryTable';

const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
  isExpanded,
  startIndex,
  endIndex,
  totalItems
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isExpanded: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600">
          Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} trong tổng số {totalItems} lịch hẹn
        </div>

        {!isExpanded && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>

            <span className="text-sm text-gray-600 px-2">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

const EmptyState = memo(({ onNavigate }: { onNavigate: () => void }) => (
  <div className="text-center py-12">
    <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
    <p className="text-gray-500 mb-6">Bạn chưa đặt lịch thăm nào. Hãy đặt lịch thăm đầu tiên!</p>
    <button
      onClick={onNavigate}
      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold"
    >
      Đặt lịch thăm mới
    </button>
  </div>
));

EmptyState.displayName = 'EmptyState';

export default function VisitHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: residents, loading: residentsLoading } = useOptimizedData(
    'residents-family',
    () => user?.id ? residentAPI.getByFamilyMemberId(user.id) : Promise.resolve([]),
    {
      ttl: 5 * 60 * 1000,
      prefetch: !!user?.id,
      prefetchDelay: 100
    }
  );

  const { data: visitHistory, loading: visitsLoading } = useOptimizedData(
    'visit-history',
    () => user?.id ? visitsAPI.getByFamily(user.id) : Promise.resolve([]),
    {
      ttl: 2 * 60 * 1000,
      prefetch: !!user?.id,
      prefetchDelay: 200
    }
  );

  const loading = residentsLoading || visitsLoading;

  const residentsArray = useMemo(() => {
    if (!residents) return [];
    const arr = Array.isArray(residents) ? residents : [residents];
    return arr.filter(r => r && r._id);
  }, [residents]);

  const visitHistoryArray = useMemo(() => {
    if (!visitHistory) return [];
    return Array.isArray(visitHistory) ? visitHistory : [];
  }, [visitHistory]);

  const groupVisitHistory = useCallback((history: any[], residents: any[]) => {
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
      let residentName = 'Chưa hoàn tất đăng kí';
      if (item.resident_id) {
        const found = residents.find(r => r._id === item.resident_id);
        residentName = found?.full_name || found?.fullName || found?.name || 'Chưa hoàn tất đăng kí';
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
  }, []);

  const sortedHistory = useMemo(() => {
    return groupVisitHistory([...visitHistoryArray], residentsArray)
      .sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        const aStart = a.time.split(' - ')[0];
        const bStart = b.time.split(' - ')[0];
        return aStart < bStart ? 1 : aStart > bStart ? -1 : 0;
      });
  }, [visitHistoryArray, residentsArray, groupVisitHistory]);

  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = isExpanded ? sortedHistory.length : startIndex + itemsPerPage;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleNavigateToSchedule = useCallback(() => {
    router.push('/family/schedule-visit');
  }, [router]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedHistory.length]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>

            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  Lịch sử đặt lịch thăm
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Theo dõi các lịch hẹn thăm viếng đã đặt
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Danh sách lịch hẹn</h3>
                <p className="text-emerald-100">Tổng cộng có {sortedHistory.length} lịch hẹn đã được tạo</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 border-b border-emerald-200">
            <div className="flex flex-wrap gap-6 items-center justify-between">
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
                  <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Lịch thăm sắp tới</span>
                </div>
              </div>
            </div>
          </div>

          <VisitHistoryTable
            visitHistory={visitHistoryArray}
            residents={residentsArray}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            isExpanded={isExpanded}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isExpanded={isExpanded}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={sortedHistory.length}
          />

          {sortedHistory.length === 0 && (
            <EmptyState onNavigate={handleNavigateToSchedule} />
          )}
        </div>
      </div>
    </div>
  );
} 