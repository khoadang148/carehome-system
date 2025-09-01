 'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useChat } from '@/lib/contexts/chat-provider';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { messagesAPI } from '@/lib/api';
import './chat-widget.css';

interface ChatFloatingButtonProps {
  unreadCount?: number;
}

export default function ChatFloatingButton({ unreadCount = 0 }: ChatFloatingButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  // Temporarily comment out useChat to debug
  // const { chatState } = useChat();
  const [isVisible, setIsVisible] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [actualUnreadCount, setActualUnreadCount] = useState(0);
  const isDraggingRef = useRef(false);
  const movedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use actual unread count from API, fallback to props
  const totalUnread = actualUnreadCount || unreadCount;

  useEffect(() => {
    // Simple logic: show for family and staff, hide only on messages pages and auth pages
    const shouldShow = Boolean(user && 
      (user.role === 'family' || user.role === 'staff') && 
      !pathname.includes('/messages') &&
      !pathname.includes('/login') &&
      !pathname.includes('/register'));
    
    // Debug logging
    console.log('ChatFloatingButton Debug:', {
      user: user ? { id: user.id, role: user.role } : null,
      pathname,
      shouldShow,
      isOnMessagesPage: pathname.includes('/messages'),
      isOnAuthPage: pathname.includes('/login') || pathname.includes('/register')
    });
    
    setIsVisible(shouldShow);
  }, [user, pathname]);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      
      try {
        const response = await messagesAPI.getUnreadCount();
        const newCount = response.unreadCount || 0;
        setActualUnreadCount(newCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (totalUnread && totalUnread > 0) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [totalUnread]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('chat_fab_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed?.x === 'number' &&
          typeof parsed?.y === 'number'
        ) {
          setPosition({ x: parsed.x, y: parsed.y });
          return;
        }
      }
    } catch {}

    const margin = 24;
    const size = 56;
    const x = window.innerWidth - size - margin;
    const y = window.innerHeight - size - margin;
    setPosition({ x, y });
  }, []);

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!position) return;
    e.preventDefault();
    isDraggingRef.current = true;
    movedRef.current = false;

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const offsetX = startX - position.x;
    const offsetY = startY - position.y;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const clientX = (ev as TouchEvent).touches
        ? (ev as TouchEvent).touches[0].clientX
        : (ev as MouseEvent).clientX;
      const clientY = (ev as TouchEvent).touches
        ? (ev as TouchEvent).touches[0].clientY
        : (ev as MouseEvent).clientY;
      const size = 56;
      const margin = 8;
      const newX = clamp(clientX - offsetX, margin, window.innerWidth - size - margin);
      const newY = clamp(clientY - offsetY, margin, window.innerHeight - size - margin);
      if (Math.abs(newX - position.x) > 2 || Math.abs(newY - position.y) > 2) {
        movedRef.current = true;
      }
      setPosition({ x: newX, y: newY });
    };

    const endDrag = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMove as any);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', endDrag);
      try {
        const pos = position || { x: 0, y: 0 };
        localStorage.setItem('chat_fab_pos', JSON.stringify(pos));
      } catch {}
    };

    window.addEventListener('mousemove', onMove as any);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onMove as any, { passive: false });
    window.addEventListener('touchend', endDrag);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current || movedRef.current) {
      e.preventDefault();
      return;
    }
    const messagesPath = user?.role === 'staff' ? '/staff/messages' : '/family/messages';
    router.push(messagesPath);
  };

  if (!isVisible) return null;

  if (!position) return null;

  return (
    <div className="fixed z-[9999]" style={{ left: position.x, top: position.y }}>
      <button
        onClick={handleClick}
        className="relative group fab-hover"
        aria-label="Mở tin nhắn"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        ref={buttonRef}
      >
        <div className={`w-12 h-12 md:w-14 md:h-14 bg-neutral-900 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 flex items-center justify-center group-hover:scale-110 group-active:scale-95 fab-float ${isBumping ? 'fab-bounce' : ''}`}>
          <ChatBubbleLeftRightIcon className="w-5 h-5 md:w-6 md:h-6 text-white transition-transform duration-200 group-hover:rotate-12" />
        </div>

        {totalUnread > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold shadow-md badge-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}

        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap transform translate-y-2 group-hover:translate-y-0">
          {totalUnread > 0 ? `${totalUnread} tin nhắn chưa đọc` : 'Trò chuyện'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>

        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150"></div>
      </button>
    </div>
  );
}
