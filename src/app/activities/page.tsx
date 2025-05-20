"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  UserGroupIcon, 
  CalendarIcon 
} from '@heroicons/react/24/outline';

// Mock activity data
const activities = [
  { 
    id: 1, 
    name: 'Tập thể dục buổi sáng', 
    description: 'Các bài tập kéo giãn và vận động nhẹ nhàng để cải thiện khả năng vận động',
    category: 'Thể chất', 
    location: 'Phòng sinh hoạt chung',
    scheduledTime: '08:00 AM', 
    duration: 45,
    capacity: 20,
    participants: 18,
    facilitator: 'David Wilson'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    description: 'Hoạt động vẽ tranh và làm đồ thủ công sáng tạo',
    category: 'Sáng tạo', 
    location: 'Phòng hoạt động',
    scheduledTime: '10:30 AM', 
    duration: 60,
    capacity: 15,
    participants: 12,
    facilitator: 'Emily Parker'
  },
  { 
    id: 3, 
    name: 'Trị liệu âm nhạc', 
    description: 'Buổi âm nhạc trị liệu với các hoạt động hát theo và chơi nhạc cụ',
    category: 'Trị liệu', 
    location: 'Khu vườn',
    scheduledTime: '02:00 PM', 
    duration: 60,
    capacity: 30,
    participants: 25,
    facilitator: 'Robert Johnson'
  },
  { 
    id: 4, 
    name: 'Trò chơi trí nhớ', 
    description: 'Các trò chơi nhận thức để cải thiện trí nhớ và sự nhanh nhạy tinh thần',
    category: 'Nhận thức', 
    location: 'Phòng hoạt động',
    scheduledTime: '11:00 AM', 
    duration: 45,
    capacity: 12,
    participants: 10,
    facilitator: 'Sarah Thompson'
  },
  { 
    id: 5, 
    name: 'Trò chơi buổi tối', 
    description: 'Các trò chơi bàn và trò chơi bài giao lưu',
    category: 'Xã hội', 
    location: 'Phòng giải trí',
    scheduledTime: '04:00 PM', 
    duration: 90,
    capacity: 25,
    participants: 20,
    facilitator: 'David Wilson'
  },
];

const categories = ['Tất cả', 'Thể chất', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội', 'Giáo dục'];
const locations = ['Tất cả', 'Phòng sinh hoạt chung', 'Phòng hoạt động', 'Khu vườn', 'Phòng giải trí', 'Phòng ăn'];

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [filterLocation, setFilterLocation] = useState('Tất cả');
  
  // Filter activities based on search term and filters
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'Tất cả' || activity.category === filterCategory;
    const matchesLocation = filterLocation === 'Tất cả' || activity.location === filterLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Quản lý hoạt động</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <Link 
            href="/activities/calendar" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <CalendarIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Lịch hoạt động
          </Link>
          <Link 
            href="/activities/new" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <PlusCircleIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Thêm hoạt động
          </Link>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{position: 'relative', width: '100%', maxWidth: '20rem'}}>
              <div style={{position: 'absolute', top: 0, bottom: 0, left: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none'}}>
                <MagnifyingGlassIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm hoạt động..."
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category === 'Tất cả' ? 'Tất cả loại hoạt động' : `Hoạt động ${category}`}</option>
                  ))}
                </select>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>{location === 'Tất cả' ? 'Tất cả địa điểm' : location}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Hoạt động</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Loại</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Địa điểm</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thời gian</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thời lượng</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tham gia</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredActivities.map((activity) => (
                <tr key={activity.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem'}}>
                    <div style={{fontWeight: 500, color: '#111827'}}>{activity.name}</div>
                    <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>{activity.description}</div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        activity.category === 'Thể chất' ? '#dbeafe' : 
                        activity.category === 'Sáng tạo' ? '#f3e8ff' :
                        activity.category === 'Trị liệu' ? '#dcfce7' :
                        activity.category === 'Nhận thức' ? '#fef3c7' : 
                        '#e0e7ff',
                      color: 
                        activity.category === 'Thể chất' ? '#1e40af' : 
                        activity.category === 'Sáng tạo' ? '#7e22ce' :
                        activity.category === 'Trị liệu' ? '#166534' :
                        activity.category === 'Nhận thức' ? '#92400e' : 
                        '#4338ca'
                    }}>
                      {activity.category}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{activity.location}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{activity.scheduledTime}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{activity.duration} phút</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <div style={{marginRight: '0.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        {activity.participants}/{activity.capacity}
                      </div>
                      <div style={{width: '6rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.625rem'}}>
                        <div 
                          style={{
                            height: '0.625rem', 
                            borderRadius: '9999px',
                            backgroundColor: 
                              (activity.participants / activity.capacity) > 0.8 
                                ? '#16a34a' 
                                : (activity.participants / activity.capacity) > 0.5 
                                  ? '#2563eb' 
                                  : '#d97706',
                            width: `${(activity.participants / activity.capacity) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <Link href={`/activities/${activity.id}`} style={{color: '#2563eb', display: 'flex', alignItems: 'center'}}>
                        <PencilIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                      <Link href={`/activities/${activity.id}/participants`} style={{color: '#16a34a', display: 'flex', alignItems: 'center'}}>
                        <UserGroupIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                      <Link href={`/activities/${activity.id}/schedule`} style={{color: '#9333ea', display: 'flex', alignItems: 'center'}}>
                        <CalendarIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredActivities.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy hoạt động phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
} 