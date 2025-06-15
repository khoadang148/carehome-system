"use client";

import { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  EyeIcon,
  UserGroupIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon
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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    number: '',
    floor: 1,
    type: 'single',
    capacity: 1,
    servicePackage: 'basic',
    genderRestriction: 'mixed',
    specialCare: false,
    amenities: [],
    monthlyRate: 0
  });

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.beds.some(bed => bed.residentName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesService = serviceFilter === 'all' || room.servicePackage === serviceFilter;
    
    return matchesSearch && matchesFloor && matchesStatus && matchesService;
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

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;

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
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 700,
                margin: '0 0 0.5rem 0',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Quản lý Phòng & Giường
              </h1>
              <p style={{ color: '#64748b', margin: 0 }}>
                Phân chia phòng, giường theo dịch vụ và tình trạng sức khỏe
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Thêm phòng
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{totalRooms}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tổng phòng</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{availableRooms}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Phòng trống</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{occupiedRooms}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Đã thuê</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{maintenanceRooms}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Bảo trì</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '1rem', alignItems: 'end' }}>
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
                placeholder="Tìm kiếm phòng hoặc cư dân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="all">Tất cả tầng</option>
              <option value="1">Tầng 1</option>
              <option value="2">Tầng 2</option>
              <option value="3">Tầng 3</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Trống</option>
              <option value="occupied">Đã thuê</option>
              <option value="maintenance">Bảo trì</option>
              <option value="reserved">Đã đặt</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <option value="all">Tất cả gói dịch vụ</option>
              <option value="basic">Cơ bản</option>
              <option value="standard">Tiêu chuẩn</option>
              <option value="premium">Cao cấp</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>

        {/* Rooms Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              style={{
                background: 'white',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}
            >
              {/* Room Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 0.25rem 0',
                    color: '#1f2937'
                  }}>
                    Phòng {room.number}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Tầng {room.floor} • {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowDetailModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </div>

              {/* Room Status */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: getStatusColor(room.status),
                  color: 'white'
                }}>
                  {getStatusLabel(room.status)}
                </span>
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: '#f3f4f6',
                  color: '#374151'
                }}>
                  {room.servicePackage.charAt(0).toUpperCase() + room.servicePackage.slice(1)}
                </span>
              </div>

              {/* Room Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sức chứa</div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>
                    {room.currentOccupancy}/{room.capacity} người
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Giá thuê/tháng</div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>
                    {room.monthlyRate.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
              </div>

              {/* Beds */}
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Giường ({room.beds.length})
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {room.beds.map((bed) => (
                    <div
                      key={bed.id}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>
                            Giường {bed.number}
                          </div>
                          {bed.residentName ? (
                            <div>
                              <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                                {bed.residentName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Từ: {bed.assignedDate && new Date(bed.assignedDate).toLocaleDateString('vi-VN')}
                              </div>
                              {bed.healthCondition && (
                                <span style={{
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: getHealthConditionColor(bed.healthCondition),
                                  color: 'white',
                                  marginTop: '0.25rem',
                                  display: 'inline-block'
                                }}>
                                  {getHealthConditionLabel(bed.healthCondition)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              Giường trống
                            </div>
                          )}
                        </div>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(bed.status)
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {room.amenities.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Tiện nghi
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#e5e7eb',
                          color: '#374151'
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
                      <div style={{ color: '#1f2937' }}>{selectedRoom.type}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Gói dịch vụ</label>
                      <div style={{ color: '#1f2937' }}>{selectedRoom.servicePackage}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Giới tính</label>
                      <div style={{ color: '#1f2937' }}>{selectedRoom.genderRestriction}</div>
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
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, color: '#374151' }}>Cư dân</label>
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
                                <div style={{ color: '#1f2937' }}>{bed.careLevel}</div>
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
      </div>
    </div>
  );
}