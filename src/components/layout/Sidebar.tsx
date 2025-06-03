"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UserIcon, 
  UsersIcon, 
  CalendarIcon, 
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

// Phân loại menu theo nhóm chức năng
const menuGroups = [
  {
    title: "Quản lý chính",
    items: [
      { name: 'Tổng quan', href: '/', icon: HomeIcon, roles: ['admin', 'staff'], color: '#667eea' },
      { name: 'Cư dân', href: '/residents', icon: UserIcon, roles: ['admin', 'staff'], color: '#10b981' },
      { name: 'Nhân viên', href: '/staff', icon: UsersIcon, roles: ['admin'], color: '#3b82f6' },
    ]
  },
  {
    title: "Hoạt động & Gia đình",
    items: [
      { name: 'Hoạt động', href: '/activities', icon: CalendarIcon, roles: ['admin', 'staff', 'family'], color: '#f59e0b' },
      { name: 'Dịch vụ', href: '/services', icon: CubeIcon, roles: ['admin', 'staff', 'family'], color: '#8b5cf6' },
      { name: 'Cổng gia đình', href: '/family', icon: UserGroupIcon, roles: ['admin', 'family'], color: '#ec4899' },
    ]
  },
  {
    title: "Dữ liệu & Báo cáo",
    items: [
      { name: 'Báo cáo', href: '/reports', icon: ChartBarIcon, roles: ['admin', 'staff'], color: '#06b6d4' },
      { name: 'Tài chính', href: '/finance', icon: BanknotesIcon, roles: ['admin'], color: '#16a34a' },
      { name: 'Hồ sơ y tế', href: '/medical', icon: ClipboardDocumentListIcon, roles: ['admin', 'staff'], color: '#dc2626' },
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { name: 'Quyền hạn', href: '/permissions', icon: ShieldCheckIcon, roles: ['admin'], color: '#7c3aed' },
      { name: 'Cài đặt', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'], color: '#6b7280' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role || null;
  
  // Hide sidebar completely if no user is logged in
  if (!user) {
    return null;
  }
  
  return (
    <div style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      borderRight: '1px solid #e2e8f0',
      boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.05), 2px 0 4px -1px rgba(0, 0, 0, 0.03)',
      width: collapsed ? '5rem' : '19rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* Header section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.5rem',
        padding: '0 1.25rem',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {!collapsed && (
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <div style={{
              width: '2rem',
              height: '2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <SparklesIcon style={{width: '1.125rem', height: '1.125rem', color: 'white'}} />
            </div>
            <div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#1e293b',
                letterSpacing: '-0.025em'
              }}>
                CareHome
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#64748b',
                fontWeight: 500
              }}>
                Quản lý thông minh
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            cursor: 'pointer',
            marginLeft: collapsed ? 'auto' : undefined,
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {collapsed ? 
            <ChevronRightIcon style={{width: '1rem', height: '1rem'}} /> : 
            <ChevronLeftIcon style={{width: '1rem', height: '1rem'}} />
          }
        </button>
      </div>
      
      {/* Navigation */}
      <nav style={{flexGrow: 1, overflowY: 'auto', padding: '1.25rem'}}>
        {menuGroups.map((group, groupIndex) => {
          const filteredItems = group.items.filter(item => userRole && item.roles.includes(userRole));
          
          if (filteredItems.length === 0) return null;
          
          return (
            <div key={groupIndex} style={{marginBottom: '2rem'}}>
              {/* Group title */}
              {!collapsed && (
                <div style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0 0.75rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '0.25rem',
                    height: '0.25rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }} />
                  {group.title}
                </div>
              )}
              
              <ul style={{
                paddingLeft: 0, 
                paddingRight: 0, 
                listStyle: 'none', 
                margin: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.375rem'
              }}>
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.875rem 1rem',
                          borderRadius: '0.75rem',
                          color: isActive ? 'white' : '#475569',
                          background: isActive 
                            ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`
                            : 'transparent',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.875rem',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          textDecoration: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          border: isActive ? 'none' : '1px solid transparent',
                          boxShadow: isActive ? `0 4px 6px -1px ${item.color}33, 0 2px 4px -1px ${item.color}22` : 'none'
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.color = item.color;
                            e.currentTarget.style.transform = 'translateX(2px)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.color = '#475569';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }
                        }}
                      >
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.5rem',
                          background: isActive 
                            ? 'rgba(255,255,255,0.2)' 
                            : 'rgba(255,255,255,0.5)',
                          marginRight: collapsed ? 0 : '0.75rem',
                          margin: collapsed ? '0 auto' : undefined,
                          transition: 'all 0.2s ease-in-out'
                        }}>
                          <item.icon style={{
                            width: '1.125rem', 
                            height: '1.125rem',
                            flexShrink: 0
                          }} />
                        </div>
                        {!collapsed && (
                          <span style={{
                            flex: 1,
                            letterSpacing: '-0.01em'
                          }}>
                            {item.name}
                          </span>
                        )}
                        
                        {/* Active indicator */}
                        {isActive && !collapsed && (
                          <div style={{
                            width: '0.25rem',
                            height: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '0.125rem',
                            opacity: 0.8
                          }} />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      
      {/* Footer section */}
      {!collapsed && user && (
        <div style={{
          padding: '1.25rem', 
          borderTop: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            borderRadius: '0.75rem', 
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.25)'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-25%',
              width: '100%',
              height: '200%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
              borderRadius: '50%'
            }} />
            
            <div style={{position: 'relative', zIndex: 1}}>
              <div style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserIcon style={{width: '0.875rem', height: '0.875rem'}} />
                </div>
                {user.role === 'admin' ? 'Quản trị viên' : 
                 user.role === 'staff' ? 'Nhân viên' : 'Thành viên gia đình'}
              </div>
              <div style={{
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500
              }}>
                {user.name}
              </div>
              <div style={{
                fontSize: '0.6875rem', 
                color: 'rgba(255,255,255,0.7)',
                marginTop: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                Hỗ trợ: 555-123-4567
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 