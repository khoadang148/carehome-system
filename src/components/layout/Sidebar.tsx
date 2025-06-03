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
  CubeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

// Phân loại menu theo nhóm chức năng
const menuGroups = [
  {
    title: "Quản lý chính",
    items: [
      { name: 'Tổng quan', href: '/', icon: HomeIcon, roles: ['admin', 'staff'] },
      { name: 'Cư dân', href: '/residents', icon: UserIcon, roles: ['admin', 'staff'] },
      { name: 'Nhân viên', href: '/staff', icon: UsersIcon, roles: ['admin'] },
    ]
  },
  {
    title: "Hoạt động & Gia đình",
    items: [
      { name: 'Hoạt động', href: '/activities', icon: CalendarIcon, roles: ['admin', 'staff', 'family'] },
      { name: 'Dịch vụ', href: '/services', icon: CubeIcon, roles: ['admin', 'staff', 'family'] },
      { name: 'Cổng gia đình', href: '/family', icon: UserGroupIcon, roles: ['admin', 'family'] },
    ]
  },
  {
    title: "Dữ liệu & Báo cáo",
    items: [
      { name: 'Báo cáo', href: '/reports', icon: ChartBarIcon, roles: ['admin', 'staff'] },
      { name: 'Tài chính', href: '/finance', icon: BanknotesIcon, roles: ['admin'] },
      { name: 'Hồ sơ y tế', href: '/medical', icon: ClipboardDocumentListIcon, roles: ['admin', 'staff'] },
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { name: 'Quyền hạn', href: '/permissions', icon: ShieldCheckIcon, roles: ['admin'] },
      { name: 'Cài đặt', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'] },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role || null; // Use null if no user is logged in
  
  // Hide sidebar completely if no user is logged in
  if (!user) {
    return null;
  }
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      width: collapsed ? '5rem' : '18rem',
      transition: 'width 0.3s',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4rem',
        padding: '0 1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {!collapsed && (
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#0ea5e9'
          }}>
            CareHome
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '0.375rem',
            borderRadius: '0.375rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            marginLeft: collapsed ? 'auto' : undefined
          }}
        >
          {collapsed ? 
            <ChevronRightIcon style={{width: '1rem', height: '1rem'}} /> : 
            <ChevronLeftIcon style={{width: '1rem', height: '1rem'}} />
          }
        </button>
      </div>
      
      <nav style={{flexGrow: 1, overflowY: 'auto', padding: '1rem 0.75rem'}}>
        {menuGroups.map((group, groupIndex) => {
          // Lọc các menu item theo role người dùng
          const filteredItems = group.items.filter(item => userRole && item.roles.includes(userRole));
          
          // Chỉ hiển thị nhóm nếu có ít nhất 1 menu item phù hợp với role
          if (filteredItems.length === 0) return null;
          
          return (
            <div key={groupIndex} style={{marginBottom: '1.5rem'}}>
              {/* Tiêu đề nhóm menu - ẩn khi sidebar thu gọn */}
              {!collapsed && (
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  padding: '0 0.5rem',
                  marginBottom: '0.5rem'
                }}>
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
                gap: '0.25rem'
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
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          color: isActive ? '#0284c7' : '#4b5563',
                          backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                          fontWeight: isActive ? 500 : 'normal',
                          transition: 'background-color 0.2s, color 0.2s'
                        }}
                      >
                        <item.icon style={{
                          width: '1rem', 
                          height: '1rem',
                          flexShrink: 0,
                          marginRight: collapsed ? 0 : '0.75rem',
                          margin: collapsed ? '0 auto' : undefined
                        }} />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      
      {!collapsed && user && (
        <div style={{padding: '1rem', borderTop: '1px solid #e5e7eb'}}>
          <div style={{
            backgroundColor: '#f0f9ff', 
            color: '#0c4a6e', 
            borderRadius: '0.5rem', 
            padding: '0.75rem'
          }}>
            <div style={{fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem'}}>
              {user.role === 'admin' ? 'Quản trị viên' : 
               user.role === 'staff' ? 'Nhân viên' : 'Thành viên gia đình'}
            </div>
            <p style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>
              Liên hệ hỗ trợ: 555-123-4567
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 