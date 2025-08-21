'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { messagesAPI, userAPI, residentAPI, staffAssignmentsAPI } from '@/lib/api';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  ClockIcon,
  CheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { 
  ChatBubbleLeftRightIcon as ChatBubbleSolid,
  CheckIcon as CheckSolid
} from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/LoadingSpinner';
import './messages.css';

interface Conversation {
  _id: string;
  partner: {
    _id: string;
    full_name: string;
    email: string;
    avatar?: string;
    role?: string;
    position?: string;
  };
  lastMessage: {
    _id: string;
    content: string;
    timestamp: Date;
    sender_id: string;
  };
  unreadCount: number;
  resident_id?: string;
  resident_name?: string;
}

interface Message {
  _id: string;
  content: string;
  sender_id: string | { _id: string; full_name: string; email: string };
  receiver_id: string | { _id: string; full_name: string; email: string };
  timestamp: Date;
  status: 'read' | 'unread';
  resident_id?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [staffDetails, setStaffDetails] = useState<{[key: string]: any}>({});
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [previousResidentId, setPreviousResidentId] = useState<string | null>(null);
  const [staffAssignments, setStaffAssignments] = useState<{[key: string]: any[]}>({});
  const [showResidentChangeMessage, setShowResidentChangeMessage] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Filter conversations by selected resident's staff
  const filteredConversations = React.useMemo(() => {
    if (!selectedResidentId || !staffAssignments[selectedResidentId]) {
      return conversations;
    }

    const assignedStaffIds = staffAssignments[selectedResidentId].map(
      (assignment: any) => assignment.staff_id._id || assignment.staff_id
    );

    return conversations.filter(conversation => 
      assignedStaffIds.includes(conversation.partner._id)
    ).filter(conversation =>
      conversation.partner.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, selectedResidentId, staffAssignments, searchTerm]);

  // Fetch staff details
  const fetchStaffDetails = async (staffId: string) => {
    if (staffDetails[staffId]) return; // Already fetched
    
    try {
      const staffData = await userAPI.getById(staffId);
      setStaffDetails(prev => ({
        ...prev,
        [staffId]: staffData
      }));
    } catch (error) {
      console.error('Error fetching staff details:', error);
    }
  };

  // Fetch residents for family member
  const fetchResidents = async () => {
    if (!user) return;
    
    try {
      const residentsData = await residentAPI.getByFamilyMemberId(user.id);
      setResidents(residentsData);
      
      // Auto-select first resident if available
      if (residentsData.length > 0 && !selectedResidentId) {
        setSelectedResidentId(residentsData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  // Fetch staff assignments for a resident
  const fetchStaffAssignments = async (residentId: string) => {
    if (staffAssignments[residentId]) return; // Already fetched
    
    try {
      const assignments = await staffAssignmentsAPI.getByResident(residentId);
      const activeAssignments = assignments.filter((assignment: any) => 
        assignment.status === 'active' && 
        (!assignment.end_date || new Date(assignment.end_date) > new Date())
      );
      
      setStaffAssignments(prev => ({
        ...prev,
        [residentId]: activeAssignments
      }));
    } catch (error) {
      console.error('Error fetching staff assignments:', error);
    }
  };

  // Fetch residents first
  useEffect(() => {
    if (user) {
      fetchResidents();
    }
  }, [user]);

  // Clear conversation when resident changes
  useEffect(() => {
    // Only clear if there's an active conversation and resident actually changed
    if (selectedConversation && previousResidentId && previousResidentId !== selectedResidentId) {
      setSelectedConversation(null);
      setMessages([]);
      setShowResidentChangeMessage(true);
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowResidentChangeMessage(false);
      }, 3000);
    }
    
    // Update previous resident ID
    setPreviousResidentId(selectedResidentId);
  }, [selectedResidentId, selectedConversation, previousResidentId]);

  // Fetch conversations and staff assignments when resident is selected
  useEffect(() => {
    const fetchConversations = async () => {
      if (!selectedResidentId) return;
      
      try {
        setIsLoading(true);
        const response = await messagesAPI.getConversations();
        setConversations(response.conversations || response || []);
        
        // Fetch staff assignments for selected resident
        fetchStaffAssignments(selectedResidentId);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedResidentId) {
      fetchConversations();
    }
  }, [selectedResidentId]);

  // Fetch staff details for conversations
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(conversation => {
        fetchStaffDetails(conversation.partner._id);
      });
    }
  }, [conversations]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      
      try {
        setIsLoadingMessages(true);
        const response = await messagesAPI.getConversation(selectedConversation.partner._id);
        setMessages(response.messages || response || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const messageData = {
        receiver_id: selectedConversation.partner._id,
        content: messageContent,
        resident_id: selectedConversation.resident_id
      };

      const response = await messagesAPI.sendMessage(messageData);
      
      // Add new message to the list
      setMessages(prev => [...prev, response]);
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, lastMessage: response }
          : conv
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };



  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    if (!avatarPath || avatarPath.trim() === '' || avatarPath === 'null' || avatarPath === 'undefined') {
      return '/default-avatar.svg';
    }
    
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
      return avatarPath;
    }
    
    const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
    return userAPI.getAvatarUrl(cleanPath);
  };

