'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { carePlanAssignmentsAPI } from '@/lib/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function EditCarePlanAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [startDateDisplay, setStartDateDisplay] = useState<string>('');
  const [endDateDisplay, setEndDateDisplay] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedCarePlans, setSelectedCarePlans] = useState<string[]>([]);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const data = await carePlanAssignmentsAPI.getById(assignmentId);
        setAssignment(data);
        
        // Lấy chi tiết các gói dịch vụ
        if (data.care_plan_ids && Array.isArray(data.care_plan_ids)) {
          setCarePlanDetails(data.care_plan_ids);
        }
        
        // Kiểm tra nếu assignment đã hết hạn thì tự động cập nhật trạng thái trên backend
        const isExpired = isAssignmentExpired(data.end_date);
        
        console.log('Assignment data:', data);
        console.log('End date:', data.end_date);
        console.log('Is expired:', isExpired);
        console.log('Original status:', data.status);
        
        if (isExpired && data.status !== 'paused') {
          // Tự động cập nhật trạng thái thành 'paused' trên backend
          try {
            console.log('Auto-updating expired assignment status to paused...');
            await carePlanAssignmentsAPI.updateStatus(assignmentId, 'paused');
            console.log('Successfully updated assignment status to paused');
            // Cập nhật lại data sau khi đã update
            const updatedData = await carePlanAssignmentsAPI.getById(assignmentId);
            setAssignment(updatedData);
            // Sử dụng updatedData thay vì data
            setStatus(updatedData.status || '');
            if (updatedData.care_plan_ids && Array.isArray(updatedData.care_plan_ids)) {
              setCarePlanDetails(updatedData.care_plan_ids);
              const allPlanIds = updatedData.care_plan_ids?.map((plan: any) => plan._id || plan.id) || [];
              setSelectedCarePlans(allPlanIds);
            }
            return; // Thoát khỏi function vì đã xử lý xong
          } catch (error) {
            console.error('Failed to auto-update assignment status:', error);
          }
        }
        
        // Lấy chi tiết các gói dịch vụ
        if (data.care_plan_ids && Array.isArray(data.care_plan_ids)) {
          setCarePlanDetails(data.care_plan_ids);
        }
        
        // Set trạng thái hiện tại
        setStatus(data.status || '');
        
        // Nếu đã hết hạn, tự động chọn tất cả gói để gia hạn
        if (isExpired) {
          const allPlanIds = data.care_plan_ids?.map((plan: any) => plan._id || plan.id) || [];
          setSelectedCarePlans(allPlanIds);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải thông tin phân công');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  // Xử lý khi thay đổi trạng thái
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    
    // Nếu chọn "đang sử dụng" và assignment đã hết hạn, hiển thị date picker để gia hạn
    const isExpired = isAssignmentExpired(assignment?.end_date);
    if (newStatus === 'active' && isExpired) {
      setShowDatePicker(true);
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setStartDateDisplay(formatDate(today));
    } else {
      setShowDatePicker(false);
      setEndDate('');
      setStartDate('');
      setStartDateDisplay('');
      setEndDateDisplay('');
    }
  };

  // Xử lý khi chọn/bỏ chọn gói dịch vụ
  const handleCarePlanSelection = (planId: string, checked: boolean) => {
    if (checked) {
      setSelectedCarePlans(prev => [...prev, planId]);
    } else {
      setSelectedCarePlans(prev => prev.filter(id => id !== planId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!status) {
      setError('Vui lòng chọn trạng thái');
      return;
    }

    // Kiểm tra nếu chọn "đang sử dụng" và assignment đã hết hạn thì phải có cả ngày bắt đầu và kết thúc
    const isExpired = isAssignmentExpired(assignment?.end_date);
    if (status === 'active' && isExpired) {
      if (!startDate) {
        setError('Vui lòng chọn ngày bắt đầu mới');
        return;
      }
      if (!endDate) {
      setError('Vui lòng chọn ngày kết thúc mới');
      return;
      }
      
      // Validate date format
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime())) {
        setError('Ngày bắt đầu không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
        return;
      }
      if (isNaN(endDateObj.getTime())) {
        setError('Ngày kết thúc không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
        return;
      }
      
      // Kiểm tra ngày bắt đầu phải trước ngày kết thúc
      if (startDateObj >= endDateObj) {
        setError(`Ngày bắt đầu (${formatDate(startDate)}) phải trước ngày kết thúc (${formatDate(endDate)})`);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      
      console.log('Updating assignment with data:', {
        assignmentId,
        currentStatus: assignment?.status,
        newStatus: status,
        endDate,
        startDate,
        selectedCarePlans
      });
      
      // Nếu đang gia hạn dịch vụ (từ paused sang active với ngày kết thúc mới)
      const isExpired = isAssignmentExpired(assignment?.end_date);
      if (status === 'active' && isExpired && endDate) {
        // Gia hạn assignment đã hết hạn - không gửi selectedCarePlans để cập nhật assignment hiện tại
        console.log('Renewing expired assignment...');
        await carePlanAssignmentsAPI.renew(assignmentId, endDate, startDate);
      } else {
        // Cập nhật trạng thái thông thường
        const updateData: any = { status };
        
        // Nếu có ngày kết thúc mới, thêm vào dữ liệu cập nhật
        if (endDate) {
          updateData.end_date = endDate;
        }
        
        console.log('Updating assignment with data:', updateData);
        await carePlanAssignmentsAPI.update(assignmentId, updateData);
      }
      
      console.log('Update successful, redirecting...');
      router.push(`/services/assignments/${assignmentId}`);
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/services/assignments/${assignmentId}`);
  };

  const getStatusText = (status: string, endDate?: string) => {
    // Kiểm tra nếu có ngày kết thúc và đã hết hạn
    if (endDate && new Date(endDate) < new Date()) {
      return 'Đã hết hạn';
    }
    
    const statusMap: { [key: string]: string } = {
      'consulting': 'Đang tư vấn',
      'packages_selected': 'Đã chọn gói',
      'room_assigned': 'Đã phân phòng',
      'payment_completed': 'Đã thanh toán',
      'active': 'Đang hoạt động',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy',
      'paused': 'Tạm dừng',
      'expired': 'Đã hết hạn'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string, endDate?: string) => {
    // Kiểm tra nếu có ngày kết thúc và đã hết hạn
    if (endDate && new Date(endDate) < new Date()) {
      return '#ef4444'; // Màu đỏ cho trạng thái hết hạn
    }
    
    const colorMap: { [key: string]: string } = {
      'consulting': '#f59e0b',
      'packages_selected': '#3b82f6',
      'room_assigned': '#8b5cf6',
      'payment_completed': '#10b981',
      'active': '#059669',
      'completed': '#6b7280',
      'cancelled': '#ef4444',
      'paused': '#f97316',
      'expired': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function để kiểm tra assignment có hết hạn không
  const isAssignmentExpired = (endDate?: string): boolean => {
    if (!endDate) return false;
    const endDateObj = new Date(endDate);
    return !isNaN(endDateObj.getTime()) && endDateObj < new Date();
  };

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
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Đang tải thông tin phân công...
          </p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <ExclamationCircleIcon style={{
            width: '3rem',
            height: '3rem',
            color: '#f59e0b',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            Không tìm thấy phân công
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            {error}
          </p>
          <Link
            href="/services/assignments"
          style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
          }}
        >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
      {/* Header */}
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
            marginBottom: '1.5rem'
          }}>
            <Link
              href={`/services/assignments/${assignmentId}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.75rem',
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </Link>
            
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
                }}>
                  <PencilIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                
                <div>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1e293b'
                  }}>
            Chỉnh sửa trạng thái phân công
          </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Cập nhật trạng thái và thông tin dịch vụ
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>

        {/* Current Status Information */}
      {assignment && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid #7dd3fc'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheckIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: 0
                }}>
                  Trạng thái hiện tại
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0'
                }}>
                  Thông tin trạng thái dịch vụ hiện tại
                </p>
              </div>
            </div>

                         <div style={{
               background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '0.75rem',
               padding: '1.5rem',
          border: '1px solid #bae6fd'
        }}>
               <div style={{
                 display: 'grid',
                 gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                 gap: '1.5rem'
               }}>
                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem',
                     marginBottom: '0.5rem'
                   }}>
                     <CheckCircleIcon style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
              <span style={{ 
                       fontSize: '0.75rem',
                       fontWeight: 600,
                       color: '#15803d'
                     }}>
                       Trạng thái
                     </span>
                   </div>
                   <p style={{
                     fontSize: '1.125rem',
                     fontWeight: 700,
                color: getStatusColor(assignment.status, assignment.end_date),
                     margin: 0
              }}>
                {getStatusText(assignment.status, assignment.end_date)}
                   </p>
                 </div>
                 
                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem',
                     marginBottom: '0.5rem'
                   }}>
                     <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
                     <span style={{
                       fontSize: '0.75rem',
                       fontWeight: 600,
                       color: '#15803d'
                     }}>
                       Ngày bắt đầu
              </span>
            </div>
                   <p style={{
                     fontSize: '1.125rem',
                     fontWeight: 700,
                     color: '#1e293b',
                     margin: 0
                   }}>
                     {assignment.start_date ? formatDate(assignment.start_date) : 'N/A'}
                   </p>
                 </div>
                 
                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem',
                     marginBottom: '0.5rem'
                   }}>
                     <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#7c3aed' }} />
              <span style={{ 
                       fontSize: '0.75rem',
                       fontWeight: 600,
                       color: '#6d28d9'
              }}>
                       Ngày kết thúc
              </span>
                   </div>
                   <p style={{
                     fontSize: '1.125rem',
                     fontWeight: 700,
                     color: isAssignmentExpired(assignment?.end_date) ? '#ef4444' : '#059669',
                     margin: 0
                   }}>
                     {assignment.end_date ? formatDate(assignment.end_date) : 'Không có thời hạn'}
                     {isAssignmentExpired(assignment?.end_date) && ' (Đã hết hạn)'}
                   </p>
                 </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: 0
              }}>
          Cập nhật trạng thái
        </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0'
              }}>
                Thay đổi trạng thái và cấu hình dịch vụ
              </p>
            </div>
          </div>

        {error && (
          <div style={{
              padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
              borderRadius: '0.75rem',
            color: '#dc2626',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ExclamationCircleIcon style={{ width: '1rem', height: '1rem' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
                fontWeight: 600,
              color: '#374151',
                marginBottom: '0.75rem'
            }}>
              Trạng thái mới *
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                width: '100%',
                  padding: '1rem',
                border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <option value="">Chọn trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="cancelled">Đã hủy</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </div>

          {/* Danh sách gói dịch vụ để chọn gia hạn */}
          {status === 'paused' && carePlanDetails.length > 0 && isAssignmentExpired(assignment?.end_date) && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid #fbbf24'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircleIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                </div>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#92400e',
                    margin: 0
                  }}>
                    Chọn gói dịch vụ để gia hạn
                  </h4>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#a16207',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Chọn các gói dịch vụ cần gia hạn (tất cả gói được chọn sẵn nếu assignment đã hết hạn)
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gap: '0.75rem'
              }}>
                {carePlanDetails.map((plan: any, index: number) => {
                  const planId = plan._id || plan.id;
                  const isExpired = assignment?.end_date && new Date(assignment.end_date) < new Date();
                  const isSelected = selectedCarePlans.includes(planId);
                  
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '0.5rem',
                      border: `1px solid ${isSelected ? '#22c55e' : '#fbbf24'}`,
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        id={`plan-${planId}`}
                        checked={isSelected}
                        onChange={(e) => handleCarePlanSelection(planId, e.target.checked)}
                        style={{
                          width: '1rem',
                          height: '1rem',
                          accentColor: '#22c55e'
                        }}
                      />
                      <label
                        htmlFor={`plan-${planId}`}
                        style={{
                          flex: 1,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: 500
                        }}
                      >
                        <div style={{ marginBottom: '0.25rem' }}>
                          {plan.plan_name || plan.name || plan.description || 'Gói dịch vụ'}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isExpired ? '#ef4444' : '#059669',
                          fontWeight: 600
                        }}>
                          {assignment?.end_date ? (
                            <>
                              Kết thúc: {formatDate(assignment.end_date)}
                              {isExpired && ' (Đã hết hạn)'}
                            </>
                          ) : (
                            'Không có thời hạn'
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date picker cho gia hạn */}
            {(showDatePicker || (status === 'active' && isAssignmentExpired(assignment?.end_date))) && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                                     <div>
                     <h4 style={{
                       fontSize: '1rem',
                       fontWeight: 600,
                       color: '#15803d',
                       margin: 0
                     }}>
                       Gia hạn dịch vụ
                     </h4>
                     <p style={{
                       fontSize: '0.75rem',
                       color: '#16a34a',
                       margin: '0.25rem 0 0 0'
                     }}>
                       Cập nhật chu kỳ dịch vụ hiện tại với ngày bắt đầu và kết thúc mới
                     </p>
                   </div>
                </div>

                                 <div style={{
                   display: 'grid',
                   gridTemplateColumns: '1fr 1fr',
                   gap: '1rem'
                 }}>
                   <div>
                     <label style={{
                       display: 'block',
                       fontSize: '0.875rem',
                       fontWeight: 600,
                       color: '#374151',
                       marginBottom: '0.75rem'
                     }}>
                       Ngày bắt đầu mới *
                     </label>
                     <div style={{ position: 'relative', width: '100%' }}>
                       <input
                         type="text"
                         value={startDateDisplay}
                         onChange={(e) => {
                           const value = e.target.value;
                           setStartDateDisplay(value);
                           
                           // Chỉ cho phép nhập số và dấu /
                           const cleanValue = value.replace(/[^0-9/]/g, '');
                           
                           // Tự động thêm dấu / sau ngày và tháng
                           let formattedValue = cleanValue;
                           if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                             formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                           }
                           if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                             formattedValue = cleanValue.slice(0, 5) + '/' + cleanValue.slice(5);
                           }
                           
                           // Cập nhật display value
                           if (formattedValue.length <= 10) {
                             setStartDateDisplay(formattedValue);
                             
                             // Chuyển đổi từ dd/mm/yyyy sang yyyy-mm-dd cho state
                             if (formattedValue.length === 10) {
                               const parts = formattedValue.split('/');
                               if (parts.length === 3) {
                                 const [day, month, year] = parts;
                                 const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                 setStartDate(isoDate);
                               }
                             }
                           }
                         }}
                         placeholder="dd/mm/yyyy"
                         maxLength={10}
                         style={{
                           width: '100%',
                           padding: '1rem',
                           paddingRight: '3rem',
                           border: '1px solid #bbf7d0',
                           borderRadius: '0.75rem',
                           fontSize: '0.875rem',
                           backgroundColor: 'white',
                           color: '#111827',
                           transition: 'all 0.2s ease',
                           boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                         }}
                       />
                       <button
                         type="button"
                         onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                         style={{
                           position: 'absolute',
                           right: '0.75rem',
                           top: '50%',
                           transform: 'translateY(-50%)',
                           background: 'none',
                           border: 'none',
                           cursor: 'pointer',
                           padding: '0.5rem',
                           borderRadius: '0.5rem',
                           transition: 'all 0.2s ease',
                           color: '#16a34a'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.backgroundColor = '#f0fdf4';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.backgroundColor = 'transparent';
                         }}
                       >
                         <CalendarIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                       </button>
                       {showStartDatePicker && (
                         <div style={{
                           position: 'absolute',
                           top: '100%',
                           left: 0,
                           zIndex: 1000,
                           marginTop: '0.25rem'
                         }}>
                           <DatePicker
                             selected={startDate ? new Date(startDate) : null}
                             onChange={(date) => {
                               if (date) {
                                 const isoDate = date.toISOString().split('T')[0];
                                 setStartDate(isoDate);
                                 setStartDateDisplay(formatDate(isoDate));
                               }
                               setShowStartDatePicker(false);
                             }}
                             dateFormat="dd/MM/yyyy"
                             placeholderText="dd/mm/yyyy"
                             minDate={new Date()}
                             inline
                             onClickOutside={() => setShowStartDatePicker(false)}
                           />
                         </div>
                       )}
                     </div>
                     
                   </div>
                   
                   <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                       fontWeight: 600,
                color: '#374151',
                       marginBottom: '0.75rem'
              }}>
                Ngày kết thúc mới *
              </label>
                     <div style={{ position: 'relative', width: '100%' }}>
              <input
                         type="text"
                         value={endDateDisplay}
                         onChange={(e) => {
                           const value = e.target.value;
                           setEndDateDisplay(value);
                           
                           // Chỉ cho phép nhập số và dấu /
                           const cleanValue = value.replace(/[^0-9/]/g, '');
                           
                           // Tự động thêm dấu / sau ngày và tháng
                           let formattedValue = cleanValue;
                           if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                             formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                           }
                           if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                             formattedValue = cleanValue.slice(0, 5) + '/' + cleanValue.slice(5);
                           }
                           
                           // Cập nhật display value
                           if (formattedValue.length <= 10) {
                             setEndDateDisplay(formattedValue);
                             
                             // Chuyển đổi từ dd/mm/yyyy sang yyyy-mm-dd cho state
                             if (formattedValue.length === 10) {
                               const parts = formattedValue.split('/');
                               if (parts.length === 3) {
                                 const [day, month, year] = parts;
                                 const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                 setEndDate(isoDate);
                               }
                             }
                           }
                         }}
                         placeholder="dd/mm/yyyy"
                         maxLength={10}
                style={{
                  width: '100%',
                           padding: '1rem',
                           paddingRight: '3rem',
                           border: '1px solid #bbf7d0',
                           borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                           color: '#111827',
                           transition: 'all 0.2s ease',
                           boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                         }}
                       />
                       <button
                         type="button"
                         onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                         style={{
                           position: 'absolute',
                           right: '0.75rem',
                           top: '50%',
                           transform: 'translateY(-50%)',
                           background: 'none',
                           border: 'none',
                           cursor: 'pointer',
                           padding: '0.5rem',
                           borderRadius: '0.5rem',
                           transition: 'all 0.2s ease',
                           color: '#16a34a'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.backgroundColor = '#f0fdf4';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.backgroundColor = 'transparent';
                         }}
                       >
                         <CalendarIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                       </button>
                       {showEndDatePicker && (
                         <div style={{
                           position: 'absolute',
                           top: '100%',
                           left: 0,
                           zIndex: 1000,
                           marginTop: '0.25rem'
                         }}>
                           <DatePicker
                             selected={endDate ? new Date(endDate) : null}
                             onChange={(date) => {
                               if (date) {
                                 const isoDate = date.toISOString().split('T')[0];
                                 setEndDate(isoDate);
                                 setEndDateDisplay(formatDate(isoDate));
                               }
                               setShowEndDatePicker(false);
                             }}
                             dateFormat="dd/MM/yyyy"
                             placeholderText="dd/mm/yyyy"
                             minDate={startDate ? new Date(startDate) : new Date()}
                             inline
                             onClickOutside={() => setShowEndDatePicker(false)}
                           />
            </div>
          )}
                     </div>

                   </div>
                 </div>

            <div style={{
                   marginTop: '1rem',
              padding: '0.75rem',
                   backgroundColor: 'rgba(34, 197, 94, 0.1)',
                   border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '0.5rem',
                   fontSize: '0.75rem',
                   color: '#15803d'
            }}>
                   <strong>Thông tin gia hạn:</strong> Tất cả gói dịch vụ hiện tại sẽ được gia hạn từ {startDate ? formatDate(startDate) : 'ngày bạn chọn'} đến {endDate ? formatDate(endDate) : 'ngày kết thúc mới'}.
                 </div>
            </div>
          )}

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e2e8f0'
            }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                  padding: '0.875rem 1.75rem',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Hủy
            </button>
            <button
              type="submit"
                disabled={saving || !status || (status === 'active' && isAssignmentExpired(assignment?.end_date) && (!startDate || !endDate))}
              style={{
                  padding: '0.875rem 1.75rem',
                  background: saving || !status || (status === 'active' && (() => {
                    const endDate = assignment?.end_date;
                    const endDateObj = endDate ? new Date(endDate) : null;
                    return endDateObj && endDateObj < new Date();
                  })() && (!startDate || !endDate)) 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                  borderRadius: '0.75rem',
                  cursor: saving || !status || (status === 'active' && (() => {
                    const endDate = assignment?.end_date;
                    const endDateObj = endDate ? new Date(endDate) : null;
                    return endDateObj && endDateObj < new Date();
                  })() && (!startDate || !endDate)) ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                  fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Đang lưu...
                </>
              ) : (
                <>
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 