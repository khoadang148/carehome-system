"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  UserGroupIcon, 
  CalendarIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

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
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
      'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R'
    ],
    facilitator: 'David Wilson',
    date: '2024-01-15',
    status: 'Đã lên lịch',
    notes: 'Cần chuẩn bị thảm tập yoga và nhạc nhẹ nhàng. Kiểm tra sức khỏe của các cư dân trước khi tham gia.',
    materials: ['Thảm tập yoga', 'Loa phát nhạc', 'Nước uống', 'Khăn nhỏ'],
    benefits: ['Cải thiện khả năng vận động', 'Tăng cường sức khỏe tim mạch', 'Giảm căng thẳng', 'Cải thiện tâm trạng'],
    level: 'Dễ',
    recurring: 'Hàng ngày'
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
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L'
    ],
    facilitator: 'Emily Parker',
    date: '2024-01-15',
    status: 'Đang diễn ra',
    notes: 'Hoạt động phù hợp với tất cả mức độ. Khuyến khích sự sáng tạo và không có áp lực về kết quả.',
    materials: ['Giấy vẽ', 'Màu nước', 'Cọ vẽ', 'Kéo', 'Keo dán', 'Vải nỉ'],
    benefits: ['Kích thích sáng tạo', 'Cải thiện khéo léo tay', 'Thư giãn tinh thần', 'Tăng cường tự tin'],
    level: 'Trung bình',
    recurring: 'Hàng tuần'
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
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
      'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R', 'Nguyễn Thị S', 'Trần Văn T',
      'Lê Thị U', 'Hoàng Văn V', 'Phạm Thị W', 'Vũ Văn X', 'Đặng Thị Y'
    ],
    facilitator: 'Robert Johnson',
    date: '2024-01-15',
    status: 'Đã lên lịch',
    notes: 'Hoạt động ngoài trời tùy thuộc vào thời tiết. Chuẩn bị nhạc cụ đơn giản và mic.',
    materials: ['Nhạc cụ đơn giản', 'Micro', 'Loa di động', 'Ghế ngồi'],
    benefits: ['Thư giãn tinh thần', 'Cải thiện trí nhớ', 'Tăng cường giao tiếp xã hội', 'Giảm stress'],
    level: 'Dễ',
    recurring: 'Hàng tuần'
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
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J'
    ],
    facilitator: 'Sarah Thompson',
    date: '2024-01-15',
    status: 'Đã lên lịch',
    notes: 'Hoạt động được thiết kế để kích thích trí nhớ và tư duy logic. Phù hợp với người cao tuổi.',
    materials: ['Thẻ trò chơi', 'Bút viết', 'Giấy ghi chú', 'Đồng hồ bấm giờ'],
    benefits: ['Cải thiện trí nhớ', 'Kích thích tư duy', 'Tăng cường tập trung', 'Ngăn ngừa suy giảm nhận thức'],
    level: 'Trung bình',
    recurring: 'Hai lần mỗi tuần'
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
    participants: [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
      'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
      'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
      'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R', 'Nguyễn Thị S', 'Trần Văn T'
    ],
    facilitator: 'David Wilson',
    date: '2024-01-15',
    status: 'Đang diễn ra',
    notes: 'Tạo không khí vui vẻ và thân thiện. Khuyến khích tương tác xã hội giữa các cư dân.',
    materials: ['Bài tây', 'Cờ tướng', 'Cờ vua', 'Domino', 'Bàn và ghế'],
    benefits: ['Tăng cường giao tiếp', 'Giải trí và thư giãn', 'Kích thích tư duy chiến thuật', 'Xây dựng tình bạn'],
    level: 'Dễ',
    recurring: 'Hàng ngày'
  },
];

