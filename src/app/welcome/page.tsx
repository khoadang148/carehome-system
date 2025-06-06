"use client";

import Link from 'next/link';
import { HeartIcon, PhoneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function WelcomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '5%',
        right: '5%',
        width: '15rem',
        height: '15rem',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(30px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '12rem',
        height: '12rem',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(25px)'
      }} />

      {/* Main content container */}
      <div style={{
        maxWidth: '24rem',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '1.5rem',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        position: 'relative'
      }}>
        {/* Logo and Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          {/* CareHome Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              {/* Sparkles/Stars icon */}
              <div style={{
                position: 'relative',
                width: '2rem',
                height: '2rem'
              }}>
                {/* Main star */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '1.2rem',
                  height: '1.2rem',
                  background: 'white',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }} />
                
                {/* Small stars */}
                <div style={{
                  position: 'absolute',
                  top: '0.15rem',
                  right: '0.15rem',
                  width: '0.5rem',
                  height: '0.5rem',
                  background: 'white',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }} />
                
                <div style={{
                  position: 'absolute',
                  bottom: '0.15rem',
                  left: '0.15rem',
                  width: '0.4rem',
                  height: '0.4rem',
                  background: 'white',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }} />
              </div>
            </div>
          </div>
          
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            color: '#667eea',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.025em'
          }}>
            CareHome
          </h1>
          <p style={{
            fontSize: '1rem',
            fontWeight: 500,
            color: '#64748b',
            margin: '0 0 1.5rem 0'
          }}>
            Hệ thống quản lý viện dưỡng lão
          </p>
        </div>

        {/* Illustration area */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '1.5rem',
          padding: '0.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          minHeight: '14rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Main illustration image */}
          <div style={{
            width: '100%',
            height: '13rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="https://img.freepik.com/premium-vector/professional-nurse-assisting-elderly-person-with-care-support_1324816-36612.jpg"
              alt="Nhân viên y tế chăm sóc người cao tuổi"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '1rem',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
                transform: 'scale(1.1)'
              }}
              onError={(e) => {
                // Fallback in case image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            
            {/* Fallback content if image fails to load */}
            <div style={{
              display: 'none',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              width: '100%',
              height: '100%'
            }}>
              <HeartIcon style={{
                width: '3rem',
                height: '3rem',
                color: '#22c55e',
                fill: '#22c55e',
                opacity: 0.7
              }} />
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                textAlign: 'center',
                margin: 0,
                fontWeight: 500
              }}>
                Chăm sóc tận tâm<br />cho người thân yêu
              </p>
            </div>
          </div>
        </div>

        {/* Main heading */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1f2937',
          margin: '0 0 0.75rem 0',
          lineHeight: 1.3
        }}>
          Ngôi nhà của tình thân
        </h3>

        {/* Subtitle */}
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: '0 0 1.5rem 0',
          lineHeight: 1.5,
          fontWeight: 400
        }}>
          Sự an tâm cho gia đình. Niềm vui và sức khỏe cho người cao tuổi
        </p>

        {/* Login Button */}
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.4)',
            marginBottom: '1.5rem'
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px 0 rgba(34, 197, 94, 0.5)';
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px 0 rgba(34, 197, 94, 0.4)';
          }}>
            Đăng nhập
          </button>
        </Link>

        {/* Bottom buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <Link href="/news" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#16a34a',
              fontSize: '0.9rem',
              fontWeight: 500,
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(34, 197, 94, 0.15)';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(34, 197, 94, 0.1)';
            }}>
              <DocumentTextIcon style={{ width: '1rem', height: '1rem' }} />
              Tin tức
            </button>
          </Link>
          
          <Link href="/contact" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#2563eb',
              fontSize: '0.9rem',
              fontWeight: 500,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.15)';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.1)';
            }}>
              <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
              Liên hệ
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 