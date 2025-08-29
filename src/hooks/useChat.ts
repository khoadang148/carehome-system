import { useCallback, useState, useEffect } from 'react';
import { useChat } from '@/lib/contexts/chat-context';
import { ChatConversation, ChatMessage } from '@/lib/contexts/chat-context';

/**
 * Hook để quản lý conversation đang active
 */
export function useActiveConversation() {
  const { 
    activeConversation, 
    setActiveConversation, 
    joinConversation, 
    leaveConversation,
    markAllAsRead 
  } = useChat();

  const selectConversation = useCallback(async (conversation: ChatConversation) => {
    if (activeConversation) {
      await leaveConversation(activeConversation._id);
    }

    setActiveConversation(conversation);
    
    await joinConversation(conversation._id);
    
    await markAllAsRead(conversation._id);
  }, [activeConversation, setActiveConversation, joinConversation, leaveConversation, markAllAsRead]);

  const clearActiveConversation = useCallback(async () => {
    if (activeConversation) {
      await leaveConversation(activeConversation._id);
      setActiveConversation(null);
    }
  }, [activeConversation, leaveConversation, setActiveConversation]);

  return {
    activeConversation,
    selectConversation,
    clearActiveConversation,
  };
}

/**
 * Hook để gửi tin nhắn với typing indicators
 */
export function useMessageSender() {
  const { sendMessage, startTyping, stopTyping, activeConversation } = useChat();
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!activeConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      startTyping(activeConversation._id);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      stopTyping(activeConversation._id);
    }, 2000);

    setTypingTimeout(timeout);
  }, [activeConversation, isTyping, startTyping, stopTyping, typingTimeout]);

  const handleStopTyping = useCallback(() => {
    if (activeConversation && isTyping) {
      setIsTyping(false);
      stopTyping(activeConversation._id);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  }, [activeConversation, isTyping, stopTyping, typingTimeout]);

  const sendMessageWithTyping = useCallback(async (content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    if (!activeConversation || !content.trim()) return;

    handleStopTyping();

    try {
      await sendMessage({
        conversation_id: activeConversation._id,
        content: content.trim(),
        message_type: messageType,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [activeConversation, sendMessage, handleStopTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return {
    sendMessage: sendMessageWithTyping,
    handleTyping,
    handleStopTyping,
    isTyping,
  };
}

/**
 * Hook để quản lý online status và typing indicators
 */
export function useConversationStatus(conversationId?: string) {
  const { 
    getOtherParticipant, 
    isUserOnline, 
    isUserTyping, 
    conversations,
    activeConversation 
  } = useChat();

  const conversation = conversationId 
    ? conversations.find(c => c._id === conversationId)
    : activeConversation;

  const otherParticipant = conversation ? getOtherParticipant(conversation) : null;
  const isOnline = otherParticipant ? isUserOnline(otherParticipant._id) : false;
  const isTypingNow = otherParticipant && conversation 
    ? isUserTyping(otherParticipant._id, conversation._id) 
    : false;

  return {
    conversation,
    otherParticipant,
    isOnline,
    isTypingNow,
  };
}

/**
 * Hook để quản lý unread count và notifications
 */
export function useUnreadMessages() {
  const { unreadCount, conversations } = useChat();

  const getConversationUnreadCount = useCallback((conversationId: string) => {
    return 0;
  }, []);

  const getTotalUnreadCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  const getUnreadConversations = useCallback(() => {
    return conversations.filter(conv => {
      return false; 
    });
  }, [conversations]);

  return {
    unreadCount,
    getConversationUnreadCount,
    getTotalUnreadCount,
    getUnreadConversations,
  };
}

export function useConversationSearch() {
  const { conversations } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conversation => {
      const hasMatchingParticipant = conversation.participants.some(participant =>
        participant.full_name.toLowerCase().includes(query) ||
        participant.email.toLowerCase().includes(query)
      );

      const hasMatchingTitle = conversation.title?.toLowerCase().includes(query);

      const hasMatchingTopic = conversation.topic?.toLowerCase().includes(query);

      return hasMatchingParticipant || hasMatchingTitle || hasMatchingTopic;
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredConversations,
  };
}

/**
 * Hook để quản lý message pagination
 */
export function useMessagePagination(conversationId?: string) {
  const { loadMessages, messages } = useChat();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || isLoading || !hasMoreMessages) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const currentMessageCount = messages.length;
      
      await loadMessages(conversationId, nextPage);
      

      const newMessageCount = messages.length;
      if (newMessageCount - currentMessageCount < 50) {
        setHasMoreMessages(false);
      }
      
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentPage, hasMoreMessages, isLoading, loadMessages, messages.length]);

  
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreMessages(true);
  }, [conversationId]);

  return {
    currentPage,
    hasMoreMessages,
    isLoading,
    loadMoreMessages,
  };
}