'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useNotifications, Notification } from '@/lib/contexts/notification-context';
import './notification-bell.css';

interface NotificationBellProps {
  variant?: 'light' | 'dark';
}

const NotificationBell = memo(({ variant = 'light' }: NotificationBellProps) => {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    loading 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    setIsOpen(false);
  }, [markAsRead, router]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleRemoveNotification = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeNotification(id);
  }, [removeNotification]);

  const handleBellClick = useCallback((e: React.MouseEvent) => {
    setIsOpen(!isOpen);
    
    // Add ripple effect
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rippleId = Date.now();
      
      setRipples(prev => [...prev, { id: rippleId, x, y }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== rippleId));
      }, 600);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
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

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <div className="relative notification-bell-container">
        <button
          ref={buttonRef}
          onClick={handleBellClick}
          className={`relative p-3 rounded-full transition-all duration-300 group ${
            unreadCount > 0 
              ? variant === 'dark'
                ? 'text-white hover:text-red-200 hover:bg-white/20 notification-bell-glow-dark'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50 notification-bell-glow'
              : variant === 'dark'
                ? 'text-white hover:text-gray-200 hover:bg-white/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Thông báo"
        >
          {/* Ripple effects */}
          {ripples.map(ripple => (
            <div
              key={ripple.id}
              className="notification-ripple"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20
              }}
            />
          ))}
          
          <BellIcon className={`w-7 h-7 transition-all duration-300 ${
            unreadCount > 0 
              ? unreadCount > 5 
                ? 'notification-bell-shake' 
                : 'notification-bell-bounce-enhanced'
              : ''
          }`} />
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg notification-badge-pulse border-2 border-white z-10 ${
              unreadCount > 9 
                ? 'min-w-[24px] h-6 px-1.5 text-xs' 
                : 'min-w-[20px] h-5 px-1 text-xs'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Enhanced Hover Effect */}
          <div className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 ${
            unreadCount > 0 
              ? 'bg-gradient-to-r from-red-100 to-red-200 group-hover:opacity-30' 
              : 'bg-gray-200 group-hover:opacity-20'
          }`} />
          
          {/* Glow Effect for Unread Notifications */}
          {unreadCount > 0 && (
            <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 blur-md animate-ping" />
          )}
        </button>
        
        {/* Rotating Glow Ring */}
        {unreadCount > 0 && (
          <div className="notification-glow-ring" />
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <BellIcon className={`w-6 h-6 ${unreadCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                {unreadCount > 0 && (
                  <div className="absolute inset-0 bg-red-400 opacity-20 blur-sm rounded-full" />
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-3 py-1 rounded-full font-bold shadow-md border border-red-300">
                  {unreadCount}
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Đang tải thông báo...</p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Không có thông báo</p>
                  <p className="text-sm text-gray-400 mt-1">Tất cả thông báo sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                <div>
                  {/* Unread Notifications */}
                  {unreadNotifications.length > 0 && (
                    <div className="p-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                        Chưa đọc ({unreadNotifications.length})
                      </h4>
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                          onRemove={(e) => handleRemoveNotification(e, notification.id)}
                          formatTimeAgo={formatTimeAgo}
                          getNotificationIcon={getNotificationIcon}
                          getNotificationBadgeColor={getNotificationBadgeColor}
                          getCategoryLabel={getCategoryLabel}
                          isUnread={true}
                        />
                      ))}
                    </div>
                  )}

                  {/* Read Notifications */}
                  {readNotifications.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                        Đã đọc ({readNotifications.length})
                      </h4>
                      {readNotifications.slice(0, 5).map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                          onRemove={(e) => handleRemoveNotification(e, notification.id)}
                          formatTimeAgo={formatTimeAgo}
                          getNotificationIcon={getNotificationIcon}
                          getNotificationBadgeColor={getNotificationBadgeColor}
                          getCategoryLabel={getCategoryLabel}
                          isUnread={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Tổng cộng {notifications.length} thông báo
                </span>
                <button
                  onClick={() => router.push('/notifications')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  formatTimeAgo: (timestamp: Date) => string;
  getNotificationIcon: (type: Notification['type']) => React.ReactNode;
  getNotificationBadgeColor: (type: Notification['type']) => string;
  getCategoryLabel: (category: Notification['category']) => string;
  isUnread: boolean;
}

const NotificationItem = memo(({
  notification,
  onClick,
  onRemove,
  formatTimeAgo,
  getNotificationIcon,
  getNotificationBadgeColor,
  getCategoryLabel,
  isUnread
}: NotificationItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200 border-l-4 ${
        isUnread 
          ? 'border-blue-500 bg-blue-50/50' 
          : 'border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isUnread ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(notification.timestamp)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${getNotificationBadgeColor(notification.type)}`}>
                  {getCategoryLabel(notification.category)}
                </span>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={onRemove}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Xóa thông báo"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationBell;
