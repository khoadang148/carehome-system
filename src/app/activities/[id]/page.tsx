"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, UserGroupIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';

// Mock activity data
const activitiesData = [
  { 
    id: 1, 
    name: 'Tập thể dục buổi sáng', 
    description: 'Các bài tập kéo giãn và vận động nhẹ nhàng để cải thiện khả năng vận động. Hoạt động này được thiết kế đặc biệt cho người cao tuổi nhằm duy trì sức khỏe thể chất và tinh thần.',
    category: 'Thể chất', 
    location: 'Phòng sinh hoạt chung',
    scheduledTime: '08:00', 
    duration: 45,
    capacity: 20,
    participants: [
      'Nguyễn Văn A',
      'Trần Thị B', 
      'Lê Văn C',
      'Hoàng Văn D',
      'Phạm Thị E',
      'Vũ Văn F',
      'Đặng Thị G',
      'Bùi Văn H',
      'Lý Thị I',
      'Ngô Văn J',
      'Võ Thị K',
      'Phan Văn L',
      'Đỗ Thị M',
      'Tạ Văn N',
      'Hồ Thị O',
      'Lưu Văn P',
      'Mai Thị Q',
      'Cao Văn R'
    ],
    facilitator: 'David Wilson',
    facilitatorId: 5,
    date: '2024-01-15',
    notes: 'Cần chuẩn bị thảm tập yoga và nhạc nhẹ nhàng. Kiểm tra sức khỏe của các cư dân trước khi tham gia.',
    materials: ['Thảm tập yoga', 'Loa phát nhạc', 'Nước uống', 'Khăn nhỏ'],
    benefits: ['Cải thiện khả năng vận động', 'Tăng cường sức khỏe tim mạch', 'Giảm căng thẳng', 'Cải thiện tâm trạng'],
    level: 'Dễ',
    recurring: 'Hàng ngày',
    status: 'Đã lên lịch'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    description: 'Hoạt động vẽ tranh và làm đồ thủ công sáng tạo nhằm kích thích khả năng nghệ thuật và sáng tạo của cư dân.',
    category: 'Sáng tạo', 
    location: 'Phòng hoạt động',
    scheduledTime: '10:30', 
    duration: 60,
    capacity: 15,
    participants: [
      'Nguyễn Văn A',
      'Trần Thị B', 
      'Lê Văn C',
      'Hoàng Văn D',
      'Phạm Thị E',
      'Vũ Văn F',
      'Đặng Thị G',
      'Bùi Văn H',
      'Lý Thị I',
      'Ngô Văn J',
      'Võ Thị K',
      'Phan Văn L'
    ],
    facilitator: 'Emily Parker',
    facilitatorId: 2,
    date: '2024-01-15',
    notes: 'Hoạt động phù hợp với tất cả mức độ. Khuyến khích sự sáng tạo và không có áp lực về kết quả.',
    materials: ['Giấy vẽ', 'Màu nước', 'Cọ vẽ', 'Kéo', 'Keo dán', 'Vải nỉ'],
    benefits: ['Kích thích sáng tạo', 'Cải thiện khéo léo tay', 'Thư giãn tinh thần', 'Tăng cường tự tin'],
    level: 'Trung bình',
    recurring: 'Hàng tuần',
    status: 'Đang diễn ra'
  }
];

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const resolvedParams = await params;
        
        // Mock activity data with full structure
        const mockActivity = {
          id: parseInt(resolvedParams.id),
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
        };
        
        setActivity(mockActivity);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [params]);
  
  const handleEditClick = () => {
    router.push(`/activities/${activity.id}/edit`);
  };
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        Đang tải thông tin hoạt động...
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Không tìm thấy hoạt động</h2>
        <Link href="/activities" style={{color: '#16a34a', textDecoration: 'underline'}}>
          Quay lại danh sách hoạt động
        </Link>
      </div>
    );
  }

  // Helper function to render category with appropriate color
  const renderCategory = (category: string) => {
    const bgColor = 
      category === 'Thể chất' ? '#dbeafe' : 
      category === 'Sáng tạo' ? '#dcfce7' :
      category === 'Trị liệu' ? '#fef3c7' :
      category === 'Nhận thức' ? '#e0e7ff' :
      category === 'Xã hội' ? '#fce7f3' : '#f3f4f6';
      
    const textColor = 
      category === 'Thể chất' ? '#1d4ed8' : 
      category === 'Sáng tạo' ? '#166534' :
      category === 'Trị liệu' ? '#d97706' :
      category === 'Nhận thức' ? '#4338ca' :
      category === 'Xã hội' ? '#be185d' : '#374151';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.25rem 0.75rem', 
        fontSize: '0.75rem', 
        fontWeight: 500, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor
      }}>
        {category}
      </span>
    );
  };

  // Helper function to render status with appropriate color
  const renderStatus = (status: string) => {
    const bgColor = 
      status === 'Đã lên lịch' ? '#dbeafe' : 
      status === 'Đang diễn ra' ? '#dcfce7' :
      status === 'Đã hoàn thành' ? '#f3f4f6' :
      status === 'Đã hủy' ? '#fecaca' : '#f3f4f6';
      
    const textColor = 
      status === 'Đã lên lịch' ? '#1d4ed8' : 
      status === 'Đang diễn ra' ? '#166534' :
      status === 'Đã hoàn thành' ? '#374151' :
      status === 'Đã hủy' ? '#dc2626' : '#374151';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.25rem 0.75rem', 
        fontSize: '0.75rem', 
        fontWeight: 500, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor
      }}>
        {status}
      </span>
    );
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href="/activities" style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chi tiết hoạt động</h1>
        </div>
        
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#16a34a',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <PencilIcon style={{width: '1rem', height: '1rem'}} />
          Chỉnh sửa
        </button>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
        {/* Header with basic info */}
        <div style={{backgroundColor: '#f9fafb', padding: '1.5rem', borderBottom: '1px solid #e5e7eb'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0}}>{activity.name}</h2>
              <p style={{fontSize: '1rem', color: '#6b7280', marginTop: '0.25rem', marginBottom: '0.5rem'}}>
                {activity.description}
              </p>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem'}}>
                {renderCategory(activity.category)}
                {renderStatus(activity.status)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{padding: '1.5rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
            
            {/* Schedule Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <ClockIcon style={{width: '1.25rem', height: '1.25rem'}} />
                Thông tin lịch trình
              </h3>
              
              <div style={{display: 'grid', gap: '0.75rem'}}>
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Ngày:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                    {new Date(activity.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Thời gian:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{activity.scheduledTime}</p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Thời lượng:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{activity.duration} phút</p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Địa điểm:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <MapPinIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {activity.location}
                  </p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Lặp lại:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{activity.recurring}</p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Mức độ:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{activity.level}</p>
                </div>
              </div>
            </div>
            
            {/* Participation Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <UserGroupIcon style={{width: '1.25rem', height: '1.25rem'}} />
                Thông tin tham gia
              </h3>
              
              <div style={{display: 'grid', gap: '0.75rem'}}>
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Sức chứa:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{activity.capacity} người</p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Đã đăng ký:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                    {activity.participants?.length || 0} người 
                    <span style={{color: (activity.participants?.length || 0) >= activity.capacity ? '#dc2626' : '#16a34a'}}>
                      ({(activity.participants?.length || 0) >= activity.capacity ? 'Đầy' : `Còn ${activity.capacity - (activity.participants?.length || 0)} chỗ`})
                    </span>
                  </p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Người hướng dẫn:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <UserIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {activity.facilitator}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Benefits & Materials */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                Lợi ích & Dụng cụ
              </h3>
              
              <div style={{marginBottom: '1rem'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                  Lợi ích
                </h4>
                <ul style={{margin: 0, paddingLeft: '1.25rem'}}>
                  {activity.benefits?.map((benefit: string, index: number) => (
                    <li key={index} style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem'}}>{benefit}</li>
                  )) || <li style={{fontSize: '0.875rem', color: '#6b7280'}}>Chưa có thông tin</li>}
                </ul>
              </div>
              
              <div>
                <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                  Dụng cụ cần thiết
                </h4>
                <ul style={{margin: 0, paddingLeft: '1.25rem'}}>
                  {activity.materials?.map((material: string, index: number) => (
                    <li key={index} style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem'}}>{material}</li>
                  )) || <li style={{fontSize: '0.875rem', color: '#6b7280'}}>Chưa có thông tin</li>}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Participants List */}
          <div style={{marginTop: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
            <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
              Danh sách tham gia ({activity.participants?.length || 0}/{activity.capacity})
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem'}}>
              {activity.participants?.length > 0 ? (
                activity.participants.map((participant: string, index: number) => (
                  <div key={index} style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    {participant}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  gridColumn: '1 / -1'
                }}>
                  Chưa có người tham gia
                </div>
              )}
            </div>
          </div>
          
          {/* Notes Section */}
          {activity.notes && (
            <div style={{marginTop: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                Ghi chú
              </h3>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, lineHeight: 1.6}}>{activity.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 