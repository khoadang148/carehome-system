"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAssignmentsAPI, staffAPI, residentAPI, carePlansAPI, roomsAPI } from '@/lib/api';

export default function NewStaffAssignmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    staff_id: '',
    resident_ids: [] as string[],
    end_date: '',
    notes: '',
    responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'] as string[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Check permissions
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Load data
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [staffData, residentsData, assignmentsData] = await Promise.all([
          staffAPI.getAll(),
          residentAPI.getAll(),
          staffAssignmentsAPI.getAllIncludingExpired(),
        ]);
        
        // Chỉ lấy những user có role staff
        const staffOnly = Array.isArray(staffData) ? staffData.filter((staff: any) => staff.role === 'staff') : [];
        console.log('All users:', staffData);
        console.log('Staff only:', staffOnly);
        setStaffList(staffOnly);
        setResidents(Array.isArray(residentsData) ? residentsData : []);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        
        // Debug: Log assignments data
        console.log('Loaded assignments:', assignmentsData);
        console.log('Assignments count:', Array.isArray(assignmentsData) ? assignmentsData.length : 0);
        
        // Lấy số phòng cho từng resident
        const residentsArray = Array.isArray(residentsData) ? residentsData : [];
        residentsArray.forEach(async (resident: any) => {
          try {
            // Đảm bảo resident._id là string
            const residentId = typeof resident._id === 'object' && (resident._id as any)?._id 
              ? (resident._id as any)._id 
              : resident._id;
            const assignments = await carePlansAPI.getByResidentId(residentId);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
            const roomId = assignment?.assigned_room_id;
            // Đảm bảo roomId là string, không phải object
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers(prev => ({ ...prev, [resident._id]: room?.room_number || 'Chưa cập nhật' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident._id]: 'Chưa cập nhật' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident._id]: 'Chưa cập nhật' }));
          }
        });
        
        setError('');
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        console.error('Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Handle create assignment
  const handleCreate = async () => {
    if (!formData.staff_id || formData.resident_ids.length === 0) {
      alert('Vui lòng chọn nhân viên và ít nhất một cư dân');
      return;
    }

    // Kiểm tra ngày kết thúc không được ở quá khứ
    if (formData.end_date && formData.end_date.trim() !== '') {
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time về 00:00:00
      
      if (endDate < today) {
        alert('Ngày kết thúc phân công không được ở quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.');
        return;
      }
    }

    // Validate staff_id and resident_ids are valid ObjectIds
    if (!formData.staff_id.match(/^[0-9a-fA-F]{24}$/)) {
      alert('ID nhân viên không hợp lệ');
      return;
    }

    for (const residentId of formData.resident_ids) {
      if (!residentId.match(/^[0-9a-fA-F]{24}$/)) {
        alert('ID cư dân không hợp lệ');
        return;
      }
    }

    // Kiểm tra xem có assignment active nào đã tồn tại không (chỉ chặn assignment active, cho phép expired)
    const existingActiveAssignments: string[] = [];
    for (const residentId of formData.resident_ids) {
      const existingAssignment = assignments.find(assignment => {
        const assignmentResidentId = assignment.resident_id._id || assignment.resident_id;
        const assignmentStaffId = assignment.staff_id._id || assignment.staff_id;
        return assignmentResidentId === residentId && assignmentStaffId === formData.staff_id;
      });
      
      // Chỉ chặn nếu assignment đang active
      if (existingAssignment && existingAssignment.status === 'active') {
        const resident = residents.find(r => r._id === residentId);
        existingActiveAssignments.push(resident?.full_name || residentId.toString());
      }
    }

    if (existingActiveAssignments.length > 0) {
      alert(`Các cư dân sau đã được phân công cho nhân viên này rồi: ${existingActiveAssignments.join(', ')}. Vui lòng bỏ chọn các cư dân này hoặc chọn nhân viên khác.`);
      return;
    }

    setSubmitting(true);
    try {
      // Tạo nhiều assignment cho từng resident
      const newAssignments = await Promise.all(
        formData.resident_ids.map(residentId => {
          const assignmentData: any = {
            staff_id: formData.staff_id,
            resident_id: residentId,
            responsibilities: formData.responsibilities || ['vital_signs', 'care_notes', 'activities', 'photos'],
          };
          
          // Chỉ thêm end_date nếu có giá trị
          if (formData.end_date && formData.end_date.trim() !== '') {
            // Ensure the date is in ISO format
            const date = new Date(formData.end_date);
            if (!isNaN(date.getTime())) {
              assignmentData.end_date = date.toISOString();
            }
          }
          
          // Chỉ thêm notes nếu có giá trị
          if (formData.notes && formData.notes.trim() !== '') {
            assignmentData.notes = formData.notes;
          }
          
          // Debug: Log the data being sent
          console.log('Creating staff assignment with data:', assignmentData);
          
          return staffAssignmentsAPI.create(assignmentData);
        })
      );
      
      // Hiển thị modal thành công
      setSuccessData({
        count: newAssignments.length,
        staff: selectedStaff,
        residents: selectedResidents,
        hasExpiredUpdates: formData.resident_ids.some(residentId => {
          const assignment = assignments.find(a => {
            const assignmentResidentId = a.resident_id._id || a.resident_id;
            const assignmentStaffId = a.staff_id._id || a.staff_id;
            return assignmentResidentId === residentId && assignmentStaffId === formData.staff_id;
          });
          return assignment && assignment.status === 'expired';
        }),
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error creating staff assignment:', err);
      let errorMessage = 'Không thể tạo phân công. Vui lòng thử lại.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check for duplicate key error and provide a more helpful message
      if (err.message && err.message.includes('E11000 duplicate key error')) {
        errorMessage = 'Cư dân này đã được phân công cho nhân viên này rồi. Nếu assignment đã hết hạn, bạn có thể phân công lại. Vui lòng kiểm tra lại danh sách phân công.';
        
        // Refresh assignments data to show current state
        try {
          const refreshedAssignments = await staffAssignmentsAPI.getAllIncludingExpired();
          setAssignments(Array.isArray(refreshedAssignments) ? refreshedAssignments : []);
          console.log('Refreshed assignments after duplicate error:', refreshedAssignments);
          
          // Clear selected residents to prevent further errors
          setFormData(prev => ({ ...prev, resident_ids: [] }));
        } catch (refreshError) {
          console.error('Error refreshing assignments:', refreshError);
        }
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/admin/staff-assignments');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      staff_id: '',
      resident_ids: [],
      end_date: '',
      notes: '',
      responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
  };

  // Get available residents (not assigned to any staff OR only expired assignments)
  const getAvailableResidents = () => {
    return residents.filter(resident => {
      // Tìm tất cả assignments cho resident này với staff được chọn
      const selectedStaffId = formData.staff_id;
      if (!selectedStaffId) {
        // Nếu chưa chọn staff, kiểm tra tất cả assignment của resident
        const residentAssignments = assignments.filter(assignment => {
          const assignmentResidentId = assignment.resident_id._id || assignment.resident_id;
          const residentId = resident._id;
          return assignmentResidentId === residentId;
        });
        
        // Debug: Log assignment details
        console.log(`Resident ${resident.full_name} (${resident._id}) assignments:`, residentAssignments);
        
        // Nếu không có assignment nào -> có thể phân công
        if (residentAssignments.length === 0) {
          console.log(`Resident ${resident.full_name} - No assignments, can be assigned`);
          return true;
        }
        
        // Nếu có assignment active -> không thể phân công
        const hasActiveAssignment = residentAssignments.some(assignment => assignment.status === 'active');
        if (hasActiveAssignment) {
          console.log(`Resident ${resident.full_name} - Has active assignment, cannot be assigned`);
          return false;
        }
        
        // Nếu chỉ có assignment expired -> có thể phân công lại
        const hasOnlyExpiredAssignments = residentAssignments.every(assignment => assignment.status === 'expired');
        if (hasOnlyExpiredAssignments) {
          console.log(`Resident ${resident.full_name} - Has only expired assignments, can be reassigned`);
          return true;
        }
        
        // Trường hợp khác -> không thể phân công
        console.log(`Resident ${resident.full_name} - Other case, cannot be assigned`);
        return false;
      } else {
        // Nếu đã chọn staff, kiểm tra assignment cụ thể với staff này
        const specificAssignment = assignments.find(assignment => {
          const assignmentResidentId = assignment.resident_id._id || assignment.resident_id;
          const assignmentStaffId = assignment.staff_id._id || assignment.staff_id;
          const residentId = resident._id;
          return assignmentResidentId === residentId && assignmentStaffId === selectedStaffId;
        });
        
        // Debug: Log specific assignment
        console.log(`Resident ${resident.full_name} with staff ${selectedStaffId}:`, specificAssignment);
        
        // Nếu không có assignment với staff này -> có thể phân công
        if (!specificAssignment) {
          console.log(`Resident ${resident.full_name} - No assignment with selected staff, can be assigned`);
          return true;
        }
        
        // Nếu có assignment active với staff này -> không thể phân công
        if (specificAssignment.status === 'active') {
          console.log(`Resident ${resident.full_name} - Has active assignment with selected staff, cannot be assigned`);
          return false;
        }
        
        // Nếu có assignment expired với staff này -> có thể phân công lại
        if (specificAssignment.status === 'expired') {
          console.log(`Resident ${resident.full_name} - Has expired assignment with selected staff, can be reassigned`);
          return true;
        }
        
        // Nếu có assignment với status khác -> có thể phân công lại
        console.log(`Resident ${resident.full_name} - Has assignment with status ${specificAssignment.status}, can be reassigned`);
        return true;
        
        // Trường hợp khác -> không thể phân công
        console.log(`Resident ${resident.full_name} - Other case, cannot be assigned`);
        return false;
      }
    });
  };

  // Helper function to check if resident has expired assignments
  const hasExpiredAssignments = (residentId: string) => {
    const residentAssignments = assignments.filter(assignment => {
      const assignmentResidentId = assignment.resident_id._id || assignment.resident_id;
      return assignmentResidentId === residentId;
    });
    
    return residentAssignments.length > 0 && residentAssignments.every(assignment => assignment.status === 'expired');
  };

  // Helper function to get assignment status for a resident with selected staff
  const getAssignmentStatus = (residentId: string) => {
    if (!formData.staff_id) return null;
    
    const assignment = assignments.find(assignment => {
      const assignmentResidentId = assignment.resident_id._id || assignment.resident_id;
      const assignmentStaffId = assignment.staff_id._id || assignment.staff_id;
      return assignmentResidentId === residentId && assignmentStaffId === formData.staff_id;
    });
    
    return assignment ? assignment.status : null;
  };

  // Get filtered residents based on search term
  const getFilteredResidents = () => {
    const availableResidents = getAvailableResidents();
    if (!searchTerm) return availableResidents;
    
    return availableResidents.filter(resident =>
      resident.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (roomNumbers[resident._id] && roomNumbers[resident._id].toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Get selected staff info
  const selectedStaff = staffList.find(staff => staff._id === formData.staff_id);

  // Get selected residents info
  const selectedResidents = residents.filter(resident => 
    formData.resident_ids.includes(resident._id)
  );

  // Utility functions for date formatting
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const parseDateFromDisplay = (displayDate: string) => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString().split('T')[0];
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!formData.staff_id || formData.resident_ids.length === 0) return false;
    
    // Check if end date is in the past
    if (formData.end_date && formData.end_date.trim() !== '') {
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link
                href="/admin/staff-assignments"
                style={{
                  padding: '0.5rem',
                  color: '#6b7280',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ArrowLeftIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </Link>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <UserPlusIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Tạo phân công mới
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Phân công nhân viên phụ trách cư dân 
                  ({getAvailableResidents().length} cư dân khả dụng, 
                  {getAvailableResidents().filter(r => hasExpiredAssignments(r._id)).length} có thể phân công lại)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={resetForm}
                style={{
                  padding: '0.75rem 1.5rem',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'white'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Làm mới
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !isFormValid()}
                style={{
                  padding: '0.75rem 2rem',
                  background: submitting || !isFormValid() 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: submitting || !isFormValid() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: submitting || !isFormValid() 
                    ? 'none' 
                    : '0 4px 12px rgba(59, 130, 246, 0.3)',
                  opacity: submitting || !isFormValid() ? 0.6 : 1
                }}
                onMouseOver={e => {
                  if (!submitting && isFormValid()) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseOut={e => {
                  if (!submitting && isFormValid()) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <UserPlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Tạo phân công
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlusIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  Thông tin phân công
                </h2>
                
                <div className="space-y-8">
                  {/* Staff Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nhân viên phụ trách <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.staff_id}
                      onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200 text-lg"
                    >
                      <option value="">Chọn nhân viên</option>
                      {staffList.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.full_name} - {staff.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Residents Selection */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Cư dân được phân công <span className="text-red-500">*</span>
                      <span className="text-sm font-normal text-gray-500 ml-2">(Có thể chọn nhiều)</span>
                    </label>
                    
                    {/* Search and Filter */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm kiếm cư dân theo tên hoặc số phòng..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-all duration-200 text-lg"
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                      {searchTerm && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Tìm thấy {getFilteredResidents().length} cư dân phù hợp
                        </p>
                      )}
                    </div>

                    {/* Residents Grid */}
                    <div className="border-2 border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto bg-white shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getFilteredResidents().map((resident) => {
                          const isSelected = formData.resident_ids.includes(resident._id);
                          return (
                            <div
                              key={resident._id}
                              onClick={() => {
                                // Không cho phép chọn resident đã có assignment active với staff được chọn
                                if (formData.staff_id && getAssignmentStatus(resident._id) === 'active') {
                                  alert(`Cư dân ${resident.full_name} đã được phân công cho nhân viên này rồi. Vui lòng chọn cư dân khác hoặc nhân viên khác.`);
                                  return;
                                }
                                
                                // Cho phép chọn resident có assignment expired (có thể phân công lại)
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    resident_ids: formData.resident_ids.filter(id => id !== resident._id)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    resident_ids: [...formData.resident_ids, resident._id]
                                  });
                                }
                              }}
                              className={`
                                p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]
                                ${isSelected 
                                  ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg ring-4 ring-green-100' 
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-200
                                    ${isSelected 
                                      ? 'border-green-500 bg-green-500 shadow-md' 
                                      : 'border-gray-300 bg-white'
                                    }
                                  `}>
                                    {isSelected && (
                                      <CheckIcon className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className={`font-semibold text-lg ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                      {resident.full_name}
                                    </p>
                                    <p className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                                      Phòng: {roomNumbers[resident._id] || 'Chưa cập nhật'}
                                    </p>
                                    {formData.staff_id && getAssignmentStatus(resident._id) === 'active' && (
                                      <p className="text-xs text-red-600 font-medium mt-1">
                                        ⚠️ Đã được phân công cho nhân viên này
                                      </p>
                                    )}
                                    {formData.staff_id && getAssignmentStatus(resident._id) === 'expired' && (
                                      <p className="text-xs text-orange-600 font-medium mt-1">
                                        🔄 Có thể phân công lại (đã hết hạn)
                                      </p>
                                    )}
                                    {!formData.staff_id && hasExpiredAssignments(resident._id) && (
                                      <p className="text-xs text-orange-600 font-medium mt-1">
                                        🔄 Có thể phân công lại
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className={`
                                  w-3 h-3 rounded-full transition-all duration-200
                                  ${isSelected ? 'bg-green-500 shadow-md' : 'bg-gray-300'}
                                `} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {getFilteredResidents().length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          {searchTerm ? (
                            <>
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <p className="text-lg font-medium mb-2">Không tìm thấy cư dân nào phù hợp</p>
                              <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserPlusIcon className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-lg font-medium mb-2">Không có cư dân nào khả dụng</p>
                              <p className="text-sm">Tất cả cư dân đã được phân công hoặc chưa có assignment expired</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Count */}
                    {formData.resident_ids.length > 0 && (
                      <div className="mt-4 flex items-center justify-between bg-white rounded-xl p-4 border-2 border-green-200">
                        <p className="text-sm text-gray-600 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-2 text-green-500" />
                          Đã chọn: <span className="font-semibold text-green-600 ml-1">{formData.resident_ids.length}</span> cư dân
                        </p>
                        <button
                          onClick={() => setFormData({ ...formData, resident_ids: [] })}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 date-picker-container">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ngày kết thúc phân công
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatDateForDisplay(formData.end_date)}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only numbers and slashes
                          if (value === '' || /^\d{0,2}\/?\d{0,2}\/?\d{0,4}$/.test(value)) {
                            // Auto-format as user types
                            let formatted = value.replace(/\D/g, '');
                            if (formatted.length >= 2) {
                              formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                            }
                            if (formatted.length >= 5) {
                              formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
                            }
                            formatted = formatted.slice(0, 10);
                            
                            // Only update if it's a valid date format
                            if (formatted.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
                              const parsedDate = parseDateFromDisplay(formatted);
                              if (parsedDate) {
                                setFormData({ ...formData, end_date: parsedDate });
                              }
                            }
                          }
                        }}
                        placeholder="dd/mm/yyyy"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all duration-200 text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Date Picker Dropdown */}
                    {showDatePicker && (
                      <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => {
                            setFormData({ ...formData, end_date: e.target.value });
                            setShowDatePicker(false);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Để trống nếu không có ngày kết thúc cụ thể. Ngày kết thúc phải từ hôm nay trở đi.
                    </p>
                    {formData.end_date && new Date(formData.end_date) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                      <p className="text-sm text-red-600 mt-2 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                        Ngày kết thúc không được ở quá khứ!
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ghi chú phân công
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 focus:outline-none transition-all duration-200 text-lg resize-none"
                      placeholder="Ghi chú về phân công, yêu cầu đặc biệt, v.v..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  Xem trước phân công
                </h2>
                
                <div className="space-y-6">
                  {/* Selected Staff */}
                  {selectedStaff && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Nhân viên được chọn
                      </h3>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {selectedStaff.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900 text-lg">{selectedStaff.full_name}</p>
                          <p className="text-sm text-blue-700">{selectedStaff.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Residents */}
                  {selectedResidents.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-green-900 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-2" />
                          Cư dân được chọn ({selectedResidents.length})
                        </h3>
                        <button
                          onClick={() => setFormData({ ...formData, resident_ids: [] })}
                          className="text-xs text-green-600 hover:text-green-800 transition-colors font-medium"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedResidents.map((resident) => (
                          <div 
                            key={resident._id} 
                            className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200 shadow-sm"
                          >
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-sm"></div>
                              <div>
                                <p className="text-sm font-semibold text-green-900">{resident.full_name}</p>
                                <p className="text-xs text-green-700">Phòng {roomNumbers[resident._id] || 'Chưa cập nhật'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setFormData({
                                ...formData,
                                resident_ids: formData.resident_ids.filter(id => id !== resident._id)
                              })}
                              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors"
                              title="Bỏ chọn cư dân này"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Trách nhiệm được giao
                    </h3>
                    <div className="space-y-3">
                      {formData.responsibilities.map((responsibility) => (
                        <div key={responsibility} className="flex items-center">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <CheckIcon className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {responsibility === 'vital_signs' && 'Đo đạc chỉ số sức khỏe'}
                            {responsibility === 'care_notes' && ' Ghi chú chăm sóc'}
                            {responsibility === 'activities' && ' Quản lý hoạt động'}
                            {responsibility === 'photos' && 'Đăng ảnh hoạt động'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Tóm tắt
                    </h3>
                    <div className="text-sm text-yellow-800 space-y-2">
                      <p className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Sẽ tạo <span className="font-bold text-yellow-900">{formData.resident_ids.length}</span> phân công
                      </p>
                      <p className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Nhân viên: <span className="font-semibold text-yellow-900">{selectedStaff?.full_name || 'Chưa chọn'}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Trạng thái: <span className="font-semibold text-green-600">Hoạt động</span>
                      </p>
                      {formData.end_date && (
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          Kết thúc: <span className="font-semibold text-yellow-900">{new Date(formData.end_date).toLocaleDateString('vi-VN')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </div>
              
              {/* Success Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {successData.hasExpiredUpdates ? 'Cập nhật phân công thành công!' : 'Tạo phân công thành công!'}
              </h2>
              
              {/* Success Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Số lượng phân công:</span>
                    <span className="font-bold text-green-600 text-lg">{successData.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Nhân viên:</span>
                    <span className="font-semibold text-gray-900">{successData.staff?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cư dân:</span>
                    <span className="font-semibold text-gray-900">{successData.residents.length} người</span>
                  </div>
                </div>
              </div>
              
              {/* Success Message */}
              <p className="text-gray-600 mb-8">
                {successData.hasExpiredUpdates 
                  ? 'Phân công đã được cập nhật thành công từ trạng thái hết hạn và nhân viên có thể bắt đầu thực hiện trách nhiệm của mình.'
                  : 'Phân công đã được tạo thành công và nhân viên có thể bắt đầu thực hiện trách nhiệm của mình.'
                }
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSuccessClose}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Xem danh sách phân công
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
} 