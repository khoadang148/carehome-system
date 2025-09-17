"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatBubbleSolid } from '@heroicons/react/24/solid';
import { messagesAPI } from '@/lib/api';
import { useChat } from '@/lib/contexts/chat-provider';

interface StaffChatButtonProps {
  familyMemberId: string;
  familyMemberName: string;
  onChatOpen: (familyMemberId: string, familyMemberName: string, 
    residentId?: string, residentName?: string) => void;
  residentId?: string, 
  residentName?: string;
  className?: string;
}

export default function StaffChatButton({
  familyMemberId,
  familyMemberName,
  residentId,
  residentName,
  onChatOpen,
  className = ""
}: StaffChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const { chatState } = useChat();
  const prevCountRef = useRef(0);

  useEffect(() => {
    let isFetching = false;
    const fetchUnreadCount = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const response = await messagesAPI.getUnreadCount();
        const newCount = response.unreadCount || 0;
        
        // Trigger pulse animation if count increased
        if (newCount > prevCountRef.current) {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 1000);
        }
        
        if (typeof newCount === 'number') {
          setUnreadCount(newCount);
          prevCountRef.current = newCount;
        }
      } catch (error) {
        // Silent error handling
      } finally {
        isFetching = false;
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [familyMemberId]);

  const handleClick = () => {
    onChatOpen(familyMemberId, familyMemberName, residentId, residentName);
  };

  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={handleClick}
      className={`
        relative p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 
        text-white hover:from-blue-600 hover:to-blue-700 
        transition-all duration-200 shadow-lg hover:shadow-xl
        ${isPulsing ? 'animate-pulse' : ''}
        ${className}
      `}
      title={`Chat với ${familyMemberName}${residentName ? ` về ${residentName}` : ''}${hasUnread ? ` (${unreadCount} tin nhắn mới)` : ''}`}
    >
      {hasUnread ? (
        <ChatBubbleSolid className="w-4 h-4" />
      ) : (
        <ChatBubbleLeftRightIcon className="w-4 h-4" />
      )}
      {unreadCount > 0 && (
        <span className={`
          absolute -top-1 -right-1 bg-red-500 text-white text-xs 
          rounded-full min-w-[16px] h-4 flex items-center justify-center 
          font-bold shadow-md
          ${isPulsing ? 'animate-bounce' : ''}
        `}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
