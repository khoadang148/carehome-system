'use client';

import React, { useState, useEffect } from 'react';
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

  // Fetch unread count for this conversation
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!staffId) return;
      
      try {
        setIsLoading(true);
        const response = await messagesAPI.getUnreadCount();
        // For now, we'll use the total unread count
        // In a real implementation, you'd filter by conversation
        setUnreadCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();
    
    // Set up polling for unread count updates
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [staffId]);

  const handleClick = () => {
    // Pass resident and staff names so the chat modal has full header info immediately
    onChatOpen(residentId, staffId, residentName, staffName);
  };

  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={handleClick}
      disabled={!staffId || isLoading}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-full
        transition-all duration-200 ease-in-out
        ${hasUnread 
          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
        }
        ${!staffId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${className}
      `}
      title={staffId 
        ? `Chat với ${staffName || 'nhân viên'} phụ trách ${residentName}`
        : 'Chưa có nhân viên được phân công'
      }
    >
      {hasUnread ? (
        <ChatBubbleSolid className="w-5 h-5" />
      ) : (
        <ChatBubbleLeftRightIcon className="w-5 h-5" />
      )}
      
      {/* Unread badge */}
      {hasUnread && (
        <span className="
          absolute -top-1 -right-1 
          bg-red-500 text-white text-xs 
          rounded-full min-w-[18px] h-[18px] 
          flex items-center justify-center
          font-medium
        ">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
}