const categories = ['Tất cả', 'Thể chất', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội', 'Giáo dục'];
const locations = ['Tất cả', 'Phòng sinh hoạt chung', 'Phòng hoạt động', 'Khu vườn', 'Phòng giải trí', 'Phòng ăn'];

export default function ActivitiesPage() {
  const router = useRouter();
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
  
  // Handler functions for button actions
  const handleViewActivity = (activityId: number) => {
    router.push(`/activities/${activityId}`);
  };

  const handleEditActivity = (activityId: number) => {
    router.push(`/activities/${activityId}/edit`);
  };

  const handleCreateActivity = () => {
    router.push('/activities/new');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <SparklesIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý hoạt động
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {activities.length} hoạt động
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <Link 
            href="/activities/calendar" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
              textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }}
              >
                <CalendarIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
            Lịch hoạt động
          </Link>
          <Link 
            href="/activities/new" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
              textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                }}
              >
                <PlusCircleIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
            Thêm hoạt động
          </Link>
            </div>
        </div>
      </div>
      
        {/* Filters Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '1.5rem'
          }}>
            <div style={{flex: '1', minWidth: '20rem'}}>
              <div style={{position: 'relative'}}>
                <div style={{
                  position: 'absolute', 
                  top: 0, 
                  bottom: 0, 
                  left: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  pointerEvents: 'none'
                }}>
                  <MagnifyingGlassIcon style={{width: '1.125rem', height: '1.125rem', color: '#9ca3af'}} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm hoạt động..."
                style={{
                  width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                />
              </div>
            </div>
          
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '0.5rem'
              }}>
                <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#f59e0b'}} />
                <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#f59e0b'}}>
                  Lọc
                </span>
              </div>
                <select
                  style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: 500,
                  minWidth: '12rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                  }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
                >
                  {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: 500,
                  minWidth: '10rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                  }}
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
                >
                  {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                  ))}
                </select>
            </div>
          </div>
        </div>
        
        {/* Activities Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
              {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Activity Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {activity.name}
                  </h3>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                    fontWeight: 600, 
                      borderRadius: '9999px',
                    background: 
                      activity.category === 'Thể chất' ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 
                      activity.category === 'Sáng tạo' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 
                      activity.category === 'Trị liệu' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' :
                      activity.category === 'Nhận thức' ? 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' :
                      'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: 
                      activity.category === 'Thể chất' ? '#dc2626' : 
                      activity.category === 'Sáng tạo' ? '#1d4ed8' : 
                        activity.category === 'Trị liệu' ? '#166534' :
                      activity.category === 'Nhận thức' ? '#7c3aed' :
                      '#d97706',
                    border: '1px solid',
                    borderColor:
                      activity.category === 'Thể chất' ? '#fca5a5' : 
                      activity.category === 'Sáng tạo' ? '#93c5fd' : 
                      activity.category === 'Trị liệu' ? '#86efac' :
                      activity.category === 'Nhận thức' ? '#c4b5fd' :
                      '#fbbf24'
                  }}>
                    {activity.category}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500
                }}>
                  <UserGroupIcon style={{width: '1rem', height: '1rem'}} />
                  {activity.participants?.length || 0}/{activity.capacity}
                </div>
              </div>

              {/* Activity Details */}
              <div style={{marginBottom: '1rem'}}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.5',
                  margin: '0 0 1rem 0'
                }}>
                  {activity.description}
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Thời gian
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {activity.scheduledTime}
                    </span>
                      </div>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Thời lượng
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {activity.duration} phút
                    </span>
                      </div>
                    </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Địa điểm
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {activity.location}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Hướng dẫn viên
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {activity.facilitator}
                    </span>
                  </div>
                    </div>
        </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  onClick={() => handleViewActivity(activity.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                  }}
                  title="Xem chi tiết hoạt động"
                >
                  <EyeIcon style={{width: '1rem', height: '1rem'}} />
                </button>
                <button
                  onClick={() => handleEditActivity(activity.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                  }}
                  title="Chỉnh sửa hoạt động"
                >
                  <PencilIcon style={{width: '1rem', height: '1rem'}} />
                </button>
              </div>
            </div>
          ))}
        
        {filteredActivities.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <SparklesIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    margin: 0,
                    marginBottom: '0.5rem'
                  }}>
                    Không tìm thấy hoạt động nào
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#9ca3af',
                    margin: 0
                  }}>
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                  </p>
                </div>
              </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
} 