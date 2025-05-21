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
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

// Mock data for dashboard
const stats = [
  { name: 'Total Residents', value: '124', change: '+2%', trend: 'up', icon: UserIcon, color: 'bg-primary-100 text-primary-800' },
  { name: 'Total Staff', value: '45', change: '-1%', trend: 'down', icon: UsersIcon, color: 'bg-secondary-100 text-secondary-800' },
  { name: 'Activities Today', value: '8', change: '+3', trend: 'up', icon: CalendarIcon, color: 'bg-accent-100 text-accent-800' },
  { name: 'Occupancy Rate', value: '92%', change: '+5%', trend: 'up', icon: ChartBarIcon, color: 'bg-amber-100 text-amber-800' },
];

const recentActivities = [
  { id: 1, name: 'Morning Exercise', time: '08:00 AM', participants: 18, location: 'Common Room' },
  { id: 2, name: 'Art & Craft', time: '10:30 AM', participants: 12, location: 'Activity Room' },
  { id: 3, name: 'Lunch', time: '12:00 PM', participants: 124, location: 'Dining Hall' },
  { id: 4, name: 'Music Therapy', time: '02:00 PM', participants: 25, location: 'Garden Area' },
  { id: 5, name: 'Evening Games', time: '04:00 PM', participants: 20, location: 'Recreation Room' },
];

const alerts = [
  { id: 1, message: 'Medication due for Room 204', time: '10 minutes ago', type: 'urgent' },
  { id: 2, message: 'Staff meeting today at 3:00 PM', time: '30 minutes ago', type: 'info' },
  { id: 3, message: 'New resident arriving tomorrow', time: '2 hours ago', type: 'info' },
  { id: 4, message: 'Maintenance request for Room 115', time: '3 hours ago', type: 'warning' },
];

