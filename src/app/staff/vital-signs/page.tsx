"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  UserIcon,
  PlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  FireIcon,
  ScaleIcon,
  BeakerIcon,
  HandRaisedIcon,
  CloudIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  FireIcon as FireIconSolid,
  CloudIcon as CloudIconSolid
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

import { format, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getVitalSignsStatusColor } from '@/lib/utils/vital-signs-utils';
import { VITAL_SIGNS_STATUS_LABELS } from '@/lib/constants/vital-signs';
import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI, userAPI } from '@/lib/api';

// Helper function to ensure string values
const ensureString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    // Handle resident object
    if (value.full_name || value.fullName || value.name) {
      return value.full_name || value.fullName || value.name;
    }
    // Handle staff object
    if (value.username || value.email) {
      return value.username || value.email;
    }
    // Handle other objects - try to get a meaningful string
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    return 'Unknown';
  }
  if (value === null || value === undefined) return 'N/A';
  return String(value || 'N/A');
};

export default function StaffVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  // State management
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [staffMap, setStaffMap] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  // UI state
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: 'success' | 'error', time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationIdRef = useRef(0);

  // Load residents from API when component mounts
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        let mapped: any[] = [];
        
        if (user?.role === 'staff') {
          // Staff chỉ thấy residents được phân công
          const data = await staffAssignmentsAPI.getMyAssignments();
          const assignmentsData = Array.isArray(data) ? data : [];
          
          // Debug: Log assignments data
          console.log('Raw assignments data:', assignmentsData);
          
          // Map API data về đúng format UI và chỉ lấy những assignment active
          mapped = assignmentsData
            .filter((assignment: any) => assignment.status === 'active') // Chỉ lấy active assignments
            .map((assignment: any) => {
              const resident = assignment.resident_id;
              
              return {
                id: resident._id,
                name: resident.full_name || '',
                avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
                assignmentStatus: assignment.status || 'unknown',
                assignmentId: assignment._id,
              };
            });
        } else if (user?.role === 'admin') {
          // Admin thấy tất cả residents
          const data = await residentAPI.getAll();
          const residentsData = Array.isArray(data) ? data : [];
          
          mapped = residentsData.map((resident: any) => ({
            id: resident._id,
            name: resident.full_name || '',
            avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
          }));
        }
        
        setResidents(mapped);
        
        // Lấy số phòng cho từng resident
        mapped.forEach(async (resident: any) => {
          try {
            const assignments = await carePlansAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
            const roomId = assignment?.assigned_room_id;
            // Đảm bảo roomId là string, không phải object
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa cập nhật' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
          }
        });
        
      } catch (err) {
        console.error('Error loading residents:', err);
        setResidents([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchResidents();
    }
  }, [user]);

  // Load vital signs data
  useEffect(() => {
    const fetchVitalSigns = async () => {
      try {
        const data = await vitalSignsAPI.getAll();
        const vitalSignsData = Array.isArray(data) ? data : [];
        console.log('=== FETCHED VITAL SIGNS ===');
        console.log('Raw vital signs data:', vitalSignsData);
        console.log('Vital signs count:', vitalSignsData.length);
        
        if (vitalSignsData.length > 0) {
          console.log('First vital sign sample:', vitalSignsData[0]);
          console.log('Resident IDs in vital signs:', vitalSignsData.map(vs => vs.resident_id));
        }
        
        setVitalSigns(vitalSignsData);
        
        // Build staff map
        const staffIds = [...new Set(vitalSignsData.map(vs => vs.recorded_by).filter(Boolean))];
        const staffMapData: {[key: string]: string} = {};
        
        for (const staffId of staffIds) {
          if (staffId && typeof staffId === 'string' && staffId.trim() !== '') {
            try {
              const staff = await userAPI.getById(staffId);
              staffMapData[staffId] = staff?.username || staff?.email || 'Unknown';
            } catch (error) {
              console.warn(`Failed to fetch staff with ID ${staffId}:`, error);
              staffMapData[staffId] = 'Unknown';
            }
          }
        }
        
        setStaffMap(staffMapData);
      } catch (err) {
        console.error('Error loading vital signs:', err);
        setVitalSigns([]);
      }
    };
    
    if (user) {
      fetchVitalSigns();
    }
  }, [user]);

  // Transform vital signs data for display
  const transformVitalSignsForDisplay = (vitalSignsData: any[]) => {
    return vitalSignsData.map(vs => {
      // Find resident info
      const resident = residents.find(r => r.id === vs.resident_id);
      
      // Handle date_time field from backend
      const dateTime = vs.date_time || vs.date;
      let date = '';
      let time = '';
      
      if (dateTime) {
        try {
          // Parse date string from backend (format: "2025-08-03T00:58:06.112Z")
          let dateObj: Date;
          
          if (typeof dateTime === 'string') {
            // Parse date string from backend more carefully
            // If it's ISO format like "2025-08-03T00:58:06.112Z"
            if (dateTime.includes('T') && dateTime.includes('Z')) {
              dateObj = new Date(dateTime);
            } else {
              // If it's just date string like "2025-08-03", parse manually
              const parts = dateTime.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                const day = parseInt(parts[2]);
                dateObj = new Date(year, month, day);
              } else {
                dateObj = new Date(dateTime);
              }
            }
          } else {
            // If it's a Date object, use it directly
            dateObj = dateTime;
          }
          
          if (!isNaN(dateObj.getTime())) {
            // Subtract 7 hours to compensate for backend GMT+7 adjustment
            const adjustedDate = new Date(dateObj.getTime() - 7 * 60 * 60 * 1000);
            
            // Format date as DD/MM/YYYY for Vietnamese format
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
            const year = adjustedDate.getFullYear();
            date = `${day}/${month}/${year}`;
            console.log('Final formatted date:', date);
            
            time = adjustedDate.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
        } catch (error) {
          console.warn('Error processing date_time:', error);
        }
      }
      
              return {
          id: vs._id,
          residentId: vs.resident_id,
          residentName: resident?.name || 'Unknown',
          residentAvatar: resident?.avatar,
          date: date,
          time: time,
          bloodPressure: vs.blood_pressure || vs.bloodPressure,
          heartRate: vs.heart_rate || vs.heartRate,
          temperature: vs.temperature,
          oxygenSaturation: vs.oxygen_level || vs.oxygen_saturation || vs.oxygenSaturation,
          respiratoryRate: vs.respiratory_rate || vs.respiratoryRate,
          weight: vs.weight,
          notes: vs.notes,
          recordedBy: vs.recorded_by || vs.recordedBy || null,
        };
    });
  };

  // Get filtered vital signs
  const getFilteredVitalSigns = (residentId?: string, dateFilter?: string) => {
    let filtered = vitalSigns;
    
    console.log('=== FILTER DEBUG ===');
    console.log('Filtering by residentId:', residentId);
    console.log('Filtering by date:', dateFilter);
    console.log('Total vital signs before filter:', filtered.length);
    
    if (residentId) {
      filtered = filtered.filter(vs => {
        const match = vs.resident_id === residentId;
        console.log(`Vital sign resident_id: ${vs.resident_id}, match: ${match}`);
        return match;
      });
      console.log('After resident filter:', filtered.length);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(vs => {
        const dateTime = vs.date_time || vs.date;
        if (!dateTime) return false;
        
        try {
          let dateObj: Date;
          
          if (typeof dateTime === 'string') {
            if (dateTime.includes('T') && dateTime.includes('Z')) {
              dateObj = new Date(dateTime);
            } else {
              const parts = dateTime.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const day = parseInt(parts[2]);
                dateObj = new Date(year, month, day);
              } else {
                dateObj = new Date(dateTime);
              }
            }
          } else {
            dateObj = dateTime;
          }
          
          if (!isNaN(dateObj.getTime())) {
            // Subtract 7 hours to compensate for backend GMT+7 adjustment
            const adjustedDate = new Date(dateObj.getTime() - 7 * 60 * 60 * 1000);
            
            // Format date as YYYY-MM-DD for comparison
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
            const year = adjustedDate.getFullYear();
            const formattedDate = `${year}-${month}-${day}`;
            
            const match = formattedDate === dateFilter;
            console.log(`Vital sign date: ${formattedDate}, filter: ${dateFilter}, match: ${match}`);
            return match;
          }
        } catch (error) {
          console.warn('Error processing date for filter:', error);
        }
        
        return false;
      });
      console.log('After date filter:', filtered.length);
    }
    
    return transformVitalSignsForDisplay(filtered);
  };



  // Get filtered data
  const filteredVitalSigns = getFilteredVitalSigns(selectedResident || undefined, selectedDate || undefined);

  // Debug logs
  console.log('=== VITAL SIGNS PAGE DEBUG ===');
  console.log('Component residents:', residents);
  console.log('Component user:', user);
  console.log('Selected resident:', selectedResident);

  console.log('Raw vital signs data:', vitalSigns);
  console.log('Filtered vital signs:', filteredVitalSigns);
  console.log('Residents length:', residents.length);
  console.log('Vital signs length:', vitalSigns.length);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          

        `
      }} />
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
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
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '1rem',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}>
                    <HeartIconSolid style={{ width: '2rem', height: '2rem', color: 'white' }} />
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Theo Dõi Các Chỉ Số Sức Khỏe
                    </h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Ghi nhận và theo dõi các thông số sinh lý quan trọng của người cao tuổi
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/staff/vital-signs/add')}
                disabled={user?.role === 'staff' && residents.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: user?.role === 'staff' && residents.length === 0 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: user?.role === 'staff' && residents.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: user?.role === 'staff' && residents.length === 0 
                    ? '0 4px 12px rgba(156, 163, 175, 0.3)'
                    : '0 4px 12px rgba(239, 68, 68, 0.3)',
                  opacity: user?.role === 'staff' && residents.length === 0 ? 0.6 : 1
                }}
                title={user?.role === 'staff' && residents.length === 0 
                  ? 'Bạn chưa được phân công quản lý cư dân nào' 
                  : 'Thêm chỉ số sức khỏe mới'
                }
              >
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Thêm chỉ số
              </button>
            </div>
          </div>

          {/* Filters */}
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
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1.5rem',
              alignItems: 'end'
            }}>
              {/* Resident Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                   Lọc theo người cao tuổi
                </label>
                <select
                  value={selectedResident || ''}
                  onChange={(e) => setSelectedResident(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  disabled={residents.length === 0}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <option value="">
                    {residents.length === 0 
                      ? (user?.role === 'staff' 
                          ? 'Chưa được phân công cư dân nào' 
                          : 'Chưa có cư dân nào trong hệ thống')
                      : 'Tất cả người cao tuổi được phân công'
                    }
                  </option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} - Phòng {roomNumbers[resident.id] || 'Chưa cập nhật'}
                    </option>
                  ))}
                </select>
                {residents.length === 0 && user?.role === 'staff' && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #f59e0b',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#92400e',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
                  }}>
                    ⚠️ Bạn chưa được phân công quản lý cư dân nào. Vui lòng liên hệ admin để được phân công.
                  </div>
                )}
                {residents.length === 0 && user?.role === 'admin' && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    border: '1px solid #3b82f6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#1e40af',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
                  }}>
                    ℹ️ Chưa có cư dân nào trong hệ thống.
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Lọc theo ngày
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    color: '#374151'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                />
                
              </div>



            </div>
          </div>

          {/* Vital Signs List */}
          <div style={{
            background: '#ffffff',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #f3f4f6',
              background: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#ef4444',
                    margin: 0,
                    letterSpacing: '-0.025em'
                  }}>
                    Danh sách chỉ số sức khỏe
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 400
                  }}>
                    Tổng số: {filteredVitalSigns.length} bản ghi
                  </p>
                </div>
                
              </div>
            </div>

            {filteredVitalSigns.length === 0 ? (
              <div style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: '#ffffff'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#9ca3af' }} />
                </div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  margin: '0 0 0.5rem 0',
                  color: '#374151'
                }}>
                  {residents.length === 0 && user?.role === 'staff' 
                    ? 'Bạn chưa được phân công quản lý cư dân nào'
                    : 'Chưa có chỉ số sức khỏe nào'
                  }
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  {residents.length === 0 && user?.role === 'staff'
                    ? 'Vui lòng liên hệ admin để được phân công quản lý cư dân'
                    : 'Thêm chỉ số sức khỏe đầu tiên để theo dõi sức khỏe'
                  }
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ 
                      background: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Người cao tuổi
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Ngày giờ
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#dc2626',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Huyết áp
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#059669',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Nhịp tim
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#ea580c',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Nhiệt độ
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#2563eb',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        SpO2
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#7c3aed',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Nhịp thở
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#059669',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Cân nặng
                      </th>
                      <th style={{ 
                        padding: '1rem 1.5rem', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#059669',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Ghi chú
                      </th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVitalSigns.map((vs, index) => (
                      <tr 
                        key={vs.id}
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: index % 2 === 0 ? 'white' : '#fafafa',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa';
                        }}
                      >
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              overflow: 'hidden'
                            }}>
                              {vs.residentAvatar ? (
                                <img
                                  src={userAPI.getAvatarUrl(vs.residentAvatar)}
                                  alt={ensureString(vs.residentName)}
                                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.textContent = ensureString(vs.residentName).charAt(0).toUpperCase();
                                    }
                                  }}
                                />
                              ) : (
                                ensureString(vs.residentName).charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: '#1f2937' }}>
                                {ensureString(vs.residentName)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                ID: {ensureString(vs.residentId)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#374151' }}>
                          <div>
                            {vs.date || 'Invalid Date'}
                          </div>
                          <div style={{ color: '#6b7280' }}>
                            {vs.time || ''}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          <span style={{ 
                            color: '#dc2626', 
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            background: '#fef2f2',
                            borderRadius: '0.375rem',
                            border: '1px solid #fecaca'
                          }}>
                            {vs.bloodPressure}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          <span style={{ 
                            color: '#059669', 
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            background: '#f0fdf4',
                            borderRadius: '0.375rem',
                            border: '1px solid #bbf7d0'
                          }}>
                            {vs.heartRate} bpm
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          <span style={{ 
                            color: '#ea580c', 
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            background: '#fff7ed',
                            borderRadius: '0.375rem',
                            border: '1px solid #fed7aa'
                          }}>
                            {vs.temperature}°C
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          <span style={{ 
                            color: '#2563eb', 
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            background: '#eff6ff',
                            borderRadius: '0.375rem',
                            border: '1px solid #bfdbfe'
                          }}>
                            {vs.oxygenSaturation}%
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          {vs.respiratoryRate ? (
                            <span style={{ 
                              color: '#7c3aed', 
                              fontWeight: 600,
                              padding: '0.25rem 0.5rem',
                              background: '#faf5ff',
                              borderRadius: '0.375rem',
                              border: '1px solid #e9d5ff'
                            }}>
                              {vs.respiratoryRate} lần/phút
                            </span>
                          ) : (
                            <span style={{ 
                              color: '#6b7280', 
                              fontStyle: 'italic',
                              fontSize: '0.75rem'
                            }}>
                              Chưa ghi nhận
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          {vs.weight ? (
                            <span style={{ 
                              color: '#059669', 
                              fontWeight: 600,
                              padding: '0.25rem 0.5rem',
                              background: '#f0fdf4',
                              borderRadius: '0.375rem',
                              border: '1px solid #bbf7d0'
                            }}>
                              {vs.weight} kg
                            </span>
                          ) : (
                            <span style={{ 
                              color: '#6b7280', 
                              fontStyle: 'italic',
                              fontSize: '0.75rem'
                            }}>
                              Chưa ghi nhận
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                          {vs.notes ? (
                            <span style={{ 
                              color: '#059669', 
                              fontWeight: 500,
                              padding: '0.25rem 0.5rem',
                              background: '#f0fdf4',
                              borderRadius: '0.375rem',
                              border: '1px solid #bbf7d0',
                              fontSize: '0.75rem'
                            }}>
                              {vs.notes}
                            </span>
                          ) : (
                            <span style={{ 
                              color: '#6b7280', 
                              fontStyle: 'italic',
                              fontSize: '0.75rem'
                            }}>
                              Không có ghi chú
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Center Button */}
      <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 2000 }}>
        <button
          onClick={() => setShowNotifications(v => !v)}
          style={{
            position: 'relative',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '9999px',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
        >
          <BellIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#ef4444',
              color: 'white',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              minWidth: '1.25rem',
              textAlign: 'center',
              lineHeight: 1
            }}>{notifications.length}</span>
          )}
        </button>
        {/* Notification List Popup */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '3.5rem',
            right: 0,
            width: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 2100,
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>Thông báo</span>
              <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
            </div>
            {notifications.length === 0 ? (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem 0' }}>Không có thông báo nào</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notifications.map(n => (
                  <li key={n.id} style={{
                    marginBottom: '0.75rem',
                    background: n.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: n.type === 'success' ? '1px solid #6ee7b7' : '1px solid #fca5a5',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{n.type === 'success' ? '✅' : '❌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: n.type === 'success' ? '#065f46' : '#991b1b' }}>{n.message}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{n.time}</div>
                    </div>
                    <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>


    </>
  );
} 