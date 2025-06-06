"use client";

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  UsersIcon, 
  CalendarIcon, 
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

// Mock data for dashboard
const stats = [
  { 
    name: 'Tổng số cư dân', 
    value: '124', 
    change: '+2%', 
    trend: 'up', 
    icon: UserIcon, 
    color: '#667eea',
    bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    lightBg: 'rgba(102, 126, 234, 0.1)'
  },
  { 
    name: 'Tổng số nhân viên', 
    value: '45', 
    change: '-1%', 
    trend: 'down', 
    icon: UsersIcon, 
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    lightBg: 'rgba(16, 185, 129, 0.1)'
  },
  { 
    name: 'Hoạt động hôm nay', 
    value: '8', 
    change: '+3', 
    trend: 'up', 
    icon: CalendarIcon, 
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    lightBg: 'rgba(245, 158, 11, 0.1)'
  },
  { 
    name: 'Tỷ lệ cư dân hiện tại', 
    value: '92%', 
    change: '+5%', 
    trend: 'up', 
    icon: ChartBarIcon, 
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    lightBg: 'rgba(139, 92, 246, 0.1)'
  },
];

const recentActivities = [
  { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00 AM', participants: 18, location: 'Phòng sinh hoạt chung', status: 'active' },
  { id: 2, name: 'Mỹ thuật & Thủ công', time: '10:30 AM', participants: 12, location: 'Phòng hoạt động', status: 'upcoming' },
  { id: 3, name: 'Bữa trưa', time: '12:00 PM', participants: 124, location: 'Phòng ăn', status: 'upcoming' },
  { id: 4, name: 'Liệu pháp âm nhạc', time: '02:00 PM', participants: 25, location: 'Khu vực vườn', status: 'upcoming' },
  { id: 5, name: 'Trò chơi buổi chiều', time: '04:00 PM', participants: 20, location: 'Phòng giải trí', status: 'upcoming' },
];

const alerts = [
  { id: 1, message: 'Đến giờ uống thuốc cho phòng 204', time: '10 phút trước', type: 'urgent' },
  { id: 2, message: 'Họp nhân viên hôm nay lúc 3:00 PM', time: '30 phút trước', type: 'info' },
  { id: 3, message: 'Cư dân mới sẽ đến vào ngày mai', time: '2 giờ trước', type: 'info' },
  { id: 4, message: 'Yêu cầu bảo trì phòng 115', time: '3 giờ trước', type: 'warning' },
];

const systemStats = [
  { label: 'Phòng trống', value: '8/132', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { label: 'Nhân viên trực', value: '24', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { label: 'Nhiệt độ', value: '24°C', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { label: 'Báo động', value: '0', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
];

const quickActions = [
  { 
    name: 'Thêm cư dân', 
    href: '/residents/add', 
    icon: UserIcon, 
    color: '#667eea',
    bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    lightBg: 'rgba(102, 126, 234, 0.1)'
  },
  { 
    name: 'Lịch làm việc', 
    href: '/staff/schedule', 
    icon: ClockIcon, 
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    lightBg: 'rgba(16, 185, 129, 0.1)'
  },
  { 
    name: 'Tạo hoạt động', 
    href: '/activities/new', 
    icon: CalendarIcon, 
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    lightBg: 'rgba(245, 158, 11, 0.1)'
  },
  { 
    name: 'Xem báo cáo', 
    href: '/reports', 
    icon: ChartBarIcon, 
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    lightBg: 'rgba(139, 92, 246, 0.1)'
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('activities');
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!user) {
      router.push('/welcome');
    } else if (user.role === 'family') {
      router.push('/family');
    }
  }, [user, router]);
  
  if (!user || user.role === 'family') {
    return null;
  }
  
  return (
    <div style={{
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem', 
            fontWeight: 700, 
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em'
          }}>
            Bảng điều khiển
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: '0.5rem 0 0 0',
            fontWeight: 500
          }}>
            Chào mừng trở lại, {user.name}
          </p>
        </div>
        <div style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '0.875rem', 
            color: '#64748b',
            fontWeight: 500,
            marginBottom: '0.25rem'
          }}>
            Hôm nay
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#1e293b'
          }}>
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, index) => (
            <div 
              key={stat.name} 
              style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem', 
                padding: '1.5rem', 
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-25%',
              width: '100%',
              height: '200%',
              background: stat.lightBg,
              borderRadius: '50%',
              opacity: 0.5
            }} />
            
            <div style={{position: 'relative', zIndex: 1}}>
              <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                <div style={{flex: 1}}>
                  <p style={{
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#64748b',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {stat.name}
                  </p>
                  <p style={{
                    fontSize: '2.25rem', 
                    fontWeight: 700, 
                    color: '#1e293b', 
                    margin: '0 0 0.75rem 0',
                    letterSpacing: '-0.025em'
                  }}>
                    {stat.value}
                  </p>
                  <div style={{display: 'flex', alignItems: 'center', fontSize: '0.875rem'}}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: stat.trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                    }}>
                      {stat.trend === 'up' ? (
                        <ArrowUpIcon style={{width: '0.875rem', height: '0.875rem', color: '#10b981', marginRight: '0.25rem'}} />
                      ) : (
                        <ArrowDownIcon style={{width: '0.875rem', height: '0.875rem', color: '#ef4444', marginRight: '0.25rem'}} />
                      )}
                      <span style={{
                        color: stat.trend === 'up' ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                    {stat.change}
                  </span>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: stat.bgGradient,
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 16px -4px ${stat.color}40`
                }}>
                  <stat.icon style={{width: '1.75rem', height: '1.75rem', color: 'white'}} />
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      {/* Main Content Grid */}
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem'}}>
        
        {/* Quick Actions */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#1e293b', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <SparklesIcon style={{width: '1.25rem', height: '1.25rem', color: '#667eea'}} />
              Thao tác nhanh
            </h2>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
            {quickActions.map((action, index) => (
              <Link 
                key={action.name}
                href={action.href} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  background: action.lightBg,
                  borderRadius: '0.75rem', 
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textDecoration: 'none',
                  border: '1px solid transparent'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = action.color + '40';
                  e.currentTarget.style.boxShadow = `0 8px 16px -4px ${action.color}30`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: action.bgGradient,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.75rem',
                  boxShadow: `0 4px 8px -2px ${action.color}40`
                }}>
                  <action.icon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                </div>
                <span style={{
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#1e293b'
                }}>
                  {action.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* System Stats */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: '#1e293b', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ChartBarIcon style={{width: '1.25rem', height: '1.25rem', color: '#667eea'}} />
            Thông tin hệ thống
          </h3>
          
          <div style={{display: 'grid', gap: '1rem'}}>
            {systemStats.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem', 
                background: item.bgColor,
                borderRadius: '0.75rem',
                border: `1px solid ${item.color}20`,
                transition: 'all 0.2s ease-in-out'
              }}>
                <span style={{fontSize: '0.875rem', color: '#64748b', fontWeight: 500}}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: item.color,
                  padding: '0.25rem 0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: `1px solid ${item.color}20`
                }}>
                  {item.value}
                </span>
              </div>
            ))}
              </div>
          </div>
        </div>
        
      {/* Tabbed Information */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1rem', 
        overflow: 'hidden', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Tab Headers */}
        <div style={{
          display: 'flex', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid #e2e8f0'
        }}>
            <button
              onClick={() => setActiveTab('activities')}
              style={{
              padding: '1rem 1.5rem',
                fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'activities' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: activeTab === 'activities' ? 'white' : '#64748b',
              borderRadius: activeTab === 'activities' ? '0.5rem 0.5rem 0 0' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
          >
            Hoạt động hôm nay
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              style={{
              padding: '1rem 1.5rem',
                fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'alerts' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: activeTab === 'alerts' ? 'white' : '#64748b',
              borderRadius: activeTab === 'alerts' ? '0.5rem 0.5rem 0 0' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              whiteSpace: 'nowrap'
            }}
          >
            Cảnh báo & Thông báo
            </button>
          </div>
          
        {/* Tab Content */}
          {activeTab === 'activities' && (
          <div style={{padding: '1.5rem'}}>
            <div style={{display: 'grid', gap: '1rem'}}>
                  {recentActivities.map((activity) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#667eea40';
                  e.currentTarget.style.boxShadow = '0 4px 8px -2px rgba(102, 126, 234, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: activity.status === 'active' 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CalendarIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#1e293b', 
                        margin: 0
                      }}>
                        {activity.name}
                      </h4>
                      <p style={{
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        margin: '0.25rem 0 0 0'
                      }}>
                        {activity.location}
                      </p>
                    </div>
            </div>
                  
                  <div style={{textAlign: 'right'}}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      {activity.time}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.25rem'
                    }}>
                      {activity.participants} người tham gia
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        
        {activeTab === 'alerts' && (
          <div style={{padding: '1.5rem'}}>
            <div style={{display: 'grid', gap: '1rem'}}>
              {alerts.map((alert) => (
                <div key={alert.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = alert.type === 'urgent' ? '#dc262640' : 
                                                     alert.type === 'warning' ? '#d9770640' : '#667eea40';
                  e.currentTarget.style.boxShadow = `0 4px 8px -2px ${
                    alert.type === 'urgent' ? 'rgba(220, 38, 38, 0.2)' : 
                    alert.type === 'warning' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(102, 126, 234, 0.2)'
                  }`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: alert.type === 'urgent' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 
                               alert.type === 'warning' ? 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' : 
                               'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ExclamationTriangleIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                  </div>
                  
                  <div style={{flex: 1}}>
                    <p style={{
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#1e293b', 
                      margin: '0 0 0.5rem 0'
                    }}>
                      {alert.message}
                    </p>
                    <p style={{
                      fontSize: '0.75rem', 
                      color: '#64748b',
                      margin: 0
                    }}>
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
