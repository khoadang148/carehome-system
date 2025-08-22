"use client";

import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useChat } from '@/lib/contexts/chat-provider';
import { messagesAPI } from '@/lib/api';

interface StaffChatButtonProps {
  familyMemberId: string;
  familyMemberName: string;
  residentId?: string;
  residentName?: string;
  onChatOpen: (familyMemberId: string, familyMemberName: string, residentId?: string, residentName?: string) => void;
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
  const { chatState } = useChat();

  // Fetch unread count for this family member
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await messagesAPI.getUnreadCount();
        // This would need to be adjusted based on how the backend returns per-conversation counts
        // For now, we'll use the total unread count
        if (typeof response.count === 'number') {
          setUnreadCount(response.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [familyMemberId]);

  const handleClick = () => {
    onChatOpen(familyMemberId, familyMemberName, residentId, residentName);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl ${className}`}
      title={`Chat với ${familyMemberName}${residentName ? ` về ${residentName}` : ''}`}
    >
      <ChatBubbleLeftRightIcon className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
