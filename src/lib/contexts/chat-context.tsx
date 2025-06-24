"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definitions
interface ChatParticipant {
  id: number;
  name: string;
  role: 'staff' | 'family';
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  relationship?: string;
  residentName?: string;
  position?: string;
}

interface ChatMessage {
  id: number;
  type: 'sent' | 'received';
  content: string;
  timestamp: string;
  senderId: number;
  receiverId: number;
  avatar?: string;
  status: 'sending' | 'delivered' | 'read';
  senderRole: 'staff' | 'family';
}

interface ChatRoom {
  id: string;
  participants: [number, number]; // [staffId, familyId]
  messages: ChatMessage[];
  lastActivity: string;
}

interface ChatContextType {
  // Chat rooms management
  chatRooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  
  // Participants
  staffMembers: ChatParticipant[];
  familyMembers: ChatParticipant[];
  
  // Current user context
  currentUser: ChatParticipant | null;
  setCurrentUser: (user: ChatParticipant) => void;
  
  // Chat actions
  sendMessage: (content: string, receiverId: number) => void;
  selectChatRoom: (staffId: number, familyId: number) => void;
  markMessagesAsRead: (roomId: string) => void;
  
  // Utility functions
  getChatPartner: (roomId: string) => ChatParticipant | null;
  getUnreadCount: (roomId: string) => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock data
const mockStaffMembers: ChatParticipant[] = [
  { 
    id: 1, 
    name: 'Nguyễn Thị Lan', 
    role: 'staff',
    position: 'Y tá trưởng',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'online',
    lastSeen: 'Đang hoạt động'
  },
  { 
    id: 2, 
    name: 'Dr. Trần Văn Nam', 
    role: 'staff',
    position: 'Bác sĩ',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    status: 'online',
    lastSeen: 'Đang hoạt động'
  },
  { 
    id: 3, 
    name: 'Lê Thị Hoa', 
    role: 'staff',
    position: 'Nhân viên chăm sóc',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    status: 'away',
    lastSeen: '5 phút trước'
  },
  { 
    id: 4, 
    name: 'Phạm Văn Minh', 
    role: 'staff',
    position: 'Chuyên viên hoạt động',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    status: 'offline',
    lastSeen: '2 giờ trước'
  },
  { 
    id: 5, 
    name: 'Vũ Thị Mai', 
    role: 'staff',
    position: 'Quản lý ca',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    status: 'online',
    lastSeen: 'Đang hoạt động'
  }
];

const mockFamilyMembers: ChatParticipant[] = [
  { 
    id: 101, 
    name: 'Nguyễn Thị Mai', 
    role: 'family',
    relationship: 'Con gái', 
    residentName: 'Nguyễn Văn Nam',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'online',
    lastSeen: 'Đang hoạt động'
  },
  { 
    id: 102, 
    name: 'Trần Văn Minh', 
    role: 'family',
    relationship: 'Con trai', 
    residentName: 'Trần Thị Hoa',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    status: 'online',
    lastSeen: 'Đang hoạt động'
  },
  { 
    id: 103, 
    name: 'Lê Thị Lan', 
    role: 'family',
    relationship: 'Vợ', 
    residentName: 'Lê Văn Bình',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    status: 'away',
    lastSeen: '5 phút trước'
  },
  { 
    id: 104, 
    name: 'Phạm Thị Hương', 
    role: 'family',
    relationship: 'Cháu gái', 
    residentName: 'Phạm Văn Tùng',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    status: 'offline',
    lastSeen: '2 giờ trước'
  },
  { 
    id: 105, 
    name: 'Vũ Văn Đức', 
    role: 'family',
    relationship: 'Con trai', 
    residentName: 'Vũ Thị Sen',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    status: 'online',
    lastSeen: 'Đang hoạt động'
  }
];

// Initial chat rooms with some sample messages
const initialChatRooms: ChatRoom[] = [
  {
    id: '1-101', // staff_1 with family_101
    participants: [1, 101],
    lastActivity: new Date().toISOString(),
    messages: [
      {
        id: 1,
        type: 'received',
        content: 'Xin chào bác sĩ! Em muốn hỏi về tình hình sức khỏe của mẹ em trong tuần này ạ.',
        timestamp: '14:30',
        senderId: 101,
        receiverId: 1,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'delivered',
        senderRole: 'family'
      },
      {
        id: 2,
        type: 'sent',
        content: 'Chào em Mai! Tình hình sức khỏe của mẹ em rất tốt. Mẹ đã tham gia đầy đủ các hoạt động và ăn uống bình thường.',
        timestamp: '14:32',
        senderId: 1,
        receiverId: 101,
        status: 'read',
        senderRole: 'staff'
      },
      {
        id: 3,
        type: 'received',
        content: 'Cảm ơn bác sĩ đã cập nhật. Mẹ em có uống thuốc đầy đủ không ạ?',
        timestamp: '14:33',
        senderId: 101,
        receiverId: 1,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'delivered',
        senderRole: 'family'
      },
      {
        id: 4,
        type: 'sent',
        content: 'Có em ạ, mẹ em đã uống đầy đủ thuốc theo đúng liệu trình. Tôi đã kiểm tra và ghi chép lại.',
        timestamp: '14:35',
        senderId: 1,
        receiverId: 101,
        status: 'read',
        senderRole: 'staff'
      },
      {
        id: 5,
        type: 'received',
        content: 'Còn hoạt động thể dục thì sao ạ? Mẹ em có tham gia tích cực không?',
        timestamp: '14:36',
        senderId: 101,
        receiverId: 1,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'delivered',
        senderRole: 'family'
      },
      {
        id: 6,
        type: 'sent',
        content: 'Mẹ em tham gia tập thể dục nhẹ buổi sáng và đi dạo trong vườn buổi chiều. Mẹ khá tích cực và vui vẻ.',
        timestamp: '14:38',
        senderId: 1,
        receiverId: 101,
        status: 'read',
        senderRole: 'staff'
      },
      {
        id: 7,
        type: 'received',
        content: 'Tuyệt vời! Em cảm ơn bác sĩ rất nhiều. Có gì khác cần lưu ý không ạ?',
        timestamp: '14:40',
        senderId: 101,
        receiverId: 1,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'delivered',
        senderRole: 'family'
      },
      {
        id: 8,
        type: 'sent',
        content: 'Hiện tại mọi thứ đều ổn. Tôi sẽ tiếp tục theo dõi và báo cáo cho gia đình nếu có gì bất thường.',
        timestamp: '14:42',
        senderId: 1,
        receiverId: 101,
        status: 'read',
        senderRole: 'staff'
      },
      {
        id: 9,
        type: 'received',
        content: 'Em xin cảm ơn bác sĩ rất nhiều!',
        timestamp: '14:43',
        senderId: 101,
        receiverId: 1,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'delivered',
        senderRole: 'family'
      }
    ]
  }
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(initialChatRooms);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<ChatParticipant | null>(null);
  const [staffMembers] = useState<ChatParticipant[]>(mockStaffMembers);
  const [familyMembers] = useState<ChatParticipant[]>(mockFamilyMembers);

  const getRoomId = (staffId: number, familyId: number): string => {
    return `${staffId}-${familyId}`;
  };

  const selectChatRoom = (staffId: number, familyId: number) => {
    const roomId = getRoomId(staffId, familyId);
    let room = chatRooms.find(r => r.id === roomId);
    
    if (!room) {
      // Create new room if doesn't exist
      room = {
        id: roomId,
        participants: [staffId, familyId],
        messages: [],
        lastActivity: new Date().toISOString()
      };
      setChatRooms(prev => [...prev, room!]);
    }
    
    setCurrentRoom(room);
  };

  const sendMessage = (content: string, receiverId: number) => {
    if (!currentUser || !currentRoom) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      type: 'sent',
      content,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      senderId: currentUser.id,
      receiverId,
      status: 'sending',
      senderRole: currentUser.role
    };

    // Update current room messages
    const updatedRoom = {
      ...currentRoom,
      messages: [...currentRoom.messages, newMessage],
      lastActivity: new Date().toISOString()
    };

    setChatRooms(prev => 
      prev.map(room => room.id === currentRoom.id ? updatedRoom : room)
    );
    setCurrentRoom(updatedRoom);

    // Simulate message delivery and response
    setTimeout(() => {
      const deliveredMessage = { ...newMessage, status: 'delivered' as const };
      const updatedRoomWithDelivery = {
        ...updatedRoom,
        messages: updatedRoom.messages.map(msg => 
          msg.id === newMessage.id ? deliveredMessage : msg
        )
      };

      setChatRooms(prev => 
        prev.map(room => room.id === currentRoom.id ? updatedRoomWithDelivery : room)
      );
      setCurrentRoom(updatedRoomWithDelivery);

      // Simulate auto response after 2 seconds
      setTimeout(() => {
        const otherParticipant = currentUser.role === 'staff' 
          ? familyMembers.find(f => f.id === receiverId)
          : staffMembers.find(s => s.id === receiverId);

        if (otherParticipant) {
          const responseMessage: ChatMessage = {
            id: Date.now() + 1,
            type: 'received',
            content: currentUser.role === 'staff' 
              ? 'Cảm ơn bác sĩ đã cập nhật. Gia đình em rất yên tâm khi biết được chăm sóc tốt.'
              : 'Cảm ơn gia đình đã thông báo. Chúng tôi sẽ tiếp tục theo dõi và chăm sóc tốt nhất.',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            senderId: receiverId,
            receiverId: currentUser.id,
            avatar: otherParticipant.avatar,
            status: 'delivered',
            senderRole: otherParticipant.role
          };

          const roomWithResponse = {
            ...updatedRoomWithDelivery,
            messages: [...updatedRoomWithDelivery.messages, responseMessage],
            lastActivity: new Date().toISOString()
          };

          setChatRooms(prev => 
            prev.map(room => room.id === currentRoom.id ? roomWithResponse : room)
          );
          setCurrentRoom(roomWithResponse);
        }
      }, 2000);
    }, 1000);
  };

  const markMessagesAsRead = (roomId: string) => {
    setChatRooms(prev => 
      prev.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          messages: room.messages.map(msg => ({ ...msg, status: 'read' as const }))
        };
      })
    );
  };

  const getChatPartner = (roomId: string): ChatParticipant | null => {
    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !currentUser) return null;

    const [staffId, familyId] = room.participants;
    if (currentUser.role === 'staff') {
      return familyMembers.find(f => f.id === familyId) || null;
    } else {
      return staffMembers.find(s => s.id === staffId) || null;
    }
  };

  const getUnreadCount = (roomId: string): number => {
    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !currentUser) return 0;

    return room.messages.filter(msg => 
      msg.receiverId === currentUser.id && msg.status !== 'read'
    ).length;
  };

  const value: ChatContextType = {
    chatRooms,
    currentRoom,
    staffMembers,
    familyMembers,
    currentUser,
    setCurrentUser,
    sendMessage,
    selectChatRoom,
    markMessagesAsRead,
    getChatPartner,
    getUnreadCount
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