// Dữ liệu thống kê hệ thống
const systemStats = [
  { label: 'Phòng trống', value: '8/132' },
  { label: 'Nhân viên trực', value: '24' },
  { label: 'Nhiệt độ', value: '24°C' },
  { label: 'Báo động', value: '0' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('activities');
  const { user } = useAuth();
  const router = useRouter();
  
  // Redirect family members to the family portal
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'family') {
      router.push('/family');
    }
  }, [user, router]);
  
  // Hide dashboard if not staff or admin
  if (!user || user.role === 'family') {
    return null;
  }
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: 'bold', margin: 0}}>Dashboard</h1>
        <div>
          <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
            Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
      
      {/* Grid layout cho Dashboard */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem'}}>
        {/* Thẻ thống kê - chiếm 9 cột */}
        <div style={{gridColumn: 'span 9', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem'}}>
          {stats.map((stat) => (
            <div 
              key={stat.name} 
              style={{
                backgroundColor: 'white', 
                borderRadius: '0.75rem', 
                padding: '1.5rem', 
                display: 'flex', 
                alignItems: 'flex-start', 
                columnGap: '1rem', 
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)', 
                transition: 'all 0.3s'
              }} 
              className="hover:-translate-y-1"
            >
              <div style={{padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: stat.color === 'bg-primary-100 text-primary-800' ? '#e0f2fe' : 
                                                                      stat.color === 'bg-secondary-100 text-secondary-800' ? '#ccfbf1' : 
                                                                      stat.color === 'bg-accent-100 text-accent-800' ? '#fae8ff' : '#fef3c7'}}>
                <stat.icon style={{width: '1.25rem', height: '1.25rem', color: stat.color === 'bg-primary-100 text-primary-800' ? '#0369a1' : 
                                                                      stat.color === 'bg-secondary-100 text-secondary-800' ? '#0f766e' : 
                                                                      stat.color === 'bg-accent-100 text-accent-800' ? '#a21caf' : '#b45309'}} />
              </div>
              <div style={{flexGrow: 1}}>
                <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>{stat.name}</p>
                <p style={{fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem'}}>{stat.value}</p>
                <div style={{display: 'flex', alignItems: 'center', fontSize: '0.75rem'}}>
                  {stat.trend === 'up' ? (
                    <ArrowUpIcon style={{width: '0.75rem', height: '0.75rem', color: '#10b981', marginRight: '0.25rem'}} />
                  ) : (
                    <ArrowDownIcon style={{width: '0.75rem', height: '0.75rem', color: '#ef4444', marginRight: '0.25rem'}} />
                  )}
                  <span style={{color: stat.trend === 'up' ? '#10b981' : '#ef4444'}}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Thẻ bên phải - chiếm 3 cột */}
        <div style={{gridColumn: 'span 3'}}>
          <div style={{
            backgroundColor: 'white', 
            borderRadius: '0.75rem', 
            padding: '1.25rem', 
            height: '100%', 
            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center'}}>
              <ChartBarIcon style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
              Thông tin hệ thống
            </h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem'}}>
              {systemStats.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '0.5rem', 
                  alignItems: 'center'
                }}>
                  <span style={{fontSize: '0.875rem', color: '#4b5563'}}>{item.label}</span>
                  <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827'}}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Quick Actions - span 12 cột (toàn chiều rộng) */}
        <div style={{
          gridColumn: 'span 12',
          backgroundColor: 'white', 
          borderRadius: '0.75rem', 
          padding: '1.5rem', 
          boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)'
        }}>
          <h2 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>Quick Actions</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem'}}>
            <Link href="/residents/add" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', transition: 'all 0.3s'}} className="hover:bg-primary-100 hover:scale-105">
              <div style={{backgroundColor: '#e0f2fe', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem'}}>
                <UserIcon style={{width: '1.25rem', height: '1.25rem', color: '#0369a1'}} />
              </div>
              <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>Add Resident</span>
            </Link>
            <Link href="/staff/schedule" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: '#f0fdfa', borderRadius: '0.5rem', transition: 'all 0.3s'}} className="hover:bg-secondary-100 hover:scale-105">
              <div style={{backgroundColor: '#ccfbf1', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem'}}>
                <ClockIcon style={{width: '1.25rem', height: '1.25rem', color: '#0f766e'}} />
              </div>
              <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>Staff Schedule</span>
            </Link>
            <Link href="/activities/new" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: '#fdf4ff', borderRadius: '0.5rem', transition: 'all 0.3s'}} className="hover:bg-accent-100 hover:scale-105">
              <div style={{backgroundColor: '#fae8ff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem'}}>
                <CalendarIcon style={{width: '1.25rem', height: '1.25rem', color: '#a21caf'}} />
              </div>
              <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>Create Activity</span>
            </Link>
            <Link href="/reports" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem', transition: 'all 0.3s'}} className="hover:bg-amber-100 hover:scale-105">
              <div style={{backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem'}}>
                <ChartBarIcon style={{width: '1.25rem', height: '1.25rem', color: '#b45309'}} />
              </div>
              <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>View Reports</span>
            </Link>
          </div>
        </div>
        
        {/* Tabbed Information - span 12 cột (toàn chiều rộng) */}
        <div style={{
          gridColumn: 'span 12',
          backgroundColor: 'white', 
          borderRadius: '0.75rem', 
          overflow: 'hidden', 
          boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 1rem'}}>
            <button
              onClick={() => setActiveTab('activities')}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderBottom: activeTab === 'activities' ? '2px solid #0ea5e9' : 'none',
                color: activeTab === 'activities' ? '#0284c7' : '#6b7280'
              }}
            >
              Today's Activities
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderBottom: activeTab === 'alerts' ? '2px solid #0ea5e9' : 'none',
                color: activeTab === 'alerts' ? '#0284c7' : '#6b7280'
              }}
            >
              Alerts & Notifications
            </button>
          </div>
          
          {activeTab === 'activities' && (
            <div style={{overflowX: 'auto'}}>
              <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
                <thead style={{backgroundColor: '#f9fafb'}}>
                  <tr>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Activity</th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Time</th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Participants</th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Location</th>
                  </tr>
                </thead>
                <tbody style={{backgroundColor: 'white'}}>
                  {recentActivities.map((activity) => (
                    <tr key={activity.id} style={{borderBottom: '1px solid #e5e7eb'}} className="hover:bg-gray-50">
                      <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{activity.name}</td>
                      <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{activity.time}</td>
                      <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{activity.participants}</td>
                      <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{activity.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'alerts' && (
            <div>
              {alerts.map((alert) => (
                <div key={alert.id} style={{padding: '1rem', borderBottom: '1px solid #e5e7eb'}} className="hover:bg-gray-50">
                  <div style={{display: 'flex', alignItems: 'flex-start'}}>
                    <div style={{
                      flexShrink: 0, 
                      padding: '0.25rem', 
                      borderRadius: '9999px',
                      backgroundColor: alert.type === 'urgent' ? '#fee2e2' : 
                                      alert.type === 'warning' ? '#fef3c7' : 
                                      '#e0f2fe'
                    }}>
                      <ExclamationTriangleIcon style={{
                        width: '1rem', 
                        height: '1rem',
                        color: alert.type === 'urgent' ? '#dc2626' : 
                               alert.type === 'warning' ? '#d97706' : 
                               '#0369a1'
                      }} />
                    </div>
                    <div style={{marginLeft: '0.75rem'}}>
                      <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: '0.25rem'}}>{alert.message}</p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
