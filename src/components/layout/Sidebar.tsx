"use client";

import { useState, useMemo, memo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import OptimizedLink from '../OptimizedLink';
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
  PhotoIcon
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

const menuGroups: MenuGroup[] = [
  {
    title: "Quản lý chính",
    items: [
      { name: 'Màn hình chính', href: '/admin', icon: HomeIcon, roles: ['admin'], color: '#667eea' },
      { name: 'Màn hình chính', href: '/staff', icon: HomeIcon, roles: ['staff'], color: '#667eea' },
      { name: 'Người cao tuổi', href: '/admin/residents', icon: UserIcon, roles: ['admin'], color: '#10b981' },
      { name: 'Nhân viên', href: '/admin/staff-management', icon: UsersIcon, roles: ['admin'], color: '#6366f1' },
      { name: 'Quản lý chăm sóc', href: '/staff/residents', icon: UserGroupIcon, roles: ['staff'], color: '#6366f1' },
      { name: 'Danh sách người cao tuổi', href: '/staff/residents/view', icon: UsersIcon, roles: ['staff'], color: '#6366f1' },
    ]
  },
  {
    title: "Lối tắt chăm sóc",
    items: [
      { name: 'Ghi chú chăm sóc', href: '/staff/assessments', icon: HeartIcon, roles: ['staff'], color: '#3b82f6' },
      { name: 'Đăng ảnh hoạt động', href: '/staff/photos', icon: PhotoIcon, roles: ['staff'], color: '#f59e0b' },
    ]
  },
  {
    title: "Chương trình & Gia đình",
    items: [
      { name: 'Hoạt động sinh hoạt', href: '/activities', icon: CalendarIcon, roles: ['admin'], color: '#f59e0b' },
      { name: 'Hoạt động sinh hoạt', href: '/staff/activities', icon: CalendarIcon, roles: ['staff'], color: '#3b82f6' },
      { name: 'Trợ lý thông minh', href: '/admin/ai-recommendations', icon: SparklesIcon, roles: ['admin'], color: '#8b5cf6' },
      { name: 'Thông tin', href: '/family', icon: UserGroupIcon, roles: ['family'], color: '#ec4899' },
      { name: 'Lịch thăm', href: '/family/schedule-visit', icon: CalendarIcon, roles: ['family'], color: '#6366f1' },
      { name: 'Ảnh', href: '/family/photos', icon: PhotoIcon, roles: ['family'], color: '#6366f1' },
      { name: 'Dịch vụ', href: '/services', icon: CubeIcon, roles: ['staff', 'admin'], color: '#6366f1' },
      { name: 'Dịch vụ', href: '/family/services', icon: CubeIcon, roles: ['family'], color: '#6366f1' },
    ]
  },
  {
    title: "Dữ liệu & Báo cáo",
    items: [
      { name: 'Hóa đơn', href: '/family/finance', icon: BanknotesIcon, roles: ['family'], color: '#16a34a' },
      { name: 'Hóa đơn', href: '/admin/financial-reports', icon: BanknotesIcon, roles: ['admin'], color: '#16a34a' }
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { name: 'Quản lý người dùng', href: '/admin/account-management', icon: ShieldCheckIcon, roles: ['admin'], color: '#6d28d9' }
    ]
  }
];

const MenuItemComponent = memo(({ item, isActive, collapsed }: { 
  item: MenuItem; 
  isActive: boolean; 
  collapsed: boolean; 
}) => {
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (collapsed) {
      const tooltip = document.createElement('div');
      tooltip.innerText = item.name;
      tooltip.style.position = 'fixed';
      tooltip.style.left = (e.currentTarget.getBoundingClientRect().right + 10) + 'px';
      tooltip.style.top = (e.currentTarget.getBoundingClientRect().top + e.currentTarget.offsetHeight / 2 - 18) + 'px';
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
      (e.currentTarget as any)._tooltip = tooltip;
    }
  }, [collapsed, item.name]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (collapsed && (e.currentTarget as any)._tooltip) {
      document.body.removeChild((e.currentTarget as any)._tooltip);
      (e.currentTarget as any)._tooltip = undefined;
    }
  }, [collapsed]);

  return (
    <li style={{ position: 'relative' }}>
      <OptimizedLink
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
      </OptimizedLink>
    </li>
  );
});

MenuItemComponent.displayName = 'MenuItemComponent';

const SidebarFooter = memo(() => (
  <div style={{
    padding: '1.25rem',
    borderTop: '1px solid #e2e8f0',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
  }}>
    <div style={{
      background: 'linear-gradient(135deg,rgb(17, 132, 240) 0%,rgb(58, 139, 237) 100%)',
      color: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 12px -1px rgba(139, 92, 246, 0.18)'
    }}>
      <div style={{
        position: 'absolute',
        top: '-40%',
        right: '-20%',
        width: '80%',
        height: '180%',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
        borderRadius: '50%'
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>
          Viện Dưỡng Lão CareHome
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
          123 Đường Hạnh Phúc, Quận 1, TP.HCM
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
          ☎ 028-1234-5678
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
          ✉ lienhe@carehome.com
        </div>
      </div>
    </div>
  </div>
));

SidebarFooter.displayName = 'SidebarFooter';

function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  
  const userRole = user?.role || null;

  const filteredMenuGroups = useMemo(() => {
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => userRole && item.roles.includes(userRole))
    })).filter(group => group.items.length > 0);
  }, [userRole]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

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
      height: 'calc(100vh + 1rem)',
      position: 'relative',
      zIndex: 20,
      flexShrink: 0,
      marginTop: '0'
    }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.3rem',
              height: '2.3rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <SparklesIcon style={{ width: '1.375rem', height: '1.375rem', color: 'white' }} />
            </div>
            <div>
              <div style={{
                fontSize: '1.375rem',
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
          onClick={toggleCollapsed}
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
            <ChevronRightIcon style={{ width: '1rem', height: '1rem' }} /> :
            <ChevronLeftIcon style={{ width: '1rem', height: '1rem' }} />
          }
        </button>
      </div>

      <nav style={{ flexGrow: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {filteredMenuGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{ marginBottom: '2rem' }}>
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
              {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                  <MenuItemComponent
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                  />
                  );
                })}
              </ul>
            </div>
        ))}
      </nav>

      {!collapsed && user && <SidebarFooter />}
    </div>
  );
} 

export default memo(Sidebar); 
