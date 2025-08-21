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
  // Total unread messages across all conversations
  totalUnread: number;
  unreadCounts: Record<string, number>;
}

interface ChatContextType {
  // State
  chatState: ChatState;
  
  // Actions
  openChat: (
    residentId: string,
    staffId?: string,
    residentName?: string,
    staffName?: string
  ) => void;
  closeChat: () => void;
  updateUnreadCount: (residentId: string, count: number) => void;
  
  // Data
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

  // Fetch staff assignments for residents
  const getStaffForResident = async (residentId: string) => {
    try {
      const assignments = await staffAssignmentsAPI.getByResident(residentId);
      const activeAssignment = assignments.find((assignment: any) => 
        assignment.status === 'active' && 
        (!assignment.end_date || new Date(assignment.end_date) > new Date())
      );
      
      if (activeAssignment) {
        return {
          staffId: activeAssignment.staff_id,
          staffName: activeAssignment.staff_name || 'Nhân viên'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching staff for resident:', error);
      return null;
    }
  };

  // Open chat with resident
  const openChat = async (
    residentId: string,
    staffId?: string,
    residentName: string = 'Resident',
    staffName: string = 'Staff'
  ) => {
    let finalStaffId = staffId;
    let finalStaffName = staffName;

    // If no staffId provided, try to get it from assignments
    if (!finalStaffId) {
      const staffInfo = await getStaffForResident(residentId);
      if (staffInfo) {
        finalStaffId = staffInfo.staffId;
        finalStaffName = staffInfo.staffName;
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

  // Close chat
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

  // Update unread count for a resident
  const updateUnreadCount = (residentId: string, count: number) => {
    setChatState(prev => ({
      ...prev,
      unreadCounts: {
        ...prev.unreadCounts,
        [residentId]: count
      }
    }));
  };

  // Poll for unread counts
  useEffect(() => {
    if (!user) return;

    const pollUnreadCounts = async () => {
      try {
        const response = await messagesAPI.getUnreadCount();
        // Support multiple possible response shapes
        const total = Number(
          (response && (response.totalUnread ?? response.total ?? response.count)) || 0
        );

        setChatState(prev => ({
          ...prev,
          totalUnread: Number.isFinite(total) ? total : 0,
        }));
      } catch (error) {
        console.error('Error polling unread counts:', error);
      }
    };

    // Poll immediately
    pollUnreadCounts();

    // Set up polling interval
    const interval = setInterval(pollUnreadCounts, 10000); // Every 10 seconds for snappier updates

    // Also refresh when window regains focus
    const onFocus = () => pollUnreadCounts();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
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
