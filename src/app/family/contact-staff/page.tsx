"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChatBubbleLeftRightIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// CSS to hide scrollbars
const scrollbarHiddenStyle = {
  scrollbarWidth: 'none' as const, /* Firefox */
  msOverflowStyle: 'none' as const, /* Internet Explorer 10+ */
  WebkitScrollbar: {
    display: 'none'
  }
} as any;

// Type definitions
interface Staff {
  id: number;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

interface Message {
  id: number;
  type: 'sent' | 'received';
  content: string;
  timestamp: string;
  avatar?: string;
  status: 'sending' | 'delivered' | 'read';
}

interface SidebarHeaderProps {
  searchStaff: string;
  setSearchStaff: (value: string) => void;
}

interface StaffListProps {
  filteredStaff: Staff[];
  selectedStaff: Staff;
  setSelectedStaff: (staff: Staff) => void;
}

interface ChatHeaderProps {
  selectedStaff: Staff;
}

interface MessagesContainerProps {
  messages: Message[];
}

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  sendMessage: () => void;
}

const residents = [
  { id: 1, name: 'Nguyễn Văn Nam', avatar: 'https://randomuser.me/api/portraits/men/72.jpg' },
  { id: 2, name: 'Lê Thị Hoa', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' }
];

const staffMembers = [
  { 
    id: 1, 
    name: 'Nguyễn Thị Lan', 
    role: 'Y tá trưởng', 
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'online' as const,
    lastSeen: 'Đang hoạt động'
  },
  { 
    id: 2, 
    name: 'Dr. Trần Văn Nam', 
    role: 'Bác sĩ', 
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    status: 'online' as const,
    lastSeen: 'Đang hoạt động'
  },
  { 
    id: 3, 
    name: 'Lê Thị Hoa', 
    role: 'Nhân viên chăm sóc', 
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    status: 'away' as const,
    lastSeen: '5 phút trước'
  },
  { 
    id: 4, 
    name: 'Phạm Văn Minh', 
    role: 'Chuyên viên hoạt động', 
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    status: 'offline' as const,
    lastSeen: '2 giờ trước'
  },
  { 
    id: 5, 
    name: 'Vũ Thị Mai', 
    role: 'Quản lý ca', 
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    status: 'online' as const,
    lastSeen: 'Đang hoạt động'
  }
];

const mockMessages = [
  {
    id: 1,
    type: 'received' as const,
    content: 'Xin chào! Tôi là Y tá trưởng Nguyễn Thị Lan. Tôi có thể giúp gì cho bạn hôm nay?',
    timestamp: '14:30',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'delivered' as const
  },
  {
    id: 2,
    type: 'sent' as const,
    content: 'Chào chị, em muốn hỏi về tình hình sức khỏe của ông Nguyễn Văn Nam ạ.',
    timestamp: '14:32',
    status: 'read' as const
  },
  {
    id: 3,
    type: 'received' as const,
    content: 'Ông Nam hôm nay tình hình sức khỏe rất tốt. Ông đã tham gia đầy đủ các hoạt động buổi sáng và ăn uống bình thường. Các chỉ số sinh hiệu cũng ổn định.',
    timestamp: '14:33',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'delivered' as const
  },
  {
    id: 4,
    type: 'sent' as const,
    content: 'Cảm ơn chị đã cập nhật. Ông có uống thuốc đầy đủ không ạ?',
    timestamp: '14:35',
    status: 'read' as const
  },
  {
    id: 5,
    type: 'received' as const,
    content: 'Có ạ, ông đã uống đầy đủ thuốc theo đúng liệu trình. Tôi đã kiểm tra và ghi chép lại.',
    timestamp: '14:36',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'delivered' as const
  },
  {
    id: 6,
    type: 'sent' as const,
    content: 'Tuyệt vời! Còn hoạt động thể dục thì sao ạ?',
    timestamp: '14:38',
    status: 'read' as const
  },
  {
    id: 7,
    type: 'received' as const,
    content: 'Ông tham gia tập thể dục nhẹ buổi sáng và đi dạo trong vườn buổi chiều. Ông khá tích cực và vui vẻ.',
    timestamp: '14:40',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'delivered' as const
  },
  {
    id: 8,
    type: 'sent' as const,
    content: 'Em cảm ơn chị nhiều. Có gì khác cần lưu ý không ạ?',
    timestamp: '14:42',
    status: 'read' as const
  },
  {
    id: 9,
    type: 'received' as const,
    content: 'Hiện tại mọi thứ đều ổn. Tôi sẽ tiếp tục theo dõi và báo cáo cho gia đình nếu có gì bất thường.',
    timestamp: '14:43',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'delivered' as const
  },
  {
    id: 10,
    type: 'sent' as const,
    content: 'Em xin cảm ơn chị rất nhiều!',
    timestamp: '14:45',
    status: 'read' as const
  }
];

// Sidebar Header Component
const SidebarHeader = ({ searchStaff, setSearchStaff }: SidebarHeaderProps) => {
  return (
    <div style={{
      padding: '1.25rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#1f2937',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <ChatBubbleLeftRightIcon style={{ 
            width: '24px', 
            height: '24px', 
            color: 'white',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
          }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>Tin nhắn</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0, textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>Trò chuyện với nhân viên y tế</p>
        </div>
      </div>
      
      <div style={{ position: 'relative' }}>
        <MagnifyingGlassIcon style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1rem',
          height: '1rem',
          color: '#9ca3af'
        }} />
        <input
          type="text"
          placeholder="Tìm kiếm nhân viên..."
          value={searchStaff}
          onChange={e => setSearchStaff(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            color: '#374151',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={e => {
            e.target.style.background = '#ffffff';
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={e => {
            e.target.style.background = '#f9fafb';
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </div>
  );
};

// Staff List Component
const StaffList = ({ filteredStaff, selectedStaff, setSelectedStaff }: StaffListProps) => {
  return (
    <div style={{ 
      padding: '0.75rem 0'
    }}>
      {filteredStaff.map((staff) => (
        <div
          key={staff.id}
          onClick={() => setSelectedStaff(staff)}
          style={{
            padding: '0.875rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            background: selectedStaff.id === staff.id ? '#f0f9ff' : 'transparent',
            borderLeft: selectedStaff.id === staff.id ? '3px solid #0ea5e9' : '3px solid transparent',
            transition: 'all 0.2s ease',
            borderRadius: selectedStaff.id === staff.id ? '0 0.5rem 0.5rem 0' : '0'
          }}
          onMouseOver={e => {
            if (selectedStaff.id !== staff.id) {
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
          onMouseOut={e => {
            if (selectedStaff.id !== staff.id) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={staff.avatar}
              alt={staff.name}
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: staff.status === 'online' ? '#22c55e' : staff.status === 'away' ? '#f59e0b' : '#6b7280',
              border: '2px solid white'
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: '#111827',
              marginBottom: '0.25rem'
            }}>
              {staff.name}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6b7280',
              marginBottom: '0.125rem'
            }}>
              {staff.role}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: staff.status === 'online' ? '#22c55e' : '#6b7280'
            }}>
              {staff.lastSeen}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ selectedStaff }: ChatHeaderProps) => {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
      minHeight: '70px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={selectedStaff.avatar}
            alt={selectedStaff.name}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: selectedStaff.status === 'online' ? '#22c55e' : selectedStaff.status === 'away' ? '#f59e0b' : '#6b7280',
            border: '2px solid white'
          }} />
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
            {selectedStaff.name}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
            {selectedStaff.role} • {selectedStaff.lastSeen}
          </div>
        </div>
      </div>
    </div>
  );
};

// Messages Container Component
const MessagesContainer = ({ messages }: MessagesContainerProps) => {
  return (
    <div style={{
      padding: '1.25rem',
      background: '#fafbfc',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      scrollBehavior: 'smooth'
    }}>
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            display: 'flex',
            justifyContent: message.type === 'sent' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: '0.5rem'
          }}
        >
          {message.type === 'received' && (
            <img
              src={message.avatar}
              alt="Staff"
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}
          
          <div style={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: message.type === 'sent' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: message.type === 'sent' 
                ? '18px 18px 6px 18px' 
                : '18px 18px 18px 6px',
              background: message.type === 'sent' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                : 'white',
              color: message.type === 'sent' ? 'white' : '#111827',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: message.type === 'received' ? '1px solid #e5e7eb' : 'none',
              wordBreak: 'break-word'
            }}>
              {message.content}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              <span>{message.timestamp}</span>
              {message.type === 'sent' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {message.status === 'sending' && <ClockIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                  {message.status === 'delivered' && <CheckCircleIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                  {message.status === 'read' && <CheckCircleIcon style={{ width: '0.875rem', height: '0.875rem', color: '#3b82f6' }} />}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Message Input Component
const MessageInput = ({ messageInput, setMessageInput, sendMessage }: MessageInputProps) => {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      minHeight: '80px',
      
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1rem',
        background: '#f8fafc',
        borderRadius: '25px',
        padding: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <textarea
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          rows={1}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'transparent',
            fontSize: '0.9rem',
            outline: 'none',
            resize: 'none',
            maxHeight: '120px',
            lineHeight: 1.5
          }}
          onKeyPress={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        
        <button
          onClick={sendMessage}
          title="Gửi tin nhắn"
          disabled={!messageInput.trim()}
          style={{
            padding: '0.75rem',
            borderRadius: '50%',
            border: 'none',
            background: messageInput.trim() 
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : '#e5e7eb',
            color: messageInput.trim() ? 'white' : '#9ca3af',
            cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={e => {
            if (messageInput.trim()) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <PaperAirplaneIcon style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
      </div>
    </div>
  );
};

export default function ContactStaffPage() {
  const router = useRouter();
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  const [selectedStaff, setSelectedStaff] = useState(staffMembers[0]);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [searchStaff, setSearchStaff] = useState('');

  const sendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        type: 'sent',
        content: messageInput,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: 'sending'
      };
      setMessages([...messages, newMessage]);
      setMessageInput('');
      
      // Simulate response after 2 seconds
      setTimeout(() => {
        const response: Message = {
          id: messages.length + 2,
          type: 'received',
          content: 'Cảm ơn bạn đã liên hệ. Tôi đã ghi nhận yêu cầu của bạn và sẽ theo dõi sát sao tình hình.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          avatar: selectedStaff.avatar,
          status: 'delivered'
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const filteredStaff = staffMembers.filter(staff => 
    staff.name.toLowerCase().includes(searchStaff.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchStaff.toLowerCase())
  );

  return (
    <div style={{ 
      height: 'calc(100vh - 4.5rem)', // Trừ đi chiều cao của header
      width: '100%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      overflow: 'hidden',
      padding: '0',
    }}>
      {/* Main Container */}
      <div style={{
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        background: 'white',
        borderRadius: '0',
        overflow: 'hidden',
        boxShadow: 'none'
      }}>
        
        {/* Sidebar */}
        <div style={{
          width: '320px',
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Fixed Sidebar Header */}
          <div style={{
            flexShrink: 0,
            zIndex: 20
          }}>
            <SidebarHeader 
              searchStaff={searchStaff} 
              setSearchStaff={setSearchStaff} 
            />
          </div>
          
          {/* Scrollable Staff List */}
          <div 
            className="hide-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto'
            }}>
            <StaffList 
              filteredStaff={filteredStaff} 
              selectedStaff={selectedStaff} 
              setSelectedStaff={setSelectedStaff} 
            />
          </div>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Fixed Chat Header */}
          <div style={{
            flexShrink: 0,
            zIndex: 15
          }}>
            <ChatHeader selectedStaff={selectedStaff} />
          </div>
          
          {/* Scrollable Messages Container */}
          <div 
            className="hide-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto'
            }}>
            <MessagesContainer messages={messages} />
          </div>
          
          {/* Fixed Message Input */}
          <div style={{
            flexShrink: 0,
            zIndex: 15
          }}>
            <MessageInput 
              messageInput={messageInput} 
              setMessageInput={setMessageInput} 
              sendMessage={sendMessage} 
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Ẩn scrollbar cho các phần tử con được phép scroll */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
} 