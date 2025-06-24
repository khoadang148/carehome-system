"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  PencilIcon, 
  EyeIcon,
  UserGroupIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  number: string;
  floor: number;
  type: 'single' | 'double' | 'shared' | 'vip';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  capacity: number;
  currentOccupancy: number;
  servicePackage: 'basic' | 'standard' | 'premium' | 'vip';
  genderRestriction: 'male' | 'female' | 'mixed';
  specialCare: boolean;
  amenities: string[];
  monthlyRate: number;
  beds: Bed[];
}

interface Bed {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'maintenance';
  residentId?: string;
  residentName?: string;
  assignedDate?: string;
  healthCondition?: 'stable' | 'critical' | 'recovering' | 'palliative';
  careLevel: 'basic' | 'intermediate' | 'intensive' | 'specialized';
}

export default function RoomManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: '1',
      number: '101',
      floor: 1,
      type: 'double',
      status: 'occupied',
      capacity: 2,
      currentOccupancy: 2,
      servicePackage: 'standard',
      genderRestriction: 'female',
      specialCare: false,
      amenities: ['TV', 'Điều hòa', 'Tủ lạnh'],
      monthlyRate: 8000000,
      beds: [
        {
          id: 'B101A',
          number: '101A',
          status: 'occupied',
          residentId: 'R001',
          residentName: 'Nguyễn Thị Lan',
          assignedDate: '2024-01-01',
          healthCondition: 'stable',
          careLevel: 'intermediate'
        },
        {
          id: 'B101B',
          number: '101B',
          status: 'occupied',
          residentId: 'R002',
          residentName: 'Trần Thị Mai',
          assignedDate: '2024-01-15',
          healthCondition: 'recovering',
          careLevel: 'basic'
        }
      ]
    },
    {
      id: '2',
      number: '102',
      floor: 1,
      type: 'single',
      status: 'available',
      capacity: 1,
      currentOccupancy: 0,
      servicePackage: 'premium',
      genderRestriction: 'male',
      specialCare: true,
      amenities: ['TV', 'Điều hòa', 'Tủ lạnh', 'Thiết bị y tế'],
      monthlyRate: 15000000,
      beds: [
        {
          id: 'B102A',
          number: '102A',
          status: 'available',
          careLevel: 'specialized'
        }
      ]
    },
    {
      id: '3',
      number: '201',
      floor: 2,
      type: 'vip',
      status: 'occupied',
      capacity: 1,
      currentOccupancy: 1,
      servicePackage: 'vip',
      genderRestriction: 'mixed',
      specialCare: true,
      amenities: ['TV', 'Điều hòa', 'Tủ lạnh', 'Thiết bị y tế', 'Sofa', 'Ban công'],
      monthlyRate: 25000000,
      beds: [
        {
          id: 'B201A',
          number: '201A',
          status: 'occupied',
          residentId: 'R003',
          residentName: 'Lê Văn Hùng',
          assignedDate: '2023-12-01',
          healthCondition: 'critical',
          careLevel: 'intensive'
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [transferTargetRoom, setTransferTargetRoom] = useState<string>('');
  const [transferTargetBed, setTransferTargetBed] = useState<string>('');

  // Giả lập danh sách cư dân chưa có phòng
  const [unassignedResidents, setUnassignedResidents] = useState([
    { id: 'R010', name: 'Nguyễn Văn A' },
    { id: 'R011', name: 'Trần Thị B' },
    { id: 'R012', name: 'Lê Văn C' }
  ]);
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [addResidentRoom, setAddResidentRoom] = useState<Room | null>(null);
  const [selectedAddResident, setSelectedAddResident] = useState('');
  const [selectedAddBed, setSelectedAddBed] = useState('');

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.beds.some(bed => bed.residentName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesService = serviceFilter === 'all' || room.servicePackage === serviceFilter;
    const matchesHealth = healthFilter === 'all' || 
                         room.beds.some(bed => bed.healthCondition === healthFilter);
    
    return matchesSearch && matchesFloor && matchesStatus && matchesService && matchesHealth;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'occupied': return '#3b82f6';
      case 'maintenance': return '#f59e0b';
      case 'reserved': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Đã thuê';
      case 'maintenance': return 'Bảo trì';
      case 'reserved': return 'Đã đặt';
      default: return 'Không xác định';
    }
  };

  const getHealthConditionColor = (condition: string) => {
    switch (condition) {
      case 'stable': return '#10b981';
      case 'critical': return '#ef4444';
      case 'recovering': return '#f59e0b';
      case 'palliative': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getHealthConditionLabel = (condition: string) => {
    switch (condition) {
      case 'stable': return 'Ổn định';
      case 'critical': return 'Nguy hiểm';
      case 'recovering': return 'Hồi phục';
      case 'palliative': return 'Chăm sóc giảm nhẹ';
      default: return 'Không xác định';
    }
  };

  // Helper for Vietnamese labels
  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Đơn';
      case 'double': return 'Đôi';
      case 'shared': return 'Chung';
      case 'vip': return 'VIP';
      default: return type;
    }
  };
  const getServicePackageLabel = (pkg: string) => {
    switch (pkg) {
      case 'basic': return 'Cơ bản';
      case 'standard': return 'Tiêu chuẩn';
      case 'premium': return 'Cao cấp';
      case 'vip': return 'VIP';
      default: return pkg;
    }
  };
  const getCareLevelLabel = (level: string) => {
    switch (level) {
      case 'basic': return 'Cơ bản';
      case 'intermediate': return 'Trung bình';
      case 'intensive': return 'Chuyên sâu';
      case 'specialized': return 'Chuyên biệt';
      default: return level;
    }
  };
  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'mixed': return 'Nam & Nữ';
      default: return gender;
    }
  };



  const hasModalOpen = showDetailModal || showTransferModal || showAddResidentModal;
  const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    console.log('Modal states:', { showDetailModal, showTransferModal, showAddResidentModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showDetailModal || showTransferModal || showAddResidentModal;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showTransferModal, showAddResidentModal]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
        
        {/* Header */}
        <div ref={headerRef} style={{
          background: 'linear-gradient(135deg,rgb(251, 252, 253) 0%,rgb(251, 254, 255) 100%)',
          borderRadius: '1.5rem',
          padding: '1.8rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}>
                  <BuildingOfficeIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    margin: '0 0 0.5rem 0',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Quản lý Phòng & Giường
                  </h1>
                  <p style={{ color: '#64748b', margin: 0 }}>
                    Phân chia phòng, giường theo dịch vụ và tình trạng sức khỏe
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>



          {/* Filters */}
          <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', gap: '1rem', alignItems: 'end' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1.25rem',
                  height: '1.25rem',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng hoặc người cao tuổi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.75rem',
                    fontSize: '0.95rem',
                    color: '#374151',
                    fontWeight: 400,
                    background: '#fff',
                    outline: 'none',
                    boxShadow: 'none',
                    transition: 'border 0.2s',
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem',
              }}>
                Tầng
              </label>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  color: '#374151',
                  fontWeight: 400,
                  background: '#fff',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <option value="all">Tất cả</option>
                <option value="1">Tầng 1</option>
                <option value="2">Tầng 2</option>
                <option value="3">Tầng 3</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  color: '#374151',
                  fontWeight: 400,
                  background: '#fff',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <option value="all">Tất cả</option>
                <option value="available">Trống</option>
                <option value="occupied">Đã thuê</option>
                <option value="maintenance">Bảo trì</option>
                <option value="reserved">Đã đặt</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Gói dịch vụ
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  color: '#374151',
                  fontWeight: 400,
                  background: '#fff',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <option value="all">Tất cả</option>
                <option value="basic">Cơ bản</option>
                <option value="standard">Tiêu chuẩn</option>
                <option value="premium">Cao cấp</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Sức khỏe
              </label>
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  color: '#374151',
                  fontWeight: 400,
                  background: '#fff',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <option value="all">Tất cả</option>
                <option value="stable">Ổn định</option>
                <option value="critical">Nguy hiểm</option>
                <option value="recovering">Hồi phục</option>
                <option value="palliative">Chăm sóc giảm nhẹ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Room Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: '0 0 0.25rem 0',
                    color: '#1f2937'
                  }}>
                    Phòng {room.number}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', gap: '1rem' }}>
                    <span><span style={{ fontWeight: 500 }}>Tầng:</span> {room.floor}</span>
                    <span><span style={{ fontWeight: 500 }}>Loại:</span> {getRoomTypeLabel(room.type)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowDetailModal(true);
                    }}
                    style={{
                      background: '#f8fafc',
                      color: '#6366f1',
                      border: '1px solid #e0e7ff',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Xem chi tiết"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#6366f1';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#6366f1';
                    }}
                  >
                    <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <button
                    onClick={() => {
                      setAddResidentRoom(room);
                      setShowAddResidentModal(true);
                      setSelectedAddResident('');
                      setSelectedAddBed('');
                    }}
                    style={{
                      background: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Thêm người cao tuổi"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#16a34a';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f0fdf4';
                      e.currentTarget.style.color = '#16a34a';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>+</span>
                  </button>
                </div>
              </div>

              {/* Status and Service Package */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Trạng thái
                  </div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: getStatusColor(room.status),
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {getStatusLabel(room.status)}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Gói dịch vụ
                  </div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    display: 'inline-block'
                  }}>
                    {getServicePackageLabel(room.servicePackage)}
                  </span>
                </div>
              </div>

              {/* Room Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Sức chứa
                  </div>
                  <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>
                    {room.currentOccupancy}/{room.capacity} người
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Giá thuê/tháng
                  </div>
                  <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>
                    {room.monthlyRate.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
              </div>

              {/* Beds */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UserGroupIcon style={{ width: '1rem', height: '1rem' }} />
                  Danh sách giường ({room.beds.length})
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {room.beds.map((bed) => (
                    <div
                      key={bed.id}
                      style={{
                        background: bed.residentName ? '#fefefe' : '#f8fafc',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        border: bed.residentName ? '1px solid #e0e7ff' : '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
                              Giường
                            </div>
                            <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>
                              {bed.number}
                            </span>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(bed.status)
                            }} />
                          </div>
                          
                          {bed.residentName ? (
                            <div style={{ display: 'grid', gap: '0.25rem' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Người cao tuổi: </span>
                                <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 600 }}>
                                  {bed.residentName}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Ngày vào: </span>
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                                  {bed.assignedDate && new Date(bed.assignedDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Mức độ chăm sóc: </span>
                                <span style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
                                  {getCareLevelLabel(bed.careLevel)}
                                </span>
                              </div>
                              {bed.healthCondition && (
                                <div style={{ marginTop: '0.25rem' }}>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 500, 
                                    color: '#6b7280',
                                    marginRight: '0.5rem'
                                  }}>
                                    Tình trạng sức khỏe:
                                  </span>
                                  <span style={{
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    backgroundColor: getHealthConditionColor(bed.healthCondition),
                                    color: 'white',
                                    display: 'inline-block'
                                  }}>
                                    {getHealthConditionLabel(bed.healthCondition)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Trạng thái: </span>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                                Giường trống
                              </span>
                            </div>
                          )}
                        </div>
                        {bed.residentName && (
                          <button
                            onClick={() => {
                              setSelectedBed(bed);
                              setSelectedRoom(room);
                              setShowTransferModal(true);
                            }}
                            style={{
                              background: '#dbeafe',
                              color: '#3b82f6',
                              border: '1px solid #bfdbfe',
                              borderRadius: '0.375rem',
                              padding: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Chuyển phòng"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#3b82f6';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#dbeafe';
                              e.currentTarget.style.color = '#3b82f6';
                            }}
                          >
                            <ArrowRightIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {room.amenities.length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <HomeIcon style={{ width: '1rem', height: '1rem' }} />
                    Tiện nghi phòng
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          fontWeight: 500
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRoom && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
                Chi tiết Phòng {selectedRoom.number}
              </h2>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Room Info */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HomeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Thông tin phòng
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Số phòng</label>
                      <div style={{ color: '#1f2937' }}>{selectedRoom.number}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Tầng</label>
                      <div style={{ color: '#1f2937' }}>{selectedRoom.floor}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Loại phòng</label>
                      <div style={{ color: '#1f2937' }}>{getRoomTypeLabel(selectedRoom.type)}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Gói dịch vụ</label>
                      <div style={{ color: '#1f2937' }}>{getServicePackageLabel(selectedRoom.servicePackage)}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Giới tính</label>
                      <div style={{ color: '#1f2937' }}>{getGenderLabel(selectedRoom.genderRestriction)}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Chăm sóc đặc biệt</label>
                      <div style={{ color: '#1f2937' }}>{selectedRoom.specialCare ? 'Có' : 'Không'}</div>
                    </div>
                  </div>
                </div>

                {/* Beds Info */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Thông tin giường
                  </h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {selectedRoom.beds.map((bed) => (
                      <div
                        key={bed.id}
                        style={{
                          background: 'white',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Số giường</label>
                            <div style={{ color: '#1f2937' }}>{bed.number}</div>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Trạng thái</label>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '1rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              backgroundColor: getStatusColor(bed.status),
                              color: 'white'
                            }}>
                              {getStatusLabel(bed.status)}
                            </span>
                          </div>
                          {bed.residentName && (
                            <>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>người cao tuổi</label>
                                <div style={{ color: '#1f2937' }}>{bed.residentName}</div>
                              </div>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Ngày vào</label>
                                <div style={{ color: '#1f2937' }}>
                                  {bed.assignedDate && new Date(bed.assignedDate).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                              {bed.healthCondition && (
                                <div>
                                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Tình trạng sức khỏe</label>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    backgroundColor: getHealthConditionColor(bed.healthCondition),
                                    color: 'white'
                                  }}>
                                    {getHealthConditionLabel(bed.healthCondition)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Mức độ chăm sóc</label>
                                <div style={{ color: '#1f2937' }}>{getCareLevelLabel(bed.careLevel)}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && selectedRoom && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ArrowRightIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                Chuyển phòng
              </h2>
              
              {selectedBed && selectedBed.residentName ? (
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ 
                    marginBottom: '1rem', 
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Thông tin người cao tuổi hiện tại
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Tên người cao tuổi</label>
                      <div style={{ color: '#1f2937', fontWeight: 600 }}>{selectedBed.residentName}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Phòng hiện tại</label>
                      <div style={{ color: '#1f2937' }}>Phòng {selectedRoom.number} - Giường {selectedBed.number}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Tình trạng sức khỏe</label>
                      {selectedBed.healthCondition ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          backgroundColor: getHealthConditionColor(selectedBed.healthCondition),
                          color: 'white'
                        }}>
                          {getHealthConditionLabel(selectedBed.healthCondition)}
                        </span>
                      ) : (
                        <div style={{ color: '#6b7280' }}>Chưa xác định</div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Mức độ chăm sóc</label>
                      <div style={{ color: '#1f2937' }}>{getCareLevelLabel(selectedBed.careLevel)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#fef3c7',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #fbbf24'
                }}>
                  <p style={{ color: '#92400e', margin: 0 }}>
                    Vui lòng chọn một giường có người cao tuổi để thực hiện chuyển phòng.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 600, 
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Chọn phòng chuyển đến
                </label>
                <select
                  value={transferTargetRoom}
                  onChange={(e) => {
                    setTransferTargetRoom(e.target.value);
                    setTransferTargetBed('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.75rem',
                    fontSize: '0.95rem',
                    color: '#374151',
                    fontWeight: 400,
                    background: '#fff',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms
                    .filter(room => room.id !== selectedRoom.id)
                    .map(room => (
                      <option key={room.id} value={room.id}>
                        Phòng {room.number} - Tầng {room.floor} ({getServicePackageLabel(room.servicePackage)}) - 
                        {room.beds.filter(bed => bed.status === 'available').length} giường trống
                      </option>
                    ))}
                </select>
              </div>

              {transferTargetRoom && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    fontSize: '1rem'
                  }}>
                    Chọn giường đích
                  </label>
                  <select
                    value={transferTargetBed}
                    onChange={(e) => setTransferTargetBed(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      fontSize: '0.95rem',
                      color: '#374151',
                      fontWeight: 400,
                      background: '#fff',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <option value="">-- Chọn giường --</option>
                    {rooms
                      .find(room => room.id === transferTargetRoom)
                      ?.beds.filter(bed => bed.status === 'available')
                      .map(bed => (
                        <option key={bed.id} value={bed.id}>
                          Giường {bed.number} - {getCareLevelLabel(bed.careLevel)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {transferTargetRoom && transferTargetBed && (
                <div style={{
                  background: '#ecfdf5',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #10b981'
                }}>
                  <h4 style={{ 
                    color: '#065f46', 
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <HeartIcon style={{ width: '1rem', height: '1rem' }} />
                    Xác nhận chuyển phòng
                  </h4>
                  <p style={{ color: '#059669', margin: 0, fontSize: '0.875rem' }}>
                    {selectedBed?.residentName} sẽ được chuyển từ Phòng {selectedRoom.number} - Giường {selectedBed?.number} 
                    đến {rooms.find(r => r.id === transferTargetRoom)?.number} - 
                    Giường {rooms.find(r => r.id === transferTargetRoom)?.beds.find(b => b.id === transferTargetBed)?.number}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedBed(null);
                    setTransferTargetRoom('');
                    setTransferTargetBed('');
                  }}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy
                </button>
                <button
                  disabled={!selectedBed?.residentName || !transferTargetRoom || !transferTargetBed}
                  onClick={() => {
                    if (selectedBed && transferTargetRoom && transferTargetBed) {
                      // Handle transfer logic here
                      const targetRoom = rooms.find(r => r.id === transferTargetRoom);
                      const targetBed = targetRoom?.beds.find(b => b.id === transferTargetBed);
                      
                      if (selectedBed.residentName && targetBed) {
                        // Update rooms state to reflect the transfer
                        setRooms(prevRooms => 
                          prevRooms.map(room => {
                            if (room.id === selectedRoom.id) {
                              return {
                                ...room,
                                beds: room.beds.map(bed => 
                                  bed.id === selectedBed.id 
                                    ? { 
                                        ...bed, 
                                        status: 'available' as const,
                                        residentId: undefined,
                                        residentName: undefined,
                                        assignedDate: undefined,
                                        healthCondition: undefined
                                      }
                                    : bed
                                ),
                                currentOccupancy: room.currentOccupancy - 1,
                                status: room.currentOccupancy - 1 === 0 ? 'available' as const : room.status
                              };
                            } else if (room.id === transferTargetRoom) {
                              return {
                                ...room,
                                beds: room.beds.map(bed => 
                                  bed.id === transferTargetBed 
                                    ? { 
                                        ...bed, 
                                        status: 'occupied' as const,
                                        residentId: selectedBed.residentId,
                                        residentName: selectedBed.residentName,
                                        assignedDate: new Date().toISOString().split('T')[0],
                                        healthCondition: selectedBed.healthCondition,
                                        careLevel: selectedBed.careLevel
                                      }
                                    : bed
                                ),
                                currentOccupancy: room.currentOccupancy + 1,
                                status: 'occupied' as const
                              };
                            }
                            return room;
                          })
                        );
                        
                        alert(`Đã chuyển ${selectedBed.residentName} thành công!`);
                      }
                    }
                    
                    setShowTransferModal(false);
                    setSelectedBed(null);
                    setTransferTargetRoom('');
                    setTransferTargetBed('');
                  }}
                  style={{
                    flex: 1,
                    background: selectedBed?.residentName && transferTargetRoom && transferTargetBed 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#e5e7eb',
                    color: selectedBed?.residentName && transferTargetRoom && transferTargetBed ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: selectedBed?.residentName && transferTargetRoom && transferTargetBed ? 'pointer' : 'not-allowed',
                    fontWeight: 600
                  }}
                >
                  Xác nhận chuyển
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Resident Modal */}
        {showAddResidentModal && addResidentRoom && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Thêm người cao tuổi vào phòng {addResidentRoom.number}</h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Chọn người cao tuổi</label>
                <select
                  value={selectedAddResident}
                  onChange={e => setSelectedAddResident(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                >
                  <option value="">-- Chọn người cao tuổi --</option>
                  {unassignedResidents.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Chọn giường trống</label>
                <select
                  value={selectedAddBed}
                  onChange={e => setSelectedAddBed(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                >
                  <option value="">-- Chọn giường --</option>
                  {addResidentRoom.beds.filter(b => b.status === 'available').map(bed => (
                    <option key={bed.id} value={bed.id}>Giường {bed.number}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => {
                    setShowAddResidentModal(false);
                    setAddResidentRoom(null);
                    setSelectedAddResident('');
                    setSelectedAddBed('');
                  }}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy
                </button>
                <button
                  disabled={!selectedAddResident || !selectedAddBed}
                  onClick={() => {
                    if (addResidentRoom && selectedAddResident && selectedAddBed) {
                      const resident = unassignedResidents.find(r => r.id === selectedAddResident);
                      setRooms(prevRooms => prevRooms.map(room => {
                        if (room.id === addResidentRoom.id) {
                          return {
                            ...room,
                            beds: room.beds.map(bed =>
                              bed.id === selectedAddBed
                                ? {
                                    ...bed,
                                    status: 'occupied',
                                    residentId: resident?.id,
                                    residentName: resident?.name,
                                    assignedDate: new Date().toISOString().split('T')[0],
                                    healthCondition: undefined
                                  }
                                : bed
                            ),
                            currentOccupancy: room.currentOccupancy + 1,
                            status: 'occupied'
                          };
                        }
                        return room;
                      }));
                      setUnassignedResidents(prev => prev.filter(r => r.id !== selectedAddResident));
                      setShowAddResidentModal(false);
                      setAddResidentRoom(null);
                      setSelectedAddResident('');
                      setSelectedAddBed('');
                    }
                  }}
                  style={{
                    flex: 1,
                    background: selectedAddResident && selectedAddBed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e5e7eb',
                    color: selectedAddResident && selectedAddBed ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: selectedAddResident && selectedAddBed ? 'pointer' : 'not-allowed',
                    fontWeight: 600
                  }}
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}