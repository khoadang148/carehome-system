"use client";

import Link from 'next/link';
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
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
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937',
            margin: '0 0 1.5rem 0'
          }}>
            Gửi tin nhắn
          </h2>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Họ và tên"
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            
            <input
              type="tel"
              placeholder="Số điện thoại"
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            
            <textarea
              placeholder="Nội dung tin nhắn"
              rows={4}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            
            <button
              type="submit"
              style={{
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              Gửi tin nhắn
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 