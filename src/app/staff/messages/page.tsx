"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon, 
  PaperAirplaneIcon,
  UserIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'family' | 'staff';
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  residentName?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  residentName: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    isRead: boolean;
    fromStaff: boolean;
  };
  unreadCount: number;
}

export default function StaffMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'staff') {
      router.push('/');
      return;
    }

    // Load contacts and messages
    loadContactsAndMessages();
  }, [user, router]);

  const loadContactsAndMessages = () => {
    setIsLoading(true);
    
    // Try to load from localStorage
    try {
      // Load messages
      const savedMessages = localStorage.getItem('nurseryHomeMessages');
      const parsedMessages = savedMessages ? JSON.parse(savedMessages) : [];
      setMessages(parsedMessages);
      
      // Generate contacts based on messages
      const familyContacts = generateContactsFromMessages(parsedMessages);
      setContacts(familyContacts);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Initialize with sample data if no data exists
      initializeSampleData();
    }
    
    setIsLoading(false);
  };

  const generateContactsFromMessages = (allMessages: Message[]): Contact[] => {
    // Get all unique family members who have sent messages
    const contactsMap = new Map<string, Contact>();
    
    allMessages.forEach(message => {
      let contactId: string;
      let isFromStaff = false;
      
      if (message.senderRole === 'family') {
        contactId = message.senderId;
      } else {
        contactId = message.recipientId;
        isFromStaff = true;
      }
      
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          name: message.senderRole === 'family' ? message.senderName : message.senderName.replace('Nhân viên ', ''),
          role: 'family',
          residentName: message.residentName || 'Không xác định',
          unreadCount: message.senderRole === 'family' && !message.isRead ? 1 : 0,
          lastMessage: {
            content: message.content,
            timestamp: message.timestamp,
            isRead: message.isRead,
            fromStaff: isFromStaff
          }
        });
      } else {
        const contact = contactsMap.get(contactId)!;
        
        // Update last message if this message is newer
        const lastMessageTime = new Date(contact.lastMessage?.timestamp || 0);
        const currentMessageTime = new Date(message.timestamp);
        
        if (currentMessageTime > lastMessageTime) {
          contact.lastMessage = {
            content: message.content,
            timestamp: message.timestamp,
            isRead: message.isRead,
            fromStaff: isFromStaff
          };
        }
        
        // Increment unread count if this is from family and unread
        if (message.senderRole === 'family' && !message.isRead) {
          contact.unreadCount += 1;
        }
        
        contactsMap.set(contactId, contact);
      }
    });
    
    // Convert map to array and sort by last message time (most recent first)
    const contactsList = Array.from(contactsMap.values());
    contactsList.sort((a, b) => {
      const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
      const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    return contactsList;
  };

  const initializeSampleData = () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sampleMessages: Message[] = [
      {
        id: '1',
        senderId: 'family1',
        senderName: 'Nguyễn Văn A',
        senderRole: 'family',
        recipientId: 'staff1',
        content: 'Xin chào, tôi muốn hỏi về tình hình sức khỏe của bà ngoại tôi hôm nay?',
        timestamp: yesterday.toISOString(),
        isRead: true,
        residentName: 'Lê Thị Hoa'
      },
      {
        id: '2',
        senderId: 'staff1',
        senderName: 'Nhân viên Trần Thị B',
        senderRole: 'staff',
        recipientId: 'family1',
        content: 'Chào anh Nguyễn Văn A, bà Hoa hôm nay khỏe, đã ăn sáng đầy đủ và tham gia hoạt động buổi sáng rất tích cực.',
        timestamp: yesterday.toISOString(),
        isRead: true,
        residentName: 'Lê Thị Hoa'
      },
      {
        id: '3',
        senderId: 'family2',
        senderName: 'Phạm Văn C',
        senderRole: 'family',
        recipientId: 'staff1',
        content: 'Tôi có thể đến thăm ông tôi vào chiều mai được không?',
        timestamp: now.toISOString(),
        isRead: false,
        residentName: 'Hoàng Văn D'
      }
    ];
    
    setMessages(sampleMessages);
    localStorage.setItem('nurseryHomeMessages', JSON.stringify(sampleMessages));
    
    const contacts = generateContactsFromMessages(sampleMessages);
    setContacts(contacts);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Mark messages from this contact as read
    const updatedMessages = messages.map(msg => {
      if (msg.senderId === contact.id && msg.senderRole === 'family' && !msg.isRead) {
        return { ...msg, isRead: true };
      }
      return msg;
    });
    
    setMessages(updatedMessages);
    localStorage.setItem('nurseryHomeMessages', JSON.stringify(updatedMessages));
    
    // Update contact's unread count
    const updatedContacts = contacts.map(c => {
      if (c.id === contact.id) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    
    setContacts(updatedContacts);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    
    const now = new Date();
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: user.id || 'staff1',
      senderName: `Nhân viên ${user.name}`,
      senderRole: 'staff',
      recipientId: selectedContact.id,
      content: newMessage.trim(),
      timestamp: now.toISOString(),
      isRead: false,
      residentName: selectedContact.residentName
    };
    
    // Add to messages
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem('nurseryHomeMessages', JSON.stringify(updatedMessages));
    
    // Update contacts list with new last message
    const updatedContacts = contacts.map(contact => {
      if (contact.id === selectedContact.id) {
        return {
          ...contact,
          lastMessage: {
            content: newMessage.trim(),
            timestamp: now.toISOString(),
            isRead: false,
            fromStaff: true
          }
        };
      }
      return contact;
    });
    
    // Sort contacts to bring this one to top
    updatedContacts.sort((a, b) => {
      if (a.id === selectedContact.id) return -1;
      if (b.id === selectedContact.id) return 1;
      
      const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
      const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    setContacts(updatedContacts);
    setNewMessage('');
  };
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.residentName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get messages for selected contact
  const contactMessages = selectedContact 
    ? messages.filter(msg => 
        (msg.senderId === selectedContact.id && msg.recipientId === (user?.id || 'staff1')) || 
        (msg.recipientId === selectedContact.id && msg.senderId === (user?.id || 'staff1'))
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Hôm qua, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  // Go back to contacts list on mobile
  const handleBackToContacts = () => {
    setSelectedContact(null);
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <ChatBubbleLeftRightIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Tin nhắn
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Liên lạc với người thân của người cao tuổi
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedContact ? '1fr 2fr' : '1fr',
          gap: '2rem',
          position: 'relative'
        }}>
          {/* Contacts List - Hide on mobile when a contact is selected */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: selectedContact ? 'none' : 'block',
            '@media (min-width: 768px)': {
              display: 'block'
            }
          }}>
            {/* Search Bar */}
            <div style={{padding: '1.25rem', borderBottom: '1px solid #e5e7eb'}}>
              <div style={{position: 'relative'}}>
                <input
                  type="text"
                  placeholder="Tìm kiếm liên hệ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
              </div>
            </div>
            
            {/* Contacts */}
            <div style={{maxHeight: '65vh', overflowY: 'auto'}}>
              {isLoading ? (
                <div style={{padding: '2rem', textAlign: 'center', color: '#6b7280'}}>
                  Đang tải tin nhắn...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div style={{padding: '2rem', textAlign: 'center', color: '#6b7280'}}>
                  Không có tin nhắn nào
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      background: selectedContact?.id === contact.id ? '#f3f4f6' : 'transparent',
                      transition: 'background 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = selectedContact?.id === contact.id 
                        ? '#f3f4f6' 
                        : '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = selectedContact?.id === contact.id 
                        ? '#f3f4f6' 
                        : 'transparent';
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {contact.name.charAt(0)}
                      </div>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span style={{
                            fontWeight: contact.unreadCount > 0 ? 700 : 600,
                            color: contact.unreadCount > 0 ? '#111827' : '#374151',
                            fontSize: '0.875rem'
                          }}>
                            {contact.name}
                          </span>
                          {contact.lastMessage && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              whiteSpace: 'nowrap'
                            }}>
                              {formatMessageDate(contact.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#4b5563',
                          marginTop: '0.25rem',
                          marginBottom: '0.5rem'
                        }}>
                          Người cao tuổi: {contact.residentName}
                        </div>
                        {contact.lastMessage && (
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: contact.unreadCount > 0 ? '#111827' : '#6b7280',
                            fontWeight: contact.unreadCount > 0 ? 500 : 'normal',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {contact.lastMessage.fromStaff ? 'Bạn: ' : ''}{contact.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {contact.unreadCount > 0 && (
                        <div style={{
                          background: '#3b82f6',
                          color: 'white',
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Chat Window */}
          {selectedContact ? (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '70vh'
            }}>
              {/* Chat Header */}
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={handleBackToContacts}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '@media (min-width: 768px)': {
                      display: 'none'
                    }
                  }}
                >
                  <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem', color: '#6b7280'}} />
                </button>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    {selectedContact.name}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Người cao tuổi: {selectedContact.residentName}
                  </p>
                </div>
              </div>
              
              {/* Messages Area */}
              <div style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {contactMessages.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <ChatBubbleLeftRightIcon style={{width: '3rem', height: '3rem', color: '#d1d5db', marginBottom: '1rem'}} />
                    <p style={{margin: 0}}>Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  contactMessages.map(msg => {
                    const isFromMe = msg.senderRole === 'staff';
                    
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isFromMe ? 'flex-end' : 'flex-start',
                          maxWidth: '70%'
                        }}
                      >
                        <div style={{
                          background: isFromMe 
                            ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                            : '#f3f4f6',
                          padding: '0.75rem 1rem',
                          borderRadius: '1rem',
                          borderTopRightRadius: isFromMe ? 0 : '1rem',
                          borderTopLeftRadius: isFromMe ? '1rem' : 0,
                          color: isFromMe ? 'white' : '#374151',
                          boxShadow: isFromMe 
                            ? '0 2px 5px rgba(59, 130, 246, 0.2)' 
                            : '0 2px 5px rgba(0, 0, 0, 0.05)'
                        }}>
                          {msg.content}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginTop: '0.25rem',
                          justifyContent: isFromMe ? 'flex-end' : 'flex-start'
                        }}>
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af'
                          }}>
                            {formatMessageDate(msg.timestamp)}
                          </span>
                          {isFromMe && (
                            <span>
                              {msg.isRead ? (
                                <CheckIcon style={{width: '0.875rem', height: '0.875rem', color: '#3b82f6'}} />
                              ) : (
                                <ClockIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Message Input */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '9999px',
                      background: !newMessage.trim() 
                        ? '#e5e7eb' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: !newMessage.trim() 
                        ? 'none' 
                        : '0 2px 5px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <PaperAirplaneIcon style={{
                      width: '1.25rem', 
                      height: '1.25rem', 
                      color: !newMessage.trim() ? '#9ca3af' : 'white',
                      transform: 'rotate(90deg)'
                    }} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'none',
                '@media (min-width: 768px)': {
                  display: 'flex'
                },
                background: 'white',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                height: '70vh'
              }}
            >
              <div style={{textAlign: 'center', maxWidth: '24rem'}}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '9999px',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto'
                }}>
                  <ChatBubbleLeftRightIcon style={{width: '2.5rem', height: '2.5rem', color: '#9ca3af'}} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 0.5rem 0'
                }}>
                  Chọn một liên hệ để bắt đầu trò chuyện
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Chọn một người thân từ danh sách bên trái để xem và trả lời tin nhắn
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
