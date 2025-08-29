'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useNotification } from '@/hooks/useNotification';


export interface ChatMessage {
  _id: string;
  conversation_id: string;
  sender_id: {
    _id: string;
    full_name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  message_type: 'text' | 'image' | 'file';
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status: 'sent' | 'delivered' | 'read';
  read_at?: Date;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChatConversation {
  _id: string;
  type: 'direct' | 'group';
  participants: Array<{
    _id: string;
    full_name: string;
    email: string;
    role: string;
    avatar?: string;
  }>;
  title?: string;
  last_message_id?: ChatMessage;
  last_message_at?: Date;
  status: 'active' | 'archived' | 'blocked';
  created_by: string;
  resident_id?: string;
  topic?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SendMessageData {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface TypingUser {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

interface ChatContextType {
  
  socket: Socket | null;
  isConnected: boolean;
  
  
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  
  
  messages: ChatMessage[];
  unreadCount: number;
  
  
  onlineUsers: string[];
  typingUsers: TypingUser[];
  
  
  sendMessage: (data: SendMessageData) => Promise<void>;
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  markAllAsRead: (conversationId: string) => Promise<void>;
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') => Promise<void>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  
  
  setActiveConversation: (conversation: ChatConversation | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  createDirectConversation: (userId: string) => Promise<ChatConversation>;
  
  
  getOtherParticipant: (conversation: ChatConversation) => any;
  isUserOnline: (userId: string) => boolean;
  isUserTyping: (userId: string, conversationId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const newSocket = io(`${BACKEND_URL}/chat`, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      showNotification({ title: 'Lỗi', message: 'Lỗi kết nối chat: ' + error.message, type: 'error' });
    });

    
    newSocket.on('newMessage', (data: { message: ChatMessage; conversationId: string }) => {
      const { message, conversationId } = data;
      
      
      if (activeConversation?._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      
      
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, last_message_id: message, last_message_at: new Date() }
            : conv
        )
      );
      
      
      if (message.sender_id._id !== user.id && activeConversation?._id !== conversationId) {
        showNotification({
          title: 'Tin nhắn mới',
          message: `Tin nhắn mới từ ${message.sender_id.full_name}: ${message.content}`,
          type: 'info'
        });
        setUnreadCount(prev => prev + 1);
      }
    });

    newSocket.on('messageStatusUpdated', (data: { messageId: string; status: string; readAt?: Date }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, status: data.status as any, read_at: data.readAt }
            : msg
        )
      );
    });

    newSocket.on('userTyping', (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(
          user => !(user.userId === data.userId && user.conversationId === data.conversationId)
        );
        
        if (data.isTyping) {
          return [...filtered, data];
        }
        
        return filtered;
      });
    });

    newSocket.on('userOnline', (data: { userId: string }) => {
      setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
    });

    newSocket.on('userOffline', (data: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    newSocket.on('onlineUsers', (data: { conversationId: string; onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    return () => {
      newSocket.close();
    };
  }, [user, activeConversation, showNotification]);

  
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setConversations(result.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  
  const loadMessages = useCallback(async (conversationId: string, page = 1) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/chat/conversations/${conversationId}/messages?page=${page}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (page === 1) {
          setMessages(result.data.messages);
        } else {
          setMessages(prev => [...result.data.messages, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);


  const sendMessage = useCallback(async (data: SendMessageData) => {
    if (!socket || !isConnected) {
      throw new Error('Không có kết nối chat');
    }
    
    socket.emit('sendMessage', data);
  }, [socket, isConnected]);

  
  const joinConversation = useCallback(async (conversationId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit('joinConversation', { conversationId });
    await loadMessages(conversationId);
  }, [socket, isConnected, loadMessages]);

  
  const leaveConversation = useCallback(async (conversationId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit('leaveConversation', { conversationId });
  }, [socket, isConnected]);

  
  const markAllAsRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`${BACKEND_URL}/chat/conversations/${conversationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  
  const updateMessageStatus = useCallback(async (messageId: string, status: 'sent' | 'delivered' | 'read') => {
    if (!socket || !isConnected) return;
    
    socket.emit('updateMessageStatus', { messageId, status: { status } });
  }, [socket, isConnected]);

  
  const startTyping = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('typing', { conversationId, isTyping: true });
  }, [socket, isConnected]);

  const stopTyping = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('typing', { conversationId, isTyping: false });
  }, [socket, isConnected]);

  
  const createDirectConversation = useCallback(async (userId: string): Promise<ChatConversation> => {
    const response = await fetch(`${BACKEND_URL}/chat/conversations/direct/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Không thể tạo cuộc trò chuyện');
    }
    
    const result = await response.json();
    const conversation = result.data;
    

    setConversations(prev => {
      const exists = prev.find(conv => conv._id === conversation._id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
    
    return conversation;
  }, []);

  
  const getOtherParticipant = useCallback((conversation: ChatConversation) => {
    if (!user || conversation.type !== 'direct') return null;
    return conversation.participants.find(p => p._id !== user.id) || null;
  }, [user]);

  
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  
  const isUserTyping = useCallback((userId: string, conversationId: string) => {
    return typingUsers.some(
      user => user.userId === userId && user.conversationId === conversationId && user.isTyping
    );
  }, [typingUsers]);

  useEffect(() => {
    if (user && isConnected) {
      loadConversations();
    }
  }, [user, isConnected, loadConversations]);

  const value: ChatContextType = {
    socket,
    isConnected,
    conversations,
    activeConversation,
    messages,
    unreadCount,
    onlineUsers,
    typingUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    markAllAsRead,
    updateMessageStatus,
    startTyping,
    stopTyping,
    setActiveConversation,
    loadConversations,
    loadMessages,
    createDirectConversation,
    getOtherParticipant,
    isUserOnline,
    isUserTyping,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}