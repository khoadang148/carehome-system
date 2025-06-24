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
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth, UserRole } from '@/lib/contexts/auth-context';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  roles: UserRole[];
  color: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// Phân loại menu theo nhóm chức năng
const menuGroups: MenuGroup[] = [
 
  {
    title: "Quản lý chính",
    items: [
      { name: 'Màn hình chính', href: '/', icon: HomeIcon, roles: ['admin','staff'], color: '#667eea' },
      { name: 'Người cao tuổi', href: '/residents', icon: UserIcon, roles: ['admin', 'staff'], color: '#10b981' },
      { name: 'Nhân viên', href: '/staff', icon: UsersIcon, roles: ['admin'], color: '#3b82f6' },
    ]
  },
  {
    title: "Lối tắt chăm sóc",
    items: [
      { name: 'Nhật ký theo dõi', href: '/staff/care-notes', icon: HeartIcon, roles: ['staff'], color: '#3b82f6' },
      { name: 'Đăng ảnh hoạt động', href: '/residents/photos', icon: PhotoIcon, roles: ['staff'], color: '#f59e0b' },
      { name: 'Tương tác gia đình', href: '/staff/family-communication', icon: ChatBubbleLeftRightIcon, roles: ['staff'], color: '#f59e0b' },
      
    ]
  },
  {
    title: "Chương trình & Gia đình",
    items: [
      { name: 'Chương trình sinh hoạt', href: '/activities', icon: CalendarIcon, roles: ['staff'], color: '#f59e0b' },
      { name: 'Trợ lý thông minh', href: '/ai-recommendations', icon: SparklesIcon, roles: ['staff'], color: '#8b5cf6' },
      { name: 'Thông tin người thân', href: '/family', icon: UserGroupIcon, roles: ['family'], color: '#ec4899' },
      { name: 'Liên hệ với nhân viên', href: '/family/contact-staff', icon: ChatBubbleLeftRightIcon, roles: ['family'], color: '#6366f1' },
      { name: 'Lịch thăm', href: '/family/schedule-visit', icon: CalendarIcon, roles: ['family'], color: '#6366f1' },
      { name: 'Ảnh', href: '/family/photos', icon: PhotoIcon, roles: ['family'], color: '#6366f1' },
      { name: 'Dịch vụ', href: '/services', icon: CubeIcon, roles: ['admin', 'family'], color: '#6366f1' },
      
    ]
  },
  {
    title: "Dữ liệu & Báo cáo",
    items: [
      { name: 'Tài chính', href: '/finance', icon: BanknotesIcon, roles: ['family'], color: '#16a34a' },
      { name: 'Tài chính', href: '/admin/financial-reports', icon: BanknotesIcon, roles: ['admin'], color: '#16a34a' }

    ]
  },
  {
    title: "Hệ thống",
    items: [
      { name: 'Tài khoản nhân viên', href: '/permissions', icon: ShieldCheckIcon, roles: ['admin'], color: '#6d28d9' },
      { name: 'Tài khoản gia đình', href: '/admin/family-accounts', icon: ShieldCheckIcon, roles: ['admin'], color: '#6d28d9' }
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
      height: '100vh',
      position: 'relative',
      zIndex: 20,
      flexShrink: 0
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
                    <li key={item.href} style={{position: 'relative'}}>
                      <Link
                        href={item.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          color: isActive ? item.color : '#64748b',
                          background: isActive ? `${item.color}10` : 'transparent',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.transform = 'translateX(0.25rem)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }
                        }}
                        onMouseEnter={e => {
                          if (collapsed) {
                            const tooltip = document.createElement('div');
                            tooltip.innerText = item.name;
                            tooltip.style.position = 'fixed';
                            tooltip.style.left = (e.currentTarget.getBoundingClientRect().right + 10) + 'px';
                            tooltip.style.top = (e.currentTarget.getBoundingClientRect().top + e.currentTarget.offsetHeight/2 - 18) + 'px';
                            tooltip.style.background = 'rgba(31, 41, 55, 0.95)';
                            tooltip.style.color = 'white';
                            tooltip.style.padding = '0.5rem 1rem';
                            tooltip.style.borderRadius = '0.5rem';
                            tooltip.style.fontSize = '0.95rem';
                            tooltip.style.fontWeight = '600';
                            tooltip.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
                            tooltip.style.zIndex = '9999';
                            tooltip.style.pointerEvents = 'none';
                            tooltip.className = 'sidebar-tooltip';
                            document.body.appendChild(tooltip);
                            (e.currentTarget as HTMLAnchorElement & { _tooltip?: HTMLDivElement })._tooltip = tooltip;
                          }
                        }}
                        onMouseLeave={e => {
                          if (collapsed && (e.currentTarget as HTMLAnchorElement & { _tooltip?: HTMLDivElement })._tooltip) {
                            document.body.removeChild((e.currentTarget as HTMLAnchorElement & { _tooltip?: HTMLDivElement })._tooltip!);
                            (e.currentTarget as HTMLAnchorElement & { _tooltip?: HTMLDivElement })._tooltip = undefined;
                          }
                        }}
                      >
                        <item.icon style={{
                          width: '1.25rem',
                          height: '1.25rem',
                          color: isActive ? item.color : '#64748b'
                        }} />
                        {!collapsed && (
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.name}
                          </span>
                        )}
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '0.25rem',
                            background: item.color,
                            borderRadius: '0.125rem'
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
            color: 'white', 
            borderRadius: '0.75rem', 
            padding: '1.25rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px -1px rgba(139, 92, 246, 0.18)'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-40%',
              right: '-20%',
              width: '80%',
              height: '180%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
              borderRadius: '50%'
            }} />
            <div style={{position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <div style={{fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.25rem'}}>
                Viện Dưỡng Lão CareHome
              </div>
              <div style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500}}>
                123 Đường Hạnh Phúc, Quận 1, TP.HCM
              </div>
              <div style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500}}>
                ☎ 028-1234-5678
              </div>
              <div style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500}}>
                ✉ lienhe@carehome.com
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
