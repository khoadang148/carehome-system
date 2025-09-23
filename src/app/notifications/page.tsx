'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  FunnelIcon,
  ArrowLeftIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useNotifications, Notification } from '@/lib/contexts/notification-context';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

const NotificationCard = memo(({
  notification,
  onMarkAsRead,
  onRemove,
  onNavigate
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: (notification: Notification) => void;
}) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-8 h-8 text-blue-500" />;
    }
  };

  const getNotificationBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryLabel = (category: Notification['category']) => {
    switch (category) {
      case 'hóa đơn':
        return 'hóa đơn';
      case 'health':
        return 'sức khỏe';
      case 'care':
        return 'chăm sóc';
      case 'activity':
        return 'hoạt động';
      case 'visit':
        return 'lịch thăm';
      case 'assignment':
        return 'phân công';
      case 'system':
        return 'hệ thống';
      default:
        return category;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return timestamp.toLocaleDateString('vi-VN');
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNavigate(notification);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-50 shadow-lg group transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${notification.read
          ? 'border-2 border-slate-200 opacity-60'
          : 'border-2 border-blue-300 shadow-md'
        }`}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-lg font-bold ${notification.read ? 'text-slate-700' : 'text-slate-900'
                    }`}>
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>

                <p className="text-slate-600 mb-3 leading-relaxed text-sm">
                  {notification.message}
                </p>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-medium">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getNotificationBadgeColor(notification.type)}`}>
                    {getCategoryLabel(notification.category)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {notification.actionUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-500 rounded-lg p-1.5 cursor-pointer text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
                    title="Xem chi tiết"
                  >
                    <EyeIcon className="w-3 h-3" />
                  </button>
                )}

                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="bg-gradient-to-br from-green-500 to-green-600 text-white border-2 border-green-500 rounded-lg p-1.5 cursor-pointer text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
                    title="Đánh dấu đã đọc"
                  >
                    <CheckCircleIcon className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(notification.id);
                  }}
                  className="bg-gradient-to-br from-red-500 to-red-600 text-white border-2 border-red-500 rounded-lg p-1.5 cursor-pointer text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
                  title="Xóa thông báo"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

NotificationCard.displayName = 'NotificationCard';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
      <div className="text-sm text-slate-600">
        Hiển thị {startItem}-{endItem} trong tổng số {totalItems} thông báo
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${page === currentPage
                ? 'bg-blue-500 text-white border-blue-500'
                : page === '...'
                  ? 'border-transparent text-slate-400 cursor-default'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    loading,
    hideReadNotification
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredNotifications = useMemo(() => {
    // Filter out read notifications that are older than 30 seconds
    const now = new Date();
    let filtered = notifications.filter(n => {
      if (n.read && n.readAt) {
        const timeSinceRead = now.getTime() - n.readAt.getTime();
        return timeSinceRead < 30000; // Show read notifications for 30 seconds
      }
      return true;
    });

    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (filter === 'all') {
      // For 'all' filter, show both read and unread, but prioritize unread
      filtered = filtered.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1; // Unread first
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, filter, categoryFilter, searchTerm]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, categoryFilter, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set(notifications.map(n => n.category));
    return Array.from(cats);
  }, [notifications]);

  const handleNavigate = useCallback((notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }, [router]);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
    // Hide the notification after marking as read
    hideReadNotification(id);
  }, [markAsRead, hideReadNotification]);

  const handleRemove = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  const handleClearAll = useCallback(() => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      clearAll();
    }
  }, [clearAll]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 text-xl font-medium">Đang tải thông báo...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 font-sans">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-6 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-4">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">

              <button
                onClick={() => router.push('/')}
                className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <BellIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  Thông báo
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-6 py-3 text-base font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-2xl transition-all duration-200 border-2 border-blue-200 hover:border-blue-300"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}

            <button
              onClick={handleClearAll}
              className="px-6 py-3 text-base font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all duration-200 border-2 border-red-200 hover:border-red-300"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="max-w-7xl mx-auto px-10 pb-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 text-2xl pointer-events-none z-10">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full py-3 px-12 rounded-2xl border-2 border-slate-200 text-base bg-slate-50 text-slate-700 shadow-sm outline-none font-medium tracking-wide transition-all duration-200 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
              <FunnelIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="font-bold text-gray-800 text-base tracking-tight mr-1 whitespace-nowrap">
                Lọc:
              </span>
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'Tất cả', count: notifications.length },
                  { key: 'unread', label: 'Chưa đọc', count: unreadCount },
                  { key: 'read', label: 'Đã đọc', count: notifications.length - unreadCount }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all duration-200 border-2 ${filter === key
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200'
                      }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
              <span className="font-bold text-gray-800 text-base tracking-tight mr-1 whitespace-nowrap">
                Danh mục:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-1 px-3 rounded-lg border-2 border-purple-200 text-sm bg-white text-gray-800 font-semibold min-w-28 shadow-sm outline-none transition-all duration-200 cursor-pointer focus:border-purple-500 focus:shadow-lg focus:shadow-purple-100"
              >
                <option value="all">Tất cả</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Items per page */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
              <span className="font-bold text-gray-800 text-base tracking-tight mr-1 whitespace-nowrap">
                Hiển thị:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-3 rounded-lg border-2 border-orange-200 text-sm bg-white text-gray-800 font-semibold min-w-20 shadow-sm outline-none transition-all duration-200 cursor-pointer focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-10 pb-12">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {filter === 'all' ? 'Không có thông báo' : 'Không có thông báo phù hợp'}
            </h3>
            <p className="text-slate-500 text-lg">
              {filter === 'all'
                ? 'Tất cả thông báo sẽ xuất hiện ở đây'
                : 'Thử thay đổi bộ lọc để xem thông báo khác'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onRemove={handleRemove}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredNotifications.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
