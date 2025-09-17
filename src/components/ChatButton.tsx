'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatBubbleSolid } from '@heroicons/react/24/solid';
import { messagesAPI } from '@/lib/api';

interface ChatButtonProps {
  residentId: string;
  residentName: string;
  staffId?: string;
  staffName?: string;
  onChatOpen: (
    residentId: string,
    staffId?: string,
    residentName?: string,
    staffName?: string
  ) => void;
  className?: string;
}

export default function ChatButton({
  residentId,
  residentName,
  staffId,
  staffName,
  onChatOpen,
  className = ''
}: ChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const fetchUnreadCount = async () => {
      if (!staffId) return;
      
      try {
        setIsLoading(prev => (prev ? prev : true));
        const response = await messagesAPI.getUnreadCount();
        const newCount = response.unreadCount || 0;
        
        // Trigger pulse animation if count increased
        if (newCount > prevCountRef.current) {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 1000);
        }
        
        if (isMountedRef.current) {
          if (prevCountRef.current !== newCount) {
            setUnreadCount(newCount);
            prevCountRef.current = newCount;
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 15000); // Poll every 15 seconds
        
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [staffId]);

  const handleClick = () => {
    // Luôn cho phép mở chat để giữ lịch sử, ngay cả khi không có staff assignment
    onChatOpen(residentId, staffId, residentName, staffName);
  };

  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-full
        transition-all duration-200 ease-in-out
        ${hasUnread 
          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${isPulsing ? 'animate-pulse' : ''}
        ${className}
      `}
      title={staffId 
        ? `Chat với ${staffName || 'nhân viên'} phụ trách ${residentName}${hasUnread ? ` (${unreadCount} tin nhắn mới)` : ''}`
        : `Chat với ${residentName}${hasUnread ? ` (${unreadCount} tin nhắn mới)` : ''} - Lịch sử chat được giữ lại`
      }
    >
      {hasUnread ? (
        <ChatBubbleSolid className="w-5 h-5" />
      ) : (
        <ChatBubbleLeftRightIcon className="w-5 h-5" />
      )}
      
      {hasUnread && (
        <span className={`
          absolute -top-1 -right-1 
          bg-red-500 text-white text-xs 
          rounded-full min-w-[18px] h-[18px] 
          flex items-center justify-center
          font-medium shadow-md
          ${isPulsing ? 'animate-bounce' : ''}
        `}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
}
