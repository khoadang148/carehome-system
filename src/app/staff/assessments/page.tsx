"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { staffAssignmentsAPI, careNotesAPI, carePlansAPI, roomsAPI, userAPI } from '@/lib/api';
import { 
  HeartIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';


interface Resident {
  id: number | string;
  full_name: string;
  room_number: string;
  age: number | string;
  careLevel: string;
  lastNote?: string;
  notesCount?: number;
  date_of_birth?: string;
  avatar?: string;
}

export default function CareNotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [careNotesMap, setCareNotesMap] = useState<Record<string, any[]>>({});
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [editNote, setEditNote] = useState<any | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  };
  const [confirmDelete, setConfirmDelete] = useState<{ note: any } | null>(null);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});


  useEffect(() => {
    if (!user || user.role !== 'staff') {
      router.push('/');
      return;
    }
    loadResidents();
  }, [user, router]);

  useEffect(() => {
    const filtered = residents.filter(resident =>
      (resident.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resident.room_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResidents(filtered);
  }, [residents, searchTerm]);

  const loadResidents = async () => {
    try {
      // Lấy danh sách assignments của staff đang đăng nhập
      const assignmentsData = await staffAssignmentsAPI.getMyAssignments();
      const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];
      
      // Debug: Log assignments data
      console.log('Raw assignments data for assessments:', assignmentsData);
      
      // Chỉ lấy những assignment có trạng thái active
      const activeAssignments = assignments.filter((assignment: any) => assignment.status === 'active');
      console.log('Active assignments:', activeAssignments);
      
      const residentsWithNotes = await Promise.all(activeAssignments.map(async (assignment: any) => {
        const resident = assignment.resident_id;
        
        let age = '';
        if (resident.date_of_birth) {
          const dob = new Date(resident.date_of_birth);
          const now = new Date();
          age = (now.getFullYear() - dob.getFullYear()).toString();
          const m = now.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
            age = (parseInt(age) - 1).toString();
          }
        }
        
        // Lấy số phòng từ assignment data
        let room_number = '';
        if (resident.room_number) {
          room_number = resident.room_number;
        } else {
          // Fallback: lấy từ care plan assignments
          try {
            const carePlanAssignments = await carePlansAPI.getByResidentId(resident._id);
            const carePlanAssignment = Array.isArray(carePlanAssignments) ? 
              carePlanAssignments.find((a: any) => a.assigned_room_id) : null;
            
            if (carePlanAssignment?.assigned_room_id) {
              const roomId = carePlanAssignment.assigned_room_id;
              // Đảm bảo roomId là string, không phải object
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              if (roomIdString) {
                const room = await roomsAPI.getById(roomIdString);
                room_number = room?.room_number || '';
              }
            }
        } catch {}
        }
        
        return {
          id: resident._id || resident.id,
          full_name: resident.full_name || resident.name || resident.fullName || '',
          room_number,
          age: age || '',
          careLevel: resident.care_level || resident.careLevel || '',
          date_of_birth: resident.date_of_birth || resident.dateOfBirth || '',
          avatar: resident.avatar || '',
        };
      }));
      
      setResidents(residentsWithNotes);
      
      // Load care notes cho từng resident song song
      const notesMap: Record<string, any[]> = {};
      await Promise.all(residentsWithNotes.map(async (resident) => {
        try {
          const notes = await careNotesAPI.getAll({ resident_id: resident.id });
          notesMap[resident.id] = Array.isArray(notes) ? notes : [];
        } catch {
          notesMap[resident.id] = [];
        }
      }));
      setCareNotesMap(notesMap);
    } catch (error) {
      setResidents([]);
      setCareNotesMap({});
      console.error('Error loading residents:', error);
    }
  };

  const handleShowNotes = (residentId: string) => {
    console.log('Xem ghi chú cho resident:', residentId, careNotesMap[residentId]);
    setSelectedResidentId(residentId);
  };
  const handleCloseModal = () => setSelectedResidentId(null);

  const handleCreateCareNote = (resident: Resident) => {
    router.push(`/staff/assessments/new?residentId=${resident.id}&residentName=${encodeURIComponent(resident.full_name)}`);
  };



  if (!user || user.role !== 'staff') {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b'
              }}>
                Nhật ký theo dõi
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0'
              }}>
                Ghi chú quan sát và chăm sóc hàng ngày cho {residents.length} cư dân đang được phân công
              </p>
            </div>
          </div>

          <div style={{
            position: 'relative',
            maxWidth: '400px'
          }}>
            <MagnifyingGlassIcon style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1.25rem',
              height: '1.25rem',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Tìm kiếm người cao tuổi theo tên hoặc phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredResidents.map((resident) => {
            const notes = careNotesMap[resident.id] || [];
            const lastNote = notes[0]?.notes || 'Chưa có ghi chú';
            const notesCount = notes.length;
            return (
            <div
              key={resident.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '2.2rem',
                  height: '2.2rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #e5e7eb',
                  flexShrink: 0
                }}>
                  <img
                    src={resident.avatar ? userAPI.getAvatarUrl(resident.avatar) : ''}
                    alt={`Avatar của ${resident.full_name}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                  <UserIcon 
                    style={{
                      width: '1.1rem',
                      height: '1.1rem',
                      color: '#9ca3af',
                      display: 'none'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.97rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span><span style={{ color: '#2563eb', fontWeight: 500 }}>Họ và tên:</span> <span style={{ fontWeight: 600 }}>{resident.full_name}</span></span>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <span><span style={{ color: '#2563eb', fontWeight: 500 }}>Phòng:</span> {resident.room_number}</span>
                  {resident.date_of_birth && (
                    (() => {
                      const dob = new Date(resident.date_of_birth);
                      const now = new Date();
                      let age = now.getFullYear() - dob.getFullYear();
                      const m = now.getMonth() - dob.getMonth();
                      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
                        age--;
                      }
                      const day = dob.getDate().toString().padStart(2, '0');
                      const month = (dob.getMonth() + 1).toString().padStart(2, '0');
                      const year = dob.getFullYear();
                      return (
                        <>
                          <span style={{ color: '#d1d5db' }}>|</span>
                          <span>
                            <span style={{ color: '#2563eb', fontWeight: 500 }}>Ngày sinh:</span> {`${day}/${month}/${year}`} ({age} tuổi)
                          </span>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <DocumentTextIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                <span style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: 500 }}>Ghi chú gần nhất:</span>
                  <span style={{ fontSize: '0.875rem', color: '#475569' }}>{lastNote}</span>
              </div>

              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px', // hoặc 4px nếu muốn sát hơn
  marginBottom: '1rem'
}}>
  <span style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: 500 }}>Tổng ghi chú:</span>
  <span style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: 700 }}>{notesCount}</span>
</div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleShowNotes(String(resident.id))}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <DocumentTextIcon style={{ width: '1rem', height: '1rem' }} />
                    Xem ghi chú
                  </button>
              <button
                onClick={() => handleCreateCareNote(resident)}
                style={{
                      flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Thêm ghi chú mới
              </button>
            </div>
              </div>
            );
          })}
        </div>

        {/* Modal xem ghi chú */}
        {selectedResidentId && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '100px',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: 1000,
              width: '1000vw',
              maxHeight: 1000,
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: 24,
              position: 'relative',
            }}>
              <button onClick={handleCloseModal} style={{ position: 'absolute', top: 12, right: 16, fontWeight: 700, fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginTop: 0, 
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '2px solid #e2e8f0'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#1e293b', 
                  fontWeight: 700, 
                  fontSize: '1.375rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Danh sách ghi chú chăm sóc
                </h2>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {(selectedResidentId && careNotesMap[selectedResidentId]?.length > 0) ? (
                  careNotesMap[selectedResidentId].map(note => (
                    <div key={note._id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      marginBottom: 16,
                      padding: 14,
                      background: '#f8fafc',
                      boxShadow: '0 2px 8px rgba(59,130,246,0.07)',
                      transition: 'box-shadow 0.2s',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 15 }}>
                        Ngày: {note.date ? formatDateDDMMYYYY(note.date) : '---'}
                      </div>
                      <div style={{ fontSize: 15, color: '#374151', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>Loại đánh giá: </span>{note.assessment_type || '---'}
                      </div>
                      <div style={{ color: '#334155', margin: '4px 0', fontSize: 16, fontWeight: 500, whiteSpace: 'pre-line' }}>
                        <span style={{ fontWeight: 600 }}>Nội dung: </span>{note.notes || note.content || 'Không có ghi chú'}
                      </div>
                      <div style={{ fontSize: 15, color: '#374151', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>Khuyến nghị: </span>{note.recommendations || '---'}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Nhân viên: </span>
                        {(() => {
                          const staffId = note.conducted_by;
                          if (!staffId) return '---';
                          
                          // Check if conducted_by is an object with full_name
                          if (typeof staffId === 'object' && staffId.full_name) {
                            return staffId.full_name;
                          }
                          
                          // If it's a string ID, use the staffNames mapping
                          if (typeof staffId === 'string') {
                            if (staffNames[staffId]) return staffNames[staffId];
                            userAPI.getById(staffId)
                              .then(data => {
                                setStaffNames(prev => ({ ...prev, [staffId]: data.full_name || data.username || data.email || staffId }));
                              })
                              .catch(() => {
                                setStaffNames(prev => ({ ...prev, [staffId]: staffId }));
                              });
                            return 'Đang tải...';
                          }
                          
                          return '---';
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          onClick={() => { setEditNote(note); setEditContent(note.content); }}
                          style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e42 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 14px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ note })}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 14px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.7 : 1
                          }}
                          disabled={isDeleting}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', textAlign: 'center', marginTop: 32 }}>Chưa có ghi chú nào.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal sửa ghi chú (HTML/CSS thuần) */}
        {editNote && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 14,
              maxWidth: 400,
              width: '90vw',
              padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              position: 'relative',
            }}>
              <button onClick={() => setEditNote(null)} style={{ position: 'absolute', top: 12, right: 16, fontWeight: 700, fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
              <h3 style={{ color: '#2563eb', fontWeight: 700, marginTop: 0 }}>Sửa ghi chú</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Loại đánh giá:</label>
                <input
                  type="text"
                  value={editNote.assessment_type || ''}
                  onChange={e => setEditNote({ ...editNote, assessment_type: e.target.value })}
                  style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 15 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Nội dung:</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={5}
                  style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 15, marginBottom: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Khuyến nghị:</label>
                <input
                  type="text"
                  value={editNote.recommendations || ''}
                  onChange={e => setEditNote({ ...editNote, recommendations: e.target.value })}
                  style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 15 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>Ngày:</label>
                <input
                  type="text"
                  value={editNote.date ? formatDateDDMMYYYY(editNote.date) : ''}
                  disabled
                  style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 15, background: '#f3f4f6' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600 }}>Nhân viên:</label>
                <input
                  type="text"
                  value={(() => {
                    const staffId = editNote.conducted_by;
                    if (!staffId) return '---';
                    
                    // Check if conducted_by is an object with full_name
                    if (typeof staffId === 'object' && staffId.full_name) {
                      return staffId.full_name;
                    }
                    
                    // If it's a string ID, use the staffNames mapping
                    if (typeof staffId === 'string') {
                      if (staffNames[staffId]) return staffNames[staffId];
                      userAPI.getById(staffId)
                        .then(data => {
                          setStaffNames(prev => ({ ...prev, [staffId]: data.full_name || data.username || data.email || staffId }));
                        })
                        .catch(() => {
                          setStaffNames(prev => ({ ...prev, [staffId]: staffId }));
                        });
                      return 'Đang tải...';
                    }
                    
                    return '---';
                  })()}
                  disabled
                  style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 15, background: '#f3f4f6' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={async () => {
                    if (!editContent || !editContent.trim()) { showNotification('Nội dung không được để trống!', 'error'); return; }
                    try {
                      await careNotesAPI.update(editNote._id, {
                        assessment_type: editNote.assessment_type || 'Đánh giá tổng quát',
                        date: editNote.date || new Date().toISOString(),
                        notes: editContent,
                        recommendations: editNote.recommendations || '',
                        resident_id: editNote.resident_id || editNote.residentId,
                        conducted_by: editNote.conducted_by || editNote.staffId,
                      });
                      const residentId = editNote.resident_id || editNote.residentId;
                      const notes = await careNotesAPI.getAll({ resident_id: residentId });
                      setCareNotesMap(prev => ({ ...prev, [residentId]: Array.isArray(notes) ? notes : [] }));
                      setEditNote(null);
                      showNotification('Cập nhật đánh giá thành công!', 'success');
                    } catch (err) {
                      showNotification('Cập nhật đánh giá thất bại!', 'error');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 18px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Lưu
                </button>
                <button
                  onClick={() => setEditNote(null)}
                  style={{
                    background: '#e5e7eb',
                    color: '#334155',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 18px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {notification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.15)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: notification.type === 'success' ? '#16a34a' : '#dc2626',
            border: `2px solid ${notification.type === 'success' ? '#22c55e' : '#ef4444'}`,
            borderRadius: 12,
            minWidth: 260,
            maxWidth: 350,
            padding: '24px 32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            textAlign: 'center',
            fontSize: 17,
            fontWeight: 600,
            position: 'relative',
            animation: 'fadeIn 0.2s',
          }}>
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 12,
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              aria-label="Đóng"
            >×</button>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }`}</style>
        </div>
      )}
      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.15)',
          zIndex: 21000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            minWidth: 300,
            maxWidth: 350,
            padding: '28px 32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            textAlign: 'center',
            fontSize: 17,
            fontWeight: 600,
            position: 'relative',
            animation: 'fadeIn 0.2s',
          }}>
            <div style={{ color: '#dc2626', fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Xác nhận xóa</div>
            <div style={{ color: '#334155', fontSize: 15, marginBottom: 18 }}>Bạn có chắc muốn xóa ghi chú này không?</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await careNotesAPI.delete(confirmDelete.note._id);
                    // Reload notes
                    const notes = await careNotesAPI.getAll({ residentId: confirmDelete.note.resident_id || confirmDelete.note.residentId });
                    setCareNotesMap(prev => ({ ...prev, [confirmDelete.note.resident_id || confirmDelete.note.residentId]: Array.isArray(notes) ? notes : [] }));
                    setConfirmDelete(null);
                    showNotification('Đã xóa đánh giá thành công!', 'success');
                  } catch (err) {
                    setConfirmDelete(null);
                    showNotification('Xóa đánh giá thất bại!', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 22px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1
                }}
                disabled={isDeleting}
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  background: '#e5e7eb',
                  color: '#334155',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 22px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }`}</style>
          </div>
        </div>
      )}
    </div>
  );
} 
