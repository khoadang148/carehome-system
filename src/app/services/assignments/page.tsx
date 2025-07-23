'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { residentAPI, carePlansAPI, roomsAPI } from '@/lib/api';

export default function ServiceAssignmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});

  useEffect(() => {
    if (!user) return;
    if (!(user.role === 'admin' || user.role === 'staff')) {
      router.push('/');
      return;
    }
    setLoading(true);
    setError(null);
    residentAPI.getAll()
      .then(async (resList) => {
        setResidents(resList);
        // Lấy assignment cho từng resident song song
        const allAssignments = await Promise.all(
          resList.map(async (r: any) => {
            try {
              const data = await carePlansAPI.getByResidentId(r._id);
              // Lấy số phòng giống resident page
              const assignment = Array.isArray(data) ? data.find((a: any) => a.assigned_room_id) : null;
              const roomId = assignment?.assigned_room_id?._id || assignment?.assigned_room_id;
              if (roomId) {
                try {
                  const room = await roomsAPI.getById(roomId);
                  setRoomNumbers(prev => ({ ...prev, [r._id]: room?.room_number || 'Chưa cập nhật' }));
                } catch {
                  setRoomNumbers(prev => ({ ...prev, [r._id]: 'Chưa cập nhật' }));
                }
              } else {
                setRoomNumbers(prev => ({ ...prev, [r._id]: 'Chưa cập nhật' }));
              }
              return (Array.isArray(data) ? data : []).map((a: any) => ({ ...a, resident: r }));
            } catch {
              setRoomNumbers(prev => ({ ...prev, [r._id]: 'Chưa cập nhật' }));
              return [];
            }
          })
        );
        setAssignments(allAssignments.flat());
      })
      .catch(() => setError('Không thể tải danh sách cư dân hoặc đăng ký dịch vụ.'))
      .finally(() => setLoading(false));
  }, [user, router]);

  // Filter theo search term
  const filteredAssignments = assignments.filter(a => {
    const residentName = a.resident?.full_name || a.resident?.name || '';
    const planNames = Array.isArray(a.care_plan_ids) ? a.care_plan_ids.map((cp: any) => cp.plan_name).join(', ') : '';
    return (
      residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations giống residents */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
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
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em'
          }}>
            Danh sách cư dân đã đăng ký dịch vụ
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: '0.25rem 0 0 0',
            fontWeight: 500
          }}>
            Tổng số đăng ký: {filteredAssignments.length}
          </p>
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tìm theo tên cư dân hoặc gói dịch vụ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: 320,
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem',
                background: 'white'
              }}
            />
            <span style={{ color: '#667eea', fontWeight: 600 }}>
              Hiển thị: {filteredAssignments.length} đăng ký
            </span>
          </div>
        </div>
        {/* Table Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải dữ liệu...</div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>{error}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Người cao tuổi</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Phòng</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Gói dịch vụ</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Trạng thái</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Ngày bắt đầu</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>Không có dữ liệu đăng ký dịch vụ nào.</td></tr>
                  ) : (
                    filteredAssignments.map((a, idx) => (
                      <tr key={a._id + '-' + idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              overflow: 'hidden'
                            }}>
                              {a.resident?.avatar ? (
                                <img src={a.resident.avatar} alt={a.resident.full_name || a.resident.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (a.resident?.full_name || a.resident?.name || '').charAt(0)
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                                {a.resident?.full_name || a.resident?.name || ''}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                                ID: {a.resident?._id || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>{roomNumbers[a.resident?._id] || ''}</td>
                        <td style={{ padding: '1rem' }}>
                          {Array.isArray(a.care_plan_ids)
                            ? a.care_plan_ids.map((cp: any) => cp.plan_name).join(', ')
                            : ''}
                        </td>
                        <td style={{ padding: '1rem' }}>{a.status === 'active' ? 'Đang sử dụng' : a.status}</td>
                        <td style={{ padding: '1rem' }}>{a.start_date ? new Date(a.start_date).toLocaleDateString('vi-VN') : ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 