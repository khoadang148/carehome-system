'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { messagesAPI, staffAssignmentsAPI } from '@/lib/api';

interface ChatState {
  isOpen: boolean;
  currentResidentId: string | null;
  currentStaffId: string | null;
  currentResidentName: string;
  currentStaffName: string;
  totalUnread: number;
  unreadCounts: Record<string, number>;
}

interface ChatContextType {
  chatState: ChatState;
  
  openChat: (
    residentId: string,
    staffId?: string,
    residentName?: string,
    staffName?: string
  ) => void;
  closeChat: () => void;
  updateUnreadCount: (residentId: string, count: number) => void;
  
  getStaffForResident: (residentId: string) => Promise<{ staffId: string; staffName: string } | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    currentResidentId: null,
    currentStaffId: null,
    currentResidentName: '',
    currentStaffName: '',
    totalUnread: 0,
    unreadCounts: {}
  });

  const getStaffForResident = async (residentId: string) => {
    try {
      const assignments = await staffAssignmentsAPI.getByResident(residentId);
      
      if (!assignments || !Array.isArray(assignments)) {
        return null;
      }
      
      // Ưu tiên tìm staff assignment đang active
      const activeAssignment = assignments.find((assignment: any) => 
        assignment.status === 'active' && 
        (!assignment.end_date || new Date(assignment.end_date) > new Date())
      );
      
      if (activeAssignment) {
        return {
          staffId: activeAssignment.staff_id?._id || activeAssignment.staff_id,
          staffName: activeAssignment.staff_name || activeAssignment.staff_id?.full_name || 'Nhân viên'
        };
      }
      
      // Nếu không có assignment active, tìm assignment gần nhất để giữ lịch sử chat
      const recentAssignment = assignments
        .filter((assignment: any) => assignment.staff_id)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.assigned_date || a.createdAt || 0);
          const dateB = new Date(b.assigned_date || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        })[0];
      
      if (recentAssignment) {
        return {
          staffId: recentAssignment.staff_id?._id || recentAssignment.staff_id,
          staffName: recentAssignment.staff_name || recentAssignment.staff_id?.full_name || 'Nhân viên (trước đây)'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Error getting staff for resident:', error);
      return null;
    }
  };

  const openChat = async (
    residentId: string,
    staffId?: string,
    residentName: string = 'Resident',
    staffName: string = 'Staff'
  ) => {
    let finalStaffId = staffId;
    let finalStaffName = staffName;

    if (!finalStaffId) {
      const staffInfo = await getStaffForResident(residentId);
      if (staffInfo) {
        finalStaffId = staffInfo.staffId;
        finalStaffName = staffInfo.staffName;
      }
    }

    // Nếu có staffId nhưng không có tên, thử lấy tên từ assignment
    if (finalStaffId && !finalStaffName) {
      try {
        const assignments = await staffAssignmentsAPI.getByResident(residentId);
        const assignment = assignments.find((a: any) => 
          a.staff_id === finalStaffId || a.staff_id?._id === finalStaffId
        );
        if (assignment) {
          finalStaffName = assignment.staff_name || 'Nhân viên';
        }
      } catch (error) {
        // Ignore error, use default name
      }
    }

    setChatState(prev => ({
      ...prev,
      isOpen: true,
      currentResidentId: residentId,
      currentStaffId: finalStaffId || null,
      currentResidentName: residentName,
      currentStaffName: finalStaffName
    }));
  };

  const closeChat = () => {
    setChatState(prev => ({
      ...prev,
      isOpen: false,
      currentResidentId: null,
      currentStaffId: null,
      currentResidentName: '',
      currentStaffName: ''
    }));
  };

  const updateUnreadCount = (residentId: string, count: number) => {
    setChatState(prev => ({
      ...prev,
      unreadCounts: {
        ...prev.unreadCounts,
        [residentId]: count
      }
    }));
  };

  useEffect(() => {
    if (!user || (user.role !== 'family' && user.role !== 'staff')) return;

    const pollUnreadCounts = async () => {
      try {
        const response = await messagesAPI.getUnreadCount();
        const r: any = response || {};
        const total = Number((r.totalUnread ?? r.total ?? r.unreadCount) || 0);

        let computedTotal = Number.isFinite(total) ? total : 0;
        if (!computedTotal && r && typeof r === 'object') {
          const possibleMaps = [r.unreadCounts, r.perConversations, r.byResident];
          for (const m of possibleMaps) {
            if (m && typeof m === 'object') {
              computedTotal = Object.values(m as Record<string, number>).reduce((s, v) => s + Number(v || 0), 0);
              break;
            }
          }
        }

        setChatState(prev => ({
          ...prev,
          totalUnread: computedTotal,
        }));
      } catch (error) {
        // Silent error handling for polling - không ảnh hưởng đến UI
        // Chỉ cập nhật state nếu có lỗi và chưa có giá trị
        setChatState(prev => ({
          ...prev,
          totalUnread: prev.totalUnread || 0,
        }));
      }
    };

    // Chỉ poll nếu user đã đăng nhập và có role phù hợp
    if (user && (user.role === 'family' || user.role === 'staff')) {
      pollUnreadCounts();
      const interval = setInterval(pollUnreadCounts, 15000); // Tăng interval lên 15s để giảm tải

      const onFocus = () => {
        // Chỉ poll khi focus nếu không có lỗi gần đây
        pollUnreadCounts();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', onFocus);
      }

      return () => {
        clearInterval(interval);
        if (typeof window !== 'undefined') {
          window.removeEventListener('focus', onFocus);
        }
      };
    }
  }, [user]);

  const value: ChatContextType = {
    chatState,
    openChat,
    closeChat,
    updateUnreadCount,
    getStaffForResident
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
