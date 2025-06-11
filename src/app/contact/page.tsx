"use client";

import Link from 'next/link';
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, CheckCircleIcon, XMarkIcon, BellIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Remove notification after 5 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 8000); // Longer duration for professional feel
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ tên phải có ít nhất 2 ký tự';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(\+84|84|0)?[3|5|7|8|9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Vui lòng nhập nội dung tin nhắn';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Nội dung tin nhắn phải có ít nhất 10 ký tự';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const messageId = `CTT-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Professional notification
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Tin nhắn đã được gửi thành công',
        message: `Mã tin nhắn: ${messageId} • Nhận từ: ${formData.name} • SĐT: ${formData.phone}`,
        timestamp: timestamp
      }]);
      
      // Show success message in form
      setShowSuccessMessage(true);
      
      // Reset form
      setFormData({ name: '', phone: '', message: '' });
      setFormErrors({});
    } catch (error) {
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'error',
        title: 'Lỗi khi gửi tin nhắn',
        message: 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau ít phút.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes successPulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Professional Notification Banner */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: 10000,
          background: notifications[notifications.length - 1]?.type === 'success'
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideDown 0.4s ease-out'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: '0 0 0.25rem 0'
                }}>
                  {notifications[notifications.length - 1]?.title}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  opacity: 0.9
                }}>
                  {notifications[notifications.length - 1]?.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.slice(0, -1))}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>
      )}

      {/* Notification Tab */}
      <div
        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
        style={{
          position: 'fixed',
          top: '50%',
          right: '0',
          transform: 'translateY(-50%)',
          zIndex: 9998,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          padding: '0.75rem 0.5rem',
          borderRadius: '0.75rem 0 0 0.75rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) translateX(-8px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) translateX(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }}
      >
        <BellIcon style={{ width: '1.25rem', height: '1.25rem' }} />
        {notifications.length > 0 && (
          <div style={{
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '1.25rem',
            height: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: 700,
            position: 'absolute',
            top: '-0.25rem',
            right: '-0.25rem',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {notifications.length > 9 ? '9+' : notifications.length}
          </div>
        )}
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}>
          Thông báo
        </span>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div style={{
          position: 'fixed',
          top: '0',
          right: '0',
          width: '400px',
          height: '100vh',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          zIndex: 9997,
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#111827',
                margin: 0
              }}>
                Thông báo
              </h3>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.25rem 0 0 0'
              }}>
                {notifications.length} thông báo
              </p>
            </div>
            <button
              onClick={() => setShowNotificationPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                <BellIcon style={{ width: '3rem', height: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Chưa có thông báo nào
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: notification.type === 'success' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : notification.type === 'error'
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: 'white'
                      }}>
                        {notification.type === 'success' && (
                          <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                        {notification.type === 'error' && (
                          <XCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                        {notification.type === 'info' && (
                          <InformationCircleIcon style={{ width: '1rem', height: '1rem' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          margin: '0 0 0.25rem 0',
                          color: '#111827',
                          lineHeight: 1.4
                        }}>
                          {notification.title}
                        </h4>
                        <p style={{
                          fontSize: '0.75rem',
                          margin: '0 0 0.5rem 0',
                          color: '#6b7280',
                          lineHeight: 1.4
                        }}>
                          {notification.message}
                        </p>
                        <p style={{
                          fontSize: '0.625rem',
                          margin: 0,
                          color: '#9ca3af'
                        }}>
                          {new Date(notification.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <XMarkIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              <button
                onClick={() => setNotifications([])}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Xóa tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Notification Toasts */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: showNotificationPanel ? '420px' : '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
        transition: 'right 0.3s ease'
      }}>
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            style={{
              background: notification.type === 'success' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : notification.type === 'error'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '0.125rem'
              }}>
                <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  margin: '0 0 0.25rem 0',
                  lineHeight: 1.4
                }}>
                  {notification.title}
                </h4>
                <p style={{
                  fontSize: '0.75rem',
                  margin: 0,
                  opacity: 0.9,
                  lineHeight: 1.4
                }}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <Link href="/welcome" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#667eea',
          textDecoration: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          marginBottom: '1rem'
        }}>
          <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          Quay lại
        </Link>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1f2937',
          margin: '0 0 0.5rem 0',
          textAlign: 'center'
        }}>
          Liên hệ
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#6b7280',
          textAlign: 'center',
          margin: 0
        }}>
          Chúng tôi luôn sẵn sàng hỗ trợ bạn
        </p>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {/* Contact Info */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937',
            margin: '0 0 1.5rem 0'
          }}>
            Thông tin liên hệ
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
              <span style={{ color: '#374151' }}>1900 1234</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
              <span style={{ color: '#374151' }}>info@carehome.vn</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <MapPinIcon style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', marginTop: '0.125rem' }} />
              <span style={{ color: '#374151' }}>123 Đường ABC, Quận 1, TP.HCM</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937',
            margin: '0 0 1.5rem 0'
          }}>
            Gửi tin nhắn
          </h2>

          {/* Success Message */}
          {showSuccessMessage && (
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              border: '1px solid #10b981',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              animation: 'successPulse 2s infinite'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                <div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#065f46',
                    margin: '0 0 0.25rem 0'
                  }}>
                    Tin nhắn đã được gửi thành công!
                  </h4>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#047857',
                    margin: 0
                  }}>
                    Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ phản hồi trong vòng 24 giờ.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Name Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Họ và tên *
              </label>
            <input
              type="text"
                placeholder="Nhập họ và tên đầy đủ"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) {
                    setFormErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
              style={{
                  width: '100%',
                padding: '0.75rem',
                  border: formErrors.name ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  background: formErrors.name ? '#fef2f2' : 'white'
                }}
                onFocus={(e) => !formErrors.name && (e.target.style.borderColor = '#22c55e')}
                onBlur={(e) => !formErrors.name && (e.target.style.borderColor = '#d1d5db')}
              />
              {formErrors.name && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  margin: '0.25rem 0 0 0'
                }}>
                  {formErrors.name}
                </p>
              )}
            </div>
            
            {/* Phone Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Số điện thoại *
              </label>
            <input
              type="tel"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, phone: e.target.value }));
                  if (formErrors.phone) {
                    setFormErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
              style={{
                  width: '100%',
                padding: '0.75rem',
                  border: formErrors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  background: formErrors.phone ? '#fef2f2' : 'white'
                }}
                onFocus={(e) => !formErrors.phone && (e.target.style.borderColor = '#22c55e')}
                onBlur={(e) => !formErrors.phone && (e.target.style.borderColor = '#d1d5db')}
              />
              {formErrors.phone && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  margin: '0.25rem 0 0 0'
                }}>
                  {formErrors.phone}
                </p>
              )}
            </div>
            
            {/* Message Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nội dung tin nhắn *
              </label>
            <textarea
                placeholder="Nhập nội dung tin nhắn (tối thiểu 10 ký tự)"
              rows={4}
                value={formData.message}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, message: e.target.value }));
                  if (formErrors.message) {
                    setFormErrors(prev => ({ ...prev, message: '' }));
                  }
                }}
              style={{
                  width: '100%',
                padding: '0.75rem',
                  border: formErrors.message ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.2s ease',
                  background: formErrors.message ? '#fef2f2' : 'white',
                  minHeight: '100px'
                }}
                onFocus={(e) => !formErrors.message && (e.target.style.borderColor = '#22c55e')}
                onBlur={(e) => !formErrors.message && (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.25rem'
              }}>
                {formErrors.message ? (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    margin: 0
                  }}>
                    {formErrors.message}
                  </p>
                ) : (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    margin: 0
                  }}>
                    Mô tả chi tiết nhu cầu của bạn
                  </p>
                )}
                <span style={{
                  fontSize: '0.75rem',
                  color: formData.message.length < 10 ? '#ef4444' : '#9ca3af'
                }}>
                  {formData.message.length}/10
                </span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '1rem',
                background: isSubmitting 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: !isSubmitting ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                }
              }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Đang gửi...
                </div>
              ) : (
                'Gửi tin nhắn'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
