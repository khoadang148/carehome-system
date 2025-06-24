"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/lib/contexts/chat-context';
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
interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  residentName: string;
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
  searchFamily: string;
  setSearchFamily: (value: string) => void;
}

interface FamilyListProps {
  filteredFamily: FamilyMember[];
  selectedFamily: FamilyMember;
  setSelectedFamily: (family: FamilyMember) => void;
}

interface ChatHeaderProps {
  selectedFamily: FamilyMember;
}

interface MessagesContainerProps {
  messages: Message[];
}

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  sendMessage: () => void;
}

// Sidebar Header Component
const SidebarHeader = ({ searchFamily, setSearchFamily }: SidebarHeaderProps) => {
  return (
    <div style={{
      padding: '1.25rem',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0, textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>Trò chuyện với gia đình</p>
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
          placeholder="Tìm kiếm gia đình..."
          value={searchFamily}
          onChange={e => setSearchFamily(e.target.value)}
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

// Family List Component
const FamilyList = ({ filteredFamily, selectedFamily, setSelectedFamily }: FamilyListProps) => {
  return (
    <div style={{ 
      padding: '0.75rem 0'
    }}>
      {filteredFamily.map((family) => (
        <div
          key={family.id}
          onClick={() => setSelectedFamily(family)}
          style={{
            padding: '0.875rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            background: selectedFamily.id === family.id ? '#ecfdf5' : 'transparent',
            borderLeft: selectedFamily.id === family.id ? '3px solid #10b981' : '3px solid transparent',
            transition: 'all 0.2s ease',
            borderRadius: selectedFamily.id === family.id ? '0 0.5rem 0.5rem 0' : '0'
          }}
          onMouseOver={e => {
            if (selectedFamily.id !== family.id) {
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
          onMouseOut={e => {
            if (selectedFamily.id !== family.id) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={family.avatar}
              alt={family.name}
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
              background: family.status === 'online' ? '#22c55e' : family.status === 'away' ? '#f59e0b' : '#6b7280',
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
              {family.name}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6b7280',
              marginBottom: '0.125rem'
            }}>
              {family.relationship} của {family.residentName}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: family.status === 'online' ? '#22c55e' : '#6b7280'
            }}>
              {family.lastSeen}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ selectedFamily }: ChatHeaderProps) => {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
      minHeight: '70px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={selectedFamily.avatar}
            alt={selectedFamily.name}
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
            background: selectedFamily.status === 'online' ? '#22c55e' : selectedFamily.status === 'away' ? '#f59e0b' : '#6b7280',
            border: '2px solid white'
          }} />
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
            {selectedFamily.name}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
            {selectedFamily.relationship} của {selectedFamily.residentName} • {selectedFamily.lastSeen}
          </div>
        </div>
      </div>
    </div>
  );
};

// Messages Container Component
const MessagesContainer = ({ messages }: MessagesContainerProps) => {
  const { currentUser } = useChat();
  
  return (
    <div style={{
      padding: '1.25rem',
      background: '#fafbfc',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      scrollBehavior: 'smooth'
    }}>
      {messages.map((message: any) => {
        const isFromCurrentUser = currentUser && message.senderId === currentUser.id;
        
        return (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: isFromCurrentUser ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '0.5rem'
            }}
          >
            {!isFromCurrentUser && (
              <img
                src={message.avatar}
                alt="Family"
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
              alignItems: isFromCurrentUser ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: isFromCurrentUser 
                  ? '18px 18px 6px 18px' 
                  : '18px 18px 18px 6px',
                background: isFromCurrentUser 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'white',
                color: isFromCurrentUser ? 'white' : '#111827',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: !isFromCurrentUser ? '1px solid #e5e7eb' : 'none',
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
                {isFromCurrentUser && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {message.status === 'sending' && <ClockIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                    {message.status === 'delivered' && <CheckCircleIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                    {message.status === 'read' && <CheckCircleIcon style={{ width: '0.875rem', height: '0.875rem', color: '#10b981' }} />}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
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

export default function StaffFamilyCommunicationPage() {
  const router = useRouter();
  const [messageInput, setMessageInput] = useState('');
  const [searchFamily, setSearchFamily] = useState('');
  
  // Use Chat Context
  const { 
    familyMembers, 
    staffMembers, 
    currentRoom, 
    currentUser, 
    setCurrentUser,
    selectChatRoom,
    sendMessage: sendChatMessage 
  } = useChat();
  
  const [selectedFamily, setSelectedFamily] = useState<any>(null);

  // Set current user as staff member (defaulting to first staff member)
  useEffect(() => {
    if (!currentUser && staffMembers.length > 0) {
      setCurrentUser(staffMembers[0]); // Default to first staff member
    }
  }, [currentUser, staffMembers, setCurrentUser]);

  // Select chat room when family is selected
  useEffect(() => {
    if (selectedFamily && currentUser) {
      selectChatRoom(currentUser.id, selectedFamily.id);
    }
  }, [selectedFamily, currentUser, selectChatRoom]);

  // Set default selected family
  useEffect(() => {
    if (!selectedFamily && familyMembers.length > 0) {
      setSelectedFamily(familyMembers[0]);
    }
  }, [selectedFamily, familyMembers]);

  const sendMessage = () => {
    if (messageInput.trim() && selectedFamily) {
      sendChatMessage(messageInput, selectedFamily.id);
      setMessageInput('');
    }
  };

  const filteredFamily = familyMembers.filter(family => 
    family.name.toLowerCase().includes(searchFamily.toLowerCase()) ||
    (family.relationship && family.relationship.toLowerCase().includes(searchFamily.toLowerCase())) ||
    (family.residentName && family.residentName.toLowerCase().includes(searchFamily.toLowerCase()))
  );

  if (!currentUser) {
    return <div>Loading...</div>;
  }

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
              searchFamily={searchFamily} 
              setSearchFamily={setSearchFamily} 
            />
          </div>
          
          {/* Scrollable Family List */}
          <div 
            className="hide-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto'
            }}>
            <FamilyList 
              filteredFamily={filteredFamily} 
              selectedFamily={selectedFamily} 
              setSelectedFamily={setSelectedFamily} 
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
            <ChatHeader selectedFamily={selectedFamily} />
          </div>
          
          {/* Scrollable Messages Container */}
          <div 
            className="hide-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto'
            }}>
            <MessagesContainer messages={currentRoom?.messages || []} />
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
