'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { messagesAPI, userAPI, residentAPI, staffAssignmentsAPI, bedAssignmentsAPI } from '@/lib/api';
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
  const [staffDetails, setStaffDetails] = useState<{ [key: string]: any }>({});
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [previousResidentId, setPreviousResidentId] = useState<string | null>(null);
  const [staffAssignments, setStaffAssignments] = useState<{ [key: string]: any[] }>({});
  const [showResidentChangeMessage, setShowResidentChangeMessage] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const filteredConversations = React.useMemo(() => {
    console.log('Filtering conversations:', {
      selectedResidentId,
      conversations: conversations.length,
      searchTerm
    });

    // Chỉ lọc theo search term vì conversations đã được tạo từ staff assignments
    const filtered = conversations.filter(conversation =>
      conversation.partner.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('Filtered conversations:', filtered.length);
    return filtered;
  }, [conversations, searchTerm]);

  const fetchStaffDetails = async (staffId: string) => {
    if (staffDetails[staffId]) return;

    try {
      const staffData = await userAPI.getById(staffId);
      setStaffDetails(prev => ({ ...prev, [staffId]: staffData }));
    } catch (error) { }
  };

  const fetchResidents = async () => {
    if (!user) return;

    try {
      const residentsData = await residentAPI.getByFamilyMemberId(user.id);
      setResidents(residentsData);

      if (residentsData.length > 0 && !selectedResidentId) {
        setSelectedResidentId(residentsData[0]._id);
      }
    } catch (error) { }
  };


  useEffect(() => {
    if (user) {
      fetchResidents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && previousResidentId && previousResidentId !== selectedResidentId) {
      setSelectedConversation(null);
      setMessages([]);
      setShowResidentChangeMessage(true);

      setTimeout(() => {
        setShowResidentChangeMessage(false);
      }, 3000);
    }

    setPreviousResidentId(selectedResidentId);
  }, [selectedResidentId, selectedConversation, previousResidentId]);

  useEffect(() => {
    const fetchStaffAssignments = async () => {
      if (!selectedResidentId) return;

      try {
        setIsLoading(true);
        console.log('Fetching staff assignments for resident:', selectedResidentId);
        
        // Lấy thông tin phòng của resident trước
        const bedAssignments = await bedAssignmentsAPI.getByResidentId(selectedResidentId);
        console.log('Bed assignments:', bedAssignments);
        
        const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find(a => a.bed_id?.room_id) : null;
        const roomId = bedAssignment?.bed_id?.room_id?._id || bedAssignment?.bed_id?.room_id;
        console.log('Room ID:', roomId);

        // Sử dụng endpoint by-resident để lấy staff chăm sóc resident
        const staffData = await staffAssignmentsAPI.getByResident(selectedResidentId);
        console.log('Staff data from API:', staffData);
        
        // Endpoint by-resident trả về array của objects có cấu trúc { staff: {...}, assignment: {...} }
        if (Array.isArray(staffData) && staffData.length > 0) {
          // Xử lý dữ liệu từ API response và tạo conversations
          const processedStaff = staffData.map((item: any) => {
            const staff = item.staff || item; // Fallback nếu không có nested structure
            const assignment = item.assignment || {};
            
            return {
              staff_id: {
                _id: staff.id || staff._id,
                id: staff.id || staff._id,
                full_name: staff.full_name,
                fullName: staff.full_name,
                email: staff.email,
                phone: staff.phone,
                position: staff.position || 'Nhân viên chăm sóc',
                avatar: staff.avatar,
                role: staff.role
              },
              ...assignment
            };
          });

          console.log('Processed staff:', processedStaff);
          setStaffAssignments(prev => ({ ...prev, [selectedResidentId]: processedStaff }));

          // Tạo conversations từ staff assignments
          const conversationsFromStaff = processedStaff.map((assignment: any) => {
            const staff = assignment.staff_id;
            const residentName = residents.find(r => r._id === selectedResidentId)?.full_name || 'Resident';
            return {
              _id: `conversation-${staff._id}-${selectedResidentId}`, // Bao gồm cả staff và resident ID
              partner: {
                _id: staff._id,
                full_name: staff.full_name,
                email: staff.email,
                avatar: staff.avatar,
                role: staff.role,
                position: staff.position
              },
              lastMessage: {
                _id: `last-${staff._id}-${selectedResidentId}`,
                content: 'Chưa có tin nhắn nào',
                timestamp: new Date(),
                sender_id: staff._id
              },
              unreadCount: 0,
              resident_id: selectedResidentId,
              resident_name: residentName,
              // Thêm thông tin để phân biệt conversation
              conversationTitle: `${staff.full_name} - ${residentName}`
            };
          });

          console.log('Created conversations from staff:', conversationsFromStaff);
          console.log('Each conversation is unique per resident-staff pair:', conversationsFromStaff.map(c => ({
            conversationId: c._id,
            staffName: c.partner.full_name,
            residentName: c.resident_name,
            residentId: c.resident_id
          })));
          setConversations(conversationsFromStaff);
        } else {
          console.log('No staff data found');
          setStaffAssignments(prev => ({ ...prev, [selectedResidentId]: [] }));
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching staff assignments:', error);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedResidentId) {
      fetchStaffAssignments();
    }
  }, [selectedResidentId, residents]);

  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(conversation => {
        fetchStaffDetails(conversation.partner._id);
      });
    }
  }, [conversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      try {
        setIsLoadingMessages(true);
        console.log('Fetching messages for conversation with:', selectedConversation.partner._id);
        
        // Sử dụng endpoint conversation với partnerId và residentId
        const response = await messagesAPI.getConversation(
          selectedConversation.partner._id,
          selectedConversation.resident_id
        );
        
        console.log('Messages response:', response);
        const messagesData = Array.isArray(response) ? response : [];
        console.log('Messages data:', messagesData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

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

      setMessages(prev => [...prev, response]);
      setConversations(prev => prev.map(conv =>
        conv._id === selectedConversation._id
          ? { ...conv, lastMessage: response }
          : conv
      ));
    } catch (error) {
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
      // Sử dụng đường dẫn tuyệt đối để tránh bị rewrite
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/default-avatar.svg`;
      }
      return '/default-avatar.svg';
    }

    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
      return avatarPath;
    }

    // Nếu avatarPath đã chứa đường dẫn đầy đủ, sử dụng trực tiếp
    if (avatarPath.includes('/uploads/')) {
      const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '');
      // Nếu đã có /api/ thì không thêm nữa
      if (cleanPath.startsWith('/api/')) {
        return cleanPath;
      }
      // Nếu chưa có /api/ thì thêm vào
      return `/api${cleanPath}`;
    }

    // Fallback: sử dụng userAPI.getAvatarUrl
    const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
    return userAPI.getAvatarUrl(cleanPath);
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'family') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 font-sans overflow-hidden">
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
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

      <div className="max-w-8xl mx-auto px-10 h-[calc(100vh-280px)]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full">
          <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-200 flex flex-col min-h-0">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 text-lg pointer-events-none z-10">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2.5 px-10 rounded-2xl border border-slate-200 text-sm bg-slate-50 text-slate-700 shadow-sm outline-none font-medium transition-all duration-200 focus:border-purple-500 focus:shadow-md focus:shadow-purple-100"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scroll-smooth min-h-0 max-h-full">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                      <LoadingSpinner size="md" />
                    </div>
                    <p className="text-base font-medium">Đang tải cuộc trò chuyện...</p>
                  </div>
                ) : !selectedResidentId ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-3">
                      <UserCircleIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-base font-medium mb-1">Chưa chọn người cao tuổi</p>
                    <p className="text-sm text-slate-400">Vui lòng chọn người cao tuổi để xem tin nhắn</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-base font-medium mb-1">Chưa có cuộc trò chuyện</p>
                    <p className="text-sm text-slate-400">Chưa có cuộc trò chuyện nào với nhân viên của người cao tuổi này</p>
                  </div>
                ) : (
                  <div>
                    {filteredConversations.map((conversation, index) => {
                      const isSelected = selectedConversation?._id === conversation._id;
                      const isUnread = conversation.unreadCount > 0;

                      return (
                        <div
                          key={conversation._id || `conversation-${index}`}
                          onClick={() => setSelectedConversation({ ...(conversation as any), resident_id: selectedResidentId })}
                          className={`
                            p-4 border-b border-slate-100 cursor-pointer transition-all duration-200
                            ${isSelected ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-sm' : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100'}
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={getAvatarUrl(conversation.partner.avatar)}
                                alt={conversation.partner.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/default-avatar.svg';
                                }}
                              />
                              {isUnread && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                                  <span>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {conversation.partner.full_name}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                {staffDetails[conversation.partner._id] && (
                                  <div className="flex items-center gap-1">
                                    {staffDetails[conversation.partner._id].position && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                        {staffDetails[conversation.partner._id].position}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {selectedResidentId && residents.find(r => r._id === selectedResidentId) && (
                                  <p className="text-xs text-purple-600 font-medium">
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

            <div className="flex-1 flex flex-col min-h-0">
              {showResidentChangeMessage && (
                <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
                  <p className="text-sm font-medium">Đã chuyển sang người cao tuổi khác</p>
                </div>
              )}

              {!selectedResidentId ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
                    <UserCircleIcon className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-lg font-bold mb-2 text-slate-700">Chưa chọn người cao tuổi</p>
                  <p className="text-sm text-slate-500">Vui lòng chọn người cao tuổi để xem tin nhắn với nhân viên</p>
                </div>
              ) : selectedConversation ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getAvatarUrl(selectedConversation.partner.avatar)}
                        alt={selectedConversation.partner.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.svg';
                        }}
                      />
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {selectedConversation.partner.full_name}
                        </h2>
                        <div className="flex flex-col gap-0.5">
                          {staffDetails[selectedConversation.partner._id] && (
                            <div className="flex items-center gap-1">
                              {staffDetails[selectedConversation.partner._id].position && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                  {staffDetails[selectedConversation.partner._id].position}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto scroll-smooth p-6 space-y-1 min-h-0">
                    {isLoadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                          <LoadingSpinner size="md" />
                        </div>
                        <p className="text-base font-medium">Đang tải tin nhắn...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3">
                          <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-base font-medium mb-1">Chưa có tin nhắn nào</p>
                        <p className="text-sm text-slate-400">Bắt đầu cuộc trò chuyện với {selectedConversation.partner.full_name}</p>
                      </div>
                    ) : (
                      <div className="messages-container">
                        {messages.map((message, index) => {
                          const senderId = typeof message.sender_id === 'string' ? message.sender_id : message.sender_id?._id;
                          const isOwnMessage = senderId === user?.id;
                          const showDate = index === 0 ||
                            formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

                          return (
                            <div key={message._id || `message-${index}`}>
                              {showDate && (
                                <div className="date-separator">
                                  <span>
                                    {formatDate(message.timestamp)}
                                  </span>
                                </div>
                              )}

                              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                                <div className={`
                                  max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm shadow-md message-bubble
                                  ${isOwnMessage
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                    : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                                  }
                                `}>
                                  <p className="mb-2 leading-relaxed message-content">{message.content}</p>
                                  <div className={`flex items-center justify-end space-x-2 text-xs ${isOwnMessage ? 'text-purple-100' : 'text-gray-500'
                                    }`}>
                                    <span>{formatTime(message.timestamp)}</span>
                                    {isOwnMessage && (
                                      message.status === 'read' ? (
                                        <CheckSolid className="w-3 h-3" />
                                      ) : (
                                        <CheckIcon className="w-3 h-3" />
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
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        disabled={isSending}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                      >
                        {isSending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <PaperAirplaneIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="text-center text-slate-500">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-700">Chọn cuộc trò chuyện</h3>
                    <p className="text-sm text-slate-500">Chọn một cuộc trò chuyện với nhân viên của {residents.find(r => r._id === selectedResidentId)?.full_name} để bắt đầu nhắn tin</p>
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
