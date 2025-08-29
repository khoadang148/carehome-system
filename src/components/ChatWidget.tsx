'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { messagesAPI, staffAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import './chat-widget.css';
import { userAPI } from '@/lib/api';

interface Message {
  _id: string;
  content: string;
  sender_id: string | { _id: string; full_name: string; email: string };
  receiver_id: string | { _id: string; full_name: string; email: string };
  timestamp: Date;
  status: 'read' | 'unread';
  resident_id?: string;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string;
  staffId?: string;
  residentName: string;
  staffName?: string;
  userRole?: 'family' | 'staff';
}

export default function ChatWidget({
  isOpen,
  onClose,
  residentId,
  staffId,
  residentName,
  staffName,
  userRole = 'family'
}: ChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStaffInfo = async () => {
      if (!staffId) return;
      
      try {
        const response = await userAPI.getById(staffId);
        setStaffInfo(response);
      } catch (error) {
        console.error('Error fetching staff info:', error);
      }
    };

    fetchStaffInfo();
  }, [staffId]);
  useEffect(() => {
    const fetchMessages = async () => {
      if (!staffId || !user) return;
      
      try {
        setIsLoading(true);
        const response = await messagesAPI.getConversation(staffId);
        setMessages(response.messages || response || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, staffId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !staffId || !user || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const messageData = {
        receiver_id: staffId,
        content: messageContent,
        resident_id: residentId
      };

      const response = await messagesAPI.sendMessage(messageData);
      
      setMessages(prev => [...prev, response]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="chat-widget bg-white rounded-lg shadow-2xl border border-gray-200 w-80 h-96 flex flex-col">
        <div className="bg-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {userRole === 'staff' ? (staffName || 'Gia đình') : (staffName || 'Nhân viên')}
              </h3>
              <p className="text-xs text-blue-100">
                {userRole === 'staff' ? `Gia đình của ${residentName}` : `phụ trách ${residentName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="chat-widget-messages flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Chưa có tin nhắn nào</p>
              <p className="text-xs">Bắt đầu cuộc trò chuyện với {staffName || 'nhân viên'}</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const senderId = typeof message.sender_id === 'string' ? message.sender_id : message.sender_id?._id;
              const isOwnMessage = senderId === user?.id;
              const showDate = index === 0 || 
                formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-2">
                      {formatDate(message.timestamp)}
                    </div>
                  )}
                  
                   <div className={`chat-message flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                     <div className={`
                       max-w-xs px-3 py-2 rounded-lg text-sm
                       ${isOwnMessage 
                         ? 'bg-blue-500 text-white' 
                         : 'bg-gray-100 text-gray-800'
                       }
                     `}>
                      <p>{message.content}</p>
                      <p className={`
                        text-xs mt-1
                        ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}
                      `}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={!staffId || isSending}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !staffId || isSending}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {!staffId && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Chưa có nhân viên được phân công cho {residentName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
