"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { roomsAPI, bedsAPI, roomTypesAPI, bedAssignmentsAPI } from "@/lib/api";
import { BuildingOfficeIcon, MagnifyingGlassIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Room {
  _id: string;
  room_number: string;
  bed_count: number;
  room_type: string;
  gender: string;
  floor: number;
  status: string;
}

interface Bed {
  _id: string;
  bed_number: string;
  room_id: string;
  bed_type: string;
  status: string;
}

interface BedAssignment {
  _id: string;
  resident_id: { _id: string; full_name: string };
  bed_id: { _id: string; bed_number: string; room_id: { _id: string; room_number: string } };
  assigned_date: string;
  unassigned_date: string | null;
  assigned_by: { _id: string; full_name: string };
}

interface RoomType {
  _id: string;
  room_type: string;
  type_name: string;
  bed_count: string;
  monthly_price: number;
  description: string;
  amenities: string[];
}

export default function RoomManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      roomsAPI.getAll(),
      bedsAPI.getAll(),
      bedAssignmentsAPI.getAll(),
      roomTypesAPI.getAll(),
    ])
      .then(([rooms, beds, assignments, types]) => {
        setRooms(rooms);
        setBeds(beds);
        setBedAssignments(assignments);
        setRoomTypes(types);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải dữ liệu phòng/giường.");
        setLoading(false);
      });
  }, []);

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  const bedsOfRoom = (roomId: string) =>
    beds.filter((b) => b.room_id === roomId);

  const getResidentOfBed = (bedId: string) => {
    const assignment = bedAssignments.find(
      (a) => a && a.bed_id && a.bed_id._id === bedId && !a.unassigned_date
    );
    return assignment ? assignment.resident_id.full_name : null;
  };

  // Tìm kiếm phòng theo số phòng, loại phòng, tầng
  const filteredRooms = rooms.filter((room) => {
    const type = getRoomType(room.room_type);
    const search = searchTerm.toLowerCase();
    return (
      room.room_number.toLowerCase().includes(search) ||
      (type?.type_name?.toLowerCase() || '').includes(search) ||
      (room.floor + '').includes(search)
    );
  });

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Back Button */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <button
          onClick={() => router.push('/admin')}
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
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>

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
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}>
              <BuildingOfficeIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
                  }}>
                Quản lý phòng & giường
                  </h1>
              <p style={{fontSize: '1rem', color: '#64748b', margin: '0.25rem 0 0 0', fontWeight: 500}}>
                Tổng số: {rooms.length} phòng
                  </p>
            </div>
          </div>
          </div>

        {/* Search Section */}
          <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <div style={{flex: 1, position: 'relative'}}>
                <input
                  type="text"
                placeholder="Tìm theo số phòng, loại phòng, tầng..."
                  value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              />
              <MagnifyingGlassIcon style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                color: '#9ca3af'
              }} />
              </div>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <p style={{fontSize: '0.875rem', color: '#3b82f6', margin: 0, fontWeight: 600}}>
                Hiển thị: {filteredRooms.length} phòng
              </p>
            </div>
          </div>
        </div>

        {/* Rooms Table */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
          overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{
                  background: '#3b82f6',
                  borderBottom: '1px solid #2563eb'
                }}>
                  <th style={thStyle}>Số phòng</th>
                  <th style={thStyle}>Loại phòng</th>
                  <th style={thStyle}>Số giường</th>
                  <th style={thStyle}>Loại phòng theo giới tính</th>
                  <th style={thStyle}>Tầng</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => {
                  const type = getRoomType(room.room_type);
                  return (
                    <tr
                      key={room._id}
                    style={{
                        borderBottom: index < filteredRooms.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={tdStyle}>{room.room_number}</td>
                      <td style={tdStyle}>{type ? type.type_name : room.room_type}</td>
                      <td style={tdStyle}>{room.bed_count}</td>
                      <td style={tdStyle}>{room.gender === "male" ? "Nam" : room.gender === "female" ? "Nữ" : ""}</td>
                      <td style={tdStyle}>{room.floor}</td>
                      <td style={{
  ...tdStyle,
  color: room.status === "available" ? "#16a34a" : "#dc2626", // xanh lá cho còn trống, đỏ cho hết giường
  fontWeight: 700
}}>
  {room.status === "available" ? "Còn trống" : "Hết giường"}
</td>
                      <td style={tdStyle}>
                  <button
                    style={{
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 16px',
                      cursor: 'pointer',
                  fontWeight: 600, 
                      display: 'flex',
                      alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s',
                          }}
                          onClick={() => setSelectedRoomId(selectedRoomId === room._id ? null : room._id)}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#2563eb';
                          }}
                          onMouseOut={e => {
                              e.currentTarget.style.background = '#3b82f6';
                            }}
                          >
                          <EyeIcon style={{width: 18, height: 18}} />
                          {selectedRoomId === room._id ? "Ẩn giường" : "Xem giường"}
                  </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
                </div>
              </div>

        {/* Beds Table for selected room */}
        {selectedRoomId && (
              <div style={{ 
    marginTop: 32,
                background: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
    border: '1px solid #e5e7eb'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        margin: 0,
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
                    color: 'white',
          fontSize: '1.25rem',
          fontWeight: 'bold'
                  }}>
          {rooms.find((r) => r._id === selectedRoomId)?.room_number}
                </div>
        Danh sách giường phòng {rooms.find((r) => r._id === selectedRoomId)?.room_number}
      </h2>
      {/* Thông tin loại phòng */}
      {(() => {
        const room = rooms.find((r) => r._id === selectedRoomId);
        const type = room ? getRoomType(room.room_type) : null;
        if (!type) return null;
        return (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
                <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                  display: 'flex',
                  alignItems: 'center',
                gap: '0.75rem',
                        padding: '0.75rem',
                background: '#f0f9ff',
                borderRadius: '0.5rem',
                border: '1px solid #0ea5e9'
              }}>
                          <div style={{ 
                  width: '2rem',
                  height: '2rem',
                  background: '#0ea5e9',
                  borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                  justifyContent: 'center',
                                    fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  LG
                                </div>
                            <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Loại phòng</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0ea5e9' }}>{type.type_name}</div>
                            </div>
                        </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: '#f0fdf4',
                borderRadius: '0.5rem',
                border: '1px solid #22c55e'
              }}>
          <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#22c55e',
                  borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  ₫
                    </div>
                    <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Giá thuê</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#22c55e' }}>{type.monthly_price?.toLocaleString()}đ/tháng</div>
                    </div>
                    </div>
                    </div>
            <div style={{ marginTop: '1rem' }}>
                <div style={{
                          padding: '1rem',
                background: '#fafafa',
                borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb'
              }}>
                <div style={{
                                    fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500,
                  marginBottom: '0.5rem'
                }}>
                  Mô tả
                                </div>
                <div style={{
                  fontSize: '0.95rem',
                    color: '#374151',
                  lineHeight: '1.5'
                }}>
                  {type.description}
              </div>
            </div>
          </div>
            {type.amenities && type.amenities.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
          <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500,
                  marginBottom: '0.75rem'
                }}>
                  Tiện ích
                </div>
            <div style={{
                display: 'flex',
                  flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                  {type.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-flex',
                    alignItems: 'center',
                        padding: '0.375rem 0.75rem',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        borderRadius: '9999px',
                          fontSize: '0.875rem',
                        fontWeight: 500,
                        border: '1px solid #7dd3fc'
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
              </div>
                </div>
              )}
                </div>
        );
      })()}
              </div>
    <div style={{overflowX: 'auto'}}>
      {bedsOfRoom(selectedRoomId).length === 0 ? (
                <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b',
          background: '#f1f5f9',
          borderRadius: '1rem',
          marginTop: '1rem',
          fontWeight: 500,
          fontSize: '1.1rem',
                    display: 'flex',
          flexDirection: 'column',
                    alignItems: 'center',
          gap: '1rem',
        }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75v-1.5A2.25 2.25 0 016.75 9h10.5a2.25 2.25 0 012.25 2.25v1.5m-15 0v4.5A2.25 2.25 0 006.75 19.5h10.5a2.25 2.25 0 002.25-2.25v-4.5m-15 0h15" /></svg>
          Phòng này hiện chưa có giường nào.
                </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#3b82f6', borderBottom: '1px solid #2563eb' }}>
              <th style={thStyle}>Số giường</th>
              <th style={thStyle}>Loại giường</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Người cao tuổi đang ở</th>
            </tr>
          </thead>
          <tbody>
            {bedsOfRoom(selectedRoomId).map((bed, idx) => (
              <tr key={bed._id} style={{ borderBottom: idx < bedsOfRoom(selectedRoomId).length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'all 0.2s' }}>
                <td style={tdStyle}>{bed.bed_number}</td>
                <td style={tdStyle}>{bed.bed_type}</td>
                <td style={tdStyle}>{bed.status === "occupied" ? "Đang sử dụng" : "Còn trống"}</td>
                <td style={tdStyle}>{getResidentOfBed(bed._id) || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredRooms.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <BuildingOfficeIcon style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              color: '#d1d5db'
            }} />
                  <h3 style={{ 
              fontSize: '1.125rem',
                          fontWeight: 600,
              margin: '0 0 0.5rem 0',
              color: '#374151'
            }}>
              Không tìm thấy phòng phù hợp
            </h3>
            <p style={{margin: 0, fontSize: '0.875rem'}}>
              Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc
                  </p>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "1rem",
  textAlign: "center" as const,
  fontWeight: 700,
  fontSize: 16,
  color: '#ffffff',
  background: '#3b82f6',
  borderBottom: '1px solid #2563eb',
};
const tdStyle = {
  padding: "1rem",
  fontSize: 15,
  color: '#1f2937',
  textAlign: 'center' as const,
  fontWeight: 500,
  background: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
};
