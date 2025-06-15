"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface FamilyMessage {
  id: number;
  familyName: string;
  residentName: string;
  residentId: number;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'replied' | 'resolved';
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  attachments?: string[];
}

export default function FamilyCommunicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<FamilyMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    const mockMessages: FamilyMessage[] = [
      {
        id: 1,
        familyName: 'Gia đình Nguyễn',
        residentName: 'Nguyễn Văn Bảy',
        residentId: 1,
        subject: 'Hỏi về tình trạng sức khỏe',
        message: 'Xin chào, tôi muốn biết tình trạng sức khỏe của bố tôi trong tuần này. Bố có ăn uống tốt không ạ?',
        priority: 'medium',
        status: 'new',
        createdAt: '2024-01-15T08:30:00',
        attachments: []
      },
      {
        id: 2,
        familyName: 'Gia đình Trần',
        residentName: 'Trần Thị Cúc',
        residentId: 2,
        subject: 'Thông báo về thuốc mới',
        message: 'Bác sĩ gia đình đã kê thêm thuốc huyết áp mới cho mẹ tôi. Xin gửi đơn thuốc trong file đính kèm.',
        priority: 'high',
        status: 'replied',
        createdAt: '2024-01-14T14:20:00',
        reply: 'Cảm ơn gia đình đã thông báo. Chúng tôi đã tiếp nhận đơn thuốc và sẽ phối hợp với dược sĩ để cập nhật phác đồ điều trị.',
        repliedAt: '2024-01-14T16:45:00',
        attachments: ['prescription.pdf']
      }
    ];
    
    setMessages(mockMessages);
    setLoading(false);
  };

  const handleReply = async (messageId: number) => {
    if (!replyText.trim()) return;

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            status: 'replied' as const,
            reply: replyText,
            repliedAt: new Date().toISOString()
          }
        : msg
    ));
    
    setReplyText('');
    setSelectedMessage(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#f59e0b';
      case 'replied': return '#10b981';
      case 'resolved': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
        
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <ChatBubbleLeftRightIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Tương Tác Với Gia Đình
            </h1>
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Trả lời câu hỏi và chia sẻ thông tin với gia đình cư dân
          </p>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #f59e0b20'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Tin nhắn mới</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                  {messages.filter(m => m.status === 'new').length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #10b98120'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đã trả lời</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {messages.filter(m => m.status === 'replied').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {messages.map((message) => (
            <div key={message.id} style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: `2px solid ${getStatusColor(message.status)}20`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {message.subject}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getPriorityColor(message.priority)}20`,
                      color: getPriorityColor(message.priority)
                    }}>
                      {message.priority === 'urgent' ? 'Khẩn cấp' : 
                       message.priority === 'high' ? 'Cao' :
                       message.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getStatusColor(message.status)}20`,
                      color: getStatusColor(message.status)
                    }}>
                      {message.status === 'new' ? 'Mới' :
                       message.status === 'replied' ? 'Đã trả lời' : 'Đã giải quyết'}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Từ: {message.familyName} • Cư dân: {message.residentName} • 
                    {new Date(message.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{
                  color: '#374151',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {message.message}
                </p>
              </div>

              {message.attachments && message.attachments.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Tài liệu đính kèm:
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {message.attachments.map((attachment, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: '#e0e7ff',
                        borderRadius: '0.25rem'
                      }}>
                        <PhotoIcon style={{ width: '1rem', height: '1rem', color: '#3730a3' }} />
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#3730a3',
                          fontWeight: 500
                        }}>
                          {attachment}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message.reply && (
                <div style={{
                  padding: '1rem',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#065f46',
                    margin: '0 0 0.5rem 0',
                    fontWeight: 600
                  }}>
                    Phản hồi của bạn ({new Date(message.repliedAt!).toLocaleString('vi-VN')}):
                  </p>
                  <p style={{
                    color: '#047857',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {message.reply}
                  </p>
                </div>
              )}

              {message.status === 'new' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setSelectedMessage(message)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <PaperAirplaneIcon style={{ width: '1rem', height: '1rem' }} />
                    Trả lời
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {messages.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <ChatBubbleLeftRightIcon style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              color: '#d1d5db'
            }} />
            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
              Chưa có tin nhắn nào
            </p>
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
              Tin nhắn từ gia đình sẽ hiển thị ở đây
            </p>
          </div>
        )}

        {/* Reply Modal */}
        {selectedMessage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  margin: 0
                }}>
                  Trả lời tin nhắn
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  style={{
                    padding: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0 0 0.5rem 0'
                }}>
                  Tin nhắn gốc:
                </p>
                <p style={{
                  color: '#374151',
                  margin: 0
                }}>
                  {selectedMessage.message}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Phản hồi của bạn:
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập phản hồi..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setSelectedMessage(null)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleReply(selectedMessage.id)}
                  disabled={!replyText.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: replyText.trim() 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: replyText.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <PaperAirplaneIcon style={{ width: '1rem', height: '1rem' }} />
                  Gửi phản hồi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