  // Bảo vệ route chỉ cho family
  useEffect(() => {
    if (user && user.role !== 'family') {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'family') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <LoadingSpinner size="large" text="Đang tải..." />
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  Tin nhắn
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Kết nối với đội ngũ chăm sóc
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-1 justify-end min-w-80">
            {residents.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
                <UsersIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
                <label htmlFor="resident-filter" className="font-bold text-gray-800 text-lg tracking-tight mr-1 whitespace-nowrap">
                  Người cao tuổi:
                </label>
                <select
                  id="resident-filter"
                  value={selectedResidentId || ''}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="py-2 px-4 rounded-xl border-2 border-purple-200 text-base bg-white text-gray-800 font-semibold min-w-32 shadow-sm outline-none transition-all duration-200 cursor-pointer focus:border-purple-500 focus:shadow-lg focus:shadow-purple-100"
                >
                  {residents.map((resident) => (
                    <option key={resident._id} value={resident._id}>
                      {resident.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-10 pb-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex h-[calc(100vh-200px)]">
                          {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col min-h-0">
                {/* Search - Fixed */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0">
                  <div key="search-container" className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 text-lg pointer-events-none z-10">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </span>
                    <input
                      key="search-input"
                      type="text"
                      placeholder="Tìm kiếm cuộc trò chuyện..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-2.5 px-10 rounded-2xl border border-slate-200 text-sm bg-slate-50 text-slate-700 shadow-sm outline-none font-medium transition-all duration-200 focus:border-purple-500 focus:shadow-md focus:shadow-purple-100"
                    />
                  </div>
                </div>

                {/* Conversations - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                  <div key="loading" className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                      <LoadingSpinner key="loading-spinner" size="medium" />
                    </div>
                    <p key="loading-text" className="text-base font-medium">Đang tải cuộc trò chuyện...</p>
                  </div>
                ) : !selectedResidentId ? (
                  <div key="no-resident" className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-3">
                      <UserCircleIcon key="no-resident-icon" className="w-8 h-8 text-slate-400" />
                    </div>
                    <p key="no-resident-text" className="text-base font-medium mb-1">Chưa chọn resident</p>
                    <p key="no-resident-desc" className="text-sm text-slate-400">Vui lòng chọn resident để xem tin nhắn</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div key="empty" className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                      <ChatBubbleLeftRightIcon key="empty-conversations-icon" className="w-8 h-8 text-purple-400" />
                    </div>
                    <p key="empty-text" className="text-base font-medium mb-1">Chưa có cuộc trò chuyện</p>
                    <p key="empty-desc" className="text-sm text-slate-400">Chưa có cuộc trò chuyện nào với staff của resident này</p>
                  </div>
                ) : (
                  <div key="conversations-list">
                    {filteredConversations.map((conversation, index) => {
                    const isSelected = selectedConversation?._id === conversation._id;
                    const isUnread = conversation.unreadCount > 0;
                    
                    return (
                      <div
                        key={conversation._id || `conversation-${index}`}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`
                          p-4 border-b border-slate-100 cursor-pointer transition-all duration-200
                          ${isSelected ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-sm' : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100'}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div key="conversation-avatar-container" className="relative">
                            <img
                              key="conversation-avatar"
                              src={getAvatarUrl(conversation.partner.avatar)}
                              alt={conversation.partner.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.svg';
                              }}
                            />
                            {isUnread && (
                              <span key={`unread-${conversation._id || index}`} className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                                <span key={`unread-count-${conversation._id || index}`}>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>
                              </span>
                            )}
                          </div>
                          <div key="conversation-info" className="flex-1 min-w-0">
                            <div key="conversation-header" className="flex items-center justify-between">
                              <h3 key="conversation-name" className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                {conversation.partner.full_name}
                              </h3>
                              <span key="conversation-time" className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            </div>
                            <div key="conversation-details" className="flex flex-col gap-0.5">
                              {/* Staff role and position */}
                              {staffDetails[conversation.partner._id] && (
                                <div key={`staff-info-${conversation._id || index}`} className="flex items-center gap-1">
                                  {staffDetails[conversation.partner._id].position && (
                                    <span key={`position-${conversation._id || index}`} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                      {staffDetails[conversation.partner._id].position}
                                    </span>
                                  )}
                                  
                                </div>
                              )}
                              {/* Resident info */}
                              {selectedResidentId && residents.find(r => r._id === selectedResidentId) && (
                                <p key={`resident-${conversation._id || index}`} className="text-xs text-purple-600 font-medium">
                                  Phụ trách: {residents.find(r => r._id === selectedResidentId)?.full_name}
                                </p>
                              )}
                            </div>
                            
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Resident change notification */}
              {showResidentChangeMessage && (
                <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
                  <p className="text-sm font-medium">Đã chuyển sang người cao tuổi khác</p>
                </div>
              )}
              
              {!selectedResidentId ? (
                <div key="no-resident-messages" className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
                    <UserCircleIcon key="no-resident-messages-icon" className="w-10 h-10 text-slate-400" />
                  </div>
                  <p key="no-resident-messages-text" className="text-lg font-bold mb-2 text-slate-700">Chưa chọn resident</p>
                  <p key="no-resident-messages-desc" className="text-sm text-slate-500">Vui lòng chọn resident để xem tin nhắn với staff</p>
                </div>
              ) : selectedConversation ? (
                <div key={`conversation-${selectedConversation._id}`} className="flex flex-col h-full">
                <>
                  {/* Chat Header - Fixed */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 flex-shrink-0">
                    <div key="chat-header-content" className="flex items-center space-x-3">
                      <img
                        key="chat-header-avatar"
                        src={getAvatarUrl(selectedConversation.partner.avatar)}
                        alt={selectedConversation.partner.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.svg';
                        }}
                      />
                      <div key="chat-header-info">
                        <h2 key="chat-header-name" className="font-semibold text-gray-900">
                          {selectedConversation.partner.full_name}
                        </h2>
                        <div key="chat-header-details" className="flex flex-col gap-0.5">
                          {/* Staff role and position */}
                          {staffDetails[selectedConversation.partner._id] && (
                            <div key={`header-staff-info-${selectedConversation._id}`} className="flex items-center gap-1">
                              {staffDetails[selectedConversation.partner._id].position && (
                                <span key={`header-position-${selectedConversation._id}`} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                  {staffDetails[selectedConversation.partner._id].position}
                                </span>
                              )}
                              
                            </div>
                          )}
                         
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-1 min-h-0">
                    {isLoadingMessages ? (
                      <div key="loading-messages" className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                          <LoadingSpinner key="loading-messages-spinner" size="medium" />
                        </div>
                        <p key="loading-messages-text" className="text-base font-medium">Đang tải tin nhắn...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div key="empty-messages" className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                          <ChatBubbleLeftRightIcon key="empty-messages-icon" className="w-8 h-8 text-purple-400" />
                        </div>
                        <p key="empty-messages-text" className="text-base font-medium mb-1">Chưa có tin nhắn nào</p>
                        <p key="empty-messages-subtext" className="text-sm text-slate-400">Bắt đầu cuộc trò chuyện với {selectedConversation.partner.full_name}</p>
                      </div>
                    ) : (
                      <div key="messages-list" className="messages-container">
                        {messages.map((message, index) => {
                        const senderId = typeof message.sender_id === 'string' ? message.sender_id : message.sender_id?._id;
                        const isOwnMessage = senderId === user?.id;
                        const showDate = index === 0 || 
                          formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

                        return (
                          <div key={message._id || `message-${index}`}>
                            {/* Date separator */}
                            {showDate && (
                              <div key={`date-${formatDate(message.timestamp)}`} className="date-separator">
                                <span key={`date-text-${formatDate(message.timestamp)}`}>
                                  {formatDate(message.timestamp)}
                                </span>
                              </div>
                            )}
                            
                            {/* Message */}
                            <div key={`message-${message._id || index}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                              <div className={`
                                max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm shadow-md message-bubble
                                ${isOwnMessage 
                                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                                  : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                                }
                              `}>
                                <p key="message-content" className="mb-2 leading-relaxed message-content">{message.content}</p>
                                <div key="message-footer" className={`flex items-center justify-end space-x-2 text-xs ${
                                  isOwnMessage ? 'text-purple-100' : 'text-gray-500'
                                }`}>
                                  <span key="message-time">{formatTime(message.timestamp)}</span>
                                  {isOwnMessage && (
                                    message.status === 'read' ? (
                                      <CheckSolid key="read-status" className="w-3 h-3" />
                                    ) : (
                                      <CheckIcon key="unread-status" className="w-3 h-3" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                    <div key="messages-end" ref={messagesEndRef} />
                  </div>

                  {/* Message Input - Fixed */}
                  <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0">
                    <div key="message-input-container" className="flex space-x-3">
                      <input
                        key="message-input"
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        disabled={isSending}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200"
                      />
                      <button
                        key="send-button"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                      >
                        {isSending ? (
                          <LoadingSpinner key="sending-spinner" size="small" />
                        ) : (
                          <PaperAirplaneIcon key="send-icon" className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
                </div>
              ) : (
                <div key="no-conversation-selected" className="flex-1 flex items-center justify-center min-h-0">
                  <div key="no-conversation-content" className="text-center text-slate-500">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon key="no-conversation-icon" className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 key="no-conversation-title" className="text-lg font-bold mb-2 text-slate-700">Chọn cuộc trò chuyện</h3>
                    <p key="no-conversation-text" className="text-sm text-slate-500">Chọn một cuộc trò chuyện với nhân viên của {residents.find(r => r._id === selectedResidentId)?.full_name} để bắt đầu nhắn tin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
